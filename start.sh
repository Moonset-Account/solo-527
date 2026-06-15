#!/bin/bash

echo "🦷 口腔诊所排班核销系统 - 启动脚本"
echo "=============================================="

export PYTHONPATH=$(pwd)

echo "检查依赖..."
pip install -r requirements.txt -q

echo ""
echo "启动服务..."
echo "访问地址: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
