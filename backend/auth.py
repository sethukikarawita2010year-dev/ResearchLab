"""ResearchLab authentication.

Self-contained auth module: a SQLite + SQLAlchemy user store, Argon2id
password hashing, and signed httpOnly session cookies. Nothing here ever
stores, logs or returns a plaintext password or its hash.

Endpoints (mounted by ``main.py``):
    POST /api/auth/signup    create an account (409 email in use, 422 password
                             under the minimum length)
    POST /api/auth/login     start a session (401 with a generic message)
    POST /api/auth/logout    clear the session cookie
    GET  /api/auth/me        the signed-in user, or 401

Configuration lives in ``backend/.env`` (see ``.env.example``).
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from pathlib import Path

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pydantic import BaseModel, Field
from sqlalchemy import DateTime, Integer, String, create_engine, select
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
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


Base.metadata.create_all(engine)

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
        "email": user.email,
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
            email=email,
            password_hash=hash_password(payload.password),
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
    set_session_cookie(response, issue_session(user.id))
    return {"user": _public_user(user)}


@router.post("/logout")
def logout(response: Response) -> dict:
    clear_session_cookie(response)
    return {"status": "ok"}


@router.get("/me")
def me(user: dict = Depends(get_current_user)) -> dict:
    return {"user": user}
