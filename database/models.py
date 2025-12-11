"""
Database Models/Schemas for UniVerse AI
Defines structure for MongoDB collections
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class UserModel(BaseModel):
    """User account model"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr
    password_hash: str
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    subscription_tier: str = "free"  # free, pro, business
    preferences: Dict[str, Any] = {}
    
    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class ChatMessage(BaseModel):
    """Individual chat message"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    tokens_used: Optional[int] = None

class ChatHistoryModel(BaseModel):
    """Chat conversation history"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    session_id: str
    title: str = "New Chat"
    messages: List[ChatMessage] = []
    model_used: str = "meta-llama/llama-3.2-3b-instruct:free"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    total_tokens: int = 0
    is_archived: bool = False
    
    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class EducationalContentModel(BaseModel):
    """Generated educational content"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: Optional[PyObjectId] = None  # None for guest users
    topic: str
    content: str
    diagram_data: Optional[str] = None
    audio_script: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating: Optional[int] = None  # 1-5 stars
    is_favorite: bool = False
    tags: List[str] = []
    
    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class AnalyticsModel(BaseModel):
    """Analytics and metrics tracking"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: Optional[PyObjectId] = None
    event_type: str  # 'chat_generated', 'content_generated', 'login', 'signup', etc.
    event_data: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Business analytics fields
    daily_active: bool = False
    feature_used: Optional[str] = None  # 'chat', 'educational', 'analytics'
    
    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class UserSessionModel(BaseModel):
    """User session tracking"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    session_token: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_active: bool = True
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    
    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class BusinessAnalytics(BaseModel):
    """Aggregated business metrics"""
    date: datetime
    total_users: int = 0
    active_users: int = 0
    new_signups: int = 0
    chat_generations: int = 0
    educational_generations: int = 0
    total_tokens_used: int = 0
    avg_session_duration: float = 0.0
    feature_usage: Dict[str, int] = {}
    conversion_rate: float = 0.0
