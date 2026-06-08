# 核心系统蓝图逻辑文档

## 一、BP_GameInstance (全局游戏实例)

### 1.1 变量（Variables）
| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| SaveManager | TSubclassOf<BP_SaveManager> | BP_SaveManager_C | 存档管理器类引用 |
| ChapterManager | BP_ChapterManager* | null | 章节管理器实例 |
| TelemetryManager | BP_TelemetryManager* | null | 试玩数据记录实例 |
| AudioManager | BP_AudioManager* | null | 音频管理器实例 |
| CurrentInputMode | EInputMode | Exploration | 当前输入模式枚举 |
| bIsLoading | bool | false | 是否正在加载中 |
| CollectedItems | TArray<FName> | [] | 全局已收集物品ID（跨关卡） |
| UnlockedChapters | TArray<int32> | [1] | 已解锁章节编号 |
| PendingLoadLevel | FName | None | 待加载的关卡名 |
| LoadedAssetHandles | TArray<FStreamableHandle*> | [] | 预加载句柄（用于释放） |

**枚举 EInputMode**:
- `Exploration` (0) - 正常探索：WASD+鼠标
- `UI` (1) - UI打开：鼠标UI交互
- `Puzzle` (2) - 解谜中：数字键+UI
- `Examine` (3) - 检查物品：鼠标旋转物品

### 1.2 事件（Events）
#### Init (Event Init) - 游戏启动时调用
```
Event Init:
  ├─ SpawnActor(SaveManager Class) → SaveManager Ref
  ├─ SpawnActor(ChapterManager Class) → ChapterManager Ref
  ├─ SpawnActor(TelemetryManager Class) → TelemetryManager Ref
  ├─ SpawnActor(AudioManager Class) → AudioManager Ref
  ├─ TelemetryManager -> RecordSessionStart()
  └─ Bind to Level Transition Events
```

#### RequestLevelTransition (自定义事件)
```
Event RequestLevelTransition(FName TargetLevel, TArray<FSoftObjectPath> AssetsToPreload):
  ├─ If bIsLoading == true: Return (防止重复)
  ├─ Set bIsLoading = true
  ├─ Broadcast "OnLevelStartLoading"
  ├─ AudioManager -> FadeOutAmbient(1.0s)
  ├─ TelemetryManager -> RecordLevelExit()
  ├─ OpenLevel(LoadingMap)
  ├─ Delayed(0.2s) → 调用 PreloadAssets(AssetsToPreload, TargetLevel)
```

#### PreloadAssets (自定义事件) - 资源预加载
```
Function PreloadAssets(TArray<FSoftObjectPath> AssetPaths, FName TargetLevel):
  ├─ For each AssetPath in AssetPaths:
  │    └─ StreamableManager -> RequestAsyncLoad(AssetPath) → Add to LoadedAssetHandles
  └─ StreamableManager -> RequestAsyncLoad(LevelSoftObjectPath(TargetLevel),
       Callback: OnPreloadComplete(TargetLevel))
```

#### OnPreloadComplete (回调)
```
Callback OnPreloadComplete(FName TargetLevel):
  ├─ Delayed(0.5s) → OpenLevel(TargetLevel)
  ├─ Set bIsLoading = false
  └─ Broadcast "OnLevelLoadComplete"
```

#### ChangeInputMode (函数)
```
Function ChangeInputMode(EInputMode NewMode):
  ├─ CurrentInputMode = NewMode
  ├─ GetLocalPlayerController → SetInputMode(
  │    Exploration: InputModeGameOnly, ShowMouse=false
  │    UI/Puzzle/Examine: InputModeGameAndUI, ShowMouse=true)
  └─ Broadcast "OnInputModeChanged(NewMode)"
```

---

## 二、BP_PlayerController (玩家控制器)

### 2.1 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| MainHUD | WB_MainHUD* | 主HUD控件 |
| UIStack | TArray<UUserWidget*> | UI栈（用于层级管理） |
| InteractionComponent | BP_InteractionComponent* | 交互检测组件 |
| ExamineTarget | BP_InteractableObject* | 当前检查的物品 |
| CurrentPuzzle | BP_LockPuzzle* | 当前进行中的谜题 |
| bCanInteract | bool | 是否可交互（用于冷却） |

### 2.2 输入绑定 (SetupInputComponent)
```
SetupInputComponent:
  ├─ MoveForward (Axis) → WASD/W键
  ├─ MoveRight (Axis) → A/D键
  ├─ Turn (Axis) → Mouse X
  ├─ LookUp (Axis) → Mouse Y
  ├─ Interact (Action, 按下) → E键 → Event_OnInteractPressed
  ├─ OpenNotebook (Action, 按下) → N键 → Event_OpenNotebook
  ├─ OpenInventory (Action, 按下) → I键 → Event_OpenInventory
  ├─ PauseGame (Action, 按下) → ESC键 → Event_PauseGame
  ├─ ExamineRotateX (Axis) → Mouse X (仅Examine模式)
  ├─ ExamineRotateY (Axis) → Mouse Y (仅Examine模式)
  └─ DigitInput 0-9 (Action) → 数字0-9键 → Event_DigitInput(int32 Digit)
```

### 2.3 核心事件
#### Event_OnInteractPressed
```
Event_OnInteractPressed:
  ├─ If bCanInteract == false → Return
  ├─ Switch CurrentInputMode:
  │
  │   ┌─ Exploration Mode:
  │   │   ├─ InteractionComponent -> GetNearestInteractable() → Target
  │   │   ├─ If Target != null:
  │   │   │   ├─ bCanInteract = false
  │   │   │   ├─ AudioManager -> PlaySFX("UI_Interact")
  │   │   │   ├─ If Target.bIsPickable && Target.bIsNote:
  │   │   │   │   ├─ Target -> Interact()
  │   │   │   │   └─ Event_OnNoteCollected(Target)
  │   │   │   ├─ Else If Target.bHasLockPuzzle:
  │   │   │   │   ├─ CurrentPuzzle = Target.GetPuzzleRef()
  │   │   │   │   ├─ GameInstance -> ChangeInputMode(Puzzle)
  │   │   │   │   ├─ PushWidget(WB_LockPuzzle)
  │   │   │   │   └─ WB_LockPuzzle -> Init(CurrentPuzzle.GetData())
  │   │   │   ├─ Else:
  │   │   │   │   ├─ Target -> Interact()
  │   │   │   │   └─ If Target.bCanExamine: Event_StartExamine(Target)
  │   │   └─ Delayed(0.3s) → bCanInteract = true
  │   │
  │   ├─ Puzzle Mode:
  │   │   └─ (已由 DigitInput 处理)
  │   │
  │   └─ UI Mode:
  │       └─ (由 Widget 内部处理)
  └─ 
```

#### Event_StartExamine (检查物品)
```
Event_StartExamine(BP_InteractableObject* Target):
  ├─ ExamineTarget = Target
  ├─ GameInstance -> ChangeInputMode(Examine)
  ├─ PushWidget(WB_ExamineItem)
  ├─ WB_ExamineItem -> SetExamineTarget(Target.GetMesh(), Target.GetData())
  ├─ AudioManager -> PlaySFX("Int_Pickup")
  └─ TelemetryManager -> RecordItemExamine(Target.GetItemID())
```

#### Event_EndExamine
```
Event_EndExamine:
  ├─ If ExamineTarget.bIsPickable:
  │    ├─ GameInstance.CollectedItems.Add(ExamineTarget.GetItemID())
  │    ├─ ExamineTarget -> Destroy() (从世界中移除)
  │    └─ TelemetryManager -> RecordItemCollected(ExamineTarget.GetItemID())
  ├─ PopWidget()
  ├─ GameInstance -> ChangeInputMode(Exploration)
  └─ ExamineTarget = null
```

#### Event_OnNoteCollected
```
Event_OnNoteCollected(BP_NoteItem* Note):
  ├─ PushWidget(WB_Notebook)
  ├─ WB_Notebook -> AddNoteAndShow(Note.GetNoteData())
  ├─ TelemetryManager -> RecordNoteCollected(Note.GetNoteID())
  └─ AudioManager -> PlaySFX("Int_NoteOpen")
```

#### PushWidget / PopWidget (UI栈管理)
```
Function PushWidget(UUserWidget* Widget):
  ├─ Widget -> AddToViewport(UIStack.Num() + 10)
  ├─ UIStack.Add(Widget)
  └─ AudioManager -> PlaySFX("UI_WidgetOpen")

Function PopWidget():
  ├─ If UIStack.Num() == 0 → Return
  ├─ Widget = UIStack.Pop()
  ├─ Widget -> RemoveFromParent()
  ├─ AudioManager -> PlaySFX("UI_WidgetClose")
  └─ If UIStack.Num() == 0 && CurrentInputMode == UI:
       GameInstance -> ChangeInputMode(Exploration)
```

---

## 三、BP_InteractionComponent (交互检测组件)

### 3.1 变量
| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| InteractDistance | float | 200.0 | 交互距离（cm） |
| CurrentHover | BP_InteractableObject* | null | 当前悬停的物体 |
| TraceChannel | ECollisionChannel | ECC_GameTraceChannel1 | 交互检测通道 |
| CheckInterval | float | 0.05s | 检测间隔 |
| HoverHighlightColor | FLinearColor | (1,0.9,0.6,1) | 悬停高亮色（暖色） |

### 3.2 事件流程
#### TickComponent (每 CheckInterval 执行)
```
Timer: CheckForInteractables:
  ├─ Owner(Pawn) -> GetCameraLocation() → CamLoc
  ├─ CamLoc + GetCameraForward() * InteractDistance → EndLoc
  ├─ LineTraceSingle(CamLoc → EndLoc, TraceChannel) → HitResult
  │
  ├─ If Hit.bBlockingHit:
  │    ├─ HitActor → Cast<BP_InteractableObject> → HitInteractable
  │    ├─ If HitInteractable != null && HitInteractable.CanInteract():
  │    │    ├─ If HitInteractable != CurrentHover:
  │    │    │   ├─ CurrentHover -> Highlight(false) (if exists)
  │    │    │   ├─ CurrentHover = HitInteractable
  │    │    │   ├─ CurrentHover -> Highlight(true, HoverHighlightColor)
  │    │    │   ├─ MainHUD -> ShowInteractPrompt(CurrentHover.GetPromptText())
  │    │    │   └─ AudioManager -> PlaySFX("UI_Hover", 0.5 Vol)
  │    │    └─ (保持悬停)
  │    └─ Else: ClearHover()
  └─ Else: ClearHover()
```

#### ClearHover
```
Function ClearHover():
  ├─ If CurrentHover != null:
  │    ├─ CurrentHover -> Highlight(false)
  │    ├─ CurrentHover = null
  │    └─ MainHUD -> HideInteractPrompt()
  └─
```

---

## 四、BP_PlayerCharacter (玩家角色)

### 4.1 组件
- CapsuleComponent (根组件, 碰撞)
- SpringArm (摄像机臂, 带碰撞)
- CameraComponent (第一人称摄像机, FOV 75)
- MovementComponent (CharacterMovement)
- InteractionComponent (附加)
- FootstepAudioComponent (音频)

### 4.2 变量
| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| WalkSpeed | float | 150.0 | 行走速度 |
| HeadBobFrequency | float | 1.5 | 头部晃动频率 |
| HeadBobAmplitude | FVector | (0,0,0.8) | 头部晃动幅度 |
| TimeSinceLastFootstep | float | 0.0 | 脚步声计时 |
| FootstepInterval | float | 0.5s | 脚步间隔 |

### 4.3 头部晃动 (Head Bob) - 环境反馈
```
Event Tick:
  ├─ Velocity.Size() → Speed
  ├─ If Speed > 10.0:
  │    ├─ BobPhase += DeltaTime * HeadBobFrequency * (Speed / WalkSpeed)
  │    ├─ Sin(BobPhase) * HeadBobAmplitude.Z → Camera.Z Offset
  │    ├─ Cos(BobPhase * 0.5) * HeadBobAmplitude.Y → Camera.Y Offset
  │    │
  │    └─ TimeSinceLastFootstep += DeltaTime
  │         ├─ If TimeSinceLastFootstep >= FootstepInterval:
  │         │    ├─ AudioManager -> PlaySFXAtLocation(
  │         │    │     "Env_Footstep_Wood", GetActorLocation(), 0.3 Vol)
  │         │    └─ TimeSinceLastFootstep = 0.0
  │         └─
  └─ Else: BobPhase *= 0.9 (缓回)
```

---

## 五、BP_InteractableObject (可交互物体基类)

### 5.1 实现接口: II_Interactable
接口函数:
- `Interact(APawn* Instigator)` - 主交互
- `CanInteract() → bool` - 是否可交互
- `GetPromptText() → FText` - 获取提示文本
- `Highlight(bool bOn, FLinearColor Color)` - 高亮

### 5.2 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| ItemData | UDA_ItemData* | 物品数据资产引用 |
| bIsPickable | bool | 是否可拾取（从 Data 同步） |
| bIsLocked | bool | 是否需要钥匙/前置 |
| bIsExamined | bool | 是否已被检查过 |
| OriginalMaterials | TArray<UMaterialInterface*> | 原始材质（用于高亮恢复） |
| HighlightMIDs | TArray<UMaterialInstanceDynamic*> | 高亮动态材质实例 |

### 5.3 函数
#### Highlight (On/Off)
```
Function Highlight(bool bEnable, FLinearColor Color = Default):
  ├─ For each StaticMeshComponent:
  │    ├─ If bEnable:
  │    │    ├─ Create Dynamic Material Instance → MID
  │    │    ├─ MID -> SetVectorParameter("HighlightColor", Color)
  │    │    ├─ MID -> SetScalarParameter("HighlightIntensity", 1.0)
  │    │    └─ Set Material(MID)
  │    └─ Else: Restore Original Material
  └─
```

#### CanInteract
```
Function CanInteract() → bool:
  ├─ If bIsLocked:
  │    ├─ If GameInstance.CollectedItems.Contains(ItemData.PreconditionItem):
  │    │    └─ Return true
  │    └─ Else: Return false
  └─ Return true
```

#### GetPromptText
```
Function GetPromptText() → FText:
  ├─ If bIsLocked:
  │    └─ Return "需要钥匙..."
  ├─ Else If ItemData.bIsNote:
  │    └─ Return "按 E 阅读笔记"
  ├─ Else If bIsPickable:
  │    └─ Return "按 E 拾取 " + ItemData.DisplayName
  ├─ Else If HasPuzzle:
  │    └─ Return "按 E 尝试开锁"
  └─ Else:
       Return "按 E 检查"
```

---

## 六、BP_Door (门对象)

### 6.1 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| DoorID | FName | 门唯一ID |
| bIsOpen | bool | 当前是否打开 |
| bIsLocked | bool | 是否锁着 |
| OpenAngle | float | 90.0 | 开门角度 |
| OpenAnimationTime | float | 0.8s | 开门动画时长 |
| LinkedLockPuzzle | FName | 关联的锁谜题ID |

### 6.2 开门流程
```
Function OpenDoor():
  ├─ If bIsOpen || bIsLocked → Return
  ├─ bIsOpen = true
  ├─ Play Timeline (OpenDoorTimeline):
  │    ├─ 0.0 → OpenAngle (Yaw Rotation)
  │    ├─ Ease Out
  │    └─ Duration = OpenAnimationTime
  ├─ AudioManager -> PlaySFXAtLocation("Env_DoorCreak", GetActorLocation())
  ├─ Delayed(0.3s) → AudioManager -> PlaySFXAtLocation("Env_DoorShut", ...)
  └─ TelemetryManager -> RecordDoorOpened(DoorID)
```

#### 解锁触发 (由 LockPuzzle 回调)
```
Event OnUnlockRequested:
  ├─ bIsLocked = false
  └─ Play Vignette Flash (轻微白色闪烁)
```
