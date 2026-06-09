# 房间探索与环境叙事系统设计

> 文件：[RoomExploration.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/RoomExploration.md)

---

## 1. 旧公寓地图布局

### 1.1 总楼层规划 (测试版内容)

```
┌─────────────────────────────────────────────────────────┐
│  2F (锁: 201 / 202 / 203 / 公共浴室 (锁: 仅完成1F后解锁)
├─────────────────────────────────────────────────────────┤
│  1F (大厅 / 走廊 / 101 / 102 / 103 / 楼梯间 / 管理室)
├─────────────────────────────────────────────────────────┤
│ B1 (地下室 / 锅炉房 / 储藏室 / 洗衣房 (隐藏)
└─────────────────────────────────────────────────────────┘
```

### 1.2 每个房间Actor结构 (Content/Blueprints/Actors)

| 蓝图名               | 路径                              | 基类                              | 功能                                  |
|--------------------|---------------------------------|---------------------------------|-----------------------------------|
| `BP_RoomTrigger`   | Blueprints/Actors/BP_RoomTrigger | AOldApartmentInteractable        | 房间切换触发器 (Door)
| `BP_Door`        | Blueprints/Actors/BP_Door        | AOldApartmentInteractable        | 通用门Actor(开/关/锁/开)
| `BP_LightSwitch` | Blueprints/Actors/BP_LightSwitch | AOldApartmentInteractable        | 电灯开关)
| `BP_RoomLight`   | Blueprints/Actors/BP_RoomLight   | AOldApartmentInteractable        | 可调灯光+音频触发房间照明+Vignette效果  |

---

## 2. 房间发现系统

### 2.1 BP_RoomTrigger 蓝图

**组件结构 (BoxComponent**：
```
BoxComponent (Root**：
    ├── BoxCollider (Overlap 600x800x220cm)
    ├── TextRenderComponent (房间名字，距离>时隐藏)
    ├── PointLight 模拟** (发现奖励)
    └── RoomId : Name
        RoomDisplayName : Text
        RequiredKeyItemId : Name (若需要KeyItem解锁的物品)
        bIsDiscovered : Bool
        bIsLocked : Bool
        TensionLevelOnEnter : Float (进入时紧张度)
        AmbientCueOnEnter : SoundCue (进入播放
        FirstEnterCue (音频)
```

**事件：

```

BeginPlay:

Event BeginPlay()
  → Subscribe Event "Mystery.Room.Unlocked(RoomId)
  → 如果 bIsLocked = false

Event OnBeginOverlap(Pawn进入)
  → if (bIsLocked):
       if (Player拥有RequiredKeyItem)
         {
             bIsLocked = false
             Play SFX "Door_Unlock.wav"
             Broadcast "Mystery.Room.Unlocked"
             GameInstance.RegisterAchievement(按房间
         }
    else
         Show HUD提示"Locked提示
  → if (bIsLocked && !bIsDiscovered):
         {
             bIsDiscovered = true
             SaveData.PlayerProgress.DiscoveredRoomIds.Add(RoomId)
             Show CenterHint "发现了 "X房间"
             Score += 50 分
             Broadcast "Mystery.Room.Discovered(RoomId)
             成就检查探索狂人(若全部房间发现)
         }
  → AmbientSystem.TriggerProximityEvent(RoomId, TensionLevel, false)
  → 播放 AmbientCueOnEnter (2D空间)
  → LevelStream加载关联子关卡

Event OnEndOverlap
  → 灯光淡出
  → Audio混响参数变化 (Reverb设置根据不同房间混响

---

## 3. 家具检查 / 非线索 环境叙事

### 3.1 BP_Furniture 蓝图 (基类：AOldApartmentInteractable)

| 家具类型    | 检查结果类型 | 触发事件 | 环境叙事点 (克制的设计

|------------|------------|---------|----------------------
| 桌子抽屉   | 抽屉内容 | 线索发现| 租客遗留信,  租客日记 (2抽屉, 线索,  日记页, 电话簿,  照片 |
| 衣柜      | 衣物      | 氛围音 |  衣架碰撞 |
| 书架      | 可翻阅 |  翻|  可疑  .|
| 照片墙    |  特定   抽 | 照片抽出照片, 老照片  |
| 床底      |  视线   |  缓慢   |   床下   床板|
| 马桶水箱  |  水箱|  手| 小物  | 空盒子  盒子  有字,
| 冰箱|  冷藏食品过期 |  食物 | 冰箱贴, 厨房 |
| 厨房抽屉  |   内部  |  冰箱贴  ,  内藏 |  发现, 日期 (
| 灶台      |  灶头|  抽屉 |  线索
| 厨房  厨房  |  钥匙  线索,  旧物  |  照片  物件  |
| 厨房 |  厨房  厨房  冰箱抽屉

## 4. 灯光系统

### 4.1 BP_RoomLight 灯光参数 (PostProcessVolume + Light Switch

|  |  |  灯泡破裂灯光系统

**：
```
Components:
  ├─ RectLight / PointLights (可开关( 多个灯泡 Actor)
  ├─ RectLight 3 x1 - 4个灯泡
  │  ├─ (, 闪烁  暖白色 ~ 暖黄| 50% 2700K)
  │  ├─ LightIntensity: 3000 (正常  (   无频闪  环境+ 轻微
  │   灯泡闪烁
  │  PlayAnimation   , 50  90%
  │   轻微闪烁
  │
  └─ LightFlickerTimeline  模拟)

Custom Event FlickerLight
  → Timeline从0 → 2秒
  → LightIntensity = Lerp(1000 ~ 2500, Random)
  → SoundCue "灯泡  灯光啪嗒声

**LightSwitch_OnInteract:
  → 反转灯Toggle  反 LightIntensity
  → if (开灯SFX "开关 Click )
  → 播放  Click
  → 调整 PostProcessVignette (黑暗→ 变亮

### 4.2  紧张度关联

```
Tick(DeltaSeconds):
  Tension = AmbientSystem.GetCurrentTension()
  → LightColor = Lerp(暖色 (2700K → 冷色(4500K, Tension)
  → LightIntensity *= Lerp(1.0, 0.7, Tension)
  → PostProcess Bloom = Lerp(0.2, 0.8, Tension)
  → 音频混响  紧张
```

---

## 5.  空间音频设计

### 5.1 分层Audio分层

| 音频分类 (Content/Audio) | 目录 | 触发 |

| Ambient_Lobby_Hum.ogg | Ambient 背景嗡嗡声) | 大厅循环 |
|-----------|------------|---------
| Ambient_Corridor_Wind.ogg | Wind Wind窗户漏风) | 走廊 (进入播放
| Ambient_Rain_Appliances.ogg |  楼   持续嗡嗡声 | 公寓) |  房间
| Ambient_Boiler_Hum.ogg | 地下室背景 | 地下室 |
| Ambient_Background_AmbientPad.ogg  整体氛围音   全局)| 背景音乐 ( ( 声音低低鸣
| Ambient_Creak_01~10.ogg |  FX |   木地板咯吱声 ( 远处(轻微  间隔随机
| Ambient_WallRumble.ogg   远处水管声 |  墙体)
| Ambient_Whisper_Whisper_01~05.ogg |  低语  隐约 (非人声)

### 5.2 Cue (3D空间)

| 文件   | 放置位置 | 触发触发 | 紧张度增加 |
| Door_Squeak.ogg          吱吱声 | 门开关时 开门 | 门后)
| Object_FloorCreak.ogg       | 走  家具移动)
| Photo_GlassShine.ogg | 窗户玻璃| 玻璃  窗户玻璃声
| FX_Drawer_Open.ogg | 抽屉开抽屉)
| FX_Drawer_Close.ogg  抽屉关)
| FX_Paper_Rustle.ogg    翻纸声 | )
| FX_Paper_翻书
| LightSwitch_Click.ogg      | 开关)
| LightBulb_Buzz_on.ogg        灯
| LightBulb_Pop.ogg         | 灯泡烧坏 ( )
| AmbientFootstep_Distant.ogg   | 远处) | 远处脚步声
| Ambient_Door_01~05.ogg     | 远处门关 |
|  Whisper.ogg           墙上)
| Knocks  敲击  [随机.ogg       敲击声 |  )
| Ambient_Sudden_DoorSlam.ogg  | 猛然 | 1.0f 吓一跳但 |

### 5.3  Audio Blueprint 蓝图

```

Audio Volume Reverb 合理参数：

**Reverb  设置：

|  | 室类型 | 空间大小 房间类型   声  反射  散  Diffusion|  密度 Air Absorption)
| Hall (小公寓 |  厅)
  3 小公寓 .5 |  卧室 | 0.3 | 0.6 | 0.5 | 0.0.7
|  室室 | 走廊 长5 | 0.7 | 0.2 | 0.8 | 0.2 | 0.9
|  浴室 瓷砖  0 5 |  6 | 0  2
| 地下室地下室 地下室0.8 | 0.2 | 0.9 | 0.1 | 0.6
| 衣柜 Closet 0.5 | 0.4 | 0.5 | 0.5 | 0.4
