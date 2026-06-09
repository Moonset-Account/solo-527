# 锁谜题与章节系统设计

> 文件：[PuzzleAndChapters.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/PuzzleAndChapters.md)

---

## 1. 谜题类型总览

| 谜题蓝图名 | 类型 | 出现章节 | 触发条件 |
|----------|------|--------|--------|
| `BP_Puzzle_DialLock_4` | 4位数字转盘锁 | 1F 管理室门 | 发现3条线索 → 数字推理 |
| `BP_Puzzle_Keypad` | 电子密码键盘 | 101卧室保险箱 | 找到便签上的日期提示 |
| `BP_Puzzle_Pattern` | 图案连线 | 地下室门机关 | 墙上的符号笔记 |
| `BP_Puzzle_Logic` | 多线索组合锁 | 2F 公共浴室 | 4位租客号码交叉推理 |
| `BP_Puzzle_Combination` | 物品组合使用 | 多处 | 钥匙+锁 / 电池+手电等 |

---

## 2. 核心谜题蓝图

### 2.1 BP_Puzzle_DialLock (4位数字转盘锁)

**组件结构**：
```
Actor:
  ├─ StaticMesh (锁本体)
  ├─ WidgetComponent (4个Number Dial)
  ├─ SpotLight (锁体上方提示灯)
  └─ AudioComponent (操作音效)
```

**蓝图变量**：
```
CorrectAnswer : Int[4] = [3, 7, 5, 2]
CurrentDigits : Int[4] = [0, 0, 0, 0]
MaxMistakesBeforeHint : Int = 3
MistakeCount : Int = 0
HintLevel : Int = 0 (0=无, 1=首位, 2=前两位, 3=全部)
LockedDoorRef : BP_Door (关联要开的门)
UnlockAchievementId : Name = "ACH_FirstLock"
ClueRequiredForHint : Name = "Clue_DateReceipt"
```

**蓝图逻辑**：
```
Event OnInteract:
  → PlayerController.SetMode(Puzzle)
  → Create WBP_Puzzle_DialLock
  → Widget.AddToViewport(Z=60)
  → 绑定UI事件

WBP 按钮逻辑:
  点击Dial+/- 时:
    → CurrentDigits[DialIndex] = (Cur + Delta + 10) % 10
    → 播放 Dial_Click_01~09.ogg (轻微声音变化)
    → 更新WBP显示

  点击Confirm时:
    → if (CurrentDigits == CorrectAnswer):
         {
             播放 SFX Lock_Unlock.wav
             SpotLight → 绿色
             WBP → 显示"开锁成功！" 2秒后关闭
             PlayerController.SetMode(Explore)
             if (LockedDoorRef): LockedDoorRef.Unlock()
             GameMode.RegisterPuzzleSolved()
             if (MistakeCount == 0):
                 PerfectSolveBonus += 50
             GameInstance.UnlockAchievement(UnlockAchievementId)
         }
       else:
         {
             MistakeCount++
             GameMode.RegisterMistake()
             播放 SFX Lock_Error.wav
             SpotLight → 闪烁红色3次
             AmbientSystem → Tension += 0.05
             if (MistakeCount >= MaxMistakesBeforeHint):
                 HintLevel++
                 ShowHUDHint("试试线索里的日期...")
                 if (玩家已获得ClueRequiredForHint):
                     根据HintLevel高亮对应位数
         }

  点击Close时:
    → 保留当前输入状态
    → WBP.RemoveFromParent
    → PlayerController.SetMode(Explore)
```

### 2.2 BP_Puzzle_Keypad (电子密码键盘)

类似拨号锁，但UI为触屏键盘：
- **特殊**：输入错误5次 → 锁定1分钟 (倒计时显示)
- **额外**：有紧急备用钥匙孔 (如找到实物钥匙可跳过)

### 2.3 BP_Puzzle_Pattern (图案连线)
- **UI**：5x5网格节点，按正确顺序连线
- **错误判定**：线序错1次 = Mistake
- **线索来源**：墙上刻的星座符号 → 对应星图连线

### 2.4 BP_Puzzle_Logic (多线索组合推理)
- **UI**：多个下拉菜单，每个菜单选1个线索对应的值
- **例题**：
  ```
  根据线索推理：
  [A租客] 在 [3月] [搬出] 了 [X房间]
  (4个下拉菜单，每个选择对应线索里的答案)
  ```
- **得分奖励**：一次全对 = 完美分 + 成就

---

## 3. 章节系统 (Chapter System)

### 3.1 BETA版章节规划

| 章节ID | 章节名 | 可玩内容 | 预计时长 | 解锁条件 |
|-------|-------|--------|---------|---------|
| Ch00 | 教程序章 | 公寓外观 + 进入大门 + 基础操作 | 5分钟 | 启动游戏 |
| Ch01 | 失踪的租客 | 大厅/走廊/101室 + 管理室 | 30-45分钟 | 完成序章 |
| Ch02 | 邻居的证词 | 102/103室 + 楼梯间 | 40-60分钟 | 完成1章 |
| Ch03 | 楼上的秘密 | 2F全部 + 公共浴室 | 60-90分钟 | 完成2章 |
| Ch04 | 地下真相 | B1层 + 结局分支 | 60-90分钟 | 完成3章 |

> **BETA版本**：发布Ch00 + Ch01完整内容，Ch02-Ch04显示"敬请期待"并提供Demo评分。

### 3.2 DA_Chapter 数据资产 (DataAsset)

每个章节对应一个数据资产：
```
DataAsset: DA_Chapter01
  ├─ ChapterId: Int = 1
  ├─ DisplayName: Text = "第1章：失踪的租客"
  ├─ Description: Text = "1998年的雨夜..."
  ├─ IntroSequence: LevelSequence (过场动画)
  ├─ ChapterMap: SoftObjectPtr (关卡路径)
  ├─ RequiredClues: TArray<FName> (通关必需线索)
  ├─ TotalCluesCount: Int = 12
  ├─ RoomList: TArray<Name> (本章可探索房间)
  ├─ PuzzleList: TArray<TSoftClassPtr<AActor>> (本章谜题)
  ├─ TenantList: TArray<Name> (本章出现的租客)
  ├─ ChapterBaseScore: Int = 1000
  ├─ bIsBetaDemoChapter: Bool = true
  ├─ NextChapter: TSoftObjectPtr<DA_Chapter>
  └─ ChapterEndCutscene: LevelSequence
```

### 3.3 章节管理器 (BP_ChapterManager)

放置在Persistent Level：
```
Event BeginPlay():
  → 从SaveData读取 CurrentChapterIndex
  → 加载 DA_ChapterList[CurrentChapterIndex]
  → 注册 ClueFound / PuzzleSolved 事件
  → 如果是新章节: 播放IntroCutscene

Event OnChapterStart:
  → HUD 更新 ChapterName 信息
  → 初始化 Timer
  → AmbientSystem.ResetAllCues
  → 自动保存 Save_00 (章节开始存档)

Event CheckChapterCompletion:
  → RequiredClues.AllCollected && RequiredPuzzles.AllSolved
  → if Yes:
       触发 ChapterEndCutscene
       暂停玩家输入 5秒
       构建 FChapterProgress
       计算分数
       生成 WBP_ChapterResult
       GameInstance.SaveGameToSlot (章节结束存档)
       Leaderboard.AddEntry
```

### 3.4 章节结算分数公式 (从C++继承)

```
最终分数 =
    基础线索分 (线索数/总数 × 1000)
  + 时间奖励   (<300s = 500, 5分钟后线性衰减, ≥25分钟 = 250)
  + 完美奖励   (零失误且100%收集 = +200)
  - 失误惩罚   (每次失误 × 50)
  + 谜题完美分 (每题零失误额外分)
  + 隐藏奖励分 (发现隐藏房间/隐藏线索)

Rank 判定:
  S+  ≥95%   S ≥90%   A+ ≥85%   A ≥80%
  B  ≥70%    C ≥60%   D  ≥50%   E <50%

解锁内容 (根据Rank):
  Rank S  → 解锁隐藏尾声 + 角色原画线稿
  Rank A  → 解锁幕后制作日志
  Rank B  → 解锁原声带曲目
  All Complete → 解锁画廊模式 (可回放过场)
```

---

## 4. 每日挑战系统 (Daily Challenge)

### 4.1 设计思路
- 每天生成**确定的随机种子**，当日所有玩家遇到同样的线索位置
- 玩家挑战自己的最快通关时间 + 最少失误
- 每日挑战独立存档，不影响主线进度

### 4.2 每日种子生成 (C++已实现)
```cpp
GetTodaysChallengeSeed() → "YYYYMMDD_OldApartment"
```

### 4.3 每日特殊修饰符 (按种子随机)
```
修饰符池:
  - 线索位置随机 (80%概率)
  - 部分线索位置互换 (40%概率)
  - 手电电量减半 (30%概率)
  - 无失误惩罚 (20%概率)
  - 限时挑战 (15分钟) (15%概率)
  - 所有线索位置翻转 (10%概率)
  - 黑灯瞎火模式 (手电可用更频繁) (5%概率)
```

### 4.4 每日排行榜
- **本地**：Leaderboard JSON保存Top100
- **BETA版**：不接入在线服务，仅本地比较
- **显示**：WBP_Leaderboard 中 "每日榜" Tab
  - 玩家名 / 分数 / 用时 / 失误 / 完成日期
  - 高亮玩家自己的最佳记录 (带"你"标签)
