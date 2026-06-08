# 光与影的迷途 (Light & Shadow Platformer)

## 项目概述
2D 光影平台跳跃游戏。核心玩法：**切换灯光方向**（左/右/上/下），让**影子平台**出现或消失，通过机关房间。

**设计目标**：10分钟内体验完整游戏循环（3关从教学到综合挑战），操作反馈、动画节奏、音效提示、UI状态清晰可辨。

---

## 项目结构

```
question-260/
├── ProjectSettings/              # Unity 项目配置
│   ├── ProjectVersion.txt        # 引擎版本 (2022.3.20f1)
│   ├── ProjectSettings.asset     # 全局设置 (1280x720, 公司/产品名)
│   ├── InputManager.asset        # 输入映射
│   ├── TagManager.asset          # 层/标签/排序层
│   ├── EditorBuildSettings.asset # 构建场景列表
│   ├── EditorSettings.asset      # 编辑器设置 (根命名空间)
│   └── EditorUserBuildSettings.asset
├── Packages/manifest.json        # URP, 2D, Cinemachine, Input System 等
└── Assets/
    └── _Scripts/
        ├── Core/                  # 核心系统 (asmdef: Core)
        │   ├── GameManager.cs         # 游戏状态机 + 关卡切换
        │   ├── EventManager.cs        # 全局事件总线
        │   ├── SaveManager.cs         # JSON 存档 (进度/收集品/开关/存档点)
        │   ├── SettingsManager.cs     # 音量/分辨率/画质/教程开关/键位重绑
        │   ├── LightManager.cs        # 4方向光源切换 + 视觉过渡
        │   ├── ShadowPlatform.cs      # 影子平台 (随光源激活/消失)
        │   ├── AudioManager.cs        # BGM + 26种SFX + 淡出淡入
        │   ├── SceneBootstrap.cs      # 自动初始化 Manager
        │   ├── GameConfig.cs          # ScriptableObject 全局调参
        │   └── LevelConfig.cs         # ScriptableObject 单关配置
        ├── Player/                # 玩家系统 (asmdef: Player)
        │   ├── PlayerController.cs    # 移动/跳跃(Coyote+Buffer+Coyote) + 状态机 + 死亡重生
        │   ├── PlayerAnimator.cs      # 挤压拉伸/受击闪烁/落地缩放
        │   └── PlayerAudio.cs         # 脚步自动播放
        ├── Level/                 # 关卡系统
        │   ├── Checkpoint.cs          # 旗帜升起 + 激活光效 + 存档位置
        │   ├── LevelGoal.cs           # 关卡终点传送门 + 完成过渡
        │   ├── TutorialTrigger.cs     # 教程触发 (进入/交互/离开)
        │   └── LevelBuilder.cs        # 关卡初始化 / 相机边界 / 生成占位玩家
        ├── Interactables/         # 机关系统
        │   ├── InteractableSwitch.cs  # 切换/瞬动/触发型开关
        │   ├── DoorController.cs      # 4种门动画 (垂直滑动/水平/旋转/透明)
        │   ├── PressurePlate.cs       # 压力板 (按下/弹起)
        │   └── Collectible.cs         # 收集品 (浮动/旋转/收集动画)
        ├── Hazard/
        │   └── HazardBase.cs          # 6种危险物 (尖刺/锯片/激光/坠落/移动/陷阱)
        ├── Camera/
        │   └── CameraController.cs    # 跟随 + 前瞻 + 动态缩放 + 镜头震动
        ├── UI/                    # 界面系统 (asmdef: UI)
        │   ├── UIManager.cs           # 7个Canvas切换 + 淡入淡出
        │   ├── HUDController.cs       # 关卡/收集品/光向/血量/死亡反馈
        │   ├── MainMenuController.cs  # 新游戏/继续/设置/退出
        │   ├── PauseMenuController.cs # 继续/重开/设置/主菜单
        │   ├── SettingsMenuController.cs # 音量/画质/全屏/垂直同步/键位重绑
        │   ├── TutorialPanelController.cs # 教程气泡 (滑入/显示/滑出)
        │   ├── GameOverController.cs  # 死亡界面 (震屏/按钮)
        │   └── VictoryController.cs   # 胜利界面 (烟花/统计/逐元素出现)
        ├── EditorTools/           # 运行时工具 (占位资源/场景搭建)
        │   ├── PlaceholderResourceGenerator.cs  # 程序化 Sprite
        │   └── SceneSetupHelper.cs               # 预制体工厂 (平台/门/开关...)
        └── Editor/                # 编辑器工具 (asmdef: Editor, 仅Editor)
            └── ProjectBuilder.cs  # 一键菜单: 创建文件夹/场景/Prefab/ScriptableObject
```

---

## 核心机制

### 1. 光源切换 (LightManager)
- **4 个方向**：左 / 右 / 上 / 下
- **操作**：按 `E` 循环切换，或代码调用 `SwitchLightDirection()`
- **视觉反馈**：
  - 背景色从旧方向色过渡到新方向色 (0.3s, 缓动曲线)
  - 背景/相机背景同时变化
  - 即将消失的平台先**闪烁预警**再消失 (0.15s)
  - 即将出现的平台**放大震动**
  - 平台碰撞体在动画 50% 处切换 (保证安全时机)

### 2. 影子平台 (ShadowPlatform)
7 种激活类型：
| 类型 | 激活条件 |
|------|----------|
| AlwaysActive | 任何时候都激活 |
| LeftOnly | 左光 |
| RightOnly | 右光 |
| TopOnly | 上光 |
| BottomOnly | 下光 |
| HorizontalOnly | 左或右 |
| VerticalOnly | 上或下 |

### 3. 玩家控制 (PlayerController)
- **移动**：A/D 或 ← →，有加速度/减速/空气阻力
- **跳跃**：空格，支持
  - **Coyote Time**：离地瞬间仍可跳 (0.1s)
  - **Jump Buffer**：提前按键在下一次可跳时触发 (0.12s)
  - **Variable Jump Height**：松开空格提前下落
  - 支持二段跳 (maxJumpCount=1，可调)
- **状态机**：Idle / Running / Jumping / Falling / Landing / Dying / Spawning

### 4. 存档系统 (SaveManager)
- 路径：`Application.persistentDataPath/savegame.json`
- 内容：当前关卡 / 激活的存档点 / 收集品 / 开关状态 / 游戏时长
- 事件触发：到达存档点自动存档；关卡完成自动存档

### 5. 事件系统 (EventManager)
C# event + 专用委托，无 GC 分配：
`OnGameStateChanged / OnLevelLoaded / OnPlayerDeath / OnPlayerSpawn / OnCheckpointActivated / OnLightDirectionChanged / OnCollectibleCollected / OnSwitchActivated / OnDoorStateChanged / OnTutorialTriggered / OnLevelCompleted`

### 6. 音频系统 (AudioManager)
- **3 个 AudioSource**：Music (循环) / SFX (非循环) / UI (非循环)
- **26 种 SFX**：跳跃、落地、切换光、开门、开关、死亡、收集、教程…
- **6 首 BGM**：主菜单 / 3个关卡 / 胜利 / 失败
- **淡入淡出**：1s 平滑过渡，状态变更时自动切换
- 自动响应 `SettingsManager` 音量变化

### 7. UI 系统 (UIManager)
**7 个独立 Canvas**（分层管理，便于扩展）：
| Canvas | 内容 | 触发时机 |
|--------|------|----------|
| MainMenu | 新游戏/继续/设置/退出 | 启动或返回主菜单 |
| HUD | 关卡名/收集品数/光向指示/血量/死亡反馈 | 游戏进行中 |
| PauseMenu | 继续/重开/设置/主菜单 | ESC或暂停按钮 |
| SettingsMenu | 音量/画质/全屏/垂直同步/教程/键位重绑 | 主菜单或暂停 |
| TutorialPanel | 教程文本气泡 + 按键提示 | 触发教程区域 |
| GameOver | 重试/从存档点复活/主菜单 | 玩家死亡 |
| Victory | 完成统计/下一关/重玩/主菜单 | 到达终点 |
| Loading | 淡入淡出遮罩 | 场景切换 |

### 8. 关卡设计节奏 (3关 × ≈3分钟)

| 关卡 | 主题 | 引入机制 | 场景示例 |
|------|------|----------|----------|
| **Level 1** | 教学关：光的方向 | 移动 / 跳跃 / 光源切换 / 存档点 | 2块左光+右光平台交替，1存档点 |
| **Level 2** | 机关迷城 | 开关 / 门 / 压力板 / 4向光 | 开关解锁门，压力板+光影组合 |
| **Level 3** | 光影协奏 | 危险物 / 收集品 / 综合组合 | 激光、尖刺、上下光组合挑战 |

---

## 操作按键

| 动作 | 默认按键 | 可重绑 |
|------|----------|--------|
| 向左 | A / ← | ✅ |
| 向右 | D / → | ✅ |
| 跳跃 | Space | ✅ |
| 切换光源 | E | ✅ |
| 交互 | F | ✅ |
| 暂停 | Esc | ✅ |

---

## 快速开始 (Unity Editor 内)

### 方法一：使用编辑器一键菜单（推荐）

1. 用 Unity **2022.3.20f1 LTS** 打开本项目
2. 等待包导入完毕（Cinemachine, Input System, URP 等）
3. 在 Unity 顶部菜单选择：
   - `LightShadowProject → Setup → 5. Full Auto Setup`
   - 等待几秒自动完成：**创建文件夹 → 4个场景 → ScriptableObject → Player Prefab**
4. 打开 `Assets/_Scenes/MainMenu.unity`
5. 点击播放，即可运行

### 方法二：手动逐步构建

1. 打开项目后，先点菜单：`LightShadowProject → Setup → 1. Create Folders`
2. 再执行 `2. Create All Scene Placeholders`
3. 执行 `3. Create ScriptableObjects`
4. 执行 `4. Build Player Prefab`
5. 打开任意场景，点播放即可

### 验证构建可运行

1. `File → Build Settings`，目标平台选 PC/Mac/Linux Standalone
2. 确认 Build 列表包含 4 个场景：
   - MainMenu.unity (index 0)
   - Level01.unity (index 1)
   - Level02.unity (index 2)
   - Level03.unity (index 3)
3. 点 `Build And Run` 即可生成可执行文件

---

## 扩展指南

### 新增第 4 关
1. 复制 Level03.unity 重命名为 Level04.unity
2. 新建 `Assets/_Data/Levels/LevelConfig_04.asset`
3. 在 ProjectSettings 构建设置中加入场景
4. 在 `GameManager.totalLevels` 改为 4，或在 GameConfig.asset 的 allLevels 列表添加

### 新增一种平台类型
1. 在 `ShadowPlatform.PlatformType` 枚举添加新类型
2. 在 `LightManager.IsPlatformActive()` 中增加 switch case

### 新增音效
1. 把音频文件放到 `Assets/_Audio/SFX/` 或 `Assets/_Audio/Music/`
2. 在 `AudioManager.SfxType` 枚举加名
3. 在 AudioManager Prefab 里拖入对应的 AudioClip 字段
4. 代码中调用 `AudioManager.Instance.PlaySfx(SfxType.NewType)`

### 新增 UI 页面
1. 新建 Canvas 放在 UIManager Prefab
2. 创建对应的 Controller 脚本
3. 在 UIManager 添加 Canvas 和 Controller 字段
4. 添加 `Show/Hide` 方法，由 GameState 事件或按钮驱动

---

## 反馈设计重点

| 玩家行为 | 视觉反馈 | 听觉反馈 | UI 反馈 |
|----------|----------|----------|---------|
| 按 E 切光 | 背景色渐变、平台闪烁预警/出现 | SfxType.LightSwitch | HUD 光向指示 pulse 动画 |
| 跳跃 | 挤压拉伸、起跳粒子 | SfxType.Jump | - |
| 落地 | 挤压、落地粒子 | SfxType.Land | - |
| 死亡 | 红色 vignette、角色闪烁 | SfxType.PlayerDeath | 死亡画面 + 按钮 |
| 激活存档点 | 旗帜升起 + 绿光激活 | SfxType.Checkpoint | HUD 弹出 "存档点已激活" |
| 开门 | 平台缓动上移 + 粒子 | SfxType.DoorOpen | - |
| 收集宝石 | 宝石放大上升淡出 | SfxType.Collect (随机 pitch) | HUD 收集数 pulse 动画 |
| 关卡完成 | 传送门放大淡出 | SfxType.LevelComplete + 胜利 BGM | 胜利画面 (烟花+统计) |

---

## 技术亮点

1. **模块化编译边界 (asmdef)**：Core / Player / UI / Editor 四个程序集，减少重编译时间
2. **事件驱动架构**：解耦系统，任意模块间通过 EventManager 通信
3. **配置驱动 (ScriptableObject)**：GameConfig / LevelConfig 可在 Inspector 直接调参，无需改代码
4. **自动初始化 (SceneBootstrap)**：`RuntimeInitializeOnLoadMethod` 保证所有 Manager 在场景加载前就绪
5. **程序化占位资源**：`PlaceholderResourceGenerator` 在没有美术的情况下也能玩
6. **编辑器工具链**：一键菜单 + 场景搭建助手，扩展关卡极低成本
7. **完整的构建设置**：Tag / Layer / Sorting Layer / Build Scene 全部预配置

---

## 版本 & 兼容性

- Unity: **2022.3.20f1 LTS**
- 渲染管线: **URP (内置)**
- 输入系统: **Legacy Input Manager**（可升级为 New Input System）
- 目标平台: PC / Mac / Linux (已验证)
- 支持分辨率: 默认 1280×720，设置菜单可切换

---

## 存档位置

| 平台 | 路径 |
|------|------|
| macOS | `~/Library/Application Support/ShadowGameStudio/LightShadowPlatformer/savegame.json` |
| Windows | `%APPDATA%/../LocalLow/ShadowGameStudio/LightShadowPlatformer/savegame.json` |
| Linux | `~/.config/unity3d/ShadowGameStudio/LightShadowPlatformer/savegame.json` |
