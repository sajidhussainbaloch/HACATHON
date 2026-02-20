# Vercel Deployment - Step by Step Guide

**Status**: ✅ Project ready for deployment
**Deployment Date**: February 20, 2026
**Project Type**: React (Vite) + FastAPI

---

## 📋 Pre-Deployment Checklist

- ✅ All frontend files built successfully
- ✅ All backend files configured
- ✅ No code syntax errors
- ✅ All env vars set locally
- ✅ Frontend & Backend both running locally
- ✅ Tested authentication locally
- ✅ Unused dependencies removed
- ✅ Dead code cleaned up

---

## 🚀 Deployment Steps

### STEP 1: Push to GitHub

```bash
cd D:\HACATHON
git add .
git commit -m "Supabase Auth integration complete - ready for Vercel deploy"
git push origin main
```

**What this does:**
- Uploads all your code to GitHub
- Vercel monitors GitHub and auto-deploys on push

---

### STEP 2: Connect to Vercel

1. **Go to** https://vercel.com/new
2. **Click** "Import Git Repository"
3. **Select** your GitHub repo (RealityCheck AI)
4. **Click** "Import"

---

### STEP 3: Configure Project Settings

#### Project Name
- **Framework**: Vite
- **Root Directory**: `frontend` (important!)

#### Environment Variables
Click "Environment Variables" and add these 4:

```
VITE_SUPABASE_URL
Value: https://tsbmarhindpuyglzgndc.supabase.co

VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzYm1hcmhpbmRwdXlnbHpnbmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODEzNzAsImV4cCI6MjA4NzE1NzM3MH0.3gpOh4PmQ-uKPY8YRLUw-xaGyULw4OU7eB7yXPIL9tM

VITE_API_URL
Value: [LEAVE BLANK FOR NOW - will update after first deploy]

VITE_GOOGLE_CLIENT_ID
Value: 136445917773-nol7eua5h7a0pp2bgska7udk2a7fg8pi.apps.googleusercontent.com
```

---

### STEP 4: Deploy

Click **"Deploy"** button

**What happens:**
- Vercel clones your repo
- Installs npm dependencies (`npm install`)
- Builds the app (`npm run build`)
- Deploys to CDN
- Assigns you a URL like: `https://realitycheck-ai-xxxxx.vercel.app`

**Wait time:** 2-5 minutes

---

### STEP 5: Get Your Vercel URL

After deployment completes, you'll see:
```
✅ Production domain
https://realitycheck-ai-xxxxx.vercel.app
```

**Copy this URL** (you need it in next steps)

---

### STEP 6: Update Environment Variables

Now that you have your Vercel URL, go back to:

**Vercel Dashboard → Settings → Environment Variables**

Find `VITE_API_URL` and update it:

```
VITE_API_URL
Value: https://realitycheck-ai-xxxxx.vercel.app/api
(Replace xxxxx with your actual URL)
```

**Click "Save"** → Vercel auto-redeploys with new env var

---

### STEP 7: Update Supabase Configuration

**Go to** https://app.supabase.com

1. **Select** project `tsbmarhindpuyglzgndc`
2. **Navigate to** Authentication → URL Configuration
3. **Update Site URL**:
   ```
   https://realitycheck-ai-xxxxx.vercel.app
   (Replace with YOUR Vercel URL)
   ```
4. **Add Redirect URLs** (one per line):
   ```
   https://realitycheck-ai-xxxxx.vercel.app/auth/callback
   https://realitycheck-ai-xxxxx.vercel.app/
   ```
5. **Click "Save"**

---

### STEP 8: Test Production

Open your browser and visit:
```
https://realitycheck-ai-xxxxx.vercel.app
```

**Test these flows:**

1. **Email Signup**
   - Go to `/signup`
   - Create account with email/password
   - Should receive confirmation email
   - Click confirmation link
   - Should be logged in

2. **Google OAuth**
   - Go to `/signup` or `/login`
   - Click "Sign up/in with Google"
   - Should redirect to Google
   - After approval, should be logged in

3. **Upload & Analyze**
   - After login, go to `/app`
   - Upload an image or paste text
   - Should see analysis results

4. **Profile**
   - Click profile icon in navbar
   - Should show your email and name
   - Should be able to edit name

---

## 📊 What's Running Where

| Component | Local | Production |
|-----------|-------|------------|
| **Frontend (React)** | http://localhost:3000 | https://realitycheck-ai-xxxxx.vercel.app |
| **Backend API** | http://localhost:8000 | https://realitycheck-ai-xxxxx.vercel.app/api |
| **Auth System** | Supabase | Supabase (same project) |
| **Database** | Supabase | Supabase (same project) |

---

## 🔐 Security Notes

✅ **API Keys:**
- `VITE_SUPABASE_ANON_KEY` is public (allowed to be in frontend)
- `SUPABASE_SERVICE_ROLE_KEY` is kept secret (backend only, NOT deployed yet)

✅ **Google OAuth:**
- Google credentials are secure
- No passwords stored
- HTTPS everywhere

✅ **User Data:**
- Encrypted at rest in Supabase
- Encrypted in transit (HTTPS)

---

## 🆘 Troubleshooting

### Build Fails on Vercel
**Error:** "vite: command not found"
**Solution:** Make sure Root Directory is set to `frontend`

### Blank Page on Production
**Error:** Page loads but shows nothing
**Solution:** Check browser console (F12) for errors. May be env var issue.

### Google OAuth Redirect Error
**Error:** "redirect_uri_mismatch"
**Solution:** Update Supabase Site URL to your Vercel URL (Step 7)

### Database Connection Error
**Error:** "ECONNREFUSED" or "Network error"
**Solution:** Normal - direct DB connection not used for auth. Supabase REST API used instead.

### Can't Log In
**Error:** "Invalid email or password"
**Solution:** Make sure you created account on production (not just locally). Try signup again.

---

## 📝 Commands Reference

```bash
# Build & test locally before deploy
cd frontend
npm run build

# View production build locally (optional)
npm run preview

# Check deployment status
# Go to: https://vercel.com/dashboard

# View logs
# Go to: Dashboard → Project → Deployments → View Logs
```

---

## 🎉 You're Deployed!

Once all tests pass on production, you're done! 

Users can now:
1. Sign up with email/password
2. Sign in with Google
3. Reset password
4. Analyze text/images
5. View their profile

---

## 📚 Important Files

| File | Purpose |
|------|---------|
| `frontend/.env` | Frontend env vars (public, safe) |
| `backend/.env` | Backend env vars (secret, not deployed yet) |
| `vercel.json` | Vercel config (if needed) |
| `frontend/vite.config.js` | Vite build config |
| `frontend/package.json` | Dependencies |

---

## ⚠️ Important Notes

1. **Vercel deploys frontend only** (Vite + React)
   - Backend not deployed yet (for later)
   - Currently using local backend for `/analyze` endpoint
   - Will need separate backend deployment (Vercel Functions or Railways)

2. **Auth works via Supabase SDK**
   - No direct database connection needed
   - Works because Supabase Auth uses HTTPS (supports IPv4)

3. **Keep `.env` files secret**
   - Don't commit to GitHub
   - Already in `.gitignore`

---

## Next Steps After Deployment

1. ✅ Verify production signup/login/Google OAuth works
2. ⏳ Deploy backend API (optional - currently local)
3. ⏳ Add custom domain (optional)
4. ⏳ Enable analytics
5. ⏳ Set up error tracking

---

**Ready to deploy? Start with STEP 1 ↑**
