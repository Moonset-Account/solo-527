# 装修配色三消游戏 - 项目架构文档

## 一、项目概述

**项目名称**：DecorMatch3（装修配色三消）
**核心玩法**：休闲三消 + 装修设计经营
**技术栈**：Unity 2022.3 LTS + C# + Input System + Addressables
**试玩时长目标**：10分钟内体验完整游戏循环（三消关卡 → 收集材料 → 装修订单 → 客户评价 → 重复）

---

## 二、目录结构与模块边界

```
Assets/
├── Scripts/
│   ├── Core/               # 【核心层】全局系统，不依赖业务逻辑
│   │   ├── GameManager.cs           # 全局状态机、生命周期管理
│   │   ├── GameBootstrap.cs         # 启动引导器，系统初始化顺序
│   │   ├── GameEvents.cs            # 全局事件结构体定义
│   │   ├── SceneLoader.cs           # 场景切换 + Addressables 预加载
│   │   ├── InputManager.cs          # 输入封装（Pointer/键盘）
│   │   ├── SaveSystem.cs            # 存档/读档 + AES 加密
│   │   └── AnalyticsSystem.cs       # 试玩数据采集 + 埋点记录
│   │
│   ├── Match3/             # 【三消层】纯三消玩法逻辑
│   │   ├── TileType.cs              # 方块类型枚举 + 颜色/材料映射
│   │   ├── Tile.cs                  # 单个方块（选中/交换/下落/消除动画）
│   │   ├── MatchDetector.cs         # 匹配检测算法（3连/4连/L型）
│   │   ├── LevelData.cs             # 关卡数据 ScriptableObject
│   │   ├── BoardManager.cs          # 棋盘生成/交换/级联/补充
│   │   └── LevelManager.cs          # 关卡流程/目标/胜负判定
│   │
│   ├── Decoration/         # 【装修层】订单/材料/评分系统
│   │   ├── MaterialData.cs          # 材料定义 SO
│   │   ├── CustomerProfile.cs       # 客户偏好（风格/颜色/材料权重）
│   │   ├── FurnitureItem.cs         # 家具定义 SO + ColorPalette
│   │   ├── DecorationOrder.cs       # 订单（装修槽位+解锁条件）
│   │   ├── DecorationManager.cs     # 装修选择（花费/退还/组合验证）
│   │   ├── ScoringSystem.cs         # 七维评分（风格/配色/材料/预算/舒适/实用/需求）
│   │   └── OrderManager.cs          # 订单生命周期管理
│   │
│   ├── Progression/        # 【进度层】长线留存机制
│   │   ├── AchievementData.cs       # 成就定义 SO
│   │   ├── AchievementManager.cs    # 成就进度追踪/解锁
│   │   ├── DailyChallengeManager.cs # 每日挑战（日期种子生成）
│   │   └── LeaderboardManager.cs    # 排行榜（5种类型）
│   │
│   ├── UI/                 # 【UI层】界面状态管理
│   │   └── UIManager.cs             # 12种UI状态/弹窗/Toast/加载屏
│   │
│   ├── Audio/              # 【音效层】独立反馈系统
│   │   └── AudioManager.cs          # 15种SFX + 4种BGM + 淡入淡出/震动
│   │
│   ├── Animation/          # 【动画层】通用动画工具
│   │   └── AnimationManager.cs      # 8种动画 + 12种缓动函数
│   │
│   ├── VFX/                # 【特效层】粒子/屏幕特效
│   │   └── VFXManager.cs            # 13种特效类型 + 对象池
│   │
│   ├── Data/               # 【数据层】数据中心化管理
│   │   └── DataManager.cs           # 8类SO数据的生成/查询
│   │
│   ├── Utils/              # 【工具层】无依赖工具类
│   │   ├── Singleton.cs             # 线程安全单例基类
│   │   ├── EventBus.cs              # 泛型事件总线
│   │   ├── ObjectPool.cs            # 通用对象池
│   │   └── ExtensionMethods.cs      # 扩展方法
│   │
│   └── Editor/             # 【编辑器工具】
│       └── ScriptableObjectGenerator.cs  # 一键生成SO资源
│
├── Resources/
│   └── ScriptableObjects/  # 运行时加载的SO资源
│
└── Scenes/                 # 场景文件
```

---

## 三、模块依赖关系图（从上到下依赖）

```
                    ┌─────────────────────┐
                    │        UI Layer     │  UIManager
                    └─────────┬───────────┘
                              │
    ┌──────────────┬──────────┼──────────┬───────────────┐
    │              │          │          │               │
┌───▼───┐    ┌─────▼────┐ ┌──▼─────┐ ┌──▼───────┐  ┌────▼──────┐
│ Match3 │    │Decoration│ │ Audio  │ │Animation │  │   VFX     │
│ Layer  │    │  Layer   │ │ Layer  │ │ Layer   │  │  Layer    │
└───┬────┘    └─────┬─────┘ └──┬─────┘ └──┬──────┘  └────┬──────┘
    │               │           │          │              │
    └───────────────┼───────────┼──────────┼──────────────┘
                    │           │          │
              ┌─────▼───────────▼──────────▼─────┐
              │          Progression Layer        │
              │  Achievements / Daily / Leaderboard │
              └─────────────────┬─────────────────┘
                                │
                        ┌───────▼────────┐
                        │   Data Layer    │  DataManager (SO)
                        └───────┬────────┘
                                │
        ┌───────────┬───────────┼───────────┬───────────┐
        │           │           │           │           │
   ┌────▼───┐ ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐ ┌───▼──────┐
   │GameMngr│ │SaveSystem│ │SceneLdr│ │InputMngr│ │Analytics │
   └────┬───┘ └────┬─────┘ └───┬────┘ └───┬─────┘ └───┬──────┘
        │           │           │          │            │
        └───────────┴───────────┴──────────┴────────────┘
                                │
                        ┌───────▼────────┐
                        │   Utils Layer   │  无任何业务依赖
                        └────────────────┘
```

**关键依赖规则**：
- ✅ Core层 → Utils层
- ✅ Match3/Decoration层 → Core层 + Utils层
- ✅ Progression层 → Decoration层 + Match3层 + Core层
- ✅ UI/Audio/Animation/VFX层 → Core层 + Progression层
- ❌ Utils层 不依赖 任何其他层
- ❌ Core层 不依赖 Match3/Decoration/Progression 层（通过EventBus解耦）

---

## 四、核心游戏循环（10分钟试玩路径）

```
玩家启动游戏
    │
    ▼
主菜单（展示：今日订单/成就进度/每日挑战）
    │
    ▼
选择订单 ──▶ 查看客户偏好（莉莉：现代简约风）
    │              │
    │              ▼
    │        确认材料需求（红漆×8 / 蓝漆×8 / 黄漆×5）
    │
    ▼
进入三消关卡 Level-1（6×6棋盘，25步）
    │
    ├── 0-2分钟：教学操作（点击交换方块）
    ├── 2-5分钟：级联消除 → 收集材料
    ├── 5-6分钟：完成关卡目标 → 结算星级
    │
    ▼
关卡结算（三星！获得材料：红×10/蓝×9/黄×7，金币×80）
    │
    ▼
返回装修工作间
    │
    ▼
选择配色方案（北欧纯白配色 - 花费：蓝漆×8 / 浅木×10）
    │
    ▼
选择家具（现代简约沙发 - 花费：布料×6 / 浅木×4）
    │
    ▼
可选升级（暖光装饰灯 +15分）
    │
    ▼
提交装修方案
    │
    ▼
评分系统七维度打分
    ├── 风格匹配：85/100 ✓ 现代简约符合要求
    ├── 配色协调：90/100 ✓ 浅蓝+浅木 和谐
    ├── 材料偏好：80/100 ✓ 布料+木材 符合
    ├── 预算控制：95/100 ✓ $680 低于预算$1500
    ├── 舒适度：   88/100 ✓ 沙发+灯饰
    ├── 实用性：   82/100 ✓ 家具功能完整
    └── 需求完成：100/100 ✓ 必选槽位全选
    │
    ▼
最终得分：88 → 客户满意度：优秀(5星)
    │
    ▼
获得奖励：金币×100 + 星星×5 + 宝石×1
    │
    ▼
解锁：成就「装修新手」+ 下一订单娜娜的卧室
    │
    ▼
返回主菜单（可选：查看排行榜 / 每日挑战 / 继续新订单）
```

---

## 五、模块详细说明

### 5.1 Core 核心层

#### GameManager - 全局状态机
- **职责**：9种游戏状态切换（Boot/MainMenu/Loading/Match3Level/Decoration/OrderManagement/Paused/Settings/Credits）
- **关键接口**：`ChangeState(GameState)`、`OnStateChanged` 事件
- **自动行为**：应用暂停/退出时自动触发存档 + 事件冲刷

#### SceneLoader - 场景与资源管理
- **职责**：场景异步加载 + Addressables 资源预加载 + 进度回调
- **关键接口**：`LoadScene()` / `PreloadAsset<T>()` / `GetPreloadedAsset<T>()` / `ReleaseAllPreloaded()`
- **资源策略**：
  - 常用资源（UI、音效）启动时预加载到内存
  - 关卡美术通过 Addressables 按关卡按需加载
  - 场景切换时自动清理无用资源

#### InputManager - 玩家输入封装
- **职责**：Pointer 输入（点击/拖拽/悬停）+ 键盘（ESC/P）
- **关键接口**：`OnPointerDown/Up/Moved` / `OnBackPressed` / `OnPausePressed`
- **设计**：使用 Unity Input System，上层业务不直接处理输入事件

#### SaveSystem - 加密存档
- **职责**：玩家进度持久化（AES 128位加密）+ 自动备份
- **保存内容**：
  - 货币：金币/宝石/星星
  - 关卡：最高关卡/星数/最佳分数/失败次数
  - 材料：背包库存
  - 订单：已完成/进行中/选择记录
  - 成就：解锁进度
  - 设置：音量/震动/语言
- **自动存档**：每300秒 / 应用退出 / 手动触发

#### AnalyticsSystem - 试玩数据记录
- **职责**：完整的玩家行为埋点 + 关卡/订单过程数据采集
- **关键记录项（按用户需求）**：
  | 记录类型 | 详细字段 |
  |---------|---------|
  | 关卡开始 | levelId / startTime / 历史失败次数 |
  | 关卡完成 | levelId / score / stars / 用时秒数 / 步数 / 各材料获取量 / 是否成功 |
  | 关卡失败 | levelId / 累计失败次数 / 用时 / 失败原因（步数耗尽/时间耗尽） |
  | 方块交换 | 坐标(FromX,FromY→ToX,ToY) / 是否形成匹配 |
  | 消除检测 | 消除数量 / 方块类型 / 连击等级 |
  | 装修选择 | 订单ID / 选择分类 / 选择ID / 选择值 / 偏好匹配分数 / 时间戳 |
  | 订单接受/完成 | 订单ID / 客户ID / 总分 / 满意度 / 各维度分数 |
  | 成就/每日挑战 | ID / 时间 / 结果 |
- **数据存储**：`Application.persistentDataPath/Playthroughs/` 下每会话一个JSON文件

---

### 5.2 Match3 三消层

#### 方块类型设计
```
颜料（6种）：红/蓝/黄/绿/紫/橙 → 对应墙面配色
木材（2种）：浅木/深木 → 对应家具/地板
布料（1种）：高级布料 → 对应沙发/床品
金属（1种）：金属材料 → 对应五金件
瓷砖（1种）：瓷砖 → 对应厨房/卫生间
壁纸（1种）：壁纸 → 对应卧室墙面
障碍（1种）：不可消除方块
空槽（1种）：已消除待补充位
```

#### BoardManager - 棋盘核心
- **算法流程**：
  ```
  1. 初始化棋盘：逐格生成，避免初始3连（回溯检查左2/下2）
  2. 玩家选择/拖拽交换
  3. 动画交换 → 判断是否形成匹配
     ├─ 有匹配：进入级联循环
     └─ 无匹配：反向撤销交换
  4. 级联消除循环：
     ├─ 标记所有匹配方块（MatchDetector）
     ├─ 播放消除动画 → 回收对象池
     ├─ 重力下落：每列计算空缺 → 上方方块下移
     ├─ 顶端生成新方块 → 下落填充
     └─ 重新检测匹配 → 无匹配则结束循环
  5. 无可消除步时：自动洗牌（Fisher-Yates）
  ```

#### MatchDetector - 匹配检测
- **算法**：逐格横向+纵向扫描 + 重叠合并（处理L/T型匹配）
- **连击等级**：3连→Lv1、4连→Lv2、5连+→Lv3
- **死局检测**：遍历所有相邻交换可能性（8×8棋盘最多~112种组合）

#### LevelManager - 关卡控制器
- **关卡目标类型**：
  1. **步数限制**：完成前用完N步
  2. **时间限制**：N秒内达成目标
  3. **无限模式**：自由练习
- **胜负判定**：
  - 胜利：所有收集目标完成 OR 分数≥1星门槛
  - 失败：步数/时间耗尽且未达成胜利条件

---

### 5.3 Decoration 装修层

#### CustomerProfile - 客户偏好模型
- **五维权重打分**：
  | 维度 | 数据结构 | 权重范围 |
  |-----|---------|---------|
  | 风格偏好 | 12种装饰风格（现代/经典/北欧/工业...）各0-100分 | 25% |
  | 颜色偏好 | N组{颜色+权重}，用RGB距离算相似度 | 20% |
  | 材料偏好 | 6类材料各0-100分 | 15% |
  | 家具偏好 | 10类家具各0-100分 | 10% |
  | 性格修正 | Easygoing(+5%) / Demanding(-10%) 等 | 满意度修正 |

#### DecorationManager - 选择管理
- **核心机制**：选择 → 花费材料 → 变更选择自动退款 → 全部必选槽位填满 → 可提交
- **装修槽位（8种）**：墙面配色 / 地板配色 / 主家具 / 次家具 / 灯饰 / 装饰品 / 布艺 / 自定义
- **必选 vs 可选**：必选槽位必须填满，可选槽位提供额外加分

#### ScoringSystem - 七维评分算法
```
最终分数 = 加权平均（满分100）
├── 风格权重   25%：选择项的风格标签 × 客户各风格权重 → 加权平均
├── 配色权重   20%：
│   ├── 单项颜色：用RGB欧氏距离匹配客户偏好颜色的相似度
│   └── 颜色和谐度：所有使用颜色的两两色差评估（相近色→加分，互补色→中，冲突色→减分）
├── 材料权重   15%：家具/配色的主要材料 × 客户材料偏好
├── 预算权重   15%：实际花费 vs 预算区间的位置（50%~75%位置=满分，严重超支→重扣）
├── 舒适度权重 10%：所有家具ComfortRating平均
├── 实用性权重 10%：所有家具Durability+Practicality平均
└── 需求满足度  5%：必选槽位完成度100% + 可选槽位附加分20%

客户满意度 = 最终分数 × 性格系数
星级映射 = [0-19]→0星, [20-39]→1星, [40-59]→2星, [60-74]→3星, [75-89]→4星, [90+]→5星
```

---

### 5.4 Progression 进度层

#### AchievementManager - 成就系统
- **12种条件类型**：总消除数 / 关卡完成数 / 完美关卡 / 最高连击 / 材料收集 / 订单完成 / 5星订单 / 最高分 / 累计金币 / 游玩时长 / 连续登录 / 每日挑战
- **里程碑机制**：大成就（如消除300次）可拆分为 100/200/300 三个里程碑，每个给予小奖励
- **跨场景触发**：通过 EventBus 订阅所有业务事件，自动更新进度

#### DailyChallengeManager - 每日挑战
- **生成机制**：每天用 `日期字符串.GetHashCode()` 作为种子，固定抽取3个挑战
- **4种挑战类型**：分数目标 / 消除数量 / 材料收集 / 限时通关
- **重置周期**：每日UTC零点自动重置

#### LeaderboardManager - 排行榜
- **5种榜单类型**：全球总分 / 周榜 / 单关最高分 / 订单满意度 / 成就数量
- **本地模拟**：首次启动生成10名虚拟玩家数据，玩家分数实时插入

---

### 5.5 反馈系统（UI/Audio/Animation/VFX）

#### 事件→反馈映射表（给足反馈）
| 游戏事件 | UI | Audio | 动画 | VFX |
|---------|----|-------|------|-----|
| 方块被选中 | 高亮描边 | TileSelect(0.8, 1.0) | 缩放1.1倍 | 微光 |
| 有效交换 | - | TileSwap | 位移动画0.2s | - |
| 无效交换 | - | Error(0.6) | 位移+回退 | - |
| 3连消除 | 分数飘字+10 | TileMatch | 缩放→消失 | 颜色匹配爆裂 |
| 4连+消除 | 连击飘字COMBOx2 | TileMatchCombo(变调) | 缩放+震动 | 更大爆裂+光效 |
| 级联第N次 | 连击倍数递增 | 音调逐次上升 | - | 叠加强度 |
| 材料收集 | 背包数字跳动 | MaterialCollect | 飞行图标 | 收集星光 |
| 关卡胜利 | 结算弹窗/星星动画 | LevelComplete(1.2s) | UI滑入 | 撒花彩屑 |
| 关卡失败 | 结算弹窗 | LevelFail | - | 灰色遮罩 |
| 客户满意 | 开心台词气泡 | CoinGain | 头像跳动 | 撒花 |
| 客户不满 | 失望台词 | - | 头像摇头 | 雨丝（可选） |
| 成就解锁 | 横幅Toast | AchievementUnlock | 从下滑入 | 金色光芒+火花 |
| 点击按钮 | - | ButtonClick | 按下回弹 | - |

---

## 六、关键数据结构（JSON格式示例）

### 6.1 关卡数据 LevelData
```json
{
  "levelId": 1,
  "levelName": "初学者的第一步",
  "boardWidth": 6,
  "boardHeight": 6,
  "limitType": "Moves",
  "maxMoves": 25,
  "starThresholds": [500, 1200, 2000],
  "availableTileTypes": [1, 2, 3, 4, 5],
  "collectionTargets": [
    { "materialId": 1, "tileType": 1, "amount": 8 },
    { "materialId": 2, "tileType": 2, "amount": 8 },
    { "materialId": 3, "tileType": 3, "amount": 5 }
  ],
  "rewards": { "baseCoins": 30, "perStarCoins": 20, "gems": 0 }
}
```

### 6.2 关卡游玩记录 PlaythroughRecord
```json
{
  "sessionId": "a1b2c3d4e5f6",
  "startTime": 1717843200,
  "endTime": 1717843720,
  "levelsPlayed": 2,
  "levelsCompleted": 1,
  "levelsFailed": 0,
  "levelRecords": [
    {
      "levelId": 1,
      "startTime": 1717843210,
      "endTime": 1717843530,
      "durationSeconds": 320,
      "isSuccess": true,
      "score": 2350,
      "stars": 3,
      "movesUsed": 22,
      "failCount": 0,
      "materialsCollected": { "1": 10, "2": 9, "3": 7 }
    }
  ],
  "decorationChoices": [
    {
      "orderId": 1,
      "category": "WallColor",
      "choiceId": 1,
      "choiceValue": "北欧纯白",
      "timestamp": 1717843560,
      "matchingPreferenceScore": 82
    }
  ]
}
```

---

## 七、扩展开发指南

### 7.1 新增关卡步骤
1. **资源准备**：确认需要收集的材料类型
2. **代码方式**：在 `DataManager.cs → GenerateDefaultLevels()` 添加新 `LevelData`
3. **编辑器方式**：Unity → Assets → Create → DecorMatch3 → Level Data，然后配置参数
4. **自动生成**：菜单栏 `DecorMatch3 → Generate All Data Assets`

### 7.2 新增客户偏好步骤
1. 创建 `CustomerProfile` SO
2. 配置 风格/颜色/材料/家具 四维权重
3. 编写不同满意度下的对话台词（至少3条/种，随机抽取）
4. 关联到对应 `DecorationOrder`

### 7.3 新增成就步骤
1. 创建 `AchievementData` SO
2. 设置条件类型和目标值（如需新条件类型，在 `AchievementConditionType` 枚举添加）
3. 在 `AchievementManager → UpdateProgress/IncrementProgress` 中添加对应事件监听
4. 注册到 `DataManager`

### 7.4 接入真实后端（可选）
当前系统是纯本地模拟，替换为线上服务建议：
- **存档系统**：替换 `SaveSystem → 云端保存接口`（如 PlayFab / Firebase）
- **排行榜**：替换 `LeaderboardManager → REST API`
- **每日挑战**：替换 `GenerateTodaysChallenges → 服务器下发当日配置`
- **埋点分析**：`AnalyticsSystem → FlushEvents()` 改为上报到 Mixpanel / 自建数据平台

### 7.5 美术资源接入规范
```
方块视觉：Tile脚本中的_tileImage替换为Sprite，或根据TileType加载图集
          6种颜料 + 6种材料 = 12种基础贴图 + 12种高亮贴图
关卡背景：按LevelData配置的主题色加载
家具预览：FurnitureItem.PreviewImage（Sprite）+ 3D Prefab（可选用于场景预览）
房间展示：按订单ID加载对应的场景Prefab，通过Renderer.material.color动态改色
```

---

## 八、性能优化建议

1. **对象池**：
   - Tile 对象池化（BoardManager 已实现，棋盘最大尺寸9×9=81，池容量设置162足够）
   - 粒子特效对象池化（VFXManager 已实现）
   - UI Toast/弹窗对象池化

2. **内存管理**：
   - Addressables 按关卡加载美术资源，关卡切换后 `ReleasePreloadedAsset()`
   - 每次场景切换调用 `Resources.UnloadUnusedAssets()`

3. **GC 优化**：
   - 三消每帧 `Update` 中禁止 new 操作
   - 事件参数全部使用 struct 值类型（GameEvents.cs 已定义）
   - 大数组复用（`_gridData`/`_tiles` 全局复用，不重新分配）

4. **渲染优化**：
   - UI 使用 Canvas 合批
   - 方块 UI 使用 Atlas 图集
   - 粒子特效使用 Mobile 级 Shader

---

## 九、快速启动指南

1. 打开 Unity Hub → Add → 选择项目根目录
2. Unity 版本选择 `2022.3.20f1 LTS`（或修改 ProjectVersion.txt 为你的版本）
3. 等待包管理器安装依赖（Input System / Addressables / Newtonsoft Json）
4. 生成示例数据：菜单栏 `DecorMatch3 → Generate All Data Assets`
5. 打开场景 `Assets/Scenes/Main.unity`（需自行创建并挂载场景启动脚本，或直接运行GameBootstrap会自动初始化所有系统）
6. 点击 Play 开始游戏

---

## 十、核心模块文件索引（点击跳转）

| 模块 | 核心文件 |
|-----|---------|
| 游戏启动 | [GameBootstrap.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Core/GameBootstrap.cs) |
| 全局状态 | [GameManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Core/GameManager.cs) |
| 场景管理 | [SceneLoader.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Core/SceneLoader.cs) |
| 输入管理 | [InputManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Core/InputManager.cs) |
| 存档系统 | [SaveSystem.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Core/SaveSystem.cs) |
| 数据采集 | [AnalyticsSystem.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Core/AnalyticsSystem.cs) |
| 三消棋盘 | [BoardManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Match3/BoardManager.cs) |
| 匹配检测 | [MatchDetector.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Match3/MatchDetector.cs) |
| 关卡流程 | [LevelManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Match3/LevelManager.cs) |
| 客户偏好 | [CustomerProfile.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Decoration/CustomerProfile.cs) |
| 装修选择 | [DecorationManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Decoration/DecorationManager.cs) |
| 七维评分 | [ScoringSystem.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Decoration/ScoringSystem.cs) |
| 订单管理 | [OrderManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Decoration/OrderManager.cs) |
| 成就系统 | [AchievementManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Progression/AchievementManager.cs) |
| 每日挑战 | [DailyChallengeManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Progression/DailyChallengeManager.cs) |
| 排行榜 | [LeaderboardManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Progression/LeaderboardManager.cs) |
| UI管理 | [UIManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/UI/UIManager.cs) |
| 音效管理 | [AudioManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Audio/AudioManager.cs) |
| 动画管理 | [AnimationManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Animation/AnimationManager.cs) |
| 特效管理 | [VFXManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/VFX/VFXManager.cs) |
| 数据中心 | [DataManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Data/DataManager.cs) |
| 事件定义 | [GameEvents.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Core/GameEvents.cs) |
| 工具层 | [Utils/](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Utils/) |
| 编辑器工具 | [ScriptableObjectGenerator.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts/Editor/ScriptableObjectGenerator.cs) |
