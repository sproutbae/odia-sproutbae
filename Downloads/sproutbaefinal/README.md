# 🌱 SproutBae — Wholesale Billing System

A proprietary, full-stack wholesale billing system with GST support, inventory tracking, customer ledgers, and payment recording — built for Railway deployment.

---

## 🗂️ Project Structure

```
sproutbae/
├── client/               ← React frontend (Vite + Tailwind)
│   └── src/
│       ├── pages/        ← Route pages
│       ├── components/   ← Shared components
│       ├── hooks/        ← Auth context
│       └── utils/        ← API client, helpers
├── server/               ← Node.js + Express backend
│   ├── routes/           ← API routes
│   ├── middleware/        ← JWT auth
│   └── railway.toml      ← Railway config
├── prisma/               ← Database schema + seed
└── package.json          ← Root monorepo scripts
```

---

## 🚀 Local Development Setup

### 1. Clone your repo
```bash
git clone https://github.com/yourusername/sproutbae.git
cd sproutbae
```

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Set up environment variables
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with your DATABASE_URL and JWT_SECRET
```

### 4. Set up database
```bash
# For local dev, use Railway's PostgreSQL URL in .env, OR
# install PostgreSQL locally and create a DB named sproutbae

npm run db:migrate     # Run migrations
npm run db:seed        # Seed admin user + sample data
```

### 5. Start development servers
```bash
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### 6. Login
- Email: `admin@sproutbae.com`
- Password: `sproutbae@123`
- ⚠️ Change password immediately!

---

## 🛤️ Railway Deployment (Free Tier)

### Step 1 — Create Railway account
Go to https://railway.app and sign up (GitHub login recommended)

### Step 2 — Deploy PostgreSQL
1. New Project → Add Service → Database → PostgreSQL
2. Copy the `DATABASE_URL` from the Variables tab

### Step 3 — Deploy Backend
1. New Service → GitHub Repo → select `sproutbae` → set root to `/server`
2. Add Environment Variables:
   ```
   DATABASE_URL=<from Step 2>
   JWT_SECRET=<generate random 64-char string>
   CLIENT_URL=https://<your-frontend-url>.railway.app
   NODE_ENV=production
   ```
3. After deploy, run migrations:
   - Railway → Service → Settings → Deploy → Run Command:
   - `npx prisma migrate deploy && node prisma/seed.js`

### Step 4 — Deploy Frontend
1. New Service → GitHub Repo → select `sproutbae` → root `/client`
2. Add Environment Variable:
   ```
   VITE_API_URL=https://<your-backend-url>.railway.app/api
   ```
3. Build Command: `npm run build`
4. Start Command: `npx vite preview --port $PORT --host`

---

## 💻 Cheapest Testing Options

### Option A — Localhost (FREE ✅ Best for dev)
- Run backend + frontend locally
- Use Railway PostgreSQL as remote DB (free tier)
- No cost at all during development

### Option B — Railway Free Tier (₹0/month)
- $5 credit monthly = enough for 1 backend + 1 DB + 1 frontend
- Sleep after inactivity (fine for testing)
- URL: `yourapp.railway.app`

### Option C — Render.com (FREE)
- Free PostgreSQL (expires 90 days)
- Free web service (sleeps after 15 min inactivity)
- Good backup option

### Recommended for testing: **Railway free tier** — deploys straight from GitHub, no config needed.

---

## 📦 GitHub Version Control Workflow

```bash
# Daily workflow
git checkout dev                    # always work on dev
git checkout -b feature/add-reports # new feature branch

# Make changes, then:
git add .
git commit -m "feat: add GST report export"
git push origin feature/add-reports

# Merge to dev, test, then merge to main for production deploy
git checkout dev && git merge feature/add-reports
git checkout main && git merge dev
git push origin main                # triggers Railway auto-deploy
```

### Branch strategy
| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys to Railway |
| `dev` | Staging — test before merging to main |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

---

## 🗺️ Roadmap

- [x] v1.0 — Invoice, Customers, Products, Payments, Dashboard
- [ ] v1.1 — PDF invoice download, WhatsApp share
- [ ] v1.2 — GSTR-1 / GSTR-3B export
- [ ] v1.3 — Purchase orders, vendor management
- [ ] v1.4 — Multi-user roles, activity log
- [ ] v2.0 — Android app (React Native)

---

## 🔐 Default Credentials

| Field | Value |
|-------|-------|
| Email | admin@sproutbae.com |
| Password | sproutbae@123 |

**Change these immediately after first login.**

---

© 2026 SproutBae. Proprietary software. All rights reserved.
