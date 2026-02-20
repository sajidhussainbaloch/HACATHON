"""
RealityCheck AI — OCR Service
Extracts text from uploaded images using Google Cloud Vision API.
Falls back gracefully if credentials are not configured.
"""

import os
import json
from PIL import Image
from io import BytesIO
from fastapi import UploadFile, HTTPException

# Try to import Google Cloud Vision
try:
    from google.cloud import vision
    from google.oauth2 import service_account
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
    creds_var = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_var:
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

        # Create Vision API client with JSON credentials
        print(f"ℹ️  Attempting to use GOOGLE_APPLICATION_CREDENTIALS (length: {len(creds_var)})")
        
        try:
            if creds_var.strip().startswith('{'):
                # JSON credentials passed as environment variable
                print("ℹ️  Parsing JSON credentials...")
                creds_dict = json.loads(creds_var)
                print(f"ℹ️  Credentials parsed. Project ID: {creds_dict.get('project_id')}")
                
                credentials = service_account.Credentials.from_service_account_info(creds_dict)
                print("ℹ️  Service account credentials created successfully")
                
                client = vision.ImageAnnotatorClient(credentials=credentials)
                print("ℹ️  Vision API client created with service account credentials")
            else:
                # File path credentials (standard behavior)
                print("ℹ️  Using file-based credentials from path")
                client = vision.ImageAnnotatorClient()
                
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON credentials: {e}")
            return None
        except Exception as e:
            print(f"❌ Failed to create Vision client: {type(e).__name__}: {e}")
            return None

        # Call Google Cloud Vision API
        print("ℹ️  Sending image to Google Cloud Vision API...")
        image_obj = vision.Image(content=contents)
        response = client.text_detection(image=image_obj)
        print("ℹ️  Received response from Vision API")

        # Extract text from response
        if response.text_annotations:
            # First annotation contains all text
            full_text = response.text_annotations[0].description.strip()
            if full_text:
                print(f"✅ OCR successful! Extracted {len(full_text)} characters")
                return full_text
            else:
                print("⚠️  No text detected in image")
                return None
        else:
            print("⚠️  No text detected in image (empty response)")
            return None

    except Exception as exc:
        print(f"❌ Unexpected error in OCR: {type(exc).__name__}: {str(exc)}")
        import traceback
        traceback.print_exc()
        return None  # Return None instead of raising
