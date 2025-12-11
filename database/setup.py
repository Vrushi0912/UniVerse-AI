"""
Database Setup and Initialization
Creates indexes and initial configurations
"""
from datetime import datetime
from database.config import db_connection, COLLECTIONS

def create_indexes():
    """Create database indexes for better performance"""
    
    # Users collection indexes
    users = db_connection.get_collection(COLLECTIONS['users'])
    users.create_index("email", unique=True)
    users.create_index("created_at")
    print("✅ Created indexes for users collection")
    
    # Chat history indexes
    chat_history = db_connection.get_collection(COLLECTIONS['chat_history'])
    chat_history.create_index([("user_id", 1), ("updated_at", -1)])
    chat_history.create_index("session_id", unique=True)
    chat_history.create_index("is_archived")
    print("✅ Created indexes for chat_history collection")
    
    # Educational content indexes
    edu_content = db_connection.get_collection(COLLECTIONS['educational_content'])
    edu_content.create_index([("user_id", 1), ("created_at", -1)])
    edu_content.create_index("topic")
    edu_content.create_index("is_favorite")
    edu_content.create_index("tags")
    print("✅ Created indexes for educational_content collection")
    
    # Analytics indexes
    analytics = db_connection.get_collection(COLLECTIONS['analytics'])
    analytics.create_index([("timestamp", -1)])
    analytics.create_index([("user_id", 1), ("timestamp", -1)])
    analytics.create_index("event_type")
    analytics.create_index("feature_used")
    analytics.create_index("daily_active")
    print("✅ Created indexes for analytics collection")
    
    # User sessions indexes
    sessions = db_connection.get_collection(COLLECTIONS['user_sessions'])
    sessions.create_index("session_token", unique=True)
    sessions.create_index([("user_id", 1), ("created_at", -1)])
    sessions.create_index("expires_at")
    sessions.create_index("is_active")
    print("✅ Created indexes for user_sessions collection")

def verify_setup():
    """Verify database setup"""
    try:
        # Check connection
        db_connection.client.admin.command('ping')
        print("✅ Database connection successful")
        
        # List collections
        collections = db_connection.db.list_collection_names()
        print(f"📚 Existing collections: {', '.join(collections) if collections else 'None'}")
        
        # Get stats
        stats = db_connection.db.command("dbStats")
        print(f"📊 Database size: {stats.get('dataSize', 0) / 1024 / 1024:.2f} MB")
        
        return True
    except Exception as e:
        print(f"❌ Setup verification failed: {e}")
        return False

def drop_database():
    """⚠️ WARNING: This will delete ALL data!"""
    confirm = input("⚠️  Are you sure you want to drop the entire database? (yes/no): ")
    if confirm.lower() == 'yes':
        db_connection.client.drop_database(db_connection.db.name)
        print("🗑️  Database dropped")
    else:
        print("❌ Operation cancelled")

if __name__ == "__main__":
    print("🚀 Starting database setup...\n")
    
    if verify_setup():
        print("\n📝 Creating indexes...")
        create_indexes()
        print("\n✅ Database setup complete!")
    else:
        print("\n❌ Database setup failed")
