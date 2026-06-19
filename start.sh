#!/bin/bash

echo "=== 票务运营签到核销系统 ==="
echo ""

case "$1" in
  backend)
    echo "启动后端服务..."
    cd backend
    python run.py
    ;;
  frontend)
    echo "启动前端服务..."
    cd frontend
    npm run dev
    ;;
  celery)
    echo "启动 Celery Worker..."
    cd backend
    celery -A app.services.celery_app.celery_app worker --loglevel=info
    ;;
  beat)
    echo "启动 Celery Beat..."
    cd backend
    celery -A app.services.celery_app.celery_app beat --loglevel=info
    ;;
  init-db)
    echo "初始化数据库..."
    cd backend
    python scripts/init_db.py
    ;;
  *)
    echo "用法: ./start.sh [backend|frontend|celery|beat|init-db]"
    echo ""
    echo "命令:"
    echo "  backend    - 启动 FastAPI 后端服务"
    echo "  frontend   - 启动 Nuxt 3 前端服务"
    echo "  celery     - 启动 Celery Worker"
    echo "  beat       - 启动 Celery Beat (定时任务)"
    echo "  init-db    - 初始化数据库"
    ;;
esac
