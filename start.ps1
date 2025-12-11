# AI Educational Platform - Quick Start Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AI Educational Platform" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if port 8000 is available
$port = 8000
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "⚠️  Port 8000 is already in use. Trying port 8080..." -ForegroundColor Yellow
    $port = 8080
}

Write-Host "🚀 Starting server on port $port..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 Open your browser and go to:" -ForegroundColor Yellow
Write-Host "   http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Try these topics:" -ForegroundColor Yellow
Write-Host "   - linked list" -ForegroundColor White
Write-Host "   - binary tree" -ForegroundColor White
Write-Host "   - quick sort" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Start the server
python -m http.server $port
