#!/bin/bash
set -e

echo "======================================"
echo "  青禾合规清单台 - 启动 Celery Worker"
echo "======================================"

cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
  echo "请先启动后端 (start-backend.sh) 以完成依赖安装"
  exit 1
fi

source venv/bin/activate

echo "启动 Celery Worker + Beat (每天9点期限巡检/每6小时材料缺失检查) ..."
exec celery -A app.celery_tasks.celery_app worker -B --loglevel=info --pool=solo
