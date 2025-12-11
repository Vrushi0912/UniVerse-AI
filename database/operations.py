"""
Database Operations for UniVerse AI
CRUD operations for all collections
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import bcrypt
from bson import ObjectId

from database.config import (
    get_users_collection,
    get_chat_history_collection,
    get_educational_content_collection,
    get_analytics_collection,
    get_user_sessions_collection
)
from database.models import (
    UserModel,
    ChatHistoryModel,
    EducationalContentModel,
    AnalyticsModel,
    UserSessionModel
)

# ============= USER OPERATIONS =============

def create_user(email: str, password: str, full_name: Optional[str] = None) -> Optional[str]:
    """Create a new user with hashed password"""
    users = get_users_collection()
    
    # Check if user already exists
    if users.find_one({"email": email}):
        return None
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    user_data = {
        "email": email,
        "password_hash": password_hash.decode('utf-8'),
        "full_name": full_name,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "subscription_tier": "free",
        "preferences": {}
    }
    
    result = users.insert_one(user_data)
    return str(result.inserted_id)

def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """Authenticate user with email and password"""
    users = get_users_collection()
    user = users.find_one({"email": email})
    
    if not user:
        return None
    # Guard: OAuth users may not have a password hash
    if not user.get('password_hash'):
        return None
    
    # Verify password
    if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        # Update last login
        users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        user.pop('password_hash')  # Don't return password hash
        return user
    
    return None

def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    users = get_users_collection()
    user = users.find_one({"_id": ObjectId(user_id)})
    if user:
        user.pop('password_hash', None)
    return user

def update_user_preferences(user_id: str, preferences: Dict) -> bool:
    """Update user preferences"""
    users = get_users_collection()
    result = users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"preferences": preferences}}
    )
    return result.modified_count > 0

# ============= OAUTH USER HELPERS =============

def get_or_create_oauth_user(email: str, full_name: Optional[str], provider: str = 'google') -> Optional[str]:
    """Create or get a user authenticated via OAuth (no password)."""
    users = get_users_collection()
    existing = users.find_one({"email": email})
    if existing:
        users.update_one({"_id": existing["_id"]}, {"$set": {"last_login": datetime.utcnow(), "is_active": True, "oauth_provider": provider}})
        return str(existing["_id"])
    user_data = {
        "email": email,
        "password_hash": "",
        "full_name": full_name,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow(),
        "is_active": True,
        "subscription_tier": "free",
        "preferences": {},
        "oauth_provider": provider
    }
    result = users.insert_one(user_data)
    return str(result.inserted_id)

# ============= CHAT HISTORY OPERATIONS =============

def save_chat_message(user_id: str, session_id: str, role: str, content: str, 
                     model_used: str = "meta-llama/llama-3.2-3b-instruct:free",
                     tokens_used: int = 0) -> bool:
    """Save a chat message to history"""
    chats = get_chat_history_collection()
    
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow(),
        "tokens_used": tokens_used
    }
    
    # Check if session exists
    existing = chats.find_one({"user_id": ObjectId(user_id), "session_id": session_id})
    
    if existing:
        # Update existing session
        result = chats.update_one(
            {"user_id": ObjectId(user_id), "session_id": session_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()},
                "$inc": {"total_tokens": tokens_used}
            }
        )
        return result.modified_count > 0
    else:
        # Create new session
        chat_data = {
            "user_id": ObjectId(user_id),
            "session_id": session_id,
            "title": content[:50] + "...",  # First message as title
            "messages": [message],
            "model_used": model_used,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "total_tokens": tokens_used,
            "is_archived": False
        }
        result = chats.insert_one(chat_data)
        return result.inserted_id is not None

def get_user_chat_history(user_id: str, limit: int = 50) -> List[Dict]:
    """Get user's chat history"""
    chats = get_chat_history_collection()
    return list(chats.find(
        {"user_id": ObjectId(user_id), "is_archived": False}
    ).sort("updated_at", -1).limit(limit))

def get_chat_session(session_id: str) -> Optional[Dict]:
    """Get specific chat session"""
    chats = get_chat_history_collection()
    return chats.find_one({"session_id": session_id})

def delete_chat_session(session_id: str) -> bool:
    """Delete a chat session"""
    chats = get_chat_history_collection()
    result = chats.delete_one({"session_id": session_id})
    return result.deleted_count > 0

def update_chat_title(session_id: str, title: str) -> bool:
    """Update chat session title"""
    chats = get_chat_history_collection()
    result = chats.update_one(
        {"session_id": session_id},
        {"$set": {"title": title}}
    )
    return result.modified_count > 0

# ============= EDUCATIONAL CONTENT OPERATIONS =============

def save_educational_content(user_id: Optional[str], topic: str, content: str,
                            diagram_data: Optional[str], audio_script: str) -> Optional[str]:
    """Save generated educational content"""
    edu_content = get_educational_content_collection()
    
    content_data = {
        "user_id": ObjectId(user_id) if user_id else None,
        "topic": topic,
        "content": content,
        "diagram_data": diagram_data,
        "audio_script": audio_script,
        "created_at": datetime.utcnow(),
        "is_favorite": False,
        "tags": []
    }
    
    result = edu_content.insert_one(content_data)
    return str(result.inserted_id)

def get_user_educational_content(user_id: str, limit: int = 50) -> List[Dict]:
    """Get user's educational content history"""
    edu_content = get_educational_content_collection()
    return list(edu_content.find(
        {"user_id": ObjectId(user_id)}
    ).sort("created_at", -1).limit(limit))

def mark_content_favorite(content_id: str, is_favorite: bool) -> bool:
    """Mark educational content as favorite"""
    edu_content = get_educational_content_collection()
    result = edu_content.update_one(
        {"_id": ObjectId(content_id)},
        {"$set": {"is_favorite": is_favorite}}
    )
    return result.modified_count > 0

# ============= ANALYTICS OPERATIONS =============

def log_analytics_event(event_type: str, user_id: Optional[str] = None,
                       event_data: Dict = None, session_id: Optional[str] = None,
                       feature_used: Optional[str] = None) -> bool:
    """Log an analytics event"""
    analytics = get_analytics_collection()
    
    event = {
        "user_id": ObjectId(user_id) if user_id else None,
        "event_type": event_type,
        "event_data": event_data or {},
        "timestamp": datetime.utcnow(),
        "session_id": session_id,
        "feature_used": feature_used,
        "daily_active": True
    }
    
    result = analytics.insert_one(event)
    return result.inserted_id is not None

def get_daily_analytics(date: datetime) -> Dict[str, Any]:
    """Get aggregated daily analytics"""
    analytics = get_analytics_collection()
    
    start_date = datetime(date.year, date.month, date.day)
    end_date = start_date + timedelta(days=1)
    
    pipeline = [
        {"$match": {
            "timestamp": {"$gte": start_date, "$lt": end_date}
        }},
        {"$group": {
            "_id": "$event_type",
            "count": {"$sum": 1}
        }}
    ]
    
    results = list(analytics.aggregate(pipeline))
    
    # Format results
    daily_stats = {
        "date": date,
        "total_events": sum(r['count'] for r in results),
        "events_by_type": {r['_id']: r['count'] for r in results}
    }
    
    return daily_stats

def get_business_metrics(start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """Get business analytics for date range"""
    analytics = get_analytics_collection()
    users = get_users_collection()
    
    # Get active users
    active_users = analytics.distinct("user_id", {
        "timestamp": {"$gte": start_date, "$lt": end_date},
        "daily_active": True
    })
    
    # Get new signups
    new_signups = users.count_documents({
        "created_at": {"$gte": start_date, "$lt": end_date}
    })
    
    # Get feature usage
    feature_pipeline = [
        {"$match": {
            "timestamp": {"$gte": start_date, "$lt": end_date},
            "feature_used": {"$ne": None}
        }},
        {"$group": {
            "_id": "$feature_used",
            "count": {"$sum": 1}
        }}
    ]
    
    feature_usage = {r['_id']: r['count'] for r in analytics.aggregate(feature_pipeline)}
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "active_users": len(active_users),
        "new_signups": new_signups,
        "feature_usage": feature_usage,
        "total_users": users.count_documents({})
    }

# ============= SESSION OPERATIONS =============

def create_user_session(user_id: str, session_token: str, 
                       expires_hours: int = 24) -> Optional[str]:
    """Create a new user session"""
    sessions = get_user_sessions_collection()
    
    session_data = {
        "user_id": ObjectId(user_id),
        "session_token": session_token,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=expires_hours),
        "is_active": True
    }
    
    result = sessions.insert_one(session_data)
    return str(result.inserted_id)

def validate_session(session_token: str) -> Optional[Dict]:
    """Validate a session token"""
    sessions = get_user_sessions_collection()
    session = sessions.find_one({
        "session_token": session_token,
        "is_active": True,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    return session

def invalidate_session(session_token: str) -> bool:
    """Invalidate a session"""
    sessions = get_user_sessions_collection()
    result = sessions.update_one(
        {"session_token": session_token},
        {"$set": {"is_active": False}}
    )
    return result.modified_count > 0
