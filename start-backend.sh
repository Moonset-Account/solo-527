#!/bin/bash

cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "安装 Python 依赖..."
pip install -r requirements.txt

echo "初始化数据库表结构..."
python -c "
from app.core.database import engine, Base
from app.models import Book, RecycleRecord, PricingHistory, SaleRecord
Base.metadata.create_all(bind=engine)
print('数据库表创建完成')
"

read -p "是否生成测试数据？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "生成测试数据..."
    python data/seed_data.py
fi

echo "启动后端服务 (http://localhost:8000)..."
echo "API 文档: http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
