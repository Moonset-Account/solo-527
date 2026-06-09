#!/bin/bash
# ============================================================
#  山地救援无人机模拟 - macOS 一键资产生成脚本
#  作用: 调用 UnrealEditor-Cmd 在命令行模式下执行
#        Content/Python/GenerateAllAssets.py，
#        生成所有 .umap/.uasset 资产 (BP_Drone/BP_HUD/
#        BP_RouteManager/WBP_*/IA_*/L_MountainBase 等)
#  用法: chmod +x build_assets.command ; ./build_assets.command
# ============================================================

set -e

# ---- 颜色 ----
RED='\033[0;31m';  GRN='\033[0;32m';  YLW='\033[1;33m'
BLU='\033[0;34m';  BLD='\033[1m';     NC='\033[0m'

echo -e "\n${BLU}${BLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BLU}${BLD}   🚁 山地救援无人机 - 一键资产生成 (macOS)${NC}"
echo -e "${BLU}${BLD}══════════════════════════════════════════════════════${NC}"

# ---- 1. 定位项目文件 ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

UPROJECT=""
for f in *.uproject; do
    [ -f "$f" ] && UPROJECT="$f" && break
done

if [ -z "$UPROJECT" ]; then
    echo -e "${RED}❌ 找不到 .uproject 文件！请确保此脚本在项目根目录${NC}"
    exit 1
fi
echo -e "${GRN}✅ 项目文件: $UPROJECT${NC}"
FULL_UPROJECT="$SCRIPT_DIR/$UPROJECT"

# ---- 2. 查找 UnrealEditor / UnrealEditor-Cmd ----
UE_BIN=""
UE_CMD=""

# 常见UE安装位置（按优先级）
UE_SEARCH=(
    "/Users/Shared/Epic Games/UE_5.3/Engine/Binaries/Mac"
    "/Users/Shared/Epic Games/UE_5.4/Engine/Binaries/Mac"
    "/Users/Shared/Epic Games/UE_5.5/Engine/Binaries/Mac"
    "/Applications/UE_5.3/Engine/Binaries/Mac"
    "/Applications/UE_5.4/Engine/Binaries/Mac"
    "/Applications/UE_5.5/Engine/Binaries/Mac"
)

for dir in "${UE_SEARCH[@]}"; do
    if [ -d "$dir" ]; then
        if [ -x "$dir/UnrealEditor-Cmd" ]; then
            UE_CMD="$dir/UnrealEditor-Cmd"
            UE_BIN="$dir/UnrealEditor"
            break
        fi
    fi
done

# 用 Spotlight 尝试 (mdfind)
if [ -z "$UE_CMD" ]; then
    echo -e "${YLW}ℹ️  未在常见位置找到UE，正在用 Spotlight 搜索 UnrealEditor-Cmd ...${NC}"
    MDF="$(mdfind "kMDItemFSName == 'UnrealEditor-Cmd'" 2>/dev/null | head -1 || true)"
    if [ -n "$MDF" ] && [ -x "$MDF" ]; then
        UE_CMD="$MDF"
        UE_BIN="$(dirname "$MDF")/UnrealEditor"
    fi
fi

if [ -z "$UE_CMD" ]; then
    echo -e "${RED}❌ 找不到 UnrealEditor-Cmd！${NC}"
    echo -e "${YLW}请手动指定UE安装路径，比如：${NC}"
    echo -e "  export UE_CMD=\"/Users/Shared/Epic Games/UE_5.3/Engine/Binaries/Mac/UnrealEditor-Cmd\""
    echo -e "  然后再运行本脚本"
    echo ""
    echo -e "或者在UE编辑器打开项目后，执行："
    echo -e "  Window → Developer Tools → Output Log"
    echo -e "  输入: py \"Content/Python/GenerateAllAssets.py\""
    exit 2
fi

echo -e "${GRN}✅ 已找到 UE 编辑器:${NC}"
echo -e "     Cmd: ${UE_CMD}"
echo -e "     GUI: ${UE_BIN}"

# ---- 3. 检查 C++ 是否已编译（至少要有 .dylib 或 Makefile 目标）----
echo -e "\n${BLU}📦 检查C++编译状态...${NC}"
NEED_BUILD=0
if [ ! -d "Binaries/Mac" ]; then
    echo -e "${YLW}⚠️  Binaries/Mac 不存在，需要先编译C++...${NC}"
    NEED_BUILD=1
else
    # 检查是否有游戏模块dylib
    if ! ls Binaries/Mac/*MountainRescueDrone* 1>/dev/null 2>&1; then
        echo -e "${YLW}⚠️  Binaries/Mac 下没有游戏模块，需要编译...${NC}"
        NEED_BUILD=1
    fi
fi

if [ "$NEED_BUILD" = "1" ]; then
    echo -e "\n${BLU}🔨 开始编译 C++ 模块（Development Mac）...${NC}"
    # 用 UBT 编译
    UBT_DIR="$(dirname "$(dirname "$UE_CMD")")/Build/BatchFiles"
    UBT_SH="$UBT_DIR/Mac/Build.sh"
    if [ ! -x "$UBT_SH" ]; then
        # 新的 UBT 路径
        UBT_SH="$(dirname "$(dirname "$UE_CMD")")/Build/BatchFiles/Build.bat"
    fi
    # macOS下通常用 RunUBT.command 或直接调用 dotnet
    UBT_FOUND=0
    for CAND in \
        "$(dirname "$(dirname "$UE_CMD")")/Build/BatchFiles/Mac/RunUBT.command" \
        "$(dirname "$(dirname "$UE_CMD")")/Build/BatchFiles/RunUBT.command" \
        "$(dirname "$(dirname "$UE_CMD")")/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool" \
        ; do
        if [ -x "$CAND" ] || [ -f "$CAND" ]; then
            echo -e "${GRN}✅ UBT: $CAND${NC}"
            if [[ "$CAND" == *"BuildTool"* ]]; then
                # dotnet UnrealBuildTool.dll
                DOTNET_DIR="$(dirname "$CAND")"
                if command -v dotnet >/dev/null 2>&1; then
                    (cd "$DOTNET_DIR" && \
                     dotnet UnrealBuildTool.dll MountainRescueDroneEditor Mac Development \
                     -Project="$FULL_UPROJECT" -WaitMutex -FromMsBuild) || {
                        echo -e "${RED}❌ dotnet UBT 编译失败，尝试继续（可能已经有旧的编译产物）${NC}"
                    }
                    UBT_FOUND=1
                fi
            else
                "$CAND" MountainRescueDroneEditor Mac Development \
                    -Project="$FULL_UPROJECT" || {
                    echo -e "${RED}❌ UBT编译失败，但继续尝试（资产生成可能失败）${NC}"
                }
                UBT_FOUND=1
            fi
            break
        fi
    done
    if [ "$UBT_FOUND" = "0" ]; then
        echo -e "${YLW}⚠️  找不到UBT，请先打开UE编辑器让它编译C++，或用Xcode编译${NC}"
    fi
fi

if [ -d "Binaries/Mac" ]; then
    echo -e "${GRN}✅ 编译产物已就绪${NC}"
fi

# ---- 4. 用 UnrealEditor-Cmd 执行 Python 脚本 ----
PY_SCRIPT="$SCRIPT_DIR/Content/Python/GenerateAllAssets.py"
if [ ! -f "$PY_SCRIPT" ]; then
    echo -e "${RED}❌ 找不到脚本: $PY_SCRIPT${NC}"
    exit 3
fi

echo -e "\n${BLU}🚀 调用 UnrealEditor-Cmd 执行 Python 资产生成脚本...${NC}"
echo -e "${BLU}   预计 30-120 秒，首次运行请耐心等待${NC}\n"

LOG_FILE="$SCRIPT_DIR/build_assets_$(date +%Y%m%d_%H%M%S).log"

# -ExecCmds 参数中用 "py FILE" 运行Python，然后 "Quit" 退出
"$UE_CMD" "$FULL_UPROJECT" \
    -ExecCmds="py \"$PY_SCRIPT\"; Quit" \
    -unattended \
    -nopause \
    -NoShaderCompile \
    -stdout \
    -FullStdOutLogOutput \
    2>&1 | tee "$LOG_FILE"

TEE_RC=${PIPESTATUS[0]}

echo -e "\n${BLU}══════════════════════════════════════════════════════${NC}"
if [ "$TEE_RC" = "0" ]; then
    echo -e "${GRN}${BLD}✅ 脚本执行完成！${NC}"
else
    echo -e "${YLW}⚠️  命令退出码=$TEE_RC，不代表失败（Quit可能返回非0）${NC}"
fi

# ---- 5. 验证生成的文件 ----
echo -e "\n${BLU}📋 关键文件验证:${NC}"
EXPECTED=(
    "Content/Maps/L_MountainBase.umap"
    "Content/Blueprints/Drones/BP_Drone.uasset"
    "Content/Blueprints/Route/BP_RouteManager.uasset"
    "Content/Blueprints/GameModes/BP_GameMode.uasset"
    "Content/Blueprints/HUD/BP_HUD.uasset"
    "Content/Blueprints/PlayerController/BP_PlayerController.uasset"
    "Content/UI/MainHUD/WBP_MainHUD.uasset"
    "Content/UI/TaskEditor/WBP_TaskEditor.uasset"
    "Content/Input/IMC_MountainRescue.uasset"
    "Content/Input/IA_StartFlight.uasset"
)
PASS=0; TOTAL=0
for f in "${EXPECTED[@]}"; do
    TOTAL=$((TOTAL+1))
    if [ -f "$SCRIPT_DIR/$f" ]; then
        SZ=$(stat -f "%z" "$SCRIPT_DIR/$f" 2>/dev/null || stat -c "%s" "$SCRIPT_DIR/$f" 2>/dev/null || echo "0")
        echo -e "${GRN}  OK  $f  ($SZ bytes)${NC}"
        PASS=$((PASS+1))
    else
        echo -e "${RED}  MISS  $f${NC}"
    fi
done

echo -e "\n${BLD}结果: $PASS / $TOTAL 关键文件已生成${NC}"
echo -e "日志文件: $LOG_FILE"

if [ "$PASS" = "$TOTAL" ]; then
    echo -e "\n${GRN}${BLD}🎉 全部资产生成成功！${NC}"
    echo -e "   双击 $UPROJECT 打开项目 → 直接进入 L_MountainBase → ▶ Play 试玩"
else
    echo -e "\n${YLW}⚠️  部分资产缺失，请参考以下替代方案:${NC}"
    echo -e "   方案 A: 打开UE编辑器 → Window→Output Log → 输入:"
    echo -e "           py \"Content/Python/GenerateAllAssets.py\""
    echo -e "   方案 B: 查看日志 $LOG_FILE 定位错误"
fi

echo -e "${BLU}══════════════════════════════════════════════════════${NC}"
