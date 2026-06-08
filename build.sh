#!/usr/bin/env bash
# 搬家大师 - 装箱挑战 构建脚本 v0.9
# Godot 4.x Build Automation Script
set -e

GODOT_BIN="/Applications/Godot.app/Contents/MacOS/Godot"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${PROJECT_DIR}/builds"
VERSION="0.9.0-beta"

echo "======================================"
echo "  搬家大师 - 装箱挑战 构建系统 v${VERSION}"
echo "======================================"

mkdir -p "${BUILD_DIR}/MacOS"
mkdir -p "${BUILD_DIR}/Windows"
mkdir -p "${BUILD_DIR}/Linux"
mkdir -p "${BUILD_DIR}/Web"
mkdir -p "${BUILD_DIR}/Android"

if [ ! -f "${GODOT_BIN}" ]; then
    echo "⚠️  未找到 Godot 可执行文件：${GODOT_BIN}"
    echo "   请修改脚本中的 GODOT_BIN 变量为实际路径"
    echo "   或使用命令: brew install --cask godot"
    exit 1
fi

echo ""
echo "[1/7] 验证 Godot 版本..."
"${GODOT_BIN}" --version
echo "✓ Godot 已就绪"

echo ""
echo "[2/7] 验证项目配置..."
if [ ! -f "${PROJECT_DIR}/project.godot" ]; then
    echo "✗ project.godot 不存在！"
    exit 1
fi
if [ ! -f "${PROJECT_DIR}/config/levels.tres" ]; then
    echo "✗ 关卡配置文件缺失！"
    exit 1
fi
if [ ! -f "${PROJECT_DIR}/config/item_database.tres" ]; then
    echo "✗ 物品数据库缺失！"
    exit 1
fi
echo "✓ 配置文件齐全"

echo ""
echo "[3/7] 核心系统自检..."
CHECK_FILES=(
    "scripts/GameManager.gd"
    "scripts/LevelManager.gd"
    "scripts/PackableItem.gd"
    "scripts/PackingContainer.gd"
    "scripts/AudioManager.gd"
    "scripts/SaveManager.gd"
    "scripts/InputManager.gd"
    "scripts/UIManager.gd"
    "scripts/PlaySessionRecorder.gd"
    "scripts/DebugPanel.gd"
    "scripts/GameHUD.gd"
    "scripts/ResultScreen.gd"
)
MISSING=0
for f in "${CHECK_FILES[@]}"; do
    if [ ! -f "${PROJECT_DIR}/${f}" ]; then
        echo "  ✗ 缺失：${f}"
        MISSING=$((MISSING + 1))
    fi
done
if [ ${MISSING} -gt 0 ]; then
    echo "✗ 缺失 ${MISSING} 个核心文件！"
    exit 1
fi
echo "✓ 核心脚本完整"

echo ""
echo "[4/7] 场景文件检查..."
SCENES=(
    "scenes/MainMenu.tscn"
    "scenes/LevelSelect.tscn"
    "scenes/GameScene.tscn"
)
for s in "${SCENES[@]}"; do
    if [ ! -f "${PROJECT_DIR}/${s}" ]; then
        echo "  ✗ 缺失场景：${s}"
        exit 1
    fi
done
echo "✓ 场景文件完整"

BUILD_TARGET="${1:-all}"

echo ""
echo "[5/7] 开始构建目标: ${BUILD_TARGET}"

build_macos() {
    echo "→ 构建 macOS 版本..."
    "${GODOT_BIN}" --headless --path "${PROJECT_DIR}" \
        --export-release "macOS" "${BUILD_DIR}/MacOS/搬家大师-MacOS-v${VERSION}.app"
    echo "✓ macOS 构建完成"
}

build_windows() {
    echo "→ 构建 Windows 版本..."
    "${GODOT_BIN}" --headless --path "${PROJECT_DIR}" \
        --export-release "Windows Desktop" "${BUILD_DIR}/Windows/搬家大师-Windows-v${VERSION}.exe"
    echo "✓ Windows 构建完成"
}

build_linux() {
    echo "→ 构建 Linux 版本..."
    "${GODOT_BIN}" --headless --path "${PROJECT_DIR}" \
        --export-release "Linux" "${BUILD_DIR}/Linux/搬家大师-Linux-v${VERSION}.x86_64"
    echo "✓ Linux 构建完成"
}

build_web() {
    echo "→ 构建 Web 版本..."
    "${GODOT_BIN}" --headless --path "${PROJECT_DIR}" \
        --export-release "Web" "${BUILD_DIR}/Web/搬家大师-Web-v${VERSION}.html"
    echo "✓ Web 构建完成"
}

build_android() {
    echo "→ 构建 Android 版本 (需要额外配置)..."
    "${GODOT_BIN}" --headless --path "${PROJECT_DIR}" \
        --export-release "Android" "${BUILD_DIR}/Android/搬家大师-Android-v${VERSION}.apk"
    echo "✓ Android 构建完成"
}

case "${BUILD_TARGET}" in
    macos|mac)
        build_macos
        ;;
    windows|win)
        build_windows
        ;;
    linux)
        build_linux
        ;;
    web)
        build_web
        ;;
    android)
        build_android
        ;;
    all)
        build_macos
        build_windows
        build_linux
        build_web
        ;;
    none|skip)
        echo "→ 跳过实际构建步骤（仅验证）"
        ;;
    *)
        echo "✗ 未知目标：${BUILD_TARGET}"
        echo "   可用: macos / windows / linux / web / android / all / none"
        exit 1
        ;;
esac

echo ""
echo "[6/7] 生成版本清单..."
MANIFEST_PATH="${BUILD_DIR}/manifest.txt"
cat > "${MANIFEST_PATH}" << EOF
搬家大师 - 装箱挑战 测试版 Build Manifest
=========================================
版本: ${VERSION}
构建时间: $(date '+%Y-%m-%d %H:%M:%S')
Godot 版本: $("${GODOT_BIN}" --version)
关卡数: 8
物品数: 23
Autoload 单例: 6
核心脚本数: ${#CHECK_FILES[@]}
场景数: ${#SCENES[@]}

核心系统清单:
- 物品系统: PackableItem.gd (23种物品配置)
- 容器系统: PackingContainer.gd (边界/重量/碰撞判定)
- 关卡管理: LevelManager.gd (放置校验/连击/撤销重做)
- 全局状态: GameManager.gd (状态机/评分/解锁)
- 输入系统: InputManager.gd (鼠标/键盘/手柄/触屏/捏合手势)
- 音频系统: AudioManager.gd (程序化合成SFX + 音乐)
- 存档系统: SaveManager.gd (玩家进度/统计/设置)
- UI 系统: UIManager.gd (Toast/弹窗/文字动画)
- 录制系统: PlaySessionRecorder.gd (试玩过程记录)
- HUD 界面: GameHUD.gd
- 结算界面: ResultScreen.gd
- 调试面板: DebugPanel.gd (生成物品/改参数/导出日志)

输入映射:
- 鼠标左键拖拽物品
- 滚轮或 Q/E 旋转 15°
- Ctrl+Z 撤销 / Ctrl+Shift+Z 重做
- 空格或回车提交过关
- R 重置关卡 / ESC 暂停
- Shift+F1 或 Shift+Tab 打开调试面板
- 手柄：A提交/X撤销/Y重置/LR肩键旋转
- 触屏：单指拖拽、双击旋转、双指捏合
EOF
cat "${MANIFEST_PATH}"

echo ""
echo "[7/7] 构建完成！构建产物位于: ${BUILD_DIR}"
echo ""
echo "🎮 快速启动调试："
echo "   ${GODOT_BIN} --path ${PROJECT_DIR}"
echo ""
echo "📋 试玩注意事项:"
echo "   1. 每局结束会自动记录用时/失败/关键选择到 user://play_sessions.json"
echo "   2. 调试面板可导出详细会话日志 (JSON格式)"
echo "   3. 存档位于 user://savegame.cfg"
echo ""
echo "版本 ${VERSION} - 发布测试版"
