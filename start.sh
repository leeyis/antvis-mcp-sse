#!/bin/bash

# MCP Chart Render SSE服务器启动脚本

echo "=== MCP Chart Render SSE服务器部署启动 ==="

# 检查Node.js环境
echo "检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js版本: $NODE_VERSION"

# 检查npm环境
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm版本: $NPM_VERSION"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
else
    echo "✅ 依赖包已存在"
fi

# 检查images目录
if [ ! -d "images" ]; then
    echo "📁 创建images目录..."
    mkdir -p images
fi

# 设置环境变量（如果未设置）
export PORT=${PORT:-3001}
export ENDPOINT=${ENDPOINT:-/message}

echo "🚀 启动配置:"
echo "   - 端口: $PORT"
echo "   - 端点: $ENDPOINT"
echo "   - 访问地址: http://localhost:$PORT$ENDPOINT"

echo ""
echo "🎯 启动MCP Chart Render SSE服务器..."
echo "💡 按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
npm start 