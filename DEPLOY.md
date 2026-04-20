# AI Capital Flows — Deployment Guide

## ✅ Current Status
The dashboard is live and hosted at your Perplexity Computer link.
64 deals tracked · $7.85B+ deployed · Jan 1 – Apr 20, 2026

---

## Why Not Vercel?

Vercel runs serverless functions — they start fresh on every request, with no persistent filesystem. This app uses SQLite (a local file database), which needs to survive between requests. **Vercel will always return empty data** for this architecture.

The right platforms for this stack are **Railway** or **Render** — both support persistent Node.js servers with filesystem, have free tiers, and auto-deploy from GitHub.

---

## Option A: Railway (Recommended — 5 minutes)

### Step 1: Push your code to GitHub
Your code is already at: https://github.com/padma2012/ai-capital-flows

### Step 2: Deploy to Railway
1. Go to https://railway.app and sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select `padma2012/ai-capital-flows`
4. Railway auto-detects Node.js and runs `npm start`

### Step 3: Set environment variables
In Railway dashboard → your project → **Variables** tab, add:
```
OPENAI_API_KEY=sk-...your key here...
CRON_SECRET=any-random-string-you-choose
NODE_ENV=production
```

### Step 4: Set up daily cron
Railway has a built-in cron service:
1. In your project, click **New → Cron Job**
2. Set schedule: `0 7 * * *` (7am UTC daily)
3. Set command: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR-RAILWAY-URL/api/cron/daily`

### Step 5: Custom domain (optional)
In Railway → Settings → Domains → add `ai-capital-flows.yourdomain.com`

---

## Option B: Render (Also free)

1. Go to https://render.com → New → Web Service
2. Connect GitHub → select `padma2012/ai-capital-flows`
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add environment variables: `OPENAI_API_KEY`, `CRON_SECRET`, `NODE_ENV=production`
6. For daily updates: New → Cron Job → schedule `0 7 * * *`

---

## Database Persistence Note

The `data.db` SQLite file is committed to your repo and pre-seeded with 64 deals. On Railway/Render:
- The file persists between deploys (unlike Vercel)
- The daily cron adds new deals automatically
- To reset: delete `data.db` and redeploy (it re-seeds from `server/seed.ts`)

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | GPT-4o mini for deal extraction from RSS feeds |
| `CRON_SECRET` | Yes | Secret token to protect the `/api/cron/daily` endpoint |
| `NODE_ENV` | Yes | Set to `production` |

---

## Local Development

```bash
cd ai-capital-flows
npm install
npm run dev        # starts on http://localhost:5000
```

To trigger the pipeline manually:
```bash
curl -X POST http://localhost:5000/api/pipeline/run
```
