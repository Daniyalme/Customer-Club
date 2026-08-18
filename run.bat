
@echo off
REM ─────────────────────────────────────────────────────────────
REM run.bat – start both the Python backend and React frontend
REM Place this file at the same level as your “backend” and “frontend” folders
REM ─────────────────────────────────────────────────────────────

REM Save current directory and ensure we’re in the script’s folder
pushd %~dp0

echo Starting Python backend...
start "Backend Server" cmd /k "cd backend && call python app.py"

echo Starting React frontend...
start "Frontend Dev" cmd /k "cd frontend/build && call python -m http.server 3000"

REM Wait a few seconds for the server to start
timeout /t 2 >nul

REM Open the prowser
start http://localhost:3000

REM Return to original directory
popd

exit /b
