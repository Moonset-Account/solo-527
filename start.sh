#!/bin/bash

echo "=========================================="
echo "城市空气质量分析工作台 - 启动脚本"
echo "=========================================="
echo ""
echo "提示: 如果因权限无法执行，请使用:"
echo "  bash start.sh"
echo "  或"
echo "  python3 start.py"
echo ""

cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
    echo "复制环境变量配置文件..."
    cp .env.example .env
fi

echo "检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 python3，请先安装 Python 3.8+"
    exit 1
fi

echo "创建虚拟环境..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

echo "激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "=========================================="
echo "启动Dash分析工作台 (端口: 8050)"
echo "=========================================="
echo ""
echo "访问地址: http://localhost:8050"
echo "按 Ctrl+C 停止服务"
echo ""

python3 app.py
