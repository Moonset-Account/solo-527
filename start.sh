#!/bin/bash

echo "========================================"
echo "  冷链箱周转管理系统 - 启动脚本"
echo "========================================"

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "📦 启动后端 API 服务 (端口 8080)..."
cd "$BASE_DIR/backend"
if [ ! -f "cold-chain-api" ]; then
    echo "   正在构建后端..."
    go build -o cold-chain-api ./cmd/api
fi
./cold-chain-api &
BACKEND_PID=$!

sleep 2

echo ""
echo "🎨 启动前端开发服务器 (端口 5173)..."
cd "$BASE_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "   正在安装前端依赖..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  系统启动完成！"
echo "  前端地址: http://localhost:5173"
echo "  后端API:  http://localhost:8080"
echo ""
echo "  测试账号:"
echo "    管理员:   admin / password123"
echo "    调度员:   dispatcher1 / password123"
echo "    护士:     nurse1 / password123"
echo ""
echo "  按 Ctrl+C 停止服务"
echo "========================================"

cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "✅ 服务已停止"
    exit 0
}

trap cleanup INT TERM

wait
