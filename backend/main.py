"""ResearchLab FastAPI backend.

Endpoints
---------
GET  /api/health                     liveness probe
POST /api/sessions                   create a research session (title)
PATCH /api/sessions/{session_id}     rename a session
POST /api/upload                     upload a single PDF (pdf-only, size-limited)
POST /api/convert                    convert a document (docx/csv/html/xlsx/txt/pptx/md) to PDF
GET  /api/convert/{id}/download      download a converted PDF
GET  /api/conversions                list saved conversions (newest first)
POST /api/analyze                    produce the five-section structured summary via Gemini
POST /api/chat                       grounded Q&A over an uploaded PDF (optional web search)

Run with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from conversion import ConversionError, convert_to_pdf
import gemini

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR = BASE_DIR / "converted"
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
PDF_MAGIC = b"%PDF-"
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/x-pdf",
    "application/octet-stream",
}

app = FastAPI(title="ResearchLab API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5178",
        "http://127.0.0.1:5178",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:4178",
        "http://127.0.0.1:4178",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores (swap for a database later).
SESSIONS: dict[str, dict] = {}
UPLOADS: dict[str, dict] = {}

# Conversions are persisted to a small JSON file so the Recent Conversions
# table survives backend restarts (no external database required).
CONVERSIONS_FILE = BASE_DIR / "conversions.json"


def _load_conversions() -> dict[str, dict]:
    if not CONVERSIONS_FILE.exists():
        return {}
    try:
        raw = json.loads(CONVERSIONS_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if isinstance(raw, dict):
        return {str(k): v for k, v in raw.items() if isinstance(v, dict)}
    if isinstance(raw, list):
        return {str(item.get("id")): item for item in raw if isinstance(item, dict) and item.get("id")}
    return {}


def _save_conversions() -> None:
    try:
        CONVERSIONS_FILE.write_text(
            json.dumps(CONVERSIONS, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except OSError:
        pass


CONVERSIONS: dict[str, dict] = _load_conversions()


class SessionCreate(BaseModel):
    title: str = Field(default="New research session", min_length=1, max_length=120)


class SessionUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class AnalyzeRequest(BaseModel):
    document_id: str = Field(min_length=1)
    language: str = Field(default="auto")


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=12000)


class ChatRequest(BaseModel):
    document_id: str = Field(min_length=1)
    messages: list[ChatMessage] = Field(min_length=1)
    web_search: bool = True
    language: str = Field(default="auto")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/sessions", status_code=201)
def create_session(payload: SessionCreate) -> dict:
    session_id = uuid.uuid4().hex
    session = {"id": session_id, "title": payload.title.strip(), "created_at": _now()}
    SESSIONS[session_id] = session
    return session


@app.patch("/api/sessions/{session_id}")
def rename_session(session_id: str, payload: SessionUpdate) -> dict:
    session = SESSIONS.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    session["title"] = payload.title.strip()
    session["updated_at"] = _now()
    return session


@app.post("/api/upload", status_code=201)
async def upload_pdf(file: UploadFile = File(...)) -> dict:
    filename = (file.filename or "document.pdf").strip()
    content_type = (file.content_type or "").lower()

    if not filename.lower().endswith(".pdf") or content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    data = await file.read(MAX_FILE_SIZE + 1)
    await file.close()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_FILE_SIZE // (1024 * 1024)} MB limit.",
        )
    if not data.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="File is not a valid PDF.")

    upload_id = uuid.uuid4().hex
    (UPLOAD_DIR / f"{upload_id}.pdf").write_bytes(data)

    record = {
        "id": upload_id,
        "filename": filename,
        "size": len(data),
        "content_type": "application/pdf",
        "uploaded_at": _now(),
    }
    UPLOADS[upload_id] = record
    return record


@app.post("/api/convert", status_code=201)
async def convert_file(
    file: UploadFile = File(...),
    folder: str = Form("All Papers"),
) -> dict:
    filename = (file.filename or "document").strip()
    data = await file.read(MAX_FILE_SIZE + 1)
    await file.close()

    try:
        pdf_bytes = await convert_to_pdf(filename, data)
    except ConversionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    conversion_id = uuid.uuid4().hex
    pdf_filename = f"{Path(filename).stem or 'document'}.pdf"
    (CONVERTED_DIR / f"{conversion_id}.pdf").write_bytes(pdf_bytes)

    record = {
        "id": conversion_id,
        "filename": filename,
        "pdf_filename": pdf_filename,
        "size": len(pdf_bytes),
        "folder": (folder or "All Papers").strip() or "All Papers",
        "download_url": f"/convert/{conversion_id}/download",
        "created_at": _now(),
    }
    CONVERSIONS[conversion_id] = record
    _save_conversions()
    return record


@app.get("/api/conversions")
def list_conversions() -> dict:
    items = sorted(
        CONVERSIONS.values(),
        key=lambda r: r.get("created_at", ""),
        reverse=True,
    )
    return {"conversions": items}


@app.get("/api/convert/{conversion_id}/download")
def download_conversion(conversion_id: str) -> FileResponse:
    record = CONVERSIONS.get(conversion_id)
    path = CONVERTED_DIR / f"{conversion_id}.pdf"
    if record is None or not path.exists():
        raise HTTPException(status_code=404, detail="Conversion not found")
    return FileResponse(path, media_type="application/pdf", filename=record["pdf_filename"])


def _resolve_upload(upload_id: str) -> Path:
    record = UPLOADS.get(upload_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Document not found. Upload the PDF first.")
    path = UPLOAD_DIR / f"{upload_id}.pdf"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Document file is missing.")
    return path


@app.post("/api/analyze")
def analyze_paper(payload: AnalyzeRequest) -> dict:
    path = _resolve_upload(payload.document_id)
    try:
        return gemini.structured_summary(payload.document_id, path, payload.language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {exc}") from exc


@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict:
    path = _resolve_upload(payload.document_id)
    messages = [message.model_dump() for message in payload.messages]
    try:
        return gemini.chat_answer(
            payload.document_id,
            path,
            messages,
            web_search=payload.web_search,
            language=payload.language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI chat failed: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
