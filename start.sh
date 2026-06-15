#!/bin/bash

echo "🚀 启动事项闭环台"
echo ""

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd server && npm install && cd ..
fi

echo ""
echo "🐳 启动 MongoDB 和 Redis (Docker)..."
docker-compose up -d mongodb redis

echo ""
echo "⏳ 等待数据库启动..."
sleep 5

echo ""
echo "🔧 启动后端服务 (端口 3001)..."
cd server && npm run start:dev &
SERVER_PID=$!

echo ""
echo "🎨 启动前端服务 (端口 5173)..."
cd .. && npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ 服务已启动！"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo "   MongoDB: localhost:27017"
echo "   Redis: localhost:6379"
echo ""
echo "👤 默认管理员账号: admin / admin123"
echo ""
echo "按 Ctrl+C 停止服务"

trap "kill $SERVER_PID $CLIENT_PID; docker-compose stop; exit" SIGINT SIGTERM

wait
