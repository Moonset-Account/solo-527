#!/bin/bash

echo "=========================================="
echo "  独立书店库存和读书会系统 - 后端启动脚本"
echo "=========================================="

cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "安装依赖..."
pip install -r requirements.txt

echo "创建日志目录..."
mkdir -p logs media

echo "运行数据库迁移..."
python manage.py makemigrations core books members inventory events reservations sales 2>/dev/null
python manage.py migrate

if [ ! -f "db.sqlite3" ] || [ -z "$(python manage.py shell -c "from apps.core.models import User; print(User.objects.count())" 2>/dev/null | grep -o '[0-9]*')" ] || [ "$(python manage.py shell -c "from apps.core.models import User; print(User.objects.count())" 2>/dev/null | grep -o '[0-9]*')" -eq 0 ]; then
    echo "初始化测试数据..."
    python scripts/init_test_data.py
fi

echo "启动开发服务器..."
echo "访问地址: http://localhost:8000"
echo "API 文档: http://localhost:8000/api/swagger/"
echo ""
python manage.py runserver 0.0.0.0:8000
