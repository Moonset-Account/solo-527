#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "========================================="
echo "  开发环境启动脚本"
echo "========================================="

export DJANGO_ENV=development
export DEBUG=True

cd "$PROJECT_DIR"

step() {
    echo ""
    echo ">>> $1"
}

step "启动基础设施服务..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d postgres redis

step "等待数据库启动..."
sleep 5

step "创建虚拟环境..."
if [ ! -d "$BACKEND_DIR/venv" ]; then
    python3 -m venv "$BACKEND_DIR/venv"
fi

step "激活虚拟环境并安装依赖..."
source "$BACKEND_DIR/venv/bin/activate"
pip install -r "$BACKEND_DIR/requirements.txt"

step "运行数据库迁移..."
cd "$BACKEND_DIR"
python manage.py migrate

step "启动后端服务..."
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

step "安装前端依赖..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
fi

step "启动前端开发服务器..."
npm start &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "  开发环境已启动！"
echo "========================================="
echo ""
echo "访问地址:"
echo "  前端: http://localhost:3000"
echo "  后端API: http://localhost:8000/api/v1/"
echo "  管理后台: http://localhost:8000/admin/"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

cleanup() {
    echo ""
    echo "正在停止服务..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" stop postgres redis
    echo "服务已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
