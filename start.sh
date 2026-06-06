#!/bin/bash

set -e

echo "========================================"
echo "  招聘流程效率仪表盘 - 启动脚本"
echo "========================================"

MODE=${1:-"dash"}
ENV_FILE=".env"

backup_env() {
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "${ENV_FILE}.bak"
    fi
}

set_db_config() {
    local db_mode=$1
    local db_url=$2

    if [ "$db_mode" = "timescaledb" ]; then
        DB_URL="postgresql://postgres:password@localhost:5432/recruitment_db"
    else
        DB_URL="sqlite:///data/recruitment.db"
    fi

    if [ -n "$db_url" ]; then
        DB_URL="$db_url"
    fi

    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${DB_URL}|" "$ENV_FILE"
    sed -i.bak "s|^DATABASE_MODE=.*|DATABASE_MODE=${db_mode}|" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"

    echo "   数据库模式: ${db_mode}"
    echo "   数据库地址: ${DB_URL}"
}

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

backup_env

if [ "$MODE" = "timescaledb" ]; then
    echo ""
    echo "🗄️  切换到 TimescaleDB 模式..."
    set_db_config "timescaledb"

    echo ""
    echo "🐳 启动 TimescaleDB 容器..."
    if ! docker-compose ps timescaledb | grep -q "Up"; then
        docker-compose up -d timescaledb
        echo "   等待数据库启动（约 15 秒）..."
        for i in {1..15}; do
            sleep 1
            if docker exec recruitment-timescaledb pg_isready -U postgres -h localhost 2>/dev/null | grep -q "accepting"; then
                echo "   ✅ 数据库已就绪"
                break
            fi
            echo -n "."
        done
    else
        echo "   ✅ TimescaleDB 已在运行"
    fi

    echo ""
    echo "� 初始化数据库表结构和数据..."
    python generate_data.py

    echo ""
    echo "🌐 启动 API 服务器 (端口 5000)..."
    python api_server.py &
    API_PID=$!
    echo "   API 服务器 PID: $API_PID"
    sleep 3

    if kill -0 $API_PID 2>/dev/null; then
        echo "   ✅ API 服务器已启动"
        echo "   健康检查: http://localhost:5000/api/health"
    else
        echo "   ❌ API 服务器启动失败"
        exit 1
    fi
fi

if [ "$MODE" = "api" ]; then
    echo ""
    echo "🗄️  保持当前数据库配置..."

    echo ""
    echo "📊 初始化数据..."
    python generate_data.py

    echo ""
    echo "🌐 启动 API 服务器 (端口 5000)..."
    python api_server.py &
    API_PID=$!
    echo "   API 服务器 PID: $API_PID"
    sleep 3

    if kill -0 $API_PID 2>/dev/null; then
        echo "   ✅ API 服务器已启动"
        echo "   健康检查: http://localhost:5000/api/health"
    else
        echo "   ❌ API 服务器启动失败"
        exit 1
    fi
fi

if [ "$MODE" = "dash" ]; then
    echo ""
    echo "🗄️  使用 SQLite 本地模式..."
    set_db_config "sqlite"

    echo ""
    echo "📊 初始化数据..."
    python generate_data.py
fi

echo ""
echo "🚀 启动仪表盘应用..."
echo "   访问地址: http://localhost:8050"
echo ""
echo "   使用说明:"
echo "   - 点击图表可下钻查看候选人明细"
echo "   - 点击 '数据校验' 查看数据质量报告"
echo "   - 点击 '导出报告' 下载 Excel 报告"
echo ""
echo "   API 接口:"
echo "   - GET  http://localhost:5000/api/health"
echo "   - GET  http://localhost:5000/api/dimensions"
echo "   - POST http://localhost:5000/api/funnel"
echo "   - POST http://localhost:5000/api/stage-duration"
echo "   - POST http://localhost:5000/api/channel-quality"
echo "   - POST http://localhost:5000/api/interviewer-workload"
echo "   - POST http://localhost:5000/api/feedback"
echo "   - POST http://localhost:5000/api/summary"
echo ""

if [ "$MODE" = "api" ] || [ "$MODE" = "timescaledb" ]; then
    trap "echo ''; echo '🛑 正在停止服务...'; kill $API_PID 2>/dev/null; wait $API_PID 2>/dev/null; echo '✅ 已停止'; exit" INT TERM EXIT
fi

python app.py
