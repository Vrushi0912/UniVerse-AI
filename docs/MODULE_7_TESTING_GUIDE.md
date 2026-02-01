# Module 7 API Testing - Quick Reference

This file provides ready-to-use HTTP requests for testing all Module 7 endpoints.

## Prerequisites

1. Start the server: `uvicorn api:app --reload --port 8000`
2. Get authentication token (replace with your credentials):

```http
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

3. Copy the token from response and use in subsequent requests

---

## Module 7A: Library API Tests

### 1. Save a Prompt
```http
POST http://localhost:8000/api/library/save-prompt
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Code Review Prompt",
  "content": "Review this code for best practices, security vulnerabilities, and performance issues.",
  "description": "General purpose code review template",
  "category": "coding",
  "tags": ["code-review", "best-practices", "security"],
  "is_public": false,
  "model_preference": "gemini-pro",
  "temperature": 0.7
}
```

Expected Response (201 Created):
```json
{
  "id": "prompt_id_here",
  "success": true
}
```

---

### 2. Get All Prompts
```http
GET http://localhost:8000/api/library/prompts?limit=20
Authorization: Bearer YOUR_TOKEN_HERE
```

Expected Response (200 OK):
```json
{
  "prompts": [...],
  "total": 1
}
```

---

### 3. Get Prompts by Category
```http
GET http://localhost:8000/api/library/prompts?category=coding&limit=10
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 4. Search Prompts
```http
GET http://localhost:8000/api/library/prompts?search=code+review
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 5. Get Favorite Prompts
```http
GET http://localhost:8000/api/library/prompts?is_favorite=true
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 6. Update a Prompt
```http
PUT http://localhost:8000/api/library/prompts/PROMPT_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Updated Code Review Prompt",
  "is_favorite": true,
  "tags": ["code-review", "updated"]
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "updated": true
}
```

---

### 7. Delete a Prompt
```http
DELETE http://localhost:8000/api/library/prompts/PROMPT_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

Expected Response (200 OK):
```json
{
  "success": true,
  "deleted": true
}
```

---

### 8. Increment Prompt View Count
```http
POST http://localhost:8000/api/library/prompts/PROMPT_ID_HERE/view
```

Expected Response (200 OK):
```json
{
  "success": true,
  "usage_count": 1
}
```

---

## Module 7B: User Preferences API Tests

### 1. Get User Preferences
```http
GET http://localhost:8000/api/user/preferences
Authorization: Bearer YOUR_TOKEN_HERE
```

Expected Response (200 OK):
```json
{
  "_id": "...",
  "user_id": "...",
  "theme": {
    "mode": "dark"
  },
  "model": {
    "default_model": "gemini-pro"
  },
  "ui": {}
}
```

---

### 2. Update Theme Preferences
```http
PUT http://localhost:8000/api/user/preferences
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "theme": {
    "mode": "light",
    "primary_color": "#8b5cf6"
  }
}
```

Expected Response (200 OK):
```json
{
  "success": true,
  "preferences": {
    "theme": {
      "mode": "light",
      "primary_color": "#8b5cf6"
    },
    ...
  }
}
```

---

### 3. Update Model Preferences
```http
PUT http://localhost:8000/api/user/preferences
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "model": {
    "default_model": "gemini-1.5-pro",
    "default_temperature": 0.5,
    "stream_responses": true
  }
}
```

---

### 4. Update UI Preferences
```http
PUT http://localhost:8000/api/user/preferences
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "ui": {
    "show_welcome_message": false,
    "enable_animations": true,
    "sidebar_position": "left"
  }
}
```

---

### 5. Save API Key (Encrypted)
```http
POST http://localhost:8000/api/user/preferences/api-key
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "key_name": "gemini_api_key",
  "key_value": "AIzaSy..."
}
```

Expected Response (201 Created):
```json
{
  "success": true,
  "key_name": "gemini_api_key"
}
```

---

### 6. Get API Key Info (Masked)
```http
GET http://localhost:8000/api/user/preferences/api-key/gemini_api_key
Authorization: Bearer YOUR_TOKEN_HERE
```

Expected Response (200 OK):
```json
{
  "key_name": "gemini_api_key",
  "exists": true,
  "masked_value": "AIza***"
}
```

---

## Error Testing

### Test Unauthorized Access (No Token)
```http
GET http://localhost:8000/api/library/prompts
```

Expected Response (401):
```json
{
  "error": "unauthorized"
}
```

---

### Test Unauthorized Access (Invalid Token)
```http
GET http://localhost:8000/api/library/prompts
Authorization: Bearer invalid_token_here
```

Expected Response (401):
```json
{
  "error": "unauthorized"
}
```

---

### Test Missing Required Fields
```http
POST http://localhost:8000/api/library/save-prompt
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "description": "Missing title and content"
}
```

Expected Response (400):
```json
{
  "error": "title and content are required"
}
```

---

### Test Non-Existent Resource
```http
GET http://localhost:8000/api/library/prompts/invalid_id_here
Authorization: Bearer YOUR_TOKEN_HERE
```

Expected Response (404):
```json
{
  "error": "prompt not found or update failed"
}
```

---

## Testing with cURL

If you prefer cURL, here are some examples:

### Save Prompt
```bash
curl -X POST http://localhost:8000/api/library/save-prompt \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Prompt",
    "content": "This is a test prompt",
    "category": "general"
  }'
```

### Get Prompts
```bash
curl -X GET http://localhost:8000/api/library/prompts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Preferences
```bash
curl -X PUT http://localhost:8000/api/user/preferences \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": {
      "mode": "dark"
    }
  }'
```

---

## Notes

- Replace `YOUR_TOKEN_HERE` with actual JWT token from login
- Replace `PROMPT_ID_HERE` with actual prompt ID from save/get responses
- All timestamps are in UTC
- API keys are encrypted before storage using Fernet encryption
- Masked API keys show first 4 characters + "***" for security
