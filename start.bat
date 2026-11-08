@echo off
REM Quick Start Script for Messenger App (Windows)
echo Starting Messenger App...

REM Check if dependencies are installed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting servers...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.

REM Start both servers in new windows
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm start"

echo Both servers are starting in separate windows!
pause
