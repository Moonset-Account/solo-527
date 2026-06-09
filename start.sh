#!/bin/sh
# 社区热线诉求分拨助手 · 启动脚本
# 若首次执行报 permission denied，请运行：
#     npm run boot    （自动修复本脚本权限，之后 ./start.sh 可直接执行）
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "${DIR}/src/scripts/boot.js" "$@"
