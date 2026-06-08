#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$PROJECT_DIR/build"
GODOT_BIN="/Applications/Godot.app/Contents/MacOS/Godot"

echo "=== Packing Puzzle Build Script ==="
echo "Project: $PROJECT_DIR"
echo "Build:   $BUILD_DIR"

mkdir -p "$BUILD_DIR"

echo "[1/2] Exporting PCK package..."
"$GODOT_BIN" --headless --path "$PROJECT_DIR" --export-pack "macOS" "$BUILD_DIR/packing_puzzle.pck"

echo "[2/2] Creating app bundle..."
APP_DIR="$BUILD_DIR/PackingPuzzle.app"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
cp "$GODOT_BIN" "$APP_DIR/Contents/MacOS/PackingPuzzle"
cp "$BUILD_DIR/packing_puzzle.pck" "$APP_DIR/Contents/MacOS/PackingPuzzle.pck"

cat > "$APP_DIR/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleExecutable</key>
	<string>PackingPuzzle</string>
	<key>CFBundleIdentifier</key>
	<string>com.packingpuzzle.game</string>
	<key>CFBundleName</key>
	<string>Packing Puzzle</string>
	<key>CFBundleDisplayName</key>
	<string>Packing Puzzle</string>
	<key>CFBundleVersion</key>
	<string>1.0</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>NSHighResolutionCapable</key>
	<true/>
</dict>
</plist>
PLIST

echo "Build complete!"
echo "Output: $APP_DIR"
echo ""
echo "重要: 因为PackingPuzzle.app内嵌的是Godot编辑器二进制，"
echo "双击打开会进入编辑器模式。请使用以下方式运行游戏："
echo ""
echo "  方式1: 运行 ./run.sh (推荐)"
echo "  方式2: godot --path $PROJECT_DIR"
