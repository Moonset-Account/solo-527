#!/bin/bash

echo "=========================================="
echo "  连锁口腔处方收费台系统 - 启动脚本"
echo "=========================================="
echo ""

echo "[1/5] 检查Docker环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi
echo "✅ Docker环境检查通过"
echo ""

echo "[2/5] 停止现有服务..."
docker-compose down 2>/dev/null
echo "✅ 现有服务已停止"
echo ""

echo "[3/5] 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..
echo "✅ 后端依赖安装完成"
echo ""

echo "[4/5] 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..
echo "✅ 前端依赖安装完成"
echo ""

echo "[5/5] 启动所有服务..."
echo ""
echo "服务信息："
echo "  - PostgreSQL:  http://localhost:5432"
echo "  - 后端API:     http://localhost:3000/api"
echo "  - 前端应用:    http://localhost:4200"
echo ""
echo "默认登录账号："
echo "  - 超级管理员:  admin / password"
echo "  - 诊所院长:    director / password"
echo "  - 医生:        doctor / password"
echo "  - 收费员:      cashier / password"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""
echo "=========================================="

docker-compose up
