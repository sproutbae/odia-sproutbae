# 🌱 SproutBae — Complete Beginner's Setup Guide
### Zero coding experience assumed. Every step explained. Every reason told.

---

> **Before you start:** This guide will take you from zero to a fully working billing software running on the internet. It will take about 1–2 hours the first time. After that, you can make changes and updates in minutes.
>
> You do NOT need to understand code. You just need to follow steps exactly as written.

---

## 📋 WHAT WE ARE BUILDING

```
Your Computer                    Internet (Free Cloud)
─────────────────               ──────────────────────────
  Code Files      ──push──▶     GitHub (stores your code)
  (SproutBae)                         │
                                       ▼
                                  Railway.app
                                  ├── Frontend (what users see)
                                  ├── Backend  (brain of the app)
                                  └── Database (where data lives)
```

Think of it like this:
- **GitHub** = Google Drive for your code (saves and versions it)
- **Railway** = A computer in the cloud that runs your app 24/7
- **Database** = An Excel sheet in the cloud that stores all your invoices

---

## CHAPTER 1 — INSTALL TOOLS ON YOUR COMPUTER

> **Why:** Your computer needs certain software to understand and run the code before sending it to the cloud.

---

### STEP 1 — Install Node.js

**What is Node.js?**
It's a program that lets your computer run JavaScript code (which is what SproutBae is written in). Without it, nothing works.

1. Open your browser and go to: **https://nodejs.org**

2. You will see two buttons. Click the one that says **"LTS"** (it might say something like "20.x.x LTS — Recommended for most users")
   > LTS means "Long Term Support" — it's the stable, safe version. Not the newest, but the most reliable.

3. A file will download (something like `node-v20.x.x-x64.msi` on Windows or `node-v20.x.x.pkg` on Mac)

4. Open that downloaded file and click **Next → Next → Next → Install → Finish**
   > Just keep clicking Next. The default settings are fine.

5. **Verify it worked:**
   - On **Windows**: Press `Windows key + R`, type `cmd`, press Enter. A black window opens.
   - On **Mac**: Press `Cmd + Space`, type `Terminal`, press Enter. A white/black window opens.
   - Type this exactly and press Enter:
     ```
     node --version
     ```
   - You should see something like: `v20.11.0`
   - If you see a version number — ✅ Node.js is installed!
   - If you see an error — restart your computer and try again.

---

### STEP 2 — Install Git

**What is Git?**
Git is a tool that tracks every change you make to your code. Think of it like "Track Changes" in Microsoft Word, but for code. It also lets you send your code to GitHub.

1. Go to: **https://git-scm.com/downloads**

2. Click your operating system (Windows / Mac / Linux)

3. Download and run the installer

4. **Windows users:** During install, you'll see many screens. Just keep clicking **Next** without changing anything. The defaults are all correct.

5. **Verify it worked:**
   - Open your Terminal/Command Prompt (same as Step 1)
   - Type:
     ```
     git --version
     ```
   - You should see: `git version 2.x.x`
   - ✅ Git is installed!

---

### STEP 3 — Install VS Code (Text Editor)

**What is VS Code?**
It's like Notepad or Word, but designed specifically for reading and editing code. You don't need to write code — you'll use it to open files and make small edits when needed.

1. Go to: **https://code.visualstudio.com**

2. Click the big **Download** button

3. Install it like any normal program (Next → Next → Finish)

4. Open VS Code — you'll see a welcome screen. That's it, you're done.

---

## CHAPTER 2 — CREATE YOUR ACCOUNTS (ALL FREE)

> **Why:** You need two online accounts — one to store your code safely (GitHub) and one to run it on the internet (Railway).

---

### STEP 4 — Create a GitHub Account

**What is GitHub?**
GitHub is like Google Drive but for code. It stores every version of your code safely. If something breaks, you can always go back to a working version.

1. Go to: **https://github.com/signup**

2. Enter your email, create a password, choose a username
   > Your username will be part of your project URL, so pick something professional like `sproutbae` or your business name.

3. Verify your email when GitHub sends you a confirmation

4. ✅ GitHub account created!

---

### STEP 5 — Create a Railway Account

**What is Railway?**
Railway is a service that runs your app on the internet 24/7. Think of it as renting a small computer in a data centre that keeps your billing software always online.

1. Go to: **https://railway.app**

2. Click **"Login"** → Click **"Login with GitHub"**
   > Use your GitHub account to login — this connects the two services and makes deployment much easier.

3. Allow Railway to access your GitHub account when asked

4. ✅ Railway account created!

---

## CHAPTER 3 — PREPARE YOUR CODE

> **Why:** The SproutBae code you downloaded needs to be uploaded to GitHub so Railway can access and run it.

---

### STEP 6 — Extract the Downloaded ZIP File

1. Find the file `sproutbae-v1.2.zip` in your Downloads folder

2. **Windows:** Right-click the file → Click **"Extract All"** → Click **"Extract"**
   **Mac:** Double-click the file — it extracts automatically

3. You will get a folder called `sproutbae`. Move it to somewhere easy to find, like your Desktop or Documents folder.

4. Open VS Code → **File → Open Folder** → Select the `sproutbae` folder
   > You'll see all the files listed on the left side of VS Code. Don't worry about understanding them — they're all already written for you.

---

### STEP 7 — Open Terminal Inside VS Code

> **Why:** Almost all setup steps are done by typing commands. VS Code has a built-in terminal so you don't need to switch windows.

1. In VS Code, click **"Terminal"** in the top menu bar

2. Click **"New Terminal"**

3. A panel appears at the bottom of VS Code. This is your terminal.

4. You'll see something like:
   ```
   user@computer sproutbae %
   ```
   This means the terminal is ready and it's inside your sproutbae folder. ✅

> **Important:** All commands from now on are typed in this terminal panel and pressed Enter to run.

---

### STEP 8 — Configure Git with Your Name and Email

> **Why:** Git needs to know who is making changes to the code. It's like signing your name on documents.

Type these two commands one at a time (replace with your actual name and email):

```
git config --global user.name "Your Name"
```
Press Enter. Then:
```
git config --global user.email "your@email.com"
```
Press Enter.

> Use the same email you used for GitHub. This links your changes to your GitHub account.

---

### STEP 9 — Create Your Private GitHub Repository

**What is a Repository?**
A repository (or "repo") is like a folder on GitHub that holds all your project files and their history.

1. Go to **https://github.com/new**

2. Fill in the form:
   - **Repository name:** `sproutbae`
   - **Description:** `SproutBae Wholesale Billing System` (optional)
   - **Visibility:** Select **"Private"** ← Very important! This keeps your code secret.
   - Leave everything else unchecked.

3. Click **"Create repository"**

4. You'll see a page with some setup instructions. **Don't follow those** — we have our own steps below.

5. Copy the URL shown on that page. It will look like:
   ```
   https://github.com/yourusername/sproutbae.git
   ```
   > Keep this URL handy — you'll need it in the next step.

---

### STEP 10 — Push Your Code to GitHub

> **Why:** "Pushing" means uploading your code from your computer to GitHub. Once it's there, Railway can access it.

In the VS Code terminal, type these commands one at a time, pressing Enter after each:

**Command 1** — Tell Git to start tracking this folder:
```
git init
```
> This creates a hidden `.git` folder that tracks all changes. You won't see it, but it's there.

**Command 2** — Name your main branch "main":
```
git branch -M main
```
> A "branch" is like a version of your code. "main" is the production version — the one that runs live.

**Command 3** — Connect your folder to GitHub (paste YOUR url from Step 9):
```
git remote add origin https://github.com/yourusername/sproutbae.git
```
> "remote" means the online copy. "origin" is just the nickname we give it.

**Command 4** — Mark all files to be uploaded:
```
git add .
```
> The dot `.` means "everything in this folder". This tells Git: track all these files.

**Command 5** — Save a snapshot of your code with a description:
```
git commit -m "Initial SproutBae v1.2 setup"
```
> A "commit" is like hitting Save + adding a note. The message in quotes describes what changed.

**Command 6** — Upload to GitHub:
```
git push -u origin main
```
> "push" = upload. This sends everything to GitHub.

**You may be asked to login to GitHub.** A browser window might open — log in with your GitHub account. Or it might ask for your username and a "token" in the terminal.

**If it asks for a password/token:**
1. Go to **https://github.com/settings/tokens/new**
2. Note: "SproutBae deploy" | Expiration: 1 year | Check **"repo"** | Click **Generate**
3. Copy the token (starts with `ghp_`) — this is your password
4. Paste it in the terminal when asked for password

5. After pushing, go to `https://github.com/yourusername/sproutbae` — you should see all your files there! ✅

---

### STEP 11 — Create the Development Branch

> **Why:** We keep two versions of the code. "main" is always the working live version. "dev" is where you test new changes. This prevents breaking the live app while you're experimenting.

```
git checkout -b dev
```
```
git push -u origin dev
```

> `checkout -b` means "create and switch to a new branch". Now you have two branches: `main` (live) and `dev` (testing).

---

## CHAPTER 4 — SET UP THE DATABASE ON RAILWAY

> **Why:** The database is where all your invoices, customers, products and payments are stored. We'll create it on Railway's servers so it's always online.

---

### STEP 12 — Create a New Railway Project

1. Go to **https://railway.app** and log in

2. Click the big **"New Project"** button (or **"+ New"** at the top)

3. You'll see some options. Click **"Empty project"**
   > We'll add services one by one so we understand what each does.

4. Your new empty project opens. You'll see a grey canvas. ✅

---

### STEP 13 — Add PostgreSQL Database

**What is PostgreSQL?**
It's a database — like a very powerful, organised Excel file that stores all your business data (invoices, customers, stock, etc.) and can handle thousands of records without slowing down.

1. In your Railway project, click **"+ Add Service"** (or the + button)

2. Click **"Database"**

3. Click **"PostgreSQL"**

4. Railway creates the database in about 30 seconds. You'll see a box appear on the canvas labelled "PostgreSQL". ✅

5. Click on the **PostgreSQL box**

6. Click the **"Variables"** tab

7. You'll see a list of variables. Find **`DATABASE_URL`** — click the copy icon next to it.
   > This URL is like the address + password to your database. Keep it safe. Never share it publicly.

8. Paste it somewhere temporary (Notepad, Notes app) — you'll need it in the next chapter.

---

## CHAPTER 5 — DEPLOY THE BACKEND (APP'S BRAIN)

> **Why:** The backend is the "engine" of SproutBae. It processes data, calculates GST, generates PDFs, and talks to the database. It needs to run on Railway.

---

### STEP 14 — Add the Backend Service

1. In the same Railway project, click **"+ Add Service"** again

2. This time click **"GitHub Repo"**

3. Railway will ask permission to access your GitHub — click **"Configure GitHub App"** and allow access to your `sproutbae` repository

4. Select your **`sproutbae`** repository from the list

5. Railway will start trying to deploy. **Stop it first** — we need to configure it.

6. Click on the new service box that appeared

7. Click **"Settings"** tab

8. Find **"Root Directory"** — type: `/server`
   > This tells Railway: "The backend code is inside the /server folder, not the root"

9. Find **"Start Command"** — type: `node index.js`
   > This is the command Railway uses to start the backend

10. Click **"Save"** or press Enter

---

### STEP 15 — Add Environment Variables to Backend

> **Why:** Environment variables are secret settings that the app needs to run — like the database password, and the secret key for logins. We never put these in the code (that would be insecure), we set them separately on Railway.

1. Click the **"Variables"** tab in your backend service

2. Click **"Add Variable"** — add these one by one:

---

**Variable 1:**
- Name: `DATABASE_URL`
- Value: *Paste the database URL you copied in Step 13*
> This connects the backend to your database

---

**Variable 2:**
- Name: `JWT_SECRET`
- Value: *We need to generate this. Do the following:*
  - In VS Code terminal, type:
    ```
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    ```
  - Press Enter. You'll see a long string of random letters and numbers like:
    `a3f8c2d1e9b0...` (64 characters)
  - Copy that entire string — that's your JWT_SECRET
> JWT_SECRET is like a master password that signs all login sessions. It must be long and random.

---

**Variable 3:**
- Name: `NODE_ENV`
- Value: `production`
> Tells the app it's running live, not in test mode. Changes some behaviors for better performance.

---

**Variable 4:**
- Name: `PORT`
- Value: `5000`
> The port number the backend listens on. Think of it like a door number in a building.

---

**Variable 5 (fill in after frontend deploy — skip for now):**
- Name: `CLIENT_URL`
- Value: `https://your-frontend-url.up.railway.app`
> We'll fill this after the frontend is deployed. Leave it empty for now or put a placeholder.

---

3. After adding all variables, click **"Deploy"** (or it auto-deploys)

4. Click the **"Deployments"** tab — watch the logs scroll. After 1-2 minutes you should see:
   ```
   🌱 SproutBae v1.2.0
   🚀 Server running on port 5000
   ```
   ✅ Backend is live!

5. Click **"Settings"** → Find **"Domains"** → Copy the URL (like `sproutbae-server.up.railway.app`)
   > Save this — it's your backend URL. You'll need it for the frontend.

---

### STEP 16 — Run Database Migrations (Create Tables)

> **Why:** The database is empty right now. "Migrations" create all the tables (like Customers table, Invoices table, Products table) inside the database. Think of it like creating a new Excel file with all the right column headers.

1. In your backend service on Railway, click **"Settings"** tab

2. Find **"Deploy"** section → Find **"Pre-deploy Command"**

3. Type exactly:
   ```
   npx prisma migrate deploy && node prisma/seed.js
   ```
   > `migrate deploy` = creates all the tables
   > `seed.js` = adds starter data (admin user, sample products, sample customers)

4. Click **"Save"** → Click **"Deploy"** to redeploy

5. Watch the deployment logs. You should see:
   ```
   ✅ Admin user created: admin@sproutbae.com
   ✅ Business settings created
   ✅ Sample products created
   ✅ Sample customers created
   🎉 Seed complete!
   ```
   ✅ Database is set up!

6. **Important:** After this succeeds, go back and **clear the Pre-deploy Command** (delete it and save). Otherwise the seed runs every time you deploy and creates duplicates.

---

## CHAPTER 6 — DEPLOY THE FRONTEND (WHAT USERS SEE)

> **Why:** The frontend is the visual part — the screens, buttons, tables, and forms that you interact with. It also needs to be deployed on Railway.

---

### STEP 17 — Add the Frontend Service

1. In Railway, click **"+ Add Service"** again

2. Click **"GitHub Repo"**

3. Select `sproutbae` again (same repo, different folder)

4. Click on the new service that appears

5. Click **"Settings"** tab

6. **Root Directory:** `/client`
   > Frontend code is in the /client folder

7. **Build Command:** `npm install && npm run build`
   > `npm install` downloads dependencies, `npm run build` compiles React into files a browser can read

8. **Start Command:** `npx vite preview --port $PORT --host 0.0.0.0`
   > This serves the built frontend files. `$PORT` is automatically set by Railway.

9. Click **"Save"**

---

### STEP 18 — Add Frontend Environment Variable

1. Click **"Variables"** tab in the frontend service

2. Add this variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend.up.railway.app/api`
     > Replace `your-backend.up.railway.app` with the backend URL you copied in Step 15
     > This tells the frontend where to send data requests

3. Save and deploy

4. Wait 2–3 minutes. Then click **"Settings"** → **"Domains"** → Copy the frontend URL
   > Something like `sproutbae-client.up.railway.app`

---

### STEP 19 — Update Backend with Frontend URL

> **Why:** The backend needs to know the frontend's address so it allows requests from it (this is called CORS security — it blocks unknown websites from accessing your data).

1. Go to your **backend service** → **Variables** tab

2. Find `CLIENT_URL` — update its value to your frontend URL:
   ```
   https://sproutbae-client.up.railway.app
   ```

3. Railway will auto-redeploy the backend with the new setting ✅

---

## CHAPTER 7 — FIRST LOGIN AND SETUP

> **Why:** The app is live. Now configure it for your business.

---

### STEP 20 — Open Your App

1. Open the frontend URL in your browser:
   ```
   https://sproutbae-client.up.railway.app
   ```

2. You'll see the SproutBae login page 🌱

3. Login with:
   - **Email:** `admin@sproutbae.com`
   - **Password:** `sproutbae@123`

4. You're in! ✅

---

### STEP 21 — Change Your Password Immediately

> **Why:** The default password is the same for everyone who uses this guide. You must change it right away.

1. Click **"Settings"** in the sidebar

2. Your password change option will be in the Settings or Team page

3. Set a strong password — at least 12 characters, mix of letters and numbers

---

### STEP 22 — Fill In Your Business Details

1. Click **"Settings"** in the sidebar

2. Fill in every field:
   - Business Name
   - GSTIN (your GST number)
   - Address, City, State, Pincode
   - Phone and Email
   - Bank Name, Account Number, IFSC
   - UPI ID (for QR on invoices)
   - Invoice Prefix (e.g. "SB" → invoices will be SB-0001, SB-0002...)

3. Click **"Save Settings"**

> This information appears on every invoice you generate, so fill it in carefully.

---

### STEP 23 — Add Your Products

1. Click **"Products"** in the sidebar

2. Click **"Add Product"** for each item you sell

3. Fill in:
   - Product Name (e.g. "Basmati Rice 25kg")
   - SKU (short code, e.g. "RICE-BAS-25")
   - HSN Code (for GST — your CA can give you these)
   - Unit (KG, BAG, PCS, etc.)
   - Cost Price (what you pay)
   - Sale Price (what you charge customers)
   - GST Rate (0%, 5%, 12%, 18%, or 28%)
   - Opening Stock (how many you have right now)
   - Min Stock Alert (get alerted when stock falls below this)

---

### STEP 24 — Add Your Customers

1. Click **"Customers"** in the sidebar

2. Click **"Add Customer"** for each of your buyers

3. Fill in their business name, phone, GSTIN (if registered), address

> Customers with GSTIN get B2B invoices. Without GSTIN they get B2C invoices.

---

### STEP 25 — Create Your First Invoice

1. Click **"New Invoice"** (red button, top right)

2. Select customer from search

3. Choose GST type:
   - **CGST + SGST** — if your customer is in the same state as you (intra-state)
   - **IGST** — if your customer is in a different state (inter-state)

4. Add items — pick from your product catalog or type manually

5. Set due date

6. Click **"Create & Send"**

7. Open the invoice → Click **"PDF"** to download it

8. ✅ Your first GST invoice is ready!

---

## CHAPTER 8 — ADDING TEAM MEMBERS

> **Why:** You can give your staff or accountant access with limited permissions so they can't accidentally delete data or change settings.

---

### STEP 26 — Add a Staff Member

1. Click **"Team"** in the sidebar

2. Click **"Add User"**

3. Fill in their name, email, set a password for them

4. Choose role:
   - **ADMIN** — Full access (you, the owner)
   - **ACCOUNTANT** — Can see everything, manage invoices/payments, cannot change settings
   - **STAFF** — Can create invoices and view customers/products only

5. Share the login URL and their credentials with them

---

## CHAPTER 9 — DAILY WORKFLOW (HOW TO MAKE CHANGES)

> **Why:** When you want to improve the app — add a feature, fix something, change the design — you need a safe process. This ensures changes don't break the live app.

---

### STEP 27 — How to Safely Make Changes to Code

Every time you want to change something:

**Step A — Switch to the dev branch (test version):**
```
git checkout dev
```
> This moves you to the testing version. Changes here don't affect the live app.

**Step B — Make your changes in VS Code**
> Edit files, update code, whatever you need

**Step C — Save your changes to Git:**
```
git add .
git commit -m "describe what you changed"
```
> Example: `git commit -m "fix: invoice total calculation"`

**Step D — Upload to GitHub:**
```
git push origin dev
```

**Step E — Test it** by connecting Railway's dev service to the `dev` branch

**Step F — If it works, merge to main (go live):**
```
git checkout main
git merge dev
git push origin main
```
> Railway automatically redeploys whenever you push to `main`. Your live app updates in ~2 minutes.

---

## CHAPTER 10 — WHATSAPP SETUP (OPTIONAL)

> **Why:** You can send invoices directly to customers on WhatsApp. Requires a free Twilio account.

---

### STEP 28 — Set Up Twilio WhatsApp

1. Go to **https://www.twilio.com/try-twilio** and sign up (free — you get $15 credit)

2. Verify your Indian phone number during signup

3. In Twilio Console, go to **Messaging → Try it out → Send a WhatsApp message**

4. From your WhatsApp, send this message to **+1 415 523 8886**:
   ```
   join [your-sandbox-word]
   ```
   > Twilio shows you the exact word to use. This connects your WhatsApp for testing.

5. From Twilio Console dashboard, copy:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (click to reveal)

6. In Railway, add these to your **backend service variables**:
   ```
   TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN  = your-auth-token
   TWILIO_WHATSAPP_FROM = whatsapp:+14155238886
   APP_URL = https://your-frontend.up.railway.app
   ```

7. Now in SproutBae, open any invoice → click **"WhatsApp"** button → message sent! ✅

> **Note for production:** For real business use, apply for Twilio WhatsApp Business API. Free for Indian numbers, approved in ~2 days.

---

## TROUBLESHOOTING — WHEN THINGS GO WRONG

---

### ❌ Problem: "App won't open / shows error"

**Check 1:** Open Railway → Backend service → Deployments → Click the latest deployment → Read the red error text
**Fix:** Usually a missing environment variable. Compare your variables with Step 15.

---

### ❌ Problem: "Login doesn't work"

**Reason:** Usually means the backend can't reach the database.
**Fix:**
1. Railway → Backend variables → Check `DATABASE_URL` is correct
2. Railway → PostgreSQL service → Variables → Copy `DATABASE_URL` again → Paste into backend

---

### ❌ Problem: "Invoice PDF won't download"

**Reason:** `html-pdf-node` package needs Chromium (a headless browser).
**Fix:** Railway automatically provides this. If it fails, check deployment logs for "Chromium" errors.

---

### ❌ Problem: "Pushed code but app didn't update"

**Reason:** You might have pushed to `dev` instead of `main`.
**Fix:**
```
git checkout main
git merge dev
git push origin main
```

---

### ❌ Problem: "WhatsApp message not delivered"

**Reason:** Customer hasn't joined your sandbox.
**Fix:** They need to send `join [your-word]` to `+1 415 523 8886` from their WhatsApp first (only for testing).

---

### ❌ Problem: "Database error / missing tables"

**Reason:** Migrations didn't run.
**Fix:** Railway → Backend service → Settings → Pre-deploy Command → Type:
```
npx prisma migrate deploy
```
Deploy once. Then remove the command.

---

### ❌ Problem: "npm error / module not found"

**Fix:** In VS Code terminal:
```
cd server && npm install
cd ../client && npm install
```
Then push again.

---

## QUICK REFERENCE CARD

Cut this out and keep it handy 📋

| Task | What to do |
|------|-----------|
| Open app | Browser → your Railway frontend URL |
| New invoice | SproutBae → "New Invoice" button |
| Add product | SproutBae → Products → "Add Product" |
| Add customer | SproutBae → Customers → "Add Customer" |
| Record payment | SproutBae → Open invoice → "Mark Paid" |
| Download invoice PDF | SproutBae → Open invoice → "PDF" button |
| Send via WhatsApp | SproutBae → Open invoice → "WhatsApp" button |
| Add team member | SproutBae → Team → "Add User" |
| Push code changes | Terminal → `git add .` → `git commit -m "note"` → `git push origin main` |
| View Railway logs | Railway → Service → Deployments → Click deployment |

---

## MONTHLY COSTS SUMMARY

| What | Cost | Notes |
|------|------|-------|
| GitHub | ₹0 | Free forever for private repos |
| Railway | ₹0 | Free $5 credit monthly |
| Twilio WhatsApp | ₹0 | $15 free credit (testing) |
| Domain name (optional) | ₹700–1000/year | Only if you want yourbusiness.com |
| **Total** | **₹0/month** | Until you scale significantly |

**When do you start paying?**
Railway's free $5 credit covers small businesses up to ~500 invoices/month. When you outgrow it, upgrade to Railway Hobby Plan at $5/month (≈ ₹420/month). That's still much cheaper than buying billing software.

---

## GETTING HELP

If something doesn't work:

1. **Read the error message** — Railway shows it in red in the Deployments tab. Copy the error.

2. **Search it** — Paste the error into Google. Most errors have been faced by others.

3. **Ask Claude** — Paste the error to Claude and say "I'm setting up SproutBae billing software and got this error". Claude will help you fix it step by step.

4. **Check Railway status** — https://status.railway.app — sometimes Railway itself has issues.

---

*SproutBae Wholesale Billing · Beginner's Setup Guide · Version 1.2*
*Last updated: April 2026*
