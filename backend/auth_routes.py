from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from utils.security import generate_otp
from utils.email_sender import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_ROLE:
    print("⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured — auth admin endpoints will be disabled")


class RequestOTP(BaseModel):
    email: EmailStr


class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str


@router.post("/request-otp")
async def request_otp(req: RequestOTP):
    if not SUPABASE_URL or not SERVICE_ROLE:
        raise HTTPException(status_code=503, detail="Server not configured to send OTPs")

    otp_code = generate_otp()
    expires_at = datetime.now(timezone.utc).isoformat()
    # Save OTP to Supabase DB via REST API
    url = f"{SUPABASE_URL}/rest/v1/otps"
    payload = {
        "email": req.email,
        "code": otp_code,
        "expires_at": (datetime.now(timezone.utc).isoformat()),
        "used": False,
    }
    headers = {
        "Authorization": f"Bearer {SERVICE_ROLE}",
        "apikey": SERVICE_ROLE,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        # delete old OTPs for this email (best-effort)
        try:
            await client.delete(f"{url}?email=eq.{req.email}", headers=headers)
        except Exception:
            pass

        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code not in (200, 201, 204):
            raise HTTPException(status_code=500, detail="Failed to store OTP")

    # Send email (async)
    await send_otp_email(req.email, otp_code)
    return {"message": "OTP sent"}


@router.post("/verify-otp")
async def verify_otp(req: VerifyOTP):
    if not SUPABASE_URL or not SERVICE_ROLE:
        raise HTTPException(status_code=503, detail="Server not configured to verify OTPs")

    headers = {
        "Authorization": f"Bearer {SERVICE_ROLE}",
        "apikey": SERVICE_ROLE,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        # Query matching unused OTP
        q = f"{SUPABASE_URL}/rest/v1/otps?email=eq.{req.email}&code=eq.{req.otp}&used=eq.false"
        resp = await client.get(q, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        rows = resp.json()
        if not rows:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        otp_row = rows[0]
        # Check expiry
        expires_at = otp_row.get("expires_at")
        if expires_at:
            exp_dt = datetime.fromisoformat(expires_at)
            if datetime.now(timezone.utc) > exp_dt:
                raise HTTPException(status_code=400, detail="OTP expired")

        # Mark OTP used
        otp_id = otp_row.get("id")
        if otp_id:
            await client.patch(f"{SUPABASE_URL}/rest/v1/otps?id=eq.{otp_id}", json={"used": True}, headers={**headers, "Content-Type": "application/json"})

        # Find Supabase user by email via admin API
        users_url = f"{SUPABASE_URL}/auth/v1/admin/users?email={req.email}"
        uresp = await client.get(users_url, headers=headers)
        if uresp.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to query Supabase users")
        users = uresp.json()
        if not users:
            raise HTTPException(status_code=404, detail="Supabase user not found")

        user = users[0]
        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=500, detail="Supabase user id missing")

        # Mark user as confirmed by setting email_confirmed_at
        confirm_url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        payload = {"email_confirmed_at": datetime.now(timezone.utc).isoformat()}
        cresp = await client.patch(confirm_url, json=payload, headers={**headers, "Content-Type": "application/json"})
        if cresp.status_code not in (200, 204):
            # Non-fatal: still return success if OTP used; log and warn
            print(f"⚠️  Failed to mark Supabase user confirmed: {cresp.status_code} {cresp.text}")

    return {"message": "OTP verified"}
