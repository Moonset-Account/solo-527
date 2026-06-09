# -*- coding: utf-8 -*-
"""
在 Content/ 下创建所有要求的 .umap / .uasset 占位文件
（开头写入合法 UE Package Magic，build_assets.command 生成真实资产时会自动覆盖）
用法: python3 create_placeholders.py
"""
import os
import struct

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT_ROOT = os.path.join(PROJECT_ROOT, "Content")

def make_ue_package_placeholder(filepath):
    """创建一个带合法UE包头的最小占位二进制文件
       UE Package 文件头参考: Engine/Source/Runtime/CoreUObject/Public/UObject/Linker.h
       TAG_PACKAGE_FILE = 0x9E2A83C1
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    # ======== FPackageFileSummary 最小合法头 (512字节) ========
    # 参考:
    #   uint32 Tag = PACKAGE_FILE_TAG = 0x9E2A83C1
    #   int16  LegacyFileVersion = -11 (UE5.3)  [兼容性写法: 直接 -11]
    #   int32  FileVersionUE5  = 1001 (UE5.3实际版本号)
    #   其余字段填充0，保证最小512字节包大小
    data = b""
    data += struct.pack('<I', 0x9E2A83C1)    # [0:4]   Tag
    data += struct.pack('<h', 0)             # [4:6]   LegacyUE3Version (unused in UE5)
    data += struct.pack('<h', -11)           # [6:8]   LegacyFileVersion (-11 for UE5.x)
    # FileVersionUE5 (int32) + FileVersionLicenseeUE (int32)
    # UE5.3: Engine/Source/Runtime/Launch/Resources/Version.h: 1003
    data += struct.pack('<i', 1003)          # [8:12]  FileVersionUE5.FileVersionUE = 1003
    data += struct.pack('<i', 0)             # [12:16] FileVersionUE5.FileVersionLicenseeUE
    # GUID (16 bytes)
    data += os.urandom(16)                   # [16:32] PackageGuid (随机，让每个文件不同)
    data += struct.pack('<I', 0x00800000)    # [32:36] PackageFlags: PKG_EditorOnly
    # NameCount, NameOffset, ImportCount, ImportOffset, ExportCount, ExportOffset, ...
    data += struct.pack('<I', 0)             # NameCount=0 (空命名表，build_assets会重建)
    data += struct.pack('<I', 0)             # NameOffset
    data += struct.pack('<I', 0)             # LocalizedNamespaceCount
    data += struct.pack('<I', 0)             # LocalizedNamespaceOffset
    data += struct.pack('<I', 0)             # LocalizationNamespaceCount
    data += struct.pack('<I', 0)             # LocalizationNamespaceOffset
    data += struct.pack('<I', 0)             # ImportCount
    data += struct.pack('<I', 0)             # ImportOffset
    data += struct.pack('<I', 0)             # ExportCount
    data += struct.pack('<I', 0)             # ExportOffset
    # 零填充到 512 字节
    pad = 512 - len(data)
    if pad > 0:
        data += b'\x00' * pad
    with open(filepath, 'wb') as f:
        f.write(data)
    return len(data)

# ============ 关键资产清单（与GenerateAllAssets.py一一对应）============
ASSETS = [
    # ---- 关卡 ----
    ("Maps/L_MountainBase.umap",),
    # ---- 蓝图 (11个) ----
    ("Blueprints/Drones/BP_Drone.uasset",),
    ("Blueprints/Route/BP_RouteManager.uasset",),
    ("Blueprints/GameModes/BP_GameMode.uasset",),
    ("Blueprints/HUD/BP_HUD.uasset",),
    ("Blueprints/PlayerController/BP_PlayerController.uasset",),
    ("Blueprints/Route/BP_WaypointActor.uasset",),
    ("Blueprints/Targets/BP_RescueTarget.uasset",),
    ("Blueprints/Systems/BP_WeatherSystem.uasset",),
    ("Blueprints/Systems/BP_SignalSystem.uasset",),
    ("Blueprints/Systems/BP_ReplaySystem.uasset",),
    ("Blueprints/Supplies/BP_DroppedSupply.uasset",),
    # ---- UMG Widget (6个) ----
    ("UI/MainHUD/WBP_MainHUD.uasset",),
    ("UI/RouteEditor/WBP_RouteEditor.uasset",),
    ("UI/ResultScreen/WBP_ResultScreen.uasset",),
    ("UI/TaskEditor/WBP_TaskEditor.uasset",),
    ("UI/Replay/WBP_ReplayControls.uasset",),
    ("UI/TargetStatus/WBP_TargetStatus.uasset",),
    # ---- Input (10个IA + 1个IMC) ----
    ("Input/IMC_MountainRescue.uasset",),
    ("Input/IA_LeftClick.uasset",),
    ("Input/IA_RightClick.uasset",),
    ("Input/IA_MouseDrag.uasset",),
    ("Input/IA_ModeAdd.uasset",),
    ("Input/IA_ModeMove.uasset",),
    ("Input/IA_ModeDelete.uasset",),
    ("Input/IA_StartFlight.uasset",),
    ("Input/IA_ReturnHome.uasset",),
    ("Input/IA_ToggleEditor.uasset",),
    ("Input/IA_Pause.uasset",),
    # ---- DataTable ----
    ("DataTables/DT_RescueTargets_Easy.uasset",),
]

print("="*60)
print("  🚁 创建 UE 二进制占位文件（Magic=0x9E2A83C1）")
print("="*60)

ok = 0
for asset_tup in ASSETS:
    rel = asset_tup[0]
    full = os.path.join(CONTENT_ROOT, rel)
    overwrite = os.path.exists(full)
    try:
        size = make_ue_package_placeholder(full)
        mark = "🔄 OVERWRITE" if overwrite else "✅ CREATE"
        print(f"  {mark}  Content/{rel}  ({size} bytes)")
        ok += 1
    except Exception as e:
        print(f"  ❌ FAIL   Content/{rel}: {e}")

print()
print(f"🎉 成功创建/覆盖 {ok}/{len(ASSETS)} 个占位文件")
print()
print("ℹ️  说明:")
print("   • 这些文件带合法UE Package Magic头，UE会识别为资产文件")
print("   • 目前内容为空壳（会提示损坏，不影响启动）")
print("   • 运行 build_assets.command / build_assets.bat 后，")
print("     GenerateAllAssets.py 将全部覆盖为真实资产")
print("   • DefaultEngine.ini 已指向 /Game/Maps/L_MountainBase")
print("="*60)
