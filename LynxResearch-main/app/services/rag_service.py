# app/services/rag_service.py

import re
import logging

from app.services.qdrant_service import similarity_search
from app.utils.llm_factory import get_rag_llm
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

logger = logging.getLogger(__name__)


async def chat_with_report(
    run_id: str,
    question: str,
    conversation_history: list[dict],
) -> str:
    """
    RAG chat using Groq — fast, free, no quota issues.

    Pipeline:
    1. Retrieve chunks from Qdrant
    2. Try Groq for a polished answer
    3. If Groq fails → extractive fallback from chunks
    """

    # ── Step 1: Retrieve ──────────────────────────────────────
    chunks = await similarity_search(
        run_id=run_id,
        query=question,
        top_k=8,
    )

    logger.info(
        f"[RAG] {len(chunks)} chunks | "
        f"run={run_id[:8]} | "
        f"q={question!r}"
    )

    if not chunks:
        return (
            "I couldn't find relevant content in this report for your question. "
            "Try rephrasing or asking about a topic covered in the report."
        )

    # ── Step 2: Try Groq ──────────────────────────────────────
    groq_answer = await _call_groq(question, chunks, conversation_history)
    if groq_answer:
        return groq_answer

    # ── Step 3: Extractive fallback ───────────────────────────
    logger.info("[RAG] Groq unavailable — extractive fallback")
    return _extractive_answer(question, chunks)


async def _call_groq(
    question: str,
    chunks: list[dict],
    conversation_history: list[dict],
) -> str | None:
    """Single Groq call. Returns None on any failure."""
    try:
        llm     = get_rag_llm(temperature=0.2)
        context = _build_context(chunks)

        messages = [
            SystemMessage(content=(
                "You are a research assistant. Answer questions using the "
                "provided report excerpts. Be specific, cite excerpts by "
                "number, and supplement with general knowledge if needed. "
                "Never refuse to answer."
            ))
        ]

        # Last 2 turns of history
        for turn in conversation_history[-2:]:
            role    = turn.get("role", "")
            content = turn.get("content", "")
            if not content:
                continue
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=(
            f"Report excerpts:\n\n{context}\n\n"
            f"---\n\nQuestion: {question}"
        )))

        response = await llm.ainvoke(messages)
        answer   = response.content.strip()
        if answer:
            logger.info(f"[RAG] Groq answer: {len(answer)} chars")
        return answer if answer else None

    except Exception as e:
        logger.warning(f"[RAG] Groq failed: {e}")
        return None


def _extractive_answer(question: str, chunks: list[dict]) -> str:
    """
    Builds answer directly from chunks — no LLM needed.
    Scores sentences by keyword overlap with question.
    """
    question_words = set(
        w.lower() for w in re.findall(r"\b\w{4,}\b", question)
    )

    scored: list[tuple[float, str, str]] = []

    for chunk in chunks:
        text   = chunk.get("chunk_text", "")
        source = chunk.get("url", "")
        if not text:
            continue
        sentences = re.split(r"(?<=[.!?])\s+", text)
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 40:
                continue
            s_words = set(w.lower() for w in re.findall(r"\b\w{4,}\b", sentence))
            overlap = len(question_words & s_words)
            boost   = 1.2 if any(
                w in sentence.lower()[:50] for w in question_words
            ) else 1.0
            score = (overlap / max(len(question_words), 1)) * boost
            scored.append((score, sentence, source))

    if not scored:
        return _top_chunks_fallback(chunks)

    scored.sort(key=lambda x: x[0], reverse=True)
    top = _deduplicate(scored[:12])[:5]

    if not top or top[0][0] < 0.1:
        return _top_chunks_fallback(chunks)

    lines         = ["**Based on the research report:**\n"]
    seen_sources: set[str] = set()

    for _, sentence, source in top:
        lines.append(f"- {sentence}")
        if source:
            seen_sources.add(source)

    if seen_sources:
        lines.append(
            f"\n*Sources: "
            f"{', '.join(_short_url(s) for s in seen_sources)}*"
        )

    lines.append(
        "\n*Note: This answer was assembled directly from report excerpts.*"
    )
    return "\n".join(lines)


def _top_chunks_fallback(chunks: list[dict]) -> str:
    parts = []
    for chunk in chunks[:2]:
        text = chunk.get("chunk_text", "").strip()
        if text:
            parts.append(text[:500])
    if not parts:
        return "No relevant content found in the report for this question."
    return (
        "**Most relevant section from the report:**\n\n"
        + "\n\n".join(parts)
    )


def _deduplicate(
    scored: list[tuple[float, str, str]]
) -> list[tuple[float, str, str]]:
    selected = []
    for item in scored:
        s = item[1].lower()
        if not any(_jaccard(s, x[1].lower()) > 0.6 for x in selected):
            selected.append(item)
    return selected


def _jaccard(a: str, b: str) -> float:
    wa = set(a.split())
    wb = set(b.split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks):
        text   = c.get("chunk_text", "").strip()
        source = c.get("url", "")
        score  = c.get("score", 0.0)
        if text:
            parts.append(
                f"[Excerpt {i+1} | score={score:.3f} | {source}]\n{text}"
            )
    return "\n\n---\n\n".join(parts)


def _short_url(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return url[:40]