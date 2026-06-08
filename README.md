# 🚀 太空快递航线规划 - SpaceCourier

> 回合制太空策略游戏原型 | Unity 2021+ | C#

## 🎯 游戏简介

你是一名星际快递员，必须在时限内将医疗物资安全送达 Omega 空间站。在星图上规划最优航线，权衡**燃料消耗、时间压力、货物风险和随机事件**。你的每一个选择都将决定任务的成败！

## ✨ 核心特色

| 系统 | 说明 |
|------|------|
| 🌌 **星图系统** | 10个节点的动态星图，6个可加油点，Dijkstra最优路径规划 |
| ⛽ **燃料系统** | 距离×危险系数计算消耗，声望解锁加油折扣 |
| ⭐ **声望系统** | 6级声望等级，影响交易价格和奖励加成 |
| ⏱ **回合系统** | 30回合时限，每次航行消耗1回合 |
| 🎴 **事件系统** | 7种随机事件卡，3层补救机制保证永远有解 |
| 📦 **合同系统** | 主线必达+支线可选，货物完整度影响奖励 |
| 💾 **存档系统** | 自动存档 + 手动读档/存档槽 |
| 📊 **数据记录** | 完整记录游戏时长、关键选择、失败原因 |
| 🔊 **音效系统** | 25种Sfx + 5种BGM，无资源自动生成占位音 |
| 🎨 **动画系统** | 14种通用UI动画，全局节奏可调 |

## 🏗️ 架构设计

### 模块边界图

```
                    ┌──────────────┐
                    │   GameManager│←── 模块注册/生命周期
                    └──────┬───────┘
                           │ EventBus
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼───────┐  ┌──────▼───────┐
│   DataLayer  │  │  GameplayLayer │  │    UILayer   │
│  (配置/数据) │  │ (规则/状态机)  │  │ (面板/反馈)  │
└───────┬──────┘  └────────┬───────┘  └──────┬───────┘
        │                  │                  │
   ┌────▼────┐       ┌─────▼─────┐      ┌────▼──────┐
   │DataMgr  │       │FuelMgr    │      │UIManager  │
   │路径算法 │       │Reputation │      │8 Panel类  │
   └─────────┘       │TurnMgr    │      └───────────┘
                     │EventMgr   │    ┌──────────────┐
                     │GameplayCtrl│   │ Save/Audio/  │
                     └───────────┘    │ Input/Anim   │
                                      └──────────────┘
```

### 10个模块清晰分离

| # | 模块 | 脚本数 | 核心职责 |
|---|------|--------|----------|
| 1 | **Core** | 6 | 模块生命周期、事件总线、场景加载、全局事件 |
| 2 | **Data** | 6 | 关卡/节点/合同/事件配置 + 路径算法 + 数据查询 |
| 3 | **Gameplay** | 5 | 燃料/声望/回合/合同/事件核心玩法逻辑 |
| 4 | **StarMap** | 2 | 星图渲染、节点交互、路线预览、飞船动画 |
| 5 | **Input** | 1 | 鼠标/触摸/键盘输入统一处理 |
| 6 | **UI** | 12 | 8个面板 + 4种列表项/提示组件 |
| 7 | **SaveSystem** | 3 | 设置/存档/试玩数据持久化 |
| 8 | **Audio** | 1 | BGM/Sfx播放、淡入淡出、占位音频生成 |
| 9 | **Animation** | 1 | 全局节奏控制、14种通用动画辅助 |
| 10 | **Bootstrap** | 1 | 启动器、模块连接、事件绑定 |

## 🎮 玩法速览

### 进入游戏后玩家要做什么？

1. **看HUD理解状态** → 顶部显示燃料/星币/声望/回合，一目了然
2. **在星图选节点** → 点击任意节点自动规划最优航线，显示燃料消耗
3. **确认航线出发** → 点击"确认航线"按钮，飞船跳跃航行
4. **途中处理事件** → 危险节点可能触发事件卡，选择应对方案
5. **节点上操作** → 加油、接取/交付合同
6. **完成主线** → 将医疗物资送达 Omega 空间站即可获胜

### 玩家要权衡什么？

| 选择 | 有利 | 风险 |
|------|------|------|
| 走近路（高危险节点） | 省燃料、省回合 | 事件触发率↑ 货物可能受损 |
| 走远路（安全节点） | 事件少、货物安全 | 消耗更多燃料+回合 |
| 接支线合同 | 增加得分、提升声望 | 更多时间压力 |
| 事件选战斗 | 奖励丰厚 | 货物损毁风险高 |
| 事件选稳妥 | 保证不崩 | 消耗更多资源 |

## 🃏 事件补救机制（保证永远有解）

**三层兜底设计**：
1. **配置级** → 每个事件至少1个 `IsRemediationChoice=true` 的稳妥选项
2. **动态级** → 若所有选项资源不足，自动添加「紧急规避」或「求助」选项
3. **保底级** → 极端资源不足时，提供「硬扛过去」（货物-15%但不无解）

**示例: 海盗事件**
```
可选方案:
├─ 付赎金300💰 (稳妥) ← 补救选项
├─ 逃跑消耗15⛽ (70%成功)
├─ 战斗(需声望≥40, 高风险高回报)
└─ 若燃料≥25 → 自动添加: 紧急规避25⛽
```

## 📊 试玩数据记录

PlayRecorder 模块自动记录：

| 类别 | 记录项 |
|------|--------|
| **会话级** | 开始/结束时间、游戏时长、胜败原因、最终得分 |
| **资源流** | 回合使用、燃料消耗、合同成败、事件触发数 |
| **关键选择** | 每次事件选择、航线规划、合同操作（含回合/资源快照） |

**数据导出示例 (JSON)**:
```json
{
  "PlayTimeSeconds": 247.5,
  "IsVictory": true,
  "FinalScore": 3820,
  "CriticalChoices": [
    {
      "ChoiceType": "EventDraw_202_海盗袭击",
      "ChoiceValue": "逃跑消耗15燃料",
      "TurnNumber": 8,
      "FuelAtChoice": 42,
      "OutcomeNote": "成功逃脱！+10声望"
    }
  ]
}
```

## 🔧 快速开始

### Unity 环境要求
- Unity 2021.3 LTS 或更新版本
- TextMeshPro Package (已内置)

### 安装步骤
1. 创建新 Unity 2D 项目
2. 将 `Assets/` 文件夹复制到项目根目录
3. 打开 `Main.unity` 场景（若不存在，新建空场景按 `PROJECT_SETUP_GUIDE.md` 搭建）
4. 创建空物体命名为 `[Bootstrap]`，挂载 `GameBootstrap.cs`
5. 在 Inspector 中绑定 Prefab 和 UI 引用（详见搭建指南）
6. 按 Play 运行！

### 零配置快速测试
所有数据模块内置 `CreateDefaultLevelData()` 方法，未配置ScriptableObject时自动生成：
- ✅ 10个节点星图自动生成
- ✅ 7种事件卡自动创建
- ✅ 5份合同（含主线医疗物资）
- ✅ 25种Sfx + 5种BGM 自动生成正弦波占位音

## 📁 代码文件清单 (33个C#文件)

| 目录 | 文件 | 作用 |
|------|------|------|
| **Core** (6) | IModule.cs, EventBus.cs, Singleton.cs, GameEvents.cs, GameManager.cs, SceneLoader.cs | 核心框架 |
| **Data** (6) | StarNodeData.cs, ContractData.cs, EventCardData.cs, LevelData.cs, GameRuntimeData.cs, **DataManager.cs** | 数据+路径算法 |
| **Gameplay** (5) | FuelManager.cs, ReputationManager.cs, TurnManager.cs, **EventManager.cs**, **GameplayController.cs** | 玩法逻辑 |
| **StarMap** (2) | **StarMapController.cs**, StarNodeView.cs | 星图交互 |
| **Input** (1) | InputManager.cs | 输入处理 |
| **UI** (12) | UIManager.cs, UIPanelBase.cs, MainMenuPanel.cs, HUDPanel.cs, ContractPanel.cs, EventCardPanel.cs, ResultPanel.cs, SettingsPanel.cs, NotificationToast.cs, ContractItemView.cs, EventChoiceButton.cs, LevelButtonItem.cs | UI面板 |
| **Save** (3) | SaveDataTypes.cs, **SaveManager.cs**, **PlayRecorder.cs** | 存档+数据记录 |
| **Audio** (1) | AudioManager.cs | 音效播放 |
| **Animation** (1) | AnimationController.cs | 动画辅助 |
| **Bootstrap** (1) | **GameBootstrap.cs** | 启动组装器 |

## 🎨 UI/UX 重点

### 操作反馈节奏
```
节点选择 → 0.1s 脉冲动画 + 523Hz点击音
↓
路线预览 → 0.2s 路径绘制 + 序列提示音
↓
确认出发 → 0.5s 飞船飞行动画 + 引擎启动音
↓
到达节点 → 0.1s 脉冲 + 到达音 + HUD刷新
↓
若触发事件 → 0.3s事件卡滑入 + 低频冲击音
```

### 成败反馈清晰化
| 状态 | 视觉提示 | 音频提示 |
|------|---------|----------|
| 燃料≥35% | 绿色进度条 | 正常 |
| 燃料20-35% | 黄色+警告文字 | 单次提醒 |
| 燃料<20% | 红色+闪烁 | 循环蜂鸣 |
| 回合剩3个 | 黄色+倒计时 | 单次警示 |
| 合同剩2回合 | 文字变红 | 提示音 |

## 🛠️ 扩展开发

### 添加新事件卡
```csharp
// 1. 继承 EventCardData 创建配置
// 2. 添加3+选项，标记至少1个 IsRemediationChoice=true
// 3. 加入 LevelData.EventCardsPool
// Done! 事件系统自动按权重+条件过滤
```

### 添加新节点类型
```csharp
// StarNodeData.cs → NodeType 枚举加值
// DataManager.GetNodeColor() 添加配色
// 节点 Prefab 中配置对应 Sprite
// Done!
```

### 添加新UI面板
1. 继承 `UIPanelBase`（自带开/关动画）
2. `UIManager.RegisterPanel("MyPanel", instance)` 注册
3. 调用 `uiManager.OpenPanel("MyPanel")` 显示

## 📝 详细文档

- **搭建指南**: [PROJECT_SETUP_GUIDE.md](PROJECT_SETUP_GUIDE.md)
  - Unity 场景层级结构
  - Prefab 详细配置
  - 50项可验证功能 Checklist
  - 常见问题 FAQ

## 📜 License

MIT License - 可用于学习、原型、生产项目。

---

*感谢您使用太空快递航线规划游戏原型！有问题请参考 PROJECT_SETUP_GUIDE.md 的 FAQ 章节。*
