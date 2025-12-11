from __future__ import annotations
from typing import Optional, Literal
import os
import jwt
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse, HTMLResponse
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
)
from database.setup import verify_setup

from orchestrator import MasterOrchestrator

app = FastAPI(title="UniVerse AI API", version="1.0.0")

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
    try:
        db_connection.client.admin.command("ping")
        cols = db_connection.db.list_collection_names()
        return {"connected": True, "collections": cols}
    except Exception:
        return {"connected": False}

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
    return {"token": token, "user_id": user_id}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = authenticate_user(req.email, req.password)
    if not user:
        return {"error": "invalid"}
    uid = str(user.get("_id"))
    token = make_token(uid)
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
        return {"token": token, "user_id": user_id}
    except Exception:
        return {"error": "invalid_google_token"}

@app.post("/api/library/save")
def library_save(req: SaveContentRequest, authorization: Optional[str] = None):
    uid = get_user_id(authorization)
    content_id = save_educational_content(uid, req.topic, req.content, req.diagram_data, req.audio_script)
    return {"id": content_id}

@app.get("/api/library/list")
def library_list(limit: int = 50, authorization: Optional[str] = None):
    uid = get_user_id(authorization)
    if not uid:
        return {"items": []}
    items = get_user_educational_content(uid, limit=limit)
    for i in items:
        i["_id"] = str(i["_id"])
        if i.get("user_id") is not None:
            i["user_id"] = str(i["user_id"])
    return {"items": items}

# ============= STATIC FILE SERVING =============
# Serve static files (HTML, CSS, JS, images) from the root directory
# This allows Railway to host both frontend and backend together

# Get the current directory
BASE_DIR = Path(__file__).resolve().parent

# Mount static files for assets (CSS, JS, images)
app.mount("/static", StaticFiles(directory=BASE_DIR, html=True), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serve the main index.html page"""
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return HTMLResponse(content="<h1>UniVerse AI</h1><p>API is running. Frontend files not found.</p>")

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
