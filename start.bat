@echo off
chcp 65001 >nul
title 图片压缩工具 - Image Compressor

echo ==================================
echo     图片压缩工具启动脚本
echo     Image Compressor Startup
echo ==================================

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js
    echo ❌ Error: Node.js not found. Please install Node.js first.
    echo 下载地址: https://nodejs.org/
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到npm，请先安装npm
    echo ❌ Error: npm not found. Please install npm first.
    pause
    exit /b 1
)

REM 显示Node.js和npm版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js版本: %NODE_VERSION%
echo ✅ npm版本: %NPM_VERSION%

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖包...
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ 依赖已安装
    echo ✅ Dependencies already installed
)

REM 启动服务器
echo.
echo 🚀 正在启动图片压缩服务器...
echo 🚀 Starting Image Compressor Server...
echo.

REM 检查端口3000是否被占用
netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  警告: 端口3000已被占用
    echo ⚠️  Warning: Port 3000 is already in use
    echo 请检查是否有其他服务正在运行，或手动终止占用端口的进程
    echo Please check if other services are running, or manually terminate the process occupying the port
    echo.
    echo 查看占用端口的进程:
    echo Check process occupying the port:
    echo netstat -ano ^| findstr :3000
    echo.
)

echo 🌐 服务器将在以下地址启动:
echo 🌐 Server will start at the following addresses:
echo    Local:   http://localhost:3000
echo    Network: http://YOUR_IP:3000
echo.
echo 📝 功能特点:
echo 📝 Features:
echo    • 支持多种图片格式 (JPG, PNG, WebP等)
echo    • Support multiple image formats (JPG, PNG, WebP, etc.)
echo    • 可自定义压缩质量
echo    • Customizable compression quality
echo    • 批量处理支持
echo    • Batch processing support
echo    • 响应式设计
echo    • Responsive design
echo.
echo ⏹️  按 Ctrl+C 停止服务器
echo ⏹️  Press Ctrl+C to stop the server
echo ==================================
echo.

REM 启动服务器
npm start

pause