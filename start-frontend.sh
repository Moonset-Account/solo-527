#!/bin/bash

echo "=========================================="
echo "  独立书店库存和读书会系统 - 前端启动脚本"
echo "=========================================="

cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

echo "启动开发服务器..."
echo "访问地址: http://localhost:5173"
echo ""
npm run dev
