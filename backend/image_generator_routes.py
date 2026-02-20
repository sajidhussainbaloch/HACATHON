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
HF_MODEL_ID = "runwayml/stable-diffusion-v1-5"


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

    async def request_model():
        endpoint = f"https://api-inference.huggingface.co/models/{HF_MODEL_ID}"
        request_body = {"inputs": prompt}
        if negative_prompt:
            request_body["parameters"] = {"negative_prompt": negative_prompt}
        async with httpx.AsyncClient(timeout=20.0) as client:
            return await client.post(endpoint, headers=headers, json=request_body)

    try:
        response = await request_model()

        content_type = response.headers.get("content-type", "")
        if response.status_code >= 400:
            if response.status_code == 503:
                raise HTTPException(
                    status_code=503,
                    detail="Model is warming up. Please retry in a moment.",
                )
            if response.status_code in {401, 403}:
                raise HTTPException(
                    status_code=502,
                    detail="Model access denied. Check HF token permissions.",
                )
            raise HTTPException(status_code=502, detail="Image generation failed.")

        if "application/json" in content_type:
            data = response.json()
            if isinstance(data, dict) and data.get("error"):
                raise HTTPException(status_code=502, detail=str(data.get("error")))
            raise HTTPException(status_code=502, detail="Unexpected model response.")

        image_bytes = response.content
        if not image_bytes:
            raise HTTPException(status_code=502, detail="Model returned an empty image.")

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
            "model": HF_MODEL_ID,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Image generation failed. Please try again.")
