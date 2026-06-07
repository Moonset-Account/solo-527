#!/bin/bash

echo "=========================================="
echo "  健身房会员训练留存分析系统 - 启动脚本"
echo "=========================================="

echo ""
echo "选择启动模式："
echo "1. 仅启动前端（使用Mock数据）"
echo "2. 启动完整栈（需要Docker运行中）"
echo "3. 仅安装依赖"
read -p "请输入选项 [1-3]: " choice

case $choice in
  1)
    echo ""
    echo "启动前端（Mock数据模式）..."
    cd frontend
    if [ ! -d "node_modules" ]; then
      echo "安装前端依赖..."
      npm install
    fi
    echo "前端将在 http://localhost:3000 启动"
    npm run dev
    ;;
  2)
    echo ""
    echo "启动完整栈..."
    
    echo "启动数据库和Redis..."
    docker-compose up -d
    
    echo ""
    echo "安装后端依赖..."
    cd backend
    if [ ! -d "venv" ]; then
      python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    
    echo ""
    echo "生成模拟数据..."
    PYTHONPATH=. python data/generate_mock_data.py
    
    echo ""
    echo "启动后端API..."
    echo "API文档: http://localhost:8000/docs"
    PYTHONPATH=. python -m uvicorn main:app --reload --port 8000 &
    BACKEND_PID=$!
    
    echo ""
    echo "安装前端依赖..."
    cd ../frontend
    if [ ! -d "node_modules" ]; then
      npm install
    fi
    
    echo ""
    echo "修改API配置为真实模式..."
    sed -i '' 's/const USE_MOCK = true;/const USE_MOCK = false;/' src/services/api.ts
    
    echo ""
    echo "启动前端..."
    echo "前端地址: http://localhost:3000"
    npm run dev
    
    wait $BACKEND_PID
    ;;
  3)
    echo ""
    echo "安装所有依赖..."
    
    echo "安装后端依赖..."
    cd backend
    if [ ! -d "venv" ]; then
      python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    
    echo ""
    echo "安装前端依赖..."
    cd ../frontend
    npm install
    
    echo ""
    echo "依赖安装完成！"
    ;;
  *)
    echo "无效选项"
    exit 1
    ;;
esac
