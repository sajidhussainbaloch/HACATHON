"""
AI Image Generator routes.
Provides a lightweight endpoint to generate images from text prompts using Hugging Face Inference API.
"""

from __future__ import annotations

import base64
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/image", tags=["image-generator"])

HF_API_KEY = os.getenv("HF_API_KEY")
# Prefer the new router endpoint; keep configurable for testing
HF_API_URL = os.getenv("HF_ROUTER_URL", "https://router.huggingface.co/models")

# Available free models on Hugging Face
HF_MODELS = {
    "flux-schnell": "black-forest-labs/FLUX.1-schnell",
    "stable-diffusion-2.1": "stabilityai/stable-diffusion-2-1",
    "stable-diffusion-1.5": "runwayml/stable-diffusion-v1-5",
}


class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    model: Optional[str] = "flux-schnell"
    width: Optional[int] = 768
    height: Optional[int] = 768


@router.post("/generate")
async def generate_image(payload: GenerateRequest):
    """Generate an image using Hugging Face Inference API."""
    
    if not HF_API_KEY:
        raise HTTPException(
            status_code=503, 
            detail="HF_API_KEY is not configured. Get a free token at https://huggingface.co/settings/tokens"
        )

    prompt = (payload.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    # Get the HuggingFace model ID
    model_key = payload.model or "flux-schnell"
    model_id = HF_MODELS.get(model_key, HF_MODELS["flux-schnell"])

    # Prepare request
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json",
    }
    
    # Build parameters
    parameters = {}
    if payload.negative_prompt:
        parameters["negative_prompt"] = payload.negative_prompt
    if payload.width:
        parameters["width"] = payload.width
    if payload.height:
        parameters["height"] = payload.height

    request_body = {"inputs": prompt}
    if parameters:
        request_body["parameters"] = parameters

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            url = f"{HF_API_URL}/{model_id}"
            response = await client.post(url, headers=headers, json=request_body)
            
            if response.status_code == 503:
                raise HTTPException(
                    status_code=503,
                    detail="Model is currently loading. Please try again in a few seconds."
                )
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Hugging Face API key")
            elif response.status_code != 200:
                error_detail = response.text[:200] if response.text else "Unknown error"
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"HuggingFace API error: {error_detail}"
                )

            # Try to handle multiple response shapes from the HF router:
            content_type = response.headers.get("content-type", "")

            # If the router returns raw image bytes (content-type image/*)
            if content_type.startswith("image/"):
                image_bytes = response.content
                image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                return {
                    "image_base64": image_base64,
                    "content_type": content_type.split(";")[0],
                    "model": model_key,
                    "width": payload.width or 768,
                    "height": payload.height or 768,
                }

            # Otherwise attempt to parse JSON and locate base64-encoded image data
            try:
                data = response.json()
            except Exception:
                raise HTTPException(status_code=502, detail="Unexpected non-image, non-json response from HuggingFace router")

            # Recursive search for base64 strings in JSON
            def find_base64(obj):
                if isinstance(obj, str):
                    s = obj.strip()
                    # quick length check to avoid decoding short tokens
                    if len(s) > 200:
                        try:
                            # validate base64
                            base64.b64decode(s, validate=True)
                            return s
                        except Exception:
                            return None
                    return None
                if isinstance(obj, dict):
                    # common artifact fields
                    for k in ("image", "image_base64", "generated_image", "b64_json", "base64", "data", "blob"):
                        if k in obj and isinstance(obj[k], str):
                            candidate = find_base64(obj[k])
                            if candidate:
                                return candidate
                    for v in obj.values():
                        candidate = find_base64(v)
                        if candidate:
                            return candidate
                if isinstance(obj, list):
                    for item in obj:
                        candidate = find_base64(item)
                        if candidate:
                            return candidate
                return None

            b64 = find_base64(data)
            if b64:
                # If we found base64 content, return it. Content-type may be in the JSON.
                # Try to find mime type in response JSON
                mime = None
                if isinstance(data, dict):
                    mime = data.get("mime") or data.get("content_type") or data.get("content-type")
                    # check nested artifacts
                    artifacts = data.get("artifacts") or data.get("outputs")
                    if isinstance(artifacts, list) and artifacts:
                        first = artifacts[0]
                        if isinstance(first, dict):
                            mime = mime or first.get("mime") or first.get("content_type")

                return {
                    "image_base64": b64,
                    "content_type": mime or "image/png",
                    "model": model_key,
                    "width": payload.width or 768,
                    "height": payload.height or 768,
                }

            # If we reach here no usable image data was found
            raise HTTPException(status_code=502, detail=f"No image data found in Hugging Face router response: {str(data)[:300]}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
