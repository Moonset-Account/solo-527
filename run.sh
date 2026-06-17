#!/bin/bash

echo "🐾 宠物洗护预约商城 - 启动脚本"
echo "=================================="

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
    echo "📄 复制 .env.example 到 .env"
    cp .env.example .env
fi

if [ ! -d "venv" ]; then
    echo "🐍 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

echo "🔧 激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "⚙️  请确保 PostgreSQL 和 Redis 服务已启动"
echo "   PostgreSQL: 默认 localhost:5432, 数据库 pet_grooming"
echo "   Redis: 默认 localhost:6379"
echo ""
echo "💾 如需创建数据库，请执行:"
echo "   createdb pet_grooming"
echo ""
read -p "初始化示例数据？(y/n): " init_choice

if [[ "$init_choice" =~ ^[Yy]$ ]]; then
    echo "📊 正在初始化数据..."
    python scripts/init_data.py
fi

echo ""
echo "🚀 启动 FastAPI 服务器..."
echo "   访问地址: http://localhost:8000"
echo "   API文档:  http://localhost:8000/docs"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
