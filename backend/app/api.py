from __future__ import annotations
from typing import Optional, Literal
import os
import jwt
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Add backend directory to sys.path to allow imports from database
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from database.config import db_connection
from database.operations import (
    create_user,
    authenticate_user,
    save_educational_content,
    get_user_educational_content,
    get_or_create_oauth_user,
    create_user_session,
    validate_session,
    invalidate_session,
    get_user_by_id,
    # Module 7A: Library operations
    save_prompt,
    get_user_saved_prompts,
    update_saved_prompt,
    delete_saved_prompt,
    increment_prompt_view,
    # Module 7B: User preferences operations
    get_user_preferences,
    update_user_preferences,
    save_api_key,
    get_api_key,
    delete_chat_session,
    save_chat_message,
    get_user_chat_history,
)
from database.setup import verify_setup

from orchestrator import MasterOrchestrator

app = FastAPI(title="UniVerse AI API", version="1.0.0")

# ============= APPLICATION LIFECYCLE EVENTS =============

@app.on_event("startup")
async def startup_event():
    """Verify database connection on application startup"""
    from database.config import db_connection, logger
    logger.info("🚀 Starting UniVerse AI API...")
    
    health = db_connection.health_check()
    if health.get("connected"):
        logger.info("✅ Database connection verified on startup")
        logger.info(f"📊 Collections available: {', '.join(health.get('collections', []))}")
    else:
        logger.error("❌ Database connection failed on startup")
        logger.error("⚠️  Application will continue but database operations will fail")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection gracefully on application shutdown"""
    from database.config import db_connection, logger
    logger.info("🛑 Shutting down UniVerse AI API...")
    db_connection.close()
    logger.info("👋 Shutdown complete")

# Get allowed origins from environment variable
allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '*')
if allowed_origins_env == '*':
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(',')]

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str
    audience: Literal["beginner", "intermediate", "advanced"] = "beginner"
    make_demo: bool = False
    project_name: Optional[str] = None
    duration: int = 45

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class SaveContentRequest(BaseModel):
    topic: str
    content: str
    diagram_data: Optional[str] = None
    audio_script: str

class GoogleLoginRequest(BaseModel):
    credential: str

class ChatSaveRequest(BaseModel):
    session_id: str
    role: str
    content: str
    model: Optional[str] = "grok-4-latest"  # Grok default model

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: Optional[str] = "grok-4-latest"  # Grok default model
    messages: list[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 2048

# ============= CHAT COMPLETIONS API ENDPOINT =============

@app.post("/api/chat/completions")
def chat_completions(req: ChatCompletionRequest):
    """Proxy endpoint for chat completions using Grok API"""
    from agents import MCGAgent
    
    try:
        agent = MCGAgent()
        
        # Convert messages to the format expected by generate_chat_response
        messages = [{"role": msg.role, "content": msg.content} for msg in req.messages]
        
        # Call the agent's chat method
        response_content = agent.generate_chat_response(
            messages=messages,
            temperature=req.temperature
        )
        
        # Return in OpenAI-compatible format
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": response_content
                    },
                    "finish_reason": "stop"
                }
            ],
            "model": req.model,
            "usage": {
                "prompt_tokens": 0,  # Not tracked
                "completion_tokens": 0,  # Not tracked
                "total_tokens": 0
            }
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Chat completions error: {error_details}")
        return JSONResponse(
            content={"error": f"Failed to generate response: {str(e)}"},
            status_code=500
        )


# ============= MODULE 7A: LIBRARY API MODELS =============

class SavePromptRequest(BaseModel):
    title: str
    content: str
    description: Optional[str] = None
    category: str = "general"
    tags: Optional[list[str]] = None
    is_public: bool = False
    model_preference: Optional[str] = None
    temperature: Optional[float] = None

class UpdatePromptRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    is_favorite: Optional[bool] = None
    is_public: Optional[bool] = None
    model_preference: Optional[str] = None
    temperature: Optional[float] = None

# ============= MODULE 7B: USER PREFERENCES API MODELS =============

class UpdatePreferencesRequest(BaseModel):
    theme: Optional[dict] = None
    model: Optional[dict] = None
    ui: Optional[dict] = None
    profile: Optional[dict] = None

class SaveAPIKeyRequest(BaseModel):
    key_name: str
    key_value: str

# ==============MODULE 7C: PROJECTS API MODELS =============

class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "planning"  # planning, in-progress, completed, on-hold
    priority: Optional[str] = "medium"  # low, medium, high, urgent
    technology: Optional[str] = None
    deadline: Optional[str] = None
    tags: Optional[str] = None
    notes: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)


@app.post("/api/p2/generate")
def generate(req: GenerateRequest):
    orchestrator = MasterOrchestrator()
    result = orchestrator.run(
        prompt=req.prompt,
        audience=req.audience,
        make_demo=req.make_demo,
        project_name=req.project_name,
        demo_duration_sec=req.duration,
    )
    return result.model_dump()


# New endpoints for frontend content generation (moved from client-side)
class GenerateTextRequest(BaseModel):
    topic: str

class GenerateAudioScriptRequest(BaseModel):
    topic: str

@app.post("/api/generate/text")
def generate_text(req: GenerateTextRequest):
    """Generate educational text content using Gemini API"""
    from agents import MCGAgent
    
    try:
        agent = MCGAgent()
        prompt = f"""Create educational content about "{req.topic}" in the following format:

Title: [Create an engaging title]

## Overview
[Brief introduction in 2-3 sentences]

## Key Concepts
- [Point 1]
- [Point 2]
- [Point 3]
- [Point 4]

## How It Works
[Concise explanation in 2-3 sentences]

## Common Use Cases
- [Use case 1]
- [Use case 2]
- [Use case 3]

Keep it concise and educational."""
        
        content = agent._call_grok(prompt)
        return {"content": content}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/generate/audio-script")
def generate_audio_script(req: GenerateAudioScriptRequest):
    """Generate audio script using Gemini API"""
    from agents import MCGAgent
    
    try:
        agent = MCGAgent()
        prompt = f'Create a brief audio script (under 200 words) explaining "{req.topic}" in simple, clear terms for voice narration. Make it educational and engaging.'
        
        script = agent._call_grok(prompt)
        return {"script": script}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

def make_token(user_id: str):
    payload = {"uid": user_id, "exp": datetime.utcnow() + timedelta(hours=24)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def get_user_id(auth: Optional[str]) -> Optional[str]:
    if not auth:
        return None
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    try:
        data = jwt.decode(parts[1], JWT_SECRET, algorithms=["HS256"])
        return data.get("uid")
    except Exception:
        return None

@app.get("/api/db/health")
def db_health():
    """Enhanced database health check with connection pool statistics"""
    return db_connection.health_check()

@app.get("/api/db/verify")
def db_verify():
    ok = verify_setup()
    return {"ok": ok}

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    user_id = create_user(req.email, req.password, req.full_name)
    if not user_id:
        return {"error": "exists"}
    token = make_token(user_id)
    # Persist session to MongoDB
    create_user_session(user_id, token)
    return {"token": token, "user_id": user_id}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = authenticate_user(req.email, req.password)
    if not user:
        return {"error": "invalid"}
    uid = str(user.get("_id"))
    token = make_token(uid)
    # Persist session to MongoDB
    create_user_session(uid, token)
    return {"token": token, "user_id": uid}

@app.post("/api/auth/google")
def google_login(req: GoogleLoginRequest):
    try:
        if not GOOGLE_CLIENT_ID:
            return {"error": "google_client_id_missing"}
        idinfo = id_token.verify_oauth2_token(req.credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo.get("email")
        name = idinfo.get("name") or idinfo.get("given_name")
        if not email:
            return {"error": "invalid_google_token"}
        user_id = get_or_create_oauth_user(email, name, provider='google')
        token = make_token(user_id)
        # Persist session to MongoDB
        create_user_session(user_id, token)
        return {"token": token, "user_id": user_id}
    except Exception:
        return {"error": "invalid_google_token"}

@app.get("/api/auth/validate")
def validate_auth_session(authorization: Optional[str] = Header(None)):
    """Validate session token and return user info"""
    if not authorization:
        return JSONResponse(status_code=401, content={"valid": False, "error": "missing_token"})
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return JSONResponse(status_code=401, content={"valid": False, "error": "invalid_header"})
        
    token = parts[1]
    
    # 1. Check JWT signature (fast check)
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(status_code=401, content={"valid": False, "error": "invalid_jwt"})
        
    # 2. Check Database Session (authoritative check)
    session = validate_session(token)
    if not session:
        return JSONResponse(status_code=401, content={"valid": False, "error": "session_expired"})
        
    if str(session["user_id"]) != uid:
         return JSONResponse(status_code=401, content={"valid": False, "error": "token_mismatch"})

    # 3. Get User Details
    user = get_user_by_id(uid)
    if not user:
        return JSONResponse(status_code=401, content={"valid": False, "error": "user_not_found"})
        
    return {
        "valid": True,
        "user_id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name"),
        "subscription_tier": user.get("subscription_tier", "free")
    }

@app.post("/api/auth/logout")
def logout_endpoint(authorization: Optional[str] = Header(None)):
    """Logout user by invalidating session"""
    if not authorization:
        return JSONResponse(status_code=400, content={"success": False, "error": "missing_header"})
        
    parts = authorization.split()
    if len(parts) != 2:
        return JSONResponse(status_code=400, content={"success": False, "error": "invalid_header"})
        
    token = parts[1]
    
    # Invalidate in DB
    success = invalidate_session(token)
    return {"success": success}

@app.post("/api/library/save")
def library_save(req: SaveContentRequest, authorization: Optional[str] = Header(None)):
    uid = get_user_id(authorization)
    content_id = save_educational_content(uid, req.topic, req.content, req.diagram_data, req.audio_script)
    return {"id": content_id}

@app.get("/api/library/list")
def library_list(limit: int = 50, skip: int = 0, authorization: Optional[str] = Header(None)):
    uid = get_user_id(authorization)
    if not uid:
        return {"items": []}
    items = get_user_educational_content(uid, limit=limit, skip=skip)
    for i in items:
        i["_id"] = str(i["_id"])
        if i.get("user_id") is not None:
            i["user_id"] = str(i["user_id"])
    return {"items": items}

# ============= CHAT HISTORY ENDPOINTS =============

@app.post("/api/chat/save")
def chat_save(req: ChatSaveRequest, authorization: Optional[str] = Header(None)):
    """Save a chat message to history"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    from database.operations import save_chat_message
    
    success = save_chat_message(
        user_id=uid,
        session_id=req.session_id,
        role=req.role,
        content=req.content,
        model_used=req.model
    )
    
    return {"success": success}

@app.delete("/api/chat/history/{session_id}")
def delete_chat_history_endpoint(session_id: str, authorization: Optional[str] = Header(None)):
    """Delete a chat session"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(status_code=401, content={"error": "unauthorized"})
    
    success = delete_chat_session(session_id, uid)
    if not success:
        return JSONResponse(status_code=404, content={"error": "not_found"})
    return {"success": True}

@app.get("/api/chat/history")
def chat_history(limit: int = 50, skip: int = 0, authorization: Optional[str] = Header(None)):
    """Get user's chat history"""
    uid = get_user_id(authorization)
    if not uid:
        return {"history": []}
        
    from database.operations import get_user_chat_history
    
    chats = get_user_chat_history(uid, limit=limit, skip=skip)
    
    # Format ObjectId for JSON response
    formatted_chats = []
    for chat in chats:
        chat["_id"] = str(chat["_id"])
        chat["user_id"] = str(chat["user_id"])
        # Ensure ID is available as 'id' for frontend compatibility if needed, 
        # though frontend uses 'session_id' mostly.
        # Frontend expects: {id: session_id, title:..., messages:..., timestamp:...}
        formatted_chats.append({
            "id": chat["session_id"],
            "title": chat.get("title", "New Chat"),
            "messages": chat.get("messages", []),
            "timestamp": chat.get("updated_at", datetime.utcnow()).timestamp() * 1000
        })
        
    return {"history": formatted_chats}
    


# ============= MODULE 7A: LIBRARY API ROUTES =============

@app.post("/api/library/save-prompt")
def save_prompt_endpoint(req: SavePromptRequest, authorization: Optional[str] = Header(None)):
    """Save a new prompt to user's library"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    # Validate required fields
    if not req.title or not req.content:
        return JSONResponse(content={"error": "title and content are required"}, status_code=400)
    
    prompt_id = save_prompt(
        user_id=uid,
        title=req.title,
        content=req.content,
        description=req.description,
        category=req.category,
        tags=req.tags or [],
        is_public=req.is_public,
        model_preference=req.model_preference,
        temperature=req.temperature
    )
    
    if not prompt_id:
        return JSONResponse(content={"error": "failed to save prompt"}, status_code=500)
    
    return JSONResponse(content={"id": prompt_id, "success": True}, status_code=201)

@app.get("/api/library/prompts")
def get_prompts_endpoint(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0,
    authorization: Optional[str] = Header(None)
):
    """Get user's saved prompts with filtering"""
    uid = get_user_id(authorization)
    if not uid:
        # Return empty list for unauthenticated users
        return {"prompts": [], "total": 0}
    
    prompts = get_user_saved_prompts(
        user_id=uid,
        category=category,
        tag=tag,
        search=search,
        is_favorite=is_favorite,
        limit=limit,
        skip=skip
    )
    
    # Format ObjectIds for JSON response
    formatted_prompts = []
    for prompt in prompts:
        prompt["_id"] = str(prompt["_id"])
        prompt["user_id"] = str(prompt["user_id"])
        formatted_prompts.append(prompt)
    
    return {"prompts": formatted_prompts, "total": len(formatted_prompts)}

@app.put("/api/library/prompts/{prompt_id}")
def update_prompt_endpoint(prompt_id: str, req: UpdatePromptRequest, authorization: Optional[str] = Header(None)):
    """Update a saved prompt"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    # Build updates dict from request (only include provided fields)
    updates = {}
    if req.title is not None:
        updates["title"] = req.title
    if req.content is not None:
        updates["content"] = req.content
    if req.description is not None:
        updates["description"] = req.description
    if req.category is not None:
        updates["category"] = req.category
    if req.tags is not None:
        updates["tags"] = req.tags
    if req.is_favorite is not None:
        updates["is_favorite"] = req.is_favorite
    if req.is_public is not None:
        updates["is_public"] = req.is_public
    if req.model_preference is not None:
        updates["model_preference"] = req.model_preference
    if req.temperature is not None:
        updates["temperature"] = req.temperature
    
    if not updates:
        return JSONResponse(content={"error": "no fields to update"}, status_code=400)
    
    success = update_saved_prompt(prompt_id=prompt_id, user_id=uid, updates=updates)
    
    if not success:
        return JSONResponse(content={"error": "prompt not found or update failed"}, status_code=404)
    
    return {"success": True, "updated": True}

@app.delete("/api/library/prompts/{prompt_id}")
def delete_prompt_endpoint(prompt_id: str, authorization: Optional[str] = Header(None)):
    """Delete a saved prompt"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    success = delete_saved_prompt(prompt_id=prompt_id, user_id=uid)
    
    if not success:
        return JSONResponse(content={"error": "prompt not found or delete failed"}, status_code=404)
    
    return {"success": True, "deleted": True}

@app.post("/api/library/prompts/{prompt_id}/view")
def increment_prompt_view_endpoint(prompt_id: str):
    """Increment view/usage count for a prompt"""
    success = increment_prompt_view(prompt_id=prompt_id)
    
    if not success:
        return JSONResponse(content={"error": "prompt not found"}, status_code=404)
    
    # Get updated usage count
    from database.operations import get_saved_prompts_collection
    from bson import ObjectId
    
    prompts = get_saved_prompts_collection()
    prompt = prompts.find_one({"_id": ObjectId(prompt_id)})
    
    usage_count = prompt.get("usage_count", 0) if prompt else 0
    
    return {"success": True, "usage_count": usage_count}

# ============= MODULE 7B: USER PREFERENCES API ROUTES =============

@app.get("/api/user/preferences")
def get_preferences_endpoint(authorization: Optional[str] = Header(None)):
    """Get user preferences"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    prefs = get_user_preferences(user_id=uid)
    
    # Format ObjectId and remove sensitive data
    if prefs.get("_id"):
        prefs["_id"] = str(prefs["_id"])
    if prefs.get("user_id"):
        prefs["user_id"] = str(prefs["user_id"])
    
    # Remove encrypted API keys from response for security
    prefs.pop("api_keys", None)
    
    return prefs

@app.put("/api/user/preferences")
def update_preferences_endpoint(req: UpdatePreferencesRequest, authorization: Optional[str] = Header(None)):
    """Update user preferences"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    # Build updates dict
    updates = {}
    if req.theme is not None:
        updates["theme"] = req.theme
    if req.model is not None:
        updates["model"] = req.model
    if req.ui is not None:
        updates["ui"] = req.ui
    if req.profile is not None:
        updates["profile"] = req.profile
    
    if not updates:
        return JSONResponse(content={"error": "no fields to update"}, status_code=400)
    
    success = update_user_preferences(user_id=uid, preferences=updates)
    
    if not success:
        return JSONResponse(content={"error": "failed to update preferences"}, status_code=500)
    
    # Return updated preferences
    prefs = get_user_preferences(user_id=uid)
    if prefs.get("_id"):
        prefs["_id"] = str(prefs["_id"])
    if prefs.get("user_id"):
        prefs["user_id"] = str(prefs["user_id"])
    prefs.pop("api_keys", None)
    
    return {"success": True, "preferences": prefs}

@app.post("/api/user/preferences/api-key")
def save_api_key_endpoint(req: SaveAPIKeyRequest, authorization: Optional[str] = Header(None)):
    """Save an encrypted API key"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    # Validate inputs
    if not req.key_name or not req.key_value:
        return JSONResponse(content={"error": "key_name and key_value are required"}, status_code=400)
    
    success = save_api_key(user_id=uid, key_name=req.key_name, key_value=req.key_value)
    
    if not success:
        return JSONResponse(content={"error": "failed to save API key"}, status_code=500)
    
    return JSONResponse(content={"success": True, "key_name": req.key_name}, status_code=201)

@app.get("/api/user/preferences/api-key/{key_name}")
def get_api_key_endpoint(key_name: str, authorization: Optional[str] = Header(None)):
    """Get API key info (returns masked value for security)"""
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    decrypted_key = get_api_key(user_id=uid, key_name=key_name)
    
    if not decrypted_key:
        return JSONResponse(content={"error": "API key not found"}, status_code=404)
    
    # Return masked value for security (first 4 chars + ***)
    masked_value = decrypted_key[:4] + "***" if len(decrypted_key) > 4 else "***"
    
    return {
        "key_name": key_name,
        "exists": True,
        "masked_value": masked_value
    }

# ============= STATIC FILE SERVING =============
# Serve static files (HTML, CSS, JS, images) from the root directory
# This allows Railway to host both frontend and backend together

# Get the frontend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"

# Mount static files for assets (CSS, JS, images)
app.mount("/static", StaticFiles(directory=BASE_DIR, html=True), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serve the main index.html page"""
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return HTMLResponse(content="<h1>UniVerse AI</h1><p>API is running. Frontend files not found.</p>")

# ============= MODULE 8: PROJECTS API =============

@app.get("/api/projects")
def get_projects(authorization: Optional[str] = Header(None)):
    """Get all projects for the authenticated user"""
    from database.operations import get_db
    
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    try:
        db = get_db()
        projects_collection = db['projects']
        
        projects = list(projects_collection.find({"user_id": ObjectId(uid)}))
        
        # Convert ObjectId to string
        for project in projects:
            project['_id'] = str(project['_id'])
            project['user_id'] = str(project['user_id'])
        
        return {"projects": projects}
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return JSONResponse(content={"error": "failed to fetch projects"}, status_code=500)

@app.get("/api/projects/{project_id}")
def get_project(project_id: str, authorization: Optional[str] = Header(None)):
    """Get a single project by ID"""
    from database.operations import get_db
    
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    try:
        db = get_db()
        projects_collection = db['projects']
        
        project = projects_collection.find_one({
            "_id": ObjectId(project_id),
            "user_id": ObjectId(uid)
        })
        
        if not project:
            return JSONResponse(content={"error": "project not found"}, status_code=404)
        
        project['_id'] = str(project['_id'])
        project['user_id'] = str(project['user_id'])
        
        return {"project": project}
    except Exception as e:
        print(f"Error fetching project: {e}")
        return JSONResponse(content={"error": "failed to fetch project"}, status_code=500)

@app.post("/api/projects")
def create_project(req: CreateProjectRequest, authorization: Optional[str] = Header(None)):
    """Create a new project"""
    from database.operations import get_db
    from datetime import datetime
    
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    if not req.name:
        return JSONResponse(content={"error": "name is required"}, status_code=400)
    
    try:
        db = get_db()
        projects_collection = db['projects']
        
        project_data = {
            "user_id": ObjectId(uid),
            "name": req.name.strip(),
            "description": req.description.strip() if req.description else None,
            "status": req.status or "planning",
            "priority": req.priority or "medium",
            "technology": req.technology.strip() if req.technology else None,
            "deadline": req.deadline,
            "tags": req.tags.strip() if req.tags else None,
            "notes": req.notes.strip() if req.notes else None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = projects_collection.insert_one(project_data)
        
        project_data['_id'] = str(result.inserted_id)
        project_data['user_id'] = str(project_data['user_id'])
        project_data['created_at'] = project_data['created_at'].isoformat()
        project_data['updated_at'] = project_data['updated_at'].isoformat()
        
        return {"success": True, "project": project_data}
    except Exception as e:
        print(f"Error creating project: {e}")
        return JSONResponse(content={"error": "failed to create project"}, status_code=500)

@app.put("/api/projects/{project_id}")
def update_project(project_id: str, req: CreateProjectRequest, authorization: Optional[str] = Header(None)):
    """Update an existing project"""
    from database.operations import get_db
    from datetime import datetime
    
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    try:
        db = get_db()
        projects_collection = db['projects']
        
        # Check if project exists and belongs to user
        existing = projects_collection.find_one({
            "_id": ObjectId(project_id),
            "user_id": ObjectId(uid)
        })
        
        if not existing:
            return JSONResponse(content={"error": "project not found"}, status_code=404)
        
        update_data = {
            "name": req.name.strip(),
            "description": req.description.strip() if req.description else None,
            "status": req.status or "planning",
            "priority": req.priority or "medium",
            "technology": req.technology.strip() if req.technology else None,
            "deadline": req.deadline,
            "tags": req.tags.strip() if req.tags else None,
            "notes": req.notes.strip() if req.notes else None,
            "updated_at": datetime.utcnow()
        }
        
        projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
        
        updated_project = projects_collection.find_one({"_id": ObjectId(project_id)})
        updated_project['_id'] = str(updated_project['_id'])
        updated_project['user_id'] = str(updated_project['user_id'])
        
        return {"success": True, "project": updated_project}
    except Exception as e:
        print(f"Error updating project: {e}")
        return JSONResponse(content={"error": "failed to update project"}, status_code=500)

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, authorization: Optional[str] = Header(None)):
    """Delete a project"""
    from database.operations import get_db
    
    uid = get_user_id(authorization)
    if not uid:
        return JSONResponse(content={"error": "unauthorized"}, status_code=401)
    
    try:
        db = get_db()
        projects_collection = db['projects']
        
        result = projects_collection.delete_one({
            "_id": ObjectId(project_id),
            "user_id": ObjectId(uid)
        })
        
        if result.deleted_count == 0:
            return JSONResponse(content={"error": "project not found"}, status_code=404)
        
        return {"success": True}
    except Exception as e:
        print(f"Error deleting project: {e}")
        return JSONResponse(content={"error": "failed to delete project"}, status_code=500)


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_static_files(full_path: str):
    """Serve static HTML files and handle SPA routing"""
    # List of HTML pages
    html_pages = [
        "index.html", "chat.html", "auth.html", "about.html", 
        "docs.html", "library.html", "projects.html", 
        "privacy.html", "terms.html"
    ]
    
    # If requesting a specific HTML page
    if full_path in html_pages or full_path.endswith('.html'):
        file_path = BASE_DIR / full_path
        if file_path.exists():
            return FileResponse(file_path)
    
    # If requesting other static files (CSS, JS, images)
    file_path = BASE_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # For unknown routes, return 404 or serve index.html (SPA behavior)
    # Return index.html for SPA routing
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    return HTMLResponse(content="<h1>404 - Not Found</h1>", status_code=404)
