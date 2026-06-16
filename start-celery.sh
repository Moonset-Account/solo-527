#!/bin/bash

set -e

echo "========================================"
echo "  启动 Celery Worker"
echo "========================================"

cd "$(dirname "$0")/backend"

source venv/bin/activate

echo "🚀 启动 Celery Worker..."
celery -A config worker -l info -B
