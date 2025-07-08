@echo off
title MiniPoller Quick Start
echo.
echo ==========================================
echo   📊 MiniPoller Quick Start
echo ==========================================
echo.

:: Check if we're in the right directory
if not exist "backend\package.json" (
    echo ❌ Error: Please run this script from the MiniPoller root directory
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "backend\node_modules" (
    echo ❌ Dependencies not installed
    echo 💡 Please run install.bat first to install dependencies
    pause
    exit /b 1
)

echo 🚀 Starting MiniPoller...
cd backend
npm start

echo.
echo 👋 MiniPoller closed
pause
