"""
RealityCheck AI — OCR Service
Extracts text from uploaded images using Google Cloud Vision API.
Falls back gracefully if credentials are not configured.
"""

import os
from PIL import Image
from io import BytesIO
from fastapi import UploadFile, HTTPException

# Try to import Google Cloud Vision
try:
    from google.cloud import vision
    VISION_AVAILABLE = True
except ImportError:
    VISION_AVAILABLE = False
    print("⚠️  Google Cloud Vision not installed - OCR will be skipped")


async def extract_text_from_image(file: UploadFile) -> str | None:
    """
    Extract text from image using Google Cloud Vision API.
    Returns None if Vision API is not configured or available.
    Raises HTTPException for invalid image types.
    """
    allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{file.content_type}'. "
                   f"Allowed: {', '.join(allowed_types)}",
        )

    # Check if Vision API is available
    if not VISION_AVAILABLE:
        print("⚠️  OCR skipped: Google Cloud Vision not installed.")
        return None

    # Check if credentials are configured
    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        print("⚠️  OCR skipped: GOOGLE_APPLICATION_CREDENTIALS not set")
        return None

    try:
        contents = await file.read()
        
        # Validate image first
        try:
            image = Image.open(BytesIO(contents))
            image.verify()
        except Exception as e:
            print(f"⚠️  Invalid image file: {e}")
            return None

        # Call Google Cloud Vision API
        client = vision.ImageAnnotatorClient()
        image_obj = vision.Image(content=contents)
        response = client.text_detection(image=image_obj)

        # Extract text from response
        if response.text_annotations:
            # First annotation contains all text
            full_text = response.text_annotations[0].description.strip()
            if full_text:
                return full_text
            else:
                print("⚠️  No text detected in image")
                return None
        else:
            print("⚠️  No text detected in image")
            return None

    except Exception as exc:
        print(f"⚠️  Google Cloud Vision API error: {str(exc)}")
        return None  # Return None instead of raising
