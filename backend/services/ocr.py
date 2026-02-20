"""
RealityCheck AI — OCR Service
Extracts text from uploaded images using PaddleOCR (free, no API/auth required).
Falls back gracefully if OCR fails.
"""

import os
from PIL import Image
from io import BytesIO
from fastapi import UploadFile, HTTPException

# Try to import PaddleOCR
try:
    from paddleocr import PaddleOCR
    OCR_AVAILABLE = True
    # Initialize OCR on first import (lazy load on first use)
    _ocr_engine = None
except ImportError:
    OCR_AVAILABLE = False
    _ocr_engine = None
    print("⚠️  PaddleOCR not installed")


def get_ocr_engine():
    """Lazy load OCR engine on first use."""
    global _ocr_engine
    if _ocr_engine is None and OCR_AVAILABLE:
        print("ℹ️  Initializing PaddleOCR engine...")
        _ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)
    return _ocr_engine


async def extract_text_from_image(file: UploadFile) -> str | None:
    """
    Extract text from image using PaddleOCR (free, fully local, no API calls).
    Returns None if OCR fails.
    Raises HTTPException for invalid image types.
    """
    allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{file.content_type}'. "
                   f"Allowed: {', '.join(allowed_types)}",
        )

    if not OCR_AVAILABLE:
        print("⚠️  OCR skipped: PaddleOCR not installed.")
        return None

    try:
        contents = await file.read()
        
        # Validate image with PIL
        try:
            image = Image.open(BytesIO(contents))
            image.verify()
            print(f"✅ Image validated: {image.format} {image.size}")
        except Exception as e:
            print(f"⚠️  Invalid image file: {e}")
            return None

        # Save image temporarily for PaddleOCR
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            # Initialize OCR engine if needed
            ocr = get_ocr_engine()
            if ocr is None:
                print("⚠️  Failed to initialize PaddleOCR")
                return None

            # Run OCR
            print("ℹ️  Running PaddleOCR...")
            result = ocr.ocr(tmp_path, cls=True)
            
            # Extract text from results
            extracted_text = ""
            if result:
                for line in result:
                    if line:
                        for word_info in line:
                            text = word_info[1][0]  # word text
                            extracted_text += text + " "
            
            extracted_text = extracted_text.strip()
            
            if extracted_text:
                print(f"✅ OCR successful! Extracted {len(extracted_text)} characters")
                return extracted_text
            else:
                print("⚠️  No text detected in image")
                return None

        finally:
            # Clean up temp file
            import os as os_module
            try:
                os_module.unlink(tmp_path)
            except:
                pass

    except Exception as exc:
        print(f"❌ Unexpected error in OCR: {type(exc).__name__}: {str(exc)}")
        return None
