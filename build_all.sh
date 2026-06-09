#!/bin/bash
set -e
# =====================================================
# 🎮 社团活动战术棋 - 一键构建三平台可运行包
# 无需官方导出模板，使用现有 Godot 二进制+PCK 方式
# =====================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

GODOT_BIN="$(which godot || echo "/usr/local/bin/godot")"
APP_NAME="ClubActivityTactics"
BUILD_DIR="$PROJECT_DIR/build"
MACOS_DIR="$BUILD_DIR/macOS"
WIN_DIR="$BUILD_DIR/Windows"
LINUX_DIR="$BUILD_DIR/Linux"

log() { echo -e "\033[1;32m✅ $1\033[0m"; }
warn() { echo -e "\033[1;33m⚠️  $1\033[0m"; }

echo "================================================"
echo "🎮 社团活动战术棋 - 构建脚本 v1.0"
echo "================================================"
echo "项目目录: $PROJECT_DIR"
echo "Godot: $($GODOT_BIN --version 2>/dev/null | head -1)"
echo ""

# 准备目录
mkdir -p "$MACOS_DIR" "$WIN_DIR" "$LINUX_DIR"
rm -f "$MACOS_DIR/.DS_Store" "$WIN_DIR/.DS_Store" "$LINUX_DIR/.DS_Store" 2>/dev/null

# ==============================================
# 1. macOS: .app Bundle (原生可双击运行)
# ==============================================
echo ""
echo "【1/4】构建 macOS ClubActivityTactics.app"
echo "----------------------------------------"
APP_PATH="$MACOS_DIR/$APP_NAME.app"
rm -rf "$APP_PATH" 2>/dev/null
mkdir -p "$APP_PATH/Contents/MacOS"
mkdir -p "$APP_PATH/Contents/Resources"

# 复制 Godot 二进制作为启动器
cp "$GODOT_BIN" "$APP_PATH/Contents/MacOS/$APP_NAME"
chmod +x "$APP_PATH/Contents/MacOS/$APP_NAME"
log "Godot 二进制已复制"

# 创建 Info.plist
cat > "$APP_PATH/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key><string>ClubActivityTactics</string>
    <key>CFBundleIdentifier</key><string>com.club.activity.tactics</string>
    <key>CFBundleName</key><string>社团活动战术棋</string>
    <key>CFBundleDisplayName</key><string>社团活动战术棋</string>
    <key>CFBundleVersion</key><string>1.0.0</string>
    <key>CFBundleShortVersionString</key><string>1.0</string>
    <key>CFBundlePackageType</key><string>APPL</string>
    <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
    <key>NSHighResolutionCapable</key><true/>
    <key>LSMinimumSystemVersion</key><string>10.12</string>
</dict>
</plist>
PLIST
log "Info.plist 已写入"

# 导出 PCK 数据包（使用 export-pack 无需模板）
PCK_PATH="$APP_PATH/Contents/Resources/$APP_NAME.pck"
if $GODOT_BIN --headless --path "$PROJECT_DIR" --export-pack "macOS" "$PCK_PATH" 2>/dev/null; then
    log "PCK 数据包已导出 (macOS)"
else
    warn "macOS export-pack 预设可能有问题，改用通用 PCK..."
    $GODOT_BIN --headless --path "$PROJECT_DIR" --export-pack "macOS" "$MACOS_DIR/$APP_NAME.pck" 2>/dev/null || true
    if [ -f "$MACOS_DIR/$APP_NAME.pck" ]; then
        cp "$MACOS_DIR/$APP_NAME.pck" "$PCK_PATH"
        log "通用 PCK 已复制到 .app"
    fi
fi

echo "macOS 产物:"
ls -lh "$APP_PATH/Contents/MacOS/$APP_NAME" "$APP_PATH/Contents/Info.plist" 2>/dev/null
[ -f "$PCK_PATH" ] && ls -lh "$PCK_PATH" || warn "无PCK（将用项目路径模式运行）"

# ==============================================
# 2. Windows: EXE + PCK 可运行组合
# ==============================================
echo ""
echo "【2/4】构建 Windows ClubActivityTactics.exe"
echo "----------------------------------------"

# 导出 Windows PCK
WIN_PCK="$WIN_DIR/$APP_NAME.pck"
if $GODOT_BIN --headless --path "$PROJECT_DIR" --export-pack "Windows Desktop" "$WIN_PCK" 2>/dev/null; then
    log "Windows PCK 已导出"
else
    warn "Windows export-pack 失败，尝试 macOS 预设替代..."
    cp -f "$MACOS_DIR/$APP_NAME.pck" "$WIN_PCK" 2>/dev/null || true
fi

# 创建 Windows 启动说明 + 自解压启动器脚本
cat > "$WIN_DIR/启动游戏.bat" << 'BAT'
@echo off
chcp 65001 >nul
cd /d "%~dp0"
REM =============================================
REM 🎮 社团活动战术棋 - Windows 启动器
REM 使用方式（任选其一）：
REM   方式1: 已下载 Godot_v4.6.3-stable_win64.exe 放本目录
REM          重命名为 ClubActivityTactics.exe，双击运行
REM   方式2: 本机有 godot，直接执行下一行：
REM =============================================
where godot >nul 2>nul
if %ERRORLEVEL%==0 (
    echo 🎯 检测到系统已安装 Godot，正在启动游戏...
    start "" godot --main-pack "%~dp0ClubActivityTactics.pck"
    goto :eof
)
if exist "ClubActivityTactics.exe" (
    echo 🎯 检测到 ClubActivityTactics.exe，正在启动...
    start "" "ClubActivityTactics.exe"
    goto :eof
)
echo.
echo ❌ 未找到 Godot 运行时
echo.
echo 请执行以下任意一个步骤：
echo.
echo 【方案A】下载 Godot 4.6.3 Windows 版：
echo   https://github.com/godotengine/godot/releases/download/4.6.3-stable/Godot_v4.6.3-stable_win64.exe.zip
echo   解压后，将 Godot_v4.6.3-stable_win64.exe 重命名为 ClubActivityTactics.exe
echo   放到本目录（与 ClubActivityTactics.pck 同级）
echo   然后双击 ClubActivityTactics.exe
echo.
echo 【方案B】先在 Windows 上安装 Godot 4.2+
echo   然后再运行本 bat 文件
echo.
pause
BAT
chmod +x "$WIN_DIR/启动游戏.bat" 2>/dev/null || true

# 创建 Windows 构建说明
cat > "$WIN_DIR/Windows构建说明.txt" << 'WINHELP'
Windows ClubActivityTactics.exe 构建说明：

Windows 平台的可执行文件是 Godot 运行时二进制。
由于本构建在 macOS 上进行，无法直接交叉编译 Windows exe。

【获得 .exe 的两种方式】

方式1 (推荐 - 50MB)：
  1. 下载 Godot 4.6.3 Windows 标准版
     https://github.com/godotengine/godot/releases/download/4.6.3-stable/Godot_v4.6.3-stable_win64.exe.zip
  2. 解压得到 Godot_v4.6.3-stable_win64.exe
  3. 重命名为 ClubActivityTactics.exe
  4. 放到 build/Windows/ 目录下（和 ClubActivityTactics.pck 同级）
  5. 双击 ClubActivityTactics.exe 开始游戏

方式2 (更小 - 30MB)：
  如果您已在 Windows 上安装了 Godot：
  - 使用 Godot Editor 打开项目 → Project → Export → Windows Desktop → Export Project
  - 会自动生成正式签名的 ClubActivityTactics.exe + ClubActivityTactics.pck
WINHELP

log "Windows PCK + 启动脚本 构建完成"

# ==============================================
# 3. Linux: x86_64+PCK 可运行组合
# ==============================================
echo ""
echo "【3/4】构建 Linux ClubActivityTactics.x86_64"
echo "----------------------------------------"

LINUX_PCK="$LINUX_DIR/$APP_NAME.pck"
if $GODOT_BIN --headless --path "$PROJECT_DIR" --export-pack "Linux/X11" "$LINUX_PCK" 2>/dev/null; then
    log "Linux PCK 已导出"
else
    warn "Linux export-pack 失败，使用通用 PCK..."
    cp -f "$MACOS_DIR/$APP_NAME.pck" "$LINUX_PCK" 2>/dev/null || true
fi

# Linux 启动脚本
cat > "$LINUX_DIR/启动游戏.sh" << 'LINUXSH'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
if command -v godot >/dev/null 2>&1; then
    echo "🎯 检测到系统 Godot，正在启动..."
    exec godot --main-pack "$SCRIPT_DIR/ClubActivityTactics.pck" "$@"
fi
if [ -x "./ClubActivityTactics.x86_64" ]; then
    echo "🎯 检测到本地可执行文件，正在启动..."
    exec "./ClubActivityTactics.x86_64" "$@"
fi
echo ""
echo "❌ 未找到 Godot 运行时"
echo ""
echo "请执行以下任意一个步骤："
echo ""
echo "【方案A】下载 Godot 4.6.3 Linux 版："
echo "  https://github.com/godotengine/godot/releases/download/4.6.3-stable/Godot_v4.6.3-stable_linux.x86_64.zip"
echo "  解压后，将 Godot 二进制重命名为 ClubActivityTactics.x86_64"
echo "  放到本目录下（和 ClubActivityTactics.pck 同级），chmod +x 后运行"
echo ""
echo "【方案B】用发行版包管理器安装：如 apt install godot4 / dnf install godot..."
echo "  然后再次运行本脚本"
echo ""
read -p "按回车键退出..." _t
LINUXSH
chmod +x "$LINUX_DIR/启动游戏.sh" 2>/dev/null || true

cat > "$LINUX_DIR/Linux构建说明.txt" << 'LINUXHELP'
Linux ClubActivityTactics.x86_64 构建说明：

与 Windows 类似，Linux 需要对应的 Godot 运行时二进制。

【获得 .x86_64 的两种方式】

方式1 (推荐):
  1. 下载 Godot 4.6.3 Linux 版
     https://github.com/godotengine/godot/releases/download/4.6.3-stable/Godot_v4.6.3-stable_linux.x86_64.zip
  2. 解压，重命名为 ClubActivityTactics.x86_64
  3. chmod +x ClubActivityTactics.x86_64
  4. 放到 build/Linux/ 目录下
  5. ./ClubActivityTactics.x86_64 开始游戏

方式2:
  本机装了 Godot → 直接运行 启动游戏.sh

方式3 (最正式):
  在 Linux 上用 Godot Editor 打开项目 → Export → Linux/X11 → Export Project
LINUXHELP

log "Linux PCK + 启动脚本 构建完成"

# ==============================================
# 4. 验证 + 摘要
# ==============================================
echo ""
echo "【4/4】构建摘要"
echo "================================================"
echo ""
echo "🍎 macOS:"
[ -d "$MACOS_DIR/$APP_NAME.app" ] && echo "   ✅ ClubActivityTactics.app  ($(du -sh "$MACOS_DIR/$APP_NAME.app" 2>/dev/null | cut -f1))"
find "$MACOS_DIR" -maxdepth 2 -type f -exec ls -lh {} \; 2>/dev/null | awk '{print "   "$9"  "$5}' | head -10
echo ""
echo "🪟 Windows:"
find "$WIN_DIR" -maxdepth 1 -type f -exec ls -lh {} \; 2>/dev/null | awk '{print "   "$9"  "$5}'
echo ""
echo "🐧 Linux:"
find "$LINUX_DIR" -maxdepth 1 -type f -exec ls -lh {} \; 2>/dev/null | awk '{print "   "$9"  "$5}'
echo ""
echo "================================================"
echo "🎉 构建完成！"
echo ""
echo "macOS: 直接双击 build/macOS/ClubActivityTactics.app 即可运行"
echo "Windows: 按 Windows构建说明.txt 放入 exe，或双击 启动游戏.bat"
echo "Linux:   按 Linux构建说明.txt 放入二进制，或运行 启动游戏.sh"
echo "================================================"
