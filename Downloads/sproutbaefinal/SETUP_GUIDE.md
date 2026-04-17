# 🌱 SproutBae — Complete Setup Guide
### Every step. Every command. Zero assumptions.

---

## 📋 TABLE OF CONTENTS
1. [Prerequisites — What to install first](#1-prerequisites)
2. [GitHub — Create your private repo](#2-github-setup)
3. [Local Development — Run on your computer](#3-local-development)
4. [Railway — Free cloud hosting](#4-railway-deployment)
5. [WhatsApp — Twilio setup (optional)](#5-whatsapp-setup)
6. [Daily Git Workflow](#6-git-workflow)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. PREREQUISITES

Install these tools on your computer (one-time setup).

### Step 1.1 — Install Node.js
1. Go to https://nodejs.org
2. Download **LTS version** (e.g. v20.x)
3. Install it (Next → Next → Finish)
4. Verify:
   ```bash
   node --version    # Should show v20.x.x
   npm --version     # Should show 10.x.x
   ```

### Step 1.2 — Install Git
1. Go to https://git-scm.com/downloads
2. Download for your OS and install
3. Verify:
   ```bash
   git --version     # Should show git version 2.x.x
   ```

### Step 1.3 — Install VS Code (recommended editor)
1. Go to https://code.visualstudio.com
2. Download and install
3. Recommended extensions to install inside VS Code:
   - **Prisma** (by Prisma)
   - **ES7+ React snippets**
   - **Tailwind CSS IntelliSense**
   - **GitLens**

### Step 1.4 — Create accounts (free)
- **GitHub**: https://github.com/signup
- **Railway**: https://railway.app (sign up with GitHub)

---

## 2. GITHUB SETUP

### Step 2.1 — Configure Git on your computer
Open Terminal (Mac/Linux) or Command Prompt (Windows):
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Step 2.2 — Create SSH key (so Git doesn't ask password every time)
```bash
# Generate key (press Enter 3 times when asked)
ssh-keygen -t ed25519 -C "your@email.com"

# Show your public key
cat ~/.ssh/id_ed25519.pub
# Copy the entire output
```

### Step 2.3 — Add SSH key to GitHub
1. Go to https://github.com/settings/keys
2. Click **New SSH key**
3. Title: "My Laptop"
4. Paste the key → **Add SSH key**

### Step 2.4 — Create private repository
1. Go to https://github.com/new
2. Repository name: `sproutbae`
3. Select **Private** ← IMPORTANT
4. Do NOT check "Add README" (we have one)
5. Click **Create repository**

### Step 2.5 — Extract and push your code
```bash
# 1. Extract the downloaded sproutbae-v1.1.zip
# 2. Open terminal in the extracted folder

# Initialize git
cd sproutbae
git init
git branch -M main

# Add your GitHub repo as remote
# (Replace 'yourusername' with your GitHub username)
git remote add origin git@github.com:yourusername/sproutbae.git

# First commit
git add .
git commit -m "feat: initial SproutBae v1.1 setup"
git push -u origin main

# Create dev branch
git checkout -b dev
git push -u origin dev
```

✅ Your code is now on GitHub!

---

## 3. LOCAL DEVELOPMENT

Run the app on your computer for development and testing.

### Step 3.1 — Install dependencies
```bash
# In the sproutbae folder
npm run install:all
# This installs packages for root, server, and client (~2-3 mins)
```

### Step 3.2 — Set up PostgreSQL database

**Option A — Use Railway DB (recommended, free)**
Skip to Step 4 first to create Railway DB, then come back with the `DATABASE_URL`.

**Option B — Install PostgreSQL locally (for offline dev)**
1. Download from https://www.postgresql.org/download/
2. Install with default settings
3. Remember the password you set for user `postgres`
4. Open pgAdmin → Create database named `sproutbae`
5. Your DATABASE_URL will be:
   ```
   postgresql://postgres:yourpassword@localhost:5432/sproutbae
   ```

### Step 3.3 — Configure environment variables
```bash
# Copy the example files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Now open `server/.env` in VS Code and fill in:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/sproutbae"
JWT_SECRET="paste-a-random-long-string-here"
PORT=5000
CLIENT_URL="http://localhost:3000"
NODE_ENV="development"
```

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy the output and paste as JWT_SECRET
```

### Step 3.4 — Run database migrations
```bash
cd server
npx prisma migrate dev --name init
# This creates all tables in your database
```

### Step 3.5 — Seed sample data
```bash
# Still in server/ folder
node prisma/seed.js
# Output:
# ✅ Admin user created: admin@sproutbae.com
# ✅ Business settings created
# ✅ Sample products created
# ✅ Sample customers created
```

### Step 3.6 — Start development servers
```bash
# Go back to root folder
cd ..
npm run dev
```

You should see:
```
[server] 🌱 SproutBae v1.1.0
[server] 🚀 Server running on port 5000
[client] Local: http://localhost:3000
```

### Step 3.7 — Open the app
1. Open browser → http://localhost:3000
2. Login with:
   - Email: `admin@sproutbae.com`
   - Password: `sproutbae@123`
3. ⚠️ Go to Settings → change business name to yours

---

## 4. RAILWAY DEPLOYMENT

Deploy to the internet — free tier is enough for testing and small business.

### Step 4.1 — Create Railway account
1. Go to https://railway.app
2. Click **Login** → **Login with GitHub**
3. Authorize Railway

### Step 4.2 — Create PostgreSQL database
1. Click **New Project**
2. Click **Add a Service** → **Database** → **PostgreSQL**
3. Wait ~30 seconds for it to provision
4. Click the PostgreSQL service
5. Click **Variables** tab
6. Copy the value of `DATABASE_URL` — save it somewhere safe

### Step 4.3 — Deploy the Backend (server)
1. In the same project, click **+ Add Service** → **GitHub Repo**
2. Select your `sproutbae` repo
3. Railway will detect it. Set:
   - **Root Directory**: `/server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Click **Variables** tab → **Add Variables**:
   ```
   DATABASE_URL    = (paste from Step 4.2)
   JWT_SECRET      = (same random string from Step 3.3)
   NODE_ENV        = production
   CLIENT_URL      = https://sproutbae-client.up.railway.app
   ```
   *(You'll update CLIENT_URL after deploying frontend)*
5. Railway auto-deploys. Watch **Deployments** tab.
6. Once deployed, click **Settings** → copy the **Domain URL**
   (looks like `sproutbae-server.up.railway.app`)

### Step 4.4 — Run migrations on Railway
1. Click your server service → **Settings** → **Deploy**
2. Under **Pre-deploy Command**, enter:
   ```
   npx prisma migrate deploy && node prisma/seed.js
   ```
3. Redeploy → this runs migrations + seed once

*(After first run, remove the pre-deploy command so seed doesn't run again)*

### Step 4.5 — Deploy the Frontend (client)
1. In the same project, click **+ Add Service** → **GitHub Repo**
2. Select `sproutbae` again
3. Set:
   - **Root Directory**: `/client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx vite preview --port $PORT --host 0.0.0.0`
4. Click **Variables** tab → **Add Variables**:
   ```
   VITE_API_URL = https://sproutbae-server.up.railway.app/api
   ```
   *(Use the server URL from Step 4.3)*
5. Wait for deploy. Copy the frontend **Domain URL**.

### Step 4.6 — Update CORS on backend
1. Go to server service → **Variables**
2. Update `CLIENT_URL` to your frontend URL:
   ```
   CLIENT_URL = https://sproutbae-client.up.railway.app
   ```
3. Redeploy server.

### Step 4.7 — Test your live app
1. Open your frontend Railway URL in browser
2. Login: `admin@sproutbae.com` / `sproutbae@123`
3. ⚠️ **Change password and fill in your business details in Settings immediately!**

---

## 5. WHATSAPP SETUP (Optional)

Send invoices directly to customers on WhatsApp.

### Step 5.1 — Create Twilio account
1. Go to https://www.twilio.com/try-twilio
2. Sign up for free ($15 free credit)
3. Verify your phone number

### Step 5.2 — Enable WhatsApp Sandbox (for testing)
1. In Twilio Console → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Send `join [your-sandbox-word]` from your WhatsApp to `+1 415 523 8886`
3. You'll receive a confirmation

### Step 5.3 — Get credentials
From Twilio Console dashboard:
- **Account SID**: `ACxxxxxxxxxxxxxxxx`
- **Auth Token**: `xxxxxxxxxxxxxxxx` (click to reveal)

### Step 5.4 — Add to Railway environment
Add these to your **server** service Variables:
```
TWILIO_ACCOUNT_SID    = ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN     = your-auth-token
TWILIO_WHATSAPP_FROM  = whatsapp:+14155238886
APP_URL               = https://your-frontend.up.railway.app
```

### Step 5.5 — Test
1. Open any invoice → click **WhatsApp** button
2. Customer's phone must have joined your sandbox first (for testing)
3. For production: Apply for Twilio WhatsApp Business API (takes ~2 days, free for Indian numbers)

---

## 6. GIT WORKFLOW

Use this every single day.

### Starting a new feature
```bash
git checkout dev                          # Switch to dev branch
git pull origin dev                       # Get latest changes
git checkout -b feature/gst-reports       # Create feature branch
```

### Saving your work
```bash
git add .                                 # Stage all changes
git status                               # See what changed
git commit -m "feat: add GSTR-1 export"  # Save with a message
git push origin feature/gst-reports      # Upload to GitHub
```

### Commit message format
```
feat: add new feature
fix: fix a bug
style: UI changes only
refactor: code cleanup
docs: update documentation
```

### Merging to production
```bash
# Merge feature to dev (for testing)
git checkout dev
git merge feature/gst-reports
git push origin dev

# After testing, merge dev to main (triggers Railway auto-deploy)
git checkout main
git merge dev
git push origin main
```

### Viewing history
```bash
git log --oneline         # See all commits
git diff                  # See uncommitted changes
git status                # See file status
```

---

## 7. TROUBLESHOOTING

### ❌ "Cannot connect to database"
- Check `DATABASE_URL` in `server/.env`
- Make sure PostgreSQL is running locally
- On Railway: check service is not sleeping

### ❌ "JWT malformed" or "Not authorized"
- Clear browser localStorage: F12 → Application → Local Storage → Clear
- Re-login

### ❌ "CORS error" in browser
- Check `CLIENT_URL` in server `.env` matches your frontend URL exactly
- No trailing slash

### ❌ PDF not generating
- Check `html-pdf-node` is installed: `cd server && npm install`
- Railway: check server logs for Chromium errors

### ❌ WhatsApp message not sending
- Customer must join your Twilio sandbox first (for testing)
- Check all 4 Twilio env vars are set correctly
- Check Twilio console for error logs

### ❌ Railway deploy fails
- Check the **Deployments** tab → click failed deploy → read error
- Most common: missing env variable or wrong root directory

### ❌ "Module not found" errors
```bash
# Re-install all packages
cd server && npm install
cd ../client && npm install
```

### ❌ Prisma errors
```bash
cd server
npx prisma generate           # Regenerate client
npx prisma migrate dev        # Apply pending migrations
npx prisma studio             # Open visual DB editor
```

---

## 📞 QUICK REFERENCE

| Task | Command |
|------|---------|
| Start dev servers | `npm run dev` (from root) |
| Run DB migrations | `cd server && npx prisma migrate dev` |
| Seed sample data | `cd server && node prisma/seed.js` |
| View DB visually | `cd server && npx prisma studio` |
| Install packages | `npm run install:all` |
| Build for production | `cd client && npm run build` |

---

## 🌐 API ENDPOINTS REFERENCE

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Invoice detail |
| GET | `/api/invoices/:id/pdf` | Download PDF |
| POST | `/api/payments` | Record payment |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Add customer |
| GET | `/api/products` | List products |
| POST | `/api/products` | Add product |
| GET | `/api/gst/gstr1` | GSTR-1 data |
| GET | `/api/gst/gstr3b` | GSTR-3B summary |
| POST | `/api/whatsapp/send-invoice` | Send via WhatsApp |
| POST | `/api/whatsapp/payment-reminder` | Send payment reminder |

---

## 💰 COST SUMMARY

| Service | Free Tier | What you get |
|---------|-----------|--------------|
| Railway | $5 credit/month | Backend + DB + Frontend |
| GitHub | Free forever | Private repo, version control |
| Twilio | $15 free credit | ~1000 WhatsApp messages |
| **Total** | **₹0/month** | Full production setup |

Railway $5 credit covers:
- 1 PostgreSQL DB (512MB)
- 1 Backend service
- 1 Frontend service

**Enough for up to ~500 invoices/month at no cost.**

When you scale, upgrade Railway to Hobby ($5/month = ₹420) for always-on services.

---

*© 2026 SproutBae. Proprietary software.*
*Guide version: 1.1 | Last updated: April 2026*
