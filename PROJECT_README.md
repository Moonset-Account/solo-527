# 节拍跑酷 Beat Runner

一款基于 Unity 的横版节奏跑酷游戏。跟随鼓点跳跃、滑行、切换轨道，收集节奏碎片解锁曲目。

---

## 项目结构

```
Assets/
├── Scripts/
│   ├── Core/                 # 核心系统
│   │   ├── Bootstrap.cs          # 启动初始化
│   │   ├── ServiceLocator.cs     # 服务定位器
│   │   ├── GameSettings.cs       # 全局可编辑配置 (ScriptableObject)
│   │   ├── RuntimeGameData.cs    # 运行时数据 (分数、连击、解锁等)
│   │   ├── SaveSystem.cs         # 存档序列化 (BinaryFormatter)
│   │   └── GameStateManager.cs   # 游戏状态机 (菜单/教程/游玩/暂停等)
│   │
│   ├── Audio/                # 音频系统
│   │   ├── AudioManager.cs       # 音乐/SFX播放 + DSP时间 + 手动延迟校准
│   │   ├── BeatSystem.cs         # BPM节拍系统 + 判定窗口
│   │   └── AudioCalibration.cs   # 自动节拍校准（随节拍点击）
│   │
│   ├── Input/                # 输入系统
│   │   └── InputManager.cs       # 多输入源统一 (键盘/触屏/手柄) + 重映射 + 按键提示
│   │
│   ├── Player/               # 玩家系统
│   │   └── PlayerController.cs   # 三轨道切换 + 跳跃 + 滑行 + 状态机
│   │
│   ├── Data/                 # 数据定义
│   │   └── TrackData.cs          # 曲目、皮肤、关卡配置 (ScriptableObject)
│   │
│   ├── Gameplay/             # 玩法逻辑
│   │   ├── LevelManager.cs       # 关卡生成、节拍判定、命中/碰撞检测
│   │   ├── GameplayController.cs # 玩家操作 → 判定联动
│   │   ├── CollectibleFragment.cs# 节奏碎片道具
│   │   └── Obstacle.cs           # 障碍物定义
│   │
│   ├── UI/                   # 所有界面
│   │   ├── MainMenu.cs           # 主菜单 + 曲目/皮肤选择
│   │   ├── TutorialController.cs # 开局5步交互教程
│   │   ├── HudController.cs      # 游戏HUD (分数/连击/判定/进度/碎片)
│   │   ├── PauseMenu.cs          # 暂停菜单
│   │   ├── SettingsMenu.cs       # 设置（音频/输入/画质/性能 4个标签页）
│   │   ├── ResultsScreen.cs      # 结算 (S+~D 评级 + 分数分解)
│   │   ├── GameOverScreen.cs     # 失败重试
│   │   ├── InputTypeDisplay.cs   # 自动检测当前输入源显示
│   │   └── ActionKeyHint.cs      # 动态按键提示（跟随输入类型切换）
│   │
│   ├── Diagnostics/          # 性能 & 适配
│   │   ├── PerformanceStats.cs   # 运行时 FPS/内存/节拍 统计面板
│   │   └── FrameRateAdaptor.cs   # 自动帧率 + 画质档位自适应
│   │
│   ├── Tools/                # 开发工具
│   │   ├── LevelGenerator.cs     # 程序化生成3种难度关卡
│   │   └── DefaultContentBootstrap.cs  # 生成默认曲目库 + 皮肤
│   │
│   ├── EditorTools/          # 编辑器扩展
│   │   ├── ResourcePaths.cs      # 菜单：一键创建项目目录
│   │   └── CsvLevelImporter.cs   # CSV导入/导出关卡
│   │
│   ├── Bootstrap/
│   │   └── DefaultContentBootstrap.cs
│   │
│   ├── GameManager.cs        # 总管理器：串联所有系统与流程
│   └── SceneEntryPoint.cs    # 场景入口
│
└── Resources/
    └── Data/                     # 默认曲目与皮肤 ScriptableObject
```

---

## 核心功能清单

### 🎵 节拍系统
- **节拍判定窗口**：Perfect / Great / Good / Miss，参数在 GameSettings 完全可编辑
- **BPM 驱动**：由曲目 BPM 生成 Beat/Measure 事件，与 DSP 时间对齐
- **音频延迟校准**：
  - 手动：-500ms ~ +500ms 滑杆
  - 自动：跟随节拍点击自动计算平均延迟

### 🏃 跑酷操作
- **三轨道切换**：左/右移动（A/D 或 ←/→，或触屏分区）
- **跳跃**（空格/W/↑）：跳过矮障碍
- **滑行**（S/↓）：滑过高空障碍
- **物理与碰撞**：胶囊碰撞体，跳跃/滑行时自动调整

### 📝 关卡与数据
- **ScriptableObject 配置**：所有数值、曲目、皮肤、难度不在代码里写死
- **3 难度**：每首曲目 Easy / Normal / Hard，各自独立的谱面
- **程序化生成**：LevelGenerator 按 BPM 和种子生成谱面
- **CSV 导入导出**：可用 Excel 设计谱面后导入
- **解锁系统**：收集节奏碎片解锁新曲目和皮肤

### 💾 存档序列化
- 二进制格式化保存至 `Application.persistentDataPath`
- 曲目/皮肤解锁状态、最高分、最高连击、准确率
- 音频延迟、输入重映射、目标帧率、教程完成状态

### 🎮 多输入方式
- 支持：**键盘 / 触屏 / 手柄**
- **自动检测**：当前使用哪种输入就自动切换 UI 提示样式
- **输入重映射**：在设置页重新绑定键位，持久化到存档
- **按键提示文本**：教程、HUD、设置页均读取动态键位名

### 🖼️ UI 流程
- **主菜单**：曲目列表 + 皮肤列表 + 难度滑杆 + 统计信息
- **开局教程**：5 步短交互（介绍→跳跃→滑行→切换→开始），可跳过
- **游戏 HUD**：分数、连击、判定特效、进度条、碎片计数、暂停按钮
- **暂停菜单**：继续 / 重试 / 设置 / 返回主菜单
- **设置页**：4 个标签（通用/音频/输入/画质）
- **失败重试**：失败原因显示 + 重试 + 新手提示重新进入教程
- **结算页**：S+~D 评级、Perfect/Great/Good/Miss 分解、最大连击、新纪录横幅、下一首

### ⚡ 性能 & 适配
- **帧率档位自适应**：30/60/120/144 + 对应画质档位，自动升降
- **运行时性能统计**：FPS（min/max）、帧毫秒、内存占用、场景名、当前延迟、当前节拍
- **可关闭/开启**：统计面板在设置里切换

---

## 快速开始

### 1. 初始化工程
1. 在 Unity 2021.3 LTS 或更新版本打开本工程
2. 菜单执行 `BeatRunner > Generate Project Folders` 以创建标准目录
3. 菜单执行 `BeatRunner > Open Data Folder`，并将 DefaultContentBootstrap 放入场景，在 Inspector 点 `[Generate Default Track Library]` 按钮生成默认曲目 ScriptableObject

### 2. 创建主场景
1. 新建 Main 场景，创建空物体，挂 `SceneEntryPoint.cs`
2. 场景内放置 Canvas（可选：按各 UI 脚本字段名搭建 UI 或把对应 Prefab 拖入）
3. 拖入游戏场景区块：
   - 空物体 `GameplayRoot`
   - 玩家对象（Capsule + Rigidbody + CapsuleCollider + PlayerController）
   - 三个轨道 LaneIndicator

### 3. 连接 GameManager
GameManager 会自动创建缺失的核心系统，也可手动在 Inspector 预赋值以获取引用：
- AudioManager / BeatSystem / InputManager / GameStateManager
- LevelManager / PlayerController / GameplayController
- MainMenu / Tutorial / HUD / Pause / Settings / Results / GameOver
- TrackLibrary / GameSettings / RuntimeGameData

### 4. 打包构建
- 主菜单、设置、暂停、结算：UI 脚本都已实现 `OnEnable/OnDisable` 事件绑定
- Build Settings 添加 Main 场景即可，构建版本与编辑器行为一致

---

## 可编辑配置一览

### GameSettings.asset
| 分类 | 字段 | 说明 |
|---|---|---|
| Performance | targetFrameRate / physicsFrameRate / enablePerformanceStats | 帧率与性能统计开关 |
| Track | trackCount / trackWidth / trackSwitchSpeed | 轨道数量、宽度、切换速度 |
| Player | jumpHeight / jumpDuration / slideDuration / gravityMultiplier | 玩家动作参数 |
| Beat Timing | perfectWindow / greatWindow / goodWindow / missWindow | 各判定窗口（秒） |
| Audio | defaultAudioLatencyMs / min~maxAudioLatencyMs | 默认延迟值与可调范围 |
| Scoring | perfectScore / greatScore / goodScore / comboMultiplier / maxComboMultiplier | 分数参数 |
| Unlock | fragmentsPerTrack / fragmentsToUnlockNext | 解锁参数 |

### TrackData.asset
- trackId / trackName / artistName / description
- bpm、themeColor、coverArt、musicClip
- easyLevel / normalLevel / hardLevel（每级 LevelData）
- isUnlockedByDefault、requiredFragments

### LevelData（可手工或 CSV 导入）
- notes: List\<NoteData\>
  - beatIndex：出现的节拍序号
  - beatOffset：节拍内偏移（0~1 半拍=0.5）
  - trackIndex：0/1/2 对应左中右
  - type：Jump / Slide / ObstacleHigh / ObstacleLow / Fragment

---

## 输入默认键位

| 操作 | 键盘 | 触屏（3段竖屏分区） | 手柄 |
|---|---|---|---|
| 跳跃 | Space / W / ↑ | 上部区域 | Jump 键 |
| 滑行 | S / ↓ | 中部区域 | Fire1 |
| 左切换 | A / ← | 左下区域 | 左方向/负水平轴 |
| 右切换 | D / → | 右下区域 | 右方向/正水平轴 |
| 暂停 | Esc / P | 右上按钮 | Submit |

> 以上均可在设置页重新绑定，新绑定自动应用到所有提示文本。

---

## 扩展建议

- **自定义谱面编辑器**：基于 CsvLevelImporter + EditorWindow 可实现可视化拖拽谱面编辑
- **皮肤系统扩展**：SkinData 已预留 visualPrefab 与 Material，运行时替换 PlayerVisual 根
- **新规则**：在 NoteType 增加新类型后，在 LevelManager.TryJudgeAction 里扩展判定条件
- **多平台**：InputManager 里扩展新输入源，在 UpdateInputHints 添加对应 UI 资源

---

## License

本代码库为项目骨架实现，可自由商用或修改。
