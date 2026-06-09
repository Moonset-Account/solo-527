#!/usr/bin/env bash
# 启动脚本：创建虚拟环境、安装依赖、初始化数据、启动服务
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

PYTHON_BIN="${PYTHON_BIN:-python3}"

echo "[1/5] 创建虚拟环境..."
if [ ! -d ".venv" ]; then
    $PYTHON_BIN -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

echo "[2/5] 安装依赖..."
pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "[3/5] 生成 .env 文件..."
    cp .env.example .env
else
    echo "[3/5] .env 已存在，跳过..."
fi

echo "[4/5] 初始化数据库和演示数据..."
PYTHONPATH=. python scripts/seed_demo_data.py

echo "[5/5] 启动服务..."
echo "  访问地址: http://localhost:8000"
echo "  接口文档: http://localhost:8000/docs"
echo "  验收检查: http://localhost:8000/api/v1/acceptance/check"

exec python main.py
