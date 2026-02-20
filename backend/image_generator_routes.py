"""
AI Image Generator routes.
Provides a lightweight endpoint to generate images from text prompts.
"""

from __future__ import annotations

import base64
import io
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image

router = APIRouter(prefix="/api/image", tags=["image-generator"])

HF_API_KEY = os.getenv("HF_API_KEY")
# Prioritized free/default HF models to try (in order).
HF_FALLBACK_MODELS = [
    "runwayml/stable-diffusion-v1-5",
    "stabilityai/stable-diffusion-2-1",
    "nitrosocke/anything-midjourney-v6",
]


class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None


@router.post("/generate")
async def generate_image(payload: GenerateRequest):
    prompt = (payload.prompt or "").strip()
    negative_prompt = (payload.negative_prompt or "").strip()
    if len(prompt) < 3:
        raise HTTPException(status_code=400, detail="Prompt is too short.")

    if not HF_API_KEY:
        raise HTTPException(status_code=503, detail="HF_API_KEY is not configured.")

    headers = {"Authorization": f"Bearer {HF_API_KEY}"}

    async def request_model(model_id: str):
        endpoint = f"https://api-inference.huggingface.co/models/{model_id}"
        request_body = {"inputs": prompt}
        if negative_prompt:
            request_body["parameters"] = {"negative_prompt": negative_prompt}
        async with httpx.AsyncClient(timeout=30.0) as client:
            return await client.post(endpoint, headers=headers, json=request_body)

    try:
        attempts = []
        for candidate in HF_FALLBACK_MODELS:
            resp = await request_model(candidate)
            attempts.append((candidate, resp.status_code))

            if resp.status_code == 503:
                raise HTTPException(status_code=503, detail="Model is warming up. Please retry in a moment.")
            if resp.status_code in {401, 403}:
                raise HTTPException(status_code=502, detail="Model access denied. Check HF token permissions.")
            if resp.status_code >= 400:
                # try next candidate
                continue

            content_type = resp.headers.get("content-type", "")
            if "application/json" in content_type:
                data = resp.json()
                if isinstance(data, dict) and data.get("error"):
                    continue
                continue

            image_bytes = resp.content
            if not image_bytes:
                continue

            try:
                img = Image.open(io.BytesIO(image_bytes))
                width, height = img.size
            except Exception:
                width, height = None, None

            encoded = base64.b64encode(image_bytes).decode("ascii")
            return {
                "image_base64": encoded,
                "content_type": content_type or "image/png",
                "width": width,
                "height": height,
                "model": candidate,
            }

        attempted = ", ".join([f"{m}({s})" for m, s in attempts]) if attempts else "none"
        raise HTTPException(
            status_code=502,
            detail=(
                "Image generation failed for all free Hugging Face candidates. "
                f"Attempts: {attempted}. Consider adding a provider key (StabilityAI) or using a paid HF model."
            ),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Image generation failed. Please try again.")
