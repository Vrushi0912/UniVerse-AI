"""
Database Configuration for UniVerse AI
Supports MongoDB for user authentication, chat history, and analytics
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from datetime import datetime
from typing import Optional

# Environment variables for database credentials
# Set these in your .env file or environment
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'universe_ai')

class DatabaseConnection:
    """MongoDB Database Connection Manager"""
    
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[DATABASE_NAME]
            print(f"✅ Connected to MongoDB database: {DATABASE_NAME}")
            return True
        except ConnectionFailure as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def get_collection(self, collection_name: str):
        """Get a specific collection from database"""
        if self.db is not None:
            return self.db[collection_name]
        return None
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("🔌 Database connection closed")

# Global database instance
db_connection = DatabaseConnection()

# Collection names
COLLECTIONS = {
    'users': 'users',
    'chat_history': 'chat_history',
    'educational_content': 'educational_content',
    'analytics': 'analytics',
    'user_sessions': 'user_sessions'
}

def get_users_collection():
    """Get users collection"""
    return db_connection.get_collection(COLLECTIONS['users'])

def get_chat_history_collection():
    """Get chat history collection"""
    return db_connection.get_collection(COLLECTIONS['chat_history'])

def get_educational_content_collection():
    """Get educational content collection"""
    return db_connection.get_collection(COLLECTIONS['educational_content'])

def get_analytics_collection():
    """Get analytics collection"""
    return db_connection.get_collection(COLLECTIONS['analytics'])

def get_user_sessions_collection():
    """Get user sessions collection"""
    return db_connection.get_collection(COLLECTIONS['user_sessions'])
