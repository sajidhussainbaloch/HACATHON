"""
RealityCheck AI — FastAPI Application
Main entry-point: /analyze endpoint, CORS, startup tasks.
"""

from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.ocr import extract_text_from_image
from services.classifier import classify_news
from services.rag import build_index, retrieve_similar
from services.explanation import generate_explanation
from utils.config import MAX_INPUT_CHARS

# Authentication imports
from database import init_db, get_db
from services.auth import (
    signup_user,
    verify_otp,
    login_user,
    forgot_password,
    reset_password,
    get_user_profile,
    update_user_profile,
    get_current_user,
    google_auth,
    SignupRequest,
    VerifyOTPRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    GoogleAuthRequest,
)


# ── Pydantic response model ──────────────────────────────────────────────────
class AnalysisResponse(BaseModel):
    label: str
    confidence: float
    reasoning_summary: str
    detailed_explanation: str
    key_inconsistencies: list[str]
    evidence_alignment: str
    retrieved_articles: list[dict]


# ── Lifespan: build FAISS index on startup ───────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and build FAISS vector index on startup."""
    # Initialize database tables
    try:
        init_db()
        print("✅  Database initialized successfully.")
    except Exception as exc:
        print(f"⚠️  Database initialization failed: {exc}")
    
    # Build FAISS index from seed articles
    try:
        await build_index()
        print("✅  FAISS index built successfully.")
    except Exception as exc:
        print(f"⚠️  FAISS index build failed (RAG will be degraded): {exc}")
    yield


# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="RealityCheck AI",
    description="AI-powered Fake News & Misinformation Detection System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Authentication endpoints ──────────────────────────────────────────────────
@app.post("/auth/signup")
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user and send OTP verification email."""
    return await signup_user(req, db)


@app.post("/auth/verify-otp")
async def verify(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP and activate user account."""
    return await verify_otp(req, db)


@app.post("/auth/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login and receive JWT access token."""
    return await login_user(req, db)


@app.post("/auth/forgot-password")
async def forgot(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset email."""
    return await forgot_password(req, db)


@app.post("/auth/reset-password")
async def reset(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using token from email."""
    return await reset_password(req, db)


@app.get("/auth/profile")
async def profile(user = Depends(get_current_user)):
    """Get current user profile (protected route)."""
    return await get_user_profile(user)


@app.put("/auth/profile")
async def update_profile(req: UpdateProfileRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update current user profile (protected route)."""
    return await update_user_profile(req, user, db)


@app.post("/auth/google")
async def google_login(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth. Creates account if new user."""
    return await google_auth(req, db)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Main analysis endpoint ───────────────────────────────────────────────────
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Accepts either a text input or an image upload.
    Pipeline: OCR (if image) → Classification → Embedding + FAISS → Explanation.
    Public endpoint — no authentication required.
    """

    # 1. Resolve input text
    news_text: str | None = None

    if file is not None:
        news_text = await extract_text_from_image(file)
    elif text is not None:
        news_text = text.strip()

    if not news_text:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'text' or an image 'file'.",
        )

    # Limit input size
    if len(news_text) > MAX_INPUT_CHARS:
        news_text = news_text[:MAX_INPUT_CHARS]

    # 2. Classify
    classification = await classify_news(news_text)

    # 3. Retrieve similar evidence via RAG
    retrieved = await retrieve_similar(news_text)

    # 4. Generate explanation
    explanation = await generate_explanation(news_text, classification, retrieved)

    # 5. Build response
    return AnalysisResponse(
        label=classification["label"],
        confidence=classification["confidence"],
        reasoning_summary=classification["reasoning_summary"],
        detailed_explanation=explanation["detailed_explanation"],
        key_inconsistencies=explanation["key_inconsistencies"],
        evidence_alignment=explanation["evidence_alignment"],
        retrieved_articles=[
            {
                "title": art["title"],
                "source": art["source"],
                "url": art["url"],
                "similarity_score": art.get("similarity_score", 0),
            }
            for art in retrieved
        ],
    )


# ── Run (for local development) ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
