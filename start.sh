#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=============================================="
echo "工程材料供应商准入管理系统"
echo "=============================================="

check_python() {
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python3 未安装，请先安装 Python 3.11+"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    echo "✅ Python 版本: $PYTHON_VERSION"
}

check_venv() {
    if [ ! -d ".venv" ]; then
        echo "📦 创建虚拟环境..."
        python3 -m venv .venv
        echo "✅ 虚拟环境创建完成"
    fi
    
    source .venv/bin/activate
    echo "✅ 虚拟环境已激活"
}

install_dependencies() {
    echo "📦 安装依赖包..."
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    echo "✅ 依赖包安装完成"
}

init_database() {
    if [ ! -f ".db_initialized" ]; then
        echo "🗄️  初始化数据库..."
        python3 app/init_db.py
        touch .db_initialized
        echo "✅ 数据库初始化完成"
    else
        echo "⏭️  数据库已初始化，跳过"
    fi
}

start_server() {
    echo ""
    echo "🚀 启动服务..."
    echo "📱 访问地址: http://localhost:8000"
    echo ""
    echo "默认账号:"
    echo "  管理员: admin / admin123"
    echo "  经理: manager / manager123"
    echo "  审核员: auditor / auditor123"
    echo "  采购员: buyer / buyer123"
    echo ""
    echo "按 Ctrl+C 停止服务"
    echo "=============================================="
    echo ""
    
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

main() {
    check_python
    check_venv
    install_dependencies
    init_database
    start_server
}

main "$@"
