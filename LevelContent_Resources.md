# 关卡内容配置与占位资源清单

---

## 一、故事背景与章节大纲

### 1.1 故事设定
> 玩家扮演一名「遗物整理师」，受雇整理一栋1980年代老公寓里去世租客的物品。
> 租客林女士独居三十年，未留下遗嘱。玩家需在三天内（三章节）整理完毕，
> 过程中逐步拼凑出她的人生，以及1998年那个雨夜她女儿失踪事件的真相。

**叙事基调**: 克制、忧郁、淡淡忧伤，无鬼怪，结局为"和解型"真相。

### 1.2 章节结构总览

| 章节 | 标题 | 场景 | 时间 | 核心玩法 | 预计时长 |
|-----|------|------|------|---------|---------|
| 第1章 | 尘封的客厅 | 玄关+客厅+餐厅+厨房入口 | 白天→黄昏 | 基础探索、拾取笔记、检查物品 | 15~20分钟 |
| 第2章 | 封闭的卧室 | 走廊+主卧室+卫生间+女儿房间 | 黄昏→夜晚 | 两个密码锁谜题、关键线索 | 20~30分钟 |
| 第3章 | 深夜的地下 | 厨房深处+地下室+后巷门 | 夜晚+暴雨 | 终级谜题、还原真相、结局 | 25~35分钟 |

---

## 二、第1章：尘封的客厅 — 详细配置

### 2.1 地图布局与占位
```
[玄关] ── [客厅(大)] ── [餐厅]
              │
              └── [厨房入口(可通第3章)]

占位模型(全部使用 UE Cube/Cylinder + 材质球):
  ├─ 玄关: ShoeRack(鞋架)、UmbrellaStand(伞桶)
  ├─ 客厅: Sofa(沙发)、CoffeeTable(茶几)、TVCabinet(电视柜)、
  │        Bookshelf(书架)、Window(窗户)、Curtain(窗帘)
  ├─ 餐厅: DiningTable(餐桌) × 4Chairs(椅子)、Sideboard(餐边柜)
  └─ 厨房入口: Fridge(冰箱占位)、DoorToBasement(通第3章门, 锁着)
```

### 2.2 物品清单 (DA_ItemData)

| ItemID | 显示名 | 可拾取 | 是否笔记 | 位置 | 前置条件 | 检查文本 |
|--------|--------|--------|---------|------|---------|---------|
| `ITEM_001` | 半旧的毛巾 | ✅ | ❌ | 玄关鞋架上 | 无 | "叠得很整齐，边角有磨毛..." |
| `ITEM_002` | 门口的日历 | ❌ | ❌ | 玄关墙上 | 无 | "1998年的日历，停在7月14日..." 【线索: 女儿失踪日期】 |
| `NOTE_001` | 雇佣信 | ❌ | ✅ | 茶几上 | 无 | 【笔记】雇主："请于7月14日上门整理..."（日期暗示） |
| `ITEM_003` | 旧照片 | ✅ | ❌ | 电视柜抽屉 | 无 | 【关键】一家三口合影，背面手写"小岚7岁生日 1991" |
| `ITEM_004` | 空茶罐 | ✅ | ❌ | 餐桌边柜 | 无 | "老茶罐，罐底有数字'7'字刻痕" |
| `NOTE_002` | 购物清单 | ❌ | ✅ | 冰箱上 | 无 | 【笔记】7月13日买的东西："面条、鸡蛋、牛奶、感冒药、电池..." |
| `ITEM_005` | 雨伞 | ✅ | ❌ | 伞桶中 | 无 | "黑色长柄伞，伞骨有一根断了" |
| `ITEM_006` | 客厅钥匙 | ✅ | ❌ | 书架第3层后面 | 无 | 【奖励】打开走廊门（通第2章） |

### 2.3 笔记内容 (DA_NoteData)

#### NOTE_001 雇佣信
> **标题**: 雇佣委托信  
> **日期**: 2026年7月10日  
> **情绪**: Neutral (米黄)
>
> 第1页：
> ```
> 遗物整理师 敬启：
>
> 家母林慧兰 于上月18日病逝，
> 生前独居建国南路二段37号5楼。
> 她未曾留下遗嘱，屋内物品烦请
> 于七日内整理完毕，有价值物品
> 请列出清单供家属认领。
>
> 付款将于验收完成后汇入户头。
>
> 委托人 陈志远 签章
> ```
> 关联谜题ID: `None`

#### NOTE_002 购物清单
> **标题**: 冰箱上的便签  
> **日期**: 无日期  
> **情绪**: Tense (灰黄)
>
> 第1页：
> ```
> 13日晚 要买：
> - 阳春面（一包不够）
> - 鸡蛋（要土鸡蛋）
> - 牛奶（全脂的小岚才喝）
> - 感冒药（那个蓝色盒的）
> - 4号电池×4（小岚的CD机）
>
> 明天雨大，记得带伞。
> 别留她一个人在家太久...
> ```
> 关联谜题ID: `PUZZLE_001` (暗示买电池给CD机)

### 2.4 章节目标 (Chapter Objectives)
| ObjectiveID | 描述 | 类型 | 检查值 | 必须? |
|-------------|------|------|--------|------|
| `OBJ_001` | 阅读茶几上的雇佣信 | ReadNote | `NOTE_001` | ✅ |
| `OBJ_002` | 检查电视柜抽屉里的照片 | ExamineItem | `ITEM_003` | ✅ |
| `OBJ_003` | 阅读冰箱上的购物清单 | ReadNote | `NOTE_002` | ✅ |
| `OBJ_004` | 在书架后找到走廊钥匙 | CollectItem | `ITEM_006` | ✅ |
| `OBJ_005` | 打开通往走廊的门 | EnterRoom | `ROOM_HALLWAY` | ✅ |
| `OBJ_006` | 收集至少 4 件物品 (可选) | CollectItem | * (计数4+) | ❌ |

---

## 三、第2章：封闭的卧室 — 详细配置

### 3.1 地图布局
```
[走廊] ── [主卧室]
   │         │
   └── [女儿房(锁)]  [卫生间]

占位模型:
  ├─ 走廊: 走廊照片墙×5相框、走廊地毯、衣帽钩
  ├─ 主卧室: QueenBed、Dresser(梳妆台)、Wardrobe(衣柜)
  │         NightStand(床头柜)、Desk(书桌)
  ├─ 女儿房: SingleBed、DeskWithCD、BookshelfSmall、ToyBox
  └─ 卫生间: Toilet、SinkWithMirror、Bathtub、MedicineCabinet
```

### 3.2 物品与谜题配置

| ItemID | 显示名 | 可拾取 | 位置 | 关联内容 |
|--------|--------|--------|------|---------|
| `ITEM_101` | 安眠药瓶 | ✅ | 卫生间药柜 | 瓶上写"每日一次，睡前服" |
| `NOTE_101` | 日记本·1998 | ✅ | 床头柜抽屉 | 【关键笔记】关联 PUZZLE_001 |
| `ITEM_102` | CD机 | ❌ | 女儿房书桌上 | 谜题 PUZZLE_001 载体 |
| `PUZZLE_001` | CD机密码锁 | 4位 | 女儿房书桌 | 密码: `1991` (照片上的生日) |
| `ITEM_103` | 日记本·2026 | ✅ | 解开PUZZLE_001后CD机内 | 【关键笔记】 |
| `ITEM_104` | 梳妆台抽屉钥匙 | ✅ | 衣柜大衣口袋 | 开梳妆台抽屉 |
| `PUZZLE_002` | 梳妆台抽屉锁 | 3位 | 主卧室梳妆台 | 密码: `714` (日历上的日期) |
| `NOTE_102` | 失踪报案记录 | ✅ | 解开PUZZLE_002后 | 【关键证据】 |
| `ITEM_105` | 地下室钥匙 | ✅ | 报案记录信封里 | 通第3章 |

### 3.3 谜题配置 (DA_LockPuzzleData)

#### PUZZLE_001 CD机密码锁
```yaml
PuzzleID: PUZZLE_001
LockType: DigitLock
DigitCount: 4
Password: [1, 9, 9, 1]
HintText: "小岚最爱的那张CD，应该是她生日那年买的..."
FailFeedback: "数字不对，CD机没有反应..."
RewardItemID: ITEM_103
UnlocksDoorID: None
OnSolveText: "CD机舱门缓缓打开，里面有一本薄薄的新本子..."
ShakeOnFailIntensity: 0.5
MaxAttempts: 4
```

#### PUZZLE_002 梳妆台抽屉锁
```yaml
PuzzleID: PUZZLE_002
LockType: DigitLock
DigitCount: 3
Password: [7, 1, 4]
HintText: "那是她永远记得的日子..."
FailFeedback: "锁纹丝不动。"
RewardItemID: None
UnlocksDoorID: None (仅开抽屉)
OnSolveText: "抽屉开了。一份泛黄的旧文件静静躺在里面..."
ShakeOnFailIntensity: 1.2
MaxAttempts: 3
```

### 3.4 关键笔记内容

#### NOTE_101 日记·1998
> **标题**: 林慧兰的日记本 (1998)  
> **日期**: 1998年7月  
> **情绪**: Somber (忧郁蓝灰)
>
> 第1页 (7月10日):
> ```
> 小岚说暑假想去海边。
> 我说好，等发了薪水就带她去。
> 她画了一张画给我，画里我们俩
> 站在沙滩上，太阳是粉色的。
> ```
>
> 第2页 (7月13日):
> ```
> 今晚要加班，她一个人在家。
> 留了字条让她先吃饭。
> 雨下得很大，心里总不踏实。
> 买了她爱喝的牛奶，明天回去给她。
> ```
>
> 第3页 (7月14日):
> ```
> 她不在了。
> 警察说监控里，她最后是往地铁站
> 方向走的，说要给我送伞。
>
> 地铁出口是14号口。
> 她总是记不住4号，总是走14号。
>
> 是我的错。
> 是我的错。
> 是我的错。
> ```
> 【线索】女儿走14号口，反复写"是我的错"。

#### NOTE_102 失踪报案记录
> **标题**: 警察局报案回执复印件  
> **日期**: 1998年7月15日  
> **情绪**: Urgent (紧急淡红)
>
> 第1页:
> ```
> 失踪人口报案登记表
> 姓名：林小岚        性别：女        年龄：14岁
> 最后出现地点：建国南路地铁站14号口外
> 最后出现时间：1998年7月13日 22:47
> 衣着特征：蓝色雨衣，雨靴（绿色）
> 携带物品：黑色长柄伞（一把伞骨折断）
>
> 备注：当日暴雨，监控模糊。
>       案件编号：7814-B-1998
> ```
> 关联: 雨伞 ITEM_005 与长柄伞描述一致。
> 【证据级别】关键证据

---

## 四、第3章：深夜的地下 — 详细配置

### 4.1 地图布局
```
[厨房] ── [储物间]
   │
   └── [地下室楼梯] ── [地下室(大)] ── [后巷门(结局)]

占位模型:
  ├─ 厨房: KitchenCabinets、Stove、Sink、KitchenTable
  ├─ 储物间: ShelvingUnit、Boxes×8、OldWasher
  ├─ 地下室: ConcreteFloor、WaterPuddle、Pipes、
  │          OldTrunk(旧箱子, PUZZLE_003)、FuseBox
  └─ 后巷门: MetalDoor (结局触发点)
```

### 4.2 终局谜题 PUZZLE_003
```yaml
PuzzleID: PUZZLE_003
LockType: DigitLock
DigitCount: 6
Password: [7, 8, 1, 4, 9, 8]      # 案件编号 7814-B-1998 → 781498
HintText: "旧箱子上贴着编号，她说是'事件的生日'..."
FailFeedback: "箱盖沉重，纹丝不动。"
RewardItemID: ITEM_201 (女儿的雨衣)
UnlocksDoorID: DOOR_BACKALLEY
OnSolveText: >
  箱子开了。里面叠得整整齐齐的蓝色雨衣，
  旁边压着一幅粉色太阳的画。
  画背后写着："妈妈，我没有迷路。
  我只是走得太远了，你要好好吃饭。"
ShakeOnFailIntensity: 1.5
MaxAttempts: 5
```

### 4.3 结局触发条件
```
必须完成 (全部为第3章必选目标):
  ✅ 打开地下室 (使用 ITEM_105 钥匙)
  ✅ 收集 雨衣 (ITEM_201)
  ✅ 阅读 粉色太阳画背面文字 (NOTE_201)
  ✅ 打开后巷门 (DOOR_BACKALLEY)
  ✅ 走出后巷门 → 触发结局过场动画
```

---

## 五、资源预加载清单 (按关卡)

### 5.1 第1章预加载资源
```yaml
Level: Apartment_Level1
PreloadList:
  - /Game/Maps/Apartment_Level1          # 关卡自身
  - /Game/Blueprints/Environment/*       # 环境蓝图
  - /Game/Blueprints/Puzzle/*            # 谜题蓝图
  - /Game/Data/Items/Chapter1/*          # 物品数据资产
  - /Game/Data/Notes/Chapter1/*          # 笔记数据资产
  - /Game/Data/Puzzles/PUZZLE_NONE.uasset# 第1章无谜题(仅钥匙门)
  - /Game/Audio/Ambient/Ambient_Lobby_Day.wav
  - /Game/Audio/SFX/Environment/Env_DoorCreak.wav
  - /Game/Audio/SFX/Environment/Env_Drip.wav
  - /Game/Audio/SFX/Interaction/*        # 全部交互音效
  - /Game/Audio/SFX/UI/*                 # 全部UI音效
  - /Game/UI/Icons/Chapter1/*            # 物品图标
  - /Game/Blueprints/UI/WB_MainHUD.uasset
  - /Game/Blueprints/UI/WB_Notebook.uasset
  - /Game/Blueprints/UI/WB_ExamineItem.uasset
```

### 5.2 第2章预加载资源 (在第1章结局时开始后台加载)
```yaml
Level: Apartment_Level2
PreloadList:
  - /Game/Maps/Apartment_Level2
  - /Game/Data/Items/Chapter2/*
  - /Game/Data/Notes/Chapter2/*
  - /Game/Data/Puzzles/PUZZLE_001.uasset
  - /Game/Data/Puzzles/PUZZLE_002.uasset
  - /Game/Blueprints/UI/WB_LockPuzzle.uasset
  - /Game/Audio/Ambient/Ambient_Apt_Night.wav
  - /Game/Audio/SFX/Puzzle/*             # 谜题音效
  - /Game/UI/Icons/Chapter2/*
```

### 5.3 第3章预加载资源
```yaml
Level: Apartment_Level3
PreloadList:
  - /Game/Maps/Apartment_Level3
  - /Game/Data/Items/Chapter3/*
  - /Game/Data/Notes/Chapter3/*
  - /Game/Data/Puzzles/PUZZLE_003.uasset
  - /Game/Audio/Ambient/Ambient_Rain_Heavy.wav
  - /Game/Audio/Ambient/Ambient_Thunder_Rumble.wav
  - /Game/Blueprints/UI/WB_ChapterComplete.uasset
```

---

## 六、占位模型与材质对照表 (快速原型)

> 目标：不找美术资源，纯用 UE 内置几何体 + 简单参数化材质体现节奏和手感。

| 占位对象 | 蓝图父类 | 几何形状 | 基础材质颜色 | 尺寸 (近似) |
|---------|---------|---------|------------|------------|
| 沙发 Sofa | Actor | 1×大Box + 2×小Box(扶手) | 深棕 #5C3A21 | 220×90×80cm |
| 茶几 CoffeeTable | Interactable | Box (薄) | 深木色 #4A3828 | 120×60×45cm |
| 电视柜 TVCabinet | Interactable | Box | 胡桃木 #6B4423 | 180×45×60cm |
| 书架 Bookshelf | Interactable | Box + 内部分割线 | 浅木色 #C4A484 | 120×30×200cm |
| 床 Bed | Actor | 大Box + 薄Box(床垫) | 米色 F5F5DC | 200×160×60cm |
| 梳妆台 Dresser | Interactable | Box | 白色 #F0E6D2 | 120×50×75cm |
| 冰箱 Fridge | Actor | 高Box | 银色 #E0E0E0 | 70×70×180cm |
| 门 Door | BP_Door | 薄Box + 门框 | 棕色 #8B5A2B | 90×3×210cm |
| 锁 LockMesh | BP_LockPuzzle | Cylinder + Cube 把手 | 黄铜色 #CD9B1D | Ø=8cm |
| 笔记 NoteItem | BP_NoteItem | 极薄扁平Box | 米黄 #F5E6C8 | 15×21×0.5cm |
| 照片 Photo | Interactable | 薄Box + 相框Cube | 银色 #C0C0C0 | 20×15×2cm |
| 雨伞 Umbrella | Interactable | Cylinder(收起的伞) | 黑色 #1A1A1A | Ø=4×70cm |
| 钥匙 Key | Interactable | 小Torus + Box(齿) | 黄铜色 #CD9B1D | 5×2×0.5cm |
| 旧箱子 Trunk | Interactable + Puzzle | 大Box | 深棕 #3E2A14 | 90×50×40cm |
| 雨衣 Raincoat | Item (拾取后隐藏) | 扁平Box | 蓝色 #4A90D9 | 40×50×2cm |

---

## 七、章节节奏节奏与节拍图 (节奏控制)

### 7.1 第1章节奏曲线图 (纵轴: 情绪紧张度 0~10)
```
  10 │
   9 │
   8 │                                               ▲
   7 │                                          ╱╲
   6 │                                     ╱╲
   5 │                               ╱╲
   4 │                         ╱╲
   3 │                   ╱╲
   2 │             ╱╲
   1 │       ╱╲
   0 │─────╱───╲──────────────────────────────────────────
     进门   看   读雇佣信  找照片   读清单  找钥匙  开门去第2章
            日历
     (0分)  (2分)  (4分)    (7分)   (11分)  (14分)  (17分)
```

### 7.2 氛围音景变化节拍
| 游戏进度 | 时间点 | 氛围变化 | 微刺激 |
|---------|--------|---------|--------|
| 进门 | 0:00 | Ambient从0淡入到0.8 | 3秒后: 远处门轻微吱呀 |
| 读雇佣信 | 4:00 | 音量降0.6, 加入低频嗡鸣 | — |
| 看到照片(背面) | 7:30 | 低频 +3dB | 走廊方向极轻脚步(若静止) |
| 读购物清单 | 11:00 | 雨声增强 | — |
| 找到钥匙 | 14:00 | 短暂亮音(目标完成) | — |
| 开门去第2章 | 17:00 | 全音景Fade Out | 开门吱呀 + 切换第2章环境 |

---

## 八、过关结算数据展示 (示例)

```
示例: 第1章完成结算
┌─────────────────────────────────┐
│         第 1 章 完成            │
│      尘封的客厅                  │
├─────────────────────────────────┤
│  用时             00:17:42      │
│  收集物品         6 / 7         │  ← 缺毛巾(漏拿)
│  阅读笔记         2 / 2         │
│  解开谜题         0 / 0         │  ← 本章无锁谜题
│  失败次数         0 次          │
│  完成度           88%           │
├─────────────────────────────────┤
│  ★ 已解锁: 第2章 · 封闭的卧室   │
└─────────────────────────────────┘
     [重玩]  [继续下一章]  [主菜单]
```
