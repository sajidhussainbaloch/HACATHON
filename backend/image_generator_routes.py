"""
AI Image Generator routes.
Provides a lightweight endpoint to generate images from text prompts.
"""

from __future__ import annotations

import asyncio
import base64
import io
import os
import random
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
    width: Optional[int] = None
    height: Optional[int] = None
    seed: Optional[int] = None
    steps: Optional[int] = None


@router.post("/generate")
async def generate_image(payload: GenerateRequest):
    prompt = (payload.prompt or "").strip()
    negative_prompt = (payload.negative_prompt or "").strip()
    
    if not DEAPI_KEY or not DEAPI_BASE_URL:
        raise HTTPException(status_code=503, detail="DEAPI_KEY or DEAPI_BASE_URL is not configured.")

    deapi_headers = {
        "Authorization": f"Bearer {DEAPI_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    model_requested = (payload.model or "Flux1schnell").strip()
    
    # Step 1: Submit generation request to DeAPI
    body = {
        "model": model_requested,
        "prompt": prompt,
        "width": int(payload.width) if payload.width else 768,
        "height": int(payload.height) if payload.height else 768,
        "seed": int(payload.seed) if payload.seed is not None else random.randint(0, 2147483647),
        "steps": int(payload.steps) if payload.steps else 4,
    }
    if negative_prompt:
        body["negative_prompt"] = negative_prompt

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            # Submit request
            url = f"{DEAPI_BASE_URL.rstrip('/')}/client/txt2img"
            submit_resp = await client.post(url, headers=deapi_headers, json=body)
            
            if submit_resp.status_code >= 400:
                if submit_resp.status_code == 401:
                    raise HTTPException(status_code=502, detail="DeAPI authentication failed.")
                raise HTTPException(status_code=502, detail=f"DeAPI request failed ({submit_resp.status_code}).")
            
            submit_data = submit_resp.json()
            request_id = submit_data.get("data", {}).get("request_id")
            
            if not request_id:
                raise HTTPException(status_code=502, detail="DeAPI did not return request_id")
            
            # Step 2: Poll for result
            result_url = f"{DEAPI_BASE_URL.rstrip('/')}/client/txt2img/{request_id}"
            max_attempts = 60  # 60 attempts * 2 seconds = 2 minutes max
            
            for attempt in range(max_attempts):
                await asyncio.sleep(2)  # Wait 2 seconds between polls
                
                result_resp = await client.get(result_url, headers=deapi_headers)
                
                if result_resp.status_code == 200:
                    result_data = result_resp.json()
                    
                    # Extract image from response
                    encoded = None
                    if isinstance(result_data, dict):
                        # Try various field names
                        data_obj = result_data.get("data", {})
                        if isinstance(data_obj, dict):
                            encoded = (data_obj.get("image") or data_obj.get("output") or 
                                      data_obj.get("base64") or data_obj.get("image_base64"))
                        
                        if not encoded:
                            encoded = (result_data.get("image") or result_data.get("output") or 
                                      result_data.get("base64") or result_data.get("image_base64"))
                    
                    if encoded:
                        return {
                            "image_base64": encoded,
                            "content_type": "image/png",
                            "model": model_requested,
                            "width": payload.width or 768,
                            "height": payload.height or 768
                        }
                
                elif result_resp.status_code == 404:
                    # Still processing, continue polling
                    continue
                else:
                    # Unexpected error
                    raise HTTPException(status_code=502, detail=f"DeAPI polling failed ({result_resp.status_code})")
            
            # Timeout after max attempts
            raise HTTPException(status_code=504, detail="Image generation timed out. Please try again.")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Image generation failed: {str(e)}")
