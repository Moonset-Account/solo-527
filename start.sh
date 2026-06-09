#!/bin/bash
# 一键启动脚本 - 不依赖Redis的最小运行模式
set -e

echo "=========================================="
echo "  会议纪要行动项提取系统 - 快速启动"
echo "=========================================="

# 检查 Node
if ! command -v node &> /dev/null; then
    echo "[错误] 请先安装 Node.js 18+"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "[1/4] 安装依赖..."
    npm install --no-audit --no-fund 2>&1 | tail -5
fi

# 准备 env
if [ ! -f ".env" ]; then
    echo "[2/4] 生成 .env 配置..."
    cp .env.example .env
    echo "      -> 请编辑 .env 配置 OPENAI_API_KEY"
else
    echo "[2/4] .env 已存在"
fi

# 初始化种子数据（仅当数据库不存在时）
if [ ! -f "data/app.db" ]; then
    echo "[3/4] 初始化演示数据..."
    node server/scripts/seed.js
else
    echo "[3/4] 数据库已存在，跳过种子数据"
fi

# 启动服务
echo "[4/4] 启动服务..."
echo ""
echo "=========================================="
echo "  服务地址:  http://localhost:3000"
echo "  健康检查:  http://localhost:3000/health"
echo "  API文档:   http://localhost:3000 (点击菜单 API 接口)"
echo "  指标端点:  http://localhost:3000/metrics"
echo ""
echo "  提示: 首次使用请在 .env 中配置 OPENAI_API_KEY"
echo "=========================================="
echo ""
node server/index.js
