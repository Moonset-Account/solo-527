# 旧公寓探索悬疑 - Unreal 项目结构

## 项目根目录布局

```
OldApartmentMystery/
├── Content/
│   ├── Blueprints/                  # 所有蓝图类
│   │   ├── Core/                    # 核心系统
│   │   │   ├── BP_GameInstance.uasset
│   │   │   ├── BP_PlayerController.uasset
│   │   │   ├── BP_GameMode.uasset
│   │   │   └── BP_GameState.uasset
│   │   ├── Player/                  # 玩家相关
│   │   │   ├── BP_PlayerCharacter.uasset
│   │   │   └── BP_InteractionComponent.uasset
│   │   ├── Environment/             # 环境与房间
│   │   │   ├── BP_RoomTrigger.uasset
│   │   │   ├── BP_InteractableObject.uasset
│   │   │   └── BP_Door.uasset
│   │   ├── Puzzle/                  # 谜题系统
│   │   │   ├── BP_LockPuzzle.uasset
│   │   │   └── BP_NoteItem.uasset
│   │   ├── UI/                      # UI 相关
│   │   │   ├── WB_MainHUD.uasset
│   │   │   ├── WB_Inventory.uasset
│   │   │   ├── WB_Notebook.uasset
│   │   │   ├── WB_LockPuzzle.uasset
│   │   │   ├── WB_ExamineItem.uasset
│   │   │   ├── WB_PauseMenu.uasset
│   │   │   ├── WB_Settings.uasset
│   │   │   ├── WB_LoadSave.uasset
│   │   │   ├── WB_LevelSelect.uasset
│   │   │   └── WB_ChapterComplete.uasset
│   │   └── Managers/                # 管理器
│   │       ├── BP_AudioManager.uasset
│   │       ├── BP_SaveManager.uasset
│   │       ├── BP_ChapterManager.uasset
│   │       └── BP_TelemetryManager.uasset
│   ├── Data/                        # 数据资产 (DataAssets)
│   │   ├── DA_ItemData.uasset       # 物品数据
│   │   ├── DA_ChapterData.uasset    # 章节数据
│   │   ├── DA_RoomData.uasset       # 房间数据
│   │   ├── DA_NoteData.uasset       # 笔记数据
│   │   ├── DA_LockPuzzleData.uasset # 锁谜题数据
│   │   └── DA_SFXData.uasset        # 音效配置数据
│   ├── Maps/                        # 关卡地图
│   │   ├── MainMenu.umap
│   │   ├── Apartment_Level1.umap    # 第一章：客厅
│   │   ├── Apartment_Level2.umap    # 第二章：卧室
│   │   ├── Apartment_Level3.umap    # 第三章：厨房与地下室
│   │   └── Loading.umap
│   ├── Audio/                       # 音频资源
│   │   ├── SFX/                     # 音效
│   │   │   ├── UI/                  # UI 音效
│   │   │   ├── Environment/         # 环境音效
│   │   │   └── Interaction/         # 交互音效
│   │   └── Ambient/                 # 环境氛围音
│   └── UI/                          # UI 贴图资源
│       ├── Icons/
│       └── Backgrounds/
├── Source/                          # C++ 模块（仅必要时使用）
└── Config/                          # 配置文件
```

---

## 模块边界与职责划分

### 1. 核心系统模块 (Core)
**文件**: `Blueprints/Core/*`
- **BP_GameInstance**: 全局状态管理，跨关卡持久化数据
  - 持有 SaveManager、ChapterManager、TelemetryManager 引用
  - 负责场景切换/资源预加载的触发
- **BP_PlayerController**: 玩家输入处理，UI 栈管理
  - 输入映射：移动、交互、打开笔记、暂停、背包
  - 输入模式切换：探索 / UI / 谜题 / 检查物品
- **BP_GameState**: 当前关卡运行时状态
  - 当前章节、已解锁物品、已完成谜题
- **BP_GameMode**: 关卡初始化流程

### 2. 玩家交互模块 (Player)
**文件**: `Blueprints/Player/*`
- **BP_PlayerCharacter**: 第一人称角色，移动/碰撞/摄像机
- **BP_InteractionComponent**: 交互检测组件
  - 射线检测前方可交互物体
  - 显示交互提示（"按 E 检查"）
  - 调用交互物体的 `Interact()` 接口

### 3. 环境与物品模块 (Environment)
**文件**: `Blueprints/Environment/*`, `Data/DA_ItemData.uasset`
- **BP_InteractableObject**: 可交互物体基类
  - 接口：`Interact(APawn*)`、`Examine()`、`Highlight(bool)`
  - 属性：物品ID、显示名、是否可拾取、是否需要前置条件
- **BP_Door**: 门对象，带锁状态/动画
- **BP_RoomTrigger**: 房间触发区，进入时切换环境音

### 4. 谜题与笔记模块 (Puzzle)
**文件**: `Blueprints/Puzzle/*`, `Data/DA_NoteData.uasset`, `Data/DA_LockPuzzleData.uasset`
- **BP_NoteItem**: 笔记物品，拾取后进入笔记本
- **BP_LockPuzzle**: 锁谜题（数字/方向/密码）
  - 支持 3-6 位数字密码锁
  - 失败/成功反馈
  - 失败计数

### 5. UI 模块 (UI)
**文件**: `Blueprints/UI/*`
- 完全使用 Widget Blueprint，每个 Widget 职责单一
- 通过 PlayerController 的 UI Stack 管理打开/关闭

### 6. 管理器模块 (Managers)
**文件**: `Blueprints/Managers/*`
- **BP_AudioManager**: 音效/环境音管理，统一播放接口
- **BP_SaveManager**: 存档读档，序列化游戏状态
- **BP_ChapterManager**: 章节进度、关卡选择数据
- **BP_TelemetryManager**: 试玩数据记录

### 7. 场景切换模块 (Level Streaming)
- 使用 Level Streaming + Loading 过渡图
- 预加载：切换场景前 AsyncLoadAsset 所需资源
- 由 GameInstance 统一调度

---

## 数据资产说明 (Data Assets)

### DA_ItemData
| 字段 | 类型 | 说明 |
|------|------|------|
| ItemID | FName | 唯一标识 |
| DisplayName | FText | 显示名称 |
| Description | FText | 描述 |
| Icon | UTexture2D* | 背包图标 |
| Mesh | UStaticMesh* | 世界中的模型 |
| bIsPickable | bool | 是否可拾取 |
| bIsNote | bool | 是否为笔记 |
| NoteData | UDA_NoteData* | 关联笔记数据 |
| PreconditionItem | FName | 交互前置物品ID（可选） |
| ExamineText | TArray<FText> | 检查时的旁白文本 |

### DA_ChapterData
| 字段 | 类型 | 说明 |
|------|------|------|
| ChapterID | int32 | 章节编号 |
| ChapterTitle | FText | 章节标题 |
| LevelName | FName | 目标关卡名 |
| Description | FText | 章节简介 |
| RequiredItems | TArray<FName> | 进入需要的物品 |
| AmbientSound | USoundBase* | 章节环境音 |

### DA_LockPuzzleData
| 字段 | 类型 | 说明 |
|------|------|------|
| PuzzleID | FName | 谜题ID |
| Password | TArray<int32> | 正确密码 |
| DigitCount | int32 | 位数 |
| HintText | FText | 提示文本 |
| RewardItem | FName | 解开后获得的物品ID |
| UnlocksDoor | FName | 解开后打开的门ID |

---

## 输入映射 (Input Mapping)

| 操作 | 按键 | 输入模式 |
|------|------|----------|
| 移动 (前后左右) | WASD | 探索 |
| 视角转动 | Mouse X/Y | 探索 |
| 交互 / 确认 | E / 左键 | 探索 |
| 检查物品旋转 | Mouse X/Y | 检查 |
| 打开笔记本 | N | 全局（非谜题） |
| 打开背包 | I | 全局（非谜题） |
| 暂停 | ESC | 全局 |
| 数字输入 | 0-9 | 谜题 |
| 后退 | 右键 | UI |
