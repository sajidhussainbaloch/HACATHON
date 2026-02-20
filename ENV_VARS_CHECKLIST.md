## 🔑 Environment Variables Checklist

Use this checklist to collect all required values before deploying.

---

## ① Supabase Credentials

**How to get them:**
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Database**

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:6543/postgres` | Connection Pooler (port 6543!) |
| `SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` | API Section (optional) |
| `SUPABASE_ANON_KEY` | `eyJ...` | API Section (optional) |

**⚠️ Important:** 
- Use **port 6543** (pooler), not 5432!
- `[PASSWORD]` is what you set when creating the project
- `[PROJECT_ID]` appears in the connection string

---

## ② Google OAuth (via Supabase)

**Supabase handles Google OAuth for you!** No need to manage credentials in Vercel.

**How to set it up:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select a project
3. Enable **Google+ API** and **Google Sign-In API**
4. Go to **Credentials** → Create **OAuth 2.0 Client ID** (Web application)
5. Set authorized origins:
   - `https://[PROJECT_ID].supabase.co` (your Supabase domain)
6. Set authorized redirect URIs:
   - `https://[PROJECT_ID].supabase.co/auth/v1/callback` (Supabase callback)
7. Copy **Client ID** and **Client Secret**
8. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
9. Paste Client ID and Client Secret
10. Enable the provider
11. Save

**⚠️ Important:**
- You do NOT store Google credentials in Vercel
- Supabase handles all OAuth flows
- All traffic goes through Supabase
- Keep `CLIENT_SECRET` only in Supabase

---

## ③ API Keys (Existing)

**How to get them:**

| Variable | Service | Get from |
|----------|---------|----------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | Docs → Workers & Pages → Account details |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | API Tokens section |
| `HUGGINGFACE_API_TOKEN` | Hugging Face | Settings → API tokens |

---

## ④ Email/SMTP (Existing)

**For Gmail:**
1. Enable 2-Factor Authentication
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select Mail + Windows/Linux
4. Copy the 16-character password

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail email |
| `SMTP_PASSWORD` | The 16-char app password |
| `FROM_EMAIL` | Your Gmail email |
| `FROM_NAME` | `RealityCheck AI` |

---

## ⑤ Security

Generate a secure secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Copy output from above command |

---

## 📋 Pre-Deployment Checklist

### **Before Local Testing:**
- [ ] Supabase project created
- [ ] Database tables created (SQL migration run)
- [ ] DATABASE_URL collected (with port 6543)
- [ ] Google OAuth credentials created
- [ ] API keys (Cloudflare, Hugging Face) collected
- [ ] Gmail app password generated

### **Before Vercel Deployment:**
- [ ] Code is on GitHub
- [ ] All values from above collected
- [ ] Google OAuth updated with Vercel domain
- [ ] Vercel env vars ready to paste

### **After Vercel Deployment:**
- [ ] All env vars set in Vercel
- [ ] Project redeployed
- [ ] Google OAuth redirects updated to verify domain
- [ ] Frontend loads without errors
- [ ] API endpoints respond
- [ ] Google login appears on login page

---

## 🔐 Security Best Practices

✅ **Do:**
- Store `CLIENT_SECRET` in Vercel only, never in frontend
- Keep `GOOGLE_CLIENT_SECRET` private
- Use different values for dev/prod
- Rotate secrets every 90 days
- Enable 2FA on Google account
- Monitor Supabase logs

❌ **Don't:**
- Commit `.env` files with real keys to GitHub
- Share URLs in public channels
- Use same secret for prod and dev
- Hardcode credentials in code
- Share Vercel env var values

---

## 📱 Quick Value Summary

**Print this and fill in before deployment:**

```
SUPABASE:
  Database URL: ________________________
  Project ID:   ________________________
  DB Password:  ________________________

GOOGLE OAUTH (configure in Supabase, not Vercel):
  Client ID:     ________________________
  Client Secret: ________________________
  (These go into Supabase Dashboard → Authentication → Providers → Google)

API KEYS:
  Cloudflare ID:    ________________________
  Cloudflare Token: ________________________
  HuggingFace:      ________________________

EMAIL:
  Gmail:        ________________________
  App Password: ________________________

SECURITY:
  SECRET_KEY:   ________________________

FRONTEND:
  Vercel Domain: ________________________
```

---

## ✅ Ready to Deploy!

Once all fields above are filled, you're ready to:
1. Test locally
2. Push to GitHub
3. Deploy to Vercel
4. Set env vars in Vercel
5. Redeploy

**🎉 You're all set!**
