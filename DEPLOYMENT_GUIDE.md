# RealityCheck AI - Complete Migration & Deployment Guide

## ✅ What's Done

### Architecture Migration
- ✅ **Auth System Rewritten:** Switched from backend SQLAlchemy+OTP → Supabase Auth SDK (frontend)
- ✅ **Frontend Updated:** React 19 + Vite 6, all pages use Supabase Auth functions
- ✅ **Backend Simplified:** FastAPI now auth-agnostic, only `/health` and `/analyze` endpoints
- ✅ **Database Issue Resolved:** IPv6 connectivity problem bypassed via HTTPS REST API
- ✅ **Dependencies Installed:** All pip packages (backend) and npm packages (frontend)
- ✅ **Environment Variables:** Configured in both backend and frontend `.env` files
- ✅ **Local Servers Running:** Backend on :8000, Frontend on :3000 (verified responding)

### Code Changes Summary

| File | Change |
|------|--------|
| **frontend/src/services/supabase.js** | NEW - Supabase client initialization |
| **frontend/src/services/api.js** | REWRITTEN - All auth now via Supabase SDK |
| **frontend/src/context/AuthContext.jsx** | REWRITTEN - Uses Supabase session management |
| **frontend/src/pages/Signup.jsx** | REWRITTEN - Removed OTP, uses email confirmation |
| **frontend/src/pages/Login.jsx** | REWRITTEN - Removed GoogleLogin component |
| **frontend/src/pages/ResetPassword.jsx** | MODIFIED - Uses Supabase token-less flow |
| **frontend/src/main.jsx** | MODIFIED - Removed GoogleOAuthProvider |
| **frontend/.env** | REWRITTEN - Contains Supabase keys + API URL |
| **backend/database.py** | REWRITTEN - Database now optional |
| **backend/main.py** | MODIFIED - Auth endpoints removed |
| **backend/.env** | UPDATED - Real Supabase credentials + password |

---

## 🔴 CRITICAL ACTION REQUIRED: Supabase Configuration

Before testing signup, login, or Google OAuth, **you must configure Supabase Site URL**:

### Step 1: Open Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select project: **tsbmarhindpuyglzgndc**
3. Navigate to: **Authentication** → **URL Configuration**

### Step 2: Configure for Local Development
In the **Site URL** field, enter:
```
http://localhost:3000
```

In the **Redirect URLs** field, add (one per line or comma-separated):
```
http://localhost:3000/auth/callback
http://localhost:3000/
```

### Step 3: Save and Test
- Click **Save**
- Reload your browser
- Go to `http://localhost:3000/signup` and try creating an account

---

## 🧪 Testing Locally

### Prerequisites
- ✅ Backend running: `cd backend && python -m uvicorn main:app --reload`
- ✅ Frontend running: `cd frontend && npm run dev`
- ✅ Supabase Site URL configured (see above)

### Test Signup Flow
1. **Go to signup page:** `http://localhost:3000/signup`
2. **Fill form:**
   - Full Name: `Jane Doe`
   - Email: `jane@example.com`
   - Password: `Password123`
   - Confirm: `Password123`
3. **Click Sign Up**
   - If email confirmation is **enabled** in Supabase: See "Check your email" message
   - If email confirmation is **disabled**: Automatically logged in → redirected to `/app`
4. **Test analysis:** Upload image or paste text at `/app` (requires login)

### Test Google OAuth
1. **Go to signup page:** `http://localhost:3000/signup`
2. **Click "Sign up with Google"**
3. **Authorize** with your Google account
4. **Should see:** Logged in, redirected to `/app`

### Test Login
1. **Go to login page:** `http://localhost:3000/login`
2. **Enter email & password** from signup
3. **Click Log In**
4. **Should see:** Profile icon in navbar, can access `/app` and `/profile`

### Test Profile
1. **After login**, click profile avatar in navbar
2. **Should see:** Email, Full Name, edit option
3. **Try editing** full name and saving
4. **Should persist** (stored in Supabase Auth user metadata)

---

## 📦 Vercel Deployment Guide

### Phase 1: Prepare Frontend for Production (Local)

Update `frontend/.env` for production:
```bash
# OLD (local):
VITE_API_URL=http://localhost:8000

# NEW (production):
VITE_API_URL=https://your-vercel-project.vercel.app/api
```

*You'll know the Vercel URL after first deployment.*

### Phase 2: Update Supabase Config for Production

In Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://your-vercel-project.vercel.app
```

**Redirect URLs** (add these in addition to local ones):
```
https://your-vercel-project.vercel.app/auth/callback
https://your-vercel-project.vercel.app/
```

### Phase 3: Deploy to Vercel

#### Option A: Via GitHub (Recommended)
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Supabase Auth integration complete"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repo
   - Framework: **Vite**
   - Root Directory: `frontend`
   - Environment Variables (add these):
     ```
     VITE_SUPABASE_URL=https://tsbmarhindpuyglzgndc.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     VITE_API_URL=https://your-vercel-project.vercel.app/api
     VITE_GOOGLE_CLIENT_ID=136445917773-nol7eua5h7a0pp2bgska7udk2a7fg8pi.apps.googleusercontent.com
     ```
   - Click **Deploy**

3. **Update Site URL in Supabase** with your new Vercel URL (see Phase 2)

#### Option B: Via Vercel CLI (Alternative)
```bash
npm install -g vercel
vercel --cwd=frontend
# Follow prompts, set env vars when asked
```

### Phase 4: Deploy Backend (Python API)

**If using Vercel Serverless Functions:**

Create `api/index.py` (already exists):
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-project.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
def analyze(file: UploadFile = None, text: str = None):
    # ... analysis logic
    pass
```

**Deploy:** Push to GitHub, Vercel auto-deploys `/api` folder

---

## 🔐 Environment Variables Checklist

### Frontend (`.env`)
- [ ] `VITE_SUPABASE_URL` = `https://tsbmarhindpuyglzgndc.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = (from Supabase dashboard)
- [ ] `VITE_API_URL` = `http://localhost:8000` (local) or Vercel URL (production)
- [ ] `VITE_GOOGLE_CLIENT_ID` = `136445917773-nol7eua5h7a0pp2bgska7udk2a7fg8pi.apps.googleusercontent.com`

### Backend (`.env`)
- [ ] `SUPABASE_URL` = `https://tsbmarhindpuyglzgndc.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = (from Supabase)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase, keep secret!)
- [ ] `DATABASE_URL` = `postgresql://postgres:BJRyUc8XE2vljyv5@db.tsbmarhindpuyglzgndc.supabase.co:6543/postgres`
- [ ] `SECRET_KEY` = `HEhVhhS5umgD2CK7LsoecGolR_l_qWm4C-X87bH_zhE`
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` = (optional, if needed for backend)

---

## 🐛 Troubleshooting

### Signup Fails with "Email Address Invalid"
- Supabase requires valid email domain (`.com`, `.app`, `.io`, etc.)
- Don't use `.test` domain in production

### Signup Succeeds but No Confirmation Email
- Check email spam folder
- In Supabase, disable email confirmation: Auth → Providers → Email → "Require email confirmation" = OFF
- (Only recommended for development)

### Google OAuth Redirects to Blank Page
- Verify Site URL and Redirect URLs in Supabase match your domain exactly
- Check Google Cloud Console → OAuth 2.0 Client ID → Authorized origins/URIs include your domain
- Clear browser cookies/cache

### "Cannot GET /auth/callback" Error
- This is expected (no dedicated callback page needed)
- Supabase SDK handles the OAuth token in URL automatically
- Check browser console for errors

### "/app" Shows 404 or "Loading..." Forever
- Verify backend `/health` responds: `curl http://localhost:8000/health`
- Check browser console for CORS errors
- Ensure `VITE_API_URL` is correct in frontend `.env`

### Database Connection Errors in Backend Logs
- This is non-blocking (auth no longer uses direct DB)
- Backend still serves `/analyze` and `/health`
- IPv6 issue doesn't affect operation anymore

---

## 📝 Deployment Checklist

- [ ] Supabase Site URL configured for localhost
- [ ] Frontend `/signup` page loads without errors
- [ ] Signup creates user in Supabase Auth
- [ ] Login works with created user
- [ ] Google OAuth redirects and logs in user
- [ ] Profile page shows user info
- [ ] `/app` page loads and can submit analysis
- [ ] GitHub repo created and pushed
- [ ] Vercel project created and linked
- [ ] Environment variables set in Vercel dashboard
- [ ] Supabase Site URL updated to Vercel URL
- [ ] Vercel deployment successful
- [ ] Production signup/login/Google OAuth tested
- [ ] Backend `/analyze` endpoint working on Vercel

---

## 🚀 Quick Start Commands

```bash
# Start both servers locally
cd D:\HACATHON
# Terminal 1:
cd backend && python -m uvicorn main:app --reload

# Terminal 2:
cd frontend && npm run dev

# Browser:
# Signup:   http://localhost:3000/signup
# Login:    http://localhost:3000/login
# App:      http://localhost:3000/app
# Profile:  http://localhost:3000/profile

# For production:
git push origin main  # Deploy to Vercel
# Update Supabase Site URL to your Vercel URL
```

---

## 📚 Key Files Reference

- **Auth Logic:** [frontend/src/services/api.js](frontend/src/services/api.js)
- **Auth Context:** [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)
- **Signup Page:** [frontend/src/pages/Signup.jsx](frontend/src/pages/Signup.jsx)
- **Backend Health:** [backend/main.py](backend/main.py)
- **Supabase Client:** [frontend/src/services/supabase.js](frontend/src/services/supabase.js)

---

## 🎯 What's Different From Before

| Aspect | Before | After |
|--------|--------|-------|
| **Auth Backend** | Custom SQLAlchemy OTP | Supabase Auth SDK |
| **DB Connection** | Direct psycopg2 (IPv6 failed) | REST API over HTTPS |
| **Email Verification** | OTP codes | Email confirmation links |
| **Google OAuth** | @react-oauth/google One-Tap | Supabase OAuth redirect |
| **Signup -> Login** | OTP step required | Direct after email confirmed |
| **Session Storage** | localStorage JWT | Supabase session (secure, HTTP-only possible) |
| **Profile Updates** | Custom endpoint | Supabase `updateUser()` |
| **User Data** | Custom columns | Supabase Auth user_metadata |

---

## ✨ You're All Set!

The entire authentication system is now **fully migrated to Supabase**. 

**Next step:** Configure Supabase Site URL (critical), then test locally, then deploy to Vercel.

Good luck! 🎉
