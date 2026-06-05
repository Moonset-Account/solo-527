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
pip install -r requirements.txt 2>&1 | tail -5

echo "创建目录..."
mkdir -p logs media

echo "运行数据库迁移..."
python manage.py migrate 2>&1

echo "确保测试账号可用..."
python scripts/reset_passwords.py 2>&1

echo ""
echo "=========================================="
echo "  启动开发服务器"
echo "=========================================="
echo "  访问地址: http://localhost:8000"
echo "  API 文档: http://localhost:8000/api/swagger/"
echo ""
echo "  测试账号:"
echo "    管理员: admin / admin123"
echo "    店长:   manager / manager123"
echo "    员工:   staff / staff123"
echo ""

python manage.py runserver 0.0.0.0:8000
