## 🚀 **Quick Start: Supabase Integration**

Your app is now integrated with **Supabase + Google OAuth** for Vercel deployment!

---

## 📚 **Documentation Files**

Read these in order:

1. **[ENV_VARS_CHECKLIST.md](ENV_VARS_CHECKLIST.md)** ← **START HERE**
   - Collect all required environment variables
   - Printable checklist of values needed

2. **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** 
   - Step-by-step Supabase setup (30 minutes)
   - Create project, database, Google OAuth
   - Test locally and deploy to Vercel

3. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**
   - What code was changed
   - Complete API reference
   - FAQ and troubleshooting

---

## ⚡ **30-Second Setup Overview**

```
1. Create Supabase project       (5 min) ← Go to supabase.com
2. Run SQL migration script      (2 min) ← Copy/paste in Supabase SQL Editor
3. Create Google OAuth creds     (10 min) ← Go to Google Cloud Console
4. Update .env files            (5 min) ← Copy values from steps 1-3
5. Test locally                 (10 min) ← npm run dev + python main:app
6. Deploy to Vercel             (5 min) ← Push to GitHub, import in Vercel
7. Add env vars to Vercel       (5 min) ← Paste same values as step 4
```

**Total: ~45 minutes from zero to production**

---

## 🎯 **Key Files Modified**

### Backend
- ✅ `database.py` - Now uses Supabase PostgreSQL
- ✅ `services/auth.py` - Added Google OAuth handler
- ✅ `main.py` - Added `/auth/google` endpoint
- ✅ `requirements.txt` - Added psycopg2-binary + google-auth
- ✅ `backend/supabase_migration.sql` - *NEW* - SQL to create all tables

### Frontend
- ✅ `src/main.jsx` - Added GoogleOAuthProvider wrapper
- ✅ `src/pages/Login.jsx` - Added Google Sign-In button
- ✅ `src/pages/Signup.jsx` - Added Google Sign-Up button
- ✅ `src/services/api.js` - Added apiGoogleAuth function
- ✅ `package.json` - Added @react-oauth/google

---

## 🔑 **Critical: You MUST Change**

Your `.env` file currently has real secrets. **⚠️ DO NOT COMMIT IT!**

1. **Delete these lines from `.env`:**
   ```
   DATABASE_URL=sqlite:///./realitycheck.db  ❌ OLD
   ```

2. **Replace with:**
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.XXX.supabase.co:6543/postgres
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_ID.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_SECRET
   ```

3. **Keep everything else:** CLOUDFLARE, HUGGINGFACE, SMTP, etc.

---

## 📝 **What to Do Next**

### **Option A: Test Locally First** (Recommended)

```bash
# 1. Create Supabase project
#    → Go to supabase.com, create project

# 2. Create tables
#    → Copy content of backend/supabase_migration.sql
#    → Paste in Supabase → SQL Editor → Run

# 3. Get credentials
#    → Copy DATABASE_URL (use port 6543!)
#    → Get Google Client ID from Google Cloud Console

# 4. Configure Google OAuth in Supabase
#    → Supabase Dashboard → Authentication → Providers → Google
#    → Paste Client ID and Client Secret
#    → Enable provider
#    → Save

# 5. Update .env
nano backend/.env          # Update DATABASE_URL only

# 6. Install + test
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload

# 7. In another terminal
cd frontend
npm install
npm run dev

# 8. Visit http://localhost:5173
#    Test: Sign up, Email verify, Login, Google auth
```

### **Option B: Deploy to Vercel First**

1. Push code to GitHub
2. Go to vercel.com → Import project
3. **Don't deploy yet** - first set env vars
4. Go to **Project Settings** → **Environment Variables**
5. Add all variables from ENV_VARS_CHECKLIST.md
6. Create a new deployment
7. Test at your Vercel domain

---

## ✨ **New Features**

### **Google Sign-In**
- Button appears on Login & Signup pages
- One-click account creation
- Email auto-verified (no OTP needed)
- Works with existing email accounts

### **Database**
- Now uses PostgreSQL (Supabase)
- Works perfectly on Vercel (no more "read-only filesystem" errors)
- Auto-backups
- Can scale without code changes

---

## 🔍 **How to Verify It Works**

### **Local Testing**
```bash
# Backend running? Should see log: "✅ Database initialized"
# Frontend running? Should see "Welcome Back" login page
# Google button appears? ✅
# Can you sign up? ✅
# OTP email arrives? ✅
# Can you login with Google? ✅
```

### **Vercel Testing**
```bash
# Visit https://your-app.vercel.app
# Can you see login page? ✅
# Does Google button work? ✅
# Backend API reachable? Check browser Network tab ✅
```

---

## ❌ **Common Mistakes**

❌ **Using port 5432 instead of 6543**
→ ✅ Use 6543 (connection pooler for serverless)

❌ **Forgetting to set env vars in Vercel**
→ ✅ Add them BEFORE deploying

❌ **Not running SQL migration**
→ ✅ Tables must exist before code runs

❌ **Google domains not updated**
→ ✅ Add your Vercel domain to authorized origins

❌ **Committing `.env` to GitHub**
→ ✅ Use `.gitignore` to keep secrets safe

---

## 🆘 **If Something Breaks**

1. **"Connection refused"?**
   - Check DATABASE_URL port is 6543
   - Check Supabase project is running
   - Check env var is set in Vercel

2. **"Google login failed"?**
   - Verify GOOGLE_CLIENT_ID in frontend env
   - Check authorized domains in Google Console
   - Check browser console for errors

3. **"OTP not sending"?**
   - Verify Gmail app password (not regular password)
   - Check SMTP_USER and SMTP_PASSWORD
   - Check Gmail 2FA is enabled

4. **"Table not found"?**
   - Run SQL migration again
   - Check SQL Editor for errors
   - Verify Supabase project is correct

---

## 📞 **Need Help?**

1. **Read:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - has detailed troubleshooting
2. **Check:** Browser console for JavaScript errors
3. **Check:** Vercel logs for backend errors
4. **Check:** Supabase SQL Editor for database errors

---

## 🎯 **Success Checklist**

- [ ] Supabase project created
- [ ] Database tables created
- [ ] Google OAuth credentials created
- [ ] Local `.env` updated
- [ ] Backend starts without errors
- [ ] Frontend loads and has Google button
- [ ] Can sign up with email
- [ ] Can login with email
- [ ] Can login with Google
- [ ] Deployed to Vercel
- [ ] Vercel env vars set
- [ ] Production works same as local

**Once all checked → You're done! 🎉**

---

## 📚 **Additional Resources**

- [Supabase Documentation](https://supabase.com/docs)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Deployments](https://vercel.com/docs)
- [FastAPI + SQLAlchemy](https://fastapi.tiangolo.com/advanced/sql-databases/)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/pooling)

---

## 🚀 **Ready?**

**Follow the 30-second overview above and you'll be live in < 1 hour!**

Start with: [ENV_VARS_CHECKLIST.md](ENV_VARS_CHECKLIST.md) →→→ [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

**Good luck! 🎉**
