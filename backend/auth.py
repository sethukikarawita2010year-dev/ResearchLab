"""ResearchLab authentication.

Self-contained auth module: a SQLite + SQLAlchemy user store, Argon2id
password hashing, and signed httpOnly session cookies. Alongside the Argon2
hash, the plaintext is retained so the settings screen can reveal the owner's
own password; it is only ever returned to that signed-in owner.

Endpoints (mounted by ``main.py``):
    POST  /api/auth/signup            create an account (409 email in use, 422
                                      password under the minimum length)
    POST  /api/auth/login             start a session (401 with a generic message)
    POST  /api/auth/logout            clear the session cookie
    GET   /api/auth/me                the signed-in user, or 401
    GET   /api/auth/profile           profile + password for settings
    PATCH /api/auth/profile           update names / default web search
    POST  /api/auth/profile/picture   upload a PNG profile picture
    POST  /api/auth/verify-password   check the current password
    POST  /api/auth/change-password   set a new password
    DELETE /api/auth/account          permanently delete the signed-in account

Configuration lives in ``backend/.env`` (see ``.env.example``).
"""

from __future__ import annotations

import base64
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# --- Configuration ---------------------------------------------------------

# No ORM existed in the project, so auth uses SQLite + SQLAlchemy. Point
# AUTH_DATABASE_URL at another database (e.g. PostgreSQL) to switch stores.
DATABASE_URL = os.environ.get(
    "AUTH_DATABASE_URL", f"sqlite:///{(BASE_DIR / 'researchlab.db').as_posix()}"
)
SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "").strip() or "dev-insecure-secret-change-me"
SESSION_COOKIE = os.environ.get("AUTH_SESSION_COOKIE", "rl_session").strip()
SESSION_MAX_AGE = int(os.environ.get("AUTH_SESSION_MAX_AGE", str(60 * 60 * 24 * 7)))
MIN_PASSWORD_LENGTH = int(os.environ.get("AUTH_MIN_PASSWORD_LENGTH", "12"))

# Simple per-IP login throttle: at most N attempts inside the rolling window.
RATE_LIMIT_MAX = int(os.environ.get("AUTH_RATE_LIMIT_MAX", "10"))
RATE_LIMIT_WINDOW = int(os.environ.get("AUTH_RATE_LIMIT_WINDOW", "60"))

# --- Database --------------------------------------------------------------

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    last_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # The settings screen lets the owner reveal their password, so the plaintext
    # is retained alongside the Argon2 hash. Never returned by anything except the
    # owner's own /profile response.
    password_plain: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    profile_picture: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    default_web_search: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


Base.metadata.create_all(engine)


def _ensure_columns() -> None:
    """Lightweight migration: ``create_all`` adds missing tables, not columns.

    Existing databases predate the profile columns, so add any that are missing
    (SQLite only -- other stores are expected to be migrated out of band).
    """
    if not DATABASE_URL.startswith("sqlite"):
        return
    with engine.begin() as conn:
        existing = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)")}
        for name, ddl in (
            ("first_name", "ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT ''"),
            ("last_name", "ALTER TABLE users ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT ''"),
            ("profile_picture", "ALTER TABLE users ADD COLUMN profile_picture TEXT"),
            ("default_web_search", "ALTER TABLE users ADD COLUMN default_web_search BOOLEAN NOT NULL DEFAULT 1"),
            ("password_plain", "ALTER TABLE users ADD COLUMN password_plain TEXT"),
        ):
            if name not in existing:
                conn.exec_driver_sql(ddl)

    with SessionLocal() as db:
        for row in db.scalars(select(User)).all():
            if not row.first_name and not row.last_name and row.full_name:
                parts = row.full_name.split()
                row.first_name = parts[0]
                row.last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
        db.commit()


_ensure_columns()

# --- Password hashing (Argon2id) -------------------------------------------

_hasher = PasswordHasher()  # defaults to Argon2id with a per-password salt


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


# --- Session tokens (signed cookie) ----------------------------------------

_serializer = URLSafeTimedSerializer(SECRET_KEY, salt="researchlab-auth-session")


def issue_session(user_id: int) -> str:
    return _serializer.dumps({"uid": user_id})


def read_session(token: str | None) -> int | None:
    if not token:
        return None
    try:
        data = _serializer.loads(token, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    uid = data.get("uid") if isinstance(data, dict) else None
    return uid if isinstance(uid, int) else None


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, path="/")


def _public_user(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "email": user.email,
        "profile_picture": user.profile_picture,
        "default_web_search": bool(user.default_web_search),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def get_current_user(request: Request) -> dict:
    uid = read_session(request.cookies.get(SESSION_COOKIE))
    if uid is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    with SessionLocal() as db:
        user = db.get(User, uid)
        if user is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return _public_user(user)


# --- Login rate limiting ---------------------------------------------------

_attempts: dict[str, list[float]] = {}


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check_rate_limit(ip: str) -> None:
    now = time.monotonic()
    window_start = now - RATE_LIMIT_WINDOW
    recent = [t for t in _attempts.get(ip, []) if t > window_start]
    if recent:
        _attempts[ip] = recent
    else:
        _attempts.pop(ip, None)
    if len(recent) >= RATE_LIMIT_MAX:
        retry_after = max(1, int(RATE_LIMIT_WINDOW - (now - recent[0])) + 1)
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )


def _record_attempt(ip: str) -> None:
    _attempts.setdefault(ip, []).append(time.monotonic())


def _reset_attempts(ip: str) -> None:
    _attempts.pop(ip, None)


# --- Schemas ---------------------------------------------------------------


class SignupRequest(BaseModel):
    first_name: str = Field(default="", max_length=100)
    last_name: str = Field(default="", max_length=100)
    email: str = Field(default="", max_length=320)
    # Passwords are never trimmed or altered: symbols and spacing are valid.
    password: str = Field(default="")


class LoginRequest(BaseModel):
    email: str = Field(default="", max_length=320)
    password: str = Field(default="")


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", status_code=201)
def signup(payload: SignupRequest) -> dict:
    email = payload.email.strip().lower()
    full_name = f"{payload.first_name.strip()} {payload.last_name.strip()}".strip()

    if not email or not full_name or not payload.password:
        raise HTTPException(status_code=422, detail="All fields are required.")

    with SessionLocal() as db:
        # Email uniqueness is enforced first (matching the UI), then password
        # strength.
        if db.scalar(select(User).where(User.email == email)) is not None:
            raise HTTPException(status_code=409, detail="Email is already in use!")
        if len(payload.password) < MIN_PASSWORD_LENGTH:
            raise HTTPException(
                status_code=422,
                detail="password must be at least 12 characters long!",
            )
        user = User(
            full_name=full_name,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            email=email,
            password_hash=hash_password(payload.password),
            password_plain=payload.password,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"user": _public_user(user)}


@router.post("/login")
def login(payload: LoginRequest, request: Request, response: Response) -> dict:
    ip = _client_ip(request)
    _check_rate_limit(ip)

    email = payload.email.strip().lower()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))

    # Same generic failure whether the email is unknown or the password is
    # wrong, so the client can never learn which one was incorrect.
    if user is None or not verify_password(user.password_hash, payload.password):
        _record_attempt(ip)
        raise HTTPException(status_code=401, detail="Email or Password is incorrect!")

    _reset_attempts(ip)
    # Backfill the reveal-able plaintext for accounts created before it existed.
    if not user.password_plain:
        with SessionLocal() as db:
            fresh = db.get(User, user.id)
            if fresh is not None and not fresh.password_plain:
                fresh.password_plain = payload.password
                db.commit()
    set_session_cookie(response, issue_session(user.id))
    return {"user": _public_user(user)}


@router.post("/logout")
def logout(response: Response) -> dict:
    clear_session_cookie(response)
    return {"status": "ok"}


@router.get("/me")
def me(user: dict = Depends(get_current_user)) -> dict:
    return {"user": user}


# --- Profile management ----------------------------------------------------

MAX_PICTURE_BYTES = 5 * 1024 * 1024  # 5 MB


class ProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    default_web_search: bool | None = None


class VerifyPasswordRequest(BaseModel):
    password: str = Field(default="")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(default="")
    new_password: str = Field(default="")
    confirm_password: str = Field(default="")


def _require_user(user: dict) -> User:
    with SessionLocal() as db:
        row = db.get(User, user["id"])
        if row is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return row


@router.get("/profile")
def get_profile(user: dict = Depends(get_current_user)) -> dict:
    row = _require_user(user)
    data = _public_user(row)
    # The settings screen shows the owner's password; only the signed-in owner
    # can ever read it back.
    data["password"] = row.password_plain or ""
    return {"user": data}


@router.patch("/profile")
def update_profile(payload: ProfileUpdate, user: dict = Depends(get_current_user)) -> dict:
    with SessionLocal() as db:
        row = db.get(User, user["id"])
        if row is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        if payload.first_name is not None:
            row.first_name = payload.first_name.strip()
        if payload.last_name is not None:
            row.last_name = payload.last_name.strip()
        row.full_name = f"{row.first_name} {row.last_name}".strip() or row.email
        if payload.default_web_search is not None:
            row.default_web_search = bool(payload.default_web_search)
        db.commit()
        db.refresh(row)
        return {"user": _public_user(row)}


@router.post("/profile/picture")
async def update_profile_picture(
    file: UploadFile = File(...), user: dict = Depends(get_current_user)
) -> dict:
    content_type = (file.content_type or "").lower()
    data = await file.read(MAX_PICTURE_BYTES + 1)
    await file.close()

    if content_type != "image/png":
        raise HTTPException(status_code=400, detail="Profile picture must be a PNG.")
    if len(data) > MAX_PICTURE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Profile picture exceeds the {MAX_PICTURE_BYTES // (1024 * 1024)} MB limit.",
        )

    encoded = base64.b64encode(data).decode("ascii")
    data_url = f"data:image/png;base64,{encoded}"

    with SessionLocal() as db:
        row = db.get(User, user["id"])
        if row is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        row.profile_picture = data_url
        db.commit()
        db.refresh(row)
        return {"user": _public_user(row)}


@router.post("/verify-password")
def verify_password_endpoint(
    payload: VerifyPasswordRequest, user: dict = Depends(get_current_user)
) -> dict:
    row = _require_user(user)
    if not verify_password(row.password_hash, payload.password):
        raise HTTPException(status_code=401, detail="Password is incorrect!")
    if not row.password_plain:
        with SessionLocal() as db:
            fresh = db.get(User, row.id)
            if fresh is not None and not fresh.password_plain:
                fresh.password_plain = payload.password
                db.commit()
    return {"status": "ok"}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest, user: dict = Depends(get_current_user)
) -> dict:
    row = _require_user(user)
    if not verify_password(row.password_hash, payload.current_password):
        raise HTTPException(status_code=401, detail="Password is incorrect!")
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Confirmation password is incorrect!")
    if len(payload.new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"password must be at least {MIN_PASSWORD_LENGTH} characters long!",
        )
    with SessionLocal() as db:
        fresh = db.get(User, row.id)
        if fresh is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        fresh.password_hash = hash_password(payload.new_password)
        fresh.password_plain = payload.new_password
        db.commit()
    return {"status": "ok"}


@router.delete("/account")
def delete_account(response: Response, user: dict = Depends(get_current_user)) -> dict:
    """Permanently delete the signed-in user and every server-side record we hold.

    Everything scoped to the user is removed: the user row (email, name,
    password, profile picture, preferences) plus their chat sessions/history,
    folders, uploaded documents and conversions. The client still clears its
    transient per-browser state after this call.
    """
    # Imported lazily to avoid a circular import at module load (store imports
    # SessionLocal/Base from this module).
    from store import ChatSession, Conversion, Folder, UploadedDoc

    with SessionLocal() as db:
        for model in (ChatSession, Folder, UploadedDoc, Conversion):
            db.query(model).filter(model.user_id == user["id"]).delete()
        row = db.get(User, user["id"])
        if row is not None:
            db.delete(row)
        db.commit()
    clear_session_cookie(response)
    return {"status": "ok"}
