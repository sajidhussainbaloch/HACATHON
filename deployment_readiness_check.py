#!/usr/bin/env python3
"""
Vercel Deployment Readiness Check
Verifies all configurations before deploying to Vercel
"""
import os
import json
import re
from pathlib import Path

def check_env_file(filepath, required_vars):
    """Check if env file exists and has required variables"""
    if not os.path.exists(filepath):
        return False, f"Missing: {filepath}"
    
    with open(filepath) as f:
        content = f.read()
    
    missing = [var for var in required_vars if f'{var}=' not in content]
    if missing:
        return False, f"Missing vars in {filepath}: {', '.join(missing)}"
    return True, f"OK: {filepath}"

def check_file_exists(filepath):
    """Check if a file exists"""
    return os.path.exists(filepath), filepath

def check_package_json(filepath):
    """Check if package.json has required dependencies"""
    if not os.path.exists(filepath):
        return False, f"Missing: {filepath}"
    
    with open(filepath) as f:
        pkg = json.load(f)
    
    required = ['@supabase/supabase-js', 'react-router-dom', 'vite']
    deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
    missing = [dep for dep in required if dep not in deps]
    
    if missing:
        return False, f"Missing dependencies: {', '.join(missing)}"
    return True, f"OK: {filepath} has all required deps"

def main():
    print("=" * 70)
    print("VERCEL DEPLOYMENT READINESS CHECK")
    print("=" * 70)
    print()
    
    checks = {
        "Frontend": [],
        "Backend": [],
        "Environment": [],
        "Code Quality": []
    }
    
    # ===== FRONTEND CHECKS =====
    print("[1/4] Checking Frontend...")
    
    frontend_env_vars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_API_URL',
        'VITE_GOOGLE_CLIENT_ID'
    ]
    ok, msg = check_env_file('frontend/.env', frontend_env_vars)
    checks["Frontend"].append((ok, msg))
    
    ok, msg = check_package_json('frontend/package.json')
    checks["Frontend"].append((ok, msg))
    
    required_files = [
        'frontend/src/App.jsx',
        'frontend/src/main.jsx',
        'frontend/src/services/supabase.js',
        'frontend/src/services/api.js',
        'frontend/src/context/AuthContext.jsx',
        'frontend/src/pages/Signup.jsx',
        'frontend/src/pages/Login.jsx',
        'frontend/vite.config.js',
        'frontend/package.json'
    ]
    
    for fpath in required_files:
        ok, filepath = check_file_exists(fpath)
        checks["Frontend"].append((ok, f"{'✓' if ok else '✗'} {filepath}"))
    
    # ===== BACKEND CHECKS =====
    print("[2/4] Checking Backend...")
    
    backend_env_vars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL',
        'SECRET_KEY'
    ]
    ok, msg = check_env_file('backend/.env', backend_env_vars)
    checks["Backend"].append((ok, msg))
    
    backend_files = [
        'backend/main.py',
        'backend/database.py',
        'backend/requirements.txt',
        'api/index.py'
    ]
    
    for fpath in backend_files:
        ok, filepath = check_file_exists(fpath)
        checks["Backend"].append((ok, f"{'✓' if ok else '✗'} {filepath}"))
    
    # ===== ENVIRONMENT CHECKS =====
    print("[3/4] Checking Environment Setup...")
    
    # Check if venv exists
    venv_ok = os.path.exists('.venv/Scripts/python.exe') or os.path.exists('.venv/bin/python')
    checks["Environment"].append((venv_ok, f"{'✓' if venv_ok else '✗'} Python venv"))
    
    # Check node_modules
    node_ok = os.path.exists('frontend/node_modules')
    checks["Environment"].append((node_ok, f"{'✓' if node_ok else '✗'} frontend/node_modules"))
    
    # ===== CODE QUALITY CHECKS =====
    print("[4/4] Checking Code Quality...")
    
    # Check for leftover old imports (actual imports, not function names)
    old_import_patterns = [
        'from @react-oauth/google',
        'import.*GoogleLogin',
        'from.*OTPInput'
    ]
    
    found_old = False
    for fpath in Path('frontend/src').rglob('*.jsx'):
        try:
            content = fpath.read_text(encoding='utf-8', errors='ignore')
            for pattern in old_import_patterns:
                if re.search(pattern, content):
                    checks["Code Quality"].append((False, f"Found old import pattern '{pattern}' in {fpath}"))
                    found_old = True
        except:
            pass
    
    if not found_old:
        checks["Code Quality"].append((True, "✓ No old imports found"))
    
    # ===== REPORT RESULTS =====
    print()
    print("=" * 70)
    print("RESULTS")
    print("=" * 70)
    print()
    
    all_pass = True
    for category, results in checks.items():
        print(f"\n{category}:")
        for ok, msg in results:
            status = "✓ PASS" if ok else "✗ FAIL"
            print(f"  {status}: {msg}")
            if not ok:
                all_pass = False
    
    print()
    print("=" * 70)
    if all_pass:
        print("✅ ALL CHECKS PASSED - Ready for Vercel deployment!")
    else:
        print("❌ SOME CHECKS FAILED - Fix issues before deploying")
    print("=" * 70)
    
    return 0 if all_pass else 1

if __name__ == '__main__':
    exit(main())
