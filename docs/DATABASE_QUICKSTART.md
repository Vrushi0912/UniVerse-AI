# 🚀 Database Quick Start Guide

## For Your UniVerse AI Project

This guide will help you set up MongoDB database for your project in under 10 minutes.

---

## Option 1: MongoDB Atlas (Cloud - Recommended) ⭐

### Step 1: Create Free Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Choose **FREE** M0 cluster
4. Select region closest to you (e.g., Mumbai for India)
5. Click "Create Cluster" (takes 3-5 minutes)

### Step 2: Create Database User
1. Click "Database Access" in left sidebar
2. Click "+ ADD NEW DATABASE USER"
3. **Username:** `universe_ai_user`
4. **Password:** `yourSecurePassword123` (save this!)
5. Select "Read and write to any database"
6. Click "Add User"

### Step 3: Whitelist IP Address
1. Click "Network Access" in left sidebar
2. Click "+ ADD IP ADDRESS"
3. Click "ALLOW ACCESS FROM ANYWHERE" (for development)
4. Confirm (0.0.0.0/0 will be added)
5. Click "Confirm"

### Step 4: Get Connection String
1. Click "Database" in left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://universe_ai_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Configure Your Project
1. In your project, copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and update:
   ```env
   # Replace <password> with your actual password
   MONGODB_URI=mongodb+srv://universe_ai_user:yourSecurePassword123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=universe_ai
   ```

3. Save the file

### Step 6: Install Dependencies & Initialize
```bash
# Install Python packages
pip install -r requirements.txt

# Initialize database (creates indexes)
python database/setup.py
```

**✅ Done!** Your cloud database is ready!

---

## Option 2: Local MongoDB (For Development)

### Step 1: Install MongoDB
**Windows:**
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Complete" installation
4. Select "Install MongoDB as a Service"
5. Install MongoDB Compass (GUI tool)

**Check if MongoDB is running:**
```bash
# In PowerShell
Get-Service MongoDB

# Should show "Running"
```

### Step 2: Start MongoDB Service
```bash
# Windows PowerShell (as Administrator)
net start MongoDB
```

### Step 3: Configure Your Project
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and update:
   ```env
   MONGODB_URI=mongodb://localhost:27017/
   DATABASE_NAME=universe_ai
   ```

3. Save the file

### Step 4: Install Dependencies & Initialize
```bash
# Install Python packages
pip install -r requirements.txt

# Initialize database
python database/setup.py
```

**✅ Done!** Your local database is ready!

---

## Verify Your Setup

Run this Python script to test:

```python
# test_db.py
from database.operations import create_user, authenticate_user

# Test user creation
user_id = create_user("test@example.com", "password123", "Test User")
print(f"✅ User created with ID: {user_id}")

# Test authentication
user = authenticate_user("test@example.com", "password123")
if user:
    print(f"✅ Authentication successful: {user['email']}")
else:
    print("❌ Authentication failed")
```

Run it:
```bash
python test_db.py
```

---

## Common Issues & Solutions

### Issue: "pymongo.errors.ServerSelectionTimeoutError"
**Solution:**
- **Atlas:** Check IP whitelist, verify internet connection
- **Local:** Ensure MongoDB service is running (`net start MongoDB`)

### Issue: "Authentication failed"
**Solution:**
- Verify username and password in connection string
- Check database user permissions in Atlas

### Issue: "Module not found: pymongo"
**Solution:**
```bash
pip install pymongo bcrypt python-dotenv
```

### Issue: "Connection string is invalid"
**Solution:**
- Atlas: Make sure you replaced `<password>` with actual password
- Atlas: Check no spaces or special characters break the URL
- Atlas: Enclose password in quotes if it has special chars

---

## Quick Reference

### Connection String Format

**Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/
```

**Local:**
```
mongodb://localhost:27017/
```

### Important Files
- `.env` - Your credentials (DON'T commit to git!)
- `.env.example` - Template (safe to commit)
- `database/config.py` - Connection logic
- `database/operations.py` - Database functions
- `database/setup.py` - Initialization script

### Database Collections Created
- `users` - User accounts
- `chat_history` - Chat conversations
- `educational_content` - Generated lessons
- `analytics` - Usage metrics
- `user_sessions` - Active sessions

---

## Next Steps After Setup

1. **Test the connection:**
   ```bash
   python database/setup.py
   ```
   Should show: "✅ Connected to MongoDB database: universe_ai"

2. **Create test user:**
   ```python
   from database.operations import create_user
   create_user("your@email.com", "password", "Your Name")
   ```

3. **Use MongoDB Compass** (GUI):
   - Connect with your URI
   - Browse collections
   - View data visually

4. **Integrate with your app:**
   - Update auth.html to use database
   - Save chat history automatically
   - Track user analytics

---

## Environment Variables Explained

```env
# Database
MONGODB_URI=mongodb://...           # Your connection string
DATABASE_NAME=universe_ai            # Database name

# API Keys
OPENROUTER_API_KEY=your-api-key-here    # For AI features
UNSPLASH_ACCESS_KEY=...            # For images (optional)

# Security
SECRET_KEY=your-secret-key-here    # Flask session secret
JWT_SECRET=your-jwt-secret         # Token signing

# Settings
DEBUG=False                        # Set to True for development
PORT=5000                          # Server port
SESSION_EXPIRY_HOURS=24           # How long sessions last
```

---

## Security Best Practices

✅ **DO:**
- Use strong, unique passwords
- Keep `.env` file private
- Use environment variables
- Enable 2FA on MongoDB Atlas
- Whitelist specific IPs in production

❌ **DON'T:**
- Commit `.env` to git
- Share credentials publicly
- Use default passwords
- Allow all IPs (0.0.0.0/0) in production
- Hardcode sensitive data

---

## Getting Help

### MongoDB Atlas Issues
- Dashboard: https://cloud.mongodb.com
- Support: Click "Support" in Atlas dashboard
- Docs: https://docs.atlas.mongodb.com

### Local MongoDB Issues
- Check service: `Get-Service MongoDB`
- Start service: `net start MongoDB`
- Logs: C:\Program Files\MongoDB\Server\{version}\log

### Python/Code Issues
- Check Python version: `python --version` (need 3.7+)
- Install dependencies: `pip install -r requirements.txt`
- Check imports: Make sure database folder is in project root

---

## 📊 Database Usage Examples

### Create User
```python
from database.operations import create_user

user_id = create_user(
    email="user@example.com",
    password="securePassword123",
    full_name="John Doe"
)
```

### Authenticate User
```python
from database.operations import authenticate_user

user = authenticate_user("user@example.com", "securePassword123")
if user:
    print(f"Welcome, {user['full_name']}!")
```

### Save Chat Message
```python
from database.operations import save_chat_message

save_chat_message(
    user_id=user_id,
    session_id="chat_12345",
    role="user",
    content="Hello AI!",
    tokens_used=15
)
```

### Get Chat History
```python
from database.operations import get_user_chat_history

history = get_user_chat_history(user_id, limit=20)
for chat in history:
    print(f"{chat['title']} - {len(chat['messages'])} messages")
```

### Log Analytics Event
```python
from database.operations import log_analytics_event

log_analytics_event(
    event_type="chat_generated",
    user_id=user_id,
    feature_used="chat",
    event_data={"model": "gpt-4o", "tokens": 150}
)
```

### Get Business Metrics
```python
from database.operations import get_business_metrics
from datetime import datetime, timedelta

today = datetime.now()
week_ago = today - timedelta(days=7)

metrics = get_business_metrics(week_ago, today)
print(f"Active users this week: {metrics['active_users']}")
print(f"New signups: {metrics['new_signups']}")
print(f"Feature usage: {metrics['feature_usage']}")
```

---

## Monitoring Your Database

### Atlas (Cloud)
1. Go to MongoDB Atlas dashboard
2. Click "Metrics" tab
3. View:
   - Operations per second
   - Network traffic
   - Connections
   - Storage usage

### Local (Compass)
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Browse collections
4. Run queries
5. View stats

---

## Backup & Restore

### Atlas (Automatic)
- Free tier: Automatic backups
- Go to "Backup" tab to see snapshots
- Restore from any point

### Local (Manual)
```bash
# Backup
mongodump --db universe_ai --out C:\backups\

# Restore
mongorestore --db universe_ai C:\backups\universe_ai\
```

---

## 🎯 You're Ready!

Your database is now:
- ✅ Connected
- ✅ Initialized with proper indexes
- ✅ Secure with authentication
- ✅ Ready to store user data
- ✅ Ready for analytics

**Start building amazing features!** 🚀

---

**Questions?** Check `database/README.md` for detailed documentation.

**Created:** October 30, 2025  
**Project:** UniVerse AI  
**Developer:** Vrushket Vivek Mulye
