# Antromic Deployment Guide

## ✅ What Was Created

1. **wrangler.toml** - Cloudflare Worker deployment config with all KV bindings
2. **cloudflare-worker/antromic-api.js** - Complete backend API code
3. **deploy-worker.bat** - One-click deploy script for Windows
4. **env.example** - Environment variables template

---

## 🚀 Quick Deploy (Backend)

### Option 1: Deploy Script (Easiest)

```bash
cd C:\Users\umiwi\Downloads\b_QcWHObWDFtF
deploy-worker.bat
```

This will:
1. Install Wrangler CLI
2. Login to Cloudflare
3. Deploy the worker

### Option 2: Copy-Paste (Fastest)

1. Go to https://dash.cloudflare.com/ → Workers & Pages → antromic-api
2. Click **Edit Code**
3. Copy ALL from `cloudflare-worker/antromic-api.js`
4. Paste and click **Deploy**

### Option 3: Wrangler CLI

```bash
# Install wrangler
npm install -g wrangler

# Login (opens browser)
wrangler login

# Deploy
wrangler deploy
```

---

## 🔧 Setup Frontend

1. Create `.env.local` file in project root:
```env
NEXT_PUBLIC_CLOUDFLARE_WORKER_URL=https://antromic-api.umiwinsupport.workers.dev
```

2. Run the frontend:
```bash
npm install
npm run dev
```

3. Open http://localhost:3000

---

## 🌐 Free Custom Domain (Optional)

### 1. Get Free Domain
- Go to https://freenom.com
- Get `antromic.tk` or `antromic.ml` (FREE for 12 months, renewable)

### 2. Add to Cloudflare
- Cloudflare Dashboard → Add Site → Enter your domain
- Select **Free Plan**
- Copy the 2 nameservers given

### 3. Update Freenom Nameservers
- Freenom → My Domains → Management Tools → Nameservers
- Paste Cloudflare nameservers
- Save

### 4. Add Custom Domain to Worker
- Workers & Pages → antromic-api → Settings → Domains & Routes
- Add Custom Domain: `api.antromic.tk`

### 5. Update Frontend
Change `.env.local`:
```env
NEXT_PUBLIC_CLOUDFLARE_WORKER_URL=https://api.antromic.tk
```

---

## 🎨 Admin Login Credentials

After deploying, login with:
- **Username:** `antromicstaff`
- **Password:** `111222333keys`

---

## 📁 File Structure

```
b_QcWHObWDFtF/
├── cloudflare-worker/
│   └── antromic-api.js    # Backend API code
├── wrangler.toml               # Worker deployment config
├── deploy-worker.bat           # One-click deploy script
├── env.example                 # Environment template
├── DEPLOY.md                   # This file
└── ...                         # Frontend Next.js files
```

---

## 🆘 Troubleshooting

**Error: Cannot read properties of undefined (reading 'get')**
- KV namespaces not bound correctly
- Check wrangler.toml bindings match your KV IDs

**Admin login not working**
- Make sure ADMINS KV is created and bound
- Check worker logs in Cloudflare dashboard

**Frontend can't connect**
- Check NEXT_PUBLIC_CLOUDFLARE_WORKER_URL in .env.local
- Make sure API URL doesn't have trailing slash

---

## 🎉 Done!

Your Antromic platform should now be fully working with:
- ✅ License key system
- ✅ User authentication
- ✅ Admin panel
- ✅ Ticket system
- ✅ Chat system
- ✅ Config sharing
- ✅ Loader management

All hosted FREE forever on Cloudflare!
