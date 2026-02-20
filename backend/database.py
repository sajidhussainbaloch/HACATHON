"""
RealityCheck AI — Database Models
SQLAlchemy models for user management and authentication.
Uses Supabase PostgreSQL as the database backend.

NOTE: Auth is now handled by the Supabase Auth SDK directly (frontend → Supabase).
This module is kept for reference but is NOT required at runtime.
"""

from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# ── Optional SQLAlchemy setup (only if DATABASE_URL is valid) ─────────────────
engine = None
SessionLocal = None
Base = None

try:
    if DATABASE_URL:
        from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, create_engine
        from sqlalchemy.ext.declarative import declarative_base
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import QueuePool, NullPool

        is_serverless = bool(os.getenv("VERCEL"))

        engine = create_engine(
            DATABASE_URL,
            poolclass=NullPool if is_serverless else QueuePool,
            pool_pre_ping=True,
            **({"pool_size": 5, "max_overflow": 10} if not is_serverless else {}),
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        Base = declarative_base()
        print("✅  Database engine created (SQLAlchemy).")
    else:
        print("⚠️  DATABASE_URL not set. SQLAlchemy disabled (using Supabase Auth SDK instead).")
except Exception as exc:
    print(f"⚠️  Database engine creation failed: {exc}")
    print("   Auth is handled by Supabase Auth SDK — this is OK.")


def init_db():
    """Create all database tables if they don't exist."""
    if Base and engine:
        Base.metadata.create_all(bind=engine)
    else:
        print("⚠️  Skipping init_db — no database engine available.")


def get_db():
    """Dependency to get database session."""
    if not SessionLocal:
        raise RuntimeError("Database is not configured. Auth uses Supabase SDK.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
