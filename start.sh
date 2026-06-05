#!/bin/bash
set -e

echo "=== 托育中心接送和家园沟通平台 启动脚本 ==="

cd "$(dirname "$0")"

# 后端
echo "[1/5] 安装后端依赖..."
cd backend
pip install -r requirements.txt -q

echo "[2/5] 执行数据库迁移..."
python manage.py makemigrations accounts children daily_records pickup notifications finance common --noinput
python manage.py migrate --noinput

echo "[3/5] 生成演示数据..."
python manage.py seed_data

echo "[4/5] 收集静态文件..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo "[5/5] 验证数据..."
python scripts/validate_data.py

# 前端
echo ""
echo "[前端] 安装依赖并构建..."
cd ../frontend
npm install --legacy-peer-deps
npm run build

echo ""
echo "=== 启动完成 ==="
echo "启动后端: cd backend && python manage.py runserver"
echo "启动前端: cd frontend && npm run dev"
echo ""
echo "演示账号:"
echo "  管理员: admin / admin123"
echo "  教师:   teacher1 / teacher123"
echo "  家长:   parent1 / parent123"
