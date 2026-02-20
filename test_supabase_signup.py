#!/usr/bin/env python3
"""Test Supabase Auth signup endpoint"""
import urllib.request
import json

url = 'https://tsbmarhindpuyglzgndc.supabase.co/auth/v1/signup'
test_user = {
    'email': 'testuser@realitycheck.app',
    'password': 'TestPass123456',
    'data': {'full_name': 'Test User'}
}

headers = {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzYm1hcmhpbmRwdXlnbHpnbmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODEzNzAsImV4cCI6MjA4NzE1NzM3MH0.3gpOh4PmQ-uKPY8YRLUw-xaGyULw4OU7eB7yXPIL9tM'
}

req = urllib.request.Request(
    url, 
    data=json.dumps(test_user).encode(), 
    headers=headers
)

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read().decode())
        print('✅ SIGNUP SUCCESS')
        uid = result.get('user', {}).get('id', 'N/A')
        email = result.get('user', {}).get('email', 'N/A')
        confirmed = result.get('user', {}).get('email_confirmed_at', 'pending')
        token = result.get('session', {}).get('access_token', 'N/A')
        print(f'User ID: {uid}')
        print(f'Email: {email}')
        print(f'Email Confirmed: {confirmed}')
        if token != 'N/A':
            print(f'Session Token: {token[:30]}...')
except urllib.error.HTTPError as e:
    body = e.read().decode()
    try:
        err = json.loads(body)
        code = err.get('error_code', err.get('code', 'Unknown'))
        msg = err.get('msg', err.get('message', body[:100]))
        print(f'⚠️  HTTP {e.code}: {code}')
        print(f'   Message: {msg}')
    except:
        print(f'⚠️  HTTP {e.code}: {body[:200]}')
except Exception as e:
    print(f'❌ Error: {type(e).__name__}: {str(e)[:100]}')
