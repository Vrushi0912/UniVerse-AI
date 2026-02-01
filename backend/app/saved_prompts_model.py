"""
MongoDB Model for Saved Prompts/Library Items
Provides schema validation, indexing, and CRUD operations for user prompt library
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from bson import ObjectId
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic compatibility"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class SavedPrompt(BaseModel):
    """
    MongoDB model for saved prompts/library items
    
    Fields:
    - id: Unique identifier (auto-generated)
    - user_id: Owner of the prompt (indexed)
    - title: Prompt title/name (required, max 200 chars)
    - content: Actual prompt text (required, max 10000 chars)
    - description: Optional description of what the prompt does
    - category: Category/type of prompt (e.g., "coding", "writing", "analysis")
    - tags: List of searchable tags
    - is_favorite: Whether user has starred/favorited this prompt
    - is_public: Whether prompt is shared publicly or private
    - usage_count: Track how many times this prompt has been used
    - model_preference: Preferred AI model for this prompt (optional)
    - temperature: Preferred temperature setting (0.0-2.0)
    - created_at: Timestamp of creation (auto-generated)
    - updated_at: Timestamp of last update (auto-updated)
    - last_used_at: Timestamp of last usage (optional)
    """
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., min_length=1, max_length=100, description="Owner's user ID")
    title: str = Field(..., min_length=1, max_length=200, description="Prompt title")
    content: str = Field(..., min_length=1, max_length=10000, description="Prompt text content")
    description: Optional[str] = Field(None, max_length=500, description="Optional prompt description")
    category: str = Field(default="general", max_length=50, description="Prompt category")
    tags: List[str] = Field(default_factory=list, description="Searchable tags")
    is_favorite: bool = Field(default=False, description="Favorited/starred status")
    is_public: bool = Field(default=False, description="Public visibility flag")
    usage_count: int = Field(default=0, ge=0, description="Number of times used")
    model_preference: Optional[str] = Field(None, max_length=50, description="Preferred AI model")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="Temperature setting")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    last_used_at: Optional[datetime] = Field(None, description="Last usage timestamp")
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "user_id": "user123",
                "title": "Code Review Assistant",
                "content": "Review the following code and provide detailed feedback on...",
                "description": "Helps review code with focus on best practices",
                "category": "coding",
                "tags": ["code-review", "programming", "best-practices"],
                "is_favorite": True,
                "is_public": False,
                "usage_count": 15,
                "model_preference": "gemini-pro",
                "temperature": 0.7
            }
        }
    
    @validator('tags')
    def validate_tags(cls, v):
        """Ensure tags are unique, lowercase, and limited"""
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        # Convert to lowercase and remove duplicates
        return list(set(tag.lower().strip() for tag in v if tag.strip()))
    
    @validator('category')
    def validate_category(cls, v):
        """Normalize category to lowercase"""
        return v.lower().strip()
    
    @validator('title', 'content')
    def validate_not_empty(cls, v):
        """Ensure title and content are not just whitespace"""
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace only")
        return v.strip()
    
    def increment_usage(self):
        """Increment usage count and update last_used_at"""
        self.usage_count += 1
        self.last_used_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert model to dictionary for MongoDB insertion"""
        data = self.dict(by_alias=True, exclude_none=True)
        if '_id' in data and data['_id'] is None:
            del data['_id']
        return data


# Collection name
COLLECTION_NAME = "saved_prompts"


# Indexing Strategy for Optimal Performance
def get_indexes():
    """
    Returns list of IndexModel objects for MongoDB collection
    
    Indexing Strategy:
    1. user_id (ASCENDING) - Primary query pattern: fetch user's prompts
    2. user_id + is_favorite - Quick access to favorited prompts
    3. user_id + category - Filter by category within user's prompts
    4. user_id + created_at (DESC) - Sort by newest first
    5. user_id + usage_count (DESC) - Sort by most used
    6. is_public - Find public prompts for sharing/discovery
    7. Text index on title, content, tags - Full-text search capability
    8. tags - Tag-based filtering
    """
    
    return [
        # Primary index: user_id for user-specific queries
        IndexModel(
            [("user_id", ASCENDING)],
            name="user_id_index",
            background=True
        ),
        
        # Compound index: user_id + is_favorite (for favorites view)
        IndexModel(
            [("user_id", ASCENDING), ("is_favorite", DESCENDING)],
            name="user_favorites_index",
            background=True
        ),
        
        # Compound index: user_id + category (for category filtering)
        IndexModel(
            [("user_id", ASCENDING), ("category", ASCENDING)],
            name="user_category_index",
            background=True
        ),
        
        # Compound index: user_id + created_at DESC (for chronological listing)
        IndexModel(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="user_recent_index",
            background=True
        ),
        
        # Compound index: user_id + usage_count DESC (for most used prompts)
        IndexModel(
            [("user_id", ASCENDING), ("usage_count", DESCENDING)],
            name="user_popular_index",
            background=True
        ),
        
        # Index for public prompts discovery
        IndexModel(
            [("is_public", ASCENDING), ("usage_count", DESCENDING)],
            name="public_prompts_index",
            background=True
        ),
        
        # Text index for full-text search on title, content, and tags
        IndexModel(
            [("title", TEXT), ("content", TEXT), ("tags", TEXT)],
            name="text_search_index",
            default_language="english",
            background=True
        ),
        
        # Index for tag-based filtering
        IndexModel(
            [("tags", ASCENDING)],
            name="tags_index",
            background=True
        ),
        
        # TTL index for auto-deletion (optional - uncomment if needed)
        # IndexModel(
        #     [("created_at", ASCENDING)],
        #     name="ttl_index",
        #     expireAfterSeconds=31536000,  # 1 year
        #     background=True
        # )
    ]


# Helper function to initialize collection with indexes
def initialize_collection(db):
    """
    Initialize the saved_prompts collection with proper indexes
    
    Args:
        db: MongoDB database instance
    
    Usage:
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017/")
        db = client["universe_ai"]
        initialize_collection(db)
    """
    collection = db[COLLECTION_NAME]
    
    # Create indexes
    indexes = get_indexes()
    collection.create_indexes(indexes)
    
    print(f"✓ Collection '{COLLECTION_NAME}' initialized with {len(indexes)} indexes")
    return collection


# Example CRUD Operations
class SavedPromptRepository:
    """Repository class for saved prompts CRUD operations"""
    
    def __init__(self, db):
        self.collection = db[COLLECTION_NAME]
    
    def create(self, prompt: SavedPrompt) -> str:
        """Insert a new prompt and return its ID"""
        prompt.created_at = datetime.utcnow()
        prompt.updated_at = datetime.utcnow()
        result = self.collection.insert_one(prompt.to_dict())
        return str(result.inserted_id)
    
    def get_by_id(self, prompt_id: str, user_id: str) -> Optional[dict]:
        """Retrieve a prompt by ID (with user_id check for security)"""
        return self.collection.find_one({
            "_id": ObjectId(prompt_id),
            "user_id": user_id
        })
    
    def get_user_prompts(self, user_id: str, skip: int = 0, limit: int = 50) -> List[dict]:
        """Get all prompts for a user with pagination"""
        return list(self.collection.find({"user_id": user_id})
                   .sort("created_at", DESCENDING)
                   .skip(skip)
                   .limit(limit))
    
    def get_favorites(self, user_id: str) -> List[dict]:
        """Get user's favorite prompts"""
        return list(self.collection.find({
            "user_id": user_id,
            "is_favorite": True
        }).sort("created_at", DESCENDING))
    
    def get_by_category(self, user_id: str, category: str) -> List[dict]:
        """Get prompts filtered by category"""
        return list(self.collection.find({
            "user_id": user_id,
            "category": category
        }).sort("created_at", DESCENDING))
    
    def search(self, user_id: str, query: str) -> List[dict]:
        """Full-text search in user's prompts"""
        return list(self.collection.find({
            "user_id": user_id,
            "$text": {"$search": query}
        }).sort([("score", {"$meta": "textScore"})]))
    
    def update(self, prompt_id: str, user_id: str, updates: dict) -> bool:
        """Update a prompt (with user_id check for security)"""
        updates["updated_at"] = datetime.utcnow()
        result = self.collection.update_one(
            {"_id": ObjectId(prompt_id), "user_id": user_id},
            {"$set": updates}
        )
        return result.modified_count > 0
    
    def delete(self, prompt_id: str, user_id: str) -> bool:
        """Delete a prompt (with user_id check for security)"""
        result = self.collection.delete_one({
            "_id": ObjectId(prompt_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    
    def increment_usage(self, prompt_id: str, user_id: str) -> bool:
        """Increment usage count and update last_used_at"""
        result = self.collection.update_one(
            {"_id": ObjectId(prompt_id), "user_id": user_id},
            {
                "$inc": {"usage_count": 1},
                "$set": {
                    "last_used_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    def toggle_favorite(self, prompt_id: str, user_id: str) -> bool:
        """Toggle favorite status"""
        prompt = self.get_by_id(prompt_id, user_id)
        if not prompt:
            return False
        
        new_status = not prompt.get("is_favorite", False)
        return self.update(prompt_id, user_id, {"is_favorite": new_status})
    
    def get_public_prompts(self, skip: int = 0, limit: int = 20) -> List[dict]:
        """Get public prompts for discovery"""
        return list(self.collection.find({"is_public": True})
                   .sort("usage_count", DESCENDING)
                   .skip(skip)
                   .limit(limit))
    
    def get_stats(self, user_id: str) -> dict:
        """Get statistics for user's prompt library"""
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": None,
                "total": {"$sum": 1},
                "favorites": {"$sum": {"$cond": ["$is_favorite", 1, 0]}},
                "public": {"$sum": {"$cond": ["$is_public", 1, 0]}},
                "total_usage": {"$sum": "$usage_count"},
                "categories": {"$addToSet": "$category"}
            }}
        ]
        result = list(self.collection.aggregate(pipeline))
        return result[0] if result else {
            "total": 0,
            "favorites": 0,
            "public": 0,
            "total_usage": 0,
            "categories": []
        }
