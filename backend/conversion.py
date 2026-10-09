"""Document-to-PDF conversion service.

Public API
----------
validate(filename, data) -> str
    Content-based validation. Returns the normalised extension (e.g. ".docx")
    or raises UnsupportedFile / InvalidFile.

convert_to_pdf(filename, data) -> bytes
    Converts a validated upload to PDF bytes.

Providers
---------
cloudconvert   (default) managed CloudConvert v2 REST API (no SDK required)
gotenberg      self-hosted Gotenberg (LibreOffice + Chromium), set CONVERT_PROVIDER=gotenberg

All configuration is read from the environment (see backend/.env).
"""

from __future__ import annotations

import asyncio
import html
import io
import os
import time
import zipfile
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

# --- configuration ---------------------------------------------------------

PROVIDER = os.environ.get("CONVERT_PROVIDER", "cloudconvert").strip().lower()

CLOUDCONVERT_API_KEY = os.environ.get("CLOUDCONVERT_API_KEY", "").strip()
CLOUDCONVERT_SANDBOX = os.environ.get("CLOUDCONVERT_SANDBOX", "").lower() in {"1", "true", "yes"}
CLOUDCONVERT_BASE = (
    "https://api.sandbox.cloudconvert.com/v2"
    if CLOUDCONVERT_SANDBOX
    else "https://api.cloudconvert.com/v2"
)

GOTENBERG_URL = os.environ.get("GOTENBERG_URL", "http://127.0.0.1:3000").rstrip("/")

CONVERT_TIMEOUT = float(os.environ.get("CONVERT_TIMEOUT", "120"))
POLL_INTERVAL = float(os.environ.get("CONVERT_POLL_INTERVAL", "2"))

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

# extension -> {ooxml part that must exist} for zip-based Office formats
OOXML_PARTS = {
    ".docx": "word/document.xml",
    ".xlsx": "xl/workbook.xml",
    ".pptx": "ppt/presentation.xml",
}
TEXT_TYPES = {".csv", ".html", ".txt", ".md"}
ALLOWED_EXTENSIONS = set(OOXML_PARTS) | TEXT_TYPES

# zip-bomb guards for OOXML
MAX_UNCOMPRESSED = 200 * 1024 * 1024
MAX_COMPRESSION_RATIO = 120


class ConversionError(Exception):
    """Base error for the conversion service."""

    status_code = 502


class UnsupportedFile(ConversionError):
    status_code = 415


class InvalidFile(ConversionError):
    status_code = 400


class FileTooLarge(ConversionError):
    status_code = 413


class ProviderError(ConversionError):
    status_code = 502


# --- validation ------------------------------------------------------------

def _ext_of(filename: str) -> str:
    return os.path.splitext(filename or "")[1].lower()


def _validate_ooxml(ext: str, data: bytes) -> None:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            names = set(zf.namelist())
            required = OOXML_PARTS[ext]
            if required not in names and not any(n.endswith(required) for n in names):
                raise InvalidFile(f"File is not a valid {ext} document.")
            if "[Content_Types].xml" not in names:
                raise InvalidFile(f"File is not a valid {ext} document.")
            total = sum(info.file_size for info in zf.infolist())
    except zipfile.BadZipFile as exc:
        raise InvalidFile(f"File is not a valid {ext} document.") from exc

    if total > MAX_UNCOMPRESSED:
        raise InvalidFile("File expands too large to be safe (possible zip bomb).")
    if data and total / max(len(data), 1) > MAX_COMPRESSION_RATIO:
        raise InvalidFile("File compression ratio is suspicious (possible zip bomb).")


def _decode_text(ext: str, data: bytes) -> str:
    if b"\x00" in data:
        raise InvalidFile(f"{ext} file contains binary data.")
    for encoding in ("utf-8-sig", "utf-16", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise InvalidFile(f"{ext} file is not valid text.")


def validate(filename: str, data: bytes) -> str:
    """Validate an upload and return its normalised extension."""
    if not data:
        raise InvalidFile("The uploaded file is empty.")

    ext = _ext_of(filename)
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise UnsupportedFile(f"Unsupported file type '{ext or filename}'. Allowed: {allowed}.")

    if len(data) > MAX_FILE_SIZE:
        raise FileTooLarge(f"File exceeds the {MAX_FILE_SIZE // (1024 * 1024)} MB limit.")

    if ext in OOXML_PARTS:
        _validate_ooxml(ext, data)
    elif ext in TEXT_TYPES:
        _decode_text(ext, data)

    return ext


# --- content preparation ---------------------------------------------------

_HTML_DOC = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{title}</title>
<style>
  @page {{ margin: 18mm 16mm; }}
  body {{ font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          font-size: 12px; color: #1a1a1a; line-height: 1.5; }}
  h1, h2, h3 {{ color: #111; }}
  pre {{ font-family: "Consolas", "Courier New", monospace; white-space: pre-wrap;
         word-wrap: break-word; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ border: 1px solid #d0d5dd; padding: 6px 8px; text-align: left;
            vertical-align: top; }}
  th {{ background: #f2f4f7; }}
  tr:nth-child(even) td {{ background: #fafafa; }}
</style></head>
<body>{body}</body></html>"""


def _text_to_html(text: str) -> str:
    return _HTML_DOC.format(title="Text document", body=f"<pre>{html.escape(text)}</pre>")


def _csv_to_html(text: str) -> str:
    import csv

    rows = list(csv.reader(io.StringIO(text)))
    if not rows:
        return _HTML_DOC.format(title="CSV document", body="<p>(empty file)</p>")

    header, *body = rows
    thead = "".join(f"<th>{html.escape(cell)}</th>" for cell in header)
    tbody = "".join(
        "<tr>" + "".join(f"<td>{html.escape(cell)}</td>" for cell in row) + "</tr>"
        for row in body
    )
    table = f"<table><thead><tr>{thead}</tr></thead><tbody>{tbody}</tbody></table>"
    return _HTML_DOC.format(title="CSV document", body=table)


def _md_to_html(text: str) -> str:
    import markdown as md

    body = md.markdown(text, extensions=["tables", "fenced_code", "sane_lists", "nl2br"])
    return _HTML_DOC.format(title="Markdown document", body=body)


def _prepare(ext: str, filename: str, data: bytes):
    """Return (upload_filename, upload_bytes, input_format) for the provider."""
    if ext == ".csv":
        return "document.html", _csv_to_html(_decode_text(ext, data)).encode("utf-8"), "html"
    if ext == ".md":
        return "document.html", _md_to_html(_decode_text(ext, data)).encode("utf-8"), "html"
    if ext == ".txt":
        return "document.html", _text_to_html(_decode_text(ext, data)).encode("utf-8"), "html"
    if ext == ".html":
        return "document.html", data, "html"
    return filename, data, ext.lstrip(".")


# --- cloudconvert provider -------------------------------------------------

async def _cloudconvert(filename: str, data: bytes, ext: str) -> bytes:
    if not CLOUDCONVERT_API_KEY:
        raise ProviderError("CloudConvert API key is not configured (backend/.env).")

    upload_name, upload_bytes, input_format = _prepare(ext, filename, data)
    headers = {"Authorization": f"Bearer {CLOUDCONVERT_API_KEY}"}
    payload = {
        "tasks": {
            "import-1": {"operation": "import/upload"},
            "convert-1": {
                "operation": "convert",
                "input": "import-1",
                "input_format": input_format,
                "output_format": "pdf",
            },
            "export-1": {"operation": "export/url", "input": "convert-1"},
        }
    }

    async with httpx.AsyncClient(timeout=CONVERT_TIMEOUT) as client:
        resp = await client.post(f"{CLOUDCONVERT_BASE}/jobs", json=payload, headers=headers)
        _raise_provider(resp)
        job = resp.json()["data"]
        job_id = job["id"]

        import_task = next((t for t in job["tasks"] if t["name"] == "import-1"), None)
        if not import_task or "form" not in import_task.get("result", {}):
            raise ProviderError("CloudConvert did not return an upload URL.")

        form = import_task["result"]["form"]
        upload = await client.post(
            form["url"],
            data=form["parameters"],
            files={"file": (upload_name, upload_bytes)},
        )
        if upload.status_code >= 400:
            raise ProviderError("Failed to upload the file to CloudConvert.")

        deadline = time.monotonic() + CONVERT_TIMEOUT
        while True:
            poll = await client.get(f"{CLOUDCONVERT_BASE}/jobs/{job_id}", headers=headers)
            _raise_provider(poll)
            data_json = poll.json()["data"]
            status = data_json.get("status")
            if status == "finished":
                break
            if status == "error":
                raise ProviderError(_job_error(data_json))
            if time.monotonic() > deadline:
                raise ProviderError("Conversion timed out.")
            await asyncio.sleep(POLL_INTERVAL)

        export_task = next((t for t in data_json["tasks"] if t["name"] == "export-1"), None)
        files = (export_task or {}).get("result", {}).get("files") or []
        if not files:
            raise ProviderError("CloudConvert returned no output file.")

        download = await client.get(files[0]["url"])
        download.raise_for_status()
        return download.content


# --- gotenberg provider ----------------------------------------------------

async def _gotenberg(filename: str, data: bytes, ext: str) -> bytes:
    upload_name, upload_bytes, _ = _prepare(ext, filename, data)
    async with httpx.AsyncClient(timeout=CONVERT_TIMEOUT) as client:
        if ext in OOXML_PARTS:
            resp = await client.post(
                f"{GOTENBERG_URL}/forms/libreoffice/convert",
                files={"files": (upload_name, upload_bytes)},
            )
        else:
            resp = await client.post(
                f"{GOTENBERG_URL}/forms/chromium/convert/html",
                files={"files": (upload_name, upload_bytes)},
            )
        if resp.status_code >= 400:
            raise ProviderError(f"Gotenberg conversion failed ({resp.status_code}).")
        return resp.content


# --- helpers ---------------------------------------------------------------

def _raise_provider(resp: httpx.Response) -> None:
    if resp.status_code >= 400:
        detail = ""
        try:
            body = resp.json()
            detail = body.get("message") or body.get("error") or ""
        except Exception:
            detail = resp.text[:200]
        raise ProviderError(f"CloudConvert error ({resp.status_code}): {detail}".strip())


def _job_error(data_json: dict) -> str:
    for task in data_json.get("tasks", []):
        if task.get("status") == "error":
            result = task.get("result") or {}
            return result.get("message") or f"task '{task.get('name')}' failed"
    return "CloudConvert job failed."


async def convert_to_pdf(filename: str, data: bytes) -> bytes:
    """Validate `data` for `filename` and return PDF bytes."""
    ext = validate(filename, data)
    if PROVIDER == "gotenberg":
        return await _gotenberg(filename, data, ext)
    return await _cloudconvert(filename, data, ext)
