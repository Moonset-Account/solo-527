#!/bin/bash
# =====================================================
# 🎮 社团活动战术棋 - 一键启动脚本 (macOS/Linux)
# 无需导出模板，直接用 Godot 运行项目
# =====================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if command -v godot >/dev/null 2>&1; then
    echo "🎯 正在启动 社团活动战术棋..."
    echo "📂 项目目录: $SCRIPT_DIR"
    echo "🎮 如果看到黑窗或 Godot Editor 弹窗，请直接在其中运行游戏"
    echo ""
    # --no-window 不行，需要图形界面
    # 用f6/e运行的方式需要先运行editor再按f5
    # 直接运行主场景:
    if [ -f "scenes/Main.tscn" ]; then
        exec godot --path "$SCRIPT_DIR" scenes/Main.tscn "$@"
    elif [ -f "project.godot" ]; then
        exec godot --path "$SCRIPT_DIR" "$@"
    else
        echo "❌ 找不到 project.godot！请确认此脚本在项目根目录运行"
        exit 1
    fi
else
    echo "❌ 未找到 godot 命令"
    echo ""
    echo "请先安装 Godot Engine 4.2+: https://godotengine.org/download"
    echo "macOS: brew install --cask godot"
    echo "或下载 Godot 后将其加入 PATH 环境变量"
    exit 1
fi
