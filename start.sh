#!/bin/bash

echo "=========================================="
echo "  装修线索客户画像库系统 - 快速启动脚本"
echo "=========================================="

export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home")
echo "使用 JAVA_HOME: $JAVA_HOME"

echo ""
echo "步骤 1: 启动 PostgreSQL 和 Redis..."
docker-compose up -d

echo ""
echo "等待数据库就绪..."
sleep 5

echo ""
echo "步骤 2: 启动后端服务..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!

echo ""
echo "步骤 3: 启动前端服务..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  服务启动中，请稍候..."
echo "=========================================="
echo ""
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:8080/api"
echo ""
echo "默认账号: admin / 123456"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" SIGINT

wait
