#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$PROJECT_DIR/build"
GODOT_BIN="/Applications/Godot.app/Contents/MacOS/Godot"

echo "=== Packing Puzzle Build ==="

mkdir -p "$BUILD_DIR"

echo "[1/3] Exporting PCK..."
"$GODOT_BIN" --headless --path "$PROJECT_DIR" --export-pack "macOS" "$BUILD_DIR/packing_puzzle.pck"

echo "[2/3] Creating app bundle..."
APP_DIR="$BUILD_DIR/PackingPuzzle.app"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

cp "$GODOT_BIN" "$APP_DIR/Contents/MacOS/GodotRuntime"
cp "$BUILD_DIR/packing_puzzle.pck" "$APP_DIR/Contents/Resources/PackingPuzzle.pck"

cat > "$APP_DIR/Contents/MacOS/PackingPuzzle" << 'LAUNCHER'
#!/bin/bash
SELF="$(cd "$(dirname "$0")" && pwd)"
exec "$SELF/GodotRuntime" --main-pack "$SELF/../Resources/PackingPuzzle.pck" "$@"
LAUNCHER
chmod +x "$APP_DIR/Contents/MacOS/PackingPuzzle"

echo "[3/4] Writing Info.plist and code signing..."
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

echo "[4/4] Code signing..."
codesign --force --deep --sign - "$APP_DIR"

echo "=== Build complete ==="
echo "Double-click PackingPuzzle.app to play!"
echo "  $APP_DIR"
