#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "▶ 检查虚拟环境..."
if [ ! -d ".venv" ]; then
  echo "▶ 创建虚拟环境..."
  python3 -m venv .venv
fi
source .venv/bin/activate

echo "▶ 安装依赖（已安装会跳过）..."
pip install --upgrade pip >/dev/null 2>&1
pip install -r requirements.txt 2>&1 | tail -5

echo ""
echo "▶ 确保数据目录..."
mkdir -p data/uploads data/exports

echo ""
echo "================================================"
echo "  🟢 青禾应收对账台 启动中"
echo "  URL:  http://127.0.0.1:8100"
echo "  管理员: admin@qinghe.ar / admin123"
echo "  客户  : client@qinghe.ar / user123"
echo "================================================"
echo ""

export PYTHONPATH="$SCRIPT_DIR"
exec uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload --reload-dir=app
