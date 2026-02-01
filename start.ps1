# AI Educational Platform - Startup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   UniVerse AI - Backend Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Uvicorn Server
Write-Host "🚀 Starting FastAPI backend on http://localhost:8000..." -ForegroundColor Green

# Try 'python' first, fallback to 'py' if needed, or just use 'py' which is safer on Windows often
# We will just use 'py' as it worked in tests
# Open the frontend in the default browser
Start-Process "$PSScriptRoot\frontend\index.html"

# Navigate to backend app directory
Set-Location "$PSScriptRoot\backend\app"

# Start Uvicorn Server
py -m uvicorn api:app --reload --host 0.0.0.0 --port 8000
