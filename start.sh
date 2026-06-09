#!/bin/sh
# 社区热线诉求分拨助手 · 启动脚本
# 注意：若执行报 permission denied，请先运行一次：
#       node start.js
# （该命令会自动修复本脚本的权限，此后 ./start.sh 即可正常使用）

DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "${DIR}/start.js" "$@"
