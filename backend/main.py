"""ResearchLab FastAPI backend.

Endpoints
---------
GET  /api/health                     liveness probe
POST /api/auth/signup                create an account
POST /api/auth/login                 start a session (httpOnly cookie)
POST /api/auth/logout                clear the session cookie
GET  /api/auth/me                    the signed-in user, or 401
POST /api/sessions                   create a research session (title)
PATCH /api/sessions/{session_id}     rename a session
POST /api/upload                     upload a single PDF (pdf-only, size-limited)
POST /api/convert                    convert a document (docx/csv/html/xlsx/txt/pptx/md) to PDF
GET  /api/convert/{id}/download      download a converted PDF
GET  /api/conversions                list saved conversions (newest first)
POST /api/analyze                    produce the five-section structured summary via Gemini
POST /api/chat                       grounded Q&A over an uploaded PDF (optional web search)
GET  /api/document/{id}              stream a previously uploaded PDF (for the in-app viewer)
POST /api/resolve-source             fetch a web URL and return its title/host as a source
POST /api/source-content             fetch + cache the readable text of a web source

Run with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import html as html_lib
import json
import re
import uuid
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select

from conversion import ConversionError, convert_to_pdf
from auth import get_current_user, router as auth_router, SessionLocal
from store import (
    Conversion,
    UploadedDoc,
    router as store_router,
)
import llm

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

app.include_router(auth_router)
app.include_router(store_router)

# Cached readable copies of web sources, keyed by normalised URL. Persisted so
# the split-screen viewer and citation highlights keep working across restarts
# (same rationale as conversions.json -- no external database required).
SOURCES_FILE = BASE_DIR / "sources.json"


def _load_sources() -> dict[str, dict]:
    if not SOURCES_FILE.exists():
        return {}
    try:
        raw = json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return {str(k): v for k, v in raw.items() if isinstance(v, dict)} if isinstance(raw, dict) else {}


def _save_sources() -> None:
    try:
        SOURCES_FILE.write_text(
            json.dumps(SOURCES, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except OSError:
        pass


SOURCES: dict[str, dict] = _load_sources()


class AnalyzeRequest(BaseModel):
    document_id: str = Field(min_length=1)
    language: str = Field(default="auto")


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=12000)


class ChatRequest(BaseModel):
    document_id: str = Field(min_length=1)
    document_ids: list[str] = Field(default_factory=list)
    chat_id: str | None = None
    messages: list[ChatMessage] = Field(min_length=1)
    web_search: bool = True
    language: str = Field(default="auto")
    annotations: list[dict] = Field(default_factory=list)


class ResolveSourceRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


def _extract_title(markup: str) -> str:
    for pattern in (
        r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']twitter:title["\'][^>]+content=["\']([^"\']+)["\']',
        r"<title[^>]*>(.*?)</title>",
    ):
        match = re.search(pattern, markup, flags=re.IGNORECASE | re.DOTALL)
        if match:
            title = html_lib.unescape(match.group(1)).strip()
            title = re.sub(r"\s+", " ", title)
            if title:
                return title[:300]
    return ""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/upload", status_code=201)
async def upload_pdf(
    file: UploadFile = File(...), user: dict = Depends(get_current_user)
) -> dict:
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
    with SessionLocal() as db:
        db.add(
            UploadedDoc(
                id=upload_id,
                user_id=user["id"],
                filename=filename,
                size=len(data),
                content_type="application/pdf",
                uploaded_at=record["uploaded_at"],
            )
        )
        db.commit()
    return record


@app.get("/api/uploads")
def list_uploads(user: dict = Depends(get_current_user)) -> dict:
    with SessionLocal() as db:
        rows = db.scalars(
            select(UploadedDoc)
            .where(UploadedDoc.user_id == user["id"])
            .order_by(UploadedDoc.uploaded_at.desc())
        ).all()
        return {
            "uploads": [
                {
                    "id": r.id,
                    "filename": r.filename,
                    "size": r.size,
                    "content_type": r.content_type,
                    "uploaded_at": r.uploaded_at,
                }
                for r in rows
            ]
        }


@app.post("/api/convert", status_code=201)
async def convert_file(
    file: UploadFile = File(...),
    folder: str = Form("All Papers"),
    user: dict = Depends(get_current_user),
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
    with SessionLocal() as db:
        db.add(
            Conversion(
                id=conversion_id,
                user_id=user["id"],
                filename=filename,
                pdf_filename=pdf_filename,
                size=len(pdf_bytes),
                folder=record["folder"],
                created_at=record["created_at"],
            )
        )
        db.commit()
    return record


@app.get("/api/conversions")
def list_conversions(user: dict = Depends(get_current_user)) -> dict:
    with SessionLocal() as db:
        rows = db.scalars(
            select(Conversion)
            .where(Conversion.user_id == user["id"])
            .order_by(Conversion.created_at.desc())
        ).all()
        items = [
            {
                "id": r.id,
                "filename": r.filename,
                "pdf_filename": r.pdf_filename,
                "size": r.size,
                "folder": r.folder,
                "download_url": f"/convert/{r.id}/download",
                "created_at": r.created_at,
            }
            for r in rows
        ]
    return {"conversions": items}


@app.get("/api/convert/{conversion_id}/download")
def download_conversion(
    conversion_id: str, user: dict = Depends(get_current_user)
) -> FileResponse:
    path = CONVERTED_DIR / f"{conversion_id}.pdf"
    with SessionLocal() as db:
        record = db.get(Conversion, conversion_id)
        if record is None or record.user_id != user["id"] or not path.exists():
            raise HTTPException(status_code=404, detail="Conversion not found")
        pdf_filename = record.pdf_filename
    return FileResponse(path, media_type="application/pdf", filename=pdf_filename)


def _resolve_upload(upload_id: str, user_id: int) -> Path:
    path = UPLOAD_DIR / f"{upload_id}.pdf"
    with SessionLocal() as db:
        record = db.get(UploadedDoc, upload_id)
    if record is None or record.user_id != user_id or not path.exists():
        raise HTTPException(status_code=404, detail="Document not found. Upload the PDF first.")
    return path


@app.get("/api/document/{document_id}")
def get_document(document_id: str, user: dict = Depends(get_current_user)) -> FileResponse:
    path = _resolve_upload(document_id, user["id"])
    with SessionLocal() as db:
        record = db.get(UploadedDoc, document_id)
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=(record.filename if record else None) or path.name,
    )


@app.post("/api/analyze")
def analyze_paper(payload: AnalyzeRequest, user: dict = Depends(get_current_user)) -> dict:
    path = _resolve_upload(payload.document_id, user["id"])
    try:
        return llm.structured_summary(payload.document_id, path, payload.language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {exc}") from exc


@app.post("/api/chat")
def chat(payload: ChatRequest, user: dict = Depends(get_current_user)) -> dict:
    path = _resolve_upload(payload.document_id, user["id"])

    docs: list[dict] = []
    seen: set[str] = set()

    def add_doc(doc_id: str, required: bool = False) -> None:
        if doc_id in seen:
            return
        seen.add(doc_id)
        try:
            doc_path = _resolve_upload(doc_id, user["id"])
        except HTTPException:
            # A stale/unavailable secondary document should not fail the whole
            # turn; only the primary document is mandatory.
            if required:
                raise
            return
        with SessionLocal() as db:
            record = db.get(UploadedDoc, doc_id)
        docs.append(
            {
                "id": doc_id,
                "filename": (record.filename if record else None) or doc_path.name,
                "path": doc_path,
            }
        )

    add_doc(payload.document_id, required=True)
    for extra_id in payload.document_ids:
        if extra_id != payload.document_id:
            add_doc(extra_id)

    messages = [message.model_dump() for message in payload.messages]
    try:
        return llm.chat_answer(
            payload.document_id,
            path,
            messages,
            web_search=payload.web_search,
            language=payload.language,
            chat_id=payload.chat_id,
            documents=docs,
            annotations=payload.annotations,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI chat failed: {exc}") from exc


class _ReadableParser(HTMLParser):
    """A dependency-free readable-text extractor.

    Walks the HTML with the stdlib parser, drops chrome (script/style/nav/
    header/footer/aside/form), and emits heading/paragraph blocks. Section
    headings then group the paragraphs for the split-screen viewer.
    """

    SKIP = {
        "script",
        "style",
        "noscript",
        "template",
        "svg",
        "nav",
        "footer",
        "header",
        "aside",
        "form",
        "button",
        "select",
        "iframe",
    }
    BLOCK = {"p", "div", "section", "article", "li", "blockquote", "figcaption", "td", "pre"}
    HEAD = {"h1", "h2", "h3", "h4", "h5", "h6"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.skip_depth = 0
        self.in_title = False
        self.title_buf: list[str] = []
        self.head_buf: list[str] | None = None
        self.para_buf: list[str] = []
        self.blocks: list[tuple[str, str]] = []

    @staticmethod
    def _clean(value: str) -> str:
        return re.sub(r"\s+", " ", value).strip()

    def _flush(self) -> None:
        text = self._clean("".join(self.para_buf))
        self.para_buf = []
        if len(text) >= 2:
            self.blocks.append(("p", text))

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        if tag == "title":
            self.in_title = True
        if tag in self.SKIP:
            self.skip_depth += 1
        if tag in self.HEAD and self.skip_depth == 0:
            self._flush()
            self.head_buf = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        if tag in self.HEAD:
            if self.head_buf is not None:
                text = self._clean("".join(self.head_buf))
                if text:
                    self.blocks.append(("h", text))
            self.head_buf = None
        if tag in self.BLOCK:
            self._flush()
        if tag in self.SKIP and self.skip_depth > 0:
            self.skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_buf.append(data)
            return
        if self.skip_depth:
            return
        if self.head_buf is not None:
            self.head_buf.append(data)
        else:
            self.para_buf.append(data)

    def close(self) -> None:  # noqa: D401 - flush the trailing paragraph
        super().close()
        self._flush()


def _extract_readable(markup: str) -> tuple[str, list[dict]]:
    parser = _ReadableParser()
    try:
        parser.feed(markup)
        parser.close()
    except Exception:  # noqa: BLE001 - malformed HTML should not fail the request
        pass
    sections: list[dict] = []
    heading = ""
    parts: list[str] = []
    for kind, text in parser.blocks:
        if kind == "h":
            if parts or heading:
                sections.append({"heading": heading, "text": "\n\n".join(parts).strip()})
            heading = text
            parts = []
        else:
            parts.append(text)
    if parts or heading:
        sections.append({"heading": heading, "text": "\n\n".join(parts).strip()})
    sections = [s for s in sections if s["text"] or s["heading"]]
    title = _ReadableParser._clean("".join(parser.title_buf))
    return title, sections


def _normalize_url(raw: str) -> str:
    url = (raw or "").strip()
    if url and not url.lower().startswith(("http://", "https://")):
        url = f"https://{url}"
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Enter a valid http(s) URL.")
    return url


def _fetch_markup(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ResearchLab/1.0; +https://researchlab.local)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urlopen(request, timeout=12) as response:  # noqa: S310 - user-provided research URL
            raw = response.read(400_000)
            charset = response.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, errors="replace")
    except Exception as exc:  # noqa: BLE001 - surface any fetch failure to the client
        raise HTTPException(status_code=502, detail=f"Could not reach that URL: {exc}") from exc


def _load_source(url: str) -> dict:
    cached = SOURCES.get(url)
    if cached:
        return cached
    parsed = urlparse(url)
    markup = _fetch_markup(url)
    title, sections = _extract_readable(markup)
    title = title or _extract_title(markup) or parsed.netloc
    text = "\n\n".join(
        f"{s['heading']}\n{s['text']}" if s["heading"] else s["text"] for s in sections
    ).strip()
    record = {
        "url": url,
        "title": title[:300],
        "host": parsed.netloc,
        "sections": sections,
        "text": text,
        "available": bool(sections),
        "fetched_at": _now(),
    }
    SOURCES[url] = record
    _save_sources()
    return record


@app.post("/api/resolve-source")
def resolve_source(payload: ResolveSourceRequest) -> dict:
    url = _normalize_url(payload.url)
    parsed = urlparse(url)
    try:
        record = _load_source(url)
        return {
            "url": record["url"],
            "title": record["title"],
            "host": record["host"],
            "available": record.get("available", False),
        }
    except HTTPException:
        return {"url": url, "title": parsed.netloc, "host": parsed.netloc, "available": False}


@app.post("/api/source-content")
def source_content(payload: ResolveSourceRequest) -> dict:
    url = _normalize_url(payload.url)
    try:
        return _load_source(url)
    except HTTPException:
        parsed = urlparse(url)
        return {
            "url": url,
            "title": parsed.netloc,
            "host": parsed.netloc,
            "sections": [],
            "text": "",
            "available": False,
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
