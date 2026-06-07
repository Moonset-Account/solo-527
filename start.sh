#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "城市空气质量分析工作台 - 启动脚本"
echo "=========================================="
echo ""

# 尝试给脚本加执行权限（如果没有的话）
if [ ! -x "$0" ]; then
    chmod +x "$0" 2>/dev/null || true
fi

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
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo ""
echo "检查数据库状态..."
python3 -c "
import sys
sys.path.insert(0, '.')
from backend.db_init import check_postgres_available, database_exists
if check_postgres_available():
    if database_exists():
        print('✅ air_quality 数据库已存在')
    else:
        print('⚠️  air_quality 数据库不存在，将自动初始化...')
else:
    print('ℹ️  PostgreSQL 不可用，将使用模拟数据模式')
" 2>/dev/null

# 如果 USE_MOCK_DATA=false 且数据库不存在，尝试初始化数据库
if grep -q "USE_MOCK_DATA=false" .env 2>/dev/null; then
    echo ""
    echo "检测到 USE_MOCK_DATA=false，尝试初始化数据库..."
    python3 backend/db_init.py
fi

echo ""
echo "=========================================="
echo "启动Dash分析工作台 (端口: 8050)"
echo "=========================================="
echo ""
echo "访问地址: http://localhost:8050"
echo "按 Ctrl+C 停止服务"
echo ""

python3 app.py
