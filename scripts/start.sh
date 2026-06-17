#!/bin/bash

echo "=============================================="
echo "  摄影师订单作品交付台 - 启动脚本"
echo "=============================================="
echo ""

echo "[1/4] 检查Python虚拟环境..."
if [ -d "venv" ]; then
    echo "  ✓ 虚拟环境已存在"
    source venv/bin/activate
else
    echo "  ✗ 虚拟环境不存在，正在创建..."
    python3 -m venv venv
    source venv/bin/activate
    echo "  ✓ 虚拟环境创建完成"
fi

echo ""
echo "[2/4] 安装依赖..."
pip install -r requirements.txt
echo "  ✓ 依赖安装完成"

echo ""
echo "[3/4] 初始化数据库..."
python scripts/init_db.py
echo "  ✓ 数据库初始化完成"

echo ""
echo "[4/4] 启动服务..."
echo ""
echo "=============================================="
echo "  服务启动中，请访问："
echo "  http://localhost:8000"
echo ""
echo "  测试账号："
echo "  admin / test123        (管理员)"
echo "  photographer / test123 (摄影师)"
echo "  videolead / test123    (视频团队负责人)"
echo "=============================================="
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
