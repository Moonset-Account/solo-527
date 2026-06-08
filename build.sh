#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$PROJECT_DIR/build"
TEMPLATE_DIR="$HOME/Library/Application Support/Godot/export_templates/4.6.3.stable"
GODOT_BIN="/Applications/Godot.app/Contents/MacOS/Godot"

echo "=== Packing Puzzle Build Script ==="
echo "Project: $PROJECT_DIR"
echo "Build:   $BUILD_DIR"

mkdir -p "$BUILD_DIR"

echo "[1/3] Exporting PCK package..."
"$GODOT_BIN" --headless --path "$PROJECT_DIR" --export-pack "macOS" "$BUILD_DIR/packing_puzzle.pck"

echo "[2/3] Creating app bundle..."
APP_DIR="$BUILD_DIR/PackingPuzzle.app"
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

echo "[3/3] Build complete!"
echo "Output: $APP_DIR"
echo ""
echo "To run: open $APP_DIR"
echo "Or run from source: cd $PROJECT_DIR && godot ."
