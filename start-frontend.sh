#!/bin/bash

set -e

echo "========================================"
echo "  宿舍报修消息通知中心 - 前端启动"
echo "========================================"

cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

echo ""
echo "🚀 启动 React 开发服务器 (端口 3000)..."
npm run dev
