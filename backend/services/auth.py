"""
RealityCheck AI — Authentication Service
User signup, login, OTP verification, password reset, Google OAuth.
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import User, OTP, PasswordReset, get_db
from utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    generate_otp,
    generate_reset_token,
)
from utils.email_sender import send_otp_email, send_password_reset_email
from utils.config import GOOGLE_CLIENT_ID

# Google OAuth token verification
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

security = HTTPBearer()

# ── Request Models ────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    id_token: str


# ── Response Models ───────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_verified: bool


# ── Rate limiting (simple in-memory) ──────────────────────────────────────────
otp_request_count: dict[str, tuple[int, datetime]] = {}

def check_rate_limit(email: str, max_requests: int = 3, window_minutes: int = 15):
    """Check if user exceeded OTP request rate limit."""
    now = datetime.utcnow()
    if email in otp_request_count:
        count, first_request = otp_request_count[email]
        if now - first_request < timedelta(minutes=window_minutes):
            if count >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many OTP requests. Try again in {window_minutes} minutes.",
                )
            otp_request_count[email] = (count + 1, first_request)
        else:
            otp_request_count[email] = (1, now)
    else:
        otp_request_count[email] = (1, now)


# ── Auth Functions ────────────────────────────────────────────────────────────
async def signup_user(req: SignupRequest, db: Session):
    """Register a new user and send OTP."""
    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered and verified.",
            )
        else:
            # User exists but not verified — allow resending OTP
            pass
    else:
        # Create new user
        hashed_pw = hash_password(req.password)
        user = User(
            full_name=req.full_name,
            email=req.email,
            hashed_password=hashed_pw,
            is_verified=False,
        )
        db.add(user)
        db.commit()

    # Generate and send OTP
    check_rate_limit(req.email)
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # Delete old OTPs for this email
    db.query(OTP).filter(OTP.email == req.email).delete()

    otp = OTP(email=req.email, code=otp_code, expires_at=expires_at)
    db.add(otp)
    db.commit()

    await send_otp_email(req.email, otp_code)

    return {"message": "Signup successful. OTP sent to your email."}


async def verify_otp(req: VerifyOTPRequest, db: Session):
    """Verify OTP and activate user account."""
    otp = (
        db.query(OTP)
        .filter(OTP.email == req.email, OTP.code == req.otp, OTP.used == False)
        .first()
    )

    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP.",
        )

    if datetime.utcnow() > otp.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Request a new one.",
        )

    # Mark OTP as used
    otp.used = True

    # Verify user
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        user.is_verified = True
        db.commit()

    return {"message": "Email verified successfully. You can now log in."}


async def login_user(req: LoginRequest, db: Session):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.email == req.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first.",
        )

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Create access token
    token_data = {"sub": user.email, "id": user.id}
    access_token = create_access_token(token_data)

    return TokenResponse(access_token=access_token)


async def forgot_password(req: ForgotPasswordRequest, db: Session):
    """Send password reset email."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link has been sent."}

    # Generate reset token
    token = generate_reset_token()
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    # Delete old reset tokens
    db.query(PasswordReset).filter(PasswordReset.email == req.email).delete()

    reset = PasswordReset(email=req.email, token=token, expires_at=expires_at)
    db.add(reset)
    db.commit()

    await send_password_reset_email(req.email, token)

    return {"message": "If the email exists, a reset link has been sent."}


async def reset_password(req: ResetPasswordRequest, db: Session):
    """Reset password using token."""
    reset = (
        db.query(PasswordReset)
        .filter(PasswordReset.token == req.token, PasswordReset.used == False)
        .first()
    )

    if not reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    if datetime.utcnow() > reset.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired.",
        )

    # Update password
    user = db.query(User).filter(User.email == reset.email).first()
    if user:
        user.hashed_password = hash_password(req.new_password)
        reset.used = True
        db.commit()

    return {"message": "Password reset successfully. You can now log in."}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to get current authenticated user from JWT."""
    token = credentials.credentials
    payload = decode_access_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_user_profile(user):
    """Get current user profile."""
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        is_verified=user.is_verified,
    )


async def update_user_profile(req, user, db):
    """Update current user profile."""
    if req.full_name:
        user.full_name = req.full_name
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        is_verified=user.is_verified,
    )


async def google_auth(req: GoogleAuthRequest, db: Session):
    """Authenticate with Google OAuth. Creates account if first time."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server.",
        )

    # Verify the Google ID token
    try:
        idinfo = id_token.verify_oauth2_token(
            req.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token.",
        )

    email = idinfo.get("email")
    name = idinfo.get("name", "")
    email_verified = idinfo.get("email_verified", False)

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account has no email address.",
        )

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create new user (auto-verified since Google verified the email)
        user = User(
            full_name=name,
            email=email,
            hashed_password=None,
            auth_provider="google",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.auth_provider == "email" and not user.is_verified:
        # User signed up with email but never verified — link Google account
        user.auth_provider = "google"
        user.is_verified = True
        if not user.full_name:
            user.full_name = name
        db.commit()
        db.refresh(user)

    # Create access token
    token_data = {"sub": user.email, "id": user.id}
    access_token = create_access_token(token_data)

    return TokenResponse(access_token=access_token)
