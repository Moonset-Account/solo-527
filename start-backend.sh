#!/bin/bash

set -e

echo "========================================"
echo "  宿舍报修消息通知中心 - 后端启动"
echo "========================================"

cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

echo "🐍 激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    echo "⚙️  创建环境配置文件..."
    cp .env.example .env
    echo "请根据实际情况修改 backend/.env 中的数据库配置"
fi

echo ""
echo "🔄 生成数据库迁移文件..."
python manage.py makemigrations --noinput || echo "  迁移文件已存在，跳过生成"

echo "🔄 执行数据库迁移..."
python manage.py migrate --noinput

echo ""
echo "🌱 初始化默认数据..."
python manage.py init_data

echo ""
echo "🚀 启动 Django 开发服务器 (端口 8000)..."
echo "   API 地址: http://localhost:8000/api/"
echo "   后台管理: http://localhost:8000/admin/"
echo ""
python manage.py runserver 0.0.0.0:8000
