"""
MongoDB Model for User Preferences
Handles user settings including theme, model preferences, API keys (encrypted), and UI configurations
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from bson import ObjectId
from pymongo import IndexModel, ASCENDING
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2 compatibility"""
    
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ],
        serialization=core_schema.plain_serializer_function_ser_schema(
            lambda x: str(x)
        ))
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


# Encryption utility for API keys
class EncryptionService:
    """
    Secure encryption service for sensitive data like API keys
    Uses Fernet (symmetric encryption) with PBKDF2 key derivation
    """
    
    def __init__(self, master_key: Optional[str] = None):
        """
        Initialize encryption service
        
        Args:
            master_key: Master encryption key from environment variable
                       If not provided, uses ENCRYPTION_KEY from env
        """
        self.master_key = master_key or os.getenv("ENCRYPTION_KEY")
        
        if not self.master_key:
            raise ValueError(
                "ENCRYPTION_KEY environment variable must be set. "
                "Generate one using: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )
        
        # Derive a proper Fernet key from the master key
        self.fernet = self._create_fernet(self.master_key)
    
    def _create_fernet(self, key: str) -> Fernet:
        """Create Fernet cipher from master key"""
        # Use PBKDF2HMAC to derive a proper 32-byte key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'universe_ai_salt_v1',  # Static salt for consistency
            iterations=100000,
            backend=default_backend()
        )
        derived_key = base64.urlsafe_b64encode(kdf.derive(key.encode()))
        return Fernet(derived_key)
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string
        
        Args:
            plaintext: String to encrypt
            
        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return ""
        
        encrypted_bytes = self.fernet.encrypt(plaintext.encode())
        return encrypted_bytes.decode()
    
    def decrypt(self, encrypted: str) -> str:
        """
        Decrypt encrypted string
        
        Args:
            encrypted: Base64-encoded encrypted string
            
        Returns:
            Decrypted plaintext string
        """
        if not encrypted:
            return ""
        
        try:
            decrypted_bytes = self.fernet.decrypt(encrypted.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")


# Global encryption service instance
_encryption_service = None

def get_encryption_service() -> EncryptionService:
    """Get or create global encryption service instance"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service


class APIKeyConfig(BaseModel):
    """Encrypted API key configuration"""
    gemini_api_key: Optional[str] = Field(None, description="Encrypted Gemini API key")
    openai_api_key: Optional[str] = Field(None, description="Encrypted OpenAI API key")
    anthropic_api_key: Optional[str] = Field(None, description="Encrypted Anthropic API key")
    custom_api_keys: Dict[str, str] = Field(default_factory=dict, description="Other encrypted API keys")
    
    class Config:
        schema_extra = {
            "example": {
                "gemini_api_key": "encrypted_key_here",
                "openai_api_key": "encrypted_key_here",
                "custom_api_keys": {
                    "cohere": "encrypted_key_here"
                }
            }
        }


class ThemeSettings(BaseModel):
    """Theme and appearance settings"""
    mode: str = Field(default="dark", description="Theme mode: light, dark, auto")
    primary_color: str = Field(default="#6366f1", description="Primary accent color")
    font_size: str = Field(default="medium", description="Font size: small, medium, large")
    font_family: str = Field(default="Inter", description="Preferred font family")
    
    @validator('mode')
    def validate_mode(cls, v):
        allowed_modes = ["light", "dark", "auto"]
        if v not in allowed_modes:
            raise ValueError(f"Theme mode must be one of {allowed_modes}")
        return v
    
    @validator('font_size')
    def validate_font_size(cls, v):
        allowed_sizes = ["small", "medium", "large", "x-large"]
        if v not in allowed_sizes:
            raise ValueError(f"Font size must be one of {allowed_sizes}")
        return v


class ModelSettings(BaseModel):
    """AI model preferences"""
    default_model: str = Field(default="gemini-pro", description="Default AI model")
    default_temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Default temperature")
    default_max_tokens: Optional[int] = Field(None, ge=1, le=100000, description="Default max tokens")
    stream_responses: bool = Field(default=True, description="Enable streaming responses")
    
    @validator('default_model')
    def validate_model(cls, v):
        # Common model identifiers
        allowed_prefixes = ["gemini", "gpt", "claude", "command", "llama", "custom"]
        if not any(v.startswith(prefix) for prefix in allowed_prefixes):
            raise ValueError(f"Model must start with one of {allowed_prefixes}")
        return v


class UISettings(BaseModel):
    """UI behavior and preferences"""
    show_welcome_message: bool = Field(default=True, description="Show welcome on login")
    enable_animations: bool = Field(default=True, description="Enable UI animations")
    compact_mode: bool = Field(default=False, description="Compact UI layout")
    show_timestamps: bool = Field(default=True, description="Show message timestamps")
    auto_scroll: bool = Field(default=True, description="Auto-scroll to bottom")
    sidebar_collapsed: bool = Field(default=False, description="Sidebar collapsed by default")
    enable_notifications: bool = Field(default=True, description="Enable browser notifications")
    language: str = Field(default="en", description="Interface language")
    
    @validator('language')
    def validate_language(cls, v):
        # ISO 639-1 language codes
        allowed_languages = ["en", "es", "fr", "de", "zh", "ja", "hi", "ar"]
        if v not in allowed_languages:
            raise ValueError(f"Language must be one of {allowed_languages}")
        return v


class UserPreferences(BaseModel):
    """
    Complete user preferences model with encrypted API keys
    
    Security:
    - API keys are encrypted at rest using Fernet symmetric encryption
    - Master encryption key must be set via ENCRYPTION_KEY environment variable
    - Each user has a unique preferences document
    """
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., min_length=1, max_length=100, description="User ID (unique)")
    
    # API Keys (stored encrypted)
    api_keys: APIKeyConfig = Field(default_factory=APIKeyConfig, description="Encrypted API keys")
    
    # Settings categories
    theme: ThemeSettings = Field(default_factory=ThemeSettings, description="Theme settings")
    model: ModelSettings = Field(default_factory=ModelSettings, description="Model preferences")
    ui: UISettings = Field(default_factory=UISettings, description="UI preferences")
    
    # Custom settings (flexible key-value storage)
    custom_settings: Dict[str, Any] = Field(default_factory=dict, description="Custom user settings")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "user_id": "user123",
                "api_keys": {
                    "gemini_api_key": "gAAAAABh...(encrypted)",
                    "openai_api_key": "gAAAAABh...(encrypted)"
                },
                "theme": {
                    "mode": "dark",
                    "primary_color": "#6366f1",
                    "font_size": "medium"
                },
                "model": {
                    "default_model": "gemini-pro",
                    "default_temperature": 0.7,
                    "stream_responses": True
                },
                "ui": {
                    "enable_animations": True,
                    "compact_mode": False,
                    "language": "en"
                }
            }
        }
    
    def to_dict(self):
        """Convert model to dictionary for MongoDB insertion"""
        data = self.dict(by_alias=True, exclude_none=True)
        if '_id' in data and data['_id'] is None:
            del data['_id']
        return data


# Collection name
COLLECTION_NAME = "user_preferences"


# Indexing strategy
def get_indexes():
    """
    Returns list of IndexModel objects for MongoDB collection
    
    Indexing Strategy:
    1. user_id (UNIQUE, ASCENDING) - One preferences doc per user
    """
    
    return [
        # Unique index on user_id - ensures one preferences document per user
        IndexModel(
            [("user_id", ASCENDING)],
            name="user_id_unique_index",
            unique=True,
            background=True
        )
    ]


def initialize_collection(db):
    """
    Initialize the user_preferences collection with proper indexes
    
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


class UserPreferencesRepository:
    """Repository class for user preferences CRUD operations with encryption"""
    
    def __init__(self, db, encryption_service: Optional[EncryptionService] = None):
        self.collection = db[COLLECTION_NAME]
        self.encryption = encryption_service or get_encryption_service()
    
    def _encrypt_api_keys(self, api_keys: APIKeyConfig) -> APIKeyConfig:
        """Encrypt all API keys in the config"""
        encrypted = APIKeyConfig()
        
        if api_keys.gemini_api_key:
            encrypted.gemini_api_key = self.encryption.encrypt(api_keys.gemini_api_key)
        if api_keys.openai_api_key:
            encrypted.openai_api_key = self.encryption.encrypt(api_keys.openai_api_key)
        if api_keys.anthropic_api_key:
            encrypted.anthropic_api_key = self.encryption.encrypt(api_keys.anthropic_api_key)
        
        # Encrypt custom keys
        for key, value in api_keys.custom_api_keys.items():
            encrypted.custom_api_keys[key] = self.encryption.encrypt(value)
        
        return encrypted
    
    def _decrypt_api_keys(self, api_keys: Dict) -> APIKeyConfig:
        """Decrypt all API keys from storage"""
        decrypted = APIKeyConfig()
        
        if api_keys.get("gemini_api_key"):
            decrypted.gemini_api_key = self.encryption.decrypt(api_keys["gemini_api_key"])
        if api_keys.get("openai_api_key"):
            decrypted.openai_api_key = self.encryption.decrypt(api_keys["openai_api_key"])
        if api_keys.get("anthropic_api_key"):
            decrypted.anthropic_api_key = self.encryption.decrypt(api_keys["anthropic_api_key"])
        
        # Decrypt custom keys
        for key, value in api_keys.get("custom_api_keys", {}).items():
            decrypted.custom_api_keys[key] = self.encryption.decrypt(value)
        
        return decrypted
    
    def create_or_update(self, preferences: UserPreferences) -> str:
        """
        Create or update user preferences (upsert operation)
        API keys are automatically encrypted before storage
        """
        # Encrypt API keys before storage
        encrypted_prefs = preferences.copy(deep=True)
        encrypted_prefs.api_keys = self._encrypt_api_keys(preferences.api_keys)
        encrypted_prefs.updated_at = datetime.utcnow()
        
        # Upsert operation
        result = self.collection.update_one(
            {"user_id": preferences.user_id},
            {"$set": encrypted_prefs.to_dict()},
            upsert=True
        )
        
        if result.upserted_id:
            return str(result.upserted_id)
        
        # If updated, fetch the existing _id
        existing = self.collection.find_one({"user_id": preferences.user_id})
        return str(existing["_id"]) if existing else ""
    
    def get(self, user_id: str, decrypt_keys: bool = True) -> Optional[UserPreferences]:
        """
        Retrieve user preferences
        
        Args:
            user_id: User ID
            decrypt_keys: If True, decrypt API keys before returning
        
        Returns:
            UserPreferences object or None if not found
        """
        data = self.collection.find_one({"user_id": user_id})
        if not data:
            return None
        
        # Decrypt API keys if requested
        if decrypt_keys and "api_keys" in data:
            data["api_keys"] = self._decrypt_api_keys(data["api_keys"]).dict()
        
        return UserPreferences(**data)
    
    def update_theme(self, user_id: str, theme_updates: Dict) -> bool:
        """Update theme settings only"""
        result = self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    f"theme.{key}": value for key, value in theme_updates.items()
                } | {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    def update_model(self, user_id: str, model_updates: Dict) -> bool:
        """Update model settings only"""
        result = self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    f"model.{key}": value for key, value in model_updates.items()
                } | {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    def update_ui(self, user_id: str, ui_updates: Dict) -> bool:
        """Update UI settings only"""
        result = self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    f"ui.{key}": value for key, value in ui_updates.items()
                } | {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    def update_api_key(self, user_id: str, key_name: str, key_value: str) -> bool:
        """
        Update a single API key (encrypted)
        
        Args:
            user_id: User ID
            key_name: API key name (e.g., "gemini_api_key", "openai_api_key")
            key_value: Plaintext API key value
        """
        encrypted_value = self.encryption.encrypt(key_value)
        
        result = self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    f"api_keys.{key_name}": encrypted_value,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    def delete_api_key(self, user_id: str, key_name: str) -> bool:
        """Delete a specific API key"""
        result = self.collection.update_one(
            {"user_id": user_id},
            {
                "$unset": {f"api_keys.{key_name}": ""},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    def get_api_key(self, user_id: str, key_name: str) -> Optional[str]:
        """
        Get a specific decrypted API key
        
        Args:
            user_id: User ID
            key_name: API key name
        
        Returns:
            Decrypted API key or None
        """
        prefs = self.get(user_id, decrypt_keys=True)
        if not prefs:
            return None
        
        # Navigate to the key
        if key_name == "gemini_api_key":
            return prefs.api_keys.gemini_api_key
        elif key_name == "openai_api_key":
            return prefs.api_keys.openai_api_key
        elif key_name == "anthropic_api_key":
            return prefs.api_keys.anthropic_api_key
        else:
            return prefs.api_keys.custom_api_keys.get(key_name)
    
    def delete(self, user_id: str) -> bool:
        """Delete user preferences (e.g., on account deletion)"""
        result = self.collection.delete_one({"user_id": user_id})
        return result.deleted_count > 0
    
    def create_default_preferences(self, user_id: str) -> str:
        """Create default preferences for a new user"""
        default_prefs = UserPreferences(user_id=user_id)
        return self.create_or_update(default_prefs)


# Helper function to generate encryption key
def generate_encryption_key() -> str:
    """
    Generate a new encryption key for ENCRYPTION_KEY environment variable
    
    Usage:
        python -c 'from user_preferences_model import generate_encryption_key; print(generate_encryption_key())'
    """
    return Fernet.generate_key().decode()


if __name__ == "__main__":
    # Example: Generate encryption key
    print("Generate a new encryption key and set it as ENCRYPTION_KEY environment variable:")
    print(f"ENCRYPTION_KEY={generate_encryption_key()}")
