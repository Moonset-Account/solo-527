# 装修配色三消 - 快速开始指南

## 🚀 三步启动项目

### 第 1 步：Unity 环境
- 使用 **Unity 2022.3.20f1 LTS** 或更高的 2022.3 LTS 版本打开项目
- 等待 Unity 完成编译（首次约 1-3 分钟）
- 如果提示包更新，点击「更新」或「保持现有版本」均可

### 第 2 步：一键生成所有资源
Unity 顶部菜单栏点击：
```
DecorMatch3 → Factory → Generate Everything
```
此操作会依次执行：
1. 生成 40+ 个 ScriptableObject 数据资产（关卡、材料、客户、家具、配色、订单、成就、每日挑战）
2. 生成 6 个运行时 Prefab（Tile、Toast、Dialog、MainCanvas、LoadingScreen、BoardContainer）
3. 生成 4 个 Unity 场景并自动加入 Build Settings：
   - `Bootstrap.unity`（启动引导）
   - `MainMenu.unity`（主菜单）
   - `Match3Level.unity`（三消关卡）
   - `DecorationStudio.unity`（装修工作室）

完成后弹窗提示「资源生成完毕，是否打开 Bootstrap 场景？」，点击「是」即可。

### 第 3 步：点击 Play 开始体验
打开场景 `Assets/Scenes/Bootstrap.unity`，点击 Unity 编辑器顶部的 ▶ Play 按钮。

---

## 🎮 十分钟试玩循环

### 循环路径
```
主菜单 → 快速开始 → 三消关卡（收集材料） → 装修工作室（设计方案） → 客户评分（星级反馈） → 返回主菜单
```

### 详细流程

#### 🏠 主菜单（1 分钟）
- 标题：**装修配色三消**
- 6 个功能按钮：
  - **🎮 快速开始 - 十分钟体验**：一键进入第1关
  - **📋 订单列表**：查看所有可接订单及状态
  - **🏆 每日挑战**：今日3个目标进度
  - **🎯 成就系统**：7项成就解锁进度
  - **📊 排行榜**：10名虚拟玩家排名
  - **⚙ 设置**：存档位置、清除存档

#### 💎 三消关卡（3-5 分钟）
- HUD 面板：关卡名、分数进度条、步数/时间限制、暂停按钮
- 目标面板：显示需要收集的材料种类与数量（如：红色颜料×5、木材×3）
- 棋盘操作：
  1. 点击方块选中（出现高亮边框）
  2. 点击相邻方块交换位置
  3. 横/竖连续3个以上同色方块自动消除
  4. 消除后上方方块下落，空位随机补充新方块
  5. 级联消除可获得连击加分
- 胜利条件：收集到目标材料 + 达到一星分数线
- 失败后可选择「重试」或「返回主菜单」

#### 🎨 装修工作室（3-4 分钟）
- 顶部订单信息栏：订单名、客户姓名、预算范围
- 客户提示气泡：显示客户随机偏好提示（如「我喜欢明亮的颜色」）
- 房间预览区（左下方）：
  - 墙面颜色、地板颜色实时更新
  - 家具选择后以色块形式摆放到对应区域
- 装修项目列表（右侧）：
  - 带「*」号的为必选项目（如：墙面配色、地板配色、主家具）
  - 无标记为可选加分项目
  - 点击某项弹出选择对话框，输入序号（默认第1个）
- 材料库存面板（下方）：显示三消关卡收集到的材料
- 右下角提交按钮：
  - 必选项未完成会提示
  - 预算超出会警告并扣分
  - 点击后进入评分环节

#### ⭐ 客户评分（1 分钟）
- 七维加权评分：
  - 风格匹配度 (25%)、配色和谐度 (20%)、材料契合度 (15%)
  - 预算控制 (15%)、舒适度 (10%)、实用性 (10%)、特殊需求 (5%)
- 0-5 星级映射
- 客户正/负面反馈列表（如「沙发颜色很柔和！」「地板颜色太深了」）
- 奖励结算：
  - 💰 金币：基础奖励 + 星级×倍率
  - 💎 宝石：4星及以上获得
  - ⭐ 星星：累计用于解锁后续订单
- 点击「返回主菜单」完成循环

---

## 🧩 模块架构总览

| 层级 | 文件夹 | 职责 |
|------|--------|------|
| 工具层 | `Scripts/Utils/` | Singleton、EventBus、ObjectPool、扩展方法 |
| 核心层 | `Scripts/Core/` | GameManager、SaveSystem(AES加密)、SceneLoader、InputManager、AnalyticsSystem、GameBootstrap、GameFlowController |
| 业务层 | `Scripts/Match3/` `Scripts/Decoration/` | 三消算法/棋盘/关卡、装修订单/客户/评分 |
| 进度层 | `Scripts/Progression/` | 成就、每日挑战、排行榜 |
| 反馈层 | `Scripts/UI/` `Scripts/Audio/` `Scripts/Animation/` `Scripts/VFX/` | UI状态、音效BGM、12种缓动、特效池 |
| 数据层 | `Scripts/Data/` | DataManager 内置示例数据 |
| 编辑器层 | `Scripts/Editor/` | ScriptableObjectGenerator、PrefabFactory、SceneBuilder |
| 场景层 | `Scripts/Core/`（SceneControllers） | 4个场景的运行时UI自动搭建 |

---

## 🛠 常见问题

### Q: Unity 编译报错找不到类型？
A: 确认包管理器中已安装 `Input System`、`Addressables`、`Newtonsoft Json`。若缺失，菜单 `Window → Package Manager` 搜索安装。

### Q: 打开 Bootstrap 场景后 Play 黑屏？
A: `GameBootstrap` 使用 `RuntimeInitializeOnLoadMethod` 自动初始化，约 0.5 秒后会跳转到 MainMenu 场景。若持续黑屏，请检查 Console 是否有红色错误日志。

### Q: 三消棋盘方块显示为白色方块？
A: 这是正常的——运行时使用 `UI/Skin/UISprite.psd` 内置 Sprite，通过 TileType 对应的颜色染色。如需替换为精美美术资源，请生成 Prefab 后修改 Tile Prefab 的 `_tileImage` Sprite。

### Q: 想手动创建数据资产？
A: Unity 菜单 `Assets → Create → DecorMatch3 →` 下可创建所有类型的 ScriptableObject：
- Level（关卡）、Material Data（材料）
- Customer Profile（客户）、Furniture Item（家具）
- Color Palette（配色）、Decoration Order（订单）
- Achievement（成就）、Daily Challenge（每日挑战）

### Q: 存档文件在哪里？
A: `Application.persistentDataPath`，具体路径可在主菜单 → 设置中查看。文件名：
- `player_save.dat`（AES 加密存档）
- `player_save.bak`（自动备份）
- `analytics_*.json`（每会话试玩数据）

### Q: 如何清除存档？
A: 主菜单 → ⚙ 设置 → 清除存档 → 确认删除。或手动删除 persistentDataPath 下的 `.dat` 和 `.bak` 文件。

---

## 📁 生成资源位置

```
Assets/
├── Scenes/                      ← 4个 .unity 场景
│   ├── Bootstrap.unity
│   ├── MainMenu.unity
│   ├── Match3Level.unity
│   └── DecorationStudio.unity
├── Prefabs/                     ← 6个运行时 Prefab
│   ├── Tile.prefab
│   ├── Toast.prefab
│   ├── Dialog.prefab
│   ├── MainCanvas.prefab
│   ├── LoadingScreen.prefab
│   └── BoardContainer.prefab
└── ScriptableObjects/           ← 8类数据资产
    ├── Levels/Level_1~5.asset
    ├── Materials/Material_1~12.asset
    ├── Customers/Customer_*.asset
    ├── Furniture/Furniture_*.asset
    ├── Palettes/Palette_*.asset
    ├── Orders/Order_*.asset
    ├── Achievements/Achievement_*.asset
    └── DailyChallenges/Challenge_*.asset
```

---

祝你玩得开心！🎨✨
