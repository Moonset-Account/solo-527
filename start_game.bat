@echo off
REM =====================================================
REM 🎮 社团活动战术棋 - 一键启动脚本 (Windows)
REM =====================================================
cd /d "%~dp0"

where godot >nul 2>nul
if %errorlevel%==0 (
    echo 🎯 正在启动 社团活动战术棋...
    if exist "scenes\Main.tscn" (
        start "" godot --path "%~dp0" "scenes\Main.tscn" %*
    ) else (
        start "" godot --path "%~dp0" %*
    )
) else (
    echo ❌ 未找到 godot 命令
    echo.
    echo 请先安装 Godot Engine 4.2+: https://godotengine.org/download
    echo 或把 Godot.exe 所在目录加入 PATH 环境变量
    pause
)
