#!/usr/bin/env bash
set -euo pipefail

APP_NAME="csvvalidator"
VERSION="${1:-$(date +%Y%m%d)}"
BUILD_DIR="release"
SRC_DIR="."

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_BLUE="\033[34m"

log()  { echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET}  $*"; }
warn() { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET}  $*"; }
ok()   { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET}    $*"; }

log "开始发布 ${APP_NAME} v${VERSION} ..."

mkdir -p "${BUILD_DIR}"

PLATFORMS=(
  "linux/amd64"
  "linux/arm64"
  "darwin/amd64"
  "darwin/arm64"
  "windows/amd64"
)

for platform in "${PLATFORMS[@]}"; do
  GOOS="${platform%/*}"
  GOARCH="${platform#*/}"
  ext=""
  if [[ "$GOOS" == "windows" ]]; then
    ext=".exe"
  fi
  OUTPUT="${BUILD_DIR}/${APP_NAME}_${GOOS}_${GOARCH}${ext}"

  log "编译 $GOOS/$GOARCH ..."
  if CGO_ENABLED=0 GOOS="$GOOS" GOARCH="$GOARCH" \
       go build -ldflags "-X main.version=${VERSION} -s -w" \
       -o "$OUTPUT" ./cmd/csvvalidator; then
    ok "$OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
  else
    warn "$GOOS/$GOARCH 编译失败，跳过"
  fi
done

CHECKSUM_FILE="${BUILD_DIR}/SHA256SUMS"
log "生成 SHA256 校验和 -> ${CHECKSUM_FILE}"
(
  cd "${BUILD_DIR}"
  sha256sum ${APP_NAME}_* > SHA256SUMS 2>/dev/null || shasum -a 256 ${APP_NAME}_* > SHA256SUMS
)
ok "校验和已生成"

echo ""
echo -e "${COLOR_GREEN}========================================${COLOR_RESET}"
ok    "发布完成! 产物目录: ${BUILD_DIR}"
echo ""
ls -lh "${BUILD_DIR}"
echo ""
echo "示例用法:"
echo "  ./${APP_NAME}_darwin_arm64 data.csv --schema schema.json"
