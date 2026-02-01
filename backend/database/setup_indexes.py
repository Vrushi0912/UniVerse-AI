"""
MongoDB Index Setup Script for UniVerse AI
Creates all performance indexes using pymongo
"""
from database.config import db_connection
from pymongo import ASCENDING, DESCENDING, TEXT
from pymongo.errors import OperationFailure
import sys

def safe_create_index(collection, keys, **kwargs):
    """Safely create an index, dropping conflicts if needed"""
    try:
        collection.create_index(keys, **kwargs)
    except OperationFailure as e:
        if e.code == 85:  # IndexOptionsConflict
            index_name = kwargs.get('name')
            if index_name:
                print(f"    ⚠️  Dropping conflicting index: {index_name}")
                try:
                    collection.drop_index(index_name)
                    collection.create_index(keys, **kwargs)
                    print(f"    ✅ Recreated: {index_name}")
                except Exception as drop_err:
                    print(f"    ❌ Error recreating {index_name}: {drop_err}")
        else:
            print(f"    ❌ Error: {e}")

def create_indexes():
    """Create all collection indexes"""
    
    try:
        # Test connection
        db_connection.client.admin.command('ping')
        db = db_connection.db
    except Exception as e:
        print(f"❌ Database not connected: {str(e)}")
        print("💡 Please ensure MongoDB is running on localhost:27017")
        return False
    print("🚀 Starting index creation for UniVerse AI database...\n")
    
    # ==================================================================
    # 1. USERS COLLECTION INDEXES
    # ==================================================================
    print("📊 Creating indexes for 'users' collection...")
    users = db.users
    
    safe_create_index(users, [("email", ASCENDING)], unique=True, name="idx_email_unique")
    safe_create_index(users, [("created_at", DESCENDING)], name="idx_created_at")
    safe_create_index(users, [("last_login", DESCENDING)], name="idx_last_login")
    safe_create_index(users, [("subscription_tier", ASCENDING), ("is_active", ASCENDING)], 
                       name="idx_subscription_active")
    safe_create_index(users, [("oauth_provider", ASCENDING)], sparse=True, name="idx_oauth_provider")
    
    print("✅ Users indexes created\n")
    
    # ==================================================================
    # 2. USER_SESSIONS COLLECTION INDEXES
    # ==================================================================
    print("📊 Creating indexes for 'user_sessions' collection...")
    sessions = db.user_sessions
    
    sessions.create_index([("session_token", ASCENDING)], unique=True, 
                         name="idx_session_token_unique")
    sessions.create_index([("user_id", ASCENDING), ("is_active", ASCENDING)], 
                         name="idx_user_active")
    sessions.create_index([("created_at", DESCENDING)], name="idx_created_at")
    
    # TTL Index - Auto-delete expired sessions after 7 days
    sessions.create_index([("expires_at", ASCENDING)], 
                         expireAfterSeconds=604800,  # 7 days
                         name="idx_expires_at_ttl")
    
    print("✅ User sessions indexes created (including TTL)\n")
    
    # ==================================================================
    # 3. CHAT_HISTORY COLLECTION INDEXES
    # ==================================================================
    print("📊 Creating indexes for 'chat_history' collection...")
    chats = db.chat_history
    
    chats.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)], 
                       name="idx_user_updated")
    chats.create_index([("session_id", ASCENDING)], unique=True, 
                       name="idx_session_id_unique")
    chats.create_index([("user_id", ASCENDING), ("is_archived", ASCENDING)], 
                       name="idx_user_archived")
    chats.create_index([("user_id", ASCENDING), ("is_favorite", ASCENDING)], 
                       name="idx_user_favorite")
    chats.create_index([("user_id", ASCENDING), ("tags", ASCENDING)], 
                       name="idx_user_tags")
    chats.create_index([("created_at", DESCENDING)], name="idx_created_at")
    
    # Text search index for chat content
    chats.create_index([("title", TEXT), ("messages.content", TEXT)],
                       name="idx_chat_content_search",
                       weights={"title": 2, "messages.content": 1})
    
    print("✅ Chat history indexes created (including text search)\n")
    
    # ==================================================================
    # 4. SAVED_PROMPTS COLLECTION INDEXES
    # ==================================================================
    print("📊 Creating indexes for 'saved_prompts' collection...")
    prompts = db.saved_prompts
    
    prompts.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], 
                         name="idx_user_created")
    prompts.create_index([("user_id", ASCENDING), ("is_favorite", ASCENDING)], 
                         name="idx_user_favorite")
    prompts.create_index([("user_id", ASCENDING), ("category", ASCENDING)], 
                         name="idx_user_category")
    prompts.create_index([("user_id", ASCENDING), ("tags", ASCENDING)], 
                         name="idx_user_tags")
    prompts.create_index([("prompt_id", ASCENDING)], unique=True, 
                         name="idx_prompt_id_unique")
    
    # Text search index with weighted fields
    prompts.create_index([("prompt", TEXT), ("response", TEXT), ("title", TEXT)],
                         name="idx_prompt_search",
                         weights={"title": 3, "prompt": 2, "response": 1})
    
    # Public sharing indexes (for future feature)
    prompts.create_index([("is_public", ASCENDING), ("created_at", DESCENDING)], 
                         name="idx_public_created", sparse=True)
    prompts.create_index([("share_link", ASCENDING)], sparse=True, unique=True,
                         name="idx_share_link_unique")
    
    print("✅ Saved prompts indexes created (including text search)\n")
    
    # ==================================================================
    # 5. USER_PREFERENCES COLLECTION INDEXES
    # ==================================================================
    print("📊 Creating indexes for 'user_preferences' collection...")
    prefs = db.user_preferences
    
    prefs.create_index([("user_id", ASCENDING)], unique=True, 
                       name="idx_user_id_unique")
    prefs.create_index([("updated_at", DESCENDING)], name="idx_updated_at")
    
    print("✅ User preferences indexes created\n")
    
    # ==================================================================
    # 6. ANALYTICS COLLECTION INDEXES
    # ==================================================================
    print("📊 Creating indexes for 'analytics' collection...")
    analytics = db.analytics
    
    # Time-series indexes
    analytics.create_index([("timestamp", DESCENDING)], name="idx_timestamp")
    analytics.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)], 
                          name="idx_user_timestamp")
    analytics.create_index([("event_type", ASCENDING), ("timestamp", DESCENDING)], 
                          name="idx_event_type_timestamp")
    
    # User engagement indexes
    analytics.create_index([("user_id", ASCENDING), ("daily_active", ASCENDING)], 
                          name="idx_user_daily_active")
    analytics.create_index([("feature_used", ASCENDING), ("timestamp", DESCENDING)], 
                          name="idx_feature_timestamp")
    
    # Performance analysis
    analytics.create_index([("event_type", ASCENDING), ("error_occurred", ASCENDING)], 
                          name="idx_event_errors")
    analytics.create_index([("session_id", ASCENDING)], name="idx_session_id")
    
    # Compound index for complex queries
    analytics.create_index([("event_type", ASCENDING), ("timestamp", DESCENDING), 
                           ("user_id", ASCENDING)], 
                          name="idx_event_timestamp_user")
    
    # TTL Index - Auto-delete analytics data older than 90 days
    analytics.create_index([("timestamp", ASCENDING)], 
                          expireAfterSeconds=7776000,  # 90 days
                          name="idx_timestamp_ttl")
    
    print("✅ Analytics indexes created (including TTL)\n")
    
    # ==================================================================
    # VERIFICATION
    # ==================================================================
    print("\n🔍 Verifying indexes...\n")
    
    collections = {
        'users': users,
        'user_sessions': sessions,
        'chat_history': chats,
        'saved_prompts': prompts,
        'user_preferences': prefs,
        'analytics': analytics
    }
    
    total_indexes = 0
    for name, collection in collections.items():
        indexes = list(collection.list_indexes())
        index_count = len(indexes)
        total_indexes += index_count
        print(f"  {name}: {index_count} indexes")
        
        # Show index names
        for idx in indexes:
            if idx['name'] != '_id_':  # Skip default index
                print(f"    - {idx['name']}")
    
    print(f"\n✅ All indexes created successfully!")
    print(f"📊 Total collections indexed: {len(collections)}")
    print(f"📊 Total indexes created: {total_indexes}")
    print("\n🎉 Setup complete! Your database is optimized for performance.")
    
    return True

if __name__ == "__main__":
    try:
        success = create_indexes()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error creating indexes: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
