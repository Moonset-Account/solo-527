@echo off
chcp 65001 >nul
echo ==========================================
echo   合同条款风险标注工具 - Windows 启动脚本
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/5] 检查环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)
for /f "delims=" %%i in ('node -v') do set NODE_VER=%%i
echo ✅ Node.js 版本: %NODE_VER%

echo.
echo [2/5] 安装后端依赖...
if not exist "node_modules" (
    call npm install
) else (
    echo ✅ 后端依赖已安装
)

echo.
echo [3/5] 安装前端依赖...
cd client
if not exist "node_modules" (
    call npm install
) else (
    echo ✅ 前端依赖已安装
)
cd ..

echo.
echo [4/5] 配置环境...
if not exist ".env" (
    copy .env.example .env
    echo ⚠️  已从 .env.example 创建 .env 文件
    echo    请修改其中的数据库和 OpenAI 配置
) else (
    echo ✅ .env 配置文件已存在
)

echo.
echo [5/5] 初始化数据库...
call npm run db:migrate
call npm run db:seed

echo.
echo ==========================================
echo   ✅ 环境准备完成！
echo ==========================================
echo.
echo 启动方式：
echo   🚀 开发模式 (前后端同时运行): npm run dev
echo   🔧 仅后端: npm run dev:server    (端口 3001)
echo   🎨 仅前端: npm run dev:client    (端口 3000)
echo   📦 测试: npm test
echo.
echo 默认账号：
echo   管理员: admin / Admin@123
echo   法务助理: assistant1 / Assistant@123
echo   复核人: reviewer1 / Reviewer@123
echo.

set /p START="是否立即启动开发模式？(Y/n): "
if /i "%START%"=="Y" (
    echo 🚀 启动开发服务器...
    call npm run dev
)
if /i "%START%"=="" (
    echo 🚀 启动开发服务器...
    call npm run dev
)

pause
