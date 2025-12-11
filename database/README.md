# UniVerse AI - Database Setup Guide

## MongoDB Database Configuration

This project uses MongoDB to store user data, chat history, educational content, and analytics.

## 🚀 Quick Start

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB**
   ```bash
   # Windows (using Chocolatey)
   choco install mongodb
   
   # Or download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB Service**
   ```bash
   # Windows
   net start MongoDB
   
   # Or use MongoDB Compass (GUI application)
   ```

3. **Configure Environment**
   ```bash
   # Copy the example file
   copy .env.example .env
   
   # Edit .env and set:
   MONGODB_URI=mongodb://localhost:27017/
   DATABASE_NAME=universe_ai
   ```

4. **Initialize Database**
   ```bash
   python database/setup.py
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. **Create Free Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Create a free M0 cluster

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

3. **Configure Environment**
   ```bash
   # Edit .env and set:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=universe_ai
   ```
   
   **Important**: Replace `username` and `password` with your actual credentials

4. **Whitelist IP Address**
   - In Atlas, go to "Network Access"
   - Click "Add IP Address"
   - For development: Add `0.0.0.0/0` (allows all)
   - For production: Add specific IP addresses

5. **Initialize Database**
   ```bash
   python database/setup.py
   ```

## 📊 Database Schema

### Collections

#### 1. `users`
Stores user accounts and authentication
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password_hash: String,
  full_name: String,
  created_at: DateTime,
  last_login: DateTime,
  is_active: Boolean,
  subscription_tier: String, // "free", "pro", "business"
  preferences: Object
}
```

#### 2. `chat_history`
Stores chat conversations
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  session_id: String (unique),
  title: String,
  messages: [{
    role: String, // "user" or "assistant"
    content: String,
    timestamp: DateTime,
    tokens_used: Number
  }],
  model_used: String,
  created_at: DateTime,
  updated_at: DateTime,
  total_tokens: Number,
  is_archived: Boolean
}
```

#### 3. `educational_content`
Stores generated educational materials
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (nullable),
  topic: String,
  content: String,
  diagram_data: String,
  audio_script: String,
  created_at: DateTime,
  rating: Number (1-5),
  is_favorite: Boolean,
  tags: [String]
}
```

#### 4. `analytics`
Tracks user activity and metrics
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (nullable),
  event_type: String,
  event_data: Object,
  timestamp: DateTime,
  session_id: String,
  feature_used: String, // "chat", "educational", "analytics"
  daily_active: Boolean
}
```

#### 5. `user_sessions`
Manages active user sessions
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  session_token: String (unique),
  created_at: DateTime,
  expires_at: DateTime,
  is_active: Boolean,
  ip_address: String,
  device_info: String
}
```

## 🔧 Usage in Your Application

### Python Backend

```python
from database.operations import (
    create_user, authenticate_user,
    save_chat_message, get_user_chat_history,
    save_educational_content,
    log_analytics_event
)

# Create user
user_id = create_user("user@example.com", "password123", "John Doe")

# Authenticate
user = authenticate_user("user@example.com", "password123")

# Save chat message
save_chat_message(user_id, session_id, "user", "Hello AI!")

# Log analytics
log_analytics_event("chat_generated", user_id, feature_used="chat")
```

### JavaScript Frontend

```javascript
// API endpoints will be created in your Flask backend
// Example API calls:

// Register user
fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

// Get chat history
fetch('/api/chat/history', {
  headers: { 'Authorization': 'Bearer ' + token }
})
```

## 📦 Required Python Packages

Update your `requirements.txt`:

```txt
pydantic>=2.0.0
pymongo>=4.0.0
bcrypt>=4.0.0
python-dotenv>=1.0.0
```

Install dependencies:
```bash
pip install -r requirements.txt
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong passwords** - For both database and user accounts
3. **Enable MongoDB authentication** - In production environments
4. **Use environment variables** - Never hardcode credentials
5. **Implement rate limiting** - Prevent abuse of API endpoints
6. **Regular backups** - Schedule automated backups in Atlas

## 📈 Monitoring & Analytics

### Business Metrics Available

- Daily active users
- New signups
- Feature usage (Chat AI vs Educational AI)
- Token consumption
- Session duration
- Conversion rates

### Example: Get Daily Analytics

```python
from database.operations import get_daily_analytics
from datetime import datetime

stats = get_daily_analytics(datetime.now())
print(stats)
# {
#   "date": "2025-10-30",
#   "total_events": 150,
#   "events_by_type": {
#     "chat_generated": 80,
#     "content_generated": 45,
#     "login": 25
#   }
# }
```

## 🆘 Troubleshooting

### Connection Failed
- Check if MongoDB service is running
- Verify connection string in `.env`
- Check network/firewall settings

### Authentication Error
- Verify username and password in connection string
- Check IP whitelist in MongoDB Atlas

### Import Errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python path includes project root

## 📞 Support

For database-related issues:
1. Check MongoDB logs
2. Test connection with MongoDB Compass
3. Verify environment variables
4. Review error messages in console

## 🎯 Next Steps

After database setup:
1. Create API endpoints in Flask/FastAPI
2. Integrate with frontend JavaScript
3. Test all CRUD operations
4. Set up automated backups
5. Configure monitoring and alerts
