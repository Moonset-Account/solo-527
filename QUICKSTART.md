# 快速启动指南 - Quick Start

本文件旨在帮助你在 **5分钟内** 运行并测试游戏原型。

---

## 🟢 Step 1: 环境准备（1分钟）

1. 下载安装 **Unity Hub**: https://unity.com/download
2. 在 Hub 中安装 **Unity 2022.3.10f1 LTS**（或任意 2022.3.x LTS 版本）
   - 安装时勾选模块：Windows Build Support / Mac Build Support（根据你的系统）
   - 可选：WebGL / Android Build Support

---

## 🟢 Step 2: 打开项目（1分钟）

1. 启动 Unity Hub
2. 点击 **Add** → **Add project from disk**
3. 选择项目根目录（`question-290` 文件夹）
4. Unity 会自动开始导入资源（首次约 1-2 分钟）
5. 导入完成后，项目会自动打开

> 💡 如果 Unity 提示版本不匹配，选择 **Continue** 即可，代码兼容 2022 LTS 全系列。

---

## 🟢 Step 3: 首次运行（1分钟）

### 方法 A：直接运行（推荐）
1. 在 Project 窗口中找到 `Assets/Scenes/BootScene.unity`
2. **双击打开**
3. 点击 Unity 编辑器顶部的 **▶ Play 按钮**
4. 主菜单应该在 2-3 秒内出现

### 方法 B：检查场景内容
- 场景中应至少包含 3 个对象：
  - `SceneInitializer`（自动启动系统）
  - `Main Camera`（主摄像机）
  - `Directional Light`（平行光）
- 如果缺少对象，点击 Unity 菜单栏 **File → New Scene → Basic 2D** 然后拖拽添加即可

---

## 🟢 Step 4: 试玩核心循环（2分钟）

### 第一次游戏路径
1. **主菜单** → 点击 **教程**（了解基本操作，8页图文）
2. **返回** → 点击 **开始游戏** 或 **关卡选择**
3. **关卡选择** → 选第一个关卡（新手教程）
4. **HUD 熟悉**：
   - 左上角：分数 / 时间 / 任务进度
   - 右上角：天气信息 + 天气预报
   - 左下角：燃料/食物/电量 三个槽位
   - 右下角：拍摄 / 路线规划 / 抛锚 / 起锚
5. **路线规划练习**：
   - 按 R 或点击「路线规划」按钮
   - 在地图上点击 2-3 个位置
   - 点击「确认」观察船只自动航行
6. **拍摄任务**：
   - 等船只漂近彩色目标点
   - 按「空格」或点击「拍摄」按钮
   - 成功时会有提示 + 任务状态变为已完成
7. **结算页**：全部拍摄或时间耗尽后自动结算
8. **返回主菜单** → 尝试其他关卡或系统

### 测试其他系统
- **图鉴**：主菜单 → 图鉴 → 查看已解锁/未解锁物品
- **成就**：主菜单 → 成就 → 点击「检查成就」刷新状态
- **排行榜**：主菜单 → 排行榜 → 切换「全球」/「单关」标签
- **每日挑战**：主菜单 → 每日挑战 → 查看特殊规则 → 开始挑战
- **设置**：暂停菜单 → 设置 / 主菜单 → 设置（音量、画质、进度重置）

---

## 🟢 Step 5: 构建发布（可选）

### 构建 Windows 版本
1. Unity 菜单栏：**File → Build Settings**
2. Platform 选择 **Windows** → 点击 **Switch Platform**（首次需切换）
3. 场景列表确保有：`Assets/Scenes/BootScene.unity`（没有就拖进去）
4. 点击 **Build** → 选择输出目录（建议选 `Builds/` 文件夹）
5. 等待编译完成，运行输出目录的 `.exe`

### 一键构建菜单
本项目自带自定义构建菜单：
- Unity 顶部菜单 → **Build → Standalone → Windows x64**（自动按日期命名输出目录）
- Unity 顶部菜单 → **Build → Tools → Validate Project Setup**（一键检查项目完整性）

---

## 🔴 常见问题排查

### 问题1: Play 后界面空白/黑屏
**原因**: 摄像机或启动器未正确初始化
**解决**:
1. 确认场景里有 Main Camera（tag=MainCamera）
2. 确认场景里有 `SceneInitializer` 对象且组件勾选
3. 点击 Console 查看红色错误日志 → 截图反馈

### 问题2: 点击按钮没反应
**原因**: EventSystem 缺失
**解决**: Unity 菜单栏 → **GameObject → UI → Event System** 添加即可

### 问题3: 文字乱码/显示为方块
**原因**: 默认字体不支持中文
**解决**: 任意 TTF 中文字体拖入 `Assets/Fonts/`，在各 Text 组件替换字体

### 问题4: 编译错误 (CS0234 / 找不到类型)
**原因**: Assembly Definition 引用问题
**解决**: 删除各 `Scripts/子目录/*.asmdef` 文件即可降级为全局编译模式

### 问题5: 存档文件位置
- **Windows**: `%APPDATA%\..\LocalLow\DefaultCompany\GameProject\Saves\`
- **Mac**: `~/Library/Application Support/DefaultCompany/GameProject/Saves/`
- **完全重置**: 直接删除 `Saves` 文件夹，或在设置页点击「重置进度」

---

## 📁 下一步开发建议

### 替换美术
- 美术占位资源路径：`Assets/Art/Placeholders/`
- 当前由代码运行时动态生成（Primitive/纯色材质）
- 替换方式：在 `LevelSceneManager.cs` 中把对应 Prefab 引用换成真美术即可

### 接入真实音效
- 目前 AudioManager 逻辑完整，只需挂载 AudioClip
- 音乐放 `Assets/Audio/Music/`、音效放 `Assets/Audio/SFX/`
- 在 `AudioManager.RegisterSfxClip()` 注册即可被全局调用

### 添加新内容
详细 API/扩展指南见主 `README.md`，核心入口：
- 新关卡：`LevelSelectPanel.LoadAllLevels()`
- 新图鉴：`GalleryPanel.EnsureMockData()`
- 新成就：`AchievementsPanel.EnsureMockData()`
- 新天气：`WeatherSystem.cs` + `LevelSceneManager.UpdateWeatherVisuals()`

---

## 📞 需要帮助？

如果遇到任何问题：
1. 查看 Console 窗口，截图所有红色 Error
2. 确认 Unity 版本 ≥ 2022.3.x
3. 执行菜单 **Build → Tools → Validate Project Setup** 查看自检结果
4. 参考 `Documentation/ARCHITECTURE.md` 了解系统间关系

祝航行愉快！⛵📸
