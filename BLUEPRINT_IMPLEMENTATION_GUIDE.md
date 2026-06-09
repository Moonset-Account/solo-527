# 山地救援无人机模拟 - 蓝图实现完整指南

> 项目版本：UE 5.3+ | 模块：MountainRescueDrone  
> 文档日期：2026-06-09 | 状态：可直接用于蓝图子类化

---

## 0. 项目编译与初次启动

### 0.1 编译项目
```bash
# 在项目根目录执行（需先安装UE 5.3）
"C:\Program Files\Epic Games\UE_5.3\Engine\Build\BatchFiles\Build.bat" MountainRescueDroneEditor Win64 Development "YourPath\MountainRescueDrone.uproject" -WaitMutex -FromMsBuild
```
或直接双击 `.uproject`，选择 **Yes** 编译缺失模块。

### 0.2 项目模块结构
```
Source/MountainRescueDrone/
├── MountainRescueTypes.h       ← 所有枚举、结构体（蓝图可直接用）
├── MountainRescueGameMode.h/cpp    ← 游戏模式基类（必建蓝图子类）
├── MountainRescuePlayerController.h/cpp  ← 玩家控制器
├── MountainRescueHUD.h/cpp         ← HUD基类
├── DroneBase.h/cpp              ← 无人机基类（必建蓝图子类）
├── RouteManager.h/cpp           ← 航线管理器
├── WaypointActor.h/cpp          ← 航线点Actor
├── RescueTarget.h/cpp           ← 救援目标
├── DroppedSupply.h/cpp          ← 投放物资
├── WeatherSystem.h/cpp          ← 天气/风速系统
├── SignalSystem.h/cpp           ← 信号盲区系统
├── ReplaySystem.h/cpp           ← 回放系统
├── TaskEditorComponent.h/cpp    ← 难度调节组件
└── AudioFeedbackComponent.h/cpp ← 音效反馈组件
```

---

## 1. 地形关卡（L_MountainBase）搭建

### 1.1 Landscape 建议参数
| 参数 | 值 | 说明 |
|------|-----|------|
| Component Size | 63x63 或 127x127 | 小型试玩：63足够 |
| Overall Resolution | 1009x1009 或 2017x2017 | 推荐 1009×1009 |
| Section Size | 7x7 | |
| Sections Per Component | 1x1 | |
| 材质 | 三层混合（草地/岩石/雪地） | 高度驱动 |

### 1.2 地形雕刻要点
- **中央山谷起点**：Home基地设在山谷（Z≈300m），作为起降坪
- **三道山峰**：
  - 峰1：轻伤目标，海拔1200m，坡度中等
  - 峰2：失温目标，海拔1800m，坡度大，位于信号盲区边缘
  - 峰3：迷路目标，海拔900m，距离最远，完全在信号盲区内
- **河道/峡谷**：作为视觉引导，也是信号盲区的天然位置
- 使用 **Sculpt Mode** 的 **Erosion** 工具产生自然山体

### 1.3 关卡必须放置的Actor清单（必须）
| Actor类 | 数量 | 放置位置 | 说明 |
|---------|------|----------|------|
| BP_Drone（蓝图子类） | 1 | Home基地起降坪 | 玩家无人机 |
| BP_RouteManager（蓝图子类） | 1 | 任意位置（建议Home旁） | 航线管理器 |
| BP_WeatherSystem（蓝图子类） | 1 | 任意位置 | 天气系统 |
| BP_SignalSystem（蓝图子类） | 1 | 任意位置 | 信号系统 |
| BP_ReplaySystem（蓝图子类） | 1 | 任意位置 | 回放系统 |
| PlayerStart | 1 | Home基地 | 出生点 |
| DirectionalLight | 1 | - | 主光源，建议30°倾角 |
| SkyAtmosphere + SkyLight | 各1 | - | 天空系统 |
| ExponentialHeightFog | 1 | - | 山谷雾气（海拔低时浓密） |
| WindDirectionalSource | 1 | - | 可与天气系统联动 |

### 1.4 关卡不需要手动放的（程序生成）
- 救援目标 → GameMode 根据 `CurrentTaskConfig.RescueTargets` 自动生成
- 航线点 → RouteManager 运行时生成

---

## 2. 蓝图子类化完整流程

### 2.1 蓝图优先级（从最重要开始）
```
★★★★★ BP_GameMode (MountainRescueGameMode)
★★★★★ BP_Drone (DroneBase)
★★★★★ BP_HUD (MountainRescueHUD)
★★★★ BP_RouteManager (RouteManager)
★★★★ BP_WaypointActor (WaypointActor)
★★★★ BP_RescueTarget (RescueTarget)
★★★ BP_DroppedSupply (DroppedSupply)
★★★ BP_WeatherSystem (WeatherSystem)
★★★ BP_SignalSystem (SignalSystem)
★★★ BP_ReplaySystem (ReplaySystem)
★★★ BP_PlayerController (MountainRescuePlayerController)
```

---

## 3. 各蓝图详细实现

### 3.1 ★★★★★ BP_GameMode
**父类**：`MountainRescueGameMode`

#### 必须设置的Defaults
- 无（C++已配置）

#### BeginPlay 事件图
```
Event BeginPlay
    → Delay (0.1s)
    → InitializeMission (自身函数)
```

#### 必实现的BlueprintImplementableEvent
| 事件名 | 建议实现 |
|--------|----------|
| `OnMissionInitializationComplete` | 显示"任务开始"UI、播放开场旁白 |
| `ShowMissionToast(Message, Color)` | 创建UMG Toast Widget，淡出动画3秒 |
| `PlaySoundForEvent(Sound)` | 用 `PlaySound2D` 播放 |

#### GameMode 的数据流
```
Initialization
  └→ SpawnRescueTargets() 自动生成目标
  └→ BindDelegates() 绑定事件

编辑阶段 → 玩家在HUD放航线点 → 点击开始
  └→ ValidateAndStartFlight()
     ├→ 航线验证（电量/返航点/投放点）
     ├→ 成功：切换 GameState = Flying
     └→ 失败：ShowMissionToast(红色失败原因)

飞行阶段 Tick
  └→ 目标倒计时
  └→ 检测无人机到达终点
  └→ 检查全部救援完成 → Completed 或 Failed

结束
  └→ CalculateFinalScore() → OnTaskCompleted / OnTaskFailed
```

---

### 3.2 ★★★★★ BP_Drone
**父类**：`DroneBase`

#### 必须设置的Defaults
- **DroneMesh**：放置无人机静态网格（建议用小方块先跑通）
- **FlightParams**：保持默认即可
- **视觉效果**：
  - DropEffect → NS_DropParticle（物资投放Niagara）
  - CrashEffect → NS_Explosion（坠毁特效）

#### 必实现的BlueprintNativeEvent
| 事件 | 建议实现 |
|------|----------|
| `UpdatePropellerAnimation(DeltaTime)` | 用 Timeline 或 `AddLocalRotation` 旋转4个螺旋桨，转速与 CurrentSpeed 正相关 |
| `PlayEngineSound(DeltaTime)` | 绑定 AudioComponent，Pitch 随速度变化 |
| `PlayLowBatteryBeep()` | 播放急促蜂鸣 |
| `PlayDropVFX(SupplyType)` | 切换不同物资的VFX颜色（药包=绿，毯子=橙，信标=蓝） |
| `PlayCrashVFX()` | 播放Niagara CrashEffect + Shake Camera |

#### 动画状态机建议（可选，若有骨骼网格）
```
状态：Idle（悬停）→ Flying（飞行）→ Landing（着陆）
过渡：Idle → Flying：CurrentSpeed > 2
     Flying → Idle：CurrentSpeed < 0.5
```

#### 材质动画建议（若有材质实例）
- 参数 `BatteryIndicator`：电量 < 30% 时机身红灯闪烁
- 参数 `SignalStrength`：信号弱时信号灯橙色→红色

---

### 3.3 ★★★★★ BP_HUD
**父类**：`MountainRescueHUD`

#### 必须设置的Defaults（Widget类引用）
| 属性 | 对应UMG |
|------|---------|
| MainHUDWidgetClass | WBP_MainHUD |
| RouteEditorWidgetClass | WBP_RouteEditor |
| ResultScreenWidgetClass | WBP_ResultScreen |
| TaskEditorWidgetClass | WBP_TaskEditor |
| ReplayWidgetClass | WBP_ReplayControls |

#### 事件绑定（GameState变化时）
```
On GameStateChanged (NewState)
  switch (NewState):
    EditingRoute → ShowMainHUD() + ShowRouteEditor()
    Flying → HideRouteEditor()
    ReturningHome → MainHUD显示"返航中"
    Completed → HideMainHUD() + ShowResultScreen()
    Failed → HideMainHUD() + ShowResultScreen(含失败原因)
    Replaying → ShowReplayControls()
```

#### 屏幕绘制层（C++已实现，蓝图只需调参数）
DrawHUD中已绘制：
- 信号盲区圆圈（橙色）
- 目标投放区域（颜色=优先级）
- 航线距离标注
- 电量/信号进度条（左下）

---

### 3.4 ★★★★ BP_RouteManager
**父类**：`RouteManager`

#### 必须设置的Defaults
- **WaypointActorClass** → BP_WaypointActor

#### 事件绑定（C++已提供委托）
```
OnWaypointAdded(Index, Actor)
  → 播放音效 (WaypointAddedSound)
  → 调用 Actor.UpdateVisualState

OnWaypointRemoved(Index, Actor)
  → 播放音效 (WaypointRemovedSound)

OnRouteValidationFailed
  → 播放验证失败音效
  → 屏幕抖动

OnWaypointReached(Index)
  → 无人机短暂悬停
  → 若是投放点：触发投放逻辑
```

#### 航线验证的3个条件（蓝图可扩展）
1. **电量检查**：`EstimatedBatteryCost < InitialBatteryPercent`（C++已做）
2. **返航检查**：最后一个Waypoint距Home<200m
3. **投放点检查**：投放点数≥目标数

---

### 3.5 ★★★★ BP_WaypointActor
**父类**：`WaypointActor`

#### 视觉（Billboard图标切换）
`OnVisualStateChanged(Color, bPulseEffect)` 事件：
- **颜色**：白(普通) → 绿(投放点) → 黄(选中) → 红(警告)
- **bPulseEffect=true**：用 Niagara 的 Color Parameter 实现呼吸灯效果

#### 标签显示（UTextRenderComponent已存在）
- IndexLabel：大数字（#1、#2...）
- InfoLabel：两行信息
  - 第一行：`[投放] 急救包` + 悬停时间
  - 第二行：`高度150m`

#### 动画：悬停上下浮动
用 Timeline + AddActorLocalOffset(FVector(0,0,Sin)) 实现，让航线点有悬浮感。

---

### 3.6 ★★★★ BP_RescueTarget
**父类**：`RescueTarget`

#### 根据 TargetType 切换外观（BeginPlay中）
```
switch TargetData.TargetType:
  MinorInjury:
    TargetMesh → 人形模型（坐姿+红色医疗十字标记）
    SOS效果 → 红色闪烁SOS信标 + 偶尔呻吟音效
  Hypothermia:
    TargetMesh → 人形模型（蜷缩+蓝色颤抖动画）
    SOS效果 → 蓝白闪烁信标 + 牙齿打颤音效
  LostPerson:
    TargetMesh → 人形模型（站立挥手）
    SOS效果 → 黄色频闪 + 间歇性呼喊音效
```

#### 事件实现
| 事件 | 实现 |
|------|------|
| `OnStatusChanged(bRescued, bTimedOut)` | 救援成功：绿色✓覆盖物+人站起来；超时：灰色遮罩+人倒下 |
| `OnDeliveryAttempt(Result)` | 成功=绿色涟漪；偏差=橙色涟漪；失败=红色×粒子 |
| `OnUrgencyLevelChanged(Urgency01)` | Urgency从0→1时：SOS闪烁频率从慢→快，蜂鸣频率从2s→0.5s |

#### 状态Widget（WBP_TargetStatus，3D空间Widget）
显示内容：
- 顶部：优先级标签（紧急=红！；高=橙↑；普通=黄；低=绿↓）
- 中部：目标类型图标 + 所需物资图标
- 底部：倒计时进度条（颜色随剩余时间：绿→黄→红）
- 紧急目标：整个Widget边框红色脉动

---

### 3.7 ★★★ BP_DroppedSupply
**父类**：`DroppedSupply`

#### 根据 SupplyType 设置 Mesh
`SetSupplyMeshByType(Type)` 中设置：
| 类型 | 静态网格 | 材质 |
|------|----------|------|
| MedicalKit | 白色小方盒 | 红色十字材质 |
| WarmBlanket | 卷状圆柱 | 橙色蓬松材质 |
| LocatorBeacon | 带天线小盒 | 蓝色自发光材质 |

#### 降落伞效果
下落时激活 ParachuteEffect（伞状Niagara），落地后立即隐藏。

#### 落地动画
`OnLanded(Hit)` 后：
- 弹跳3次（使用AddImpulse+物理模拟）
- 信标类型：落地后激活蓝色定位光

---

### 3.8 ★★★ BP_WeatherSystem
**父类**：`WeatherSystem`

#### WindAmbientSound 设置
- 使用循环风声
- Tick中自动调整音量（风速大→响）和音高

#### 视觉事件
`OnWeatherChanged(Config)`：
- 风速 < 5m/s：晴朗
- 5-12m/s：激活 WindParticleEffect（叶子/尘粒水平飘移）
- > 12m/s：加 FogEffect 浓度增加，天空色调变灰

---

### 3.9 ★★★ BP_SignalSystem
**父类**：`SignalSystem`

#### 调试显示
编辑器中 `bDebugDrawDeadZones=true` 可看到橙色球体。
运行时不需要球体（C++已做Trace检测）。

#### 关卡布置
DeadZones 在 BP_Defaults 中手动指定几个 CenterLocation，让其覆盖部分山峰顶部。

---

### 3.10 ★★★ BP_ReplaySystem
**父类**：`ReplaySystem`

#### 回放控制
```
StartPlayback() 调用后
  → Tick 自动插值设置无人机位置/旋转
  → OnPlaybackFrameUpdated(Frame)
     └→ 更新 WBP_ReplayControls 上的进度条/时间戳
OnPlaybackFinished()
  → 重播按钮激活
  → 提示"回放结束"
```

---

### 3.11 ★★★ BP_PlayerController
**父类**：`MountainRescuePlayerController`

#### 必须创建的 Input 资产

1. **IMC_MountainRescue（Input Mapping Context）**
2. **IA_LeftClick** → 键位：LeftMouseButton
3. **IA_RightClick** → 键位：RightMouseButton
4. **IA_MouseDrag** → 键位：LeftMouseButton（触发值：0.5开始）
5. **IA_ModeAdd** → 键位：1
6. **IA_ModeMove** → 键位：2
7. **IA_ModeDelete** → 键位：3
8. **IA_StartFlight** → 键位：Space + Enter
9. **IA_ReturnHome** → 键位：R
10. **IA_ToggleEditor** → 键位：Tab
11. **IA_Pause** → 键位：Esc / P

#### BP_Defaults 绑定
- `InputMappingContext` → IMC_MountainRescue
- `LeftClickAction` → IA_LeftClick，以此类推...

---

## 4. UMG Widget 设计规范

### 4.1 WBP_MainHUD（常驻HUD）
```
┌─────────────────────────────────────────────────────────┐
│ [左上] 任务信息面板                                      │
│  ├ 任务倒计时（大数字，<30s闪烁红色）                     │
│  ├ 已救援/总数: 2/5 (绿色进度条)                         │
│  └ 游戏状态: 编辑航线 / 飞行中 / 返航中 / ✓完成          │
│                                                         │
│ [右上] 目标列表面板（可折叠）                             │
│  ├ 优先级筛选: [全部][紧急][高][普通][低]                 │
│  ├ [ ] 紧急-王XX-轻伤(失温倒计时05:23) ←点击可聚焦      │
│  ├ [✓] 普通-李XX-迷路(已救援)                            │
│  └ [ ] 高-赵XX-失温(08:41)                               │
│                                                         │
│ [中下] 物资库存                                           │
│  ├ 🧰急救包×3   🧣保暖毯×2   📡信标×2                    │
│  └ 总重量: 8kg / 15kg                                    │
│                                                         │
│ [左下] 电量 + 信号条（C++ DrawHUD已实现）                │
│  电量██████████░░░░ 65%                                  │
│  信号████████████░░ 82%                                  │
│                                                         │
│ [右下] 航线信息                                           │
│  总长: 4200m | 预计耗时: 08:15 | 预估耗电: 58%           │
│  当前: #3 (飞行中→#4)                                    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 WBP_RouteEditor（航线编辑工具栏）
```
┌─────────────────────────────────────────────────────────┐
│ [1]添加航点  [2]移动航点  [3]删除航点  [✓]验证航线       │
│  ←三态开关互斥，选中的按钮高亮→                          │
│                                                         │
│ 当前编辑: 航点#3  [位置] [✓设为投放点]                   │
│  投放物资: [▼急救包]  关联目标: [王XX(轻伤)]             │
│  悬停时间: [2]秒  速度限制: [12]m/s                      │
│                                                         │
│ ⚠ 航线警告:  #5→#6 穿越信号盲区(扣150分)                │
│ ⚠ 电量警告:  预计剩余 12%，建议减少航程                   │
│                                                         │
│ [应用航线] [清空重来] [▶开始救援任务]                    │
└─────────────────────────────────────────────────────────┘
```

### 4.3 WBP_ResultScreen（结算界面，核心要求：失败原因可读）
```
┌──────────────────────────────────────────────────────────┐
│                    任务结算报告                            │
│                                                          │
│  ████████████░░░░░░  最终得分: 2,180 / 5,000             │
│  评级: B (良好)                                           │
│                                                          │
│  ┌─ 失败原因（若是失败，这个区域是红色大标题）──────────┐ │
│  │ ⚠ 电量耗尽                                            │ │
│  │                                                       │ │
│  │ 详细说明：                                             │ │
│  │ 航线规划总计 5,832m，超出电量承载范围约 28%。          │ │
│  │ 建议优化方案：                                         │ │
│  │   1. 将 #3 和 #5 合并为一条更短的直线路径              │ │
│  │   2. 减少物资装载（当前10kg，可减去1个保暖毯）          │ │
│  │   3. 任务编辑器中降低 BaseBatteryDrainMultiplier       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ 各目标详情 ─────────────────────────────────────────┐ │
│  │ 目标               结果       偏差  用时   得分/扣分  │ │
│  │ ----------------------------------------------------- │ │
│  │ 🚑王XX 轻伤        ✓精准送达  -     02:11 +800        │ │
│  │     → 黄金时间内完成 +300分                            │ │
│  │ 🧣赵XX 失温        ✓位置偏差 18m   07:55 +420(540-120)│ │
│  │     → 延误4分钟 -120分（建议优先处理此高优目标）        │ │
│  │ 📡李XX 迷路        ✗超时     -     超时   0 / -1000   │ │
│  │     → 黄金时间内未送达，且航线未安排此站                │ │
│  │                                                     │ │
│  │ 延误扣分明细:                                        │ │
│  │   赵XX 失温延误: -120分                               │ │
│  │ 投放偏差扣分: -90分                                  │ │
│  │ 信号丢失扣分: 0（未触发）                              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ 得分汇总 ──────────────────────────────────────────┐ │
│  │  基础救援得分:         2,000                         │ │
│  │  黄金时间奖励:        +  300                         │ │
│  │  电量效率奖励:        +    0  (剩余电量仅5%≥30%)     │ │
│  │  延误扣分:           -  120                         │ │
│  │  投放偏差扣分:       -   90                         │ │
│  │  信号丢失处罚:       -    0                         │ │
│  │  ────────────────────────                           │ │
│  │  最终得分:           2,090                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                          │
│  [💾查看回放]  [↻重新开始]  [✎调整任务难度]  [主菜单]    │
└──────────────────────────────────────────────────────────┘
```

### 4.4 WBP_TaskEditor（难度调节面板）
```
┌──────────────────────────────────────────────────────────┐
│ 🎛 任务编辑器（实时影响难度）                              │
│                                                          │
│ 预设难度: [▼普通]   [简单][普通][困难][专家][保存]       │
│                                                          │
│ ┌── 天气系统 ───────────────────────────────────────┐   │
│ │ 风速:  [──────────●──] 7.0 m/s                     │   │
│ │ 风向:  [────●───────] 东北 45°                     │   │
│ │ [x] 阵风 (强度 [──●───] 1.5)                       │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌── 电量模型 ───────────────────────────────────────┐   │
│ │ 初始电量: [────────────●──] 90%                     │   │
│ │ 耗电倍率: [────●────────] x1.0                      │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌── 物资配置 ───────────────────────────────────────┐   │
│ │ 急救包:   [3]  重量 2.0kg → 6.0kg                  │   │
│ │ 保暖毯:   [2]  重量 2.5kg → 5.0kg                  │   │
│ │ 信标:     [2]  重量 1.5kg → 3.0kg                  │   │
│ │                 总重: 14.0kg / 15kg ████████████░  │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌── 信号盲区 ───────────────────────────────────────┐   │
│ │ 盲区列表: (#1 半径400m #2 半径350m) [+添加][-删除] │   │
│ │ 最大信号范围: [────────────●] 3,000m                │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ [×取消]  [✓应用配置]                                     │
└──────────────────────────────────────────────────────────┘
```

### 4.5 WBP_ReplayControls（回放控制条）
```
┌──────────────────────────────────────────────────────────┐
│  ◀◀  ▶  ▶▶   [────────────●───────────]  05:23 / 08:47 │
│  倒退 播放 快进  ←可拖动进度条→  速度: [x1.0 ▼]         │
│                                                          │
│  当前状态: 飞往航点#4  |  电量 62%  |  信号 88%         │
│                                                          │
│  [×关闭回放]                                             │
└──────────────────────────────────────────────────────────┘
```

---

## 5. 音效与动画反馈（服务玩法判断，不做装饰）

### 5.1 音效设计原则
| 场景 | 音效目的 | 设计建议 |
|------|----------|----------|
| 低电量（<20%） | 提醒玩家必须返航 | 频率随电量降低加速的蜂鸣声（1Hz→5Hz），**不是背景音，是明确信号** |
| 信号丢失 | 提醒玩家可能扣分 | 3声短促高音 + 语音提示："信号丢失，自动返航中" |
| SOS蜂鸣（目标） | 让玩家听声辨位 | 音量与距离挂钩，优先级高的声音**更刺耳**（紧急=1kHz，低=500Hz） |
| 航线点到达 | 确认系统响应 | 短促"叮"一声，投放点多一个"咔哒"投放声 |
| 物资投放成功/失败 | 确认操作结果 | 成功=上扬双音；失败=下降单音 |
| 任务成功/失败 | 情绪反馈 | 成功=长和弦；失败=低音调下降3度 |

### 5.2 动画设计原则
| 场景 | 动画目的 | 设计 |
|------|----------|------|
| 目标倒计时<黄金时间 | 警示玩家 | **整个目标Actor红色外描边脉动**（0.5Hz→2Hz加速） |
| 物资落地偏差大 | 视觉上强调不准确 | 物资弹跳3次 + 地面显示距离文字 `偏18米` |
| 航线穿越盲区 | 航线编辑时警告 | 航线段变成**红色虚线** + 闪烁 |
| 电量耗尽前最后30秒 | 强警告 | HUD边缘红色脉动 + 相机轻微晃动（幅度随电量降低） |
| 无人机进入信号盲区 | 反馈状态 | 画面出现轻微**雪花噪点**（强度随信号强弱变化） |

> **核心要求：所有视觉/听觉反馈必须对应一个玩法判断点。**
> 例如："听到急促蜂鸣→必须返航"，而不是"鸟叫"这种纯装饰音。

---

## 6. 典型任务配置（C++中4个预设，蓝图也可用）

### 6.1 简单关卡目标配置（3目标）
| ID | 类型 | 优先级 | 所需物资 | 坐标(m) | 时限(秒) | 黄金时间(秒) |
|----|------|--------|----------|---------|----------|------------|
| T1 | 轻伤 | 普通 | 急救包 | 20000, 8000, 120000 | 600 | 300 |
| T2 | 失温 | 高 | 保暖毯+急救包 | -15000, 25000, 180000 | 420 | 240 |
| T3 | 迷路 | 低 | 定位信标 | 35000, -20000, 90000 | 900 | 480 |

### 6.2 普通关卡目标配置（5目标）
增加：
- T4：紧急-轻伤（受伤严重，时限仅300s，黄金时间150s）
- T5：高-失温（海拔2000m，信号盲区边缘）

---

## 7. 失败类型说明（玩家可读）

| 失败枚举 | 向玩家显示的解释 | 建议优化方案 |
|----------|------------------|------------|
| BatteryDepleted | 返航时电量耗尽，无人机迫降山野。请规划航线预留≥30%返航电量 | 缩短航程、减轻物资、降低风速设置 |
| BatteryDepletedMidAir | 飞行中电量耗尽，无人机坠毁！ | 紧急目标要先去，或者减少不必要的悬停 |
| SignalLost | 在信号盲区内停留超过15秒 | 航线避开盲区中心；或设置自动返航点在盲区边缘 |
| AllTargetsTimedOut | 全部目标超时，救援失败 | 优化目标访问顺序，用"紧急→高→普通→低"排序 |
| CriticalTargetTimedOut | 紧急目标超时！伤员可能有生命危险 | **紧急目标必须作为第一站**，检查航线顺序 |
| SupplyMismatch | 投放物资类型错误 | 检查每类目标所需物资，在编辑器中正确装载 |
| CrashTerrain | 撞山坠毁 | 提高飞行高度，特别是在山峰附近设置Waypoint时Z值+100m |

---

## 8. 评分系统详解

### 8.1 基础分（按目标）
| 优先级 | 基础分 | 黄金时间奖励 | 延误扣/秒 |
|--------|--------|------------|----------|
| 紧急(Critical) | 800 | 500 | 5 |
| 高(High) | 600 | 350 | 3 |
| 普通(Normal) | 400 | 200 | 2 |
| 低(Low) | 250 | 100 | 1 |

### 8.2 投放距离评分修正
| 距离 | 结果 | 分数系数 |
|------|------|----------|
| ≤ 8m | 精准送达 | x100% |
| 8-25m | 位置偏差 | x60% + 每米扣2分 |
| 25-50m | 可接受偏差 | x40% + 每米扣3分 |
| > 50m 或 物资错误 | 失败 | 0分 + 扣基础分的50% |

### 8.3 额外加分
- **电量效率奖励**：剩余电量≥30%时，每超1%加 10 × 救援完成比例，最高500分
- **全目标精准送达**：所有目标都在黄金时间内精准送达 → 额外 +1000（隐藏）

### 8.4 评级对应分数
| 评级 | 百分比 | 说明 |
|------|--------|------|
| S+ | ≥ 95% | 完美救援，无失误 |
| S | ≥ 90% | 黄金时间全达成 |
| A | ≥ 75% | 优秀 |
| B | ≥ 60% | 良好 |
| C | ≥ 40% | 及格 |
| D | < 40% | 需重新规划 |

---

## 9. 完整游戏流程（测试Checklist）

- [ ] **启动关卡**：Home基地，屏幕显示"开始规划航线"
- [ ] **模式1**：按1，地面点击放置3个投放Waypoint + 返航Waypoint
- [ ] **模式2**：按2，拖拽Waypoint调整位置
- [ ] **模式3**：按3，点击一个Waypoint删除（然后重新添加）
- [ ] **编辑器**：Tab打开任务编辑器，切换预设"简单→困难"，观察航线预估变化
- [ ] **验证航线**：点击验证 → 显示电量是否足够、警告盲区、警告投放点数量
- [ ] **开始任务**：空格，无人机按航线依次飞行
- [ ] **观察反馈**：到达每个Waypoint的声音、投放动画、目标状态变化
- [ ] **低电量/信号测试**：触发一次低电量蜂鸣 + 信号丢失返航
- [ ] **结算界面**：完成/失败后，能看到各目标详细得分+解释
- [ ] **回放功能**：点击查看回放，控制速度和进度条
- [ ] **重新开始**：回到航线编辑状态，可以再次规划

---

## 10. 常见问题排错

| 问题 | 排查 |
|------|------|
| 项目编译报错 `MountainRescueTypes.generated.h` 找不到 | 右键.uproject → Generate Visual Studio Project Files |
| 点击地面不放Waypoint | 检查 Landscape Collision 是否设为 Block Visibility |
| Waypoint不显示标签 | WaypointActor 中 Billboard 和 TextRender 的 Visible |
| 无人机不飞 | 确认调用了 InitializeDrone() 并且 StartMission() 成功 |
| 电量秒空 | 检查 FlightParams.BaseBatteryDrainPerSecond 是不是手滑写成了1.0（正常0.15） |
| 救援目标不生成 | GameMode.CurrentTaskConfig.RescueTargets 数组需非空 |
| 评分总是0 | 检查目标的 TargetID 是否都不同 |

---

*本文档配合 Source 目录下的 C++ 基类使用，所有暴露的 UPROPERTY(BlueprintReadWrite)、UFUNCTION(BlueprintCallable)、DECLARE_DYNAMIC_MULTICAST_DELEGATE 都可直接在蓝图中调用。*
