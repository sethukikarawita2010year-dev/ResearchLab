"""ResearchLab paper-grading.

Implements the rubric, the code-computed plagiarism check and the structured
model call that grades a research paper. The model never sums the marks and
never decides the plagiarism score -- both are computed here in code.

The whole grading contract lives in the config objects below so the rubric and
the plagiarism bands can be tuned in one place.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import llm

# --- Rubric (100 marks, whole numbers only) --------------------------------

RUBRIC: list[dict[str, Any]] = [
    {
        "key": "title_abstract_intro",
        "name": "Title, abstract and introduction",
        "max": 10,
        "criteria": "Clear research question and motivation.",
    },
    {
        "key": "literature_review",
        "name": "Literature review",
        "max": 10,
        "criteria": "Relevant, current, and shows the gap.",
    },
    {
        "key": "methodology",
        "name": "Methodology",
        "max": 20,
        "criteria": "Appropriate and reproducible.",
    },
    {
        "key": "results_analysis",
        "name": "Results and analysis",
        "max": 20,
        "criteria": "Accurate and supported by data.",
    },
    {
        "key": "discussion_conclusion",
        "name": "Discussion and conclusion",
        "max": 10,
        "criteria": "Answers the question and notes limitations.",
    },
    {
        "key": "writing_structure",
        "name": "Writing, structure and formatting",
        "max": 10,
        "criteria": "Clarity, structure and consistent formatting.",
    },
    {
        "key": "referencing_citations",
        "name": "Referencing and citations",
        "max": 10,
        "criteria": "Accurate, consistent citation style.",
    },
    {
        "key": "plagiarism",
        "name": "Plagiarism / originality",
        "max": 10,
        "criteria": "Computed from textual similarity, never guessed by the model.",
    },
]

RUBRIC_BY_KEY = {item["key"]: item for item in RUBRIC}

# Similarity percentage -> marks. Ordered high threshold first.
PLAGIARISM_BANDS: list[tuple[float, int]] = [
    (40.0, 0),
    (25.0, 2),
    (15.0, 4),
    (10.0, 6),
    (5.0, 8),
    (0.0, 10),
]

SHINGLE_SIZE = 8
WEB_MAX_SENTENCES = 4
MAX_MATCHES = 5

_REFERENCE_HEADING = re.compile(r"^\s*(?:\d+\.?\s*)?(references|bibliography|works cited)\b", re.I)
_QUOTE_RE = re.compile(r"[\"“”][^\"“”]{0,400}[\"“”]|'[^']{0,400}'")
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
_WORD_RE = re.compile(r"[a-z0-9]+")


def plagiarism_marks(similarity: float) -> int:
    for threshold, marks in PLAGIARISM_BANDS:
        if similarity >= threshold:
            return marks
    return 0


def _page_sections(pdf_text: str) -> list[tuple[int, str]]:
    """Split ``----- PAGE N -----`` text into ``(page, text)`` blocks."""
    blocks = re.split(r"----- PAGE (\d+) -----", pdf_text)
    sections: list[tuple[int, str]] = []
    # blocks = [pre, page1, text1, page2, text2, ...]
    for i in range(1, len(blocks) - 1, 2):
        try:
            page = int(blocks[i])
        except (TypeError, ValueError):
            continue
        sections.append((page, blocks[i + 1]))
    if not sections and pdf_text.strip():
        sections.append((1, pdf_text))
    return sections


def _strip_noise(text: str) -> str:
    """Drop the references list and anything inside quotation marks."""
    lines = text.splitlines()
    kept: list[str] = []
    for line in lines:
        if _REFERENCE_HEADING.match(line):
            break
        kept.append(line)
    return _QUOTE_RE.sub(" ", "\n".join(kept))


def _sentences_with_page(pdf_text: str) -> list[tuple[int, str]]:
    out: list[tuple[int, str]] = []
    for page, text in _page_sections(pdf_text):
        clean = _strip_noise(text)
        for sentence in _SENTENCE_SPLIT.split(clean):
            sentence = re.sub(r"\s+", " ", sentence).strip()
            if len(_WORD_RE.findall(sentence)) >= 5:
                out.append((page, sentence))
    return out


def _shingles(text: str) -> set[tuple[str, ...]]:
    words = _WORD_RE.findall(text.lower())
    if len(words) < SHINGLE_SIZE:
        return set()
    return {tuple(words[i : i + SHINGLE_SIZE]) for i in range(len(words) - SHINGLE_SIZE + 1)}


def _similarity(primary: str, sources: str) -> tuple[float, set[tuple[str, ...]]]:
    base = _shingles(primary)
    if not base:
        return 0.0, set()
    other = _shingles(sources)
    if not other:
        return 0.0, set()
    overlap = base & other
    return (len(overlap) / len(base)) * 100.0, overlap


def _compute_plagiarism(
    primary_text: str,
    docs: list[dict[str, Any]],
    allow_uploads: bool,
    allow_web: bool,
) -> dict[str, Any]:
    """Return ``{assessed, similarity, matches}`` computed purely in code."""
    primary_sentences = _sentences_with_page(primary_text)
    primary_joined = " ".join(s for _, s in primary_sentences)
    source_names: dict[tuple[str, ...], str] = {}

    corpus_parts: list[str] = []
    if allow_uploads and len(docs) > 1:
        for doc in docs[1:]:
            try:
                text = llm._extract_pdf_text(Path(doc["path"]))
            except Exception:  # noqa: BLE001 - a broken comparison doc is skipped
                continue
            clean = _strip_noise(text)
            corpus_parts.append(clean)
            for shingle in _shingles(clean):
                source_names.setdefault(shingle, doc.get("filename") or "Uploaded paper")

    if allow_web and primary_sentences:
        # Choose the most distinctive (longest) sentences and search them.
        candidates = sorted(primary_sentences, key=lambda item: len(item[1]), reverse=True)
        seen: set[str] = set()
        for _, sentence in candidates:
            key = sentence[:60].lower()
            if key in seen:
                continue
            seen.add(key)
            if len(seen) > WEB_MAX_SENTENCES:
                break
            sources = llm.web_search_sources(sentence)
            if not sources:
                continue
            for source in sources:
                snippet = (source.get("snippet") or "").strip()
                if not snippet:
                    continue
                corpus_parts.append(snippet)
                label = source.get("title") or source.get("url") or "Web source"
                for shingle in _shingles(snippet):
                    source_names.setdefault(shingle, f"{label} (web)")

    corpus = "\n".join(corpus_parts)
    similarity, overlap = _similarity(primary_joined, corpus)

    matches: list[dict[str, Any]] = []
    if overlap:
        for page, sentence in primary_sentences:
            shingles = _shingles(sentence)
            hit = shingles & overlap
            if not hit:
                continue
            source = source_names.get(next(iter(hit))) or "Matched source"
            matches.append({"source": source, "page": page, "section": None, "text": sentence})
            if len(matches) >= MAX_MATCHES:
                break
    if not corpus_parts:
        return {"assessed": False, "similarity": 0.0, "matches": []}
    return {"assessed": True, "similarity": round(similarity, 1), "matches": matches}


def _count_sentences(text: str) -> int:
    cleaned = re.sub(r"\[[^\[\]]*\]", " ", text or "")
    parts = [p for p in _SENTENCE_SPLIT.split(cleaned.strip()) if p.strip()]
    return len(parts)


def _valid_citations(citations: list[dict[str, Any]]) -> bool:
    for cit in citations:
        page = cit.get("page")
        if page is not None and (not isinstance(page, int) or page < 1):
            return False
    return True


def grade(
    docs: list[dict[str, Any]],
    aspects: list[str] | None,
    language: str = "auto",
    allow_uploads: bool = False,
    allow_web: bool = False,
) -> dict[str, Any]:
    """Grade a paper against the rubric.

    ``docs`` is the ordered list of attached documents (primary first), each a
    dict ``{id, filename, path}``. ``aspects`` is the list of rubric keys to
    grade (``None`` means all eight). Returns the display-ready payload.
    """
    if not docs:
        raise ValueError("At least one document is required to grade.")

    keys = aspects if aspects else [item["key"] for item in RUBRIC]
    keys = [k for k in keys if k in RUBRIC_BY_KEY]
    if not keys:
        keys = [item["key"] for item in RUBRIC]

    primary_path = Path(docs[0]["path"])
    primary_text = llm._extract_pdf_text(primary_path)

    plagiarism_result = None
    if "plagiarism" in keys:
        plagiarism_result = _compute_plagiarism(primary_text, docs, allow_uploads, allow_web)

    # Describe only the aspects being graded to the model.
    specs = [RUBRIC_BY_KEY[k] for k in keys]

    doc_block = llm._build_doc_block(docs)
    plagiarism_context = ""
    if plagiarism_result is not None:
        if plagiarism_result["assessed"]:
            lines = [
                f"Computed similarity: {plagiarism_result['similarity']}%.",
                "Top matching passages (for your reasoning only):",
            ]
            for match in plagiarism_result["matches"]:
                lines.append(
                    f"- {match['text'][:200]} — {match['source']} (p. {match['page']})"
                )
            plagiarism_context = "\n".join(lines)
        else:
            plagiarism_context = (
                "No comparison sources were available, so the originality of the writing "
                "could not be checked. In exactly two sentences, say that plagiarism could "
                "not be verified because no comparison sources were provided, and comment "
                "on the writing's originality from the text alone. Never invent a similar"
                "ity percentage. Never say you are an AI or refuse the task."
            )

    result = None
    for attempt in range(2):
        try:
            result = llm.grade_aspects(
                doc_block,
                specs,
                language=language,
                plagiarism_context=plagiarism_context,
                documents=docs,
            )
        except Exception:  # noqa: BLE001 - retried once below
            result = None
        if result is not None and _validate_result(result, keys):
            break
        result = None

    if result is None:
        raise RuntimeError("The grading model did not return a valid result.")

    graded_by_key = {item["key"]: item for item in result.get("aspects", [])}

    display: list[dict[str, Any]] = []
    total = 0
    total_max = 0
    for key in keys:
        spec = RUBRIC_BY_KEY[key]
        item = graded_by_key.get(key) or {}
        if key == "plagiarism":
            if plagiarism_result and plagiarism_result["assessed"]:
                marks = plagiarism_marks(plagiarism_result["similarity"])
                max_marks = spec["max"]
                total += marks
                total_max += max_marks
                display.append(
                    {
                        "key": key,
                        "name": spec["name"],
                        "marks": marks,
                        "max": max_marks,
                        "notAssessed": False,
                        "reasoning": (item.get("reasoning") or "").strip(),
                        "citations": item.get("citations") or [],
                        "similarity": plagiarism_result["similarity"],
                        "matches": plagiarism_result["matches"],
                    }
                )
            else:
                display.append(
                    {
                        "key": key,
                        "name": spec["name"],
                        "marks": None,
                        "max": spec["max"],
                        "notAssessed": True,
                        "reasoning": (item.get("reasoning") or "").strip(),
                        "citations": item.get("citations") or [],
                        "similarity": None,
                        "matches": [],
                    }
                )
            continue
        raw_marks = item.get("marks")
        try:
            marks = int(raw_marks)
        except (TypeError, ValueError):
            marks = 0
        marks = max(0, min(spec["max"], marks))
        total += marks
        total_max += spec["max"]
        display.append(
            {
                "key": key,
                "name": spec["name"],
                "marks": marks,
                "max": spec["max"],
                "notAssessed": False,
                "reasoning": (item.get("reasoning") or "").strip(),
                "citations": item.get("citations") or [],
                "similarity": None,
                "matches": [],
            }
        )

    return {
        "aspects": display,
        "total": total,
        "totalMax": total_max,
        "language": language,
        "plagiarism": plagiarism_result,
    }


def _validate_result(result: dict[str, Any], keys: list[str]) -> bool:
    aspects = result.get("aspects")
    if not isinstance(aspects, list):
        return False
    seen = {item.get("key") for item in aspects if isinstance(item, dict)}
    for key in keys:
        if key not in seen:
            return False
    for item in aspects:
        if not isinstance(item, dict):
            return False
        reasoning = item.get("reasoning")
        if not isinstance(reasoning, str) or _count_sentences(reasoning) != 2:
            return False
        spec = RUBRIC_BY_KEY.get(item.get("key"))
        if spec is None:
            continue
        if item.get("key") != "plagiarism":
            marks = item.get("marks")
            if not isinstance(marks, int) or marks < 0 or marks > spec["max"]:
                return False
        if not _valid_citations(item.get("citations") or []):
            return False
    return True
