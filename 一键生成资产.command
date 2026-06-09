#!/bin/zsh
# =============================================================================
#  旧公寓谜案 · 一键生成全部游戏资产 (macOS)
#
#  使用方法:
#    1. 确保本机已通过 Epic Games Launcher 安装了 Unreal Engine 5.3
#    2. 双击本文件 (.command)，等待 1-3 分钟
#    3. 看到 "DONE! All assets generated successfully!" 即成功
#    4. 关闭 UE，重新打开项目 (让新蓝图类加载)
#    5. 点 Play 即可游玩
#
#  生成内容: 8张关卡 + 15张蓝图 + 30张WBP + 13 Input + 4 DataAsset
# =============================================================================

set -e

# --- 切换到脚本所在目录 (即工程根目录) ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
echo "→ 工程目录: $SCRIPT_DIR"

# --- 查找 .uproject 文件 ---
UPROJECT=$(ls *.uproject 2>/dev/null | head -1)
if [ -z "$UPROJECT" ]; then
    echo "❌ 错误: 当前目录没有找到 .uproject 文件!"
    echo "   请把本脚本复制到工程根目录再运行。"
    exit 1
fi
echo "→ 找到工程文件: $UPROJECT"

# --- Python 脚本路径 ---
PYTHON_SCRIPT="$SCRIPT_DIR/Content/Python/auto_generate_assets.py"
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "❌ 错误: 找不到 Python 生成脚本!"
    echo "   期望位置: $PYTHON_SCRIPT"
    exit 1
fi
echo "→ Python 脚本: Content/Python/auto_generate_assets.py"

# --- 自动查找 Unreal Engine 5.3 的安装路径 ---
UE_EDITOR=""
CANDIDATES=(
    "/Users/Shared/Epic Games/UE_5.3/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor"
    "/Users/Shared/Epic Games/UE_5.3/Engine/Binaries/Mac/UnrealEditor"
    "/Applications/UE_5.3/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor"
    "/Applications/Unreal Engine 5.3/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor"
    "/Volumes/*/Epic Games/UE_5.3/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor"
)

echo ""
echo "🔍 正在本机搜索 Unreal Engine 5.3 ..."
for CANDIDATE in "${CANDIDATES[@]}"; do
    if ls $CANDIDATE 2>/dev/null | head -1 | read found_path; [ -f "$found_path" ]; then
        UE_EDITOR="$found_path"
        echo "  ✓ 找到候选: $found_path"
        break
    fi
done

# 如果还没找到，再用 mdfind 全局搜索
if [ -z "$UE_EDITOR" ]; then
    echo "  (mdfind 全局搜索中，请稍候...)"
    while IFS= read -r app_path; do
        exe="$app_path/Contents/MacOS/UnrealEditor"
        # 只优先选择 UE_5.3 的
        if [[ "$app_path" == *"UE_5.3"* ]] && [ -f "$exe" ]; then
            UE_EDITOR="$exe"
            echo "  ✓ 找到候选 (5.3优先): $exe"
            break
        fi
        if [ -z "$UE_EDITOR" ] && [ -f "$exe" ]; then
            UE_EDITOR="$exe"  # 先记住第一个，等5.3
        fi
    done < <(mdfind "kMDItemCFBundleIdentifier == 'com.epicgames.UnrealEditor'" 2>/dev/null | head -10)
fi

# --- 如果仍找不到，报错并提示手动操作 ---
if [ -z "$UE_EDITOR" ] || [ ! -f "$UE_EDITOR" ]; then
    echo ""
    echo "⚠️  未能自动找到 Unreal Engine 5.3 的安装位置。"
    echo ""
    echo "请按以下手动步骤生成资产："
    echo "────────────────────────────────────────────────────────"
    echo "  1. 在 Epic Games Launcher 中启动 Unreal Engine 5.3"
    echo "  2. 选择工程文件: $UPROJECT"
    echo "  3. 等待 C++ 编译完成（Output Log 无红色错误）"
    echo "  4. 顶部菜单: Window → Python → Execute Script"
    echo "  5. 选择文件: Content/Python/auto_generate_assets.py"
    echo "  6. 等待 Output Log 显示: ✅ DONE! All assets..."
    echo "  7. 关闭编辑器 → 重新打开项目 → 点 ▶ Play"
    echo "────────────────────────────────────────────────────────"
    echo ""
    echo "💡 零资产快速体验方案（无需生成资产）："
    echo "   直接编译完成后点 Play，C++ 内置的动态生成系统会兜底创建所有内容。"
    exit 2
fi

echo ""
echo "✅ 找到 UnrealEditor 可执行文件:"
echo "   $UE_EDITOR"

# --- 正式调用 UE 命令行执行 Python 脚本 ---
echo ""
echo "🚀 正在启动 Unreal Editor，并执行资产生成脚本..."
echo "   预计耗时: 1-3 分钟，请耐心等待..."
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " UE 命令行执行日志 (下方):"
echo "═══════════════════════════════════════════════════════════"

# UE 命令行语法:
#   UnrealEditor <uproject> -run=pythonscript -script="<py_path>"
# 用引号正确处理路径中的空格
"$UE_EDITOR" "$SCRIPT_DIR/$UPROJECT" \
    -run=pythonscript \
    -script="$PYTHON_SCRIPT"

EXIT_CODE=$?
echo "═══════════════════════════════════════════════════════════"

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅✅✅  UE 命令行执行完成 (exit=$EXIT_CODE)"
    echo ""
    echo "接下来的步骤:"
    echo "  1. 如果 UE 编辑器窗口已关闭 → 重新打开工程"
    echo "  2. 如果 UE 编辑器窗口仍在 → 关闭 → 重新打开"
    echo "     (重启目的: 让新蓝图类 /Game/Blueprints/ 加载)"
    echo "  3. Content Browser 打开 Maps/Levels/ "
    echo "     → 双击 MainMenu.umap → 点 ▶ Play"
    echo ""
    echo "🎮  默认操作:"
    echo "   WASD 移动 | 鼠标视角 | E 交互 | F 谜题"
    echo "   Tab 笔记 | Esc 暂停 | T 手电筒 | R 调试结算"
    echo "   💡 拨号锁答案: 0817"
    echo ""
else
    echo ""
    echo "❌ UE 命令行返回错误代码: $EXIT_CODE"
    echo ""
    echo "建议按手动步骤执行（见上方说明）。"
fi

exit 0
