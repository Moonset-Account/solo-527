# UI 系统架构设计

> 文件：[UISystem.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/UISystem.md)

---

## 1. UI 总览与分层策略

UI 采用 8 层深度 (Z-Order) 结构，确保多界面叠加时层级正确：

```
Z=0  游戏世界渲染层 (World / SceneView)
Z=10 WBP_InteractionPrompt   (交互提示，跟随3D物体屏幕坐标)
Z=20 WBP_MainHUD             (准星、电量、章节进度、提示信息)
Z=30 WBP_Tutorial            (教程弹层、操作指引)
Z=40 WBP_Notebook            (笔记本/物品栏，核心UI)
Z=50 WBP_ExamineOverlay      (物品3D检查视口)
Z=60 WBP_Puzzle              (各类谜题覆盖层，密码锁等)
Z=70 WBP_PauseMenu           (暂停菜单)
Z=80 WBP_Settings            (设置页面 - 在暂停菜单之上)
Z=90 WBP_ChapterResult       (章节结算，强制覆盖)
Z=100 WBP_LoadingScreen      (加载屏，最高优先级)
```

---

## 2. WBP 蓝图清单

### 2.1 主菜单系列 (Content/UI/WBP)

| 蓝图文件名                    | 功能说明                    | 触发时机                        |
|-----------------------------|-------------------------|-----------------------------|
| `WBP_MainMenu`              | 游戏主菜单                  | 启动/MainMenu Level BeginPlay  |
| `WBP_NewGameDialog`         | 新游戏存档槽选择              | 点击"开始新游戏"                  |
| `WBP_ContinueMenu`          | 继续游戏存档列表              | 点击"继续游戏"                   |
| `WBP_Settings`              | 通用设置页 (视频/音频/控制)    | 主菜单/暂停菜单                  |
| `WBP_Leaderboard`           | 本地排行榜页                 | 主菜单点击"排行榜"                |
| `WBP_DailyChallenge`        | 每日挑战说明/排行榜            | 主菜单点击"每日挑战"               |
| `WBP_Achievements`          | 成就展示页                  | 主菜单点击"成就" / 暂停菜单        |
| `WBP_LoadingScreen`         | 关卡加载屏                  | OpenLevel 过渡期间               |
| `WBP_TutorialIntro`         | 首次启动的教程介绍             | 新游戏第一次进入                    |

### 2.2 游戏内UI系列

| 蓝图文件名                    | 功能说明                    | 触发时机                        |
|-----------------------------|-------------------------|-----------------------------|
| `WBP_MainHUD`               | 游戏主HUD                  | 玩家出生时由 PlayerController 创建 |
| `WBP_InteractionPrompt`     | "[E] 检查桌子" 交互提示      | Trace 命中 Interactable           |
| `WBP_Notebook`              | 笔记本(线索页/笔记页/地图页)     | 按 J / Tab 键                   |
| `WBP_InventoryPanel`        | 物品栏快捷栏 (可整合到笔记本)    | 按 I 键 / 笔记本 Tab              |
| `WBP_ExamineOverlay`        | 3D物品检查叠加层              | 按 F / 点击线索物品               |
| `WBP_PauseMenu`             | 暂停菜单 (主菜单/设置/退出)     | 按 ESC / P                      |
| `WBP_ChapterResult`         | 章节结算 (分数/用时/失误)       | 章节结束触发                       |
| `WBP_GameResult`            | 全部完成结算 + 解锁内容          | 全部章节完成                        |
| `WBP_AchievementToast`      | 成就解锁提示 (右上角浮窗)        | 成就触发时                        |
| `WBP_CaptionSubtitle`       | 环境对白/语音字幕              | 播放VoiceLine时                    |
| `WBP_SaveNotice`            | "游戏已保存" 自动保存提示        | 自动保存触发                       |
| `WBP_DialogueBox`           | 剧情对白 (非玩家角色回忆)        | 触发关卡剧情                       |

### 2.3 谜题UI系列

| 蓝图文件名                    | 功能说明                    | 关联谜题Actor                   |
|-----------------------------|-------------------------|-----------------------------|
| `WBP_Puzzle_DialLock`       | 4位数字转盘密码锁             | BP_Door_Locked / BP_Safe       |
| `WBP_Puzzle_KeyPad`         | 电子密码键盘                 | BP_Keypad_Door                 |
| `WBP_Puzzle_PatternMatch`   | 图案匹配 (连线/记忆)           | BP_PatternLock                 |
| `WBP_Puzzle_Sliding`        | 滑块拼图 (5x5)              | BP_SlidingPuzzle               |
| `WBP_Puzzle_Combination`    | 多线索交叉推理 (多输入组合)      | BP_LogicPuzzle                 |

---

## 3. 核心 WBP 详细结构

### 3.1 WBP_MainMenu

**画布结构 (Canvas Panel)**：
```
CanvasPanel
  ├─ Image_Background (占满屏, 老公寓氛围图)
  │     └─ MaterialInstance: MI_MainMenu_BG (扫描线+颗粒效果)
  │
  ├─ VerticalBox_Menu (屏幕居中)
  │    ├─ TextBlock_Title (游戏大标题: "旧公寓谜案")
  │    ├─ TextBlock_Subtitle (副标题: "Beta v0.1.0")
  │    ├─ Spacer_100
  │    ├─ Button_NewGame    →  WBP_NewGameDialog
  │    ├─ Button_Continue   →  WBP_ContinueMenu
  │    ├─ Button_Daily      →  WBP_DailyChallenge
  │    ├─ Button_Leaderboard→  WBP_Leaderboard
  │    ├─ Button_Achievements→ WBP_Achievements
  │    ├─ Button_Settings   →  WBP_Settings
  │    └─ Button_ExitGame   →  退出提示 + Quit
  │
  ├─ TextBlock_Copyright (底部)
  └─ WBP_AchievementToast_Slot (成就提示槽位)
```

**蓝图逻辑**：
```
Construct Event:
  → Check Save Slots → Disable "Continue" if none
  → Play Ambient Music (Music/MainMenu_Theme.wav)
  → Check LastPlayed Date → Highlight Daily Button if not completed today

Button_NewGame.OnClicked:
  → Create WBP_NewGameDialog
  → AddToViewport (Z=85)
  → Set InputMode UIOnly

Dialog Slot Selected (SlotIndex Int):
  → GameInstance::StartNewGame("Save_{SlotIndex:02}")
  → Show LoadingScreen with Chapter Title
  → OpenLevel(Chapter01)
```

### 3.2 WBP_MainHUD

**构成 (Overlay)**：
```
Overlay
  ├─ [Slot_0 - Center] Reticle_Crosshair
  │     (细微中心点 + 交互时变"手"形图标)
  │
  ├─ [Slot_0 - TopLeft]
  │   VerticalBox_ChapterInfo
  │     ├─ Text_ChapterName (第1章：失踪的租客)
  │     └─ ProgressBar_Clues (进度 2/12)
  │
  ├─ [Slot_0 - TopRight]
  │   VerticalBox_Timer
  │     ├─ Text_TimeElapsed (00:12:34)
  │     └─ Text_Mistakes (失误: 1)
  │
  ├─ [Slot_0 - BottomRight]
  │   HorizontalBox_Flashlight
  │     ├─ Image_FlashlightIcon
  │     └─ ProgressBar_Battery
  │
  ├─ [Slot_0 - BottomLeft]
  │   WBP_SaveNotice_Slot (添加时出现)
  │
  ├─ [Slot_0 - BottomCenter]
  │   WBP_CaptionSubtitle_Slot (配音字幕)
  │
  └─ [Slot_0 - TopCenter]
      Text_CenterHint (临时提示 "按 J 打开笔记本...")
```

**蓝图事件**：
```
Custom Event UpdateHUD(GameStateRef):
  → ChapterName.Text = ChapterDataAsset.DisplayName
  → CluesProgress.Percent = CluesFound / CluesTotal
  → TimeElapsed = Format(GameState.ElapsedTime)
  → Mistakes.Text = "失误: " + GameState.Mistakes
  → Battery.Percent = Character.CurrentBattery / Character.MaxBattery
  → Battery.ColorAndOpacity = if (Battery<0.2) Red else White

Custom Event ShowCenterHint(Text, Duration):
  → CenterHint.SetText(Text)
  → Play Animation FadeInOut (0.5s入, Duration显示, 0.5s出)

Tick (0.5s):
  → UpdateHUD(GameState)
```

### 3.3 WBP_Notebook (笔记本系统)

**构成 (TabControl)**：
```
SizeBox (固定大小: 1280x800, 屏幕居中)
  └─ Border_Leather (皮革边框背景 + 阴影)
      └─ Notebook_Tabs (4个 Tab 按钮)
           │
           ├── Tab_线索 (Clues)
           │    ├─ SearchBox (搜索线索)
           │    ├─ Filter_Tags (按房间/按租客/按类型)
           │    ├─ TileView_Clues (Tile View)
           │    │    └─ Entry_WBP_ClueCard
           │    │         ├─ Image_ItemThumbnail
           │    │         ├─ Text_ClueTitle
           │    │         └─ Text_RoomTag
           │    └─ DetailPanel_SelectedClue
           │         ├─ Text_FullDescription
           │         ├─ Text_RelatedClues (关联线索)
           │         └─ Button_Examine3D → 打开WBP_ExamineOverlay
           │
           ├── Tab_笔记 (Notes)
           │    ├─ ListView_Notes (日记条目)
           │    └─ RichText_NoteContent (全文本带图片)
           │
           ├── Tab_地图 (Map)
           │    ├─ Image_ApartmentFloorPlan (底图)
           │    │    └─ Overlay_RoomMarker[动态创建]
           │    │         ├─ 已发现房间: 高亮 + 标签
           │    │         └─ 未发现房间: 灰遮罩
           │    ├─ Text_Legend (图例说明)
           │    └─ CheckBox_ShowClueLocations
           │
           └── Tab_档案 (Dossier / 租客)
                ├─ HorizontalBox_TenantTabs (每位租客一页)
                └─ Detail_TenantProfile
                     ├─ Image_TenantPhoto (占位)
                     ├─ Text_TenantInfo (姓名/房号/入住)
                     └─ Text_RelatedTimeline (时间线证据)
```

**蓝图逻辑**：
```
Construct Event:
  → Subscribe Event: "Mystery.Clue.Found"
      → Rebuild TileView_Clues from SaveData.CollectedClues
  → First Clue Unlocked → Show Tutorial "阅读线索卡片"

Button_Examine3D.OnClicked:
  → Close Notebook (但保留Selection)
  → PlayerController.SetMode(ExamineItem)
  → Create WBP_ExamineOverlay with SelectedClue

ClueSelectionChanged:
  → If Clue has LinkedClueIds → Highlight those in TileView
  → Update DetailPanel

Filter_RoomChanged:
  → Update TileView.ItemsSource (Filter by RoomTag)
```

### 3.4 WBP_PauseMenu (暂停菜单)

**构成**：
```
SizeBox (全屏半透明遮罩)
  ├─ Background_Dim (黑色 60% 透明度, 背景Blendable)
  └─ VerticalBox_Menu (居中)
       ├─ Text_Paused (大字: 已暂停)
       ├─ Button_Resume        → 关闭菜单, Mode=Explore
       ├─ Button_Notebook      → 切换 WBP_Notebook
       ├─ Button_SaveGame      → SaveGameToSlot
       ├─ Button_LoadGame      → WBP_ContinueMenu(内嵌)
       ├─ Button_Settings      → WBP_Settings.AddToViewport(85)
       ├─ Button_Achievements  → WBP_Achievements.AddToViewport
       ├─ Button_ReturnMenu    → 确认弹窗 → GameInstance.ReturnToMainMenu
       └─ Button_Quit          → 确认弹窗 → QuitGame
```

**蓝图逻辑**：
```
Open Event:
  → Set InputMode GameAndUI
  → Set Game Paused (true)
  → ShowMouseCursor
  → Disable Input (Player Character Movement)

Resume Event:
  → Set InputMode GameOnly
  → Set Game Paused (false)
  → HideMouseCursor
  → RemoveFromParent
```

### 3.5 WBP_Settings (设置页面)

**3个Tab：视频 / 音频 / 控制**

**Tab 视频 (Display)**：
```
Window Mode (Enum: 全屏/窗口/无边框)
Resolution  (Dropdown: 由系统枚举)
VSync       (CheckBox)
Frame Rate Limit (Slider: 30~240)
Resolution Scale (Slider: 50~100%)
Graphics Preset (Low / Medium / High / Epic / Custom)
  ├─ View Distance
  ├─ Anti-Aliasing
  ├─ Shadows
  ├─ Post Process
  ├─ Texture Quality
  ├─ Effects
  └─ Foliage
Brightness (Gamma Slider: 0.5 ~ 1.5)
Motion Blur (CheckBox OFF by default)
Film Grain (Slider: 0% ~ 50%)
```

**Tab 音频 (Audio)**：
```
Master Volume      (Slider 0~100%)
Music Volume       (Slider 0~100%)
SFX Volume         (Slider 0~100%)
Ambient Volume     (Slider 0~100%)
Voice Volume       (Slider 0~100%)
UI Volume          (Slider 0~100%)
Subtitles          (CheckBox)
Subtitle Size      (Small/Medium/Large)
Subtitle BG Opacity (Slider 0~100%)
Dynamic Range Compression (CheckBox, 给耳机用户)
```

**Tab 控制 (Controls)**：
```
Mouse Sensitivity      (Slider 0.2x ~ 3.0x)
Gamepad Look Sensitivity (Slider 0.2x ~ 3.0x)
Invert Mouse Y-Axis    (CheckBox)
Invert Gamepad Y-Axis  (CheckBox)
Gamepad Vibration      (CheckBox)
Sprint Behavior        (Toggle / Hold)
Flashlight Behavior    (Toggle / Hold)
  ─── Key Bindings (Read Only in BETA) ───
ListView_KeyBindings
  └─ ForEach InputAction
       Display Name | Keyboard Key | Gamepad Button
Button_ResetToDefaults
```

**应用按钮**：
```
ApplyClicked:
  → Apply Display / Resolution Settings
  → Update SoundMix Volumes
  → Update Input Modifiers
  → Save To CurrentSaveData.Settings Fields
  → SaveGameToSlot
```

### 3.6 WBP_ChapterResult (章节结算页)

**构成 (居中卡片)**：
```
Overlay
  ├─ Dim Background
  └─ VerticalBox_Card (1000x700)
       ├─ Text_ChapterComplete (第X章 完成！)
       ├─ Divider
       │
       ├─ HorizontalBox_Score
       │    ├─ Text_RankBig (大字号 S/A/B/C)
       │    └─ Text_FinalScore (分数: 1,850 / 2,100)
       │
       ├─ GridPanel_Details (2列布局)
       │    ├─ 线索收集     │ XX / XX (+900)
       │    ├─ 用时         │ 14分32秒 (+380)
       │    ├─ 完美解谜奖励  │ 3次无失误 (+600)
       │    ├─ 失误扣减      │ -1次 (-50)
       │    └─ 合计          │ = 1,830
       │
       ├─ HorizontalBox_UnlockPanel
       │    ├─ Text_UnlockedTitle ("解锁新内容")
       │    └─ WrapBox_UnlockCards
       │         ├─ Card1: 新租客档案
       │         ├─ Card2: 地下室钥匙
       │         └─ Card3: 成就"首案告破"
       │
       └─ HorizontalBox_Buttons
            ├─ Button_RetryChapter   → Restart Level
            ├─ Button_ReplayExamine → 打开解锁内容详情
            └─ Button_NextChapter   → OpenLevel(Next) + ShowLoading
```

**蓝图逻辑**：
```
Construct:
  → Get GameSessionResult from GameMode.CalculateFinalResult
  → Rank.Text = Result.Rank
  → Play Animation (数字滚动 CountUp 到 FinalScore)
  → Check Result.bIsNewRecord → Show "新纪录!" Ribbon
  → For Each Unlocked:
       Create WBP_UnlockCard, Add to WrapBox
       → if Content is Achievement:
            GameInstance.UnlockAchievement()
       → if Content is Next Chapter:
            SaveData.CurrentChapterIndex++

Button_NextChapter:
  → SaveGameToSlot (AutoSave)
  → Add Leaderboard Entry (本章节结果)
  → OpenLevel(Next Chapter)
  → Show WBP_LoadingScreen
```

### 3.7 WBP_Tutorial (教程系统)

教程采用"触发式"而非"一屏灌输"，在玩家首次遇到对应系统时弹出：

| TutorialKey           | 触发条件                                      | 内容                                           |
|---------------------|-------------------------------------------|----------------------------------------------|
| TUT_FirstMove       | 首次进入关卡后 2s                              | WASD 移动 / 鼠标视角 / Shift 冲刺 / Ctrl 蹲下     |
| TUT_FirstInteract   | 首次 Trace 命中 Interactable                    | 对准物体后按 [E] 交互 / [F] 仔细检查             |
| TUT_FirstClue       | 首次拾取 Clue                                 | 按 [J] 打开笔记本查看线索 / 线索间可关联分析       |
| TUT_FirstPuzzle     | 首次靠近 Puzzle Lock                          | 按 [E] 打开谜题 / 按 [ESC] 返回                   |
| TUT_FirstMistake    | 首次产生 Mistake                              | 失误会扣分，仔细观察线索！/ 可随时重新加载存档    |
| TUT_FlashlightBattery | 电量低于15%                              | 手电筒电量不足，找到电池或及时关闭节省电量          |
| TUT_SaveHint        | 每10分钟自动保存后                              | "游戏已自动保存" / [Ctrl+S] 手动保存               |

**WBP_Tutorial 结构**：
```
Overlay (半透明)
  ├─ CanvasPanel_Highlight (遮罩挖空，高亮指定控件)
  ├─ Border_Dialog (对话框)
  │    ├─ Text_Title
  │    ├─ RichText_Body (带键盘图标)
  │    └─ HorizontalBox_Keys (显示按键提示)
  │         └─ WBP_KeyIcon (动态图标: 显示E/鼠标左键/手柄按键)
  └─ Button_Next → Close & Mark TutorialSeen[TutorialKey]
```

---

## 4. Common UI 图标与资源 (Content/UI/Icons)

需要在 UI/Icons 目录准备以下占位贴图 (可由 Paper2D 精灵或Texture2D):

```
Icon_Interact.png           → "手型" 交互图标
Icon_Examine.png            → "放大镜" 检查图标
Icon_Notebook.png           → "笔记本" 图标
Icon_Inventory.png          → "背包" 图标
Icon_Flashlight_ON.png      → 手电筒开图标
Icon_Flashlight_OFF.png     → 手电筒关图标
Icon_Key_E.png              → E键提示
Icon_Key_F.png              → F键提示
Icon_Key_J.png              → J键提示
Icon_Key_ESC.png            → ESC键提示
Icon_Mouse_Left.png         → 鼠标左键
Icon_Mouse_Wheel.png        → 滚轮图标
Icon_Gamepad_A.png          → 手柄A键
Icon_Gamepad_B.png          → 手柄B键
Icon_Gamepad_X.png          → 手柄X键
Icon_Gamepad_Y.png          → 手柄Y键
Icon_Gamepad_LT_RT.png      → 手柄扳机
Icon_Achievement_Unlock.png → 成就解锁
Icon_Save_Icon.png          → 保存图标
Icon_Battery_100.png..0.png → 电量图标（5档）
Icon_Locked.png             → 锁住
Icon_Unlocked.png           → 已解锁
Icon_Mistake.png            → 失误（红色感叹号）
Icon_ClueType_Document.png  → 文档线索类型
Icon_ClueType_Photo.png     → 照片线索类型
Icon_ClueType_Key.png       → 钥匙线索类型
Icon_ClueType_Object.png    → 实体物件类型
```

---

## 5. 键鼠 / 手柄 / 触屏 适配策略

### 5.1 输入上下文检测
在 `BP_PlayerController` 的 Tick 中，通过 Enhanced Input 的 `GetMostRecentInputDevice()` 判断当前使用的设备：

```
switch (DeviceType)
{
  case Mouse/Keyboard:
    → 所有WBP_KeyIcon 显示键盘键位图
    → HUD 显示 "[E] 交互" 样式
    → WBP_Puzzle 提示 "点击数字按钮"

  case Gamepad:
    → 所有WBP_KeyIcon 显示手柄按键图
    → HUD 显示 "[A] 交互"
    → WBP_Puzzle 自动聚焦第一个按钮，可用方向键导航

  case Touch:
    → 启用 Virtual Joystick
    → 屏幕增加 "交互" 虚拟按钮 (右下)
    → 所有谜题按钮尺寸增大 30%
}
```

### 5.2 触屏专用布局
所有 UI 最小点击区域：`44 x 44` 像素 (iOS/Android 推荐)。
笔记本、暂停菜单在触屏模式下自动启用：
- 下拉关闭 (Swipe Down)
- 左右翻页 (Swipe Left/Right)
- 长按选中 → 弹出菜单
