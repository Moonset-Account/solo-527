旧公寓遗物整理录 — Content 目录说明
=====================================

【重要】本工程采用「纯 C++ 程序化生成」方案，
      无需以下任何 .uasset / .umap / .umap 二进制资源即可运行。

启动方式：
  1. 双击 OldApartmentMystery.uproject（或右键 → Generate Visual Studio/Xcode 项目）
  2. 若提示"未编译"，选择"Yes"编译 C++ 模块
  3. 编译完成后进入编辑器，点击 ▶ Play In Editor 即可游玩

以下子目录是概念性占位，实际内容都已在 C++ 层构建完成：

1. Maps/ —— 实际不存在 MainMenu.umap 等二进制关卡
   DefaultEngine.ini 启动时会加载引擎自带的 BlankMap，
   然后由 AOAMGameMode::BeginPlay → AOAMLevelBootstrapActor
   在 BeginPlay 时根据 Bootstrap 数据程序化生成：
     · MainMenu / Chapter1（客厅/厨房/阳台，24×18 网格）
     · Chapter2（走廊/女儿房/卫生间/书房，24×20）
     · Chapter3（地下室/储藏间/出口，24×16）
   切换关卡通过同场景 Actor 重建实现，不使用 OpenLevel。

2. Blueprints/ —— 无需蓝图
   所有 GameInstance / GameMode / Character / PlayerController
   / Door / Pickup / Lock / Note / RoomTrigger 等均为
   纯 C++ 类，在 DefaultEngine.ini 中直接绑定到 C++ Class。

3. Data/ —— 无需 DataAsset
   22 件物品 / 6 篇笔记 / 3 个谜题 / 3 章 / 3 关数据，
   由 UOAMBootstrapData（单例，UObject）硬编码，
   在 UOAMGameInstance::Init() 阶段一次性构建完成。
   可在 OAMBootstrapData.cpp 中直接编辑文本/数值。

4. Input/ —— 无需 IMC / InputAction uasset
   17 个 InputAction + 1 个 IMC 全部由
   UOAMGameInstance::BuildInputContextAndMappings() 在运行时
   NewObject 构建完成。

5. UI/ —— 无需 Widget Blueprint
   主菜单 / HUD / 暂停 / 设置 / 关卡选择 / 存档 / 笔记本 /
   谜题 / 物品检查 / 过关结算 共 10 个 UMG 面板，
   全部在 NativeConstruct 中程序化创建 CanvasPanel +
   CanvasPanelSlot 树（见 OAMUIFactory_Part1~3.cpp）。

6. Audio/ —— 暂无占位音频（后续可放入 /Content/Audio）
   33 SFX + 5 环境音路径已在 OAMAudioManager 中声明，
   若实际 .wav 缺失则静默，不影响流程。

=====================================
方案核心优势：
  · 100% 文本可版本控制（Git 友好）
  · 无需 UE 编辑器导入/另存操作，直接改 cpp 即生效
  · 双击 uproject → 编译 → 点击 ▶ 即可进入游戏
