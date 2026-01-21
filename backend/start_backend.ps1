# WattWise Backend Startup Script
# Runs with system Python (no venv)

Write-Host "Starting WattWise Backend Server..." -ForegroundColor Cyan

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
