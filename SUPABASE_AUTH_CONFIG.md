# Supabase Auth Configuration for RealityCheck AI

## Current Status ✅
- **Frontend:** Rewritten to use Supabase Auth SDK (`@supabase/supabase-js`)
- **Backend:** Simplified (auth endpoints removed, database optional)
- **Servers:** Both running locally (Backend :8000, Frontend :3000)
- **Auth Flow:** Frontend talks directly to Supabase over HTTPS for signup/login/Google OAuth

## 🔴 CRITICAL: Configure Supabase URL Settings

Before testing signup/login or Google OAuth, **you must set the Site URL in Supabase Dashboard**:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project `tsbmarhindpuyglzgndc`
3. Navigate to **Authentication** → **URL Configuration**
4. Set **Site URL** to one of the following:

   **For Local Development:**
   ```
   http://localhost:3000
   ```

   **For Production (Vercel):**
   ```
   https://your-vercel-deployment.vercel.app
   ```

5. Add **Redirect URLs** (comma-separated):
   ```
   http://localhost:3000/auth/callback,
   https://your-vercel-deployment.vercel.app/auth/callback
   ```

6. ✅ **Save**

## Why This Matters ❓

- **Site URL:** Tells Supabase where the frontend is running. Supabase uses this for email confirmation links and OAuth redirects.
- **Redirect URLs:** After OAuth login (Google), Supabase redirects back to your app with an auth token. Must match your frontend URL.
- **IPv6 Issue Bypass:** Since we switched to Supabase Auth SDK (HTTPS over IPv4), direct database connectivity is no longer needed.

## Testing Signup Flow

Once Site URL is configured:

1. Go to `http://localhost:3000/signup`
2. Fill in: Full Name, Email, Password, Confirm Password
3. Click **Sign Up**
   - If email confirmation is **enabled** in Supabase: You'll see "Check your email for confirmation link"
   - If email confirmation is **disabled**: You'll be automatically logged in and redirected to `/app`
4. Test analysis feature at `/app`
5. View profile at `/profile` (requires login)

## Testing Google OAuth

1. Go to `http://localhost:3000/signup` or `/login`
2. Click **"Sign up/in with Google"**
3. Browser will redirect to Google login
4. After Google approval, Supabase redirects back to your app with auth session
5. You should be logged in and redirected to `/app`

## Environment Variables (Already Configured ✅)

**Frontend (.env):**
```
VITE_SUPABASE_URL=https://tsbmarhindpuyglzgndc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=136445917773-nol7eua5h7a0pp2bgska7udk2a7fg8pi.apps.googleusercontent.com
```

**Backend (.env):**
```
SUPABASE_URL=https://tsbmarhindpuyglzgndc.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres:BJRyUc8XE2vljyv5@db.tsbmarhindpuyglzgndc.supabase.co:6543/postgres
(Note: Direct DB not used for auth anymore)
```

## Architecture Changes (From Previous Sessions)

| Component | Before | After |
|-----------|--------|-------|
| **Auth Method** | SQLAlchemy + OTP (backend) | Supabase Auth SDK (frontend) |
| **Database** | Direct psycopg2 connection | REST API (no direct connection needed) |
| **Email Verification** | OTP code | Email confirmation link |
| **Google OAuth** | `@react-oauth/google` component | Supabase OAuth redirect |
| **Backend Auth Routes** | `/auth/signup`, `/auth/login`, etc. | All removed |
| **Database Connectivity** | IPv6 host → Failed | HTTPS REST API → Works ✅ |

## Next Steps: Vercel Deployment

When ready to deploy to Vercel:

1. **Update Site URL** in Supabase to your Vercel URL:
   ```
   https://your-project-name.vercel.app
   ```
2. **Update frontend/.env** for production:
   ```
   VITE_API_URL=https://your-project-name.vercel.app/api
   ```
3. **Git push** to deploy frontend + backend functions
4. **Test** signup/login/Google OAuth on production URL
5. Ensure Supabase redirect URLs include your Vercel URL

## Debugging

**If signup fails:**
- Check browser console for errors (F12 → Console)
- Verify Site URL is set correctly in Supabase
- Check network tab: `/api/auth/v1/signup` should return 200 or 400 with error message

**If Google OAuth doesn't redirect:**
- Verify Redirect URLs in Supabase include your exact frontend URL
- Check Google Cloud Console → OAuth 2.0 Client ID → Authorized JavaScript origins and redirect URIs
- Ensure your browser allows third-party cookies (required for OAuth)

**If "Database initialization failed" in backend logs:**
- This is expected and non-blocking (auth doesn't use DB anymore)
- Backend `/health` and `/analyze` still work fine

## Summary

✅ All critical files rewritten  
✅ Both servers running  
✅ No frontend compile errors  
🔴 **Action Required:** Configure Supabase Site URL (see above)  
⏳ Ready to test signup/login once Site URL is set
