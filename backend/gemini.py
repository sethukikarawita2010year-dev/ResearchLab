"""Gemini (Google AI Studio) integration for ResearchLab.

Provides the two AI capabilities behind the Research chat:

- ``structured_summary``  -> five-section "extraction card" content.
- ``chat_answer``        -> grounded Q&A with optional web search and
                            language control (auto / english / sinhala / tamil).

Keys are read from the environment (backend/.env): ``GEMINI_API_KEY``
(optionally ``GEMINI_MODEL`` to override the default model).
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

_client: genai.Client | None = None
_file_cache: dict[str, types.File] = {}


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set. Add it to backend/.env")
        _client = genai.Client(api_key=api_key)
    return _client


def _pdf_file(upload_id: str, path: Path) -> types.File:
    """Return a Gemini Files API handle for the uploaded PDF, cached by upload id."""
    client = _get_client()
    cached = _file_cache.get(upload_id)
    if cached is not None:
        try:
            client.files.get(name=cached.name)
            return cached
        except Exception:
            _file_cache.pop(upload_id, None)
    pdf_file = client.files.upload(
        file=str(path),
        config=types.UploadFileConfig(mime_type="application/pdf"),
    )
    _file_cache[upload_id] = pdf_file
    return pdf_file


def _language_prompt(language: str) -> str:
    prompts = {
        "auto": "",
        "english": "Write your responses in English.\n",
        "sinhala": (
            "Write your responses entirely in Sinhala (\u0DC3\u0DD2\u0D82\u0DC4\u0DBD). "
            "Keep technical terms in their original form where appropriate.\n"
        ),
        "tamil": (
            "Write your responses entirely in Tamil (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD). "
            "Keep technical terms in their original form where appropriate.\n"
        ),
    }
    return prompts.get(language or "auto", "")


# --- Structured summary ----------------------------------------------------


class KeyResult(BaseModel):
    label: str
    value: str
    description: str


class PdfCitation(BaseModel):
    section: str
    page: int | None = None
    section_title: str | None = None


class SummaryResult(BaseModel):
    title: str
    authors: str
    abstract: str
    problem_statement: str
    methodology: str
    key_results: list[KeyResult]
    conclusion: str
    citations: list[PdfCitation]


_SUMMARY_PROMPT = (
    "Analyze the attached research paper PDF and produce a structured JSON summary.\n\n"
    "Return the following fields about the paper:\n"
    "1. title - the paper title (use the title on the first page).\n"
    "2. authors - author names.\n"
    "3. abstract - the abstract (or a faithful short summary if none exists).\n"
    "4. problem_statement - the problem the paper addresses, in one or two paragraphs.\n"
    "5. methodology - the methods, model or approach used, in one or two paragraphs.\n"
    "6. key_results - 3 to 6 notable results or claims; each item has 'label' (short "
    "heading, e.g. 'BLEU score'), 'value' (the headline number/outcome), and "
    "'description' (one or two sentences).\n"
    "7. conclusion - the conclusions and main takeaways.\n"
    "8. citations - for each of the above fields, cite where in the paper the "
    "information appears. Each item has 'section' (the field name it supports), "
    "'page' (exact page number in the PDF) and 'section_title' (the paper's section "
    "heading, e.g. 'Attention'). Use the page numbers printed on the pages.\n\n"
    "Keep every prose field plain text. Never invent numbers or details not present "
    "in the paper."
)


def structured_summary(document_id: str, path: Path, language: str = "auto") -> dict[str, Any]:
    client = _get_client()
    pdf_file = _pdf_file(document_id, path)

    response = client.models.generate_content(
        model=DEFAULT_MODEL,
        contents=[
            types.Part.from_uri(file_uri=pdf_file.uri, mime_type=pdf_file.mime_type),
            _SUMMARY_PROMPT,
        ],
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are ResearchLab, an academic research assistant that reads papers and "
                "produces structured, faithful summaries.\n" + _language_prompt(language)
            ),
            response_mime_type="application/json",
            response_schema=SummaryResult,
            temperature=0.2,
        ),
    )
    if response.text is None:
        raise RuntimeError("Gemini returned an empty summary response.")
    return SummaryResult.model_validate_json(response.text).model_dump()


# --- Chat / grounded Q&A ---------------------------------------------------


def chat_answer(
    document_id: str,
    path: Path,
    messages: list[dict[str, Any]],
    web_search: bool = True,
    language: str = "auto",
) -> dict[str, Any]:
    if not messages:
        raise ValueError("'messages' must contain at least one user message.")

    client = _get_client()
    pdf_file = _pdf_file(document_id, path)
    pdf_part = types.Part.from_uri(file_uri=pdf_file.uri, mime_type=pdf_file.mime_type)

    system_instruction = (
        "You are ResearchLab, an academic research assistant that answers precisely and "
        "cites its sources. The attached PDF is the primary source of truth for the "
        "user's question.\n"
        "Cite every claim that comes from the PDF with a reference in the form "
        "[p. PAGE \u00A7SECTION] or [p. PAGE], using the exact page numbers and section "
        "headings visible in the document.\n"
        "If you are not certain about something, say so rather than guessing.\n"
    ) + _language_prompt(language)

    contents: list[types.Content] = []
    first = messages[0]
    contents.append(
        types.Content(
            role="user",
            parts=[pdf_part, types.Part.from_text(text=first.get("content", ""))],
        )
    )
    for message in messages[1:]:
        role = "user" if message.get("role") == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=message.get("content", ""))],
            )
        )

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.3,
    )
    if web_search:
        config.tools = [types.Tool(google_search=types.GoogleSearch())]

    result: dict[str, Any]
    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=contents,
            config=config,
        )
        text = response.text if response.text is not None else "[no response produced]"
        result = _build_answer(response, text)
    except Exception as exc:
        if not web_search or not _is_quota_or_permission_error(exc):
            raise
        # Web search grounding is a paid Gemini feature; the free tier can
        # reject it. Fall back to a PDF-only answer instead of failing.
        config.tools = None
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=contents,
            config=config,
        )
        text = response.text if response.text is not None else "[no response produced]"
        result = _build_answer(response, text)
        result["web_search"] = False
        result["web_search_off_reason"] = str(exc)[:200]

    if web_search and result.get("web_search") is None:
        result["web_search"] = True
    return result


def _build_answer(response: Any, text: str) -> dict[str, Any]:
    return {"text": text, "citations": _collect_citations(response, text)}


_PAGE_RE = re.compile(r"\bp(?:ages?|p)?\.?\s*(\d+)", re.I)
_SECTION_RE = re.compile(r"(?:\u00A7|Sect(?:ion)?\.?)\s*([0-9][0-9a-zA-Z.]*\b)", re.I)


def _is_quota_or_permission_error(exc: Exception) -> bool:
    marker = str(exc) or ""
    code = getattr(exc, "code", None)
    message = getattr(exc, "message", None) or ""
    return (
        code in (429, 403)
        or "RESOURCE_EXHAUSTED" in marker
        or "PERMISSION_DENIED" in marker
        or "RESOURCE_EXHAUSTED" in message
        or "PERMISSION_DENIED" in message
    )


def _parse_pdf_refs(text: str) -> list[dict[str, Any]]:
    refs: list[dict[str, Any]] = []
    for match in re.finditer(r"\[([^\[\]]+)\]", text):
        body = match.group(1).strip()
        if not _PAGE_RE.search(body):
            continue
        pages = [int(page) for page in _PAGE_RE.findall(body)]
        section = None
        section_match = _SECTION_RE.search(body)
        if section_match:
            section = section_match.group(1)
        refs.append(
            {
                "type": "pdf",
                "title": "",
                "url": None,
                "page": pages[0],
                "section": section,
                "snippet": body,
            }
        )
    return refs


def _collect_citations(response: Any, text: str) -> list[dict[str, Any]]:
    citations: list[dict[str, Any]] = []

    grounding = None
    try:
        grounding = response.candidates[0].grounding_metadata
    except Exception:
        grounding = None

    if grounding is not None:
        chunks = grounding.grounding_chunks or []
        supports = grounding.grounding_supports or []
        seen: set[str] = set()
        for support in supports:
            snippet = ""
            if support.segment is not None and support.segment.text:
                snippet = support.segment.text.strip()
            for index in support.grounding_chunk_indices or []:
                if index >= len(chunks):
                    continue
                chunk = chunks[index]
                if chunk.web is None or chunk.web.uri is None:
                    continue
                url = chunk.web.uri
                if url in seen:
                    continue
                seen.add(url)
                citations.append(
                    {
                        "type": "web",
                        "title": chunk.web.title or "",
                        "url": url,
                        "page": None,
                        "section": None,
                        "snippet": snippet,
                    }
                )

    citations.extend(_parse_pdf_refs(text))
    return citations