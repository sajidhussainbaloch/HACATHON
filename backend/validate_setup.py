#!/usr/bin/env python3
"""
RealityCheck AI — Pre-Deployment Validator
Checks that all required environment variables and dependencies are configured.

Usage:
    python backend/validate_setup.py
"""

import os
import sys
from dotenv import load_dotenv

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'

def check(condition, message):
    """Print check result."""
    if condition:
        print(f"{GREEN}✅{RESET} {message}")
        return True
    else:
        print(f"{RED}❌{RESET} {message}")
        return False

def check_warning(condition, message):
    """Print warning (not critical)."""
    if not condition:
        print(f"{YELLOW}⚠️{RESET}  {message}")

# ─────────────────────────────────────────────────────────────────────────────

print(f"\n{BOLD}RealityCheck AI - Setup Validator{RESET}\n")

# Load environment
load_dotenv("backend/.env")

passed = 0
failed = 0

# ─────────────────────────────────────────────────────────────────────────────
print(f"{BOLD}1. Database Configuration{RESET}")
print("-" * 50)

db_url = os.getenv("DATABASE_URL", "")
if check(db_url, "DATABASE_URL is set"):
    passed += 1
    # Check for PostgreSQL
    if check("postgresql://" in db_url, "DATABASE_URL uses PostgreSQL (not SQLite)"):
        passed += 1
    else:
        failed += 1
        print(f"{RED}   → Should be: postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres{RESET}")
    
    # Check for port 6543
    if check("6543" in db_url, "Using port 6543 (connection pooler for serverless)"):
        passed += 1
    else:
        failed += 1
        print(f"{RED}   → Should use port 6543, not 5432{RESET}")
else:
    failed += 1
    print(f"{RED}   → Add DATABASE_URL to backend/.env{RESET}")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}2. Google OAuth Configuration{RESET}")
print("-" * 50)

print("Google OAuth checks removed — this project uses Supabase email/password auth only.")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}3. Security Configuration{RESET}")
print("-" * 50)

secret_key = os.getenv("SECRET_KEY", "")
if check(secret_key and len(secret_key) > 20, "SECRET_KEY is set and looks secure"):
    passed += 1
else:
    failed += 1
    print(f"{RED}   → Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\"{RESET}")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}4. API Keys (for Features){RESET}")
print("-" * 50)

check_warning(os.getenv("CLOUDFLARE_ACCOUNT_ID"), "CLOUDFLARE_ACCOUNT_ID is set (needed for LLM)")
check_warning(os.getenv("HUGGINGFACE_API_TOKEN"), "HUGGINGFACE_API_TOKEN is set (needed for embeddings)")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}5. Email Configuration (Optional but Recommended){RESET}")
print("-" * 50)

smtp_user = os.getenv("SMTP_USER", "")
smtp_pass = os.getenv("SMTP_PASSWORD", "")
if check(smtp_user and smtp_pass, "SMTP credentials configured"):
    passed += 1
else:
    check_warning(False, "Email OTP won't work without SMTP configuration")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}6. Python Dependencies{RESET}")
print("-" * 50)

deps = {
    'sqlalchemy': 'SQLAlchemy (database ORM)',
    'psycopg2': 'psycopg2 (PostgreSQL driver)',
    'google': 'google-auth (Google OAuth)',
    'fastapi': 'FastAPI (web framework)',
}

for module, name in deps.items():
    try:
        __import__(module)
        if check(True, f"{name} is installed"):
            passed += 1
    except ImportError:
        if check(False, f"{name} is installed"):
            failed += 1
            print(f"{RED}   → Run: pip install -r backend/requirements.txt{RESET}")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}7. Frontend Configuration{RESET}")
print("-" * 50)

frontend_env_file = "frontend/.env.local"
if os.path.exists(frontend_env_file):
    load_dotenv(frontend_env_file)
    # Frontend Google client ID not required since Google OAuth removed
    vite_client_id = os.getenv("VITE_GOOGLE_CLIENT_ID", "")
    if vite_client_id:
        check_warning(False, "VITE_GOOGLE_CLIENT_ID set but Google OAuth has been removed in this branch")

vite_api = os.getenv("VITE_API_URL", "")
if check(vite_api, f"VITE_API_URL set"):
    passed += 1
else:
    failed += 1
    print(f"{RED}   → Set to: http://localhost:8000 (local) or your backend URL (production){RESET}")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}8. Database Tables (if deployed){RESET}")
print("-" * 50)

try:
    from sqlalchemy import create_engine, inspect
    engine = create_engine(db_url, pool_pre_ping=True)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    required_tables = ['users', 'otps', 'password_resets']
    found_tables = [t for t in required_tables if t in tables]
    
    if len(found_tables) == len(required_tables):
        check(True, "All required database tables exist")
        passed += 1
    else:
        missing = set(required_tables) - set(found_tables)
        check(False, f"Database tables: missing {missing}")
        failed += 1
        print(f"{RED}   → Run SQL migration in Supabase SQL Editor{RESET}")
except Exception as e:
    check_warning(False, f"Could not connect to database to verify tables: {e}")

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}Summary{RESET}")
print("=" * 50)
print(f"{GREEN}✅ Passed: {passed}{RESET}")
print(f"{RED}❌ Failed: {failed}{RESET}")

if failed == 0:
    print(f"\n{GREEN}{BOLD}🎉 All checks passed! Ready to deploy.{RESET}\n")
    sys.exit(0)
else:
    print(f"\n{RED}{BOLD}⚠️  Fix the above issues before deploying.{RESET}\n")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
print("\n📚 Guides:")
print("   - Setup: SUPABASE_SETUP.md")
print("   - Environment: ENV_VARS_CHECKLIST.md")
print("   - Quick start: GETTING_STARTED.md")
print()
