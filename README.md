# 旧公寓谜案 / Old Apartment Mystery - BETA 测试版项目说明

> 引擎版本: Unreal Engine 5.3  
> 构建状态: 已修复 C++ 编译阻塞 → 支持一键生成蓝图/关卡/UI资产  
> 最新更新: 修复了 Build.cs 语法错误、ACH_* 宏未定义、DefaultEngine.ini 资产路径、CastChecked 空指针保护等关键问题  

---

## ⚡ 快速启动 (3 步进入游戏)

### 第 1 步：双击打开项目 & 编译 C++

1. **双击** `OldApartmentMystery.uproject`
2. 若 UE 提示 "**Missing OldApartmentMystery modules — would you like to rebuild them?**"  
   → 点击 **是 (Yes)**，等待 C++ 编译完成（通常 1~3 分钟）
3. 项目自动启动后，Editor Startup Map 会临时使用 `Template_Default`（此为预期行为，第 3 步后会自动替换为主菜单）

---

### 第 2 步：运行 Python 脚本一键生成全部资产

> 脚本位置：`Content/Python/auto_generate_assets.py`

**操作步骤：**
1. 菜单栏选择 **Window** → **Python** → **Execute Python Script...**
2. 浏览选择本项目下的：  
   `Content/Python/auto_generate_assets.py`
3. 观察 **Output Log**（Window → Developer Tools → Output Log），应依次出现：
   ```
   [1/8] Creating Content folders...
   [2/8] Creating Levels (umap files)...
   [3/8] Creating Core Blueprints...
   [4/8] Creating UI Widget Blueprints (WBP_*)...
   [5/8] Creating Enhanced Input Assets...
   [6/8] Creating DataAsset placeholders...
   [7/8] Configuring MainMenu Level...
   [8/8] Configuring Chapter01 Level with playable test actors...
   DONE! All assets generated successfully!
   ```
4. 脚本执行完成后，按提示**重启一次编辑器**（确保新蓝图类正确注册）

---

### 第 3 步：Play 测试 (PIE)

重启编辑器后，Startup Map 会自动切换为：

| 关卡名称 | 路径 | 内容 |
|---------|------|------|
| **MainMenu.umap** | `/Game/Maps/Levels/MainMenu` | 主菜单（默认启动） |
| **Chapter01_Apt101.umap** | `/Game/Maps/Levels/Chapter01_Apt101` | **完整玩法测试关**（推荐直接打开此关 PIE） |

**推荐直接测试流程：**
1. 在 Content Browser 打开 `/Game/Maps/Levels/Chapter01_Apt101`
2. 点击工具栏 **Play** → Play In Editor (PIE)
3. 即会进入可运行的旧公寓房间内，体验：
   - ✅ **房间探索**：WASD 移动，鼠标视角环视
   - ✅ **物品检查**：F 键 3D 检查交互物
   - ✅ **E 交互**：点击书桌/床铺/书架/墙上照片
   - ✅ **线索收集**：书桌上的信件、枕头下的旧照片、书架上的收据（3 条线索）
   - ✅ **拨号锁谜题**：位于房间右侧墙上（4 位密码，默认答案：**0817**）
   - ✅ **房间触发器**：4 个 BoxTrigger 分别标记客厅/床区/书房/入口
   - ✅ **笔记本 UI**：Tab 键打开 WBP_Notebook_Main
   - ✅ **暂停菜单**：Esc 键呼出 WBP_PauseMenu（设置/存档/章节结算）

---

## 🎮 默认输入映射

| 动作 | 键鼠 | 手柄 | 触屏 |
|-----|------|-----|-----|
| 移动 | **WASD** | Left Stick | 虚拟摇杆 |
| 视角 | **鼠标移动** | Right Stick | 滑动屏幕 |
| 交互 | **E** | Gamepad Face Button Down | 点击高亮 |
| 3D 检查 | **F** | Gamepad Face Button Right | 双指点击 |
| 笔记本 | **Tab** | Gamepad Left Shoulder | 顶栏图标 |
| 暂停/返回 | **Esc** | Gamepad Special Left | 顶栏图标 |
| 蹲伏 | **C** / Left Ctrl | Gamepad Face Button Up | — |
| 冲刺 | **Shift**（按住） | Left Stick Push | — |
| 手电筒 | **T** | Gamepad Face Button Left | HUD 图标 |
| 跳跃 | **Space** | Gamepad Face Button Down | — |

---

## ✅ 已修复的阻塞问题清单

| 原问题 | 修复方式 |
|-------|---------|
| **Build.cs 语法错误**（L48-55 裸大括号+乱码注释） | 删除了无效的条件块，ModularGameplayActors 改为条件可选依赖 |
| **ACH_* 标识符未定义**（10 个成就宏直接使用） | 全部改为 `FName(TEXT("ACH_FirstStep"))` 字面量构造 |
| **DefaultEngine.ini 指向不存在蓝图**（5 处） | 临时切换为 C++ 原生类 `/Script/OldApartmentMystery.xxx`；Python 脚本生成完成后自动替换回蓝图路径 |
| **CastChecked\<UEnhancedInputComponent\>** 崩溃风险 | 改为 `Cast<>` + 每个 IA_* 判空，缺失时跳过绑定不崩溃 |
| **AOldApartmentInteractable::Interact()** 未调用 | HandleInteract 先 Cast\<Interactable\>，直接调用 `Interact(GetPawn())`，避免走 TakeDamage 分支 |
| **FindAndAddChecked** 越界风险 | 改为 `Find() + Add()` 安全判断分支 |
| **PlayerController 引用 WBP_* 蓝图类名**（C++ 侧不识别） | 前向声明统一改为 `class UUserWidget`，类型均改成 `UUserWidget*` |
| **OldApartmentHUD / DA_ChapterData / DA_ClueItemData 未定义** | 新建对应 C++ 骨架类，蓝图基类可正常继承 |
| **FClueRecord 与 ToClueRecord() 字段不匹配** | SaveGame.h 补齐 `RoomId/TenantName/bDiscovered` 字段，转换函数同步修正 |

---

## 🏗️ 项目目录结构

```
OldApartmentMystery/
├── Config/                          ← Engine 配置
│   ├── DefaultEngine.ini             渲染/碰撞/GameMode 注册
│   ├── DefaultGame.ini               评分参数: MaxScorePerChapter=1000, 失误惩罚50
│   └── DefaultInput.ini              键鼠/手柄/触屏 Action 映射
│
├── Source/                          ← C++ 源代码
│   ├── OldApartmentMystery/          ★ 游戏核心模块
│   │   ├── OldApartmentMystery.Build.cs     构建配置（已修复）
│   │   ├── OldApartmentGameInstance.h/.cpp  存档/成就/排行榜
│   │   ├── OldApartmentMysteryGameMode      评分算法 / Rank 判定
│   │   ├── OldApartmentSaveGame.h           持久化数据结构
│   │   ├── OldApartmentPlayerController     6 态交互 FSM
│   │   ├── OldApartmentPlayerCharacter      第一人称角色+手电/脚步声
│   │   ├── OldApartmentInteractable         8 类可交互物基类
│   │   ├── OldApartmentHUD                  HUD 统一管理
│   │   ├── OldApartmentClueDataAsset        线索 DataAsset 类
│   │   ├── OldApartmentChapterDataAsset     章节 DataAsset 类
│   │   └── OldApartmentEventSystem          事件总线 + 环境系统
│   ├── OldApartmentMystery.Target.cs
│   └── OldApartmentMysteryEditor.Target.cs
│
├── Content/                         ← 游戏内容（运行 Python 脚本后自动生成）
│   ├── Python/
│   │   └── auto_generate_assets.py  ★ 资产生成脚本（第 2 步执行）
│   ├── Maps/Levels/                 MainMenu / Chapter00 / Chapter01
│   ├── Maps/Rooms/                  RM_Lobby / RM_Corridor_1F 等房间子关卡
│   ├── Blueprints/Core/             BP_GameMode / BP_GameInstance / BP_Player*
│   ├── Blueprints/Interactables/    BP_ClueItem / BP_Door / BP_Drawer / ...
│   ├── Blueprints/Puzzles/          BP_Puzzle_DialLock4 / ...
│   ├── Blueprints/UI/               WBP_MainMenu / WBP_HUD / WBP_Pause / ...
│   ├── Input/                       IMC_Default + 12 个 IA_*
│   └── Data/Chapters+Clues/         DA_Chapter01 / DA_Clue_*
│
├── Documentation/Specs/             9 份架构设计文档
└── OldApartmentMystery.uproject     项目入口 (UE5.3)
```

---

## 🧪 测试版内容范围 (v0.1.0-BETA)

### ✅ 已实现 / 可运行

| 模块 | 可运行内容 |
|-----|---------|
| **房间探索** | 第一章完整 101 号公寓（12m×16m 占位房间+5 件家具+4 个区域触发器） |
| **物品检查** | `F` 键进入 Examine 模式，可旋转/缩放/Hotspot 检查 |
| **笔记系统** | `Tab` 打开 4 Tab 笔记本：线索/手记/关联/地图 |
| **锁谜题** | 4 位拨号锁 `PUZZLE_DialLock4`（默认密码 0817，来源于线索日期） |
| **章节结算** | 分数=线索比×1000 + 时间奖励 + 完美奖励 - 失误×50；S+ 到 E 共 9 级 Rank |
| **教程页面** | WBP_TutorialOverlay + WBP_TutorialPage 15 条触发式指引 |
| **暂停菜单** | Esc 呼出：继续/存档/读档/设置/返回主菜单 |
| **设置页面** | 四 Tab：音频/视频/控制/玩法 |
| **存档系统** | 10 槽位（2 自动+1 快存+7 手动），本地 JSON 排行榜 |
| **成就系统** | 10 项成就（含 2 项隐藏），完成自动解锁画廊内容 |
| **每日挑战** | 以 `YYYYMMDD_OldApartment` 为种子生成 7 种修饰符组合 |

### 🚧 美术占位说明
- 所有模型使用 `/Engine/BasicShapes/` 自带的 Cube/Plane 占位
- 材质使用 `WorldGridMaterial` 引擎灰色网格
- 正式美术资源替换时，只需在 Blueprint 内替换 StaticMesh/Material 引用即可，逻辑无需改动

---

## 📦 打包发布流程

```bash
# 1. 先在编辑器完成上述 1~3 步验证 PIE 无误

# 2. 菜单 Platforms → Windows → Shipping → Cook
#    （或 macOS / Linux，三平台均在 .uproject 中启用）

# 3. Project Launcher 使用 Release Build Profile，包含：
#    - Maps: MainMenu + Chapter00_Tutorial + Chapter01_Apt101 + RM_* 子关卡
#    - GameMode: /Game/Blueprints/Core/BP_GameMode
#    - 已启用 ModularGameplayActors / CommonUI 插件
```

---

## 📚 完整设计文档索引

| 文档 | 关键内容 |
|-----|---------|
| [CoreArchitecture.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/CoreArchitecture.md) | 6 态 FSM 交互表 / GameplayTag 事件总线 / 关卡流送规范 |
| [UISystem.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/UISystem.md) | 11 层 Z-Order / 23 个 WBP 组件树 / 37 个 UI 图标清单 |
| [RoomExploration.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/RoomExploration.md) | 3 层 8 房间布局 / Tension 灯光曲线 / 6 种房间混响参数 |
| [ItemSystem.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/ItemSystem.md) | 7 类 Clue Tag / BP_ExamineViewer Hotspot 逻辑 / 线索关联拖拽判定 |
| [PuzzleAndChapters.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/PuzzleAndChapters.md) | 5 种谜题蓝图结构 / 5 章规划 / DA_Chapter 字段定义 |
| [SaveAndAchievements.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/SaveAndAchievements.md) | 10 成就完整说明 / 6 个自动保存触发点 / 画廊解锁分级 |
| [EventsAndAudio.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/EventsAndAudio.md) | NO JUMPSCARES 四原则 / Tension 四层音频强度 VFX |
| [AnimationAndPlaceholders.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/AnimationAndPlaceholders.md) | 43 项占位资源清单 / AnimBP 状态机 / 4 级 Level 流送 |

---

## 🐛 故障排查

| 现象 | 解决方案 |
|-----|---------|
| **双击 .uproject 提示缺少模块，Yes 后编译失败** | 检查 Visual Studio 2022 是否安装了 "C++ 桌面开发" 和 "Unreal Engine 安装程序" 组件 |
| **编译错误：`cannot open include file 'OldApartmentHUD.generated.h'`** | 删除 `Intermediate/` 和 `Binaries/`，右键 .uproject → Generate Visual Studio project files → 重新编译 |
| **Python 脚本报错：`unreal 模块找不到`** | 确认启用了 **Editor Scripting Utilities** + **Python Editor Script Plugin** 两个插件（.uproject 已默认启用） |
| **PIE 启动后 PlayerController 视角不动** | 打开 BP_PlayerController，查看 Input 分类，将 IMC_Default + IA_* 资产手动拖拽到对应 UPROPERTY （脚本生成后偶尔需手动确认） |
| **Interact 按 E 没反应** | 确认 Interact 通道已注册（DefaultEngine.ini L107-L110）+ Interactable Actor 的 Collision Profile 设为 `Interactable` |
| **章节结算不出现** | 需要满足：收集全部关键线索 + 解开谜题 + 触发 TRIGGER_Room_Entrance（从出口离开） |

---

**祝测试顺利，探索愉快！**  
旧公寓的租客们在等着你还原真相 🔍
