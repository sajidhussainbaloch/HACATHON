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
HF_API_URL = "https://api-inference.huggingface.co/models"

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

            # HF returns raw image bytes
            image_bytes = response.content
            
            # Encode to base64
            image_base64 = base64.b64encode(image_bytes).decode("utf-8")

            return {
                "image_base64": image_base64,
                "content_type": "image/png",
                "model": model_key,
                "width": payload.width or 768,
                "height": payload.height or 768,
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
