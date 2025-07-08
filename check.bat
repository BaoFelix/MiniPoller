@echo off
title MiniPoller Environment Check
echo.
echo ==========================================
echo   🔍 MiniPoller Environment Check
echo ==========================================
echo.

echo 💻 System Information:
echo Computer Name: %COMPUTERNAME%
echo Username: %USERNAME%
echo Operating System: %OS%
echo.

echo 📁 Project Structure Check:
if exist "backend\package.json" (
    echo ✅ backend\package.json exists
) else (
    echo ❌ backend\package.json missing
)

if exist "frontend\index.html" (
    echo ✅ frontend\index.html exists
) else (
    echo ❌ frontend\index.html missing
)

if exist "backend\electronMain.js" (
    echo ✅ backend\electronMain.js exists
) else (
    echo ❌ backend\electronMain.js missing
)

if exist "backend\server.js" (
    echo ✅ backend\server.js exists
) else (
    echo ❌ backend\server.js missing
)

echo.
echo 🔧 Node.js Environment:
node --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo 📥 Download: https://nodejs.org/
) else (
    echo ✅ Node.js is installed:
    node --version
)

echo.
echo 📦 npm Environment:
npm --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm not found
) else (
    echo ✅ npm is installed:
    npm --version
    echo.
    echo Current registry:
    npm config get registry
)

echo.
echo 📚 Dependencies Status:
if exist "backend\node_modules" (
    echo ✅ node_modules installed
    echo.
    cd backend
    echo Core dependencies check:
    npm list electron --depth=0 2>nul | findstr electron
    npm list express --depth=0 2>nul | findstr express
    npm list socket.io --depth=0 2>nul | findstr socket.io
    cd ..
) else (
    echo ❌ node_modules not installed
    echo 💡 Please run install.bat to install dependencies
)

echo.
echo 🌐 Network Port:
netstat -an | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Port 3000 is already in use
) else (
    echo ✅ Port 3000 is available
)

echo.
echo ==========================================
echo   Check Complete
echo ==========================================
echo.
pause
