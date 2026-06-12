#!/bin/bash
set -e

echo "======================================"
echo "  青禾合规清单台 - 启动后端 API"
echo "======================================"

cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
  echo "[1/3] 创建虚拟环境 venv ..."
  python3 -m venv venv
  source venv/bin/activate
  echo "[2/3] 安装依赖 ..."
  pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade pip
  pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
else
  source venv/bin/activate
fi

echo "[3/3] 启动 FastAPI (端口 8000) ..."
exec python run.py
