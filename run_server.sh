#!/bin/bash
set -e

PORT=8000
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "  母婴会员复购营销系统 - 启动脚本"
echo "  项目: work-0334"
echo "  端口: ${PORT}"
echo "=========================================="
echo ""

echo "[1/3] 检查并释放端口 ${PORT}..."
EXISTING_PID=$(lsof -ti:${PORT} 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
    echo "  发现占用端口 ${PORT} 的进程: ${EXISTING_PID}"
    for PID in $EXISTING_PID; do
        PID_CWD=$(lsof -p ${PID} 2>/dev/null | grep cwd | awk '{print $NF}' || echo "unknown")
        echo "  - PID ${PID} 工作目录: ${PID_CWD}"
        
        if [[ "${PID_CWD}" == *"work-0334"* ]]; then
            echo "    属于当前项目，正在重启..."
        else
            echo "    不属于当前项目，正在终止..."
        fi
        kill -9 ${PID} 2>/dev/null || true
    done
    sleep 1
    echo "  ✅ 端口 ${PORT} 已释放"
else
    echo "  ✅ 端口 ${PORT} 空闲可用"
fi

echo ""
echo "[2/3] 激活虚拟环境并检查依赖..."
cd "${PROJECT_DIR}"
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    echo "  ✅ 虚拟环境已激活"
else
    echo "  ⚠️  未找到 .venv，使用系统 Python"
fi

echo "  检查核心依赖..."
python -c "import fastapi, sqlalchemy, jinja2, alembic; print('  ✅ 所有依赖可用')" 2>&1

echo ""
echo "[3/3] 启动 uvicorn 服务..."
echo ""
echo "访问地址:"
echo "  会员登录:    http://localhost:${PORT}/login"
echo "  运营登录:    http://localhost:${PORT}/admin/login"
echo "  会员商城:    http://localhost:${PORT}/mall"
echo "  运营后台:    http://localhost:${PORT}/admin/dashboard"
echo "  健康检查:    http://localhost:${PORT}/health"
echo "  API 文档:    http://localhost:${PORT}/docs"
echo ""
echo "默认账号:"
echo "  会员:        member / member123    (→ /mall)"
echo "  会员:        member2 / member123   (→ /mall)"
echo "  管理员:      admin / admin123      (→ /admin/dashboard)"
echo "  品牌运营:    operator / operator123 (→ /admin/dashboard)"
echo ""
echo "按 Ctrl+C 停止服务"
echo "=========================================="
echo ""

exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --reload
