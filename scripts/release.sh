#!/usr/bin/env bash
# 发布脚本：构建多平台二进制并打包为 release
# 用法: ./scripts/release.sh [version_tag]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_NAME="logsum"
VERSION="${1:-$(git describe --tags --always --dirty 2>/dev/null || echo 0.1.0)}"
DIST_DIR="${ROOT_DIR}/dist/${APP_NAME}-${VERSION}"
BUILD_SH="${ROOT_DIR}/scripts/build.sh"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

echo "==> logsum release ${VERSION}"
OUT_DIR="$DIST_DIR" bash "$BUILD_SH" all all

cd "$DIST_DIR"
echo "==> packaging archives"
for f in "${APP_NAME}"-*; do
  case "$f" in
    *.exe)
      zip "${f%.exe}.zip" "$f" >/dev/null
      ;;
    *)
      if [[ -f "$f" ]]; then
        chmod +x "$f"
        tar -czf "${f}.tar.gz" "$f" >/dev/null
      fi
      ;;
  esac
done
rm -f "${APP_NAME}"-darwin-* "${APP_NAME}"-linux-* "${APP_NAME}"-windows-*.exe 2>/dev/null || true

echo "==> generating checksums"
sha256sum ./* > SHA256SUMS

echo
echo "release ready at $DIST_DIR:"
ls -lh .
