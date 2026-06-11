#!/usr/bin/env bash
#
# 安装 git-brclean 到系统
# 用法: ./scripts/install.sh [--path /usr/local/bin]

set -euo pipefail

INSTALL_DIR="${1:-/usr/local/bin}"
if [ "${1:-}" == "--path" ]; then
    INSTALL_DIR="${2:-/usr/local/bin}"
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BINARY_NAME="git-brclean"

echo "=== 安装 ${BINARY_NAME} ==="

if [ ! -f "${PROJECT_DIR}/target/release/${BINARY_NAME}" ]; then
    echo "未找到 release 二进制，正在构建..."
    cd "${PROJECT_DIR}"
    cargo build --release
fi

echo "安装到: ${INSTALL_DIR}"

if [ ! -d "${INSTALL_DIR}" ]; then
    echo "创建目录: ${INSTALL_DIR}"
    mkdir -p "${INSTALL_DIR}"
fi

cp "${PROJECT_DIR}/target/release/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

echo ""
echo "安装完成!"
echo ""
echo "验证:"
"${INSTALL_DIR}/${BINARY_NAME}" --version
echo ""
echo "提示: 确保 ${INSTALL_DIR} 在你的 PATH 中"
echo "      可以通过 git brclean 调用 (作为 git 子命令)"
