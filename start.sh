#!/bin/bash

set -e

echo "========================================"
echo "  招聘流程效率仪表盘 - 启动脚本"
echo "========================================"

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

echo ""
echo "🗄️  初始化数据库和模拟数据..."
python generate_data.py

echo ""
echo "🚀 启动仪表盘应用..."
echo "   访问地址: http://localhost:8050"
echo ""
python app.py
