#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🎲 正在生成演示数据..."
echo "⚠️  演示数据会标记 is_demo=true，不会计入正式报表"

source venv/bin/activate 2>/dev/null || true
python -m scripts.seed_demo

echo ""
echo "✅ 完成！"
