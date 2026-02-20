"""
RealityCheck AI — Database Connection Test
Validates DATABASE_URL and Supabase connection before running the app.
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text, create_engine
from sqlalchemy.exc import OperationalError, ArgumentError

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

def test_connection():
    """Test database connection and print detailed results."""
    
    print("\n" + "="*70)
    print("🔍 DATABASE CONNECTION TEST")
    print("="*70 + "\n")
    
    # 1. Check if DATABASE_URL is set
    if not DATABASE_URL:
        print("❌ FATAL: DATABASE_URL environment variable is not set!")
        print("\n📝 How to fix:")
        print("   1. Open backend/.env")
        print("   2. Replace this line:")
        print("      DATABASE_URL=postgresql://postgres:password@db.PROJECT_ID.supabase.co:6543/postgres")
        print("   3. With your actual Supabase credentials:")
        print("      - Replace 'password' with your Supabase password")
        print("      - Replace 'PROJECT_ID' with your Supabase project ID")
        print("\n   📖 See ENV_VARS_CHECKLIST.md for detailed instructions\n")
        return False
    
    # 2. Check if it's a placeholder
    if "PROJECT_ID" in DATABASE_URL or DATABASE_URL.endswith("@db.:.6543/postgres"):
        print("❌ DATABASE_URL is still using placeholder values!")
        print(f"\n   Current: {DATABASE_URL}")
        print("\n📝 How to fix:")
        print("   1. Go to Supabase Dashboard → Project Settings → Database")
        print("   2. Copy the 'Connection Pooler' URL (port 6543)")
        print("   3. Replace the DATABASE_URL in backend/.env")
        print("   4. Make sure you use the correct password\n")
        return False
    
    # 3. Try to parse the connection string
    try:
        from urllib.parse import urlparse
        parsed = urlparse(DATABASE_URL)
        print(f"✅ DATABASE_URL format is valid")
        print(f"   Host: {parsed.hostname}")
        print(f"   Port: {parsed.port}")
        print(f"   Database: {parsed.path.split('/')[-1]}")
        print(f"   User: {parsed.username}\n")
    except Exception as e:
        print(f"❌ Invalid DATABASE_URL format: {e}\n")
        return False
    
    # 4. Try to create engine
    try:
        print("Attempting to connect to database...")
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=5,
            connect_args={"connect_timeout": 10}
        )
        print("✅ SQLAlchemy engine created successfully\n")
    except ArgumentError as e:
        print(f"❌ Invalid connection string: {e}\n")
        return False
    except Exception as e:
        print(f"❌ Engine creation failed: {e}\n")
        return False
    
    # 5. Test actual connection
    try:
        print("Testing actual database connection...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            print("\n" + "="*70)
            print("✅ ALL CHECKS PASSED - Your database is properly configured!")
            print("="*70 + "\n")
            return True
    except OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print("\n📝 Possible causes:")
        print("   • Wrong password or credentials")
        print("   • Project ID doesn't exist")
        print("   • Supabase project is suspended or deleted")
        print("   • Network/firewall issue")
        print("   • Port 6543 is blocked\n")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}\n")
        return False
    finally:
        try:
            engine.dispose()
        except:
            pass


if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
