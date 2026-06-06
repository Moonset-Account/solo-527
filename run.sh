#!/bin/bash

echo "=========================================="
echo "  冷链疫苗温度合规分析平台 - 启动脚本"
echo "=========================================="
echo ""

if [ ! -d "venv" ]; then
    echo "📦 首次运行，正在创建虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 正在安装依赖包..."
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo ""
echo "🚀 启动 Dash 应用服务器..."
echo "📊 访问地址: http://localhost:8050"
echo "⏹️  按 Ctrl+C 停止服务"
echo ""

python app.py
