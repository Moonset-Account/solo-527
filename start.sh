#!/bin/bash

echo "=================================="
echo "民宿保洁和维修派单系统 - 启动脚本"
echo "=================================="

echo ""
echo "请确保已安装以下依赖："
echo "- PostgreSQL (数据库)"
echo "- Redis (缓存和队列)"
echo "- MinIO (对象存储，可选)"
echo "- Python 3.9+"
echo "- Node.js 18+"

echo ""
echo "启动后端服务..."
cd backend

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "安装Python依赖..."
pip install -r requirements.txt

echo "复制环境变量配置..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已创建 .env 文件，请根据实际情况修改数据库配置"
fi

echo ""
echo "初始化数据库..."
python -c "from app.core.database import Base, engine; from app.models import *; Base.metadata.create_all(bind=engine)"
echo "数据库表创建完成"

echo ""
echo "创建测试账号和种子数据..."
python scripts/init_db.py

echo ""
echo "启动后端服务 (端口 8000)..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo ""
echo "启动前端服务 (端口 3000)..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "=================================="
echo "服务启动完成！"
echo "=================================="
echo ""
echo "后端API:  http://localhost:8000"
echo "API文档:  http://localhost:8000/docs"
echo "前端界面: http://localhost:3000"
echo ""
echo "测试账号："
echo "  管理员: admin / admin123"
echo "  运营经理: manager / manager123"
echo "  保洁员: cleaner1 / cleaner123"
echo "  维修工: tech1 / tech123"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
