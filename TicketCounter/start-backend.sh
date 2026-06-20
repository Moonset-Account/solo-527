
#!/bin/bash
set -e
echo "=== 票务核销台 - 启动后端 API ==="
cd "$(dirname "$0")/src/TicketCounter.WebApi"
if command -v dotnet >/dev/null 2>&1; then
  dotnet run
else
  echo "未检测到 .NET SDK，请先安装 .NET 8 SDK"
  exit 1
fi
