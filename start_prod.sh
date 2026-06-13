#!/bin/bash
echo "🚀 生产环境启动 - 松石排课消课台"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

export APP_ENV=production
export APP_DEBUG=false
export DEMO_MODE=false

source venv/bin/activate

mkdir -p logs

exec python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --log-level info \
    --log-config log_conf.yaml
