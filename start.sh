#!/bin/bash
set -e

echo ""
echo "  ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  █████╗  ██████╗████████╗
 ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝
 ██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝███████║██║        ██║   
 ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██╔══██║██║        ██║   
 ╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║██║  ██║╚██████╗   ██║   
  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   ╚═╝   
       ██████╗ ██╗███████╗██╗  ██╗     █████╗ ██╗
      ██╔════╝ ██║██╔════╝██║ ██╔╝    ██╔══██╗██║
      ██║  ███╗██║███████╗█████╔╝     ███████║██║
      ██║   ██║██║╚════██║██╔═██╗     ██╔══██║██║
      ╚██████╔╝██║███████║██║  ██╗    ██║  ██║███████╗
       ╚═════╝ ╚═╝╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝"
echo ""
echo "  === ContractRiskAI - 合同智能风控与审核平台 ==="
echo "  Production Launch Script"
echo ""

PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "ERROR: 未检测到Python，请安装Python 3.10+"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
REQUIRED_VERSION="3.10"

echo "[1/7] 检查Python版本..."
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" = "$PYTHON_VERSION" ]; then
    echo "ERROR: Python版本过低，需要 $REQUIRED_VERSION+，当前为 $PYTHON_VERSION"
    exit 1
fi
echo "  ✓ Python $PYTHON_VERSION 检测通过"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "[2/7] 创建虚拟环境..."
if [ ! -d ".venv" ]; then
    $PYTHON_CMD -m venv .venv
    echo "  ✓ 虚拟环境创建完成 (.venv)"
else
    echo "  ✓ 虚拟环境已存在"
fi

echo "[3/7] 激活虚拟环境并安装依赖..."
source .venv/bin/activate
pip install --upgrade pip -q
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt -q
    echo "  ✓ 依赖安装完成"
else
    echo "  ⚠ requirements.txt 未找到，跳过依赖安装"
fi

echo "[4/7] 创建必要目录..."
mkdir -p data/uploads data/vector_store data/datasets data/exports logs
echo "  ✓ 目录创建完成"

echo "[5/7] 环境配置检查..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "  ✓ 已从 .env.example 复制生成 .env"
    else
        echo "  ⚠ .env.example 未找到，.env 缺失"
    fi
else
    echo "  ✓ .env 已存在"
fi

echo "[6/7] 初始化数据库..."
$PYTHON_CMD -c "from app.core.database import init_db; init_db()"
echo "  ✓ 数据库初始化完成"

echo "[7/7] 检查Redis状态..."
REDIS_STATUS="未检测到"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        REDIS_STATUS="运行中"
    fi
fi
if [ "$REDIS_STATUS" = "运行中" ]; then
    echo "  ✓ Redis检测正常，Celery任务队列可用"
else
    echo "  ⚠ Redis未检测到，Celery任务队列将不可用，但API服务仍可启动同步模式"
fi

echo ""
echo "============================================"
echo "  ContractRiskAI 生产服务启动中..."
echo "============================================"
echo "  API服务地址: http://0.0.0.0:8000"
echo "  Swagger文档: http://0.0.0.0:8000/docs"
echo ""
echo "  [可选] 如需启动Celery Worker，请在另一个终端运行："
echo "    source .venv/bin/activate"
echo "    celery -A app.core.celery_app worker -l INFO -Q ai_queue,data_queue,eval_queue,notify_queue"
echo ""
echo "  [可选] 如需启动Flower监控，请在另一个终端运行："
echo "    source .venv/bin/activate"
echo "    celery flower -A app.core.celery_app --port=5555"
echo "============================================"
echo ""

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
