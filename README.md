# 旧公寓谜案 / Old Apartment Mystery - BETA测试版项目说明

> 最后更新: 2026年6月9日

---

## 项目概述

**项目类型:** 第一人称氛围解谜探索游戏 (Atmospheric Exploration Puzzle)
**目标平台:** Windows / macOS / Linux
**引擎版本:** Unreal Engine 5.3
**发布状态:** BETA v0.1.0 (可发布测试版

**简介:**
你来到一栋1998年的老旧公寓，整理前租客们留下的种种线索，逐步还原事件的真相。惊吓克制，主要依靠环境叙事和音效营造悬疑氛围。

---

## 快速开始指南

### 1. 环境要求
- Unreal Engine 5.3
  → 安装 Visual Studio 2022 (C++桌面开发 C++工具链)
  → 8GB+ 内存
  → 固态硬盘 (推荐 ≥ 20 GB 硬盘

### 2. 项目初始化步骤
```bash步骤

1. 打开项目:
   - 双击 `OldApartmentMystery.uproject`
   如果Visual
   → 会提示"Missing OldApartmentMystery 模块"
   → 点击 "是 (Yes)" 来编译 (Rebuilt)
   → 等待 编译 完成后会自启动

2. 首次打开编辑器后:
   执行首次启动 打开编辑器后:
   1 1.
   a Editor Preferences →
      编辑器偏好设置:
         a Editor 偏好 → 完成

### 2. 构建 Cooking)
   a → 打开编辑器 → Project →
   3. →
   a 打开关卡 Maps/Levels/MainMenu.umap
   →
   测试:
   1 Play)
   2  测试关卡:
   →  关卡:  关卡关卡:
   3 Maps/Chapters/Chapter01.umap
   → Play In Editor (PIE模式

### 3. 蓝图创建 (快捷键

```

### 4. 菜单导航:
     

## 项目目录结构
```
OldApartmentMystery/
├── Config/                           → Engine配置
│   ├── DefaultEngine.ini              引擎渲染/碰撞/音频
│   ├── DefaultGame.ini                游戏设置 (分数参数/项目信息
│   └── DefaultInput.ini             键盘鼠标/手柄/触屏输入映射
│
├── Source/                            C++源代码
│   ├── OldApartmentMystery/           游戏模块
│   │   ├── OldApartmentMystery.Build.cs    Build配置
│   │   ├── OldApartmentMystery.h         模块入口
│   │   ├── OldApartmentMysteryGameMode.h/.cpp     GameMode/评分计算
│   │   ├── OldApartmentGameInstance.h/.cpp   GameInstance/存档/成就/排行榜
│   │   ├── OldApartmentSaveGame.h/.cpp    存档结构
│   │   ├── OldApartmentPlayerController.h/.cpp    PlayerController/交互FSM
│   │   ├── OldApartmentPlayerCharacter.h/.cpp    第一人称角色
│   │   ├── OldApartmentInteractable.h/.cpp   可交互物基类
│   │   └── OldApartmentEventSystem.h/.cpp 全局事件+环境系统
│   ├── OldApartmentMystery.Target.cs     游戏构建目标
│   └── OldApartmentMysteryEditor.Target.cs     编辑器构建目标
│
├── Content/                           游戏内容
│   ├── Blueprints/                       蓝图分层管理
│   │   ├── Core/                      GameMode, GameInstance, PlayerController, Character
│   │   ├── Gameplay/                 可交互物品, 家具
│   │   ├── UI/                       WBP控件蓝图
│   │   ├── Animation/             AnimBP / AnimController
│   │   ├── Puzzles/                  锁/机关/谜题
│   │   ├── SaveSystem/            存档菜单
│   │   ├── Events/                     事件监听器
│   │   └── Actors/                      门/开关/触发器
│   │
│   ├── Placeholders/                   美术占位资源 (独立目录
│   │   ├── Meshes/                    (Rooms/Furniture/Items
│   │   ├── Textures/                 UI/环境贴图
│   │   ├── Materials/                  材质
│   │   ├── Animations/                 动画
│   │   └── Sprites/                   贴图
│   │
│   ├── Audio/                         音频
│   │   ├── Ambient/                    环境音/背景音
│   │   ├── FX/                   交互/氛围音效
│   │   ├── UI/                    UI音效
│   │   ├── Music/                  背景音乐
│   │   └── Voice/                  配音
│   │
│   ├── UI/                         UI资源
│   │   ├── WBP/                     UMG控件蓝图
│   │   ├── Icons/                  UI图标资源
│   │   └── Fonts/                    字体
│   │
│   ├── Maps/                        关卡
│   │   ├── Levels/                 MainMenu 等全局关卡
│   │   └── Chapters/          章节关卡 (分章节
│   │
│   ├── DataAssets/                 DataAssets/                  Data Table 数据表
│   ├── Input/                     Input/
│   ├── Materials/                   Materials/
│   ├── Textures/                 生产Texture
│   ├── Meshes/                   生产Mesh
│   ├── Animations/                 生产动画
│   ├── Cinematics/                过场动画
│   └── Niagara/                  Niagara粒子
│
├── Saved/                      保存数据/运行
│   └── Config/              配置
│
├── Build/                       构建输出目录
│   ├── Windows/                 Windows
│   ├── Mac/                     macOS构建
│   └── Linux/                   Linux
│
├── Documentation/                    项目文档
│   └── Specs/                   设计规范
│   │   ├── CoreArchitecture.md              核心模块
│   │   ├── UISystem.md            UI系统
│   │   ├── RoomExploration.md       房间探索系统
│   │   ├── ItemSystem.md                物品笔记系统
│   │   ├── PuzzleAndChapters.md          谜题和章节
│   │   ├── SaveAndAchievements.md        存档成就
│   │   ├── EventsAndAudio.md              事件环境音
│   │   └── AnimationAndPlaceholders.md  动画+占位资源
│   │
│   └── Blueprints/                 (待定 - 蓝图编写蓝图参考文档
│
└── OldApartmentMystery.uproject          项目配置文件

---

## 玩法核心系统总览

###  核心玩法系统

| 系统名称         | 蓝图参考文档 | 核心类 / 组件
|----------------|----------|-------------|
| 房间探索         | RoomExploration.md | BP_RoomTrigger, BP_Door |
| 物品检查  | ItemSystem.md    | BP_ExamineViewer |
| 笔记本系统      | ItemSystem.md       | WBP_Notebook (4个Tab)
| 锁谜题      | PuzzleAndChapters.md | BP_Puzzle_DialLock |
| 章节     | PuzzleAndChapters.md | BP_ChapterManager |
| 存档      | SaveAndAchievements.md | UOldApartmentSaveGame |
| 成就      | SaveAndAchievements.md | 10+2 隐藏成就
| 排行榜/每日 | PuzzleAndChapters.md | 本地Top100 JSON存储| 每日挑战种子
| 事件       | EventsAndAudio.md | UOldApartmentEventSystem |
| 环境     | EventsAndAudio.md | BP_AudioDirector |
| UI         | UISystem.md      | WBP_系列 |

---

## 教程、暂停和设置页面

### 1  页面 教程, 暂停菜单, 设置均已进入可运行构建配置

### 控制映射 (全部在 DefaultInput.ini + C++已配置)

| 操作      | 键盘鼠标       | 手柄
|---------|------------|------
| 移动         | WASD / 方向键 | 左摇杆
| 视角         | 鼠标移动     | 右摇杆
| 交互     | E / Enter   | A键
| 检查     | F           | 左扳机
| 笔记本    | J / Tab     | 手柄  View
| 物品栏     | I           | 手柄  Menu 右
| 暂停菜单    | ESC / P   |  手柄 左
| 蹲下      | Ctrl / C   | B键
| 冲刺      | Shift     | X键
| 手电筒    | L / F     | Y键
| 快速存档    | Ctrl+S      | -
| 快速读档    | Ctrl+L      | -
| 确认     | ESC / Q   | B键 (返回

---

## 6. 构建和烹饪 (构建发布测试版)

### 构建配置文件已在 Target.cs + Build.cs 已配置。步骤1.

构建 (Shipping)
1. Project Launcher:
```

## 开发调试 (, Cooking, 打包:
   2. 菜单 Platforms → Windows / Mac / Linux:
1.  打包 → (Development
3. 构建:
     Build  →  Build  构建:
   1  项目 →
      , →  Maps:
   Release 项目 →, Cooking
2  Build 3 →
       构建 构建 (→
   项目 Settings
2  项目 Settings
    Build :
2 平台 构建设置
### 构建 →
  Build . → Packaging
   Build .uproject

## 7. 架构扩展指南 蓝图
 Build 架构分离 (架构
   1 开发:
→ 目录蓝图, (
   蓝图   蓝图,  →  引用 蓝图 (
    开发
```

###  扩展游戏设计的 蓝图  →  → Blueprintable) 蓝图  开发扩展:
1. 在项目蓝图:
```
扩展蓝图指南:
1  → 扩展:
```
1  2D  扩展资源
扩展内容蓝图 ( →  扩展3扩展 (生产

## 8  扩展蓝图: 扩展

### 蓝图  扩展开发的  →  扩展蓝图指南:
,

##  扩展内容蓝图扩展蓝图 扩展蓝图扩展:
    开发

###  开发蓝图 扩展蓝图. 扩展, 扩展蓝图:
  扩展内容蓝图 → 扩展 扩展蓝图 →.uproject 目录 → 蓝图蓝图  扩展蓝图蓝图 ( 扩展蓝图 →, → 扩展蓝图→蓝图扩展 →
  → ,  扩展, 
```

  , 蓝图, → 扩展蓝图 →,
```

### 10. 扩展 (扩展  , 扩展 扩展, 蓝图 扩展蓝图 →  扩展 → 扩展蓝图, 蓝图扩展蓝图蓝图→ 扩展蓝图
```
