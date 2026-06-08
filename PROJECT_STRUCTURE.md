# 雨巷纸伞跑酷 - Unity 项目结构说明

## 目录结构

```
Assets/
├── Scripts/
│   ├── Core/                              # 核心数据类（纯数据+扩展）
│   │   ├── UmbrellaColor.cs               # 纸伞颜色枚举和映射
│   │   ├── JudgeResult.cs                 # 判定结果与统计 (GameStats)
│   │   ├── ObstacleData.cs                # 障碍类型 / 轨道 / 数据结构
│   │   └── LevelConfig.cs                 # 关卡配置 ScriptableObject
│   │
│   ├── BeatSystem/                        # 节拍判定与状态机
│   │   ├── BeatClock.cs                   # 高精度节拍时钟（节拍/小节事件）
│   │   ├── BeatJudge.cs                   # 判定窗口（Perfect/Early/Late/Miss）
│   │   └── ColorStateMachine.cs           # 颜色切换 + 轨道切换状态机
│   │
│   ├── Calibration/                       # 延迟校准
│   │   └── CalibrationManager.cs          # 8拍采样 / 中位数 / 自动调整窗口
│   │
│   ├── Track/                             # 轨道与障碍物
│   │   ├── TrackObstacleManager.cs        # 激活窗口/命中检测/Miss检测
│   │   └── TrackSwitchVisualizer.cs       # 双轨切换动画
│   │
│   ├── Replay/                            # 失败回放
│   │   └── ReplayManager.cs               # 记录输入事件 / 回放到前8拍
│   │
│   ├── Leaderboard/                       # 排行榜
│   │   └── LeaderboardManager.cs          # PlayerPrefs 持久化，每关Top10
│   │
│   ├── InputSystem/                       # 输入（移动端/键盘差异化提示）
│   │   └── InputManager.cs                # 键鼠 ↔ 触屏分区输入映射
│   │
│   ├── GameFlow/                          # 游戏流程
│   │   └── GameManager.cs                 # 全局单例 / 状态机 / 协调所有模块
│   │
│   └── UI/                                # 界面
│       ├── MainMenuUI.cs                  # 主菜单 + 关卡选择
│       ├── CalibrationPageUI.cs           # 校准页：节拍指示+手动调整+结果提示
│       ├── GameplayHUD.cs                 # 游戏HUD：判定/连击反馈+断连可感知
│       └── ResultsPageUI.cs               # 结算：完美拍/早拍/晚拍分布+问题分析
│
└── GameBootstrap.cs                       # 入口引导脚本（自动挂载）
```

## 关键需求对应实现

| 需求 | 对应文件 / 类 |
|------|---------------|
| 节拍校准页 | [CalibrationManager.cs](Assets/Scripts/Calibration/CalibrationManager.cs) + [CalibrationPageUI.cs](Assets/Scripts/UI/CalibrationPageUI.cs) |
| 雨声节拍下切换纸伞颜色穿过水洼/风铃/灯笼门 | [ObstacleData.cs](Assets/Scripts/Core/ObstacleData.cs) (ObstacleType) + [ColorStateMachine.cs](Assets/Scripts/BeatSystem/ColorStateMachine.cs) |
| 连击中断可感知反馈 | [GameplayHUD.cs](Assets/Scripts/UI/GameplayHUD.cs) (HandleComboBroken) + CameraShake |
| 移动端和键盘提示不同 | [InputManager.cs](Assets/Scripts/InputSystem/InputManager.cs) (GetHintForAction) |
| 延迟校准结果影响判定窗口 | [CalibrationManager.cs](Assets/Scripts/Calibration/CalibrationManager.cs) (AdjustWindowsBasedOnStdDev) + [BeatJudge.cs](Assets/Scripts/BeatSystem/BeatJudge.cs) |
| 前三关只教颜色和节拍 | [LevelConfig.cs](Assets/Scripts/Core/LevelConfig.cs) (CreateDefaultLevel1/2/3 + UnlockDualTrack=false) |
| 后面关卡加入双轨切换 | [LevelConfig.cs](Assets/Scripts/Core/LevelConfig.cs) (Level4) + [TrackSwitchVisualizer.cs](Assets/Scripts/Track/TrackSwitchVisualizer.cs) |
| 失败时回放最近八拍而不是直接重开 | [ReplayManager.cs](Assets/Scripts/Replay/ReplayManager.cs) + [TrackObstacleManager.cs](Assets/Scripts/Track/TrackObstacleManager.cs) (RewindToBeat) + [GameManager.cs](Assets/Scripts/GameFlow/GameManager.cs) (HandleFailure → RollbackStatsToBeat → CheckEndReplay) |
| 排行榜只记录完成关卡的成绩 | [LeaderboardManager.cs](Assets/Scripts/Leaderboard/LeaderboardManager.cs) (AddEntry 前校验通关) |
| 校准页改动后提示当前判定窗口和推荐延迟 | [CalibrationPageUI.cs](Assets/Scripts/UI/CalibrationPageUI.cs) (WindowDescription/LatencyDescription) |
| 结算页展示完美拍/早拍/晚拍数量和问题分析 | [ResultsPageUI.cs](Assets/Scripts/UI/ResultsPageUI.cs) (AnalyzeProblems 三维度诊断 + BarChart 条形图) |
| 零资源启动（无场景/预制体/音频/UI资源） | [GameBootstrap.cs](Assets/Scripts/GameBootstrap.cs) (RuntimeInitializeOnLoad) + [UIFactory.cs](Assets/Scripts/UI/UIFactory.cs) + [AudioSystem.cs](Assets/Scripts/Audio/AudioSystem.cs) (PCM 采样生成) + [GameplaySceneVisuals.cs](Assets/Scripts/Gameplay/GameplaySceneVisuals.cs) (程序化纹理) |
| 雨声节拍音效系统 | [AudioSystem.cs](Assets/Scripts/Audio/AudioSystem.cs) (白噪声4阶低通+高通滤波雨声 + 正弦/三角波节拍音 + 噪声爆发断连音) |
| 场景视觉与障碍移动 | [GameplaySceneVisuals.cs](Assets/Scripts/Gameplay/GameplaySceneVisuals.cs) (纸伞/双轨/踏板/障碍程序化 Sprite + ObstacleMover Z轴透视移动) |

## 使用方法

1. 在 Unity 2020+ 中创建空项目或空场景（无需任何 Asset 资源）
2. 将 `Assets/Scripts/` 整个目录拖入项目
3. 按 Play 即可自动启动 —— `GameBootstrap` 通过 `[RuntimeInitializeOnLoadMethod]` 在场景加载前自动创建 Camera/Canvas/GameManager/AudioSystem/UI 等全部对象
4. （可选）自定义关卡：继承 `LevelConfig` 或修改 `LevelConfig.CreateDefaultLevel1~4()` 添加自定义障碍序列

## 失败回放系统（八拍回滚）流程说明

```
连续 Miss 达到阈值
    ↓
GameManager.HandleFailure(failBeat)
    ├─ 1. ReplayManager.PrepareReplay(failBeat, 8拍)
    │      └─ 裁剪 [failBeat-8, failBeat] 区间的输入事件
    ├─ 2. GameManager.RollbackStatsToBeat(startBeat)
    │      └─ 按障碍判定历史重建 Perfect/Early/Late/Miss 计数 + 分数 + 连击
    ├─ 3. TrackObstacleManager.RewindToBeat(startBeat)
    │      ├─ 清空 _activeWindow
    │      ├─ 重置所有 beatIndex >= startBeat 的障碍为 Pending
    │      └─ 回退 _nextPendingIndex 到首个需重出现的障碍
    ├─ 4. GameplaySceneVisuals 销毁所有当前障碍视觉对象
    ├─ 5. BeatClock.SeekToBeat(startBeat) 时钟回退
    ├─ 6. ReplayManager.BeginReplay() 启动回放
    └─ 7. ChangeState(Replay)
         ↓
TickGameplay (Replay 状态下)
    ├─ TrackMgr.Update() → 回退后的障碍按新拍点重新进入激活窗口 → 视觉重新 Spawn
    ├─ Replay.TickReplay() → 按时间重放玩家之前的颜色/轨道切换输入
    └─ 每拍触发 CheckEndReplay()
         └─ 回放时长达到 8拍 时自动：
             ├─ Replay.EndReplay() 裁剪回放起始点之后的新事件
             └─ ChangeState(Playing) 玩家恢复操作
```

## 判定窗口说明

- **Perfect**（完美）：±校准后 PerfectWindowMs，300 分
- **Early**（早拍）：GoodWindowMs 内提前，150 分
- **Late**（晚拍）：GoodWindowMs 内滞后，150 分
- **Miss**（失误）：超出窗口 / 颜色错 / 轨道错 → 断连击 + 计数
- 连击中断：屏幕闪红 + 相机震动 + 音效
