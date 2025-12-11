# 🚀 UniVerse AI - Railway Deployment Guide

Complete step-by-step guide to deploy your UniVerse AI application on Railway.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] GitHub account (Railway connects to your repo)
- [ ] Railway account (sign up at [railway.app](https://railway.app))
- [ ] MongoDB Atlas account (for production database) - **OR** - Use Railway's MongoDB plugin
- [ ] All sensitive API keys removed from code ✅ (Already done!)
- [ ] `.env` file NOT committed to Git ✅ (Already in .gitignore)

---

## 🎯 Deployment Method: Railway (Full Stack)

Railway will host both your Python backend AND frontend together in one deployment.

### **Why Railway?**
- ✅ **Free $5/month credit** (enough for demos/projects)
- ✅ **Auto-deploys from GitHub** (push to deploy)
- ✅ **Built-in MongoDB** (one-click plugin)
- ✅ **Environment variables** (secure configuration)
- ✅ **Automatic HTTPS** (SSL certificate included)
- ✅ **Single URL** (yourproject.up.railway.app)

---

## 📝 Step-by-Step Deployment

### **Step 1: Push Your Code to GitHub**

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Prepare for Railway deployment"
   ```

2. **Create GitHub Repository**:
   - Go to [github.com](https://github.com)
   - Create new repository (e.g., `universe-ai`)
   - **Do NOT** initialize with README (you already have one)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/universe-ai.git
   git branch -M main
   git push -u origin main
   ```

---

### **Step 2: Create Railway Project**

1. **Sign up/Login to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Login with GitHub (recommended)

2. **Deploy from GitHub**:
   - Click "Deploy from GitHub repo"
   - Select your `universe-ai` repository
   - Railway will detect the `Dockerfile` automatically

3. **Wait for Initial Deployment** (will fail - we need to add MongoDB first):
   - Railway will start building your app
   - This will take 2-3 minutes
   - It will fail because MongoDB is not connected yet ✅ Expected!

---

### **Step 3: Add MongoDB Database**

**Option A: Railway MongoDB Plugin** (Easiest - Recommended)

1. In your Railway project dashboard:
   - Click "+ New" → "Database" → "Add MongoDB"
   - Railway creates a MongoDB instance automatically
   - Note: This uses your $5 credit

2. **Get MongoDB Connection String**:
   - Go to MongoDB service in Railway
   - Click "Variables" tab
   - Copy the `MONGO_URL` value (looks like: `mongodb://...`)

**Option B: MongoDB Atlas** (Free Forever)

1. **Create MongoDB Atlas Account**:
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free
   - Create a new **Free Cluster** (M0)

2. **Configure Access**:
   - **Network Access** → "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
   - **Database Access** → "Add New Database User" → Create username/password

3. **Get Connection String**:
   - Go to "Databases" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `universe_ai`

---

### **Step 4: Configure Environment Variables**

In your Railway project dashboard:

1. **Go to your main service** (not MongoDB)
2. Click **"Variables"** tab
3. Add the following variables:

#### **Required Variables:**

```env
MONGODB_URI=<your MongoDB connection string from Step 3>
DATABASE_NAME=universe_ai
SECRET_KEY=your-super-secret-random-string-here
JWT_SECRET=another-different-secret-key-here
PORT=5000
DEBUG=False
```

#### **Generate Strong Secrets:**

Use this command to generate random secrets:
```bash
# In PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Or use an online generator: [randomkeygen.com](https://randomkeygen.com)

#### **Optional Variables:**

```env
ALLOWED_ORIGINS=https://yourapp.up.railway.app
GOOGLE_CLIENT_ID=<if using Google OAuth>
SESSION_EXPIRY_HOURS=168
```

> **💡 Tip:** After adding MongoDB, Railway will automatically add `MONGO_URL`. You can use this for `MONGODB_URI`.

---

### **Step 5: Deploy & Verify**

1. **Trigger Deployment**:
   - Railway automatically redeploys when you add variables
   - OR click "Deploy" → "Redeploy"

2. **Monitor Deployment**:
   - Click "Deployments" tab
   - Watch the build logs
   - Build takes ~3-5 minutes
   - ✅ **Success:** "Build completed" → "Deployment live"
   - ❌ **Failed:** Check logs for errors

3. **Get Your Live URL**:
   - Go to "Settings" tab
   - Under "Domains" section
   - Copy the Railway URL (e.g., `universe-ai-production.up.railway.app`)
   - **OR** click "Generate Domain" if not created

4. **Test Your Deployment**:
   - Open `https://yourapp.up.railway.app` in browser
   - You should see your landing page ✨
   - Click "Get Started" → Should load auth page
   - Test the chat: Go to `/chat.html`

---

## 🧪 Post-Deployment Testing

### **Test Health Endpoint**
```bash
curl https://yourapp.up.railway.app/health
```

**Expected Response:**
```json
{"status":"ok"}
```

### **Test Database Connection**
```bash
curl https://yourapp.up.railway.app/api/db/health
```

**Expected Response:**
```json
{
  "connected": true,
  "collections": ["users", "chat_history", ...]
}
```

### **Test Frontend Pages**

Visit these URLs and ensure they load correctly:

- ✅ Landing page: `https://yourapp.up.railway.app/`
- ✅ Auth page: `https://yourapp.up.railway.app/auth.html`
- ✅ Chat page: `https://yourapp.up.railway.app/chat.html`
- ✅ Docs page: `https://yourapp.up.railway.app/docs.html`
- ✅ About page: `https://yourapp.up.railway.app/about.html`

### **Test User Registration & Login**

1. Go to `/auth.html`
2. Create a test account
3. Login with credentials
4. Verify you're redirected to chat page

### **Configure OpenRouter API Key**

**Important:** Users must add their own OpenRouter API key to use the chat.

1. Go to chat page
2. Click Settings (⚙️ icon)
3. Paste OpenRouter API key
4. Click "Save"
5. Send a test message

> **🔑 Get API Key:** [openrouter.ai/keys](https://openrouter.ai/keys)

---

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to GitHub!

```bash
# Make changes to your code
git add .
git commit -m "Update feature X"
git push origin main

# Railway deploys automatically in ~3 minutes! 🚀
```

---

## ⚙️ Advanced Configuration

### **Add Custom Domain**

1. In Railway dashboard → "Settings"
2. Under "Domains" → "Custom Domain"
3. Enter your domain (e.g., `myapp.com`)
4. Update your DNS settings (Railway provides instructions)
5. Railway automatically provisions SSL certificate

### **Monitor Logs**

```bash
# Real-time logs
railway logs
```

Or view logs in Railway dashboard → "Logs" tab

### **Scale Resources** (if needed)

Railway auto-scales, but you can set limits:
- Dashboard → "Settings" → "Resources"
- Adjust CPU/Memory limits

---

## 🐛 Troubleshooting

### **Build Failed: Python Version**

**Error:** `Python version not supported`

**Fix:** Add `runtime.txt` to project root:
```
python-3.11
```

### **Database Connection Failed**

**Error:** `Failed to connect to MongoDB`

**Fixes:**
1. Check `MONGODB_URI` variable is set correctly
2. If using Atlas:
   - Verify IP whitelist includes `0.0.0.0/0`
   - Check username/password in connection string
3. If using Railway MongoDB:
   - Ensure MongoDB service is running
   - Copy `MONGO_URL` from MongoDB service variables

### **API Returns 404**

**Error:** API endpoints return 404

**Fix:** Ensure your Railway URL includes `/api/` prefix:
- ✅ `https://yourapp.up.railway.app/api/db/health`
- ❌ `https://yourapp.up.railway.app/db/health`

### **Frontend Pages Don't Load**

**Error:** HTML pages return 404

**Fix:** Check `api.py` has static file serving code (already added ✅)

### **CORS Errors in Browser**

**Error:** `Access-Control-Allow-Origin` error

**Fix:** Add your Railway URL to `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=https://yourapp.up.railway.app
```

### **Chat Not Working - API Key**

**Error:** "API Key not set" or "Authentication failed"

**Fix:** Users must configure their own OpenRouter API key:
1. Open chat page
2. Click Settings (⚙️)
3. Enter API key
4. Save settings

---

## 💰 Cost Estimate

Railway pricing:

- **Free Trial:** $5 credit/month
- **Usage-based:** ~$0.50-2.00/month for small projects
- **MongoDB Plugin:** ~$2-3/month (included in free credit)

**Total Cost:** FREE for first month, ~$2-5/month after

**💡 Pro Tip:** Use MongoDB Atlas Free Tier (M0) to avoid MongoDB costs on Railway!

---

## 🎉 Next Steps

Your app is now LIVE! 🚀

**Share Your Project:**
- Copy your Railway URL
- Share with friends/classmates
- Add to your resume/portfolio
- Present in your MCA project defense

**Monitor Usage:**
- Railway Dashboard → "Metrics"
- View requests, bandwidth, errors

**Backup Data:**
- Export MongoDB data regularly
- Download chat history from UI

---

## 📞 Support & Resources

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **MongoDB Atlas Tutorial:** [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **OpenRouter API:** [openrouter.ai/docs](https://openrouter.ai/docs)

---

## 🔐 Security Reminders

- ✅ Never commit `.env` file to Git
- ✅ Use strong random strings for SECRET_KEY and JWT_SECRET
- ✅ Keep API keys in Railway environment variables
- ✅ Enable HTTPS (Railway does this automatically)
- ✅ Regularly update dependencies: `pip install --upgrade -r requirements.txt`

---

**Congratulations! Your UniVerse AI is deployed! 🎊**

Need help? Check the troubleshooting section or Railway's support docs.
