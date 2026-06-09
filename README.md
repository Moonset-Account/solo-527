# 湖面航行天气挑战 - Lake Sailing Weather Challenge

一款休闲策略类Unity游戏原型。玩家扮演摄影师兼船长，根据天气系统（风向、能见度）规划航行路线，管理补给（燃料、食物、电量），完成拍摄任务获取高分。

---

## 🎮 快速开始

### 环境要求
- **Unity 编辑器版本**: 2022.3.10f1 LTS (或更高 2022 LTS 版本)
- **构建目标**: PC, Mac, Linux Standalone (默认), 可扩展至移动平台
- **渲染管线**: 内置渲染管线 (内置 URP 支持)

### 打开项目
1. 启动 Unity Hub
2. 点击 **Add**，选择项目根目录
3. 使用 Unity 2022.3.10f1 或兼容版本打开
4. 打开场景 `Assets/Scenes/BootScene.unity`
5. 点击 **Play** 按钮运行

### 构建项目
1. 菜单: File → Build Settings
2. 目标平台选择 PC/Mac/Linux
3. 确保 BootScene.unity 在 Scenes In Build 列表中（索引 0）
4. 点击 Build，选择输出目录

---

## 🎯 核心玩法

### 游戏循环
1. **主菜单** → 选择关卡
2. **关卡开始** → 系统给出天气预报和初始补给
3. **路线规划** → 根据风向、能见度设置航点
4. **航行阶段** → 船只自动沿路线航行，天气动态变化
5. **拍摄任务** → 接近目标时按空格/鼠标拍摄
6. **补给管理** → 访问补给站补充物资
7. **关卡结算** → 根据完成度、剩余时间、画质评分

### 操作指南

| 操作 | 按键 / 鼠标 | 说明 |
|------|-------------|------|
| 键盘航行 | W/A/S/D 或 方向键 | 控制船只方向 |
| 鼠标航行 | 按住右键拖动 | 朝鼠标位置航行 |
| 路线规划 | R | 打开/关闭路线规划面板 |
| 添加航点 | 鼠标左键 (规划模式) | 在地图上设置航点 |
| 拍摄照片 | 空格 | 接近目标时拍摄 |
| 补给互动 | E | 在补给站附近补给 |
| 抛锚 | Q | 停止当前航行 |
| 起锚 | Ctrl + W | 继续航行 |
| 暂停菜单 | ESC | 暂停/继续 |
| 摄像机跟随 | F | 切换跟随/自由模式 |
| 视角缩放 | 鼠标滚轮 | 调整摄像机缩放 |
| 保存游戏 | F5 | 手动保存 |
| 教程 | F1 | 随时打开教程 |

---

## 🌤️ 天气系统

### 天气类型
| 类型 | 能见度 | 速度修正 | 燃料修正 | 建议策略 |
|------|--------|----------|----------|----------|
| ☀️ 晴朗 | 极佳 (100%) | 100% | 100% | 黄金拍摄时机 |
| ⛅ 多云 | 良好 (85%) | 100% | 105% | 正常航行 |
| 🌧️ 雨天 | 一般 (65%) | 85% | 120% | 节省燃料，快速通过 |
| 💨 大风 | 良好 (85%) | 120% | 85% | 顺风加速，注意偏移 |
| 🌫️ 雾天 | 极差 (20%) | 70% | 115% | 减速，保持航线 |
| ⛈️ 暴风雨 | 较差 (40%) | 50% | 150% | 避开或尽快靠岸 |

### 预警机制
- 天气变化前 **15秒** 屏幕顶部显示警告横幅
- HUD 显示未来 6 个时段的天气预报
- 可在设置中关闭天气警告（不推荐）

---

## 🚤 补给系统

| 补给类型 | 消耗条件 | 耗尽后果 | 获取方式 |
|----------|----------|----------|----------|
| ⛽ 燃料 | 航行时持续消耗 | 无法移动 | 补给站(50%)/任务奖励 |
| 🍞 食物 | 时间消耗 | 速度降低30% | 补给站(50%) |
| 🔋 电量 | 每次拍摄消耗10% | 无法拍摄 | 补给站(50%) |
| 🛠️ 船体 | 碰撞/恶劣天气 | 任务失败 | 维修站/特殊道具 |

---

## 📸 评分系统

### 单张照片评分 (满分~300+)
- **距离分**: 距目标越近得分越高（最优距离5m）
- **角度分**: 正对目标得满分
- **天气分**: 能见度直接作为倍率
- **稀有度加成**: 稀有目标 × 20~100分

### 关卡星级
| 星数 | 分数要求 (以1星为基准) | 奖励 |
|------|------------------------|------|
| ⭐ | ≥1倍基准分 | 解锁下一关 |
| ⭐⭐ | ≥3倍基准分 | 额外金币/经验 |
| ⭐⭐⭐ | ≥6倍基准分 | 成就解锁 |

### 额外奖励
- 剩余时间: 每秒 +2 分
- 补给剩余: 每项补给>50% 加成分数
- 完美通关: 3星额外 +500 分

---

## 🏆 元游戏系统

### 图鉴 (Gallery)
- 15+ 可解锁收藏品（鸟类、植物、风景、传说生物）
- 5 个稀有度等级：普通/稀有/珍贵/史诗/传说
- 拍摄特定目标自动解锁

### 成就 (Achievements)
- 15 个成就，分为 4 大类
- 奖励：金币 + 经验值
- 进度自动追踪，可手动检查

### 排行榜 (Leaderboard)
- 关卡排行榜（每关 Top 50）
- 全球总排行榜（Top 20）
- 结算页可一键提交分数

### 每日挑战 (Daily Challenge)
- 每日随机特殊关卡 + 规则
- 5 种随机 Modifier（双倍补给、无风挑战等）
- 连续挑战天数记录（成就解锁条件）

---

## 📁 项目结构

```
Assets/
├── Scenes/                    # Unity场景文件
│   └── BootScene.unity        # 启动场景（唯一必备场景）
├── Scripts/                   # C#脚本（核心代码）
│   ├── Core/                  # 核心架构
│   │   ├── GameManager.cs        # 游戏状态机 & 全局管理
│   │   ├── Singleton.cs          # 单例模板（持久/场景）
│   │   ├── EventBus.cs           # 事件总线（解耦系统）
│   │   ├── SaveSystem.cs         # JSON存档系统
│   │   ├── AudioManager.cs       # 音频管理（4轨道）
│   │   ├── GameBootstrapper.cs   # 启动引导器
│   │   ├── LevelSceneManager.cs  # 场景加载/构建
│   │   └── SerializableDictionary.cs
│   ├── Data/                  # 数据结构 & SO
│   │   └── LevelConfigData.cs    # 关卡/图鉴/成就数据
│   ├── Gameplay/              # 核心玩法
│   │   ├── WeatherSystem.cs      # 天气系统（含预报）
│   │   ├── BoatController.cs     # 船只控制 & 补给
│   │   ├── TaskSystem.cs         # 任务 & 评分算法
│   │   ├── GallerySystem.cs      # 图鉴系统
│   │   ├── InputController.cs    # 输入控制
│   │   └── BoatAnimationController.cs
│   ├── UI/                    # 界面系统
│   │   ├── UIManager.cs          # UI堆栈管理
│   │   ├── MainMenuPanel.cs      # 主菜单
│   │   ├── HUDPanel.cs           # 游戏HUD
│   │   ├── PauseMenuPanel.cs     # 暂停菜单
│   │   ├── SettingsMenuPanel.cs  # 设置页面
│   │   ├── TutorialPanel.cs      # 教程页面（8页）
│   │   ├── LevelSelectPanel.cs   # 关卡选择
│   │   ├── ResultPanel.cs        # 胜利/失败结算
│   │   ├── GalleryPanel.cs       # 图鉴页面
│   │   ├── AchievementsPanel.cs  # 成就页面
│   │   ├── MetaPanels.cs         # 排行榜/每日挑战
│   │   ├── RoutePlannerPanel.cs  # 路线规划
│   │   └── UIComponents.cs       # UI子组件集合
│   └── Meta/                  # 元游戏
│       ├── AchievementSystem.cs  # 成就追踪
│       └── LeaderboardSystem.cs  # 排行榜/每日挑战
├── Art/                       # 美术资源
│   ├── Sprites/                  # 2D精灵
│   ├── Models/                   # 3D模型
│   ├── Materials/                # 材质
│   ├── Animations/               # Animator控制器
│   ├── UI/                       # UI美术
│   └── Placeholders/             # 占位美术（当前使用）
├── Audio/
│   ├── Music/                    # 背景音乐
│   └── SFX/                      # 音效片段
├── Prefabs/                   # Prefab资源
├── ScriptableObjects/         # 已创建的SO资产
│   ├── Levels/
│   ├── Weathers/
│   └── Achievements/
├── Resources/                 # 运行时加载资源
└── Plugins/                   # 第三方插件

Builds/                       # 构建输出目录
Documentation/                # 架构/设计文档
Packages/manifest.json        # UPM包清单
ProjectSettings/              # Unity项目设置
```

---

## 🔌 扩展指南

### 添加新关卡
1. 在 `Assets/ScriptableObjects/Levels/` 创建新的 `LevelConfigData`
2. 配置天气模式、任务、补给点
3. 在 `LevelSelectPanel` 中的 `LoadAllLevels()` 注册新关卡
4. 首次通关后自动解锁下一关

### 添加新图鉴物品
1. 创建 `GalleryItemData` SO
2. 在 `GalleryPanel.EnsureMockData()` 中注册
3. 在对应任务 `requiredGalleryItemId` 中引用

### 添加新成就
1. 创建 `AchievementData` SO
2. 在 `AchievementPanel.EnsureMockData()` 注册
3. 在 `AchievementSystem.CheckAndUnlockAchievements()` 添加解锁逻辑

### 添加新天气类型
1. 在 `WeatherType` 枚举添加
2. 在 `WeatherSystem` 中添加速度/燃料/能见度修正
3. 在 `UpdateWeatherVisuals()` 添加视觉效果

---

## 🛠️ 构建目标配置

| 平台 | 状态 | 说明 |
|------|------|------|
| Standalone (Win/Mac/Linux) | ✅ 已配置 | 主要开发/测试平台 |
| WebGL | ⬜ 可扩展 | 需调整输入 & 分辨率 |
| Android/iOS | ⬜ 可扩展 | 需添加触摸输入适配 |
| Console | ⬜ 可扩展 | 需添加手柄输入映射 |

---

## 🐛 常见问题

**Q: 打开项目后没有可点击的UI？**
A: 确保打开了 `BootScene.unity` 并点击 Play。启动器会自动创建所有系统和面板。

**Q: 存档保存在哪里？**
A: `%APPDATA%\..\LocalLow\DefaultCompany\GameProject\Saves\` (Windows) 或 `~/Library/Application Support/DefaultCompany/GameProject/Saves/` (Mac)

**Q: 如何重置进度？**
A: 设置页面底部的「重置游戏进度」按钮，或直接删除存档目录。

**Q: 所有美术都是占位方块？**
A: 是的，当前为原型版本，`Assets/Art/Placeholders/` 存放占位实现。替换 `LevelSceneManager.cs` 中的 Prefab 引用即可接入真实美术。

---

## 📝 版本信息
- **版本号**: v1.0.0 (Prototype)
- **最后更新**: 2026-06-09
- **作者**: Lake Sailing Dev Team
- **License**: Internal Use
