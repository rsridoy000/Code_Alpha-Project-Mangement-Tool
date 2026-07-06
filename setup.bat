@echo off
title CollabFlow - Project Management Tool Setup
color 0A
echo.
echo  ============================================================
echo   CollabFlow - Full Stack Project Management Tool
echo   Django REST API + React (Vite) Frontend
echo  ============================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python is not installed or not in PATH!
    echo  Please install Python from https://www.python.org/downloads/
    echo  Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH!
    echo  Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo  [1/4] Setting up Python Virtual Environment (venv)...
echo  --------------------------------------------------
cd backend

if not exist "venv" (
    echo  Creating virtual environment...
    python -m venv venv
    echo  Virtual environment created!
)

echo  Activating virtual environment and installing packages from requirements.txt...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo  Backend dependencies installed!

echo.
echo  [2/4] Running Database Migrations...
echo  --------------------------------------------------
python manage.py makemigrations
python manage.py migrate
echo  Migrations applied!

echo.
echo  [3/4] Seeding Demo Data (users, project, tasks)...
echo  --------------------------------------------------
python seed_db.py
echo  Demo data seeded!

echo.
echo  [4/4] Setting up React Frontend...
echo  --------------------------------------------------
cd ../frontend
call npm install
echo  Frontend dependencies installed!

echo.
echo  ============================================================
echo   Starting Servers and Opening Browser...
echo  ============================================================
echo.
echo   Backend URL:  http://127.0.0.1:8000
echo   Frontend URL: http://localhost:5173
echo.
echo   Demo Login Credentials:
echo   - Username: admin     Password: admin123
echo   - Username: john_doe  Password: john123
echo   - Username: jane_smith Password: jane123
echo.
echo  ============================================================
echo.

cd ..
:: Launch Backend Server
start "CollabFlow - Backend (Django API)" cmd /k "cd backend && call venv\Scripts\activate.bat && python manage.py runserver"

:: Wait 3 seconds for backend to start, then launch Frontend Server
timeout /t 3 /nobreak >nul
start "CollabFlow - Frontend (React)" cmd /k "cd frontend && npm run dev"

:: Open the browser immediately to the frontend website
timeout /t 1 /nobreak >nul
start http://localhost:5173

echo  All done! Website opened in browser.
echo  Press any key to exit this installer screen.
pause
