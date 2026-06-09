#!/usr/bin/env bash
# 停止脚本
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/backend"

echo "🛑 停止门诊爽约AI平台服务..."

if [ -f "$BACKEND_DIR/logs/backend.pid" ]; then
    PID=$(cat "$BACKEND_DIR/logs/backend.pid")
    kill $PID 2>/dev/null && echo "  已停止后端 (PID: $PID)"
    rm -f "$BACKEND_DIR/logs/backend.pid"
fi

if [ -f "$BACKEND_DIR/logs/frontend.pid" ]; then
    PID=$(cat "$BACKEND_DIR/logs/frontend.pid")
    kill $PID 2>/dev/null && echo "  已停止前端 (PID: $PID)"
    rm -f "$BACKEND_DIR/logs/frontend.pid"
fi

pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ 服务已全部停止"
