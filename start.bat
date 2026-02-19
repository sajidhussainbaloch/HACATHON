@echo off
title RealityCheck AI
echo ============================================
echo    RealityCheck AI — Starting servers...
echo ============================================
echo.

:: Kill any existing python/node processes on our ports
echo Stopping old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start backend
echo [1/2] Starting Backend (FastAPI) on port 8000...
cd /d "%~dp0backend"
start "RealityCheck Backend" cmd /k "python main.py"

:: Wait for backend to boot
timeout /t 4 /nobreak >nul

:: Start frontend
echo [2/2] Starting Frontend (Vite) on port 3000...
cd /d "%~dp0frontend"
start "RealityCheck Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo    Both servers are starting!
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3000
echo    Network:  http://192.168.100.9:3000
echo    API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo Close this window or press any key to exit.
pause >nul
