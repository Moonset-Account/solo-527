# =============================================================================
# 旧公寓·遗物整理录  ·  Unreal Engine 5.3 工程说明
# =============================================================================

本目录包含可双击打开的完整 Unreal Engine 5.3 C++ 游戏项目。

---
## 一、工程入口

双击 `OldApartmentMystery/OldApartmentMystery.uproject` 即可在 UE5.3 编辑器打开。
（首次打开若提示缺失二进制，点击「是」编译工程 C++ 模块。）

启动 UE5.3 编译完成后：
1. 主关卡位于 `Content/Maps/MainMenu.umap`（启动后自动载入，见 Config/DefaultEngine.ini）
2. 关卡资源目录 `Content/Maps/Chapter1.umap`、`Chapter2.umap`、`Chapter3.umap`
3. 主菜单按钮 -> 开始游戏 / 关卡选择 / 设置 / 存档 / 导出试玩数据

---
## 二、目录结构

```
OldApartmentMystery/
├── OldApartmentMystery.uproject          ✅ 工程入口
├── Config/                                ✅ 引擎配置（启动关卡/输入/渲染）
│   ├── DefaultEngine.ini
│   ├── DefaultGame.ini
│   ├── DefaultInput.ini
│   └── DefaultEditor.ini
├── Source/                                ✅ C++ 源码 43 个文件（≈9000 行）
│   ├── OldApartmentMystery.Target.cs         ← 打包目标
│   ├── OldApartmentMysteryEditor.Target.cs   ← 编辑器目标
│   └── OldApartmentMystery/
│       ├── OldApartmentMystery.Build.cs      ← 模块构建脚本
│       ├── Public/
│       │   ├── OAMTypes.h                 // 枚举/结构体/委托 (180 行)
│       │   ├── OldApartmentMystery.h      // 模块入口
│       │   ├── Core/                      // GameInstance / GameMode / GameState
│       │   ├── Player/                    // PlayerController / Character / Interaction
│       │   ├── Environment/               // Interactable Interface & Base / Door / Pickup / RoomTrigger
│       │   ├── Puzzle/                    // LockPuzzleActor / NoteActor
│       │   ├── Managers/                  // Save / Audio / Telemetry / Chapter
│       │   ├── UI/                        // 8 个 UserWidget 基类
│       │   └── Data/                      // 5 个 DataAsset 类型
│       └── Private/                       // 对应 .cpp 实现
├── Content/                               ✅ 内容目录（蓝图/关卡/资源路径约定）
│   ├── Maps/
│   ├── Blueprints/
│   ├── Data/
│   ├── Audio/
│   ├── UI/
│   ├── Meshes/
│   └── Editor/
└── Project_README.md
```

---
## 三、功能模块（全 C++ 实现 + 蓝图继承即可）

| 模块 | 文件 | 核心类 | 职责 |
|------|------|--------|------|
| 引擎内核 | OAMGameInstance | UOAMGameInstance | 4 个 Manager 生命周期、关卡切换、输入模式切换 |
| 游戏规则 | OAMGameMode/State | AOAMGameMode/State | 进度数组（物品/笔记/谜题/门）、PlayTime |
| 玩家 | OAMPlayerController | AOAMPlayerController | Enhanced Input 绑定、交互触发、屏幕震动/闪光 |
| 玩家角色 | OAMCharacter | AOAMCharacter | 俯视摄像机、房间切换广播 |
| 交互系统 | OAMInteractionComponent | UOAMInteractionComponent | 2m 半径最近邻检测、提示自动更新 |
| 可交互基类 | OAMInteractableInterface/Base | IOAMInteractableInterface | 5 个虚函数 BlueprintNativeEvent |
| 门 | OAMDoorActor | AOAMDoorActor | 钥匙解锁 / 关卡切换 / 结局门 / 开门补间动画 |
| 拾取物 | OAMPickupActor | AOAMPickupActor | 读 DataAsset → 自动加背包 → 目标事件 |
| 房间触发 | OAMRoomTriggerVolume | AOAMRoomTriggerVolume | 首次进入旁白、环境音切换、微刺激 |
| 锁谜题 | OAMLockPuzzleActor | AOAMLockPuzzleActor | 数字输入、3~5 次尝试、5s 冷却、奖励链（物品/门解锁） |
| 笔记 | OAMNoteActor | AOAMNoteActor | 阅读记录、目标事件 |
| 章节 | OAMChapterManager | UOAMChapterManager | 5 种 Objective 事件检查、自动解锁下一章、6 项结算 |
| 存档 | OAMSaveManager | UOAMSaveManager | 6 槽（含自动）、JSON 持久化到 Saved/OAMSaves/ |
| 音频 | OAMAudioManager | UOAMAudioManager | 33 SFX 缓存 + 5 环境音 + 4 音量矩阵 |
| 遥测 | OAMTelemetryManager | UOAMTelemetryManager | 15 类事件扁平日志、Saved/Telemetry/*.json 导出 |
| HUD | OAMHUDWidget | UOAMHUDWidget | 交互提示/目标进度/Toast/暗角闪光/章节标题 |
| 笔记本 | OAMNotebookWidget | UOAMNotebookWidget | 三标签页（笔记/线索/物品）+ 翻页 |
| 谜题UI | OAMPuzzleWidget | UOAMPuzzleWidget | 数字键盘、抖屏、尝试计数 |
| 物品检查 | OAMExamineWidget | UOAMExamineWidget | 鼠标拖动旋转 + 多段文本轮播 + 热点 |
| 设置 | OAMSettingsWidget | UOAMSettingsWidget | 12 项设置、JSON 持久化、遥测导出按钮 |
| 存档UI | OAMSaveLoadWidget | UOAMSaveLoadWidget | 6 槽 + 空/时间显示 |
| 关卡选择 | OAMLevelSelectWidget | UOAMLevelSelectWidget | 解锁状态、章节卡 |
| 过关结算 | OAMChapterCompleteWidget | UOAMChapterCompleteWidget | 6 项统计卡 + 过关旁白 |
| 关卡数据 | OAMLevelDataAsset | UOAMLevelDataAsset | 房间网格+墙+家具+物品+门+触发器全部字段 |

---
## 四、C++ 类使用方式（编辑器内）

### 4.1 创建蓝图子类
Unreal 编辑器中 → 内容浏览器 → 右键 → 蓝图类 → 搜索对应 C++ 父类：

- `BP_GameInstance`   父类: `OAMGameInstance`
- `BP_GameMode`       父类: `OAMGameMode`
- `BP_PlayerController` 父类: `OAMPlayerController`
- `BP_Character`      父类: `OAMCharacter`
- `BP_Door`           父类: `OAMDoorActor`
- `BP_Pickup`         父类: `OAMPickupActor`
- `BP_LockPuzzle`     父类: `OAMLockPuzzleActor`
- `BP_Note`           父类: `OAMNoteActor`
- `BP_RoomTrigger`    父类: `OAMRoomTriggerVolume`
- `WB_HUD` / `WB_Notebook` / ... → 继承各 `OAM*Widget`

### 4.2 创建 DataAsset
内容浏览器 → 右键 → Miscellaneous → Data Asset → 搜索：
- `OAMItemData` / `OAMNoteData` / `OAMPuzzleData` / `OAMChapterData` / `OAMLevelDataAsset`

按 `Content/Data/` 命名约定创建 DA_Item_* / DA_Note_* / DA_Puzzle_* / DA_Chapter1~3 / DA_Level_*

### 4.3 关卡生成工具（可选）
- 按 `Config/DefaultEditor.ini` 指定的 `EUB_LevelBuilder` 编辑器工具蓝图（推荐创建）
- 或直接拖放 `OAMLevelDataAsset` 里的生成器到关卡场景

---
## 五、输入映射

```
WASD      → Move            (Pawn 移动)
MouseXY   → Look            (视角)
E / LMB   → Interact        (交互)
N         → ToggleNotebook  (笔记本)
I         → ToggleInventory (背包/笔记本)
ESC       → Pause           (暂停/退出UI)
0~9       → Digit0~Digit9   (谜题模式数字)
RMB       → Back            (退出UI)
```

对应 Enhanced Input IMC 文件：`Content/Input/IMC_Player.uasset`
（需在编辑器中创建并绑定；路径已在 `OAMGameInstance::DefaultInputContext` 预留指针）

---
## 六、关卡与剧情数据

### 3 章流程：
| 章节 | 地图 | 主要物品 | 密码 | 目标 |
|------|------|----------|------|------|
| 1 | 客厅/厨房/阳台 | 雇佣信/老照片/购物清单/冰箱磁贴/抽屉钥匙 | 1991 (CD盒) | 检查7物品 → 找走廊钥匙 → 进走廊 |
| 2 | 走廊/女儿房/卫生间/书房 | CD机/信件盒/日记本/日历/梳妆台小盒/旧相机/走廊钥匙 | 714 (梳妆台盒) | 读4笔记 → 解2谜题 → 打开地下室门 |
| 3 | 地下室/储藏间 | 报纸堆/铁皮箱/案件编号条/遗物盒/妈妈的信/录取通知书 | 781498 (铁皮箱) | 揭开真相 → 离开公寓 → 结局 |

---
## 七、数据记录（主菜单/设置页 → 导出）

- 导出路径：`<工程>/Saved/Telemetry/OAM_Session_YYYYMMDD_HHMMSS.json`
- 15 类事件：SessionStart/End、ChapterStart/Complete、ItemCollected、ItemExamine、
  NoteRead、PuzzleAttempt、PuzzleSolved、DoorOpened/Unlock、ObjectiveComplete、
  RoomEntered、ChoiceMade、DeathEvent
- 记录字段：时间戳 + ID + 位置/尝试/数值 Payload

---
## 八、构建与打包

```bash
# 编译编辑器目标
<UE_ROOT>/Engine/Build/BatchFiles/Mac/Build.sh OldApartmentMysteryEditor Mac Development <uproject>

# 打包（Mac）
<UE_ROOT>/Engine/Build/BatchFiles/RunUAT.sh BuildCookRun \
  -project="<absolute>/OldApartmentMystery.uproject" \
  -platform=Mac -configuration=Development -build -cook -stage -pak -archive \
  -archivedirectory=<out_dir>
```

---
## 九、迁移自 Web 原型说明

本工程 C++ 模块边界 **1:1 对齐** `../js/` 的 8 个 ES 模块（audio/telemetry/save/input/renderer/ui/gameData/main），
所有数据 ID 与 Web 版完全一致（`item_*`、`note_*`、`puzzle_*`、`chapter_*`、`door_*`），确保设计复用。
