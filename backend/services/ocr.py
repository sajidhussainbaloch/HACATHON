"""
RealityCheck AI — OCR Service
Extracts text from uploaded images using OCR.space API (free, no auth required).
"""

import os
import httpx
from PIL import Image
from io import BytesIO
from fastapi import UploadFile, HTTPException


async def extract_text_from_image(file: UploadFile) -> str | None:
    """
    Extract text from image using OCR.space API.
    Uses OCR_SPACE_API_KEY env var if set, otherwise uses free tier key.
    """
    allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{file.content_type}'. "
                   f"Allowed: {', '.join(allowed_types)}",
        )

    try:
        contents = await file.read()
        
        # Validate image
        try:
            image = Image.open(BytesIO(contents))
            image.verify()
            print(f"✅ Image validated: {image.format} {image.size}")
        except Exception as e:
            print(f"⚠️  Invalid image file: {e}")
            return None

        # Get API key from environment or use default
        api_key = os.getenv("OCR_SPACE_API_KEY", "K87899142C87")
        print(f"ℹ️  Using API key: {api_key[:10]}...")

        # Call OCR.space API
        print("ℹ️  Sending image to OCR.space API...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {"filename": ("image", contents, file.content_type)}
            data = {
                "apikey": api_key,
                "isOverlayRequired": "false",
                "language": "eng",
            }
            
            response = await client.post(
                "https://api.ocr.space/parse/image",
                files=files,
                data=data,
            )
        
        print(f"ℹ️  OCR.space response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"⚠️  OCR.space API error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return None
        
        result = response.json()
        print(f"ℹ️  Full response: {result}")
        
        if result.get("IsErroredOnProcessing"):
            error_msg = result.get("ErrorMessage", "Unknown error")
            print(f"⚠️  OCR error: {error_msg}")
            return None
        
        parsed_text = result.get("ParsedText", "").strip()
        
        if parsed_text:
            print(f"✅ OCR successful! Extracted {len(parsed_text)} characters")
            return parsed_text
        else:
            print("⚠️  No text detected in image")
            return None

    except httpx.TimeoutException:
        print("⚠️  OCR.space API timeout")
        return None
    except Exception as exc:
        print(f"❌ Error in OCR: {type(exc).__name__}: {str(exc)}")
        import traceback
        traceback.print_exc()
        return None
