# 存档系统与成就系统设计

> 文件：[SaveAndAchievements.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/SaveAndAchievements.md)

---

## 1. 存档系统 (Save System)

### 1.1 存档槽位设计

| 槽位名       | 用途 | 触发条件 | 自动覆盖 |
|------------|------|--------|---------|
| Save_00    | 自动存档1 | 进入章节/拾取关键线索/谜题解开 | 是 |
| Save_01    | 自动存档2 | 房间首次发现 + 回滚保护 | 是 (每20分钟) |
| Save_02    | 快速存档   | 玩家按 Ctrl+S | 否 (覆盖同一槽) |
| Save_03~09 | 手动存档   | 暂停菜单选择保存 (共7个槽) | 否 (玩家选择) |

### 1.2 自动保存触发点
```cpp
// 自动保存触发条件 (蓝图中调用)
- 进入章节开始    → SaveGameToSlot("Save_00")
- 离开房间时       → 50%概率保存 Save_01
- 拾取 KeyItem线索 → Save_00
- 解开每个谜题     → Save_00
- 产生第1次失误后  → Save_01 (避免玩家后悔)
- 每游戏10分钟     → Save_01 (周期性)
- 玩家退出关卡     → Save_00
```

### 1.3 存档内容 (UOldApartmentSaveGame C++定义)

**元数据**：
```cpp
SaveSlotName : FString
UserIndex : int32 = 0
SaveTime : FDateTime
SaveVersion : int32 = 1 (用于未来版本迁移)
```

**玩家进度** (FPlayerProgressData)：
```cpp
CurrentChapterIndex : int32
DiscoveredRoomIds : TArray<FName>        (已发现房间列表)
CollectedClues : TArray<FClueRecord>    (收集到的线索)
NotebookEntries : TArray<FNoteEntry>     (笔记本记录)
UnlockedAchievements : TArray<FName>     (已解锁成就)
UnlockedGalleryItems : TArray<FName>     (画廊解锁)
CompletedPuzzleIds : TArray<int32>       (已解谜题)
TotalPlayCount : int32                    (游玩次数)
TotalPlayTimeSeconds : float              (总游玩时长)
HighScore : int32                         (历史最高分)
MistakesLifetime : int32                  (累计失误次数)
LastPlayed : FDateTime                    (最后游玩时间)
```

**位置信息**：
```cpp
PlayerWorldLocation : FVector  (上次所在位置)
PlayerWorldRotation : FRotator (上次朝向)
```

**设置持久化**：
```cpp
MasterVolume / MusicVolume / SFXVolume / VoiceVolume / AmbientVolume : float
Brightness : float
MouseSensitivity / GamepadSensitivity : float
SubtitlesEnabled / InvertYAxis / VibrationEnabled : bool
TutorialCompleted : bool
```

### 1.4 存档版本迁移蓝图

`BP_SaveMigrator` 蓝图函数库：
```
Function MigrateSaveData(SaveData: UOldApartmentSaveGame):
  switch (SaveData.SaveVersion):
    case 1:
      → 直接返回当前版本
    case < 1:
      → 运行Migration_0_1() (添加缺失字段默认值)
      → SaveVersion++
      → 重新保存
  return 成功迁移的 SaveData

Function CheckSaveCorruption(SaveData):
  → CheckSave魔术头字节
  → Checksum验证
  → 如果损坏: 尝试从 Save_01 恢复
  → 全部损坏: ShowDialog "存档已损坏，开始新游戏？"
```

### 1.5 存档UI (WBP_ContinueMenu)

```
ListView_SaveSlots (共10个槽位)
  └─ Entry: WBP_SaveSlotEntry
       ├─ Text_SlotName ("快速存档 / 手动存档1")
       ├─ Text_SaveTime (日期时间)
       ├─ Text_ChapterName ("第1章: 失踪的租客")
       ├─ Text_Summary ("已发现 8/12 线索 · 2 失误 · 23 分钟")
       ├─ ProgressBar_Completion (66%)
       ├─ Button_Load → 加载存档
       ├─ Button_Delete → 确认删除弹窗
       └─ Thumbnail_Render → 小地图预览 (BETA版占位)
```

---

## 2. 成就系统 (Achievements)

### 2.1 成就清单 (共10项 + 2隐藏)

| AchievementId | 名称 | 描述 | 奖励分数 | 隐藏 |
|--------------|------|------|---------|-----|
| ACH_FirstStep | 初入公寓 | 进入公寓大堂，开始探索 | 50 | 否 |
| ACH_ClueHunter | 线索猎人 | 收集10条线索 | 100 | 否 |
| ACH_PuzzleMaster | 谜题大师 | 解开第一个锁谜题 | 150 | 否 |
| ACH_NoMistakes | 完美推理 | 无失误完成一个章节 | 300 | 否 |
| ACH_SpeedRunner | 疾风侦探 | 在10分钟内完成一个章节 | 200 | 否 |
| ACH_Completionist | 探索狂人 | 发现所有房间 | 250 | 否 |
| ACH_FirstCase | 首个案件 | 完成第一章 | 100 | 否 |
| ACH_DailyPlayer | 每日挑战者 | 完成每日挑战一次 | 150 | 否 |
| ACH_Collector | 收藏家 | 收集所有类型的线索 | 200 | 否 |
| ACH_Observer | 细致入微 | 在物品检查模式中旋转360° | 50 | 否 |
| ACH_SecretRoom | 密室发现者 | 进入隐藏房间 | 500 | 是 |
| ACH_AllEndings | 真相全貌 | 解锁所有结局 | 1000 | 是 |

### 2.2 成就触发逻辑

蓝图函数库 `BPL_AchievementLibrary`：
```
Function CheckAchievementsOnClueFound(Clue: FClueRecord):
  → if (CollectedClues.Num() >= 10) Unlock(ACH_ClueHunter)
  → if (All Clue Types collected) Unlock(ACH_Collector)

Function CheckAchievementsOnChapterComplete(Progress: FChapterProgress):
  → if (Progress.Mistakes == 0) Unlock(ACH_NoMistakes)
  → if (Progress.TimeSpentSeconds < 600) Unlock(ACH_SpeedRunner)
  → if (Progress.ChapterId == 1) Unlock(ACH_FirstCase)

Function CheckAchievementsOnRoomDiscovered(RoomId: Name):
  → if (RoomId == ROOM_Hidden) Unlock(ACH_SecretRoom)
  → if (All Rooms discovered) Unlock(ACH_Completionist)

Function CheckAchievementsOnPuzzleSolved(PuzzleId: Int):
  → if (First puzzle solved) Unlock(ACH_PuzzleMaster)
```

### 2.3 成就解锁UI (WBP_AchievementToast)

```
Screen Location: Top-Right Corner
Animation:
  0.0s → Start off-screen (right)
  0.2s → Slide in to visible (X from +300 to 0)
  0.2~3.0s → Display
  3.0s → Fade out (Alpha 1→0 over 0.5s)
  3.5s → Slide out and Destroy

Components:
  ├─ Border_Background (圆角, 半透明黑)
  ├─ Image_AchievementIcon (ACH_*.png)
  ├─ VerticalBox_Text:
  │    ├─ Text_UnlockLabel (成就解锁 小字)
  │    └─ Text_AchievementName (成就名称 加粗)
  └─ Audio: Achievement_Unlock_Chime.ogg
```

### 2.4 成就展示页 (WBP_Achievements)

```
ScrollBox (垂直滚动):
  └─ WrapBox:
       └─ for each Achievement in Defs:
            WBP_AchievementCard
              ├─ LockedState: 灰度Icon + "???" + Lock图标
              ├─ UnlockedState: 彩色Icon + 名称 + 描述 + 日期
              └─ Hovered: 显示奖励分数
```

---

## 3. 画廊/解锁内容系统

### 3.1 解锁内容类型
```
Gallery Type          | Unlock Condition
-------------------------------------------------
角色原画线稿          | Rank S 完成章节
制作日志 (幕后)       | Rank A 完成章节
原声带曲目            | Rank B 完成章节
过场动画回放          | 通关对应章节
结局档案馆            | 完成所有结局
彩蛋/Beta 预告        | 特定隐藏成就
3D模型检视            | 100% 收集线索
```

### 3.2 画廊主菜单入口
WBP_Gallery 主菜单按钮：
```
Button_Gallery (主菜单可见, 首次游玩后解锁)
  → Tab: 角色设计 / 原声带 / 过场回放 / 3D模型 / 彩蛋
```
