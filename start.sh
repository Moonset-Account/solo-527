#!/bin/bash

# 印刷厂订单门店协同台面系统 - 启动脚本
# 使用方法: ./start.sh

echo "=========================================="
echo "  印刷厂订单门店协同台面系统 - 启动脚本"
echo "=========================================="
echo ""

# 检查 .NET SDK
echo "检查 .NET SDK..."
if ! command -v dotnet &> /dev/null; then
    echo "❌ 未找到 dotnet 命令，请先安装 .NET 8.0 SDK"
    echo "下载地址: https://dotnet.microsoft.com/download"
    exit 1
fi
echo "✅ .NET SDK 已安装: $(dotnet --version)"

# 检查 Node.js
echo ""
echo "检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 node 命令，请先安装 Node.js 18+"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js 已安装: $(node --version)"

# 检查 SQL Server 连接
echo ""
echo "检查 SQL Server 连接配置..."
if [ ! -f "src/PrintingFactory.Api/appsettings.json" ]; then
    echo "❌ 配置文件不存在"
    exit 1
fi
echo "✅ 配置文件存在"

# 检查 Redis
echo ""
echo "检查 Redis 配置..."
echo "ℹ️  请确保 Redis 服务已启动，默认端口: 6379"

# 还原后端依赖
echo ""
echo "=========================================="
echo "  还原后端依赖..."
echo "=========================================="
dotnet restore PrintingFactory.sln
if [ $? -ne 0 ]; then
    echo "❌ 还原后端依赖失败"
    exit 1
fi
echo "✅ 后端依赖还原完成"

# 还原前端依赖
echo ""
echo "=========================================="
echo "  还原前端依赖..."
echo "=========================================="
cd client
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 还原前端依赖失败"
        exit 1
    fi
    echo "✅ 前端依赖安装完成"
else
    echo "ℹ️  前端依赖已存在，跳过安装"
fi
cd ..

# 数据库迁移
echo ""
echo "=========================================="
echo "  数据库迁移和初始化..."
echo "=========================================="
echo "ℹ️  系统将在启动时自动执行数据库迁移和初始化"
echo "ℹ️  预置数据: 5个门店、7个生产节点、8台设备"

# 启动后端
echo ""
echo "=========================================="
echo "  启动后端服务..."
echo "=========================================="
echo "✅ 后端服务地址: http://localhost:5000"
echo "✅ Swagger文档: http://localhost:5000/swagger"
echo ""

# 启动前端
echo "=========================================="
echo "  启动前端服务..."
echo "=========================================="
echo "✅ 前端服务地址: http://localhost:5173"
echo ""

# 同时启动前后端（需要 tmux 或 分开两个终端）
echo "=========================================="
echo "  启动说明"
echo "=========================================="
echo ""
echo "请打开两个终端分别执行以下命令："
echo ""
echo "终端1（后端）:"
echo "  cd src/PrintingFactory.Api"
echo "  dotnet run"
echo ""
echo "终端2（前端）:"
echo "  cd client"
echo "  npm run dev"
echo ""
echo "或者使用以下命令在后台运行（需要安装 concurrently）:"
echo "  npm install -g concurrently"
echo "  concurrently \"cd src/PrintingFactory.Api && dotnet run\" \"cd client && npm run dev\""
echo ""
echo "=========================================="
echo "  系统功能列表"
echo "=========================================="
echo "✅ 前台功能:"
echo "   - 门店订单录入页面"
echo "   - 订单快速录入（自动计算金额）"
echo ""
echo "✅ 后台功能:"
echo "   - 门店数据汇总（支持Excel/CSV导出）"
echo "   - 交付进度提醒（优先级分级）"
echo "   - 订单回看和历史记录"
echo ""
echo "✅ 订单追踪:"
echo "   - 单条记录完整追踪"
echo "   - 生产节点维护（Steps组件展示）"
echo "   - 质检结果录入（支持不合格处理）"
echo "   - 交付日期管理"
echo "   - 设备空闲关联与分配"
echo ""
echo "✅ 质检不合格处理:"
echo "   - 影响范围标记"
echo "   - 处理路径记录"
echo "   - 纠正预防措施"
echo "   - 复盘备注"
echo ""
echo "✅ 批量处理:"
echo "   - 二次确认对话框"
echo "   - 失败项单独列表"
echo "   - 失败原因展示"
echo "   - 单条/批量重试入口（最多3次）"
echo ""
echo "✅ 缓存策略:"
echo "   - Redis缓存设备状态（30分钟）"
echo "   - Redis缓存门店汇总（30分钟）"
echo "   - Redis缓存交付提醒（10分钟）"
echo ""
echo "=========================================="
