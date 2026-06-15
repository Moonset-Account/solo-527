#!/bin/bash
set -e

echo "=========================================="
echo "音乐演出座位库存系统 - 启动脚本"
echo "=========================================="

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE_DIR"

if [ ! -d "venv" ]; then
    echo "[1/4] 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

echo "[2/4] 激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    echo "[3/4] 复制环境变量配置..."
    cp .env.example .env
    echo "  请根据实际情况修改 .env 文件中的数据库和 Redis 连接信息"
fi

echo "[4/4] 初始化数据库结构和默认数据..."
python init_db.py || true

echo ""
echo "=========================================="
echo "启动完成！"
echo ""
echo "后台地址:  http://localhost:8000/admin"
echo "前台地址:  http://localhost:8000/events"
echo "API文档:   http://localhost:8000/docs"
echo ""
echo "默认账号:"
echo "  管理员   admin / admin123"
echo "  运营     operator / op123456"
echo "  财务     finance / fin123456"
echo "  测试用户 test001 / test123456"
echo "=========================================="
echo ""
echo "启动开发服务器命令:"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
