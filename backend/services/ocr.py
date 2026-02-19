"""
RealityCheck AI — OCR Service
Extracts text from uploaded images using Tesseract OCR.
"""

import pytesseract
from PIL import Image
from io import BytesIO
from fastapi import UploadFile, HTTPException


async def extract_text_from_image(file: UploadFile) -> str:
    """Read an uploaded image file and return extracted text via Tesseract."""
    allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{file.content_type}'. "
                   f"Allowed: {', '.join(allowed_types)}",
        )

    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents))

        # Convert to RGB if necessary (e.g. RGBA PNGs)
        if image.mode not in ("L", "RGB"):
            image = image.convert("RGB")

        text: str = pytesseract.image_to_string(image).strip()

        if not text:
            raise HTTPException(
                status_code=422,
                detail="Could not extract any text from the image. "
                       "Please upload a clearer screenshot.",
            )
        return text

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(exc)}",
        )
