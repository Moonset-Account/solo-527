# 像素植物实验室 (Pixel Plant Laboratory)

## 一键运行指南

### 环境要求
- Unity **2022.3 LTS** 或更高版本（推荐 2022.3.20f1）
- 内置 UGUI 包（已在 Packages/manifest.json 中声明依赖）

### 打开项目
1. **File → Open Project**，选择本项目根目录 `/question-285`
2. Unity 会自动编译 C# 脚本并生成 Library 缓存（第一次需等待）
3. 打开场景：**Assets/Scenes/Main.unity**
4. 点击 ▶ Play 按钮即可运行！

### ✨ 为什么不需要 Prefab？
本项目使用 `SceneBootstrap` + `AutoStartLoader` 在**运行时动态构建所有UI**：
- 无需任何预制体，所有 Slider/Button/Panel/Text 都通过代码生成
- 空场景也能运行（`RuntimeInitializeOnLoadMethod` 自动启动 Bootstrap）
- 分辨率自动适配 1600×900，CanvasScaler 自动伸缩

---

## 🎮 游戏核心玩法

### 左栏：实验参数（6滑杆）
| 滑杆 | 作用 |
|---|---|
| 🔆 光照 Light | 过高会烤焦，过低导致生长迟缓 |
| 💧 水分 Water | 过多发霉、过少枯萎 |
| N / P / K | 氮/磷/钾 三种营养素，均衡比例提升稀有率 |
| ⏱ 培养时间 Time | 更长时间消耗更多积分，提升传说几率 |

每次调整滑杆时**实时显示**：
- 🚨 **失败风险百分比**（告诉玩家可能失败的几率）
- 💎 **稀有几率预测**（营养均衡/合适光水环境 → 更高）
- 📊 **同配方历史概率**（同一配方实验≥2次后，显示每种植物出现的频次%）

### 中央：样本区
- 进度条倒计时、动态摆动动画
- 完成后显示：植物名（带稀有度颜色）、描述、匹配度、特征列表
- 稀有/传说：金色/蓝色文字 + 特效

### 右栏：任务 & 资源（常驻）
- 📚 **3组教学任务**（引导玩家理解失败也有价值）：
  1. **初识实验**：完成1次实验 + 查看图鉴 → 奖励
  2. **失败也有价值**：故意制造2种不同失败植物 → **引导玩家知道失败同样进图鉴**
  3. **探索突变**：发现稀有 + 载入配方功能 + 同配方重复实验观察概率变化

- 📅 **每日挑战**：按**固定日期种子**生成（同一天所有玩家相同），7种挑战类型：
  - ChallengeType.AnyExperiment → 任意实验次数
  - ChallengeType.SuccessResult → 非失败结果
  - ChallengeType.FailureResult → 失败结果（强化失败也是收集一部分）
  - ChallengeType.RareOrAbove → 稀有以上
  - ChallengeType.FirstDiscovery → 图鉴新发现
  - ChallengeType.TraitGlowing → 发光特征
  - ChallengeType.TraitCrystalline → 结晶特征

### 底部按钮：打开图鉴/日志
- 📖 **图鉴（Dex）**：25种植物，按稀有度/特征筛选
  - 每个条目保存：首次发现时间、首次配方参数、累计发现次数、最近5次配方历史
  - **载入首次配方按钮**：一键回填参数，便于重复实验
  - **失败样本与普通植物平等展示**

- 📝 **实验日志**：按稀有度/特征（17种）/状态/首次发现 多维度筛选
  - 每条日志：时间、消耗/返还资源、首次标记、配方参数
  - **载入此配方按钮**：从历史回溯复刻

---

## ⚙️ 核心系统说明

### 🔬 受配方约束的突变引擎（MutationEngine.cs）
- **失败不是纯随机**：缺水+强光→焦黑；水过多+光不足→霉；营养极端→侏儒
- **稀有突变有前置条件**：
  - 发光→高光照+高磷
  - 结晶→高钾+长时间
  - 火焰→极强光照+高磷
  - 冰霜→弱光+多水
- **传说级有门槛**：参数必须完全进入指定区间才会判定

### 💸 资源部分返还机制（ResourceManager.cs）
| 实验结局 | 返还比例 |
|---|---|
| ✅ 成功 | 0%（但有稀有/发现奖励） |
| ❌ 失败 | 20% |
| ⏹ 玩家提前终止 | 50% × (1-进度比)，保底30% |

- 单次实验消耗：**种子1 + 营养素×(1+总营养×0.3) + 积分×(1+时间×0.5)**
- 新发现奖励：普通+20积分，稀有+30积分+2营养，传说+50积分+3种子+5营养，失败+2积分

### 📜 系统集成测试（可选）
将 `SystemIntegrationTest.cs` 挂到任意GameObject，运行后：
- 1000次均衡参数突变分布验证
- 极端干燥失败率>60%验证
- 同配方200轮概率总和=100%验证
- 图鉴/日志/任务/挑战 全部流程校验

---

## 📁 完整文件结构

```
question-285/
├── Assets/
│   ├── Scenes/Main.unity              ← 打开这个场景并Play
│   └── Scripts/
│       ├── Core/                       数据与算法
│       │   ├── DataModels.cs           枚举/ExperimentParams/PlantMutation
│       │   ├── DexAndLogModels.cs      图鉴/日志条目
│       │   ├── QuestAndResourceModels.cs  任务/挑战/资源/ChallengeType枚举
│       │   ├── PlantDatabase.cs        25种植物（普通6/稀有11/传说3/失败5）
│       │   └── MutationEngine.cs       核心加权随机 + 同配方概率追踪
│       ├── Managers/                   单例管理器
│       │   ├── GameManager.cs          ★主控：事件总线/Toast通知
│       │   ├── DexManager.cs           图鉴解锁+首次配方保存
│       │   ├── ExperimentLogManager.cs 日志+多维度筛选
│       │   ├── ResourceManager.cs      成本计算/返还/发现奖励
│       │   ├── QuestManager.cs         3组教学任务（强调失败价值）
│       │   └── DailyChallengeManager.cs 按日期种子+ChallengeType枚举推进
│       ├── UI/                         UI组件
│       │   ├── ParameterSlider.cs      通用滑杆
│       │   ├── ParameterPanel.cs       参数面板+概率追踪
│       │   ├── SampleDisplay.cs        样本状态+进度+结果
│       │   ├── DexPanel.cs             图鉴UI+载入配方
│       │   ├── ExperimentLogPanel.cs   日志UI+特征筛选
│       │   └── QuestAndChallengePanel.cs 任务/挑战/资源面板
│       ├── Bootstrap/                  ★★ 免Prefab场景构建 ★★
│       │   ├── SceneBootstrap.cs       400+行代码动态构建完整UI
│       │   └── AutoStartLoader.cs      空场景也能自动启动
│       ├── Utils/AutoSceneBuilder.cs   管理器装配辅助
│       └── Tests/SystemIntegrationTest.cs  1000轮压力测试
├── Packages/manifest.json              UGUI等包依赖
└── ProjectSettings/*.asset             Unity设置骨架（可被编辑器覆盖）
```

---

## 🐛 已修复的编译问题清单

| 错误 | 修复方式 |
|---|---|
| `Text` 类型未引用 | 所有UI脚本已显式 `using UnityEngine.UI`，Packages清单含 `com.unity.ugui` |
| `private Awake()` 被外部调用 | 每个Manager增加 `public InitializeSingleton()`，测试脚本改用它 |
| 每日挑战推进永远为0 | 新增 `ChallengeType` 枚举，`DailyChallenge.Type` 字段，用 `switch(c.Type)` 替代失效的字符串匹配 |
| 场景打开后无内容 | `SceneBootstrap` + `RuntimeInitializeOnLoadMethod`，运行时创建全部Canvas/Slider/Button |
| 右栏Quest面板初始化即消失 | `QuestAndChallengePanel.Start()` 判断：有Open/Close按钮才是Popup，否则常驻 |

---

## 扩展建议
1. 将 `Bootstrap/SceneBootstrap.cs` 中的占位🌿替换为真实精灵（替换 _sampleImg.color 为真实 sprite）
2. 增加 SaveSystem（JSON序列化 DexEntries/Logs/Resources）
3. 添加 像素风 Sprite 图集 + 简单 SpriteResolver
4. 接入 TextMeshPro（将所有 `AddComponent<Text>()` 改为TMP）
5. 增加 成就系统、音效、粒子效果（失败的黑烟、稀有的星光）

祝玩得开心！🌱✨
