"""
RealityCheck AI — Database Models
SQLAlchemy models for user management and authentication.
Uses Supabase PostgreSQL as the database backend.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, NullPool
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# ── Database URL ──────────────────────────────────────────────────────────────
# Use Supabase PostgreSQL connection string from environment.
# For Vercel serverless: use NullPool to avoid connection leaks.
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is required. "
        "Set it to your Supabase PostgreSQL connection string."
    )

# Vercel serverless functions should use NullPool (no persistent connections).
# Local development can use QueuePool for connection reuse.
is_serverless = bool(os.getenv("VERCEL"))

engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool if is_serverless else QueuePool,
    pool_pre_ping=True,  # verify connections before use
    **({"pool_size": 5, "max_overflow": 10} if not is_serverless else {}),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """User account model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # nullable for OAuth users
    auth_provider = Column(String(50), default="email")  # 'email' or 'google'
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OTP(Base):
    """OTP verification model."""
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=False)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used = Column(Boolean, default=False)


class PasswordReset(Base):
    """Password reset token model."""
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Create all database tables if they don't exist.
    
    NOTE: For production, run the SQL migration script directly in Supabase
    SQL Editor instead of relying on auto-creation.
    """
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
