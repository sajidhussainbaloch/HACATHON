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
        # Try the Hugging Face router endpoint first — some models are hosted by
        # specific inference providers and the router can route to working providers.
        router_endpoint = f"https://router.huggingface.co/hf-inference/models/{model_id}"
        direct_endpoint = f"https://api-inference.huggingface.co/models/{model_id}"
        request_body = {"inputs": prompt}
        if negative_prompt:
            request_body["parameters"] = {"negative_prompt": negative_prompt}
        async with httpx.AsyncClient(timeout=30.0) as client:
            # First try router
            try:
                r = await client.post(router_endpoint, headers=headers, json=request_body)
            except Exception:
                r = None
            # If router returned 410/404 or failed, fallback to the direct inference endpoint
            if r is None or (r.status_code in {404, 410}):
                return await client.post(direct_endpoint, headers=headers, json=request_body)
            return r

    async def request_stability(engine_id: str):
        endpoint = f"https://api.stability.ai/v1/generation/{engine_id}/text-to-image"
        stability_headers = {
            "Authorization": f"Bearer {STABILITY_API_KEY}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        prompts = [{"text": prompt, "weight": 1}]
        if negative_prompt:
            prompts.append({"text": negative_prompt, "weight": -1})
        payload = {
            "text_prompts": prompts,
            "cfg_scale": 7,
            "steps": 30,
            "samples": 1,
            "height": 1024,
            "width": 1024,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            return await client.post(endpoint, headers=stability_headers, json=payload)

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

        # If HF candidates all failed, try Stability AI if configured
        attempted = ", ".join([f"{m}({s})" for m, s in attempts]) if attempts else "none"
        if STABILITY_API_KEY:
            try:
                stability_resp = await request_stability(STABILITY_ENGINE_ID)
                if stability_resp.status_code < 400:
                    data = stability_resp.json()
                    artifacts = data.get("artifacts", []) if isinstance(data, dict) else []
                    if artifacts and artifacts[0].get("base64"):
                        encoded = artifacts[0]["base64"]
                        return {
                            "image_base64": encoded,
                            "content_type": "image/png",
                            "width": 1024,
                            "height": 1024,
                            "model": f"stability:{STABILITY_ENGINE_ID}",
                        }
                    raise HTTPException(status_code=502, detail="Stability AI returned an empty image.")
                else:
                    attempted = attempted + f", stability({stability_resp.status_code})"
            except Exception:
                attempted = attempted + ", stability(error)"

        raise HTTPException(
            status_code=502,
            detail=(
                "Image generation failed for all free Hugging Face candidates. "
                f"Attempts: {attempted}. If you can, set `STABILITY_API_KEY` for a more reliable provider."
            ),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Image generation failed. Please try again.")
