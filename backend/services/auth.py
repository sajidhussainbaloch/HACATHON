"""
RealityCheck AI — Authentication Service
User signup, login, OTP verification, password reset.

NOTE: Google OAuth is handled entirely by Supabase Auth.
The frontend uses Supabase's Google provider directly.
This service only handles email/password authentication.
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
            print(f"⚠️  User {req.email} exists but not verified. Resending OTP.")
    else:
        # Create new user
        try:
            hashed_pw = hash_password(req.password)
            user = User(
                full_name=req.full_name,
                email=req.email,
                hashed_password=hashed_pw,
                is_verified=False,
            )
            db.add(user)
            db.commit()
            print(f"✅ New user {req.email} created successfully in database.")
        except Exception as e:
            db.rollback()
            print(f"❌ Failed to create user {req.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user account: {str(e)}",
            )

    # Generate and send OTP
    try:
        check_rate_limit(req.email)
        otp_code = generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=5)

        # Delete old OTPs for this email
        db.query(OTP).filter(OTP.email == req.email).delete()

        otp = OTP(email=req.email, code=otp_code, expires_at=expires_at)
        db.add(otp)
        db.commit()
        print(f"✅ OTP {otp_code} saved to database for {req.email}")

        await send_otp_email(req.email, otp_code)
        print(f"✅ OTP email sent to {req.email}")

        return {"message": "Signup successful. OTP sent to your email."}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ OTP generation/sending failed for {req.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}",
        )


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
    
    # Commit both changes together
    try:
        db.commit()
        print(f"✅ User {req.email} verified successfully. OTP marked as used.")
    except Exception as e:
        db.rollback()
        print(f"❌ Database error during OTP verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during verification. Please try again.",
        )

    return {"message": "Email verified successfully. You can now log in."}


async def login_user(req: LoginRequest, db: Session):
    """Authenticate user and return JWT token."""
    try:
        user = db.query(User).filter(User.email == req.email).first()

        if not user:
            print(f"⚠️  Login failed: User {req.email} not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_verified:
            print(f"⚠️  Login failed: User {req.email} not verified")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email first.",
            )

        if not verify_password(req.password, user.hashed_password):
            print(f"⚠️  Login failed: Wrong password for {req.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        # Create access token
        token_data = {"sub": user.email, "id": user.id}
        access_token = create_access_token(token_data)
        print(f"✅ User {req.email} logged in successfully")

        return TokenResponse(access_token=access_token)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Login error for {req.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again.",
        )


async def forgot_password(req: ForgotPasswordRequest, db: Session):
    """Send password reset email."""
    try:
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
        print(f"✅ Password reset token generated for {req.email}")

        await send_password_reset_email(req.email, token)
        print(f"✅ Password reset email sent to {req.email}")

        return {"message": "If the email exists, a reset link has been sent."}
    
    except Exception as e:
        db.rollback()
        print(f"❌ Password reset failed for {req.email}: {e}")
        # Still return same message to not reveal email existence
        return {"message": "If the email exists, a reset link has been sent."}


async def reset_password(req: ResetPasswordRequest, db: Session):
    """Reset password using token."""
    try:
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
            print(f"✅ Password reset successful for {reset.email}")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found.",
            )

        return {"message": "Password reset successfully. You can now log in."}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again.",
        )


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
