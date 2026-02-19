"""
RealityCheck AI — Classifier Service
Calls Cloudflare Workers AI (Mistral-7B-Instruct-v0.2) to classify news.
"""

import json
import httpx
from fastapi import HTTPException

from utils.config import (
    CLOUDFLARE_LLM_URL,
    CLOUDFLARE_API_TOKEN,
    LLM_MAX_TOKENS,
    LLM_TEMPERATURE,
)
from utils.prompts import CLASSIFICATION_PROMPT
import re


def _extract_json(raw: str) -> dict:
    """Try multiple strategies to extract a JSON object from LLM output."""
    text = raw.strip()

    # Strategy 1: strip markdown fencing
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

    # Strategy 2: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 3: find JSON objects with regex
    matches = re.findall(r'\{[^{}]*\}', text)
    for m in matches:
        try:
            return json.loads(m)
        except json.JSONDecodeError:
            pass

    # Strategy 4: find outermost braces
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

    # Strategy 5: manually extract fields with regex
    label_match = re.search(
        r'["\']?label["\']?\s*[:=]\s*["\']?(Real|Fake|Misleading)',
        text, re.IGNORECASE,
    )
    conf_match = re.search(r'["\']?confidence["\']?\s*[:=]\s*([0-9.]+)', text)
    reason_match = re.search(
        r'["\']?reasoning_summary["\']?\s*[:=]\s*["\'](.+?)["\']', text,
    )

    if label_match:
        return {
            "label": label_match.group(1).capitalize(),
            "confidence": float(conf_match.group(1)) if conf_match else 0.5,
            "reasoning_summary": (
                reason_match.group(1) if reason_match
                else "Extracted from non-standard response."
            ),
        }

    raise HTTPException(
        status_code=502,
        detail=f"LLM returned non-JSON response. Raw: {text[:300]}",
    )


async def classify_news(news_text: str) -> dict:
    """
    Send the news text to Mistral-7B via Cloudflare Workers AI and return
    a dict with keys: label, confidence, reasoning_summary.
    """
    prompt = CLASSIFICATION_PROMPT.format(news_text=news_text)

    payload = {
        "messages": [
            {"role": "user", "content": prompt}
        ],
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
            raise HTTPException(status_code=504, detail="LLM API request timed out.")
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"LLM API error: {exc}")

    if resp.status_code == 429:
        raise HTTPException(
            status_code=429,
            detail="Cloudflare AI daily quota exceeded. Please try again tomorrow.",
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Cloudflare API returned status {resp.status_code}: {resp.text[:300]}",
        )

    # Parse Cloudflare response → extract LLM text
    try:
        body = resp.json()
        llm_text: str = body["result"]["response"]
    except (KeyError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Unexpected response structure from Cloudflare API.",
        )

    # Extract JSON from LLM text — robust multi-strategy parser
    result = _extract_json(llm_text)

    # Validate & normalise
    label = result.get("label", "Misleading")
    if label not in ("Real", "Fake", "Misleading"):
        label = "Misleading"

    confidence = result.get("confidence", 0.5)
    try:
        confidence = float(confidence)
        confidence = max(0.0, min(1.0, confidence))
    except (ValueError, TypeError):
        confidence = 0.5

    return {
        "label": label,
        "confidence": round(confidence, 2),
        "reasoning_summary": result.get("reasoning_summary", "No reasoning provided."),
    }
