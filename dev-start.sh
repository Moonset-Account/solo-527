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
echo "  Development Mode Launch Script"
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

echo "[1/8] 检查Python版本..."
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" = "$PYTHON_VERSION" ]; then
    echo "ERROR: Python版本过低，需要 $REQUIRED_VERSION+，当前为 $PYTHON_VERSION"
    exit 1
fi
echo "  ✓ Python $PYTHON_VERSION 检测通过"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "[2/8] 创建虚拟环境..."
if [ ! -d ".venv" ]; then
    $PYTHON_CMD -m venv .venv
    echo "  ✓ 虚拟环境创建完成 (.venv)"
else
    echo "  ✓ 虚拟环境已存在"
fi

echo "[3/8] 激活虚拟环境并安装依赖..."
source .venv/bin/activate
pip install --upgrade pip -q
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt -q
    echo "  ✓ 依赖安装完成"
else
    echo "  ⚠ requirements.txt 未找到，跳过依赖安装"
fi

echo "[4/8] 创建必要目录..."
mkdir -p data/uploads data/vector_store data/datasets data/exports logs
echo "  ✓ 目录创建完成"

echo "[5/8] 环境配置检查..."
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

echo "[6/8] 初始化数据库..."
$PYTHON_CMD -c "from app.core.database import init_db; init_db()"
echo "  ✓ 数据库初始化完成"

echo "[7/8] 检查Redis状态..."
REDIS_STATUS="未检测到"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        REDIS_STATUS="运行中"
    fi
fi
if [ "$REDIS_STATUS" = "运行中" ]; then
    echo "  ✓ Redis检测正常，Celery任务队列可用"
else
    echo "  ⚠ Redis未检测到，Celery任务队列可能无法正常工作"
fi

echo "[8/8] 清理旧进程..."
pkill -f "celery.*worker" 2>/dev/null || true
pkill -f "celery.*flower" 2>/dev/null || true
pkill -f "uvicorn.*app.main" 2>/dev/null || true
sleep 1
echo "  ✓ 旧进程已清理"

echo ""
echo "============================================"
echo "  启动后台服务..."
echo "============================================"

if [ "$REDIS_STATUS" = "运行中" ]; then
    echo "  [后台] 启动 Celery Worker..."
    nohup celery -A app.core.celery_app worker -l INFO -Q ai_queue,data_queue,eval_queue,notify_queue --concurrency=2 > logs/celery_worker.log 2>&1 &
    CELERY_PID=$!
    echo "  ✓ Celery Worker 已启动 (PID: $CELERY_PID) | 日志: logs/celery_worker.log"

    echo "  [后台] 启动 Flower 监控..."
    nohup celery flower -A app.core.celery_app --port=5555 > logs/celery_flower.log 2>&1 &
    FLOWER_PID=$!
    echo "  ✓ Flower 监控已启动 (PID: $FLOWER_PID) | 日志: logs/celery_flower.log"
else
    echo "  ⚠ 跳过 Celery Worker 启动（Redis未运行）"
    echo "  ⚠ 跳过 Flower 监控启动（Redis未运行）"
fi

echo ""
echo "============================================"
echo "  ContractRiskAI 开发服务启动中..."
echo "============================================"
echo ""
echo "  🔗  访问地址列表："
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  API服务:     http://localhost:8000                  │"
echo "  │  Swagger文档: http://localhost:8000/docs             │"
echo "  │  Flower监控:  http://localhost:5555                  │"
echo "  │  看板页面:    http://localhost:8000/static/dashboard.html │"
echo "  │  审核台:      http://localhost:8000/static/review.html    │"
echo "  │  检索:        http://localhost:8000/static/search.html    │"
echo "  │  上传:        http://localhost:8000/static/upload.html    │"
echo "  │  模型:        http://localhost:8000/static/models.html    │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""
echo "  📜  日志文件："
echo "      - API服务: logs/app.log"
echo "      - Celery:  logs/celery_worker.log"
echo "      - Flower:  logs/celery_flower.log"
echo ""
echo "  💡  提示：按 Ctrl+C 可停止API服务，"
echo "     如需停止所有后台进程，请运行:"
echo "     pkill -f 'celery|uvicorn'"
echo "============================================"
echo ""

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
