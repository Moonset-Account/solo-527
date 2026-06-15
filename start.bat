@echo off
chcp 65001 >nul
echo ==========================================
echo   印刷厂订单门店协同台面系统 - 启动脚本
echo ==========================================
echo.

echo 检查 .NET SDK...
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 dotnet 命令，请先安装 .NET 8.0 SDK
    echo 下载地址: https://dotnet.microsoft.com/download
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('dotnet --version') do echo ✅ .NET SDK 已安装: %%i

echo.
echo 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 node 命令，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js 已安装: %%i

echo.
echo ==========================================
echo   还原后端依赖...
echo ==========================================
dotnet restore PrintingFactory.sln
if %errorlevel% neq 0 (
    echo ❌ 还原后端依赖失败
    pause
    exit /b 1
)
echo ✅ 后端依赖还原完成

echo.
echo ==========================================
echo   还原前端依赖...
echo ==========================================
cd client
if not exist "node_modules" (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 还原前端依赖失败
        pause
        exit /b 1
    )
    echo ✅ 前端依赖安装完成
) else (
    echo ℹ️  前端依赖已存在，跳过安装
)
cd ..

echo.
echo ==========================================
echo   数据库迁移和初始化...
echo ==========================================
echo ℹ️  系统将在启动时自动执行数据库迁移和初始化
echo ℹ️  预置数据: 5个门店、7个生产节点、8台设备

echo.
echo ==========================================
echo   启动说明
echo ==========================================
echo.
echo 请打开两个命令行窗口分别执行以下命令：
echo.
echo 窗口1（后端）:
echo   cd src\PrintingFactory.Api
echo   dotnet run
echo.
echo 窗口2（前端）:
echo   cd client
echo   npm run dev
echo.
echo 后端服务地址: http://localhost:5000
echo Swagger文档: http://localhost:5000/swagger
echo 前端服务地址: http://localhost:5173
echo.
echo ==========================================
pause
