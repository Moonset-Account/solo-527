#!/usr/bin/env bash
# 构建脚本：编译 logsum 二进制
# 用法: ./scripts/build.sh [darwin|linux|windows|all] [amd64|arm64|all]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_NAME="${APP_NAME:-logsum}"
MODULE="github.com/backend-ops/logsum"
VERSION="${VERSION:-$(git describe --tags --always --dirty 2>/dev/null || echo 0.1.0)}"
BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
LDFLAGS="-s -w -X github.com/backend-ops/logsum/internal/cli.Version=${VERSION} -X github.com/backend-ops/logsum/internal/cli.Build=${BUILD_TIME}-${GIT_COMMIT}"

OS="${1:-$(go env GOOS)}"
ARCH="${2:-$(go env GOARCH)}"
OUT_DIR="${OUT_DIR:-${ROOT_DIR}/bin}"

mkdir -p "$OUT_DIR"

build_one() {
  local os="$1" arch="$2"
  local ext=""
  [[ "$os" == "windows" ]] && ext=".exe"
  local out="${OUT_DIR}/${APP_NAME}-${os}-${arch}${ext}"
  echo "==> building $os/$arch -> $out"
  GOOS="$os" GOARCH="$arch" CGO_ENABLED=0 \
    go build -ldflags "$LDFLAGS" -trimpath \
    -o "$out" ./cmd/logsum
}

case "$OS" in
  all)
    for os in darwin linux windows; do
      for arch in amd64 arm64; do
        [[ "$os" == "windows" && "$arch" == "arm64" ]] && continue
        build_one "$os" "$arch"
      done
    done
    ;;
  *)
    case "$ARCH" in
      all)
        for arch in amd64 arm64; do
          [[ "$OS" == "windows" && "$arch" == "arm64" ]] && continue
          build_one "$OS" "$arch"
        done
        ;;
      *)
        build_one "$OS" "$ARCH"
        # 同时生成一个不带后缀的本机二进制便于直接使用
        if [[ "$OS" == "$(go env GOOS)" && "$ARCH" == "$(go env GOARCH)" ]]; then
          ext=""
          [[ "$OS" == "windows" ]] && ext=".exe"
          cp "${OUT_DIR}/${APP_NAME}-${OS}-${ARCH}${ext}" "${OUT_DIR}/${APP_NAME}${ext}"
        fi
        ;;
    esac
    ;;
esac

echo "done. artifacts in $OUT_DIR"
ls -lh "$OUT_DIR"
