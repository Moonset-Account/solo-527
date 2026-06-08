# 谜题、笔记与章节系统蓝图逻辑

---

## 一、DA_NoteData (笔记数据资产)

### 1.1 字段结构
| 字段名 | 类型 | 说明 |
|--------|------|------|
| NoteID | FName | 笔记唯一ID |
| Title | FText | 笔记标题（如 "四月三日"） |
| Author | FText | 作者名（如 "林女士"） |
| DateStr | FText | 日期字符串 |
| Pages | TArray<FNotePage> | 多页内容 |
| MoodTag | ENoteMood | 情绪标签（影响背景色） |
| RelatedPuzzleID | FName | 关联的谜题ID（线索指向） |
| bIsEvidence | bool | 是否为关键证据 |

**结构体 FNotePage**:
| 字段 | 类型 |
|------|------|
| PageText | FText |
| bHasDrawing | bool |
| DrawingImage | UTexture2D* |

**枚举 ENoteMood**:
- `Neutral` (0) - 普通（米黄纸色）
- `Tense` (1) - 紧张（灰黄色）
- `Somber` (2) - 忧郁（淡蓝色灰）
- `Urgent` (3) - 紧急（淡红色）
- `Cryptic` (4) - 神秘（淡紫色）

---

## 二、BP_NoteItem (世界中的笔记物体)

### 2.1 继承关系
`BP_NoteItem` → 继承自 `BP_InteractableObject`

### 2.2 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| NoteDataAsset | UDA_NoteData* | 笔记数据引用 |
| PaperMesh | UStaticMeshComponent* | 纸张网格组件 |
| FloatAmplitude | float | 悬浮动画幅度（0.5cm） |
| FloatSpeed | float | 悬浮速度 |

### 2.3 行为
#### 悬浮动画 (Tick)
```
Event Tick:
  ├─ FloatPhase += DeltaTime * FloatSpeed
  ├─ PaperMesh -> SetRelativeLocation(
  │    (0, 0, Sin(FloatPhase) * FloatAmplitude))
  └─ PaperMesh -> AddLocalRotation(
       (0, DeltaTime * 5.0, 0))
```

#### 覆写 Interact
```
Function Interact(APawn* Instigator):
  ├─ (调用基类)
  ├─ Play Pickup Animation (纸张微微上升)
  ├─ Delayed(0.15s):
  │    ├─ PlayerController -> OnNoteCollected(this)
  │    └─ Destroy()
  └─
```

---

## 三、BP_LockPuzzle (锁谜题)

### 3.1 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| PuzzleData | UDA_LockPuzzleData* | 谜题数据资产引用 |
| CurrentInput | TArray<int32> | 当前玩家输入的数字 |
| AttemptCount | int32 | 尝试次数 |
| MaxAttempts | int32 | 3 | 最大尝试次数（超限后临时锁定） |
| bIsSolved | bool | 是否已解开 |
| LockCooldownTimer | float | 锁定冷却计时器 |
| DigitWidgets | TArray<WB_LockDigit*> | 数字位UI组件引用 |
| LockMeshComponent | UStaticMeshComponent* | 锁的3D模型 |

### 3.2 DA_LockPuzzleData 完整字段
| 字段 | 类型 | 说明 |
|------|------|------|
| PuzzleID | FName | 如 "BedroomDrawerLock" |
| LockType | ELockType | DigitLock / PatternLock |
| DigitCount | int32 | 3~6 |
| Password | TArray<int32> | 正确密码序列 |
| HintText | FText | 提示文本（如"看日历上的生日"） |
| FailFeedback | FText | 失败提示（如"不对...再想想"） |
| RewardItemID | FName | 解开后自动放入背包的物品 |
| UnlocksDoorID | FName | 解开后自动打开的门ID |
| OnSolveText | FText | 解开后的旁白文本 |
| ShakeOnFailIntensity | float | 1.0 | 失败时屏幕震动强度 |
| LockSoundLoop | USoundBase* | 锁转动音效循环 |

**枚举 ELockType**:
- `DigitLock` (0) - 数字密码锁
- `PatternLock` (1) - 方向/图案锁（预留）

### 3.3 核心函数

#### 输入数字
```
Function InputDigit(int32 Digit):
  ├─ If bIsSolved → Return
  ├─ If LockCooldownTimer > 0 → Return (冷却中)
  ├─ If CurrentInput.Num() >= PuzzleData.DigitCount → Return
  │
  ├─ CurrentInput.Add(Digit)
  ├─ UpdateDigitWidget(CurrentInput.Num()-1, Digit)
  ├─ AudioManager -> PlaySFX("Puzzle_DigitClick")
  ├─ DigitWidget -> Play Pulse Animation
  │
  └─ If CurrentInput.Num() == PuzzleData.DigitCount:
       Delayed(0.2s) → CheckPassword()
```

#### 清除当前输入
```
Function ClearInput():
  ├─ CurrentInput.Empty()
  ├─ For each Widget in DigitWidgets:
  │    └─ Widget -> SetDisplayValue(-1) (显示"--")
  └─ AudioManager -> PlaySFX("Puzzle_Clear")
```

#### 校验密码
```
Function CheckPassword():
  ├─ AttemptCount++
  ├─ TelemetryManager -> RecordPuzzleAttempt(
  │    PuzzleData.PuzzleID, CurrentInput, AttemptCount)
  │
  ├─ If CurrentInput == PuzzleData.Password:
  │    ├─ OnSolveSuccess()
  │    └─ Return
  │
  └─ Else:
       ├─ OnSolveFail()
       └─ If AttemptCount >= MaxAttempts:
            StartLockCooldown(5.0s)
```

#### 解开成功
```
Function OnSolveSuccess():
  ├─ bIsSolved = true
  ├─ AudioManager -> PlaySFX("Puzzle_Solve")
  ├─ DigitWidgets -> Play Success Flash Animation
  ├─ PlayerController -> Play CameraShake(0.1, 轻)
  ├─ MainHUD -> ShowNarratorText(PuzzleData.OnSolveText, 3s)
  │
  ├─ If PuzzleData.RewardItemID != None:
  │    └─ GameInstance.CollectedItems.Add(PuzzleData.RewardItemID)
  ├─ If PuzzleData.UnlocksDoorID != None:
  │    └─ FindDoor(PuzzleData.UnlocksDoorID) -> Unlock()
  │
  ├─ TelemetryManager -> RecordPuzzleSolved(
  │    PuzzleData.PuzzleID, AttemptCount)
  │
  └─ Delayed(1.5s) → ClosePuzzleWidget()
```

#### 解开失败
```
Function OnSolveFail():
  ├─ AudioManager -> PlaySFX("Puzzle_Fail")
  ├─ DigitWidgets -> Play Fail Shake Animation
  ├─ PlayerController -> Play CameraShake(PuzzleData.ShakeOnFailIntensity, 短)
  ├─ MainHUD -> ShowErrorToast(PuzzleData.FailFeedback)
  │
  ├─ TelemetryManager -> RecordPuzzleFailed(
  │    PuzzleData.PuzzleID, AttemptCount)
  │
  └─ Delayed(0.8s) → ClearInput()
```

#### 冷却锁定（防止暴力尝试）
```
Function StartLockCooldown(float Duration):
  ├─ LockCooldownTimer = Duration
  ├─ MainHUD -> ShowErrorToast("尝试次数过多，请稍后再试...", Duration)
  └─ Timer Decrement:
       While LockCooldownTimer > 0:
         LockCooldownTimer -= DeltaTime
         MainHUD -> UpdateLockCooldownDisplay(LockCooldownTimer)
```

#### 关闭谜题
```
Function ClosePuzzleWidget():
  ├─ PlayerController -> CurrentPuzzle = null
  ├─ PlayerController -> PopWidget()
  └─ GameInstance -> ChangeInputMode(Exploration)
```

---

## 四、BP_ChapterManager (章节管理器)

### 4.1 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| ChaptersData | TArray<UDA_ChapterData*> | 所有章节数据资产列表 |
| CurrentChapterIndex | int32 | 0 | 当前章节索引（0=第1章） |
| ChapterStartTime | float | 本章节开始的时间戳 |
| ChapterObjectives | TArray<FChapterObjective> | 当前章节目标列表 |
| bChapterCompleted | bool | 本章节是否已完成 |

**结构体 FChapterObjective**:
| 字段 | 类型 | 说明 |
|------|------|------|
| ObjectiveID | FName | 目标ID |
| Description | FText | 显示文本 |
| bIsRequired | bool | 是否必须完成 |
| bIsCompleted | bool | 是否已完成 |
| CheckType | EObjectiveCheck | 检查类型 |
| CheckValue | FName | 检查值（物品ID/谜题ID等） |

**枚举 EObjectiveCheck**:
- `CollectItem` (0) - 收集指定物品
- `SolvePuzzle` (1) - 解开指定谜题
- `EnterRoom` (2) - 进入指定房间
- `ReadNote` (3) - 阅读指定笔记
- `ExamineItem` (4) - 检查指定物品

### 4.2 核心函数

#### StartChapter (开始章节)
```
Function StartChapter(int32 ChapterIndex):
  ├─ If ChapterIndex >= ChaptersData.Num() → Return
  ├─ CurrentChapterIndex = ChapterIndex
  ├─ CurrentChapterData = ChaptersData[ChapterIndex]
  ├─ bChapterCompleted = false
  ├─ ChapterStartTime = Now() (Unix Timestamp)
  │
  ├─ ChapterObjectives = Load Objectives from ChapterData
  ├─ For each Obj in ChapterObjectives → Obj.bIsCompleted = false
  │
  ├─ TelemetryManager -> RecordChapterStart(
  │    CurrentChapterData.ChapterID)
  │
  ├─ AudioManager -> SetAmbient(CurrentChapterData.AmbientSound)
  ├─ MainHUD -> ShowChapterTitle(
  │    "第 " + CurrentChapterData.ChapterID + " 章",
  │    CurrentChapterData.ChapterTitle,
  │    3.0s)
  │
  └─ MainHUD -> UpdateObjectivesList(ChapterObjectives)
```

#### 检查目标进度（事件驱动）
```
Event OnObjectiveProgressMade(
    EObjectiveCheck CheckType, FName CheckValue):
  ├─ For each Obj in ChapterObjectives:
  │    ├─ If Obj.bIsCompleted → Continue
  │    ├─ If Obj.CheckType == CheckType && Obj.CheckValue == CheckValue:
  │    │    ├─ Obj.bIsCompleted = true
  │    │    ├─ MainHUD -> PlayObjectiveCompleteAnimation(Obj.ObjectiveID)
  │    │    └─ AudioManager -> PlaySFX("UI_ObjectiveComplete")
  │    └─
  ├─ MainHUD -> UpdateObjectivesList(ChapterObjectives)
  │
  └─ CheckChapterComplete()
```

#### 检查章节是否完成
```
Function CheckChapterComplete():
  ├─ RequiredObjectives = ChapterObjectives.Where(O => O.bIsRequired)
  ├─ AllRequiredDone = RequiredObjectives.All(O => O.bIsCompleted)
  │
  ├─ If AllRequiredDone && !bChapterCompleted:
  │    ├─ bChapterCompleted = true
  │    ├─ ChapterDuration = Now() - ChapterStartTime
  │    ├─ TelemetryManager -> RecordChapterComplete(
  │    │     CurrentChapterData.ChapterID,
  │    │     ChapterDuration,
  │    │     ChapterObjectives)
  │    │
  │    ├─ Unlock Next Chapter:
  │    │    NextChapterID = CurrentChapterData.ChapterID + 1
  │    │    If !GameInstance.UnlockedChapters.Contains(NextChapterID):
  │    │      GameInstance.UnlockedChapters.Add(NextChapterID)
  │    │
  │    └─ Show Chapter Complete Widget:
  │         PlayerController -> PushWidget(WB_ChapterComplete)
  │         WB_ChapterComplete -> Init(
  │           CurrentChapterData,
  │           ChapterDuration,
  │           ChapterObjectives)
  └─
```

#### 进入章节校验（关卡选择用）
```
Function CanEnterChapter(int32 ChapterIndex) → bool:
  ├─ If ChapterIndex < 0 || ChapterIndex >= ChaptersData.Num()
  │    → Return false
  ├─ Chapter = ChaptersData[ChapterIndex]
  ├─ If !GameInstance.UnlockedChapters.Contains(Chapter.ChapterID)
  │    → Return false
  ├─ For each ReqItem in Chapter.RequiredItems:
  │    └─ If !GameInstance.CollectedItems.Contains(ReqItem)
  │         → Return false
  └─ Return true
```

---

## 五、笔记本 UI 逻辑 (WB_Notebook)

### 5.1 UI 结构
```
WB_Notebook (Canvas Panel)
  ├─ Background (Border - 仿旧纸张材质)
  ├─ LeftPage (Border - 左侧页)
  │    └─ NoteListView (List View of Collected Notes)
  ├─ RightPage (Border - 右侧内容页)
  │    ├─ TitleTextBlock
  │    ├─ AuthorAndDateTextBlock
  │    └─ ContentRichText
  ├─ PageNavButtons (Previous/Next)
  ├─ CloseButton (X)
  └─ CluesTab / NotesTab (Tab Switcher)
```

### 5.2 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| CollectedNotes | TArray<UDA_NoteData*> | 已收集的笔记数据 |
| CurrentNoteIndex | int32 | 当前查看的笔记索引 |
| CurrentPageIndex | int32 | 当前笔记的第几页 |

### 5.3 核心功能
#### 添加笔记
```
Function AddNote(UDA_NoteData* NewNote):
  ├─ If CollectedNotes.Contains(NewNote) → Return
  ├─ CollectedNotes.Add(NewNote)
  ├─ NoteListView -> Refresh()
  └─ NoteListView -> Select Item (NewNote)
```

#### AddNoteAndShow (首次拾取时直接显示)
```
Function AddNoteAndShow(UDA_NoteData* NewNote):
  ├─ AddNote(NewNote)
  ├─ CurrentNoteIndex = CollectedNotes.Find(NewNote)
  ├─ CurrentPageIndex = 0
  ├─ DisplayNote(CurrentNoteIndex, CurrentPageIndex)
  └─ Play PageFlip In Animation
```

#### 翻页
```
Function FlipPage(bool bNext):
  ├─ CurrentNote = CollectedNotes[CurrentNoteIndex]
  ├─ If bNext:
  │    ├─ If CurrentPageIndex < CurrentNote.Pages.Num()-1:
  │    │    CurrentPageIndex++
  │    └─ Else If CurrentNoteIndex < CollectedNotes.Num()-1:
  │         CurrentNoteIndex++
  │         CurrentPageIndex = 0
  └─ Else:
       ├─ If CurrentPageIndex > 0:
       │    CurrentPageIndex--
       └─ Else If CurrentNoteIndex > 0:
            CurrentNoteIndex--
            CurrentNoteIndex = CollectedNotes[CurrentNoteIndex].Pages.Num()-1
  │
  ├─ AudioManager -> PlaySFX("UI_PageFlip")
  ├─ Play PageFlip Animation
  └─ Delayed(Anim Duration) → DisplayNote(CurrentNoteIndex, CurrentPageIndex)
```

#### 线索标签页（自动整理的谜题提示）
```
CluesTabContent:
  ├─ For each Solved/Active Puzzle:
  │    └─ Show Clue Card:
  │         - Puzzle Name
  │         - Related Notes (超链接跳转到笔记)
  │         - Status (未解决/已解开)
  └─ For each Evidence Note (bIsEvidence):
       └─ Show Evidence Marker
```
