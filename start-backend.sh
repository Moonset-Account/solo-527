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
fi

source .env

echo ""
echo "🗄️  检查数据库..."
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dorm_repair}"

if command -v psql &> /dev/null; then
    DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
    if [ "$DB_EXISTS" != "1" ]; then
        echo "  创建数据库 $DB_NAME ..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null && echo "  ✅ 数据库创建成功" || echo "  ⚠️  无法自动创建数据库，请手动执行: createdb $DB_NAME"
    else
        echo "  ✅ 数据库 $DB_NAME 已存在"
    fi
else
    echo "  ⚠️  psql 命令不可用，请确保 PostgreSQL 已安装且数据库 $DB_NAME 已创建"
fi

echo ""
echo "🔄 生成数据库迁移文件..."
python manage.py makemigrations --noinput 2>/dev/null || echo "  迁移文件已存在，跳过生成"

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
