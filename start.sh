#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "→ 首次运行：从 .env.example 复制配置..."
  cp .env.example .env
  echo ""
  echo "⚠️  请编辑 .env 文件，配置以下关键参数："
  echo "   - OPENAI_API_KEY=你的OpenAI API Key"
  echo "   - JWT_SECRET=你的JWT签名密钥（任意随机字符串）"
  echo "   编辑完成后重新运行本脚本。"
  echo ""
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "→ 首次运行：安装依赖中..."
  npm install --no-audit --no-fund
fi

echo "→ 初始化数据库..."
node -e "require('./src/utils/database').init && require('./src/utils/database').init()" 2>/dev/null || true

echo "→ 启动服务..."
if [ "$1" = "prod" ]; then
  node src/server.js
else
  npm run dev
fi
