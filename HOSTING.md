# 🚀 Free Hosting Guide — Technophiles

This guide covers **3 free hosting options** for the Technophiles platform.
Best option for testing: **Railway** (easiest, free MongoDB included).

---

## 🏆 Option 1: Railway (RECOMMENDED — Easiest)

**Free tier:** $5/month credit = ~500 hours, 512MB RAM, free MongoDB

### Steps

#### 1. Push code to GitHub
```bash
# In your technophiles folder
git init
git add .
git commit -m "Initial commit"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/technophiles.git
git push -u origin main
```

#### 2. Deploy on Railway
1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `technophiles` repo → Click **Deploy**
4. Railway auto-detects Node.js and runs `npm start`

#### 3. Add MongoDB
1. In your Railway project → Click **"+ New"** → **"Database"** → **"MongoDB"**
2. Railway creates a MongoDB instance automatically
3. Click the MongoDB service → **Variables** tab → copy `MONGODB_URL`

#### 4. Set Environment Variables
In Railway → your app service → **Variables** tab → add:

```
MONGODB_URI=<paste the MONGODB_URL from step 3>
JWT_SECRET=technophiles_secret_change_this_in_production
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
NODE_ENV=production
APP_URL=https://YOUR-APP-NAME.up.railway.app
COLLEGE_EMAIL_DOMAIN=gcettb.ac.in
```

For push notifications (optional):
```
PUBLIC_VAPID_KEY=<run npm run vapid locally to generate>
PRIVATE_VAPID_KEY=<same>
VAPID_EMAIL=mailto:admin@gcettb.ac.in
```

#### 5. Get your URL
Railway → your app → **Settings** → **Generate Domain**
Your app is live at: `https://your-app-name.up.railway.app`

#### 6. Seed the database
```bash
# Set MONGODB_URI in your local .env to the Railway MongoDB URL, then:
npm run seed
```

---

## 🥈 Option 2: Render (Free — May sleep after 15min inactivity)

**Free tier:** 512MB RAM, sleeps after 15min, wakes in ~30 sec

### Steps

#### 1. Add MongoDB Atlas (free)
1. Go to [mongodb.com/atlas](https://cloud.mongodb.com)
2. Create free account → **Build a Database** → **M0 Free**
3. Choose region (Mumbai/Singapore for India)
4. Set username/password → **Create User**
5. Network Access → **Add IP Address** → **Allow from Anywhere** (0.0.0.0/0)
6. Click **Connect** → **Drivers** → copy the connection string
   (replace `<password>` with your actual password)

#### 2. Deploy on Render
1. Go to [render.com](https://render.com) → Sign in with GitHub
2. **New** → **Web Service** → connect your GitHub repo
3. Settings:
   - **Name:** technophiles
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

#### 3. Add Environment Variables
In Render → your service → **Environment** tab:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/technophiles
JWT_SECRET=your_secret_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
NODE_ENV=production
APP_URL=https://technophiles.onrender.com
COLLEGE_EMAIL_DOMAIN=gcettb.ac.in
```

#### 4. Fix Sleep Issue (Optional)
Add this to your `server.js` bottom — keeps app awake with a self-ping:

```js
// Keep-alive ping (Render free tier)
if (process.env.NODE_ENV === 'production' && process.env.APP_URL) {
  setInterval(() => {
    require('http').get(process.env.APP_URL + '/').on('error', () => {});
  }, 14 * 60 * 1000); // ping every 14 minutes
}
```

---

## 🥉 Option 3: Cyclic.sh (Serverless — Completely free)

**Free tier:** No sleep, 1GB storage, but cold starts

1. Go to [cyclic.sh](https://cyclic.sh) → Sign in with GitHub
2. Link your repo
3. Add environment variables (same as above)
4. Uses MongoDB Atlas (same setup as Option 2 step 1)

---

## 📦 Pre-deployment Checklist

Before deploying, do these steps locally:

### 1. Update package.json to ensure proper start script
Your `package.json` already has:
```json
"scripts": {
  "start": "node server.js"
}
```
✅ Already correct — Railway/Render use `npm start`

### 2. Add a `.gitignore`
Your project already has `.gitignore`. Verify it includes:
```
node_modules/
.env
*.zip
uploads/
```

### 3. Generate VAPID keys (for push notifications)
```bash
npm install  # make sure web-push is installed
npm run vapid
# Copy PUBLIC_VAPID_KEY and PRIVATE_VAPID_KEY to your hosting env vars
```

### 4. Test locally with production settings
```bash
NODE_ENV=production npm start
```

---

## 🌐 Custom Domain (Free)

### With Railway:
1. Railway → Settings → **Custom Domain**
2. Add your domain (e.g. `technophiles.gcettb.ac.in`)
3. Add a CNAME record in your DNS pointing to Railway's URL

### With Render:
1. Render → Settings → **Custom Domain**
2. Same CNAME setup

### Free domain options:
- **Freenom** — free `.tk`, `.ml`, `.ga` domains
- **GitHub Student Pack** — free `.me` domain via Namecheap

---

## 📧 Free Email (for nodemailer)

Use **Gmail** with App Password:

1. Gmail → Settings → Security → **2-Step Verification** (enable)
2. Security → **App passwords** → Generate for "Mail"
3. Copy the 16-character password

In your env vars:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yourclub@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=Technophiles <yourclub@gmail.com>
```

---

## 🔑 Quick Reference: All Environment Variables

```env
# Required
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=any_long_random_string_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
NODE_ENV=production
APP_URL=https://your-app-url.com
COLLEGE_EMAIL_DOMAIN=gcettb.ac.in

# Email (optional but recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Technophiles <your@gmail.com>

# Push Notifications (optional)
PUBLIC_VAPID_KEY=generate_with_npm_run_vapid
PRIVATE_VAPID_KEY=generate_with_npm_run_vapid
VAPID_EMAIL=mailto:admin@gcettb.ac.in
```

---

## 🚨 Security for Production

Update `JWT_SECRET` to a strong random string:
```bash
# Generate a secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🗂 After Deployment

1. Visit `https://your-app-url.com`
2. Register as superadmin — **first user with @gcettb.ac.in email**  
   OR manually set role in MongoDB Atlas:
   - Atlas → Browse Collections → `users` → find your user
   - Edit `role` field to `"superadmin"`
3. Login and run seed data:
   ```bash
   # Set MONGODB_URI to production DB in local .env, then:
   npm run seed
   ```
4. Visit `/admin/settings/seo` to set up logos and SEO
5. Visit `/certificates/templates` to configure certificate templates

---

## 💡 Recommendation for GCETTB

**Use Railway** for testing:
- One-click deploy from GitHub
- Free MongoDB included (no Atlas setup needed)
- Auto SSL certificate
- ~500 hours/month free

When ready for production, upgrade to Railway's Starter plan ($5/month) or host on college server.
