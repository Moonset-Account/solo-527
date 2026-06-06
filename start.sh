#!/bin/bash

echo "=========================================="
echo "博物馆临时展览物料调度系统 - 启动脚本"
echo "=========================================="

echo ""
echo "检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python3，请先安装 Python 3.8+"
    exit 1
fi

echo "创建虚拟环境..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

echo "激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "创建配置文件..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
DJANGO_SETTINGS_MODULE=museum_scheduler.settings
DATABASE_URL=sqlite:///db.sqlite3
EOF
fi

echo ""
echo "使用 SQLite 数据库进行快速演示..."
export DJANGO_SETTINGS_MODULE=museum_scheduler.settings

echo "执行数据库迁移..."
python manage.py migrate --settings=museum_scheduler.settings_sqlite 2>/dev/null || python manage.py migrate

echo ""
echo "初始化角色和用户..."
python manage.py init_roles

echo ""
echo "创建演示数据..."
python manage.py init_demo_data

echo ""
echo "创建超级管理员..."
python manage.py createsuperuser --noinput --username=superadmin --email=admin@museum.com 2>/dev/null || true

echo ""
echo "=========================================="
echo "启动开发服务器..."
echo "访问地址: http://127.0.0.1:8000/"
echo ""
echo "默认账号:"
echo "  策展人: curator / curator123"
echo "  仓管:   warehouse / warehouse123"
echo "  施工:   construction / construction123"
echo "  管理员: admin / admin123"
echo "=========================================="
echo ""

python manage.py runserver 0.0.0.0:8000
