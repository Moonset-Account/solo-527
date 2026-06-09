@echo off
REM ============================================================
REM   山地救援无人机模拟 - Windows 一键资产生成脚本
REM   作用: 调用 UnrealEditor-Cmd.exe 执行
REM         Content/Python/GenerateAllAssets.py
REM         生成所有 .umap / .uasset 资产
REM   用法: 双击 build_assets.bat 运行
REM ============================================================
setlocal EnableDelayedExpansion

chcp 65001 >nul
echo.
echo ══════════════════════════════════════════════════════════
echo    🚁 山地救援无人机 - 一键资产生成 (Windows)
echo ══════════════════════════════════════════════════════════
echo.

REM ---- 1. 找到 uproject 文件 ----
set "UPROJECT="
for %%f in (*.uproject) do (
    set "UPROJECT=%%~ff"
    set "UPROJECT_NAME=%%~nf"
)
if "%UPROJECT%"=="" (
    echo [ERROR] 找不到 .uproject 文件！请把脚本放在项目根目录
    pause
    exit /b 1
)
echo [OK] 项目文件: %UPROJECT%
echo.

REM ---- 2. 查找 UnrealEditor-Cmd.exe ----
set "UE_CMD="

REM 常见安装目录
set "UE_DIRS=^
C:\Program Files\Epic Games\UE_5.3 ^
C:\Program Files\Epic Games\UE_5.4 ^
C:\Program Files\Epic Games\UE_5.5 ^
C:\Epic Games\UE_5.3 ^
C:\Epic Games\UE_5.4 ^
C:\Epic Games\UE_5.5 ^
D:\Program Files\Epic Games\UE_5.3 ^
D:\Program Files\Epic Games\UE_5.4 ^
D:\Epic Games\UE_5.3 ^
D:\Epic Games\UE_5.4"

for %%d in (%UE_DIRS%) do (
    if exist "%%~d\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" (
        set "UE_CMD=%%~d\Engine\Binaries\Win64\UnrealEditor-Cmd.exe"
        goto :ue_found
    )
)

REM 用 where 命令搜索 PATH
where UnrealEditor-Cmd.exe >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "delims=" %%i in ('where UnrealEditor-Cmd.exe') do (
        set "UE_CMD=%%~fi"
        goto :ue_found
    )
)

REM 查注册表 EpicGamesLauncher 的 AppData
for /f "tokens=2*" %%a in ('reg query "HKCU\Software\Epic Games\EOS" /v "ModSdkMetadataDir" 2^>nul ^| findstr /i "ModSdkMetadataDir"') do (
    set "EPICDIR=%%~b"
)
REM 查常见的UE安装清单注册表

:ue_found
if "%UE_CMD%"=="" (
    echo [ERROR] 找不到 UnrealEditor-Cmd.exe！
    echo.
    echo 请手动设置UE路径（修改本脚本开头的UE_DIRS，或者直接在UE编辑器打开项目后执行：
    echo     Window -^> Developer Tools -^> Output Log
    echo     输入:  py "Content/Python/GenerateAllAssets.py"
    pause
    exit /b 2
)
echo [OK] UE编辑器命令行: %UE_CMD%
echo.

REM ---- 3. 检查C++是否已编译（Binaries/Win64 下要有游戏模块）----
echo [INFO] 检查 C++ 编译状态...
set "NEED_BUILD=0"
if not exist "Binaries\Win64" (
    set "NEED_BUILD=1"
    echo [WARN] Binaries\Win64 不存在，准备自动编译
) else (
    dir /b "Binaries\Win64\*MountainRescueDrone*.dll" >nul 2>&1 || set "NEED_BUILD=1"
)

if "%NEED_BUILD%"=="1" (
    echo.
    echo [INFO] 编译 C++: Build.bat MountainRescueDroneEditor Win64 Development ...
    REM 取UE根目录，拼接 Build\BatchFiles\Build.bat
    for %%a in ("%UE_CMD%") do (
        for %%b in ("%%~dpa..\..") do set "UE_ROOT=%%~fb"
    )
    set "BUILD_BAT=%UE_ROOT%\Engine\Build\BatchFiles\Build.bat"
    if exist "%BUILD_BAT%" (
        call "%BUILD_BAT%" MountainRescueDroneEditor Win64 Development "%UPROJECT%" -WaitMutex -FromMsBuild
        echo [INFO] Build.bat 返回码: %ERRORLEVEL%
    ) else (
        echo [WARN] 找不到 Build.bat，请先打开 .uproject 让UE自动编译，或者用 Visual Studio 编译
    )
)
if exist "Binaries\Win64" (
    echo [OK] 编译产物已就绪
)
echo.

REM ---- 4. 执行 Python 生成资产 ----
set "PY_SCRIPT=%~dp0Content\Python\GenerateAllAssets.py"
if not exist "%PY_SCRIPT%" (
    echo [ERROR] 找不到 Python 脚本: %PY_SCRIPT%
    pause
    exit /b 3
)

set "LOG_FILE=%~dp0build_assets_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%.log"
set "LOG_FILE=%LOG_FILE: =0%"

echo [INFO] 开始生成资产...
echo        Python Script: %PY_SCRIPT%
echo        Log:           %LOG_FILE%
echo.

"%UE_CMD%" "%UPROJECT%" ^
    -ExecCmds="py \"%PY_SCRIPT%\"; Quit" ^
    -unattended ^
    -nopause ^
    -NoShaderCompile ^
    -stdout ^
    -FullStdOutLogOutput ^
    2>&1 | tee "%LOG_FILE%"

echo.
echo ══════════════════════════════════════════════════════════

REM ---- 5. 验证生成 ----
echo.
echo [INFO] 关键文件验证:
set "PASS=0"
set "TOTAL=0"

call :checkfile Content\Maps\L_MountainBase.umap
call :checkfile Content\Blueprints\Drones\BP_Drone.uasset
call :checkfile Content\Blueprints\Route\BP_RouteManager.uasset
call :checkfile Content\Blueprints\GameModes\BP_GameMode.uasset
call :checkfile Content\Blueprints\HUD\BP_HUD.uasset
call :checkfile Content\Blueprints\PlayerController\BP_PlayerController.uasset
call :checkfile Content\UI\MainHUD\WBP_MainHUD.uasset
call :checkfile Content\UI\TaskEditor\WBP_TaskEditor.uasset
call :checkfile Content\Input\IMC_MountainRescue.uasset
call :checkfile Content\Input\IA_StartFlight.uasset

echo.
echo 结果: %PASS% / %TOTAL% 关键文件已生成
echo 日志文件: %LOG_FILE%

if "%PASS%"=="%TOTAL%" (
    echo.
    echo [SUCCESS] 🎉 全部资产生成成功！
    echo     双击 %UPROJECT_NAME%.uproject → 进入 L_MountainBase 关卡 → ▶ Play 试玩
) else (
    echo.
    echo [WARN] 部分资产缺失。建议：
    echo     方案A：打开UE编辑器 → Window - Developer Tools - Output Log
    echo            输入:  py "Content/Python/GenerateAllAssets.py"
    echo     方案B：查看日志 %LOG_FILE% 定位具体错误
)
echo ══════════════════════════════════════════════════════════
pause
exit /b 0

REM ===== 子函数：检查文件 =====
:checkfile
set /a TOTAL+=1
if exist "%~1" (
    for %%A in ("%~1") do set "SZ=%%~zA"
    echo     [OK] %~1   (%SZ% bytes)
    set /a PASS+=1
) else (
    echo     [MISS] %~1
)
goto :eof
