#!/bin/bash
set -e

echo "📚 松石排课消课台 - 启动脚本"
echo "================================"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
    echo "📄 加载环境变量..."
    export $(cat .env | grep -v '^#' | xargs)
fi

echo ""
echo "1️⃣  检查Python虚拟环境..."
if [ ! -d "venv" ]; then
    echo "💡 创建虚拟环境..."
    python3 -m venv venv
fi
source venv/bin/activate

echo ""
echo "2️⃣  安装依赖包..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ 依赖安装完成"

echo ""
echo "3️⃣  检查Docker服务..."
if command -v docker &> /dev/null; then
    if ! docker ps --format '{{.Names}}' | grep -q "songshi-postgres"; then
        echo "🐘 启动PostgreSQL和Redis容器..."
        docker compose up -d
        sleep 5
    else
        echo "✅ 容器已运行"
    fi
else
    echo "⚠️  Docker未安装，请手动启动PostgreSQL和Redis"
fi

echo ""
echo "4️⃣  应用数据库迁移..."
# 数据库迁移由lifespan自动处理

echo ""
echo "5️⃣  启动应用服务..."
echo ""
echo "============================================="
echo "🚀 服务启动地址: http://localhost:8000"
echo "📖 API文档地址: http://localhost:8000/docs"
echo "🔑 默认超管账号: admin@songshi.com / Admin@123456"
echo "============================================="
echo ""

exec python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --reload-include="*.html"
