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
# Added `black-forest-labs/FLUX.1-Krea-dev` which is often available via inference providers.
HF_FALLBACK_MODELS = [
    "black-forest-labs/FLUX.1-Krea-dev",
    "runwayml/stable-diffusion-v1-5",
    "stabilityai/stable-diffusion-2-1",
    "nitrosocke/anything-midjourney-v6",
]
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
STABILITY_ENGINE_ID = os.getenv("STABILITY_ENGINE_ID", "stable-diffusion-xl-1024-v1-0")
DEAPI_KEY = os.getenv("DEAPI_KEY")
DEAPI_BASE_URL = os.getenv("DEAPI_BASE_URL")


class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    model: Optional[str] = None


@router.post("/generate")
async def generate_image(payload: GenerateRequest):
    prompt = (payload.prompt or "").strip()
    negative_prompt = (payload.negative_prompt or "").strip()
    # Use DeAPI as the single image provider for generation. This keeps other
    # application tabs untouched and confines changes to image generation only.
    if not DEAPI_KEY or not DEAPI_BASE_URL:
        raise HTTPException(status_code=503, detail="DEAPI_KEY or DEAPI_BASE_URL is not configured.")

    deapi_headers = {
        "Authorization": f"Bearer {DEAPI_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    async def request_deapi(model_name: str):
        body = {"model": model_name, "prompt": prompt}
        if negative_prompt:
            body["negative_prompt"] = negative_prompt
        async with httpx.AsyncClient(timeout=60.0) as client:
            return await client.post(DEAPI_BASE_URL, headers=deapi_headers, json=body)

    try:
        model_requested = getattr(payload, "model", None) if hasattr(payload, "model") else None
        model_requested = (model_requested or "FLUX.1 schnell").strip()

        resp = await request_deapi(model_requested)
        if resp.status_code >= 400:
            if resp.status_code == 401:
                raise HTTPException(status_code=502, detail="DeAPI authentication failed. Check DEAPI_KEY.")
            if resp.status_code == 429:
                raise HTTPException(status_code=502, detail="DeAPI rate limited. Try again later.")
            raise HTTPException(status_code=502, detail=f"DeAPI request failed ({resp.status_code}).")

        ct = resp.headers.get("content-type", "")
        if ct.startswith("image/"):
            image_bytes = resp.content
            encoded = base64.b64encode(image_bytes).decode("ascii")
            return {"image_base64": encoded, "content_type": ct, "model": model_requested}

        data = resp.json()
        encoded = None
        if isinstance(data, dict):
            if data.get("image_base64"):
                encoded = data.get("image_base64")
            elif data.get("base64"):
                encoded = data.get("base64")
            elif data.get("b64"):
                encoded = data.get("b64")
            elif data.get("result") and isinstance(data.get("result"), str):
                encoded = data.get("result")
            elif data.get("artifacts") and isinstance(data.get("artifacts"), list):
                first = data.get("artifacts")[0]
                if isinstance(first, dict) and first.get("base64"):
                    encoded = first.get("base64")

        if not encoded:
            raise HTTPException(status_code=502, detail="DeAPI returned an unexpected response.")

        return {"image_base64": encoded, "content_type": "image/png", "model": model_requested}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Image generation failed. Please try again.")
