"""
RealityCheck AI — Explanation Service
Calls Cloudflare Workers AI to generate a structured explanation
using classification results + retrieved evidence.
"""

import json
import re
import httpx
from fastapi import HTTPException

from utils.config import (
    CLOUDFLARE_LLM_URL,
    CLOUDFLARE_API_TOKEN,
    LLM_MAX_TOKENS,
    LLM_TEMPERATURE,
)
from utils.prompts import EXPLANATION_PROMPT


def _extract_explanation_json(text: str) -> dict:
    """Robustly extract JSON from LLM explanation output."""
    # Strip markdown fencing
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                try:
                    return json.loads(part)
                except json.JSONDecodeError:
                    pass

    # Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find outermost braces
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

    # Regex extraction fallback
    expl_match = re.search(r'detailed_explanation["\']?\s*[:=]\s*["\'](.+?)["\']', text, re.DOTALL)
    align_match = re.search(r'evidence_alignment["\']?\s*[:=]\s*["\'](.+?)["\']', text, re.DOTALL)
    return {
        "detailed_explanation": expl_match.group(1) if expl_match else text[:500],
        "key_inconsistencies": [],
        "evidence_alignment": align_match.group(1) if align_match else "",
    }


async def generate_explanation(
    news_text: str,
    classification: dict,
    retrieved_articles: list[dict],
) -> dict:
    """
    Build a detailed explanation using the LLM with retrieved evidence.
    Returns dict with: detailed_explanation, key_inconsistencies, evidence_alignment.
    """
    # Build evidence block
    evidence_parts: list[str] = []
    for i, art in enumerate(retrieved_articles, 1):
        evidence_parts.append(
            f"[{i}] {art['title']} (Source: {art['source']})\n"
            f"    {art['text']}"
        )
    evidence_block = "\n\n".join(evidence_parts) if evidence_parts else "No evidence retrieved."

    prompt = EXPLANATION_PROMPT.format(
        news_text=news_text,
        label=classification["label"],
        confidence=classification["confidence"],
        reasoning_summary=classification["reasoning_summary"],
        evidence_block=evidence_block,
    )

    payload = {
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": LLM_MAX_TOKENS,
        "temperature": LLM_TEMPERATURE,
    }

    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post(CLOUDFLARE_LLM_URL, json=payload, headers=headers)
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Explanation API timed out.")
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Explanation API error: {exc}")

    if resp.status_code == 429:
        raise HTTPException(
            status_code=429,
            detail="Cloudflare AI daily quota exceeded. Try again tomorrow.",
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Cloudflare API returned status {resp.status_code}.",
        )

    try:
        body = resp.json()
        llm_text: str = body["result"]["response"]
    except (KeyError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Unexpected response from Cloudflare API.",
        )

    # Parse JSON from response — robust multi-strategy parser
    llm_text = llm_text.strip()
    result = _extract_explanation_json(llm_text)

    return {
        "detailed_explanation": result.get(
            "detailed_explanation",
            "The system could not generate a detailed explanation at this time.",
        ),
        "key_inconsistencies": result.get("key_inconsistencies", []),
        "evidence_alignment": result.get(
            "evidence_alignment",
            "Evidence alignment could not be determined.",
        ),
    }
