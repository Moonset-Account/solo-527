# 太空快递航线规划 - 游戏原型开发文档

## 项目概述

**项目名称**：太空快递航线规划 (SpaceCourier)
**游戏类型**：回合制策略游戏
**核心玩法**：玩家在星图上规划飞船航线，权衡燃料、时限和货物风险
**技术栈**：Unity 2021+ / C#
**目标平台**：PC / WebGL

---

## 目录结构

```
Assets/
├── Scripts/
│   ├── Core/                    # 核心框架模块
│   │   ├── Interfaces/IModule.cs
│   │   ├── EventBus.cs
│   │   ├── Singleton.cs
│   │   ├── GameEvents.cs
│   │   ├── GameManager.cs
│   │   └── SceneLoader.cs
│   │
│   ├── Data/                    # 数据定义模块 (ScriptableObject)
│   │   ├── StarNodeData.cs      # 星图节点配置
│   │   ├── ContractData.cs      # 合同配置
│   │   ├── EventCardData.cs     # 事件卡配置
│   │   ├── LevelData.cs         # 关卡配置
│   │   └── GameRuntimeData.cs   # 运行时状态
│   │
│   ├── Data/
│   │   └── DataManager.cs       # 数据模块实现
│   │
│   ├── Gameplay/                # 游戏逻辑模块
│   │   ├── FuelManager.cs       # 燃料系统
│   │   ├── ReputationManager.cs # 声望系统
│   │   ├── TurnManager.cs       # 回合/合同管理
│   │   ├── EventManager.cs      # 随机事件系统
│   │   └── GameplayController.cs# 游戏核心控制器
│   │
│   ├── StarMap/                 # 星图交互模块
│   │   ├── StarMapController.cs
│   │   └── StarNodeView.cs
│   │
│   ├── Input/                   # 输入模块
│   │   └── InputManager.cs
│   │
│   ├── UI/                      # UI模块
│   │   ├── UIManager.cs
│   │   ├── UIPanelBase.cs
│   │   ├── MainMenuPanel.cs
│   │   ├── HUDPanel.cs
│   │   ├── ContractPanel.cs
│   │   ├── EventCardPanel.cs
│   │   ├── ResultPanel.cs
│   │   ├── SettingsPanel.cs
│   │   ├── NotificationToast.cs
│   │   ├── ContractItemView.cs
│   │   ├── EventChoiceButton.cs
│   │   └── LevelButtonItem.cs
│   │
│   ├── SaveSystem/              # 存档模块
│   │   ├── SaveDataTypes.cs
│   │   ├── SaveManager.cs
│   │   └── PlayRecorder.cs      # 试玩数据记录
│   │
│   ├── Audio/                   # 音效模块
│   │   └── AudioManager.cs
│   │
│   ├── Animation/               # 动画模块
│   │   └── AnimationController.cs
│   │
│   └── Bootstrap/               # 启动器
│       └── GameBootstrap.cs
```

---

## 模块边界说明

| 模块 | 职责 | 关键类 | 依赖 |
|------|------|--------|------|
| **Core** | 模块注册、事件总线、单例模式、场景加载、全局事件定义 | GameManager, EventBus, SceneLoader, Singleton, IModule | 无 |
| **Data** | 关卡/节点/合同/事件卡配置，Dijkstra路径算法，数据查询 | DataManager, StarNodeData, ContractData, EventCardData, LevelData | Core |
| **Gameplay** | 燃料/声望/回合/合同/事件逻辑，航线执行，游戏结束判定 | FuelManager, ReputationManager, TurnManager, EventManager, GameplayController | Core, Data |
| **StarMap** | 星图渲染、节点交互、路线预览、飞船移动动画 | StarMapController, StarNodeView | Core, Data, Gameplay, Input |
| **Input** | 鼠标/触摸/键盘输入处理，2D/3D射线检测 | InputManager | Core |
| **UI** | 所有面板管理，HUD刷新，动画过渡，用户交互反馈 | UIManager, 各Panel类 | Core, Gameplay, SaveSystem, Audio |
| **SaveSystem** | 存档/读档/设置持久化，试玩数据记录与导出 | SaveManager, PlayRecorder, SaveDataTypes | Core, Data, Gameplay |
| **Audio** | BGM/音效播放，音量控制，事件驱动播放，占位音频生成 | AudioManager, SfxType, MusicType | Core, SaveSystem |
| **Animation** | 全局动画节奏控制，通用UI/数字/颜色动画辅助方法 | AnimationController | Core |

---

## Unity 场景搭建指南

### 场景 1: Main.unity (唯一必需场景)

#### 1. 层级结构

```
Main Scene
├── [GameManager]            # 由GameBootstrap自动创建(或手动挂载GameManager)
├── Camera                   # Main Camera - Orthographic, Size=5, Position=(0,0,-10)
├── EventSystem              # Standalone Input Module
├── UI Canvas                # Screen Space Overlay, 1920x1080 Reference
│   ├── MainMenuPanel        # 主菜单 (MainMenuPanel脚本)
│   │   ├── Title            # TextMeshPro - "太空快递航线规划"
│   │   ├── Subtitle         # TextMeshPro - 副标题
│   │   ├── StartButton      # Button + ButtonClickSfx
│   │   ├── ContinueButton   # Button
│   │   ├── SettingsButton   # Button
│   │   └── QuitButton       # Button
│   │
│   ├── HUDPanel             # 游戏内HUD (HUDPanel脚本)
│   │   ├── TopBar
│   │   │   ├── FuelBar      # Slider + TextMeshPro "⛽ 0/100"
│   │   │   ├── CreditsText  # TextMeshPro "💰 500"
│   │   │   ├── ReputationBar# Image Bar + Text "⭐ 50"
│   │   │   └── TurnInfo     # Slider + Text "回合 1/30"
│   │   ├── MainContractPanel# 主线合同进度
│   │   ├── ActionButtons
│   │   │   ├── ConfirmRouteBtn
│   │   │   ├── RefuelButton
│   │   │   └── ContractsBtn
│   │   ├── FeedbackToast    # NotificationToast - 弹出提示
│   │   └── CurrentNodeInfo  # Text "📍 Alpha Station"
│   │
│   ├── ContractPanel        # 合同面板 (ContractPanel脚本)
│   │   ├── TabBar
│   │   │   ├── AvailableTab
│   │   │   ├── ActiveTab
│   │   │   └── CompletedTab
│   │   ├── ScrollView/Content  # ContractItemView列表容器
│   │   └── DetailPanel      # 合同详情 + 接受按钮
│   │
│   ├── EventCardPanel       # 事件卡 (EventCardPanel脚本)
│   │   ├── CardBackground   # Image (按严重程度染色)
│   │   ├── EventTitle       # TextMeshPro
│   │   ├── EventSeverity    # 严重程度徽章
│   │   ├── EventDescription # 事件描述
│   │   ├── ChoicesContainer # EventChoiceButton列表 (3-4个)
│   │   └── OutcomePanel     # 结果显示 + 继续按钮
│   │
│   ├── ResultPanel          # 结算面板 (ResultPanel脚本)
│   │   ├── ResultTitle      # "任务成功"/"任务失败"
│   │   ├── ResultReason
│   │   ├── ScoreDisplay     # 大数字 + S/A/B/C等级
│   │   ├── StarRating       # 3星评价
│   │   ├── StatisticsGrid   # 10项统计数据
│   │   └── Buttons (Retry/Menu/SaveRecord)
│   │
│   ├── SettingsPanel        # 设置页 (SettingsPanel脚本)
│   │   ├── AudioGroup (3 Slider + Mute Toggle)
│   │   ├── DisplayGroup (Fullscreen/Resolution/Quality)
│   │   ├── GameplayGroup (Animations/RouterPreview/TextSpeed)
│   │   └── ActionButtons (Apply/Reset/DeleteSave/ExportData)
│   │
│   └── NotificationToast    # 全局通知 (NotificationToast脚本)
│
├── StarMapRoot              # 世界空间星图
│   ├── NodesContainer       # Transform (StarMapController会动态创建节点)
│   ├── ConnectionsContainer # Transform (连线容器)
│   ├── RouteLineRenderer    # LineRenderer - 航线预览
│   └── Ship                 # SpriteRenderer - 飞船图标
│
└── [Bootstrap]              # GameBootstrap脚本挂载对象
```

#### 2. Prefab要求

**StarNode Prefab** (StarNodeView挂载)：
```
StarNode (CircleCollider2D, Radius=0.8)
├── NodeRenderer             # SpriteRenderer (圆形)
├── HaloRenderer             # SpriteRenderer (光圈, SortingOrder=-1)
├── SelectorRenderer         # SpriteRenderer (选中光环, 默认禁用)
├── NameLabel                # TextMeshPro (节点名, Position=(0,-1.2))
├── FuelStationIndicator     # Image/Text "⛽"
└── DangerIndicator          # Image "⚠"
```

**Connection Prefab**：
```
Connection
├── LineRenderer             # 灰色连线
└── CostLabel                # TextMeshPro "⛽ 5"
```

**ContractItemView Prefab**：
```
ContractItem (Button, Size=(600,80))
├── Background               # Image
├── StatusIndicator          # Image (左侧小色条)
├── MainContractBadge        # Image "★"
├── TitleText                # TextMeshPro
├── DestinationText          # TextMeshPro
├── TimerText                # TextMeshPro
├── RewardText               # TextMeshPro
└── CargoTypeText + RiskIndicator
```

**EventChoiceButton Prefab**：
```
EventChoice (Button, Size=(700,70))
├── BackgroundImage
├── ChoiceIndicator          # Image (补救方案绿色标记)
├── ChoiceText               # TextMeshPro (选项描述)
└── RequirementText          # TextMeshPro (消耗显示)
```

**LevelButtonItem Prefab**：
```
LevelButton (Button)
├── BackgroundImage
├── DifficultyIcon
├── LevelNameText
├── LevelDescriptionText
├── DifficultyText
└── LockIcon
```

#### 3. Camera配置
- **Projection**: Orthographic
- **Size**: 5.0
- **Position**: (0, 0, -10)
- **BackgroundColor**: (0.03, 0.05, 0.12, 1) - 深太空蓝
- **Clear Flags**: Solid Color

---

## 游戏规则说明

### 胜利条件
- **主线合同完成**: 在时限内将医疗物资送达目标节点 (15回合内)
- **注意**: 可同时接多个支线合同增加分数

### 失败条件
1. **主线合同超时** - 15回合后主线任务未完成
2. **总回合耗尽** - 超过30回合仍未完成主线
3. **燃料耗尽** - 无燃料且无法购买或求助
4. **主线合同失败** - 货物损毁或放弃

### 核心机制
| 系统 | 说明 |
|------|------|
| **燃料** | 按距离×危险系数消耗；加油站按声望折扣定价 |
| **声望** | 6个等级；影响交易折扣、奖励加成、可选合同 |
| **回合** | 每次跳跃消耗1回合，事件可能额外消耗 |
| **事件** | 节点危险度越高，触发概率越高 |
| **货物完整度** | 影响最终奖励；< 60% 可能任务失败 |

### 默认关卡配置
- **起始燃料**: 50 / 最大 100
- **起始星币**: 500
- **起始声望**: 50 (Good)
- **最大回合**: 30
- **节点**: 10个（6个可加油）
- **事件池**: 7种 (太空天气/海盗/机械/贸易/发现/NPC/紧急)

---

## 试玩数据记录

PlayRecorder模块在游戏过程中自动记录以下数据：

### 会话级数据
| 字段 | 说明 |
|------|------|
| StartTime / EndTime | 实际时间戳 |
| PlayTimeSeconds | 真实游戏时长(秒) |
| LevelId | 关卡ID |
| IsVictory / EndReason | 胜利/失败及原因 |
| FinalScore | 最终得分 |
| TurnsUsed / MaxTurns | 回合消耗 |
| DeliveriesCompleted / Failed | 合同成败统计 |
| EventsTriggered | 触发事件数 |
| TotalFuelUsed | 总燃料消耗 |
| EndingFuel/Credits/Reputation | 结束时资源量 |
| CriticalChoices | 关键选择完整记录** |

### 关键选择记录
- **事件选择**：事件名/选项文本/回合/资源状态/结果
- **航线选择**：起点→终点/节点数/燃料消耗
- **合同操作**：接取/放弃/完成
- **资源操作**：大量加油、购买特殊物品
- 每条记录包含：`TurnNumber`, `FuelAtChoice`, `ReputationAtChoice`, `Timestamp`

### 数据导出
通过设置页可导出为JSON文件，保存在：
- **Windows**: `%APPDATA%\LocalLow\<Company>\<Game>\Exports\`
- **Mac**: `~/Library/Application Support/<Company>/<Game>/Exports/`
- **WebGL**: 浏览器下载

---

## 事件补救路径机制

所有事件保证至少一个安全选项（不会让游戏无解）：

```
三层兜底机制:
├─ 1. 事件配置级: 每个事件至少1个 IsRemediationChoice=true 的选项
├─ 2. 动态回退级: 当玩家资源不足时，自动添加 紧急规避/求助选项
└─ 3. 最低保底级: 资源极端不足时，提供"硬扛"选项 (货物-15%但不无解)
```

**示例：海盗事件**
1. 付赎金（安全）- **补救选项** ✓
2. 逃跑（消耗燃料，70%成功）
3. 战斗（声望≥40可选，高风险高回报）
4. 若燃料≥25→自动添加紧急规避选项（额外燃料消耗）

---

## 操作反馈设计

| 操作 | 视觉反馈 | 音效 | 节奏 |
|------|---------|------|------|
| 节点悬停 | 光晕扩散 + 放大1.2x | 440Hz短音 | 即时 |
| 节点选择 | 青色光环 + 脉冲 | 520Hz点击音 | 0.1s |
| 航线规划 | 绘制彩色路径 + 燃料预估 | 序列音 | 0.2s |
| 确认航线 | 飞船平滑移动 | 引擎启动+持续声 | 0.5s/段 |
| 到达节点 | 光圈脉冲 + HUD刷新 | 520Hz到达音 | 0.1s |
| 事件触发 | 事件卡弹出(从上方滑入) | 低频冲击音 | 0.3s |
| 选项成功 | 绿色闪光 + 数字跳动 | 990Hz上行 | 0.2s |
| 选项失败 | 屏幕抖动 + 红色提示 | 260Hz下行 | 0.4s |
| 合同完成 | 星币+500 数字滚动 | 880Hz铃声 | 0.6s |
| 燃料不足 | 警告闪烁 + 红条 | 重复蜂鸣 | 1.0s循环 |

---

## 模块初始化顺序

```
1. GameManager.Awake()
   └─ RegisterAllModules() 创建所有模块组件

2. GameManager.Initialize()
   ├─ 1. DataManager      (加载ScriptableObject配置)
   ├─ 2. SaveManager      (加载设置/存档)
   ├─ 3. AudioManager     (初始化音频源/占位音频)
   ├─ 4. SceneLoader
   ├─ 5. InputManager
   ├─ 6. PlayRecorder
   ├─ 7. UIManager        (注册所有面板)
   ├─ 8. TurnManager
   ├─ 9. FuelManager
   ├─ 10. ReputationManager
   └─ 11. EventManager

3. GameBootstrap.Start()
   ├─ SetupUIConnections() (绑定UI按钮事件)
   └─ ShowMainMenu()

4. 玩家点击开始游戏
   └─ GameManager.StartGame(levelId)
      ├─ PlayRecorder.StartSession()   ⟵ 开始计时记录
      ├─ DataManager.LoadLevel()       ⟵ 加载关卡数据
      ├─ TurnManager.StartNewGame()    ⟵ 回合1开始
      ├─ StarMapController.BuildStarMap() ⟵ 渲染星图
      └─ 显示HUD
```

---

## 运行验证

完成搭建后，应验证以下功能：

### 基础功能
- [ ] 主菜单可以打开设置页、选关、进入游戏
- [ ] HUD正确显示燃料/星币/声望/回合
- [ ] 星图上10个节点正常渲染，可点击选择
- [ ] 航线预览显示正确颜色（可飞=青/不足=红）
- [ ] 飞船移动动画平滑，到达后HUD刷新
- [ ] 合同面板可以接取、查看合同
- [ ] 加油站可加油，扣钱加油数正确

### 事件系统
- [ ] 危险节点30-50%概率触发事件
- [ ] 3个以上选项可选，资源不足的选项灰显禁用
- [ ] 至少1个"补救选项"始终可用（标绿色）
- [ ] 事件结果应用：燃料/星币/声望/货物有变化
- [ ] 结算页显示：成功/失败原因、星级、得分、统计

### 数据系统
- [ ] 设置页音量/画质可生效保存
- [ ] 暂停后退出，再进入可以读取自动存档
- [ ] 结算页保存试玩记录（检查文件生成）
- [ ] 导出JSON包含：用时/失败次数/关键选择列表

---

## 常见问题

**Q: DataManager中AllLevels是空的？**
A: 脚本中内置了CreateDefaultLevelData()会自动生成示例关卡，无需手动配置。生产环境可在Inspector挂载LevelData.asset。

**Q: AudioManager没有AudioClip？**
A: Initialize时会自动调用GenerateToneClip()生成正弦波占位音，保证功能可用。可在Inspector替换真实音频。

**Q: 星图节点没有碰撞体无法点击？**
A: StarNodeView的Awake会自动添加CircleCollider2D，也可手动在Prefab上添加。

**Q: 试玩数据文件在哪里？**
A: Unity Editor中位于 `~/Library/Application Support/DefaultCompany/SpaceCourier/PlayRecords/`
   可用 [Settings] → [Export Play Data] 导出JSON。

---

*文档版本: v1.0 | 更新日期: 2026-06-09*
