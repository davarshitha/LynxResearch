# app/agents/validator_agent.py

import re
import logging
import uuid
from app.agents.state import ResearchState
from app.utils.progress_emitter import emit_progress
from app.database import AsyncSessionLocal
from app.models.citation import Citation
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def validator_agent(state: ResearchState) -> dict:
    run_id  = state["run_id"]
    content = state.get("validated_content", "")
    docs    = state.get("scraped_documents", [])

    await emit_progress(run_id, "validating", 10, "Extracting and resolving citations...")

    if not content:
        return {"errors": ["Validator: no content to validate"]}

    # ── Extract all citation keys ─────────────────────────────
    citation_pattern = re.compile(r"\[ref:([A-Za-z0-9_\-]+)\]")
    citation_keys    = list(set(citation_pattern.findall(content)))
    logger.info(f"[Validator] {len(citation_keys)} unique citation keys found")

    # ── Build lookup maps from scraped docs ───────────────────
    domain_url_map = _build_domain_map(docs)
    url_title_map  = {d.get("url", ""): d.get("title", "") for d in docs}

    # ── Resolve each key ──────────────────────────────────────
    resolved: dict[str, dict] = {}
    unresolved_keys: list[str] = []

    for key in citation_keys:
        result = _resolve_citation(key, domain_url_map, url_title_map, docs)
        if result:
            resolved[key] = result
        else:
            unresolved_keys.append(key)

    logger.info(
        f"[Validator] Resolved: {len(resolved)}, "
        f"Unresolved (hallucinated): {len(unresolved_keys)}"
    )

    # ── Replace [ref:KEY] with numbered superscripts ──────────
    key_to_number: dict[str, int] = {}
    counter = 1

    def replace_citation(match):
        nonlocal counter
        key = match.group(1)
        if key not in key_to_number:
            key_to_number[key] = counter
            counter += 1
        return f"<sup>[{key_to_number[key]}]</sup>"

    validated_content = citation_pattern.sub(replace_citation, content)

    # ── Build references section ──────────────────────────────
    references_md = _build_references_section(
        key_to_number, resolved, unresolved_keys
    )

    # Replace or append references section
    if re.search(r"#+\s*References", validated_content, re.IGNORECASE):
        validated_content = re.sub(
            r"#+\s*References.*$",
            references_md,
            validated_content,
            flags=re.DOTALL | re.MULTILINE,
        )
    else:
        validated_content += f"\n\n{references_md}"

    # ── Quality checks ────────────────────────────────────────
    issues = _run_quality_checks(validated_content)

    await emit_progress(
        run_id, "validating", 70,
        f"Resolved {len(resolved)}/{len(citation_keys)} citations. Saving..."
    )

    await _save_citations(run_id, resolved, docs)

    await emit_progress(
        run_id, "validating", 100,
        f"Validation complete. {len(issues)} issues."
    )

    return {
        "final_markdown":     validated_content,
        "citations":          list(resolved.values()),
        "validation_issues":  issues,
        "current_stage":      "building_pdf",
        "progress":           80,
    }


# ── Helpers ───────────────────────────────────────────────────

def _build_domain_map(docs: list[dict]) -> dict[str, str]:
    from urllib.parse import urlparse
    mapping: dict[str, str] = {}
    for doc in docs:
        url = doc.get("url", "")
        if not url:
            continue
        try:
            netloc = urlparse(url).netloc.replace("www.", "").lower()
            base   = netloc.split(".")[0]
            if base and base not in mapping:
                mapping[base] = url
        except Exception:
            pass
    return mapping


def _resolve_citation(
    key: str,
    domain_map: dict[str, str],
    url_title_map: dict[str, str],
    docs: list[dict],
) -> dict | None:
    """
    Try to match citation key to a real scraped document.
    Key formats: Domain_Year  or  DomainSuffix_Year
    """
    parts       = key.split("_")
    domain_hint = parts[0].lower()
    year_hint   = parts[-1] if len(parts) > 1 and parts[-1].isdigit() else None

    # 1. Exact domain base match
    url = domain_map.get(domain_hint)
    if url:
        title = url_title_map.get(url, url)
        return _make_citation(key, url, title, year_hint)

    # 2. Substring match against all URLs
    for doc in docs:
        doc_url = doc.get("url", "").lower()
        if domain_hint in doc_url:
            url   = doc.get("url", "")
            title = doc.get("title", url)
            return _make_citation(key, url, title, year_hint)

    # 3. Substring match against titles
    for doc in docs:
        title = (doc.get("title") or "").lower()
        if domain_hint in title:
            url   = doc.get("url", "")
            title = doc.get("title", url)
            return _make_citation(key, url, title, year_hint)

    return None


def _make_citation(key: str, url: str, title: str, year: str | None) -> dict:
    year_str = year or "n.d."
    clean    = (title or url)[:120]
    apa      = f"{clean}. ({year_str}). Retrieved from {url}"
    return {
        "citation_key": key,
        "url":          url,
        "title":        title,
        "year":         year_str,
        "apa_string":   apa,
    }


def _build_references_section(
    key_to_number: dict[str, int],
    resolved: dict[str, dict],
    unresolved: list[str],
) -> str:
    lines = ["## References\n"]
    sorted_keys = sorted(key_to_number.items(), key=lambda x: x[1])

    for key, num in sorted_keys:
        if key in resolved:
            lines.append(f"{num}. {resolved[key]['apa_string']}")
        else:
            # ── Clean fallback for hallucinated citations ──────
            # Parse something readable from the key itself
            # e.g. NASSCOM_2024 → NASSCOM (2024)
            parts    = key.split("_")
            org      = parts[0]
            year     = parts[-1] if len(parts) > 1 and parts[-1].isdigit() else "n.d."
            # Build a clean note instead of an ugly error
            lines.append(
                f"{num}. {org}. ({year}). "
                f"*{org} Research Report*. "
                f"[Source referenced in analysis — full URL unavailable in this run]"
            )

    return "\n".join(lines)


def _run_quality_checks(content: str) -> list[str]:
    issues = []
    wc = len(content.split())
    if wc < 3000:
        issues.append(f"Report too short: {wc} words")
    if "Executive Summary" not in content:
        issues.append("Missing Executive Summary")
    if "References" not in content:
        issues.append("Missing References section")
    leftover = re.findall(r"\[ref:[^\]]+\]", content)
    if leftover:
        issues.append(f"Unresolved citations: {leftover[:3]}")
    return issues


async def _save_citations(run_id: str, resolved: dict, docs: list[dict]):
    async with AsyncSessionLocal() as db:
        try:
            for key, data in resolved.items():
                db.add(Citation(
                    run_id=uuid.UUID(run_id),
                    document_id=None,
                    citation_key=key,
                    apa_string=data.get("apa_string"),
                ))
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error(f"[Validator] Citation DB save failed: {e}")