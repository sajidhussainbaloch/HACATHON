## 🔐 Supabase Integration & Production Setup Guide

This guide walks you through setting up Supabase (PostgreSQL + Auth) and deploying to Vercel.

---

### ⚡ **Step 1: Create a Supabase Project**

1. Go to [https://supabase.com](https://supabase.com) and sign in/sign up
2. Click **"New Project"** and fill in:
   - **Project Name**: `realitycheck-ai` (or your choice)
   - **Database Password**: Generate a secure password (save it!)
   - **Region**: Choose closest to your users
3. Wait for the project to initialize (5-10 minutes)

---

### 🗄️ **Step 2: Create Database Tables**

1. In your Supabase dashboard, navigate to **"SQL Editor"** → **"New Query"**
2. Copy the entire contents from `backend/supabase_migration.sql`
3. Paste it into the SQL editor and click **"Run"**
4. Verify all 3 tables are created: `users`, `otps`, `password_resets`

**Check tables created:**
- Go to **"Table Editor"** in the left sidebar
- You should see all three tables listed

---

### 🔑 **Step 3: Get Your Supabase Credentials**

1. Click **"Project Settings"** (gear icon left sidebar)
2. Go to **"Database"** tab
3. Copy these values:
   - **Connection String** (under "Connection pooler" section)
   - Replace placeholders:
     - `[PASSWORD]` with your database password from Step 1
     - Keep `postgres` as the user and database name
   - **Example:** `postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres`

4. Click **"API"** tab (left sidebar under "Project Settings")
5. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon key** (safe to use in frontend)
   - **service_role key** (keep secret, only for backend)

---

### 🔐 **Step 4: Set Up Google OAuth**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. **Enable APIs:**
   - Search for **"Google+ API"** → Enable it
   - Search for **"Google Sign-In"** → Enable it

4. **Create OAuth Credentials:**
   - Go to **"Credentials"** (left sidebar)
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Choose **"Web application"**
   - Add **Authorized JavaScript origins:**
     - `http://localhost:5173` (local dev)
     - `http://localhost:3000` (if you run on 3000)
     - `https://your-domain.vercel.app` (production)
   - Add **Authorized redirect URIs:**
     - `http://localhost:5173` (local dev)
     - `http://localhost:3000` (local alt)
     - `https://your-domain.vercel.app` (production)
   - Click **"Create"**
5. Copy the **Client ID** and **Client Secret**

---

### 📝 **Step 5: Update Local `.env` Files**

#### **`backend/.env`**
```dotenv
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:6543/postgres
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
SECRET_KEY=your_secure_secret_key_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_id
CLOUDFLARE_API_TOKEN=your_cloudflare_token
HUGGINGFACE_API_TOKEN=your_huggingface_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=RealityCheck AI
```

#### **`frontend/.env.local`** (or `.env`)
```dotenv
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

---

### 🚀 **Step 6: Test Locally**

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ../frontend
   npm install
   ```

2. **Run backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```
   Backend runs on `http://localhost:8000`

3. **Run frontend (in another terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

4. **Test the flows:**
   - Sign up → Verify OTP (check email)
   - Log in with credentials
   - Log in with Google
   - Verify JWT tokens work

---

### 📦 **Step 7: Deploy to Vercel**

#### **A. Push code to GitHub**
```bash
git init
git add .
git commit -m "Add Supabase integration"
git push origin main
```

#### **B. Create Vercel Project**
1. Go to [vercel.com](https://vercel.com)
2. Click **"Import Project"** → Select your GitHub repo
3. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - Leave the rest as default
4. **Click "Deploy"**

#### **C. Set Environment Variables in Vercel**
After deployment succeeds, go to **Project Settings** → **Environment Variables**

Add these variables (Critical for serverless):

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:6543/postgres
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
SECRET_KEY=your_secure_key
CLOUDFLARE_ACCOUNT_ID=your_id
CLOUDFLARE_API_TOKEN=your_token
HUGGINGFACE_API_TOKEN=your_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=its_email@gmail.com
SMTP_PASSWORD=app_password
FROM_EMAIL=its_email@gmail.com
FROM_NAME=RealityCheck AI
```

**⚠️ IMPORTANT:** Make sure to:
- Use the **Connection Pooler URL** (port 6543) for serverless
- All variables must be set before redeploy
- Redeploy after adding env vars

---

### ✅ **Step 8: Final Verification**

1. **Test API endpoints:**
   ```bash
   # Signup
   curl -X POST https://your-domain.vercel.app/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"full_name":"Test User","email":"test@example.com","password":"password123"}'
   
   # Google Auth
   curl -X POST https://your-domain.vercel.app/auth/google \
     -H "Content-Type: application/json" \
     -d '{"id_token":"GOOGLE_ID_TOKEN_HERE"}'
   ```

2. **Check database in Supabase:**
   - Users table should have entries
   - OTPs should appear when you sign up
   - Passwords should be hashed

3. **Monitor logs:**
   - Vercel: **Deployments** → **Logs**
   - Supabase: **Database** → **Logs** (if available in your tier)

---

### 🛡️ **Production Best Practices**

✅ **Done in this setup:**
- Row-Level Security (RLS) enabled on tables
- Service role key restricted (backend-only)
- Anon key restricted (frontend-only)
- Connection pooling for serverless
- Password hashing with bcrypt
- JWT tokens with expiration

🔧 **Recommendations for future:**
1. Enable Supabase **Database backups** (auto-backup-replication)
2. Set up monitoring alerts in Vercel
3. Use a secrets manager (not `.env` files) for sensitive keys
4. Implement rate limiting on auth endpoints
5. Add CORS restrictions by domain (not `*`)
6. Enable HTTPS only (handled by Vercel/Supabase)
7. Rotate Google OAuth secret every 90 days
8. Monitor database connections in Supabase dashboard

---

### 🐛 **Troubleshooting**

#### **"Connection refused" error**
- Verify `DATABASE_URL` is correct (port should be **6543**)
- Check Vercel env vars are set
- Redeploy after setting env vars

#### **"Invalid Google token"**
- Verify `GOOGLE_CLIENT_ID` matches frontend
- Check Google OAuth credentials are correct
- Verify authorized domains in Google Console

#### **"OTP not sent"**
- Check SMTP credentials are correct
- Verify Gmail app password (not regular password)
- Enable 2FA on Gmail if not already

#### **Tables not created**
- Run the SQL migration again
- Check for errors in SQL Editor
- Verify you have correct database user permissions

---

### 📚 **Useful Links**

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/pooling)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Deployments](https://vercel.com/docs)
- [FastAPI + SQLAlchemy](https://fastapi.tiangolo.com/advanced/sql-databases/)

---

### 🎉 **Done!**

Your production-ready Supabase + Vercel setup is complete. The application now:
- ✅ Uses PostgreSQL instead of SQLite (works on Vercel!)
- ✅ Supports Google OAuth sign-in
- ✅ Has Row-Level Security configured
- ✅ Uses connection pooling for serverless
- ✅ Has environment variables properly configured
- ✅ Follows production security best practices
