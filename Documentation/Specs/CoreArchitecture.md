# 核心游戏模块架构设计

> 文件：[CoreArchitecture.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/CoreArchitecture.md)

---

## 1. 系统总览

```
┌─────────────────────────────────────────────────────────────┐
│                        UGameInstance                         │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  SaveSystem    │  │ Achievements   │  │  Leaderboard  │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│  ┌────────────────┐  ┌────────────────┐                     │
│  │ EventSystem    │  │ AmbientSystem  │                     │
│  └────────────────┘  └────────────────┘                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        AGameModeBase                         │
│  Scoring System │ Chapter Manager │ SessionResult Generator  │
└───────────────┬──────────────────────┬──────────────────────┘
                │                      │
                ▼                      ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│   APlayerController      │   │        AGameStateBase         │
│  Interaction Mode FSM    │   │  Match Timer │ Chapter Prog  │
│  Input Binding Manager   │   │  Collected Clues Tracker     │
│  UI / HUD Coordinator    │   │  Mistake / Score Tracker     │
│  Trace / Interact Logic  │   └──────────────────────────────┘
└───────────────┬──────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│                  ACharacter (First Person)                    │
│  ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ Movement │ │ Flashlight │ │ Camera Anim│ │ Footsteps  │  │
│  │  Crouch  │ │  Battery   │ │  Headbob   │ │ SurfaceMap │  │
│  │  Sprint  │ │  (ON/OFF)  │ │   Sway     │ │ SFX Player │  │
│  └──────────┘ └────────────┘ └────────────┘ └────────────┘  │
└───────────────────────────────┬──────────────────────────────┘
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
    ┌─────────────────┐ ┌────────────────┐ ┌──────────────────┐
    │  Interactables  │ │   TriggerBox   │ │  Door / Lock     │
    │  (Clue Items)   │ │  (Room Events) │ │  Puzzle Actors   │
    └─────────────────┘ └────────────────┘ └──────────────────┘
```

---

## 2. 蓝图目录结构与命名规范

### 2.1 蓝图路径 (Content/Blueprints)

| 子目录              | 前缀       | 用途                              | 基类(Parent Class)                  |
|-------------------|----------|---------------------------------|-----------------------------------|
| Core/             | BP_      | GameMode, GameInstance, Player   | C++ Native Classes                |
| Gameplay/         | BP_      | Clue Items, Furniture, Triggers  | AOldApartmentInteractable         |
| UI/               | WBP_     | 所有UMG控件蓝图                   | UserWidget                        |
| Animation/        | AB_/ACP_ | Anim Blueprint / Anim Controller | AnimInstance / AnimBP             |
| Puzzles/          | BP_      | 锁、密码箱、机关谜题               | AActor / 自定义C++基类             |
| SaveSystem/       | BP_      | SaveSlot, SaveMenu 逻辑           | UUserWidget / BlueprintFunctionLib|
| Events/           | BP_      | Event Listeners, Cutscenes        | AActor / LevelScript               |
| Actors/           | BP_      | Doors, Lights, Containers         | AOldApartmentInteractable         |

### 2.2 核心蓝图列表 (需要在UE编辑器中创建)

#### 目录：Content/Blueprints/Core

| 蓝图名                        | 路径                                 | Parent C++ Class                   |
|-----------------------------|------------------------------------|------------------------------------|
| `BP_GameInstance`           | Blueprints/Core/BP_GameInstance     | UOldApartmentGameInstance           |
| `BP_GameMode`               | Blueprints/Core/BP_GameMode         | AOldApartmentMysteryGameMode        |
| `BP_PlayerController`       | Blueprints/Core/BP_PlayerController | AOldApartmentPlayerController       |
| `BP_PlayerCharacter`        | Blueprints/Core/BP_PlayerCharacter  | AOldApartmentPlayerCharacter        |
| `BP_GameState`              | Blueprints/Core/BP_GameState        | AGameStateBase                      |
| `BP_HUD`                    | Blueprints/Core/BP_HUD              | AHUD                                |
| `BP_PlayerState`            | Blueprints/Core/BP_PlayerState      | APlayerState                        |

---

## 3. 各模块蓝图实施要点

### 3.1 BP_GameInstance (UOldApartmentGameInstance 子类)

**职责**：全局状态管理器、跨关卡数据持久化

**蓝图变量**：
```
CurrentSaveSlotName : String = "Save_00"
CurrentGameDifficulty : Enum EDifficulty
bIsDailyChallenge : Bool
DailyChallengeSeed : String
TutorialSeenFlags : Map(Name, Bool)
```

**蓝图事件/函数**：
```
Event Init()
    → InitDefaultAchievements() [继承C++]
    → InitDefaultLeaderboard() [继承C++]
    → LoadLeaderboard() [继承C++]

Function StartNewGame(SlotName: String)
    → CreateNewSaveGame(SlotName)
    → PlayerProgress.TotalPlayCount++
    → OpenLevel(FirstChapterMap)

Function ContinueGame(SlotName: String)
    → LoadGameFromSlot(SlotName)
    → Resume From PlayerWorldLocation

Function ReturnToMainMenu()
    → SaveGameToSlot(CurrentSaveSlotName)
    → OpenLevel(MainMenuMap)

Custom Event OnAchievementUnlockedHandler(AchievementId: Name)
    → Get Achievement Definition
    → Show Achievement Toast Widget
    → Play Sound Cue (UI/Achievement_Unlock.wav)
    → SaveGameToSlot (auto-save)
```

### 3.2 BP_GameMode (AOldApartmentMysteryGameMode 子类)

**职责**：评分计算、章节管理、会话生成

**蓝图变量**：
```
ChapterStartTime : DateTime
CurrentChapterId : Int = 1
CurrentChapterClueTotal : Int = 0
CurrentChapterMistakes : Int = 0
CurrentChapterCluesFound : Array[FClueRecord]
```

**蓝图事件/函数**：
```
Event BeginPlay()
    → ChapterStartTime = Now
    → Get CurrentChapter from DataAsset
    → CurrentChapterClueTotal = Chapter.TotalClues
    → Spawn All Clue Actors

Function RegisterClueFound(Clue: FClueRecord)
    → Add to CurrentChapterCluesFound
    → Broadcast Tag Event "Mystery.Clue.Found"
    → Check Chapter Completion

Function RegisterMistake(MistakeType: Name)
    → CurrentChapterMistakes++
    → GameInstance::RegisterMistake()
    → Update Session Mistake UI
    → Trigger Ambient Audio (tense)

Function EndChapter()
    → Build FChapterProgress
    → FinalScore = CalculateChapterScore() [C++]
    → Unlock Next Chapter Content
    → SaveGameToSlot
    → Show WBP_ChapterResult

Function GetScoreBreakdown() -> Struct
    → ClueScore: Int
    → TimeBonus: Int
    → PerfectBonus: Int
    → MistakePenalty: Int
    → Total: Int
```

### 3.3 BP_PlayerController (AOldApartmentPlayerController 子类)

**职责**：输入→动作绑定、交互模式FSM、UI协调

**蓝图变量**：
```
CurrentInteractTarget : AOldApartmentInteractable [从C++继承]
LastInteractTime : Float
ExamineZoomAmount : Float = 0.6
```

**蓝图Enhanced Input绑定** (IMC_Default)：

| Input Action  | 触发器类型       | 对应蓝图函数调用                                       |
|---------------|--------------|------------------------------------------------------|
| IA_Move       | Triggered    | HandleMove() [C++]                                    |
| IA_Look       | Triggered    | HandleLook() [C++]                                    |
| IA_Interact   | Started      | → 取GetInteractableInView → Interact()                |
| IA_Examine    | Started      | HandleExamine() + Camera FOV Lerp                     |
| IA_Notebook   | Started      | Toggle WBP_Notebook Visibility                         |
| IA_Pause      | Started      | TogglePauseMenu() → WBP_PauseMenu                      |
| IA_Flashlight | Started      | BP_PlayerCharacter → ToggleFlashlight()                |
| IA_Back       | Started      | StateMachine → PreviousMode / CloseUI                  |

**交互模式状态机 (EPlayerInteractionMode)**：
```
[Explore]
  ├─── IA_Interact ────> Call Interact() on Target
  ├─── IA_Examine  ────> [ExamineItem]
  ├─── IA_Notebook ────> [UI] (Notebook)
  ├─── IA_Pause    ────> [UI] (Pause)
  └─── Overlap Trigger ─> Fire Event

[ExamineItem]
  ├─── Mouse Wheel ────> Zoom (FieldOfView Lerp)
  ├─── Mouse Drag  ────> Rotate StaticMesh
  └─── IA_Back/Exit ───> [Explore]

[Puzzle]
  ├─── Gameplay Logic ──> Puzzle-specific Binding
  └─── IA_Back     ────> [Explore] + Close Puzzle Widget

[UI]
  └─── 关闭UI        ───> [Explore]

[Cinematic]
  └─── LevelSequence 完成 ──> [Explore]
```

**Tick函数每100ms执行**：
```
AActor* NewTarget = GetInteractableInView()
if (NewTarget != CurrentInteractTarget):
    if (CurrentInteractTarget): SetHighlight(false)
    CurrentInteractTarget = NewTarget
    if (CurrentInteractTarget): SetHighlight(true)
    Update WBP_InteractionPrompt
```

### 3.4 BP_PlayerCharacter (AOldApartmentPlayerCharacter 子类)

**职责**：第一人称表现、运动系统、手电筒、头部动画

**蓝图组件** (继承C++已有组件)：
```
FirstPersonCamera (UCameraComponent)
  ├─ FlashlightMesh (UStaticMeshComponent)
  │   └─ FlashlightSpotLight (USpotLightComponent)
  └─ BreathingAudio (UAudioComponent)
```

**蓝图变量**：
```
BreathingTensionFactor : Float (读AmbientSystem::CurrentTension)
OriginalCameraFOV : Float = 90
bIsBreathingHeavy : Bool
```

**蓝图事件/函数**：
```
Event BeginPlay()
  → 播放 BreathingAudio (循环)
  → 注册 Ambient Event Listener

Event Tick(DeltaSeconds)
  → UpdateCameraAnimation() [C++]
  → BreathingAudio.Volume = Lerp(0.4, 0.9, AmbientSystem.Tension)
  → BreathingAudio.Pitch  = Lerp(1.0, 0.85, (1 - Battery/Max))
  → Flashlight.Intensity *= Lerp(0.9, 1.05, Sin(Time*5))  // 闪烁模拟电量

Function ToggleFlashlight()
  → [C++] ToggleFlashlight
  → Play Sound (UI/Flashlight_Click.wav)
  → if (CurrentBattery < 5%) : HUD Show Low Battery Warning

Custom Event OnExamineStart
  → Camera FOV Lerp To: 45° (in 0.3s)
  → 禁用 Character Movement

Custom Event OnExamineEnd
  → Camera FOV Lerp Back To Original (in 0.2s)
  → 恢复 Character Movement
```

---

## 4. 关卡与地图结构规范

### 4.1 MainMenu (Content/Maps/Levels/MainMenu.umap)
```
Persistent Level:
  └─ Level Script Blueprint: LSB_MainMenu
       ├── BeginPlay → WBP_MainMenu.AddToViewport
       └── Handle New/Continue/Leaderboard/Settings Buttons
```

### 4.2 Chapter Maps (Content/Maps/Chapters/Chapter01.umap ...)
```
Persistent Level (Chapter01):
  ├─ LevelStreamingVolumes (房间切换时动态加载子关卡)
  ├─ GameMode Override: = BP_GameMode
  └─ Level Script Blueprint: LSB_Chapter01
       ├── 注册 Chapter Event
       ├── 过场动画 (IntroSequence)
       └── 章节结束触发器

Sub-levels (通过LevelStreaming加载):
  ├─ Rooms/RM_Lobby.umap     (大厅)
  ├─ Rooms/RM_Corridor.umap  (走廊)
  ├─ Rooms/RM_Apt101.umap    (101室)
  ├─ Rooms/RM_Apt102.umap    (102室)
  └─ Rooms/RM_Basement.umap  (地下室)
```

### 4.3 Persistent Level中始终存在的Actors
```
Player Start
PostProcessVolume (全局氛围：曝光、胶片颗粒、Vignette)
GlobalLightingSource (DirectionalLight + SkyLight + ExponentialHeightFog)
BP_EventDispatcher (全局事件监听器)
BP_AudioDirector (音频环境管理，AmbientSound)
BP_ChapterManager (当前章节进度显示)
```

---

## 5. 碰撞通道与物理材质

碰撞通道定义位于 DefaultEngine.ini：

```
ECC_GameTraceChannel1 → "Interact"
  ├─ 用于 LineTrace / SphereTrace 检测可交互对象
  └─ 调试: Show Collision → 紫色线条 = Interactable 轮廓

Physics Surface Types:
  SurfaceType1 = WoodFloor   (脚步声1)
  SurfaceType2 = Carpet      (脚步声2)
  SurfaceType3 = Tile        (脚步声3)
  SurfaceType4 = Metal       (脚步声4)
  SurfaceType5 = Concrete    (脚步声5)
```
