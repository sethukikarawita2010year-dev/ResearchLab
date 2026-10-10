"""OpenAI integration for ResearchLab.

Provides the two AI capabilities behind the Research chat:

- ``structured_summary``  -> five-section "extraction card" content.
- ``chat_answer``        -> grounded Q&A with optional web search and
                            language control (auto / english / sinhala / tamil).

The uploaded PDF is read locally (pymupdf) and its text, split page-by-page
with ``----- PAGE N -----`` markers, is sent to the model as plain text -- no
file-upload or retrieval APIs are needed. Because the full paper text is
prepended to every request, OpenAI's automatic prompt caching makes later turns
in a conversation read those tokens at the discounted cached rate while the
model still has the whole paper available at any point.

Web search prefers a self-hosted SearXNG (free, no API key). When SearXNG is
not reachable and ``OPENAI_NATIVE_SEARCH=1``, it uses OpenAI's built-in
``web_search_preview`` tool instead; if that is rejected (billing/permission)
it returns a PDF-only answer with ``web_search`` set to false.

Keys are read from the environment (backend/.env): ``OPENAI_API_KEY``,
``OPENAI_MODEL`` (default gpt-4.1), ``OPENAI_FALLBACK_MODEL``, and
``SEARXNG_URL`` (default http://localhost:8080).
"""

from __future__ import annotations

import json
import os
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    NotFoundError,
    OpenAI,
    PermissionDeniedError,
    RateLimitError,
)
from pydantic import BaseModel

load_dotenv()

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1")
FALLBACK_MODEL = os.getenv("OPENAI_FALLBACK_MODEL", "").strip() or None

# Retries on transient model/API errors (high-demand 5xx, rate limits, etc.).
OPENAI_MAX_RETRIES = int(os.getenv("OPENAI_MAX_RETRIES", "4"))
OPENAI_RETRY_BASE_DELAY = float(os.getenv("OPENAI_RETRY_BASE_DELAY", "2.0"))

# When SearXNG is unreachable, use OpenAI's paid built-in web search tool.
OPENAI_NATIVE_SEARCH = os.getenv("OPENAI_NATIVE_SEARCH", "1").strip().lower() in (
    "1",
    "true",
    "yes",
)

# Self-hosted SearXNG endpoint used for free web grounding (no API key required).
SEARXNG_URL = os.getenv("SEARXNG_URL", "http://localhost:8080").rstrip("/")
SEARXNG_TIMEOUT = float(os.getenv("SEARXNG_TIMEOUT", "6"))
SEARXNG_RESULTS = int(os.getenv("SEARXNG_RESULTS", "6"))
SEARXNG_SNIPPET_MAX = int(os.getenv("SEARXNG_SNIPPET_MAX", "600"))

# Hard cap on how much extracted paper text is sent to the model (roughly
# 4 chars/token for English), so pathological PDFs cannot blow up the prompt.
OPENAI_PDF_TEXT_MAX_CHARS = int(os.getenv("OPENAI_PDF_TEXT_MAX_CHARS", "400000"))

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set. Add it to backend/.env")
        _client = OpenAI(api_key=api_key)
    return _client


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


# --- PDF text extraction ---------------------------------------------------


def _extract_pdf_text(path: Path) -> str:
    """Read the PDF locally and return its text split by page markers.

    Page markers keep the printed page numbers visible to the model so the
    ``[p. PAGE \u00A7SECTION]`` citation scheme keeps working.
    """
    try:
        import pymupdf as fitz  # pymupdf (fitz backend)
    except ImportError:
        raise RuntimeError("pymupdf is required to read PDFs. Install the backend requirements.")
    if not path.exists():
        raise RuntimeError(f"PDF file not found: {path}")

    blocks: list[str] = []
    total = 0
    limit = max(1, OPENAI_PDF_TEXT_MAX_CHARS)
    with fitz.open(str(path)) as doc:
        for page_index, page in enumerate(doc, start=1):
            page_text = page.get_text().strip()
            if not page_text:
                continue
            block = f"\n\n----- PAGE {page_index} -----\n{page_text}"
            if total + len(block) > limit:
                remaining = limit - total
                if remaining > 0:
                    blocks.append(block[:remaining])
                break
            blocks.append(block)
            total += len(block)

    text = "".join(blocks).strip()
    if not text:
        raise RuntimeError(
            "Could not extract text from this PDF. It may be a scanned/image-only document."
        )
    return text


# --- Web search (self-hosted SearXNG) --------------------------------------


def web_search_sources(question: str) -> list[dict[str, Any]] | None:
    """Search the web through a self-hosted SearXNG instance (no API key).

    Returns a list of source dicts (``type``/``title``/``url``/``snippet``/...)
    shaped for the citations panel, or ``None`` when SearXNG cannot be reached
    so callers can fall back to OpenAI's built-in web search tool instead.
    """
    query = urllib.parse.quote((question or "").strip())
    if not query:
        return []
    endpoint = f"{SEARXNG_URL}/search?q={query}&format=json"
    request = urllib.request.Request(endpoint, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=SEARXNG_TIMEOUT) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    sources: list[dict[str, Any]] = []
    for item in payload.get("results") or []:
        title = str(item.get("title") or "").strip()
        url = str(item.get("url") or "").strip()
        if not title or not url:
            continue
        snippet = str(item.get("content") or item.get("snippet") or "").strip()
        sources.append(
            {
                "type": "web",
                "title": title,
                "url": url,
                "page": None,
                "section": None,
                "snippet": snippet[:SEARXNG_SNIPPET_MAX],
            }
        )
        if len(sources) >= SEARXNG_RESULTS:
            break
    return sources


def _last_user_question(messages: list[dict[str, Any]]) -> str:
    for message in reversed(messages):
        if message.get("role") == "user":
            return message.get("content", "")
    return ""


def _web_context(sources: list[dict[str, Any]]) -> str:
    lines = [
        "Web search results for your reference. Use them only when they genuinely help; "
        "prefer the paper text whenever it covers the topic, and mark any claim you take "
        "from the web with its source title and URL:"
    ]
    for index, source in enumerate(sources, start=1):
        lines.append(f"{index}. {source['title']}\n   URL: {source['url']}")
        if source.get("snippet"):
            lines.append(f"   {source['snippet']}")
    return "\n".join(lines)


def _merge_citations(
    citations: list[dict[str, Any]], web_sources: list[dict[str, Any]], text: str
) -> list[dict[str, Any]]:
    """Attach only the web sources the answer actually references.

    A SearXNG result is only surfaced as a citation when the generated text
    cites it by its listed number (``[n]``) or by its URL, so the Sources tab
    never shows pages that merely helped the model shape its reply.
    """
    merged = list(citations)
    seen = {c.get("url") for c in merged if c.get("url")}
    for index, source in enumerate(web_sources, start=1):
        url = source.get("url")
        if not url or url in seen:
            continue
        marker = f"[{index}]"
        if marker not in text and url not in text:
            continue
        seen.add(url)
        merged.append({**source, "marker": index})
    return merged


# --- Retry / error helpers -------------------------------------------------


def _is_transient_error(exc: Exception, retry_quota: bool = True) -> bool:
    """True when retrying the call could plausibly succeed.

    ``retry_quota=False`` treats 429 as final so callers that deliberately
    expect quota rejection (e.g. OpenAI's paid web search on a restricted
    account) fall back immediately instead of waiting out the retries.
    """
    if isinstance(exc, RateLimitError):
        return retry_quota
    if isinstance(exc, APIConnectionError):
        return True
    if isinstance(exc, APIStatusError):
        status = exc.status_code
        return status in (500, 502, 503, 504) or (retry_quota and status == 429)
    marker = str(exc).lower()
    return any(
        token in marker
        for token in ("unavailable", "overloaded", "high demand", "timeout", "timed out")
    )


def _is_quota_or_permission_error(exc: Exception) -> bool:
    if isinstance(exc, APIStatusError):
        return exc.status_code in (401, 403, 429)
    if isinstance(exc, (AuthenticationError, PermissionDeniedError)):
        return True
    marker = str(exc) or ""
    upper = marker.upper()
    return any(
        token in upper
        for token in ("RESOURCE_EXHAUSTED", "PERMISSION_DENIED", "RATE LIMIT", "QUOTA", "401", "403")
    )


def _retry_responses(
    client: OpenAI,
    *,
    model: str,
    kind: str = "create",
    retry_quota: bool = True,
    **kwargs: Any,
) -> Any:
    """Call ``client.responses.<kind>`` retrying transient errors with backoff.

    ``kind`` is "create" for open-ended answers or "parse" for structured
    outputs. On a model-not-found error it tries ``OPENAI_FALLBACK_MODEL`` once.
    """
    method = getattr(client.responses, kind, None)
    if method is None:
        raise RuntimeError(
            f"Installed openai SDK has no client.responses.{kind}; upgrade the openai package."
        )
    attempts = max(1, OPENAI_MAX_RETRIES)
    used_fallback = False
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return method(model=model, **kwargs)
        except Exception as exc:
            last_exc = exc
            if isinstance(exc, NotFoundError) and FALLBACK_MODEL and not used_fallback:
                used_fallback = True
                model = FALLBACK_MODEL
                continue
            if not _is_transient_error(exc, retry_quota=retry_quota) or attempt >= attempts:
                raise
            time.sleep(OPENAI_RETRY_BASE_DELAY * (2 ** (attempt - 1)))
    assert last_exc is not None
    raise last_exc


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
    "Analyze the research paper and produce a structured summary.\n\n"
    "The paper's text (split by page markers) is provided as the user input. "
    "Return the following fields:\n"
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
    "Formatting rules:\n"
    "- Embed an inline citation in the form [p. PAGE \u00A7SECTION] or [p. PAGE] directly "
    "next to each claim inside the prose fields (abstract, problem_statement, "
    "methodology, conclusion, and inside every key_result description). Use the printed "
    "page numbers.\n"
    "- Where a list reads better than a paragraph, use short markdown bullet points "
    "('- item'), for example in key_results descriptions and takeaways.\n"
    "- Keep the prose fields plain text otherwise (no markdown headings). Never invent "
    "numbers or details not present in the paper."
)


def structured_summary(document_id: str, path: Path, language: str = "auto") -> dict[str, Any]:
    """Produce the five-section structured summary. ``document_id`` is kept for
    interface compatibility with callers (OpenAI needs no file handles)."""
    client = _get_client()
    pdf_text = _extract_pdf_text(path)

    response = _retry_responses(
        client,
        model=DEFAULT_MODEL,
        kind="parse",
        input=[{"role": "user", "content": pdf_text}],
        instructions=_SUMMARY_PROMPT + "\n\n" + _language_prompt(language),
        text_format=SummaryResult,
    )
    parsed = getattr(response, "output_parsed", None)
    if parsed is None:
        raise RuntimeError("OpenAI returned an empty summary response.")
    return parsed.model_dump()


# --- Chat / grounded Q&A ---------------------------------------------------

# Per-chat OpenAI thread state. ``chat_id`` -> {response_id, docs}. The
# response id lets later turns continue the stored thread (``previous_response_id``)
# so the full paper text is sent to the API exactly once, at the start of the chat.
CHAT_STATE: dict[str, dict[str, Any]] = {}


def _build_doc_block(documents: list[dict[str, Any]]) -> str:
    """Combine the extracted text of one or several PDFs.

    A single PDF keeps the familiar ``----- PAGE N -----`` markers so
    ``[p. N \u00A7S]`` citations work unchanged. Extra documents are wrapped in
    ``===== DOCUMENT i: name =====`` headers so the model (and the citation
    parser) can tell them apart.
    """
    if not documents:
        return ""
    texts = [_extract_pdf_text(Path(doc["path"])) for doc in documents]
    if len(documents) == 1:
        return texts[0]
    sections: list[str] = []
    for index, (doc, text) in enumerate(zip(documents, texts), start=1):
        name = doc.get("filename") or f"document {index}.pdf"
        sections.append(f"\n\n===== DOCUMENT {index}: {name} =====\n{text}")
    return "".join(sections).strip()


def _save_thread(chat_id: str | None, doc_ids: tuple[str, ...], response_id: str) -> None:
    if not chat_id:
        return
    CHAT_STATE[chat_id] = {"response_id": response_id, "docs": doc_ids}


def _build_input(
    messages: list[dict[str, Any]],
    pdf_text: str,
    web_sources: list[dict[str, Any]] | None,
) -> list[dict[str, str]]:
    """Build the Responses-API input list.

    The paper text is prepended to the first user turn (so the model always has
    the full document available, however deep into the conversation we are).
    SearXNG web context is folded into the trailing user message so the roles
    keep alternating.
    """
    turns: list[dict[str, str]] = []
    first = messages[0]
    segments: list[str] = []
    if pdf_text:
        segments.append(pdf_text)
    segments.append(f"User question:\n{first.get('content', '')}")
    turns.append({"role": "user", "content": "\n\n".join(segments)})

    for message in messages[1:]:
        role = "user" if message.get("role") == "user" else "assistant"
        turns.append({"role": role, "content": message.get("content", "")})

    if web_sources:
        context = _web_context(web_sources)
        for index in range(len(turns) - 1, -1, -1):
            if turns[index]["role"] == "user":
                turns[index]["content"] = f"{turns[index]['content']}\n\n{context}"
                break
    return turns


_PAGE_RE = re.compile(r"\bp(?:ages?|p)?\.?\s*(\d+)", re.I)
_SECTION_RE = re.compile(r"(?:\u00A7|Sect(?:ion)?\.?)\s*([0-9][0-9a-zA-Z.]*\b)", re.I)


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


def _collect_web_callouts(response: Any) -> list[dict[str, Any]]:
    """Extract citations from the OpenAI built-in ``web_search_preview`` tool."""
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    try:
        items = response.output or []
    except Exception:
        items = []
    for item in items:
        try:
            if getattr(item, "type", None) != "web_search_callout":
                continue
            url = getattr(item, "uri", None) or getattr(item, "name", None)
        except Exception:
            continue
        if not url or url in seen:
            continue
        seen.add(url)
        title = getattr(item, "title", None) or getattr(item, "name", "") or ""
        out.append(
            {
                "type": "web",
                "title": title,
                "url": url,
                "page": None,
                "section": None,
                "snippet": "",
            }
        )
    return out


def _build_answer(response: Any, text: str) -> dict[str, Any]:
    citations = _collect_web_callouts(response) + _parse_pdf_refs(text)
    return {"text": text, "citations": citations}


def chat_answer(
    document_id: str,
    path: Path,
    messages: list[dict[str, Any]],
    web_search: bool = True,
    language: str = "auto",
    chat_id: str | None = None,
    documents: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Grounded Q&A over extracted PDFs, with optional web grounding.

    The paper text is attached to the conversation exactly once: the first turn
    of a chat builds a stored Responses-API thread (``store=True``) and later
    turns with the same ``chat_id`` and the same set of documents continue that
    thread via ``previous_response_id``, so the PDF is never re-sent. If the
    set of attached documents changes, the thread is rebuilt automatically.

    ``document_id``/``path`` name the primary document (kept for interface
    compatibility); ``documents`` may carry the full list of attached PDFs.
    """
    if not messages:
        raise ValueError("'messages' must contain at least one user message.")

    docs = documents or [{"id": document_id, "filename": path.name, "path": path}]
    doc_ids = tuple(sorted(d["id"] for d in docs))

    state = CHAT_STATE.get(chat_id) if chat_id else None
    preload = bool(state and state.get("response_id") and state.get("docs") == doc_ids)
    pdf_text = "" if preload else _build_doc_block(docs)

    client = _get_client()

    multi_doc_note = ""
    if len(docs) > 1:
        primary_name = docs[0].get("filename", "")
        multi_doc_note = (
            f"The user has {len(docs)} papers attached. '{primary_name}' is the primary "
            "document; cite it as [p. PAGE \u00A7SECTION]. For claims taken from another "
            "attached document, include its filename in the bracket, e.g. "
            "[p. 4 \u00A73 - other.pdf].\n"
        )

    system_instruction = (
        "You are ResearchLab, a friendly academic research assistant.\n"
        "Answer in plain, accessible language; explain technical ideas simply without "
        "dumbing them down.\n"
        "Use bullet points or short numbered lists whenever lists make the answer easier "
        "to scan.\n"
        "Generally keep answers medium-length (concise but complete); write a long, "
        "detailed answer only when the user explicitly asks for one.\n"
        "The text you are given is the content of the user's research paper(s), extracted "
        "page by page; it is the primary source of truth for the user's question.\n"
        + multi_doc_note
        + "Cite every claim that comes from a paper with a reference in the form "
        "[p. PAGE \u00A7SECTION] or [p. PAGE], using the printed page numbers (the text is "
        "split with '----- PAGE N -----' markers).\n"
        "If you are not certain about something, say so rather than guessing.\n"
    ) + _language_prompt(language)

    use_native_search = False
    web_sources: list[dict[str, Any]] | None = None
    web_error: str | None = None
    if web_search:
        question = _last_user_question(messages)
        web_sources = web_search_sources(question)
        if web_sources is None:
            # SearXNG is not reachable; fall back to OpenAI's web search tool.
            if OPENAI_NATIVE_SEARCH:
                use_native_search = True
                web_error = "SearXNG unreachable"
            else:
                web_error = "SearXNG unreachable (native OpenAI search disabled)"

    def build_input() -> list[dict[str, str]]:
        if preload:
            content = _last_user_question(messages)
            if web_sources and not use_native_search:
                content = f"{content}\n\n{_web_context(web_sources)}"
            return [{"role": "user", "content": content}]
        return _build_input(messages, pdf_text, web_sources if not use_native_search else None)

    result: dict[str, Any]
    chain_kwargs: dict[str, Any] = (
        {"previous_response_id": state["response_id"]} if preload else {}
    )
    try:
        response = _retry_responses(
            client,
            model=DEFAULT_MODEL,
            kind="create",
            input=build_input(),
            retry_quota=not use_native_search,
            instructions=system_instruction,
            store=True,
            **chain_kwargs,
            **({"tools": [{"type": "web_search_preview"}]} if use_native_search else {}),
        )
        text = getattr(response, "output_text", None) or "[no response produced]"
        result = _build_answer(response, text)
        _save_thread(chat_id, doc_ids, response.id)
        if use_native_search:
            result["web_search"] = True
        elif web_search:
            result["web_search"] = True
            if web_sources:
                result["citations"] = _merge_citations(result.get("citations", []), web_sources, text)
    except Exception as exc:
        if not use_native_search or not _is_quota_or_permission_error(exc):
            raise
        # OpenAI's built-in web search needs paid access; fall back to a
        # PDF-only answer (with SearXNG context when we actually have it) instead
        # of failing the turn.
        try:
            response = _retry_responses(
                client,
                model=DEFAULT_MODEL,
                kind="create",
                input=build_input(),
                retry_quota=True,
                instructions=system_instruction,
                store=True,
                **chain_kwargs,
            )
            text = getattr(response, "output_text", None) or "[no response produced]"
            result = _build_answer(response, text)
            _save_thread(chat_id, doc_ids, response.id)
        except Exception as inner_exc:
            raise inner_exc
        result["web_search"] = False
        prefix = f"{web_error}; " if web_error else ""
        result["web_search_off_reason"] = prefix + f"OpenAI web search: {str(exc)[:200]}"

    if web_search is False:
        result["web_search"] = False
    return result