@echo off
TITLE EcoSync SIH Demo Launcher
echo ================================================================
echo    EcoSync: Government of India Digital Public Infrastructure
echo    SIH 100%% Offline Evaluation Stack (FastAPI + SQLite + React)
echo ================================================================
echo.

REM 1. Start FastAPI Backend in background
echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "EcoSync FastAPI Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

REM 2. Start Vite Frontend
echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
echo.
echo ================================================================
echo  * Interactive Swagger Docs: http://127.0.0.1:8000/docs
echo  * React Web Application:   http://localhost:5173
echo ================================================================
echo.

call npm.cmd run dev

pause
