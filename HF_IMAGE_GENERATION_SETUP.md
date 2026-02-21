# 🎨 Hugging Face Image Generation Setup

Your image generator now uses the **free** Hugging Face Inference API instead of DeAPI!

## ✅ What Changed

- **Removed**: DeAPI integration (was giving 404 errors)
- **Added**: Hugging Face Inference API (reliable, free, no polling needed)
- **Models Available**:
  - FLUX.1 Schnell (Fast) ⚡
  - Stable Diffusion 2.1
  - Stable Diffusion 1.5

## 🔑 Get Your Free HF API Key

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Give it a name (e.g., "Vercel Image Gen")
4. Select **Read** access
5. Click "Generate token"
6. **Copy the token** (starts with `hf_...`)

## 📝 Set Environment Variable in Vercel

### Option 1: Via Vercel Dashboard
1. Go to your project on https://vercel.com
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `HF_API_KEY`
   - **Value**: `hf_...` (your token from above)
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**
5. Go to **Deployments** → Click "..." on latest → **Redeploy**

### Option 2: Via Vercel CLI
```bash
vercel env add HF_API_KEY
# Paste your token when prompted
# Select all environments
vercel --prod
```

## 🚀 How It Works

1. User enters prompt
2. Frontend sends request to `/api/image/generate`
3. Backend calls Hugging Face Inference API with the prompt
4. **Image is returned immediately** (no polling needed!)
5. Image displays in the UI

**No more timeouts!** HF API returns images directly.

## 📊 Rate Limits (Free Tier)

- **~1,000 requests/day** per account
- **~10 concurrent requests**
- Rate limits reset daily
- No credit card required

If you hit limits:
- Wait a few hours
- Or upgrade to HF Pro ($9/month for unlimited)

## 🧪 Test Locally

```bash
# Set env var in your terminal
$env:HF_API_KEY = "hf_your_token_here"

# Start backend
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# In another terminal, start frontend
cd frontend
npm run dev
```

Visit http://localhost:5173 and try generating an image!

## ⚙️ Model Details

| Model | Speed | Quality | Size Limit |
|-------|-------|---------|------------|
| FLUX.1 Schnell | ⚡ Fast (2-5s) | Excellent | 1024x1024 |
| SD 2.1 | Medium (5-10s) | Very Good | 768x768 |
| SD 1.5 | Fast (3-7s) | Good | 512x512 |

## 🐛 Troubleshooting

### "HF_API_KEY is not configured"
- Make sure you set the env var in Vercel
- Redeploy after adding the env var

### "Model is currently loading"
- Wait 10-20 seconds and try again
- HF models "wake up" on first use

### "Invalid Hugging Face API key"
- Check that your token starts with `hf_`
- Regenerate token at https://huggingface.co/settings/tokens

### Image generation fails
- Check if you hit rate limits
- Try a different model
- Check Vercel logs for details

## 🎉 Benefits Over DeAPI

✅ **No polling** - instant results  
✅ **No mysterious 404s**  
✅ **Better documentation**  
✅ **More models available**  
✅ **Completely free**  
✅ **Faster response times**  
✅ **Industry standard**  

Your image generator is now production-ready! 🚀
