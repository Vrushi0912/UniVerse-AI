import os
import time
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from datetime import datetime
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Environment variables for database credentials
# MONGO_URI format: mongodb://localhost:27017/universe_ai
MONGO_URI = os.getenv('MONGO_URI', os.getenv('MONGODB_URI', 'mongodb://localhost:27017/universe_ai'))
DATABASE_NAME = os.getenv('DATABASE_NAME', 'universe_ai')
CONNECTION_TIMEOUT_MS = int(os.getenv('MONGO_TIMEOUT_MS', '10000'))  # 10 seconds default
MAX_POOL_SIZE = int(os.getenv('MONGO_MAX_POOL_SIZE', '50'))
MIN_POOL_SIZE = int(os.getenv('MONGO_MIN_POOL_SIZE', '10'))

class DatabaseConnection:
    """
    MongoDB Database Connection Manager with Best Practices
    
    Features:
    - Connection pooling with configurable pool size
    - Retry logic with exponential backoff
    - Comprehensive error handling and logging
    - Thread-safe singleton pattern
    - Graceful shutdown support
    """
    
    _instance: Optional['DatabaseConnection'] = None
    _lock = None
    
    def __new__(cls):
        """Implement singleton pattern"""
        if cls._instance is None:
            import threading
            if cls._lock is None:
                cls._lock = threading.Lock()
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(DatabaseConnection, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize database connection with retry logic"""
        if self._initialized:
            return
            
        self.client: Optional[MongoClient] = None
        self.db = None
        self._initialized = True
        self.connect()
    
    def connect(self, max_retries: int = 3) -> bool:
        """
        Establish connection to MongoDB with retry logic
        
        Args:
            max_retries: Maximum number of connection attempts
            
        Returns:
            bool: True if connection successful, False otherwise
        """
        retry_count = 0
        retry_delay = 1  # Initial delay in seconds
        
        while retry_count < max_retries:
            try:
                logger.info(f"🔌 Attempting to connect to MongoDB (attempt {retry_count + 1}/{max_retries})...")
                logger.info(f"📡 Connection URI: {MONGO_URI.split('@')[-1] if '@' in MONGO_URI else MONGO_URI}")
                
                # Create MongoDB client with connection pooling
                self.client = MongoClient(
                    MONGO_URI,
                    serverSelectionTimeoutMS=CONNECTION_TIMEOUT_MS,
                    connectTimeoutMS=CONNECTION_TIMEOUT_MS,
                    socketTimeoutMS=CONNECTION_TIMEOUT_MS,
                    maxPoolSize=MAX_POOL_SIZE,
                    minPoolSize=MIN_POOL_SIZE,
                    retryWrites=True,
                    retryReads=True,
                    # Connection pool configuration
                    maxIdleTimeMS=45000,  # Close connections idle for 45 seconds
                    waitQueueTimeoutMS=10000,  # Wait max 10 seconds for connection from pool
                )
                
                # Test connection with admin command
                self.client.admin.command('ping')
                
                # Get database instance
                self.db = self.client[DATABASE_NAME]
                
                logger.info(f"✅ Successfully connected to MongoDB database: {DATABASE_NAME}")
                logger.info(f"📊 Connection pool config: max={MAX_POOL_SIZE}, min={MIN_POOL_SIZE}")
                
                return True
                
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                retry_count += 1
                if retry_count < max_retries:
                    logger.warning(f"⚠️  Connection failed: {str(e)}")
                    logger.info(f"🔄 Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error(f"❌ Failed to connect to MongoDB after {max_retries} attempts: {str(e)}")
                    logger.error("💡 Make sure MongoDB is running on localhost:27017")
                    logger.error("💡 For MongoDB Compass: mongodb://localhost:27017")
                    return False
                    
            except Exception as e:
                logger.error(f"❌ Unexpected error during MongoDB connection: {type(e).__name__}: {str(e)}")
                return False
        
        return False
    
    def get_collection(self, collection_name: str):
        """
        Get a specific collection from database
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            Collection instance
            
        Raises:
            RuntimeError: If database is not connected
        """
        if self.db is None:
            error_msg = f"Database not connected. Cannot access collection '{collection_name}'. Check MongoDB connection."
            logger.error(f"❌ {error_msg}")
            raise RuntimeError(error_msg)
        return self.db[collection_name]
    
    def health_check(self) -> dict:
        """
        Perform comprehensive health check
        
        Returns:
            dict: Health status with connection details
        """
        if self.client is None or self.db is None:
            return {
                "connected": False,
                "error": "Database not initialized"
            }
        
        try:
            # Ping server
            self.client.admin.command('ping')
            
            # Get server info
            server_info = self.client.server_info()
            
            # Get collection names
            collections = self.db.list_collection_names()
            
            # Get connection pool stats (if available)
            pool_stats = {}
            try:
                pool_stats = {
                    "max_pool_size": MAX_POOL_SIZE,
                    "min_pool_size": MIN_POOL_SIZE,
                    "timeout_ms": CONNECTION_TIMEOUT_MS
                }
            except:
                pass
            
            return {
                "connected": True,
                "database": DATABASE_NAME,
                "mongodb_version": server_info.get('version', 'unknown'),
                "collections": collections,
                "collection_count": len(collections),
                "pool_config": pool_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Health check failed: {str(e)}")
            return {
                "connected": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
    
    def close(self):
        """Close database connection gracefully"""
        if self.client:
            try:
                logger.info("🔌 Closing MongoDB connection...")
                self.client.close()
                logger.info("✅ Database connection closed successfully")
            except Exception as e:
                logger.error(f"⚠️  Error closing database connection: {str(e)}")
            finally:
                self.client = None
                self.db = None

# Global database instance (singleton)
db_connection = DatabaseConnection()

# Collection names
COLLECTIONS = {
    'users': 'users',
    'chat_history': 'chat_history',
    'educational_content': 'educational_content',
    'analytics': 'analytics',
    'user_sessions': 'user_sessions',
    'saved_prompts': 'saved_prompts',
    'user_preferences': 'user_preferences'
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

def get_saved_prompts_collection():
    """Get saved prompts collection"""
    return db_connection.get_collection(COLLECTIONS['saved_prompts'])

def get_user_preferences_collection():
    """Get user preferences collection"""
    return db_connection.get_collection(COLLECTIONS['user_preferences'])
