
#!/bin/bash
set -e
echo "=== 票务核销台 - 启动前端 (Vite) ==="
cd "$(dirname "$0")/tickets-frontend"
if [ ! -d node_modules ]; then
  echo "检测到未安装依赖，开始执行 npm install..."
  npm install
fi
npm run dev
