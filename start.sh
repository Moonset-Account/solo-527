#!/bin/bash

echo "========================================"
echo "  宿舍报修消息通知中心 - 一键启动"
echo "========================================"

BASE_DIR="$(dirname "$0")"

chmod +x "$BASE_DIR/start-backend.sh"
chmod +x "$BASE_DIR/start-frontend.sh"
chmod +x "$BASE_DIR/start-celery.sh"

echo ""
echo "📋 可用命令:"
echo "  ./start-backend.sh    - 启动 Django 后端 (端口 8000)"
echo "  ./start-frontend.sh   - 启动 React 前端 (端口 3000)"
echo "  ./start-celery.sh     - 启动 Celery 异步任务"
echo ""
echo "💡 建议打开 3 个终端分别运行以上命令"
echo "💡 确保 PostgreSQL 和 Redis 服务已启动"
echo ""

read -p "是否同时启动后端和前端? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "启动后端..."
    osascript -e 'tell app "Terminal" to do script "cd '"$BASE_DIR"' && ./start-backend.sh"' 2>/dev/null || "$BASE_DIR/start-backend.sh" &
    sleep 2
    echo "启动前端..."
    osascript -e 'tell app "Terminal" to do script "cd '"$BASE_DIR"' && ./start-frontend.sh"' 2>/dev/null || "$BASE_DIR/start-frontend.sh" &
    echo ""
    echo "✅ 已启动后端和前端服务"
    echo "🌐 前端: http://localhost:3000"
    echo "🔧 后端API: http://localhost:8000/api"
fi
