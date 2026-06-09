# 事件系统与环境叙事音频设计

> 文件：[EventsAndAudio.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/EventsAndAudio.md)

---

## 1. 全局事件总线 (Event System)

### 1.1 核心GameplayTag定义 (DefaultEngine.ini已配置)

```
Mystery.Item.Collectable        - 可收集物品
Mystery.Item.Clue               - 线索物品
Mystery.Item.Key                - 关键物品
Mystery.Item.Puzzle             - 谜题物品
Mystery.Room.Locked             - 房间被锁
Mystery.Room.Discovered         - 房间发现
Mystery.Event.Trigger           - 自定义事件触发器
Mystery.Chapter.Started         - 章节开始
Mystery.Chapter.Complete        - 章节完成
Mystery.Achievement.Unlocked    - 成就解锁
Mystery.Puzzle.Solved           - 谜题解开
Mystery.Note.Found              - 找到笔记
Mystery.UI.Tutorial             - 教程显示
Mystery.Save.Auto               - 自动保存
Mystery.Save.Manual             - 手动保存
```

### 1.2 事件数据结构 (FGameEventData)

```cpp
FGameplayTag   EventTag      // 主Tag分类
FName          EventId       // 唯一事件ID (如 "Clue_Photo_003_Found")
FText          EventTitle    // 用于UI展示
FText          EventDescription
TMap<FName, FString>  StringParameters
TMap<FName, int32>    IntParameters
TMap<FName, float>    FloatParameters
TMap<FName, bool>     BoolParameters
UObject*       Sender
AActor*        InstigatorActor
FDateTime      Timestamp
bool           bShouldLog
```

### 1.3 蓝图中广播和监听事件

**广播示例**：
```
玩家拾取线索时:
  FGameEventData Data;
  Data.EventTag = Mystery.Item.Clue;
  Data.EventId = "Clue_Photo_003_Found";
  Data.IntParameters.Add("Chapter", 1);
  Data.Sender = this;
  EventSystem::Broadcast(WorldContext, Data);
```

**监听示例**：
```
BeginPlay:
  → BindingId = EventSystem::RegisterListener(
       WorldContext,
       Mystery.Item.Clue,
       this,
       "OnAnyClueFound_Callback")

Custom Event OnAnyClueFound_Callback(EventData: FGameEventData):
  → HUD.ShowCenterHint("线索已添加到笔记本")
  → if (EventData.EventId == "Clue_Photo_003_Found"):
       AmbientSystem.TriggerSpatialCue("Whisper_01", PlayerLocation)
```

### 1.4 事件历史查询
```
蓝图函数: GetRecentEvents(Count: Int, OptionalTagFilter):
  → 用于成就检查、章节回溯、Debug菜单

Debug 命令:
  → Debug.EventHistory 100  (打印最近100条事件)
  → Debug.EventCount Mystery.Item.Clue  (该Tag事件总数)
```

---

## 2. 环境叙事音频系统 (克制的惊吓设计)

### 2.1 设计原则
```
1. NO JUMPSCARES 原则：
   ✗ 严禁突然大声响 + 突然闪脸 (恐怖游戏常见套路)
   ✓ 惊吓靠氛围积累，不靠瞬间刺激

2. 音频强度分层 (根据 Tension 0~1):
   Tension 0.0~0.3 → 安心探索, 背景嗡嗡声, 轻柔环境音
   Tension 0.3~0.6 → 轻微不自在, 偶发远处Creak
   Tension 0.6~0.8 → 紧张, 偶发轻微低语, 呼吸变重
   Tension 0.8~1.0 → 压迫感, 高频音调, 低频嗡鸣

3. 空间Audio 3D化:
   - 所有环境音 (Creak/门声/脚步) 有3D空间位置
   - 玩家会转头寻找声音来源
   - 声音来源位置 = "暗示线索位置" 或 "心理干扰方向"

4. 声音冷却:
   - 同类Cue 30秒冷却，不会重复轰炸
   - 1分钟内最多播放3个非必要环境音
```

### 2.2 音频目录结构 (Content/Audio)

```
Audio/
  ├─ Ambient/
  │    ├─ Ambient_Lobby_Base.wav       (大厅持续低音)
  │    ├─ Ambient_Corridor_Wind.wav    (走廊风声)
  │    ├─ Ambient_Basement_Hum.wav     (地下室电机)
  │    ├─ Ambient_Rain_Loop.wav        (下雨)
  │    ├─ Ambient_Pad_Tension_01.wav   (低频铺垫)
  │    └─ Ambient_Pad_Tension_02.wav
  │
  ├─ FX/  (3D空间音)
  │    ├─ Creaks/
  │    │    ├─ Floor_Creak_01~10.wav  (地板咯吱, 10种变化)
  │    │    ├─ Door_Squeak_01~05.wav  (门轴)
  │    │    ├─ Wall_Rumble_01~03.wav  (墙体震动)
  │    │    └─ Window_Rattle_01~03.wav
  │    ├─ Interaction/
  │    │    ├─ Drawer_Open.wav / Drawer_Close.wav
  │    │    ├─ Paper_Rustle.wav
  │    │    ├─ Light_Click.wav / Light_Buzz_On.wav
  │    │    ├─ Lock_Unlock.wav / Lock_Error.wav
  │    │    ├─ Key_Insert.wav
  │    │    └─ Flashlight_Click.wav
  │    ├─ Proximity/
  │    │    ├─ Footstep_Distant_01~05.wav (远处脚步声, 极低频)
  │    │    ├─ Door_Slam_Distant.wav      (远处猛关门, 但50%音量)
  │    │    ├─ Whisper_Subtle_01~05.wav   (耳语, 不清晰人声)
  │    │    └─ Knock_Soft_01~03.wav       (轻轻敲门声)
  │    └─ Environment/
  │         ├─ Raindrop_Window.wav
  │         ├─ Distant_Thunder.wav        (0.3 Tension触发)
  │         └─ LightBulb_Pop.wav          (灯泡爆裂, 偶发)
  │
  ├─ UI/  (2D音效)
  │    ├─ UI_Button_Hover.wav / UI_Button_Click.wav
  │    ├─ UI_Notebook_Open.wav
  │    ├─ UI_Clue_Add.wav                 (新线索)
  │    ├─ UI_Achievement_Unlock.wav
  │    ├─ UI_Save_Complete.wav
  │    └─ UI_Error_Beep.wav
  │
  ├─ Music/
  │    ├─ MainMenu_Theme.wav              (钢琴+低音节拍)
  │    ├─ Chapter_01_Ambient.wav          (探索音)
  │    ├─ Chapter_01_Ending.wav           (章节结尾音乐)
  │    └─ Results_Screen.wav              (结算页)
  │
  └─ Voice/ (环境叙事配音, 无活人)
       ├─ VoiceMail_Digital_01.wav        (电话答录机)
       ├─ TV_Broadcast_Static.wav         (电视新闻, 模糊)
       ├─ Tape_Recording_01.wav           (旧磁带录音)
       └─ Radio_Fade_In_Clip.wav          (老式收音机)
```

### 2.3 AudioDirector (全局音频管理Actor)

Persistent Level中放置 `BP_AudioDirector`：

```
Components:
  ├─ AudioComponent_Master (Master Sound Mix)
  ├─ AudioComponent_AmbientPad (Tension Pad)
  ├─ AudioComponent_Rain (循环雨)
  └─ AudioComponent_Music (背景音乐)

变量:
  CurrentTension : float (0~1, 读 AmbientSystem)
  LastCueTime : DateTime (防止重复)
  ActiveCueCooldowns : Map(Name, DateTime)

Tick:
  → 平滑 Tension 0.1s Lerp
  → AmbientPad.Volume = Lerp(0.1, 0.5, CurrentTension)
  → AmbientPad.Pitch  = Lerp(1.0, 1.1, CurrentTension)
  → Music.Volume      = Lerp(0.6, 0.3, CurrentTension)
  → LowPassFilter     = Lerp(20000 Hz, 8000 Hz, 1 - CurrentTension)
  → 如果 Player在室内: ReverbEffect 根据房间类型切换

函数 TriggerSpatialCue(CueId, WorldLocation, Radius, Delay):
  → if (DateTime - CueCooldowns[CueId] < 30秒) return
  → 计算 Distance(Listener, Location)
  → if (Distance < Radius):
       按距离衰减音量
       PlaySoundAtLocation(CueId, Location)
       Add Cooldown 30秒
  → else if (Distance < Radius*3):
       降低音量至 0.1~0.15 (隐约可闻)
       PlaySoundAtLocation

函数 OnMistakeHappened:
  → AmbientSystem.SetOverallTension(+0.1, smooth=2.0)
  → 5%概率 0.3秒延迟播放 Whisper_Subtle
  → LowPass 瞬间降低至 2kHz (压抑感), 2秒后恢复

函数 OnClueFound(Important: bool):
  → if (Important):
       Play UI_Achievement_Unlock (轻微版本)
       AmbientSystem.SetOverallTension(-0.05, smooth=3.0)
       → 一点点松弛感
```

### 2.4 脚步声和表面映射

从C++的 FFootstepSurfaceData 扩展：

| Physical Surface | 对应文件 | 音量 |
|-----------------|---------|------|
| SurfaceType1 WoodFloor | Footstep_Wood_01~04.wav | 0.6 |
| SurfaceType2 Carpet    | Footstep_Carpet_01~04.wav | 0.35 |
| SurfaceType3 Tile      | Footstep_Tile_01~04.wav | 0.7 |
| SurfaceType4 Metal     | Footstep_Metal_01~04.wav | 0.75 |
| SurfaceType5 Concrete  | Footstep_Concrete_01~04.wav | 0.65 |

额外规则：
```
- 蹲下 (Crouch): 音量 × 0.4
- 冲刺 (Sprint): 音量 × 1.3
- 走路: 每 0.55秒一次
- 蹲下: 每 0.8秒一次 (脚步更慢)
- 冲刺: 每 0.35秒一次
```

---

## 3. 心理暗示系统 (环境叙事的非音频部分)

### 3.1 视觉暗示 (轻微VFX)

| 触发条件 | PostProcess 变化 |
|---------|-----------------|
| 连续探索5分钟无任何发现 | Vignette 轻微增加 (从 0.3 → 0.4) |
| Tension > 0.7 | Chromatic Aberration (色差) 从0→0.003 |
| Tension > 0.8 | Film Grain 0.0 → 0.15, 轻微闪烁 |
| 发现非常重要的线索 | 短暂的 Bloom 突然增加 → 回落到原值 |
| 进入地下室 | 饱和度轻微下降 (1.0 → 0.8) |
| 发现隐藏房间 | 0.5秒的轻微MotionBlur (安心的过渡) |

**Niagara粒子暗示**：
```
- 灰尘 / 尘螨漂浮 (全局, 仅在手电打开时可见)
- 走廊的蒸汽/烟雾 (Tension > 0.5 才出现)
- 门口的阴影飘过 (2%几率, 视线边缘, 无法细究)
- 写字的笔迹浮现 (关键线索位置, 慢慢淡入淡出)
```

### 3.2 可解释的巧合 (环境叙事)

```
玩家进入101室:
  → 收音机自动打开 (只有30%概率)
  → 播放 1998年流行老歌, 夹杂杂音
  → 不是鬼故事, 是"电源接触不良" + 震动触发

玩家检查照片墙:
  → 灯光闪烁一次 (Distant Thunder 音效)
  → 是雷声, 不是灵异

玩家长时间盯着某张照片:
  → 照片玻璃反射的光影有轻微变化 (人影? 是玩家自己的影子)
  → 让玩家疑惑, 但永远无法证实
```
