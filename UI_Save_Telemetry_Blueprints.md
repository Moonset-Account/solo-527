# UI系统与数据记录蓝图逻辑

---

## 一、WB_MainHUD (主 HUD)

### 1.1 UI 结构
```
WB_MainHUD (Canvas - ZOrder 10)
  ├─ CrosshairWidget (中心准星 - 小点)
  │    └─ Size: 4x4, 半透明白色
  ├─ InteractPrompt (交互提示 - 屏幕底部中央)
  │    ├─ Background (深色圆角矩形 + 描边)
  │    ├─ KeyHintText "[E]" (金色)
  │    └─ PromptText "按 E 检查旧照片" (白色)
  ├─ ChapterTitleOverlay (章节标题 - 屏幕顶部中央)
  │    ├─ ChapterNumberText "第 一 章" (小号斜体)
  │    └─ ChapterTitleText "尘封的客厅" (大号字体)
  ├─ ObjectivesPanel (目标栏 - 屏幕右上角)
  │    ├─ TitleText "当前目标"
  │    └─ ObjectivesListView (动态列表)
  ├─ NarrationBar (旁白/叙事文本 - 屏幕底部)
  │    ├─ Background (半透明深色)
  │    └─ NarratorText (打字机效果)
  ├─ ToastArea (Toast消息 - 屏幕右下角)
  │    └─ ToastContainer (堆叠 Toast)
  ├─ Vignette (暗角效果 - Post Process Material)
  └─ FilmGrain (胶片颗粒 - 氛围)
```

### 1.2 核心函数
#### 显示交互提示
```
Function ShowInteractPrompt(FText PromptText):
  ├─ InteractPromptText -> SetText(PromptText)
  ├─ Play Animation: InteractPrompt_FadeIn (0.2s)
  └─ InteractPromptCanvas -> SetVisibility(Visible)

Function HideInteractPrompt():
  ├─ Play Animation: InteractPrompt_FadeOut (0.15s)
  └─ Delayed(Anim End) → SetVisibility(Collapsed)
```

#### 旁白文本（打字机效果）
```
Function ShowNarratorText(FText Text, float Duration = 3.0s):
  ├─ NarrationBar -> SetVisibility(Visible)
  ├─ NarratorText -> SetText("")
  ├─ Play Typewriter Animation:
  │    TotalChars = Text.Length()
  │    TypeInterval = 0.03s
  │    For i = 0 to TotalChars:
  │      Delayed(i * TypeInterval) →
  │        NarratorText -> Append(Text[i])
  │        AudioManager -> PlaySFX("UI_Typewriter", 0.3 Vol)
  ├─ Delayed(TotalChars * TypeInterval + Duration) →
  │    Play FadeOut Animation
  │    NarrationBar -> SetVisibility(Collapsed)
  └─
```

#### Toast 消息
```
Function ShowToast(FText Message, EToastType Type = Info, float Duration = 2.5s):
  ├─ Create WB_Toast Widget
  ├─ WB_Toast -> Init(Message, Type)
  ├─ ToastContainer -> Add Child
  ├─ Play Animation: Toast_SlideIn (0.3s, Ease Out)
  ├─ Delayed(Duration) →
  │    Play Animation: Toast_SlideOut (0.3s)
  │    Delayed(0.3s) → Remove from Parent
  └─

Enum EToastType:
  Info    (0) - 白色文字
  Success (1) - 绿色
  Warning (2) - 橙色
  Error   (3) - 红色
```

#### 章节标题展示
```
Function ShowChapterTitle(FText ChapterNum, FText ChapterName, float Duration):
  ├─ ChapterNumberText -> SetText(ChapterNum)
  ├─ ChapterTitleText -> SetText(ChapterName)
  ├─ ChapterTitleOverlay -> SetVisibility(Visible)
  ├─ Set Render Opacity = 0
  ├─ Play Timeline:
  │    0.0s - 0.5s: Opacity 0→1 (Fade In)
  │    0.5s - Duration-1.0s: Opacity 1 (Hold)
  │    Duration-1.0s - Duration: Opacity 1→0 (Fade Out)
  ├─ AudioManager -> PlaySFX("UI_ChapterTitle")
  └─ Delayed(Duration) → SetVisibility(Collapsed)
```

#### 屏幕震动/暗角效果
```
Function ApplyScreenShake(float Intensity, float Duration):
  ├─ PostProcess -> CameraShake Intensity = Intensity
  └─ Delayed(Duration) → Intensity = 0

Function FlashVignette(FLinearColor Color, float Duration = 0.3s):
  ├─ Vignette Material -> SetParam("FlashColor", Color)
  ├─ Timeline: 0→1→0 (FlashAlpha)
  └─ Delayed(Duration) → FlashAlpha = 0
```

---

## 二、WB_Settings (设置面板)

### 2.1 UI 结构
```
WB_Settings (Overlay)
  ├─ BackgroundDim (半透明黑色遮罩)
  ├─ SettingsPanel (Border - 居中, 旧纸质背景)
  │    ├─ TitleText "设置"
  │    ├─ TabButtons (音频/画面/控制/游戏性)
  │    ├─ TabContent
  │    │    ├─ Audio Tab:
  │    │    │   ├─ MasterVolumeSlider (0~100)
  │    │    │   ├─ SFXVolumeSlider
  │    │    │   ├─ AmbientVolumeSlider
  │    │    │   └─ UIVolumeSlider
  │    │    ├─ Display Tab:
  │    │    │   ├─ Resolution Dropdown
  │    │    │   ├─ Fullscreen Checkbox
  │    │    │   ├─ BrightnessSlider
  │    │    │   ├─ VSync Checkbox
  │    │    │   └─ FilmGrain Checkbox
  │    │    ├─ Controls Tab:
  │    │    │   ├─ MouseSensitivitySlider
  │    │    │   ├─ InvertY Checkbox
  │    │    │   └─ FOVSlider (60~90)
  │    │    └─ Gameplay Tab:
  │    │        ├─ Subtitles Checkbox
  │    │        ├─ AutoSaveIntervalSlider (1~10分钟)
  │    │        └─ HardMode Checkbox (谜题无提示)
  │    ├─ BottomButtons:
  │    │   ├─ ApplyButton
  │    │   ├─ ResetButton
  │    │   └─ BackButton
  │    └─
  └─
```

### 2.2 数据结构 - FGameSettings
| 字段 | 类型 | 默认值 |
|------|------|--------|
| MasterVolume | float | 1.0 |
| SFXVolume | float | 1.0 |
| AmbientVolume | float | 0.8 |
| UIVolume | float | 1.0 |
| Resolution | FIntPoint | (1920,1080) |
| bFullscreen | bool | true |
| Brightness | float | 1.0 |
| bVSync | bool | true |
| bFilmGrain | bool | true |
| MouseSensitivity | float | 1.0 |
| bInvertY | bool | false |
| FOV | float | 75.0 |
| bSubtitles | bool | true |
| AutoSaveMinutes | int32 | 5 |
| bHardMode | bool | false |

### 2.3 保存/应用
```
Function ApplySettings():
  ├─ AudioManager -> SetVolume(Master, SFX, Ambient, UI)
  ├─ GameUserSettings -> SetResolution(Resolution)
  ├─ GameUserSettings -> SetFullscreenMode(bFullscreen)
  ├─ GameUserSettings -> SetVSyncEnabled(bVSync)
  ├─ GameUserSettings -> ApplySettings()
  ├─ PlayerController -> SetMouseSensitivity(MouseSensitivity)
  ├─ PlayerController -> SetInvertY(bInvertY)
  ├─ PlayerCamera -> SetFOV(FOV)
  ├─ MainHUD -> SetFilmGrainEnabled(bFilmGrain)
  └─ SaveManager -> SaveSettings(CurrentSettings)
```

---

## 三、WB_LoadSave (存档/读档面板)

### 3.1 UI 结构
```
WB_LoadSave (Overlay)
  ├─ BackgroundDim
  ├─ Panel (居中)
  │    ├─ TitleText: "存档" / "读档" (根据模式切换)
  │    ├─ SaveSlotListView (5~10个存档位)
  │    │    └─ 每 Slot:
  │    │        ├─ SlotNumber "存档 1"
  │    │        ├─ ChapterInfo "第2章 · 旧卧室"
  │    │        ├─ DateTime "2026-06-09 15:32"
  │    │        ├─ PlayTime "用时: 00:42:15"
  │    │        ├─ ThumbnailImage (关卡截图)
  │    │        └─ EmptySlotState (空存档显示"空")
  │    ├─ SelectedSlotDetails (右侧)
  │    │    ├─ CollectedItemsCount "物品: 12/20"
  │    │    ├─ NotesCount "笔记: 5/8"
  │    │    └─ ChapterProgress "目标: 3/5 完成"
  │    └─ BottomButtons:
  │         ├─ LoadButton / SaveButton (按模式)
  │         ├─ DeleteButton
  │         └─ BackButton
  └─
```

### 3.2 存档数据结构 - FSaveGameSlot
| 字段 | 类型 | 说明 |
|------|------|------|
| SlotIndex | int32 | 槽位编号 |
| SaveTime | FDateTime | 保存时间 |
| ChapterID | int32 | 当前章节 |
| LevelName | FName | 当前关卡名 |
| PlayTimeSeconds | float | 累计游戏时间 |
| CollectedItems | TArray<FName> | 已收集物品 |
| ReadNotes | TArray<FName> | 已读笔记 |
| SolvedPuzzles | TArray<FName> | 已解谜题 |
| OpenedDoors | TArray<FName> | 已打开的门 |
| PlayerTransform | FTransform | 玩家位置 |
| ObjectivesState | TArray<FName> | 已完成目标 |
| SettingsSnapshot | FGameSettings | 设置快照 |
| Thumbnail | UTexture2D* | 缩略图 |

### 3.3 核心流程
#### 保存
```
Function OnSaveClicked(int32 SlotIndex):
  ├─ SaveData = BuildSaveData()
  ├─ SaveManager -> SaveGameToSlot(SlotIndex, SaveData)
  │    ├─ Capture Screenshot → Thumbnail
  │    ├─ Serialize SaveData to Bytes
  │    └─ Write to SaveSlot_<SlotIndex>.sav
  ├─ AudioManager -> PlaySFX("UI_SaveComplete")
  └─ ShowToast("游戏已保存", Success)
```

#### 读取
```
Function OnLoadClicked(int32 SlotIndex):
  ├─ SaveData = SaveManager -> LoadGameFromSlot(SlotIndex)
  ├─ If SaveData == null:
  │    ShowToast("存档数据损坏", Error)
  │    Return
  ├─ ConfirmDialog: "是否读取该存档？当前进度将丢失。"
  ├─ If Confirmed:
  │    ├─ TelemetryManager -> RecordSaveLoad(SlotIndex, true)
  │    ├─ GameInstance -> ApplySaveData(SaveData)
  │    ├─ AudioManager -> PlaySFX("UI_LoadComplete")
  │    └─ GameInstance -> RequestLevelTransition(SaveData.LevelName)
  └─
```

#### 自动保存
```
Timer: AutoSaveCheck (每分钟检查):
  ├─ If AutoSaveMinutes elapsed since last save:
  │    ├─ OnSaveClicked(AutoSaveSlotIndex, bSilent = true)
  │    └─ If !Silent: ShowToast("已自动保存", Info, 1.5s)
  └─
```

---

## 四、WB_LevelSelect (关卡选择)

### 4.1 UI 结构
```
WB_LevelSelect (Overlay)
  ├─ Background (公寓平面图 淡色背景)
  ├─ TitleText "选择章节"
  ├─ ChaptersGrid (网格 3列×2行)
  │    └─ 每个 ChapterCard:
  │        ├─ ChapterNumberBadge "第1章"
  │        ├─ ChapterTitle "尘封的客厅"
  │        ├─ Description "整理租客留下的物品..."
  │        ├─ PreviewImage (概念图/截图)
  │        ├─ ProgressBar (物品/笔记/谜题完成度)
  │        ├─ UnlockedOverlay (空 / 锁图标)
  │        └─ StatusText "已解锁" / "完成第X章后解锁"
  └─ BottomButtons:
       ├─ StartButton
       └─ BackButton
```

### 4.2 关卡卡片逻辑
```
Function RefreshChaptersGrid():
  ├─ ChaptersData = ChapterManager.GetAllChapters()
  ├─ For each Chapter in ChaptersData (index i):
  │    ├─ Card = Create ChapterCardWidget
  │    ├─ bUnlocked = ChapterManager.CanEnterChapter(i)
  │    ├─ Card.SetEnabled(bUnlocked)
  │    ├─ If bUnlocked:
  │    │    ├─ Load Progress Save → ProgressData
  │    │    ├─ Card.ProgressBar -> SetPercent(ProgressData.CompletionPct)
  │    │    └─ Card.StatusText -> "上次用时: " + ProgressData.BestTime
  │    └─ Else:
  │         Card.StatusText -> "需先完成上一章"
  └─
```

---

## 五、WB_ChapterComplete (过关结算)

### 5.1 UI 结构
```
WB_ChapterComplete (Overlay - ZOrder 50)
  ├─ BlackFade (全屏渐黑)
  ├─ Panel (居中浮现)
  │    ├─ ChapterBadge "第 2 章"
  │    ├─ TitleText "旧卧室 - 完成"
  │    ├─ DividerLine
  │    ├─ StatsGrid (2列):
  │    │    ├─ Label "用时" | Value "00:18:42"
  │    │    ├─ Label "收集物品" | Value "7 / 9"
  │    │    ├─ Label "阅读笔记" | Value "4 / 5"
  │    │    ├─ Label "解开谜题" | Value "2 / 2"
  │    │    ├─ Label "失败次数" | Value "3 次"
  │    │    └─ Label "完成度" | Value "86%"
  │    ├─ Optional: SpeedRecordBadge (新纪录! 金框)
  │    ├─ UnlockNotice (如解锁下一章):
  │    │    "已解锁: 第3章 · 厨房深处"
  │    └─ BottomButtons:
  │         ├─ NextChapterButton "继续下一章"
  │         ├─ ReplayButton "重玩本章"
  │         └─ ReturnToMenuButton "返回主菜单"
  └─
```

### 5.2 进入动画
```
Event Construct:
  ├─ Set Opacity = 0
  ├─ BlackFade -> SetOpacity(0)
  ├─ Panel -> SetRenderScale(0.8)
  ├─ Timeline (总时长 1.5s):
  │    0.0s - 0.5s: BlackFade Opacity 0→0.9
  │    0.3s - 0.8s: Main Opacity 0→1
  │    0.3s - 0.8s: Panel Scale 0.8→1.0 (Ease Out Elastic)
  │    0.8s - 1.5s: 逐行淡入 StatsGrid (每行 0.1s 间隔)
  ├─ AudioManager -> PlaySFX("UI_ChapterComplete")
  └─
```

### 5.3 按钮回调
```
OnNextChapterClicked:
  ├─ Play FadeOut Animation
  ├─ NextChapterIndex = CurrentChapterIndex + 1
  ├─ If ChapterManager.CanEnterChapter(NextChapterIndex):
  │    ChapterManager -> StartChapter(NextChapterIndex)
  │    NextLevelName = ChaptersData[NextChapterIndex].LevelName
  │    PlayerController -> PopWidget()
  │    GameInstance -> RequestLevelTransition(NextLevelName)
  └─

OnReplayClicked:
  ├─ Play FadeOut
  ├─ Reload Current Level (重置状态)
  └─

OnReturnToMenuClicked:
  ├─ SaveManager -> SaveGame (自动保存)
  ├─ PlayerController -> PopWidget()
  └─ GameInstance -> RequestLevelTransition(MainMenu)
```

---

## 六、BP_SaveManager (存档管理器)

### 6.1 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| AutoSaveSlotIndex | int32 | 0 (自动存档槽位) |
| ManualSlotCount | int32 | 5 (手动存档数量) |
| SaveSlotCache | TArray<FSaveGameSlot> | 缓存的存档元数据 |
| LastAutoSaveTime | float | 上次自动保存时间 |

### 6.2 核心函数
#### BuildSaveData (构建存档数据)
```
Function BuildSaveData() → FSaveGameSlot:
  ├─ SaveData.SlotIndex = TargetSlot
  ├─ SaveData.SaveTime = Now()
  ├─ SaveData.ChapterID = ChapterManager.CurrentChapterData.ChapterID
  ├─ SaveData.LevelName = CurrentLevelName
  ├─ SaveData.PlayTimeSeconds = TelemetryManager.GetTotalPlayTime()
  ├─ SaveData.CollectedItems = GameInstance.CollectedItems
  ├─ SaveData.ReadNotes = Notebook.GetReadNoteIDs()
  ├─ SaveData.SolvedPuzzles = AllSolvedPuzzleIDs
  ├─ SaveData.OpenedDoors = AllOpenedDoorIDs
  ├─ SaveData.PlayerTransform = Player.GetTransform()
  ├─ SaveData.ObjectivesState = CompletedObjectiveIDs
  ├─ SaveData.SettingsSnapshot = CurrentSettings
  └─ Return SaveData
```

#### ApplySaveData (应用存档数据)
```
Function ApplySaveData(FSaveGameSlot SaveData):
  ├─ GameInstance.CollectedItems = SaveData.CollectedItems
  ├─ GameInstance.UnlockedChapters = Load from Save
  ├─ Notebook.SetReadNotes(SaveData.ReadNotes)
  ├─ (关卡加载后) Player.SetTransform(SaveData.PlayerTransform)
  ├─ (关卡加载后) Restore Puzzle States
  └─ (关卡加载后) Restore Door States
```

---

## 七、BP_TelemetryManager (试玩数据记录系统)

### 7.1 核心数据结构

#### FSessionRecord (单次游戏会话记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| SessionID | FGuid | 会话唯一ID |
| StartTime | FDateTime | 开始时间 |
| EndTime | FDateTime | 结束时间 |
| TotalPlaySeconds | float | 总游玩时间 |
| ChaptersPlayed | TArray<FChapterRecord> | 每章记录 |
| PuzzleFailures | int32 | 总谜题失败次数 |
| ItemExaminedCount | int32 | 物品检查次数 |
| NotesReadCount | int32 | 笔记阅读次数 |
| KeyChoices | TArray<FChoiceRecord> | 关键选择记录 |

#### FChapterRecord (单章记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| ChapterID | int32 | 章节编号 |
| StartTime | float | 开始时间戳 |
| CompletionSeconds | float | 完成用时 |
| bCompleted | bool | 是否完成 |
| ItemsCollected | TArray<FName> | 收集的物品 |
| NotesRead | TArray<FName> | 阅读的笔记 |
| PuzzleAttempts | TMap<FName, int32> | 每谜题尝试次数 |
| PuzzlesSolved | TArray<FName> | 解开的谜题 |
| DoorsOpened | TArray<FName> | 打开的门 |
| FailCount | int32 | 失败次数 |

#### FChoiceRecord (关键选择记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| ChoiceID | FName | 选择ID |
| Description | FText | 描述 |
| ChoiceMade | int32 | 选择结果索引 |
| Timestamp | float | 游戏内时间 |
| Consequences | TArray<FName> | 触发的后果 |

### 7.2 记录事件函数表

| 事件函数 | 调用时机 | 记录数据 |
|---------|---------|---------|
| `RecordSessionStart()` | 游戏启动 | SessionID, StartTime |
| `RecordSessionEnd()` | 游戏退出 | EndTime, TotalPlaySeconds |
| `RecordLevelExit()` | 切换关卡 | 当前位置, 累计进度 |
| `RecordChapterStart(ChapterID)` | 进入新章 | ChapterID, StartTime |
| `RecordChapterComplete(ChapterID, Duration, Objectives)` | 章节完成 | FChapterRecord |
| `RecordItemExamine(ItemID)` | 检查物品 | ItemID, Timestamp |
| `RecordItemCollected(ItemID)` | 拾取物品 | ItemID, Timestamp |
| `RecordNoteCollected(NoteID)` | 拾取笔记 | NoteID, ChapterID |
| `RecordPuzzleAttempt(PuzzleID, Input, AttemptNo)` | 尝试解谜 | Input, AttemptNo |
| `RecordPuzzleFailed(PuzzleID, AttemptNo)` | 解谜失败 | FailCount++ |
| `RecordPuzzleSolved(PuzzleID, Attempts)` | 解谜成功 | Attempts, Timestamp |
| `RecordDoorOpened(DoorID)` | 开门 | DoorID, ChapterID |
| `RecordSaveLoad(SlotIndex, bIsLoad)` | 存读档 | Slot, Timestamp |
| `RecordChoiceMade(ChoiceID, ChoiceIndex, Desc)` | 关键选择 | FChoiceRecord |
| `GetTotalPlayTime()` → float | 查询接口 | 累计秒数 |

### 7.3 数据导出
```
Function ExportTelemetryToJSON() → FString:
  ├─ Serialize SessionRecord to JSON string
  └─ (可用于测试分析)

Function WriteTelemetryToDisk():
  ├─ JSON = ExportTelemetryToJSON()
  ├─ FilePath = ProjectSavedDir/Telemetry/Session_<ID>.json
  └─ SaveStringToFile(JSON, FilePath)
```

---

## 八、WB_ExamineItem (物品检查面板)

### 8.1 UI 结构
```
WB_ExamineItem (Overlay)
  ├─ BackgroundDim (黑色遮罩)
  ├─ SceneCaptureWidget (渲染物品3D模型)
  ├─ BottomBar:
  │    ├─ ItemNameText "泛黄的照片"
  │    ├─ DescriptionText
  │    └─ ExamineFlavorText (随视角变化的旁白)
  ├─ HintHotspots (可点击区域 - 如有):
  │    └─ HotspotButton (圆圈) → OnClick → 显示额外文本
  ├─ RotationHintText "用鼠标旋转查看" (进入时提示 2s)
  └─ CloseButton "[ESC] 退出 / 拾取"
```

### 8.2 3D旋转控制
```
Axis MoveRotateX (鼠标X轴):
  └─ SceneCaptureActor -> AddActorWorldRotation(
       (0, 0, -InputValue * RotationSpeed))

Axis MoveRotateY (鼠标Y轴):
  └─ SceneCaptureActor -> AddActorWorldRotation(
       (0, InputValue * RotationSpeed, 0))
```

### 8.3 拾取流程
```
OnPickupButtonClicked:
  ├─ If ItemData.bIsPickable:
  │    ├─ Play PickupSound
  │    ├─ ShowToast("已获得: " + ItemName, Success)
  │    └─ PlayerController -> EndExamine(bTakeItem=true)
  ├─ Else:
  │    ShowToast("无法带走此物品", Info)
  └─
```
