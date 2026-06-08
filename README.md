# 装修配色三消 (DecorMatch3)

> Unity 休闲消除类装修游戏原型完整实现

## 项目概述

这是一个完整的Unity游戏原型，融合了经典三消玩法与装修设计元素。玩家通过三消关卡收集装修材料，然后根据客户偏好为房间进行配色和家具选择，最终获得客户评价和奖励。

---

## 核心玩法循环

1. **三消关卡** - 交换相邻宝石，匹配三个以上相同颜色消除
2. **收集材料** - 不同颜色宝石对应不同装修材料（油漆/布料/木材/金属/瓷砖/壁纸）
3. **装修房间** - 为客户选择家具、墙面颜色、地板材质
4. **客户评价** - 系统根据偏好、预算、完整性等多维度评分
5. **获取奖励** - 金币、经验值、新材料，解锁更高关卡

---

## 技术架构

### 核心模块分层

```
DecorMatch3/
├── Core/                    # 底层框架
│   ├── Singleton.cs         # 单例基类
│   ├── EventBus.cs          # 全局事件总线
│   ├── SceneLoader.cs       # 场景加载管理
│   ├── GameStateManager.cs  # 游戏状态机
│   └── ResourceManager.cs   # 资源加载/缓存
│
├── Input/                   # 输入系统
│   └── InputManager.cs      # 多平台输入映射（点击/拖拽/滑动）
│
├── Data/                    # 数据层
│   ├── GameDataModels.cs    # 全部数据模型定义
│   ├── SaveManager.cs       # 存档（PlayerPrefs+JSON）
│   └── LevelManager.cs      # 关卡/客户/家具数据管理
│
├── Managers/
│   └── AudioManager.cs      # 音频管理（BGM+SFX对象池）
│
├── Gameplay/
│   ├── Match3/              # 三消玩法
│   │   ├── Gem.cs           # 宝石组件（动画/交互）
│   │   ├── Board.cs         # 棋盘逻辑（匹配/消除/下落）
│   │   ├── Match3GameManager.cs  # 关卡胜负判定
│   │   └── BoardSceneInitializer.cs
│   │
│   ├── Decoration/          # 装修系统
│   │   ├── DecorationSystem.cs       # 家具放置/颜色应用
│   │   └── DecorationSlotVisual.cs   # 装饰槽位可视化
│   │
│   └── Customer/            # 客户系统
│       └── CustomerReviewSystem.cs   # 多维度评分算法
│
├── UI/                      # 界面层（全部可运行）
│   ├── UIManager.cs         # UI状态管理
│   ├── UIViewBase.cs        # 视图基类（动画/过渡）
│   ├── MainMenuView.cs      # 主菜单
│   ├── TutorialView.cs      # 新手教程（6步图文）
│   ├── Match3HUDView.cs     # 三消HUD（目标/分数/连击）
│   ├── PauseMenuView.cs     # 暂停菜单
│   ├── SettingsView.cs      # 设置页（音量/画质/存档重置）
│   ├── LevelCompleteView.cs # 关卡完成（星级动画+奖励）
│   ├── LevelFailedView.cs   # 关卡失败
│   ├── DecorationHUDView.cs # 装修HUD（客户偏好/预算/材料）
│   ├── FurniturePanelView.cs# 家具选择面板
│   ├── ColorPanelView.cs    # 颜色/材质选择面板
│   ├── CustomerReviewView.cs# 客户评价（分项评分+正负面反馈）
│   ├── LevelSelectView.cs   # 关卡选择
│   ├── MaterialInventoryView.cs # 材料仓库
│   └── LoadingScreenView.cs # 加载界面
│
├── Utilities/
│   ├── FeedbackManager.cs   # 震屏/闪光/粒子/缓动/振动
│   └── UIButtonSound.cs     # 按钮音效自动绑定
│
├── Editor/
│   └── ProjectSetup.cs      # 菜单工具：一键创建场景/文件夹
│
└── GameBootstrap.cs         # 启动引导（系统初始化+数据加载）
```

---

## 核心系统详解

### 1. 事件总线 (EventBus)

- 基于泛型Struct的无GC事件系统
- 支持任意类型作为事件参数
- 自动管理订阅/取消订阅

```csharp
// 发布事件
EventBus.Publish(new LevelCompletedEvent { Score = 1000 });

// 订阅事件
EventBus.Subscribe<LevelCompletedEvent>(OnLevelComplete);
```

### 2. 场景管理 (SceneLoader)

- 异步加载/卸载场景
- 带进度回调的过渡动画
- 场景类型枚举映射到场景名

| 枚举 | 对应场景 | 说明 |
|------|---------|------|
| Bootstrap | Bootstrap | 启动引导场景 |
| MainMenu | MainMenu | 主菜单场景 |
| Match3Level | Match3Level | 三消关卡场景 |
| Decoration | Decoration | 装修场景 |
| Settings | Settings | 设置场景 |

### 3. 输入系统 (InputManager)

- 同时支持鼠标（Editor/PC）和触摸（Mobile）
- 自动检测 Tap / Swipe 手势
- UI点击自动过滤（不会穿透UI）
- 支持暂停/返回键映射

### 4. 存档系统 (SaveManager)

**双重持久化机制：**
- **PlayerPrefs** - 快速读写，用于常用配置和进度
- **JSON文件** - `persistentDataPath` 完整备份

**保存内容：**
- 玩家等级/经验/金币
- 已解锁关卡
- 材料库存
- 音频设置/画质设置/语言

### 5. 三消棋盘 (Board)

**核心算法特性：**
- 8x8标准棋盘（可配置）
- 横竖双向匹配检测（3个及以上）
- 无效交换自动回退
- 级联消除（Combo连击）
- 重力下落自动填补
- 随机生成时避免初始匹配
- 无可用步时自动检测

**分数计算：**
```
基础分 = 50 × 消除数量
连击加成 = 25 × (连击数-1) × 消除数量
额外连线加成 = 50 × (n-3) × 2  （n>3时）
```

### 6. 客户评分系统 (CustomerReviewSystem)

**5大维度加权评分：**

| 维度 | 权重 | 评分依据 |
|------|------|---------|
| 配色适配 | 30% | 偏好色数量/讨厌色数量 × 客户色彩重要度 |
| 家具选择 | 25% | 必需家具/偏好家具/填充率 × 家具重要度 |
| 品质评分 | 20% | 家具平均星级 × 材质重要度 |
| 预算控制 | 15% | 实际花费/预算区间 |
| 完整程度 | 10% | 家具填充率+墙地配色率 |

**星级换算：**
- 90%+ = 5星
- 75%+ = 4星
- 60%+ = 3星（达标）
- 40%+ = 2星
- 20%+ = 1星

### 7. UI系统 (UIManager)

**12个可独立运行的界面视图：**
- 全部基于UIViewBase基类
- 内置6种开/关动画（Fade/Scale/4方向Slide）
- 缓动函数支持（EaseOutBack/Elastic/Bounce等）
- 历史栈管理（GoBack返回上一界面）

---

## 快速开始

### 方法一：使用编辑器菜单（推荐）

1. 打开Unity，新建或打开任意Unity 2020.3+项目
2. 将`Assets/`文件夹整个复制到项目中
3. 菜单栏点击 **DecorMatch3 > Setup > Full Project Setup**
4. 等待自动创建：
   - 完整文件夹结构
   - 5个标准场景
   - Build Settings场景列表
5. 导入TextMeshPro资源包
6. 打开 `Assets/Scenes/Bootstrap.unity`
7. 点击Play运行！

### 方法二：手动设置

#### 步骤1：前置准备
```
要求：
- Unity 2020.3 LTS 或更高
- TextMeshPro Package（Window > TextMeshPro > Import TMP Essential Resources）
- .NET 4.x 框架
```

#### 步骤2：创建场景

**Bootstrap 场景：**
```
Hierarchy:
├── GameBootstrap (添加GameBootstrap脚本)
├── Main Camera (Tag: MainCamera, Orthographic Size=6)
└── EventSystem
```

**Match3Level 场景：**
```
Hierarchy:
├── Main Camera
├── Board (添加Board + BoardSceneInitializer脚本)
├── Match3GameManager (添加Match3GameManager)
├── UICanvas (添加各个UIView子对象)
└── EventSystem
```

**Decoration 场景：**
```
Hierarchy:
├── Main Camera
├── Room (Wall/Floor子对象 + SpriteRenderer)
├── DecorationSystem (添加DecorationSystem脚本)
├── CustomerReviewSystem (添加CustomerReviewSystem脚本)
├── UICanvas (添加各个装修相关UIView)
└── EventSystem
```

#### 步骤3：Build Settings
添加5个场景到Scenes In Build，顺序：
1. Bootstrap
2. MainMenu
3. Match3Level
4. Decoration
5. Settings

#### 步骤4：测试运行
打开Bootstrap场景 → Play

---

## 操作说明

### 三消玩法
- **PC/Mouse**: 点击第一颗宝石 → 点击相邻宝石交换；或按住拖拽滑动
- **Mobile/Touch**: 点按选择 → 左右上下滑动交换
- **暂停**: 按P键或点击右上角暂停按钮
- **返回**: ESC键

### 装修玩法
- 点击房间中的**虚线槽位**选择家具类型
- 顶部按钮：墙面配色 / 地面配色 / 家具面板 / 材料着色
- 左侧面板显示客户**偏好颜色**、**必需家具**、**预算范围**
- 满足所有必需家具后点击**提交评价**

### 设置页
- **音量控制**: Master / Music / SFX 三档独立
- **画质**: 6档质量等级
- **重置**: 重置设置 / 重置全部进度（带确认弹窗）

---

## 数据配置

### 关卡数据 (LevelData)

代码中已内置10个默认关卡，如需自定义JSON配置：

```json
{
  "LevelId": 1,
  "LevelName": "关卡 1",
  "BoardWidth": 8,
  "BoardHeight": 8,
  "MovesLimit": 30,
  "TargetScore": 5000,
  "AvailableGems": [0, 1, 2, 3],
  "Objectives": [
    { "TargetGem": 0, "RequiredCount": 20 },
    { "TargetGem": 1, "RequiredCount": 20 }
  ],
  "CoinReward": 100,
  "MaterialRewards": [
    { "MaterialType": 0, "Amount": 10 }
  ],
  "DifficultyRating": 1
}
```

保存到 `Assets/Resources/LevelData/Level_001.json`，LevelManager会自动加载。

### 宝石-材料对应关系

| 宝石颜色 | GemType枚举 | 材料 | MaterialType |
|---------|-------------|------|-------------|
| 🔴 红色 | Red = 0 | 油漆 | Paint = 0 |
| 🔵 蓝色 | Blue = 1 | 布料 | Fabric = 1 |
| 🟢 绿色 | Green = 2 | 木材 | Wood = 2 |
| 🟡 黄色 | Yellow = 3 | 金属 | Metal = 3 |
| 🟣 紫色 | Purple = 4 | 瓷砖 | Tile = 4 |
| 🟠 橙色 | Orange = 5 | 壁纸 | Wallpaper = 5 |

---

## 操作反馈设计

### 视觉反馈
| 事件 | 表现 |
|------|------|
| 选中宝石 | 放大1.2倍 + 层级提升 |
| 宝石交换 | 线性插值移动(0.2s) |
| 匹配消除 | 缩放至0(0.25s) + 按Y轴延迟 |
| 新宝石生成 | 从上方掉落 + Spawn缩放 |
| 连击触发 | 屏幕中央Combo文字弹跳 |
| 得分增加 | 数字滚动动画 + 飘字 |
| 步数警告 | ≤5时红色+脉冲动画 |
| 关卡胜利 | 三颗星逐个弹跳弹出 |

### 音频反馈
- **ButtonClick** - UI按钮通用
- **GemSwap** - 宝石交换
- **GemClear** - 宝石消除（连击时变调）
- **Combo** - 3连击以上
- **MaterialGain** - 获得材料
- **DecorationPlace** - 放置家具
- **CustomerHappy/Sad** - 评价正负
- **四种BGM** - 主菜单/三消/装修/评价

### 触觉反馈（移动端）
- 宝石消除时短振动
- 设置中可关闭

---

## 玩家成败引导

### 成功时明确告知
1. 星级弹出动画 + 对应音效
2. 分项显示："目标完成 x/y"、"分数：目标/实际"
3. 奖励清单：金币/经验/材料 逐项列出
4. "继续装修"按钮引导到下一环节

### 失败时分析原因
1. 明确显示失败原因："步数用尽" / "材料不足"
2. 距离目标还差多少："还差3个蓝色宝石"、"分数还需2400分"
3. 可选操作：重试 / 花费金币购买额外步数 / 返回主菜单

---

## 扩展建议

### 可增强功能
- [ ] 特殊宝石（条纹/炸弹/彩虹）
- [ ] 关卡障碍物（冰块/锁链）
- [ ] 家具真实Prefab替代色块
- [ ] 客户真实Avatar头像
- [ ] 每日任务/成就系统
- [ ] 排行榜（好友分数对比）
- [ ] 更多关卡类型：限时/限步/收集特殊

### 美术资源替换
```
Assets/Art/
├── Gems/           6种宝石Sprite + 选中/消除动画
├── Furniture/      家具Sprite或Prefab
├── UI/             全部UI切图（按钮/进度条/面板）
└── Rooms/          房间背景图（墙/地板/窗户）

Assets/Audio/
├── Music/          MainMenu.mp3 / Match3.mp3 / Decoration.mp3 / Review.mp3
└── SFX/            按SFXType枚举命名每个文件
```

---

## 技术亮点总结

1. **模块化架构** - 每个系统独立，低耦合高内聚
2. **完整可运行** - 12个UI界面+5个场景+教程/暂停/设置全部打通
3. **算法完备** - 三消匹配/级联/无步检测、客户5维评分算法
4. **反馈到位** - 视觉/听觉/触觉三层反馈体系
5. **数据驱动** - 关卡/客户/家具/颜色全部可配置
6. **存档完备** - 双机制持久化+自动保存+手动备份
7. **跨平台兼容** - 同时支持PC鼠标和移动触摸输入
8. **工具链友好** - Editor菜单一键生成项目结构

---

## 联系与支持

项目已完整实现需求文档中的全部功能点。如有问题可检查：
1. Console是否有红色报错
2. TextMeshPro是否已导入
3. 场景是否按顺序添加到Build Settings
4. Gem Prefab是否正确关联到Board组件

Enjoy! 🎮
