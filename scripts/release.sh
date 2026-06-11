#!/usr/bin/env bash
#
# git-brclean 发布脚本
# 为多个平台构建发布版本
#
# 用法: ./scripts/release.sh <version>
# 示例: ./scripts/release.sh 0.1.0

set -euo pipefail

VERSION="${1:-}"
if [ -z "${VERSION}" ]; then
    echo "用法: $0 <version>"
    exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${PROJECT_DIR}/dist"
BINARY_NAME="git-brclean"

echo "=== 构建 ${BINARY_NAME} v${VERSION} ==="
echo "项目目录: ${PROJECT_DIR}"
echo "输出目录: ${DIST_DIR}"
echo ""

mkdir -p "${DIST_DIR}"

build_target() {
    local target="$1"
    local os_name="$2"
    local archive_name="${BINARY_NAME}-${VERSION}-${target}"
    local build_dir="${DIST_DIR}/${archive_name}"

    echo "构建: ${target}..."

    mkdir -p "${build_dir}"

    if command -v cross &> /dev/null; then
        cross build --release --target "${target}"
        cp "target/${target}/release/${BINARY_NAME}"* "${build_dir}/" 2>/dev/null || \
            cp "target/${target}/release/${BINARY_NAME}.exe" "${build_dir}/" 2>/dev/null || true
    else
        echo "  警告: 未安装 cross，跳过交叉编译 (${target})"
        echo "  安装: cargo install cross"
        return 0
    fi

    cp "${PROJECT_DIR}/README.md" "${build_dir}/" 2>/dev/null || true
    cp "${PROJECT_DIR}/LICENSE" "${build_dir}/" 2>/dev/null || true

    if [[ "${os_name}" == "windows" ]]; then
        (cd "${DIST_DIR}" && zip -r "${archive_name}.zip" "${archive_name}")
    else
        (cd "${DIST_DIR}" && tar czf "${archive_name}.tar.gz" "${archive_name}")
    fi

    rm -rf "${build_dir}"
    echo "  完成: ${archive_name}"
}

echo "构建当前平台..."
cargo build --release
echo "  本地构建完成"

if [ "$(uname -s)" == "Darwin" ]; then
    OS_NAME="macos"
elif [ "$(uname -s)" == "Linux" ]; then
    OS_NAME="linux"
else
    OS_NAME="windows"
fi

ARCH="$(uname -m)"
if [ "${ARCH}" == "x86_64" ]; then
    TARGET_ARCH="x86_64"
elif [ "${ARCH}" == "arm64" ] || [ "${ARCH}" == "aarch64" ]; then
    TARGET_ARCH="aarch64"
else
    TARGET_ARCH="${ARCH}"
fi

LOCAL_ARCHIVE="${DIST_DIR}/${BINARY_NAME}-${VERSION}-${TARGET_ARCH}-${OS_NAME}"
mkdir -p "${LOCAL_ARCHIVE}"
cp "target/release/${BINARY_NAME}" "${LOCAL_ARCHIVE}/" 2>/dev/null || \
    cp "target/release/${BINARY_NAME}.exe" "${LOCAL_ARCHIVE}/" 2>/dev/null || true
cp "${PROJECT_DIR}/README.md" "${LOCAL_ARCHIVE}/" 2>/dev/null || true
cp "${PROJECT_DIR}/LICENSE" "${LOCAL_ARCHIVE}/" 2>/dev/null || true

if [[ "${OS_NAME}" == "windows" ]]; then
    (cd "${DIST_DIR}" && zip -r "$(basename "${LOCAL_ARCHIVE}").zip" "$(basename "${LOCAL_ARCHIVE}")")
else
    (cd "${DIST_DIR}" && tar czf "$(basename "${LOCAL_ARCHIVE}").tar.gz" "$(basename "${LOCAL_ARCHIVE}")")
fi

echo ""
echo "=== 构建校验 ==="
echo "本地二进制: target/release/${BINARY_NAME}"
"target/release/${BINARY_NAME}" --version

echo ""
echo "发布文件位于: ${DIST_DIR}"
ls -lh "${DIST_DIR}"

echo ""
echo "=== 发布清单 ==="
echo ""
echo "下一步操作:"
echo "1. 在 GitHub 上创建 release: v${VERSION}"
echo "2. 上传 dist/ 目录中的归档文件"
echo "3. 更新 Homebrew tap / Scoop bucket 等包管理器"
