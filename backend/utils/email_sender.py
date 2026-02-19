"""
RealityCheck AI — Email Service
Send OTP verification and password reset emails via Gmail SMTP.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)
FROM_NAME = os.getenv("FROM_NAME", "RealityCheck AI")


async def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
    """Send an email via SMTP."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  SMTP credentials not configured. Email not sent.")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = to_email

    # Add text and HTML parts
    if text_content:
        part1 = MIMEText(text_content, "plain")
        msg.attach(part1)

    part2 = MIMEText(html_content, "html")
    msg.attach(part2)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        print(f"✅  Email sent to {to_email}")
    except Exception as e:
        print(f"❌  Email send failed: {e}")
        raise


async def send_otp_email(to_email: str, otp_code: str):
    """Send OTP verification email."""
    subject = "RealityCheck AI — Email Verification"
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="color: #6366f1; margin-bottom: 20px;">RealityCheck AI</h1>
          <h2 style="color: #0f172a; margin-bottom: 16px;">Verify Your Email</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            Thank you for signing up! Please use the code below to verify your email address:
          </p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px;">{otp_code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            This code expires in <strong>5 minutes</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
    </html>
    """
    
    text = f"""
RealityCheck AI — Email Verification

Your verification code is: {otp_code}

This code expires in 5 minutes.

If you didn't request this, please ignore this email.
    """
    
    await send_email(to_email, subject, html, text)


async def send_password_reset_email(to_email: str, reset_token: str, frontend_url: str = "http://localhost:3000"):
    """Send password reset email."""
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    subject = "RealityCheck AI — Password Reset"
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="color: #6366f1; margin-bottom: 20px;">RealityCheck AI</h1>
          <h2 style="color: #0f172a; margin-bottom: 16px;">Reset Your Password</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            You requested a password reset. Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{reset_link}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            This link expires in <strong>15 minutes</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            Or copy and paste this link: <br>
            <span style="word-break: break-all;">{reset_link}</span>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            If you didn't request this, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
      </body>
    </html>
    """
    
    text = f"""
RealityCheck AI — Password Reset

You requested a password reset. Click the link below to create a new password:

{reset_link}

This link expires in 15 minutes.

If you didn't request this, please ignore this email.
    """
    
    await send_email(to_email, subject, html, text)
