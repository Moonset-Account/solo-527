#!/usr/bin/env bash
# ================================================================
# 🏥 门诊爽约风险提醒AI平台 - 一键启动脚本
# ================================================================
# 功能：
#   1. 安装后端 Python 依赖
#   2. 安装前端 Node.js 依赖
#   3. 运行系统初始化（导入示例数据、训练模型、评分）
#   4. 启动后端服务 (FastAPI)
#   5. 启动前端开发服务 (Vite + React)
# ================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo ""
echo "================================================================"
echo "🏥  门诊爽约风险提醒AI平台 - 启动脚本"
echo "================================================================"
echo ""

cd "$PROJECT_ROOT"

# ---------------- 1. 创建并激活 Python 虚拟环境 ----------------
echo "📦 [1/6] 检查 Python 环境..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "   创建虚拟环境..."
    python3 -m venv venv || python -m venv venv
fi

source venv/bin/activate || {
    echo "   Windows 环境，请手动激活虚拟环境"
    echo "   命令: venv\Scripts\activate"
}

echo "   安装 Python 依赖 (首次运行可能需要几分钟)..."
pip install --upgrade pip -q 2>/dev/null
pip install -r requirements.txt -q 2>&1 | tail -5
echo "   ✅ Python 依赖安装完成"

# ---------------- 2. 运行系统初始化 ----------------
echo ""
echo "🚀 [2/6] 系统初始化（导入示例数据 + 训练模型 + 批量评分）..."
cd "$SCRIPT_DIR"
python init_system.py || {
    echo "   ⚠️  初始化可能已执行过，跳过..."
}

# ---------------- 3. 安装前端依赖 ----------------
echo ""
echo "📦 [3/6] 安装前端 Node.js 依赖..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "   安装 npm 依赖 (首次运行需要较长时间)..."
    npm install --no-audit --no-fund --loglevel=error 2>&1 | tail -10
else
    echo "   node_modules 已存在，跳过安装"
fi
echo "   ✅ 前端依赖就绪"

# ---------------- 4. 清理旧进程 ----------------
echo ""
echo "🧹 [4/6] 清理旧进程..."
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# ---------------- 5. 启动后端 ----------------
echo ""
echo "🔧 [5/6] 启动后端服务 (端口: 8000)..."
cd "$BACKEND_DIR"
source venv/bin/activate

if command -v lsof >/dev/null 2>&1; then
    if lsof -i :8000 >/dev/null 2>&1; then
        echo "   ⚠️  端口 8000 已被占用，请先关闭占用进程"
    fi
fi

mkdir -p logs
nohup python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"
echo "   日志文件: $BACKEND_DIR/logs/backend.log"

# ---------------- 6. 启动前端 ----------------
echo ""
echo "🎨 [6/6] 启动前端开发服务 (端口: 5173)..."
cd "$FRONTEND_DIR"

nohup npx vite --host 0.0.0.0 --port 5173 > "$BACKEND_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"
echo "   日志文件: $BACKEND_DIR/logs/frontend.log"

# ---------------- 等待服务就绪 ----------------
echo ""
echo "⏳ 等待服务启动..."
MAX_WAIT=60
WAITED=0
BACKEND_READY=0
FRONTEND_READY=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if [ $BACKEND_READY -eq 0 ] && curl -s http://localhost:8000/health >/dev/null 2>&1; then
        BACKEND_READY=1
        echo "   ✅ 后端服务已就绪 (http://localhost:8000)"
        echo "   📚 API 文档: http://localhost:8000/docs"
    fi
    if [ $FRONTEND_READY -eq 0 ] && curl -s http://localhost:5173 >/dev/null 2>&1; then
        FRONTEND_READY=1
        echo "   ✅ 前端服务已就绪 (http://localhost:5173)"
    fi
    if [ $BACKEND_READY -eq 1 ] && [ $FRONTEND_READY -eq 1 ]; then
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

# ---------------- 完成 ----------------
echo ""
echo "================================================================"
echo "🎉🎉🎉  系统启动成功！"
echo "================================================================"
echo ""
echo "🌐 访问地址:"
echo "   前端工作台:  http://localhost:5173"
echo "   后端 API:    http://localhost:8000"
echo "   API 文档:    http://localhost:8000/docs"
echo ""
echo "🔑 演示账号:"
echo "   管理员:     admin / admin123        (全部权限)"
echo "   运营人员:   operator / operator123  (数据导入/评分/反馈)"
echo "   数据科学家: datascientist / ds123456 (模型训练/管理)"
echo ""
echo "📝 功能清单:"
echo "   ✅ 数据导入：科室、时段、预约记录（CSV/XLSX/JSON）"
echo "   ✅ LightGBM 模型：特征工程、训练、评估、版本管理"
echo "   ✅ 风险评分：批量推理、SHAP解释、人工覆盖改标"
echo "   ✅ 短信策略：分级模板、差异化发送、发送记录"
echo "   ✅ 回访名单：智能生成、状态追踪、结果记录"
echo "   ✅ 反馈闭环：改标记录、批量复核、错误样本库"
echo "   ✅ 效果看板：KPI指标、趋势图、分布图、错误分析"
echo "   ✅ 模型管理：训练/评估/审核/上线/回滚全流程"
echo "   ✅ 权限隔离：三种角色、不同功能可见性"
echo "   ✅ 合规性：不涉及诊断、过滤歧视性字段、全程留痕"
echo ""
echo "🛑 停止服务:"
echo "   按 Ctrl+C 或执行: kill $BACKEND_PID $FRONTEND_PID"
echo "   或运行: bash $SCRIPT_DIR/stop.sh"
echo "================================================================"

echo "$BACKEND_PID" > "$BACKEND_DIR/logs/backend.pid"
echo "$FRONTEND_PID" > "$BACKEND_DIR/logs/frontend.pid"

# 保持进程运行，显示日志
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

echo ""
echo "📋 实时日志 (Ctrl+C 退出但不停止服务):"
echo "================================================================"

if command -v multitail >/dev/null 2>&1; then
    multitail "$BACKEND_DIR/logs/backend.log" "$BACKEND_DIR/logs/frontend.log"
elif command -v tail >/dev/null 2>&1; then
    tail -f "$BACKEND_DIR/logs/backend.log" "$BACKEND_DIR/logs/frontend.log"
fi
