#!/bin/bash
set -e

echo "======================================"
echo "  青禾合规清单台 - 启动前端"
echo "======================================"

cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "[1/2] 安装依赖 ..."
  npm install --registry=https://registry.npmmirror.com
fi

echo "[2/2] 启动 Nuxt 3 开发服务器 (端口 3000) ..."
exec npm run dev
