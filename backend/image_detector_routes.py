"""
AI Image Authenticity Detector routes.
Provides a lightweight endpoint to classify images as AI-generated or Real.
"""

from __future__ import annotations

import io
import os
from typing import Tuple

import httpx
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image

router = APIRouter(prefix="/api/image", tags=["image-detector"])

HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL_ID = "dima806/deepfake_vs_real_image_detection"
HF_ENDPOINT = f"https://api-inference.huggingface.co/models/{HF_MODEL_ID}"


def _validate_image(file: UploadFile) -> bytes:
    if file is None:
        raise HTTPException(status_code=400, detail="No image uploaded.")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    return content


def _heuristic_detector(image_bytes: bytes) -> Tuple[str, int, str]:
    """
    Lightweight heuristic fallback if HF API is unavailable.
    Uses edge density and color variance to produce a low-confidence guess.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {exc}")

    img_small = img.resize((128, 128))
    arr = np.asarray(img_small).astype(np.float32)
    gray = np.asarray(img_small.convert("L")).astype(np.float32)

    gx = np.abs(np.diff(gray, axis=1))
    gy = np.abs(np.diff(gray, axis=0))
    edge_score = float((gx.mean() + gy.mean()) / 2.0)
    color_std = float(np.std(arr))

    # Normalize into a soft AI likelihood
    ai_score = 0.5 + (edge_score - 12.0) / 50.0 - (color_std - 50.0) / 200.0
    ai_score = max(0.15, min(0.85, ai_score))

    if ai_score >= 0.5:
        confidence = int(round(ai_score * 100))
        explanation = (
            "Heuristic scan detected higher edge density and lower color variance, "
            "which can align with synthetic generation patterns."
        )
        return "AI-generated", confidence, explanation

    confidence = int(round((1.0 - ai_score) * 100))
    explanation = (
        "Heuristic scan detected natural texture variation and color dispersion, "
        "which often aligns with real-world imagery."
    )
    return "Real", confidence, explanation


def _map_hf_label(label: str) -> str:
    label_lower = label.lower()
    if any(tag in label_lower for tag in ["fake", "ai", "synthetic", "generated", "deepfake"]):
        return "AI-generated"
    return "Real"


@router.post("/check")
async def check_image(file: UploadFile = File(...)):
    """
    Check image authenticity using a free Hugging Face model.
    Returns classification, confidence, and explanation.
    """
    image_bytes = _validate_image(file)

    # Use HF inference API when available
    if HF_API_KEY:
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(HF_ENDPOINT, headers=headers, content=image_bytes)
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=502,
                    detail="Model inference failed. Please try again in a moment.",
                )
            payload = response.json()
            if isinstance(payload, dict) and payload.get("error"):
                raise HTTPException(status_code=502, detail="Model error. Please try again later.")
            if not isinstance(payload, list) or not payload:
                raise HTTPException(status_code=502, detail="Unexpected model response.")

            top = max(payload, key=lambda item: item.get("score", 0))
            label = _map_hf_label(str(top.get("label", "Real")))
            confidence = int(round(float(top.get("score", 0.5)) * 100))
            explanation = (
                "Model detected visual cues consistent with synthetic generation."
                if label == "AI-generated"
                else "Model detected natural texture and lighting distributions typical of real images."
            )
            return {
                "classification": label,
                "confidence": confidence,
                "explanation": explanation,
            }
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=502, detail="Model inference failed. Please try again later.")

    # Fallback heuristic when no HF API key
    classification, confidence, explanation = _heuristic_detector(image_bytes)
    return {
        "classification": classification,
        "confidence": confidence,
        "explanation": explanation,
    }
