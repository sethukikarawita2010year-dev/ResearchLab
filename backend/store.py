"""ResearchLab application data store (SQLite + SQLAlchemy).

Everything the app persists is scoped to the signed-in user: chat sessions
(history + per-chat notes/attachments/annotations), folders, uploaded PDFs and
conversions. The tables reuse the engine and ``Base`` defined in ``auth`` so the
whole app lives in one database file.

Endpoints (mounted by ``main.py`` at ``/api``):
    GET    /api/sessions              list the user's chat sessions
    POST   /api/sessions              create/upsert a chat session
    PATCH  /api/sessions/{id}         update a chat session
    DELETE /api/sessions/{id}         delete a chat session
    GET    /api/folders               list the user's folders (seeds defaults)
    POST   /api/folders               create a folder
    POST   /api/folders/{name}/increment   bump a folder's item count
"""

from __future__ import annotations

import json
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, String, Text, select
from sqlalchemy.orm import Mapped, mapped_column

from auth import Base, SessionLocal, engine, get_current_user

router = APIRouter(prefix="/api", tags=["store"])

DEFAULT_FOLDERS = [
    {"name": "All Papers", "count": 0, "muted": False},
]


def _now_ms() -> int:
    return int(time.time() * 1000)


# --- Models ----------------------------------------------------------------


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False, default="New research session")
    folder: Mapped[str] = mapped_column(String(200), nullable=False, default="All Papers")
    upload_id: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)
    pdf_name: Mapped[str | None] = mapped_column(String(300), nullable=True, default=None)
    messages: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    extra_docs: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    web_sources: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    annotations: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    notepad: Mapped[str] = mapped_column(Text, nullable=False, default="")
    prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    web_search: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False, default=_now_ms)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False, default=_now_ms)


class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    muted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class UploadedDoc(Base):
    __tablename__ = "uploaded_docs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    filename: Mapped[str] = mapped_column(String(300), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False, default="application/pdf")
    uploaded_at: Mapped[str] = mapped_column(String(40), nullable=False, default="")


class Conversion(Base):
    __tablename__ = "conversions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    filename: Mapped[str] = mapped_column(String(300), nullable=False)
    pdf_filename: Mapped[str] = mapped_column(String(300), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    folder: Mapped[str] = mapped_column(String(200), nullable=False, default="All Papers")
    created_at: Mapped[str] = mapped_column(String(40), nullable=False, default="")


Base.metadata.create_all(bind=engine)


def _migrate() -> None:
    """Lightweight migration: ``create_all`` adds missing tables, not columns."""
    with engine.begin() as conn:
        columns = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(chat_sessions)")}
        if columns and "prompt" not in columns:
            conn.exec_driver_sql(
                "ALTER TABLE chat_sessions ADD COLUMN prompt TEXT NOT NULL DEFAULT ''"
            )


_migrate()


# --- Serialisation ---------------------------------------------------------


def _loads(value: str, fallback):
    try:
        parsed = json.loads(value) if value else fallback
    except (TypeError, ValueError):
        return fallback
    return parsed if isinstance(parsed, type(fallback)) else fallback


def serialize_session(row: ChatSession) -> dict:
    return {
        "id": row.id,
        "title": row.title,
        "folder": row.folder,
        "uploadId": row.upload_id,
        "pdfName": row.pdf_name,
        "messages": _loads(row.messages, []),
        "extraDocs": _loads(row.extra_docs, []),
        "webSources": _loads(row.web_sources, []),
        "annotations": _loads(row.annotations, []),
        "notepad": row.notepad or "",
        "prompt": row.prompt or "",
        "webSearch": bool(row.web_search),
        "createdAt": row.created_at,
        "updatedAt": row.updated_at,
    }


def serialize_folder(row: Folder) -> dict:
    return {"name": row.name, "count": str(row.count), "muted": bool(row.muted)}


# --- Schemas ---------------------------------------------------------------


class SessionPayload(BaseModel):
    id: str | None = Field(default=None, max_length=64)
    title: str | None = Field(default=None, max_length=300)
    folder: str | None = Field(default=None, max_length=200)
    uploadId: str | None = Field(default=None, max_length=64)
    pdfName: str | None = Field(default=None, max_length=300)
    messages: list | None = None
    extraDocs: list | None = None
    webSources: list | None = None
    annotations: list | None = None
    notepad: str | None = None
    prompt: str | None = None
    webSearch: bool | None = None
    createdAt: int | None = None


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


# --- Sessions --------------------------------------------------------------


@router.get("/sessions")
def list_sessions(user: dict = Depends(get_current_user)) -> dict:
    with SessionLocal() as db:
        rows = db.scalars(
            select(ChatSession)
            .where(ChatSession.user_id == user["id"])
            .order_by(ChatSession.updated_at.desc())
        ).all()
        return {"sessions": [serialize_session(r) for r in rows]}


@router.post("/sessions", status_code=201)
def upsert_session(payload: SessionPayload, user: dict = Depends(get_current_user)) -> dict:
    with SessionLocal() as db:
        row = db.get(ChatSession, payload.id) if payload.id else None
        if row is not None and row.user_id != user["id"]:
            # The id is taken by another user's session; never reuse it.
            row = None
        if row is None:
            row = ChatSession(
                id=(payload.id if payload.id and db.get(ChatSession, payload.id) is None else uuid.uuid4().hex),
                user_id=user["id"],
                created_at=payload.createdAt or _now_ms(),
            )
            db.add(row)
        _apply_session_payload(row, payload)
        db.commit()
        db.refresh(row)
        return serialize_session(row)


@router.patch("/sessions/{session_id}")
def update_session(
    session_id: str, payload: SessionPayload, user: dict = Depends(get_current_user)
) -> dict:
    with SessionLocal() as db:
        row = db.get(ChatSession, session_id)
        if row is None or row.user_id != user["id"]:
            raise HTTPException(status_code=404, detail="Session not found")
        _apply_session_payload(row, payload)
        db.commit()
        db.refresh(row)
        return serialize_session(row)


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, user: dict = Depends(get_current_user)) -> dict:
    with SessionLocal() as db:
        row = db.get(ChatSession, session_id)
        if row is not None and row.user_id == user["id"]:
            db.delete(row)
            db.commit()
    return {"status": "ok"}


def _apply_session_payload(row: ChatSession, payload: SessionPayload) -> None:
    if payload.title is not None:
        row.title = payload.title.strip() or "New research session"
    if payload.folder is not None:
        row.folder = payload.folder.strip() or "All Papers"
    if payload.uploadId is not None:
        row.upload_id = payload.uploadId or None
    if payload.pdfName is not None:
        row.pdf_name = payload.pdfName or None
    if payload.messages is not None:
        row.messages = json.dumps(payload.messages, ensure_ascii=False)
    if payload.extraDocs is not None:
        row.extra_docs = json.dumps(payload.extraDocs, ensure_ascii=False)
    if payload.webSources is not None:
        row.web_sources = json.dumps(payload.webSources, ensure_ascii=False)
    if payload.annotations is not None:
        row.annotations = json.dumps(payload.annotations, ensure_ascii=False)
    if payload.notepad is not None:
        row.notepad = payload.notepad
    if payload.prompt is not None:
        row.prompt = payload.prompt
    if payload.webSearch is not None:
        row.web_search = bool(payload.webSearch)
    row.updated_at = _now_ms()


# --- Folders ---------------------------------------------------------------


def _ensure_default_folders(db, user_id: int) -> None:
    count = db.scalar(select(Folder).where(Folder.user_id == user_id).limit(1))
    if count is not None:
        return
    for item in DEFAULT_FOLDERS:
        db.add(Folder(user_id=user_id, name=item["name"], count=item["count"], muted=item["muted"]))
    db.commit()


@router.get("/folders")
def list_folders(user: dict = Depends(get_current_user)) -> dict:
    with SessionLocal() as db:
        _ensure_default_folders(db, user["id"])
        rows = db.scalars(
            select(Folder).where(Folder.user_id == user["id"]).order_by(Folder.count.desc(), Folder.id.asc())
        ).all()
        return {"folders": [serialize_folder(r) for r in rows]}


@router.post("/folders", status_code=201)
def create_folder(payload: FolderCreate, user: dict = Depends(get_current_user)) -> dict:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Folder name is required.")
    with SessionLocal() as db:
        existing = db.scalar(
            select(Folder).where(Folder.user_id == user["id"], Folder.name == name)
        )
        if existing is not None:
            return serialize_folder(existing)
        row = Folder(user_id=user["id"], name=name, count=0, muted=True)
        db.add(row)
        db.commit()
        db.refresh(row)
        return serialize_folder(row)


@router.post("/folders/{name}/increment")
def increment_folder(name: str, user: dict = Depends(get_current_user)) -> dict:
    target = (name or "").strip()
    if not target:
        raise HTTPException(status_code=422, detail="Folder name is required.")
    with SessionLocal() as db:
        row = db.scalar(select(Folder).where(Folder.user_id == user["id"], Folder.name == target))
        if row is None:
            row = Folder(user_id=user["id"], name=target, count=0, muted=True)
            db.add(row)
        row.count = int(row.count or 0) + 1
        db.commit()
        db.refresh(row)
        return serialize_folder(row)
