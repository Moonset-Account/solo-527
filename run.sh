#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== Packing Puzzle - 启动游戏 ==="
echo "项目目录: $PROJECT_DIR"
echo ""
echo "启动游戏模式..."
godot --path "$PROJECT_DIR"
