#!/bin/bash

set -e

echo "========================================"
echo "  招聘流程效率仪表盘 - 启动脚本"
echo "========================================"

MODE=${1:-"dash"}

echo ""
echo "📦 检查虚拟环境..."
if [ ! -d "venv" ]; then
    echo "   创建虚拟环境..."
    python3 -m venv venv
fi

echo "   激活虚拟环境..."
source venv/bin/activate

echo ""
echo "📚 安装依赖..."
pip install --upgrade pip
pip install -r requirements.txt

if [ "$MODE" = "timescaledb" ]; then
    echo ""
    echo "🗄️  启动 TimescaleDB (Docker)..."
    docker-compose up -d timescaledb
    echo "   等待数据库启动..."
    sleep 10
fi

echo ""
echo "🗄️  初始化数据库和模拟数据..."
python generate_data.py

if [ "$MODE" = "api" ] || [ "$MODE" = "timescaledb" ]; then
    echo ""
    echo "🌐 启动 API 服务器..."
    python api_server.py &
    API_PID=$!
    echo "   API 服务器 PID: $API_PID"
    echo "   API 地址: http://localhost:5000"
    sleep 2
fi

echo ""
echo "🚀 启动仪表盘应用..."
echo "   访问地址: http://localhost:8050"
echo ""
echo "   使用说明:"
echo "   - 点击图表可下钻查看候选人明细"
echo "   - 点击 '数据校验' 查看数据质量报告"
echo "   - 点击 '导出报告' 下载 Excel 报告"
echo ""

if [ "$MODE" = "api" ] || [ "$MODE" = "timescaledb" ]; then
    trap "kill $API_PID 2>/dev/null; exit" INT TERM EXIT
fi

python app.py
