# 动画控制器与占位资源管理

> 文件：[AnimationAndPlaceholders.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/AnimationAndPlaceholders.md)

---

## 1. 动画系统设计

### 1.1 动画蓝图目录结构

```
Content/Blueprints/Animation/
  ├─ ABP_PlayerCharacter.uasset        (玩家角色AnimBP - 第一人称身体)
  ├─ ABP_PlayerArms.uasset          (玩家手臂 + 手持物)
  ├─ ACP_Player.uasset                 (玩家动画蓝图控制器 AnimInstance)
  ├─ ABP_Interactable.uasset            (可交互物体通用AnimBP)
  ├─ ABP_Door.uasset                    (门开关动画)
  └─ ABP_Puzzle_Shared.uasset        (谜题物体通用动画)
```

### 1.2 玩家动画蓝图 (ABP_PlayerArms)

**动画状态机 (第一人称手臂)：
```
AnimGraph:
  ├─ State Machine: FullBody
  │    ├─ Entry: Idle_Breathing
  │    ├─ State: Idle_Breathing
  │    │    └─ AnimSequence: Arm_Idle_01 (循环呼吸)
  │    │
  │    ├─ State: Walk
  │    │    ├─ AnimSequence: Arm_Walk_01 (行走摆臂)
  │    │    └─ Transition Rule: MovementSpeed > 50
  │    │
  │    ├─ State: Crouch_Idle
  │    │    └─ Anim: Arm_Crouch_Idle
  │    │
  │    ├─ State: Crouch_Walk
  │    │    └─ Anim: Arm_Crouch_Walk
  │    │
  │    ├─ State: Interact
  │    │    ├─ SubState: Interact_Reach (手臂前伸)
  │    │    ├─ SubState: Interact_PickUp (拾取动作)
  │    │    └─ Montage: Interact_Generic_Montage
  │    │
  │    ├─ State: Flashlight_Switch
  │    │    └─ Montage: Flashlight_Click_Montage
  │    │
  │    └─ State: Examine_Hold
  │         ├─ Anim: Examine_Hold_01
  │         └─ 分支: 持物体时切换物品检查姿势)
  │
  ├─ Slot: UpperBody (Layer
  │    └─ 手部旋转 / 手持物品)
  │
  └─ 姿势修改: 手持物的位置偏移 + 目标偏移 - Head IK
```

**动画参数 (动画蓝图变量：

```
// 输入参数:
  MovementSpeed : float  (Vel.Size())
  bIsCrouched : bool
  bIsSprinting : bool
  bIsExamining : bool
  bIsInteracting : bool
  bHasHoldingItem : bool
  CurrentHoldingItemType : Enum (None/Flashlight/Key/Clue)

// 内部计算:
  ArmSwayAmount : Vector2D (由 Input Mouse Delta)
  BreathingCycle : float (time 1.0)

```

**蓝图构造脚本 (Event Graph)：
```
Event BlueprintUpdateAnimation:
  MovementSpeed = TryGetPawnOwner → Velocity.Size
  bIsCrouched = Character.bIsCrouching
  // 根据 CurrentHoldingItemType = PlayerController.CurrentHoldingItemType
  // 计算呼吸周期 + 手臂摆臂

Event BlueprintBeginPlay:
  // 绑定事件监听
```

### 1.3 门动画蓝图 (ABP_Door)

状态机：
```
State: Door_Closed (初始状态)
  → Event OpenDoor → State: Door_Opening
    → Anim: Door_Squeak_open (0.8秒)
    → State: Door_Open (循环保持)
  → Event CloseDoor → State: Door_Closing
    → Anim: Door_squeak_close (0.8秒)
```

---

## 2. 占位资源管理规范

### 2.1 占位资源目录 (Content/Placeholders)

```
Placeholders/
  ├─ Meshes/
  │   ├─ Rooms/
  │   │   ├─ SM_PH_Apartment_Lobby.uasset      公寓大厅
  │   │   ├─ SM_PH_Apartment_Corridor.uasset  走廊
  │   │   ├─ SM_PH_Room_101.uasset        房间101
  │   │   ├─ SM_PH_Door_Wooden_01.uasset    木门
  │   │   └─ SM_PH_Door_Metal_01.uasset    金属门
  │   │
  │   ├─ Furniture/
  │   │   ├─ SM_PH_Table_Wood.uasset       桌子
  │   │   ├─ SM_PH_Drawer_Unit.uasset      抽屉柜
  │   │   ├─ SM_PH_Closet_2Door.uasset    双门衣柜
  │   │   ├─ SM_PH_Bookshelf.uasset            书架
  │   │   ├─ SM_PH_Bed.uasset                床
  │   │   ├─ SM_PH_Sofa.uasset               沙发
  │   │   ├─ SM_PH_Fridge.uasset              冰箱
  │   │   ├─ SM_PH_Kitchen.uasset            厨房
  │   │   └─ SM_PH_Bathroom_Fixtures.uasset      浴室设备
  │   │
  │   └─ Items/
  │       ├─ SM_PH_Clue_Document.uasset        文件
  │       ├─ SM_PH_Clue_Photo.uasset           照片
  │       ├─ SM_PH_Clue_Key.uasset               钥匙
  │       ├─ SM_PH_Clue_Items.uasset          物品
  │       └─ SM_PH_Lock_Dial.uasset               锁
  │
  ├─ Textures/
  │   ├─ UI/
  │   │   ├─ T_PH_UI_Background.uasset
  │   │   ├─ T_PH_UI_Button_Default.uasset
  │   │   └─ T_PH_Icon_Interact.uasset
  │   │
  │   └─ Environment/
  │       ├─ T_PH_Wood_Floor_01.uasset      木地板
  │       ├─ T_PH_Wall_Old_01.uasset         旧墙面
  │       ├─ T_PH_Wall_Paint_Peel.uasset      墙皮剥落
  │       ├─ T_PH_Carpet_01.uasset           地毯
  │       └─ T_PH_Ceiling_WaterStain.uasset    天花板污渍
  │
  ├─ Materials/
  │   ├─ M_PH_Wood_Old.uasset               旧木材质
  │   ├─ M_PH_Wall_Dirty.uasset              脏墙材质
  │   ├─ M_PH_Metal_Rust.uasset              生锈金属
  │   ├─ M_PH_Glass_Dirty.uasset            脏玻璃
  │   ├─ M_PH_Highlight.uasset           高亮材质
  │   └─ MI_PH_Emissive_01.uasset        发光材质
  │
  ├─ Animations/
  │   ├─ AS_Idle_Breathing.anim            待机动画
  │   ├─ AS_Walk_Forward.anim             行走动画
  │   ├─ AS_Crouch_Walk.anim              蹲走动
  │   ├─ AS_Door_Open_01.anim            门开
  │   ├─ AS_Drawer_Open.anim           抽屉开
  │   └─ AM_Interact_Generic_Montage.uasset  交互混合空间
  │
  └─ Sprites/
      ├─ Paper_S_Clue_Card_BG.png
      └─ Paper_S_UI_Icons_Atlas.png
```

### 2.2 占位资源命名规范

| 前缀规范:
```
SM_PH_<Category>_<Name>

前缀说明:
  SM_  StaticMesh
  T_   Texture
  M_   MaterialInstance  MaterialInterface
  MI_  MaterialInstance
  AS_   AnimSequence
  AB_   AnimBlueprint
  AC_   AnimComposite
  AM_   Montage
  Paper_S_ Paper2D Sprite
  S_    Slate UI图标 (UMG Image

占位资源特殊前缀: _PH (Placeholder), _占位资源替换计划:

占位资源替换流程:

```
步骤1 - 导入正式美术资源正式资源:
  → 在 Content/Production/ 目录 (独立文件夹 (Meshes/Textures/Materials
  → 使用同样的命名 ( 相对位置

步骤2 - 资产重定向资产:
  → 在 Content/Placeholders/ 保持不动

步骤3 - 替换引用:
  →  UE  AssetActions →  Replace References

步骤4 - 占位资源放置 Placeholder → 引用列表

```

---

## 3. 数据资源管理 (Data Assets 和 Data Tables

```
Content/DataAssets/
  ├─ DA_Chapter01.uasset          (章节信息数据资产
  ├─ DA_Chapter02_Placeholder.uasset
  ├─ DA_ClueItems.uasset            (线索物品数据资产集合)
  ├─ DA_Tenants_All.uasset           (租客档案)
  ├─ DA_AchievementList.uasset         (成就列表)
  └─ DA_PuzzleList.uasset            (谜题配置)

Content/DataTables/
  ├─ DT_ClueDatabase.uasset              (线索数据库)
  ├─ DT_ClueRelations.uasset         (线索关联表)
  ├─ DT_AchievementDefinitions.uasset (成就定义表)
  ├─ DT_FurnitureDialogues.uasset      (家具环境对白)
  └─ DT_SfxDatabase.uasset          (家具环境叙事)
  └─ DT_AchievementDefinitions.uasset (成就对话)
```

### 3.1 DA_ClueItem 数据资产结构

```cpp
UCLASS()
class UDA_ClueItem : public UPrimaryDataAsset
{
  GENERATED_BODY()
public:
  UPROPERTY(EditAnywhere, Category="Data)
  FName ClueId;

  UPROPERTY(EditAnywhere, Category="Data")
  EClueType Type;

  UPROPERTY(EditAnywhere, Category="Data")
  FText Title;

  UPROPERTY(EditAnywhere, Category="Data")
  FText Description;

  UPROPERTY(EditAnywhere, Category="Data")
  TSoftObjectPtr<UStaticMesh> DisplayMesh;

  UPROPERTY(EditAnywhere, Category="Data")
  TSoftObjectPtr<UTexture2D> Icon;

  UPROPERTY(EditAnywhere, Category="Data")
  FName AssociatedRoomId;

  UPROPERTY(EditAnywhere, Category="Data")
  FName AssociatedTenantId;

  UPROPERTY(EditAnywhere, Category="Data")
  bool bIsKeyItem;

  UPROPERTY(EditAnywhere, Category="Data")
  int32 ScoreValue;

  UPROPERTY(EditAnywhere, Category="Data")
  TArray<FName> LinkedClueIds;

  UPROPERTY(EditAnywhere, Category="Data")
  FVector SpawnLocationOffset;

  UPROPERTY(EditAnywhere, Category="Data")
  FRotator SpawnRotation;
};
```

---

## 4. 关卡流程 (Level)

关卡流送 (Level Streaming)

关卡流送关卡:
```

Content/Maps/Chapters/Chapter01.umap
  ├─ Persistent Level: BP_GameMode, BP_AudioDirector 等等
  │
  └─ Sublevels (通过 LevelStreamingVolumes 动态加载:
  │    ├─ Rooms/RM_Lobby.umap       (大厅
  │    ├─ Rooms/RM_Corridor.umap      (走廊)
  │    ├─ Rooms/RM_Apt101.umap         (101室)
  │    └─ Rooms/RM_ManagerOffice.umap  (管理室
  │
  └─ LevelScriptBlueprint: LSB_Chapter01
  │
  └─ GameplayTags Volume 加载
  │    ├─  BeginPlay → 注册关卡 Start
  │    │
  │    └─ 房间加载完成 → 加载 ChapterBeginPlay → IntroSequence播放
  │    │
  │    └─ 播放过场动画
  │    │
  └─ 播放 ChapterEnd →  播放 ChapterBeginSequence播放)

```

## 5. 构建配置 (Build.cs, Packaging 设置

构建

```

### 5.1 构建烘焙设置 蓝图目录烹饪 (Cooking)
```
Maps to Cook (烘焙的所有Maps
  ├─ Maps/Levels/MainMenu
  ├─ Maps/Chapters/Chapter00
  └─ Maps/Chapters/Chapter01
  └─ Maps/Chapters/Chapter02
  └─ Maps/Chapters/Chapter03
  └─ Maps/Chapters/Chapter04

---

### 5.2 构建蓝图 构建设置
```

### 5.3 构建设置:
```
BuildConfiguration   目录, 构建设置:
```
Engine ProjectLaunch:
```

### 5.4 Pak 构建设置:
```
  BuildConfiguration →  Shipping 构建设置:
```

```
