#!/bin/bash
set -e

echo "=== 母婴会员复购营销系统 ==="

echo ""
echo "[1/4] Creating virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

echo ""
echo "[2/4] Activating venv and installing dependencies..."
source .venv/bin/activate
pip install -r requirements.txt

echo ""
echo "[3/4] Initializing database..."
python init_db.py

echo ""
echo "[4/4] Starting server..."
python run.py
