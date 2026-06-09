#!/bin/bash

echo "=========================================="
echo "  合同条款风险标注工具 - 启动脚本"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

set -e

echo ""
echo "[1/5] 检查环境..."

if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

if ! command -v psql &> /dev/null && [ -z "$SKIP_DB_CHECK" ]; then
    echo "⚠️  未检测到 PostgreSQL 客户端，跳过数据库检查"
    echo "   请确保 PostgreSQL 服务已启动"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "✅ Node.js 版本: $(node -v)"

echo ""
echo "[2/5] 安装后端依赖..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ 后端依赖已安装"
fi

echo ""
echo "[3/5] 安装前端依赖..."
cd client
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ 前端依赖已安装"
fi
cd "$ROOT_DIR"

echo ""
echo "[4/5] 配置环境..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  已从 .env.example 创建 .env 文件"
    echo "   请修改其中的配置，特别是："
    echo "   - DB_USER / DB_PASSWORD: PostgreSQL 登录信息"
    echo "   - DB_NAME: 数据库名称"
    echo "   - OPENAI_API_KEY: OpenAI API Key (生产环境必需)"
    echo ""
    read -p "是否继续启动开发模式（使用模拟数据）？(Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ -n $REPLY ]]; then
        echo "已取消启动。请配置 .env 后再运行此脚本。"
        exit 0
    fi
else
    echo "✅ .env 配置文件已存在"
fi

echo ""
echo "[5/5] 初始化数据库..."
echo "执行数据库迁移（如果数据库未连接，首次启动可能失败）"
npm run db:migrate || echo "⚠️  数据库迁移跳过，请确保 PostgreSQL 配置正确"
npm run db:seed || echo "⚠️  种子数据跳过"

echo ""
echo "=========================================="
echo "  ✅ 环境准备完成！"
echo "=========================================="
echo ""
echo "启动方式："
echo "  🚀 开发模式 (前后端同时运行): npm run dev"
echo "  🔧 仅后端: npm run dev:server    (端口 3001)"
echo "  🎨 仅前端: npm run dev:client    (端口 3000)"
echo "  📦 测试: npm test"
echo ""
echo "默认账号："
echo "  管理员: admin / Admin@123"
echo "  法务助理: assistant1 / Assistant@123"
echo "  复核人: reviewer1 / Reviewer@123"
echo ""
echo "=========================================="

read -p "是否立即启动开发模式？(Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    echo "🚀 启动开发服务器..."
    npm run dev
fi
