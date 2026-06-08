# 音效系统架构与环境叙事音效设计

---

## 一、BP_AudioManager (音频管理器)

### 1.1 变量
| 变量名 | 类型 | 说明 |
|--------|------|------|
| MasterVolume | float | 1.0 | 主音量 |
| SFXVolume | float | 1.0 | 音效音量 |
| AmbientVolume | float | 0.8 | 环境音音量 |
| UIVolume | float | 1.0 | UI音量 |
| CurrentAmbient | USoundBase* | 当前播放的环境音 |
| AmbientAudioComponent | UAudioComponent* | 环境音播放组件 |
| SFXCache | TMap<FName, USoundBase*> | 音效名称→资源映射 |
| PlayingSFXComponents | TArray<UAudioComponent*> | 正在播放的音效组件 |

### 1.2 DA_SFXData (音效数据资产)
**结构 TMap<FName, FSFXEntry>**

| SFXKey (FName) | 资源路径占位 | 说明 | 音量 | 分类 |
|---------------|-------------|------|------|------|
| UI_Click | `/Game/Audio/SFX/UI/UI_Click.wav` | 按钮点击 | 0.8 | UI |
| UI_Hover | `/Game/Audio/SFX/UI/UI_Hover.wav` | 按钮悬停 | 0.4 | UI |
| UI_WidgetOpen | `/Game/Audio/SFX/UI/UI_Widget_Open.wav` | 界面打开 | 0.7 | UI |
| UI_WidgetClose | `/Game/Audio/SFX/UI/UI_Widget_Close.wav` | 界面关闭 | 0.6 | UI |
| UI_PageFlip | `/Game/Audio/SFX/UI/UI_PageFlip.wav` | 翻页声 | 0.8 | UI |
| UI_Interact | `/Game/Audio/SFX/UI/UI_Interact_Confirm.wav` | 交互确认 | 0.7 | UI |
| UI_SaveComplete | `/Game/Audio/SFX/UI/UI_SaveComplete.wav` | 保存完成 | 0.8 | UI |
| UI_LoadComplete | `/Game/Audio/SFX/UI/UI_LoadComplete.wav` | 读取完成 | 0.8 | UI |
| UI_Typewriter | `/Game/Audio/SFX/UI/UI_Typewriter_Key.wav` | 打字机键声 | 0.3 | UI |
| UI_ObjectiveComplete | `/Game/Audio/SFX/UI/UI_ObjectiveComplete.wav` | 目标完成 | 0.9 | UI |
| UI_ChapterTitle | `/Game/Audio/SFX/UI/UI_ChapterTitle_Bell.wav` | 章节标题钟声 | 0.7 | UI |
| UI_ChapterComplete | `/Game/Audio/SFX/UI/UI_ChapterComplete.wav` | 章节完成 | 1.0 | UI |
| Int_Pickup | `/Game/Audio/SFX/Interaction/Int_Pickup_Item.wav` | 拾取物品 | 0.8 | 交互 |
| Int_NoteOpen | `/Game/Audio/SFX/Interaction/Int_Note_Open.wav` | 打开笔记 | 0.8 | 交互 |
| Int_Examine_Rotate | `/Game/Audio/SFX/Interaction/Int_Examine_Squeak.wav` | 检查物品旋转 | 0.4 | 交互 |
| Puzzle_DigitClick | `/Game/Audio/SFX/Puzzle/Puzzle_Digit_Click.wav` | 数字点击 | 0.8 | 谜题 |
| Puzzle_Clear | `/Game/Audio/SFX/Puzzle/Puzzle_Clear.wav` | 清除输入 | 0.6 | 谜题 |
| Puzzle_Solve | `/Game/Audio/SFX/Puzzle/Puzzle_Solve.wav` | 解谜成功 | 1.0 | 谜题 |
| Puzzle_Fail | `/Game/Audio/SFX/Puzzle/Puzzle_Fail_Buzz.wav` | 解谜失败 | 0.7 | 谜题 |
| Puzzle_Lock | `/Game/Audio/SFX/Puzzle/Puzzle_Lock_Shake.wav` | 锁晃动 | 0.5 | 谜题 |
| Env_DoorCreak | `/Game/Audio/SFX/Environment/Env_Door_Creak_Open.wav` | 开门吱呀 | 0.8 | 环境 |
| Env_DoorShut | `/Game/Audio/SFX/Environment/Env_Door_Shut_Close.wav` | 关门声 | 0.9 | 环境 |
| Env_Footstep_Wood | `/Game/Audio/SFX/Environment/Env_Footstep_Wood1.wav` | 木地板脚步 | 0.3 | 环境 |
| Env_Footstep_Wood2 | `/Game/Audio/SFX/Environment/Env_Footstep_Wood2.wav` | 木地板脚步变体 | 0.3 | 环境 |
| Env_Floor_Squeak | `/Game/Audio/SFX/Environment/Env_Floor_Squeak.wav` | 地板吱呀 | 0.5 | 环境 |
| Env_Window_Rattle | `/Game/Audio/SFX/Environment/Env_Window_Rattle.wav` | 窗户震颤 | 0.4 | 环境 |
| Env_Drip | `/Game/Audio/SFX/Environment/Env_Drip_Faucet.wav` | 水龙头滴水 | 0.5 | 环境 |
| Env_Wind_Howl | `/Game/Audio/SFX/Environment/Env_Wind_Howl.wav` | 风啸声 | 0.3 | 环境 |
| Ambient_Apartment_Lobby | `/Game/Audio/Ambient/Ambient_Lobby_Day.wav` | 公寓大厅白天 | 0.6 | 环境音 |
| Ambient_Apartment_Night | `/Game/Audio/Ambient/Ambient_Apt_Night.wav` | 公寓夜晚氛围 | 0.5 | 环境音 |
| Ambient_Rain_Heavy | `/Game/Audio/Ambient/Ambient_Rain_Heavy.wav` | 大雨声 | 0.4 | 环境音 |
| Ambient_Thunder_Rumble | `/Game/Audio/Ambient/Ambient_Thunder_Rumble.wav` | 雷声隆隆 | 0.3 | 环境音 |
| Ambient_Old_Building | `/Game/Audio/Ambient/Ambient_OldBuilding_Hum.wav` | 老建筑嗡鸣 | 0.25 | 环境音 |

### 1.3 核心函数

#### 播放音效 (2D)
```
Function PlaySFX(FName SFXKey, float VolumeMultiplier = 1.0):
  ├─ If !SFXCache.Contains(SFXKey):
  │    Log Warning: "SFX Not Found: " + SFXKey
  │    Return
  ├─ Sound = SFXCache[SFXKey]
  ├─ Category = GetSFXCategory(SFXKey)
  │    (UI → UIVolume, 谜题/交互 → SFXVolume, 环境→AmbientVolume)
  ├─ FinalVolume = MasterVolume * CategoryVolume * VolumeMultiplier
  ├─ AudioComponent = PlaySound2D(Sound, FinalVolume)
  ├─ PlayingSFXComponents.Add(AudioComponent)
  └─ AudioComponent -> OnAudioFinished → Remove from PlayingSFXComponents
```

#### 播放音效 (3D位置)
```
Function PlaySFXAtLocation(FName SFXKey, FVector Location,
                           float VolumeMultiplier = 1.0,
                           float AttenuationRadius = 500.0):
  ├─ Sound = SFXCache[SFXKey]
  ├─ FinalVolume = MasterVolume * SFXVolume * VolumeMultiplier
  └─ PlaySoundAtLocation(Sound, Location, FinalVolume, AttenuationRadius)
```

#### 设置环境音（带淡入淡出）
```
Function SetAmbient(USoundBase* NewAmbient, float FadeDuration = 1.5s):
  ├─ If NewAmbient == CurrentAmbient → Return
  ├─ If CurrentAmbient != null:
  │    AmbientAudioComponent -> FadeOut(FadeDuration, 0)
  │    Delayed(FadeDuration) → Stop AmbientAudioComponent
  ├─ If NewAmbient != null:
  │    AmbientAudioComponent -> SetSound(NewAmbient)
  │    AmbientAudioComponent -> FadeIn(
  │         FadeDuration, MasterVolume * AmbientVolume)
  │    CurrentAmbient = NewAmbient
  └─
```

#### 播放一次性叙事音效（带空间感）
```
Function PlayNarrativeStinger(FName StingerKey, FVector Location,
                              float DelaySeconds = 0):
  ├─ Delayed(DelaySeconds) →
  │    PlaySFXAtLocation(StingerKey, Location, 1.0, 1000.0)
  │    (如"远处门关上"、"小孩笑声"、"脚步上楼"等)
  └─
```

---

## 二、克制型惊吓音效设计（惊吓原则）

### 2.1 惊吓分级（严格遵守 Level 0-1，禁止 Level 2+）

| 惊吓级别 | 描述 | 示例 | 是否允许 |
|---------|------|------|---------|
| **Level 0** | 纯氛围暗示，无即时刺激 | 远处雷声、风声、低沉嗡鸣 | ✅ 大量使用 |
| **Level 1** | 轻微意外但不刺耳 | 地板吱呀、门轻晃、物品微响 | ✅ 适量使用 |
| **Level 2** | 明显突然刺激 | Jump Scare 大音量音效 | ❌ 禁止 |
| **Level 3** | 高频刺耳/视觉恐怖 | 尖叫声、扭曲视觉 | ❌ 禁止 |

### 2.2 Level 0 氛围音景设计 (各章节)

#### 第1章 · 尘封的客厅 (白天 → 黄昏)
```
基础层 (持续):
  ├─ Ambient_Old_Building - 老建筑低频嗡鸣
  └─ 极微弱 Ambient_Rain_Heavy (远处)

触发层 (按时间/位置随机):
  ├─ Env_Wind_Howl (轻) - 每 30~60秒随机
  ├─ Env_Window_Rattle - 风大时触发
  └─ Env_Drip - 厨房方向间隔 15~25秒
```

#### 第2章 · 旧卧室 (黄昏 → 夜晚)
```
基础层 (持续):
  ├─ Ambient_Apartment_Night - 夜晚公寓氛围
  └─ Ambient_Thunder_Rumble (低频)

触发层 (随调查深入增加频率):
  ├─ Env_Floor_Squeak - 走廊方向, 玩家静止时触发
  ├─ Env_DoorCreak (很轻) - 远处门似开非开
  └─ "影子音效"(Level 1 临界): 极轻布料摩擦声 (仅耳机可辨)
```

#### 第3章 · 厨房与地下室 (夜晚 → 暴雨)
```
基础层 (持续):
  ├─ Ambient_Rain_Heavy (增强)
  └─ Ambient_Old_Building

触发层:
  ├─ Env_Drip - 地下室水管, 节奏性
  ├─ Env_Window_Rattle - 强风时
  └─ Ambient_Thunder_Rumble - 配合画面闪电 (白闪1帧)
```

### 2.3 Level 1 微刺激触发条件 (严格限定)
```
微刺激触发表 (每个最多1次/章节):
  触发条件                     | 音效
  ─────────────────────────────────────────────
  第一次进入公寓大门后3秒      | Env_DoorCreak (来自身后, 轻微)
  拾取第一张笔记后             | Env_Floor_Squeak (走廊方向)
  解开第一个谜题后             | 远处 Env_DoorShut (低音量)
  玩家静止超过45秒             | 极轻脚步上楼声 (来源模糊)
  打开地下室门后               | Ambient_Wind_Howl (增强一阵)
```

---

## 三、脚步声与材质映射表

### 3.1 材质 → 脚步声数组
| 物理材质 | 音效数组 | 间隔 |
|---------|---------|------|
| PM_WoodFloor | [Env_Footstep_Wood, Env_Footstep_Wood2, Env_Floor_Squeak(低概率)] | 0.5s |
| PM_Carpet | [Env_Footstep_Carpet1, Env_Footstep_Carpet2] | 0.45s |
| PM_Concrete | [Env_Footstep_Concrete1, Env_Footstep_Concrete2] | 0.55s |
| PM_Stairs | [Env_Footstep_Stair1, Env_Footstep_Stair2, Env_Floor_Squeak] | 0.5s |

### 3.2 脚步声蓝图逻辑
```
在 BP_PlayerCharacter -> CharacterMovement:
  Event Landed (落地):
    ├─ Trace Down (脚部→地面) → HitResult
    ├─ PhysMat = HitResult.PhysMaterial
    ├─ Pick Random from SoundArray[PhysMat] → Sound
    └─ PlaySoundAtLocation(Sound, HitLocation, 0.3 * Volume)
```

---

## 四、UI音效触发绑定表

| 交互事件 | 绑定音效 | 延迟 |
|---------|---------|------|
| Button OnHovered | UI_Hover | 0s |
| Button OnClicked | UI_Click | 0s |
| Widget Constructed | UI_WidgetOpen | 0s |
| Widget Destruct | UI_WidgetClose | 0s |
| ListView Selection Changed | UI_Click (0.6 Vol) | 0s |
| Slider Value Change (Tick) | UI_Hover (0.2 Vol, 限频) | 每0.1s最多1次 |
| Checkbox Checked/Unchecked | UI_Click (0.7 Vol) | 0s |
| Toast Slide In | UI_Hover (0.8 Vol) | 0s |
| Objective Complete Pop | UI_ObjectiveComplete | 0s |

---

## 五、音频混合层 (Audio Mixer Snapshot)

| Snapshot 名称 | 触发场景 | 效果 |
|--------------|---------|------|
| Default | 正常探索 | 全频段正常 |
| UI_Open | 打开任意UI | 低通滤波 环境音 (-3dB, 1kHz Cutoff) |
| Puzzle_Mode | 解谜中 | 环境音 (-6dB), SFX (+1dB) |
| Examine_Mode | 检查物品 | 低通 全部 (-2dB, 2kHz) |
| Chapter_Transition | 章节切换 | 全部 Fade Out→In (2s) |
| Fear_Mild | 发现关键证据 | 60Hz 低频音 (+4dB), 高频减 |
