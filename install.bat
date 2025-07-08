@echo off
title MiniPoller GitHub Installation
color 0A
cls
echo.
echo ==========================================
echo   📊 MiniPoller GitHub Auto Installer
echo ==========================================
echo.
echo 🚀 Checking system environment...

:: Check if we're in the right directory
if not exist "backend\package.json" (
    echo ❌ Error: backend\package.json not found
    echo 💡 Please ensure you're running this script from the MiniPoller root directory
    echo.
    pause
    exit /b 1
)

:: Check Node.js installation
echo 🔍 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo.
    echo 📥 Please install Node.js first:
    echo    https://nodejs.org/
    echo    Recommended version: LTS 18.x or 20.x
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
    for /f "tokens=*" %%i in ('node --version') do echo    Version: %%i
)

:: Check npm
echo 🔍 Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found
    pause
    exit /b 1
) else (
    echo ✅ npm is installed
    for /f "tokens=*" %%i in ('npm --version') do echo    Version: %%i
)

echo.
echo 🌐 Configuring npm registry...
echo.
echo Choose npm registry:
echo 1. Official registry (default, recommended for international users)
echo 2. Taobao mirror (recommended for Chinese users)
echo 3. Skip configuration
echo.
set /p mirror_choice="Please choose (1-3, default 1): "

if "%mirror_choice%"=="" set mirror_choice=1

if "%mirror_choice%"=="2" (
    echo 🇨🇳 Setting Taobao mirror...
    npm config set registry https://registry.npmmirror.com/
    echo ✅ Set to Taobao mirror
) else if "%mirror_choice%"=="1" (
    echo 🌍 Using official registry...
    npm config set registry https://registry.npmjs.org/
    echo ✅ Set to official registry
) else (
    echo ⏭️ Skipping registry configuration
)

echo.
echo 📁 Entering backend directory...
cd backend

echo.
echo 🧹 Cleaning old installation files...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo 📦 Installing dependencies...
echo 💡 This may take a few minutes, please wait...
echo.

npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ Dependencies installation failed!
    echo.
    echo 🔧 Possible solutions:
    echo 1. Check your internet connection
    echo 2. Run this script as administrator
    echo 3. Try using a different npm registry
    echo 4. Clear npm cache: npm cache clean --force
    echo.
    echo 🌐 Current registry:
    npm config get registry
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.
echo 🔍 Verifying installation...

:: Verify key dependencies
echo Checking key dependencies...
npm list electron --depth=0 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Electron is installed
) else (
    echo ⚠️ Electron installation may have issues
)

npm list express --depth=0 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Express is installed
) else (
    echo ⚠️ Express installation may have issues
)

npm list uiohook-napi --depth=0 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ uiohook-napi is installed
) else (
    echo ⚠️ uiohook-napi installation may have issues (may affect global text capture)
)

echo.
echo ==========================================
echo   🎉 Installation Complete!
echo ==========================================
echo.
echo 🚀 You can now start MiniPoller:
echo.
echo   Method 1: npm start
echo   Method 2: npx electron electronMain.js
echo.
echo 💡 First startup may take some time to initialize...
echo.
set /p start_now="Would you like to start the application now? (y/N): "

if /i "%start_now%"=="y" (
    echo.
    echo 🎯 Starting MiniPoller...
    npm start
) else (
    echo.
    echo 👋 Installation completed! You can start it anytime with:
    echo    cd backend
    echo    npm start
)

echo.
pause
