#!/bin/bash

# 图片压缩工具启动脚本
# Image Compressor Startup Script

echo "=================================="
echo "    图片压缩工具启动脚本"
echo "    Image Compressor Startup"
echo "=================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    echo "❌ Error: Node.js not found. Please install Node.js first."
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    echo "❌ Error: npm not found. Please install npm first."
    exit 1
fi

# 显示Node.js和npm版本
echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖包..."
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo "✅ Dependencies installed successfully"
else
    echo "✅ 依赖已安装"
    echo "✅ Dependencies already installed"
fi

# 启动服务器
echo ""
echo "🚀 正在启动图片压缩服务器..."
echo "🚀 Starting Image Compressor Server..."
echo ""

# 检查端口3000是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  警告: 端口3000已被占用"
    echo "⚠️  Warning: Port 3000 is already in use"
    echo "请检查是否有其他服务正在运行，或手动终止占用端口的进程"
    echo "Please check if other services are running, or manually terminate the process occupying the port"
    echo ""
    echo "查看占用端口的进程:"
    echo "Check process occupying the port:"
    echo "lsof -i :3000"
    echo ""
fi

echo "🌐 服务器将在以下地址启动:"
echo "🌐 Server will start at the following addresses:"
echo "   Local:   http://localhost:3000"
echo "   Network: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 功能特点:"
echo "📝 Features:"
echo "   • 支持多种图片格式 (JPG, PNG, WebP等)"
echo "   • Support multiple image formats (JPG, PNG, WebP, etc.)"
echo "   • 可自定义压缩质量"
echo "   • Customizable compression quality"
echo "   • 批量处理支持"
echo "   • Batch processing support"
echo "   • 响应式设计"
echo "   • Responsive design"
echo ""
echo "⏹️  按 Ctrl+C 停止服务器"
echo "⏹️  Press Ctrl+C to stop the server"
echo "=================================="
echo ""

# 启动服务器
npm start