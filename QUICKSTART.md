# 装修配色三消 - 快速开始指南

## 🚀 超简单启动（零配置）

> **重要**：Unity 编译完成后，`Assets/Scenes`、`Prefabs`、`ScriptableObjects` 目录会**自动生成**资源文件，无需手动点任何菜单！

### 只需 2 步即可开玩

#### 第 1 步：Unity 打开项目
- 使用 **Unity 2022.3.20f1 LTS** 或更高的 2022.3 LTS 版本打开项目
- 等待 Unity 完成编译（首次约 1-3 分钟）
- 编译完成后，查看 Console：看到 `[AutoAssetBuilder] 资产自动生成完毕！` 提示即表示就绪
- 如果提示包更新，点击「更新」或「保持现有版本」均可

#### 第 2 步：点击 Play 开始
- **打开 `Assets/Scenes/Bootstrap.unity`**（如果不存在，Unity 菜单点 `DecorMatch3 → Factory → Force Rebuild All` 强制重建）
- 点击 Unity 编辑器顶部的 ▶ Play 按钮
- ✨ **立即进入主菜单界面！**

> 💡 **小技巧**：如果懒得找场景，**随便打开任何场景（包括默认空场景）点 Play 都能进游戏**！`GameBootstrap` 使用 `RuntimeInitializeOnLoadMethod` 会自动创建所有系统和主菜单。

---

## 🛠 如果场景没自动生成（手动方案）

若 Unity 首次加载时的自动生成被打断，手动点击：
```
DecorMatch3 → Factory → Force Rebuild All (强制重建所有场景)
```
或
```
DecorMatch3 → Factory → Generate Everything (一键完成所有资源和场景)
```

---

## 🎮 十分钟试玩循环

### 完整流程
```
主菜单 → 快速开始 → 三消关卡（收集材料） → 装修工作室（设计方案） → 客户评分（星级反馈） → 返回主菜单
```

### 详细步骤

#### 🏠 主菜单（1 分钟）
标题：**装修配色三消**

6 个可点击功能按钮：

| 按钮 | 功能 | 点击后行为 |
|------|------|-----------|
| **🎮 快速开始** | 一键体验完整循环 | 弹窗确认 → 进入三消第 1 关 |
| **📋 订单列表** | 查看可接订单 | 弹窗显示 3 个订单及状态 → 选中后进入对应三消关 |
| **🏆 每日挑战** | 今日目标进度 | 弹窗显示 3 个当日挑战及完成率 |
| **🎯 成就系统** | 成就解锁进度 | 弹窗显示 7 项成就 |
| **📊 排行榜** | 虚拟玩家排名 | 弹窗显示 10 名玩家排行榜 |
| **⚙ 设置** | 存档管理 | 弹窗显示存档位置 + 清除存档按钮 |

---

#### 💎 三消关卡（3-5 分钟）

**界面布局：**
- 顶部 HUD：关卡名 + 分数进度条 + 步数/时间限制 + 暂停按钮
- 左上目标面板：需要收集的材料（如「🎨 红色颜料 × 5」「🪵 木材 × 3」）
- 中央棋盘：7×7 方块，点击相邻两个交换

**操作步骤：**
1. 点击方块 → 出现黄色高亮边框
2. 点击相邻方块 → 交换位置
3. 横向/纵向连续 3 个及以上同色 → 自动消除，对应材料计数 +1
4. 消除后上方方块下落 → 空位随机补新方块
5. 级联消除触发连击加分

**胜利条件：**
- 所有材料目标都达到 + 达到一星分数线

**失败：**
- 弹窗可选「再试一次」重开本关 / 「返回主菜单」

---

#### 🎨 装修工作室（3-4 分钟）

**界面布局：**
- 顶部：订单信息栏（订单名 + 客户姓名 + 预算范围）
- 右上：客户提示气泡（随机偏好，如「我喜欢明亮的颜色！」）
- 左下：房间预览区（墙/地板配色实时预览 + 家具色块摆放）
- 右侧：装修项目列表（带 * 为必选）
- 下方：材料库存面板（三消收集到的材料）
- 右下：提交按钮（点击评分）

**操作流程：**
1. 点击任意项目（如「* 墙面配色」）→ 弹出选择对话框
2. 对话框中显示 3 种选项及其名称和匹配度
3. 点击「选第 1 个」/「选第 2 个」/「选第 3 个」
4. 预览区立即更新显示所选效果
5. 所有带 * 号的必选项完成后 → 点击右下「提交订单」

**预算检查：**
- 提交时若超出预算 → 弹窗警告「仍然提交 / 返回修改」

---

#### ⭐ 客户评分（1 分钟）

**七维加权评分算法：**
| 维度 | 权重 |
|------|------|
| 风格匹配度 | 25% |
| 配色和谐度 | 20% |
| 材料契合度 | 15% |
| 预算控制 | 15% |
| 舒适度 | 10% |
| 实用性 | 10% |
| 特殊需求 | 5% |

**弹窗显示内容：**
- 顶部：★★★★★（0-5 星映射）
- 总评分（/100）、满意度（%）、客户反应（性格台词）
- ✅ 好评点列表 / ❌ 待改进点列表
- 💰 金币奖励、💎 宝石奖励（4 星及以上）、⭐ 累计星星

**点击「返回主菜单」 → 完成循环！**

---

## 🧩 模块架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│  反馈层（运行时动态构建，零 Prefab 依赖）                         │
│  UIManager（Dialog/Toast/TopBar 运行时代码生成）                  │
│  AudioManager / AnimationManager / VFXManager                    │
├─────────────────────────────────────────────────────────────────┤
│  进度层  AchievementManager / DailyChallengeManager / Leaderboard │
├─────────────────────────────────────────────────────────────────┤
│  业务层  Match3: BoardManager / LevelManager / MatchDetector     │
│          Decoration: DecorationManager / OrderManager / Scoring  │
├─────────────────────────────────────────────────────────────────┤
│  核心层  GameBootstrap(自动启动) / GameFlowController(流程串联)    │
│          GameManager / SaveSystem / SceneLoader / Analytics      │
├─────────────────────────────────────────────────────────────────┤
│  工具层  Singleton / EventBus / ObjectPool / ExtensionMethods    │
└─────────────────────────────────────────────────────────────────┘
```

**特别设计：SceneController 生命周期**
```
GoToMainMenu()     → 创建 MainMenuSceneController
StartLevel()       → 销毁 MainMenu → 创建 Match3SceneController
OnLevelComplete()  → 进入装修 → 创建 DecorationSceneController
SubmitDecoration() → 评分弹窗 → 点确认 → GoToMainMenu()
```

---

## 📁 自动生成的资产

Unity 编译后自动生成：
```
Assets/
├── Scenes/                      ← 4个 .unity 场景（加入 Build Settings）
│   ├── Bootstrap.unity          ← ✅ 推荐 Play 此场景
│   ├── MainMenu.unity
│   ├── Match3Level.unity
│   └── DecorationStudio.unity
├── Prefabs/                     ← 6个 Prefab（UI 运行时自动构建也可）
│   ├── Tile.prefab
│   ├── Toast.prefab
│   ├── Dialog.prefab
│   ├── MainCanvas.prefab
│   ├── LoadingScreen.prefab
│   └── BoardContainer.prefab
└── ScriptableObjects/           ← 8类 SO（代码内置默认数据，不需要也能跑）
```

---

## 🛠 常见问题 FAQ

### Q: 打开任何场景点 Play 都能进入游戏？
✅ **是的！** `[GameBootstrap]` 使用 `RuntimeInitializeOnLoadMethod(BeforeSceneLoad)` 在任何场景加载前自动创建所有系统、GameFlowController，并进入主菜单状态。`Bootstrap.unity` 只是为了让你在 Hierarchy 中看到系统对象。

### Q: 三消棋盘方块为什么是白色方块？
使用 Unity 内置 `UI/Skin/UISprite.psd` 染色，功能完整。替换美术资源可修改 Tile Prefab 的 `_tileImage`。

### Q: 如何清空存档？
主菜单 → **⚙ 设置** → **清除存档** → 弹窗确认。或删除文件：
- macOS: `~/Library/Application Support/<Company>/<Product>/player_save.dat`
- Windows: `%AppData%/../LocalLow/<Company>/<Product>/player_save.dat`

### Q: 试玩数据在哪里？
每会话生成 `analytics_*.json` 在 persistentDataPath，记录：用时、失败次数、所有装修选择详情。

### Q: 强制重建场景？
菜单：`DecorMatch3 → Factory → Force Rebuild All`
