# 🚁 山地救援无人机模拟 - 项目启动指南 (v0.1.1)

> 首次使用请严格按 7 步执行，约 10 分钟即可进入试玩。

---

## 📋 环境要求
| 项目 | 版本 |
|------|------|
| Unreal Engine | **5.3.x** (5.3.0 ~ 5.3.2 均可) |
| Visual Studio 2022 | 17.6+ (含"使用C++的游戏开发"工作负载) |
| 操作系统 | Windows 10/11 (x64) 或 macOS 13+ |
| 内存 | ≥ 16 GB (推荐 32GB) |
| 磁盘 | ≥ 25 GB 可用空间 |

---

## 🚀 7步快速启动

### Step 1️⃣ | 编译C++模块
1. 双击 `MountainRescueDrone.uproject`
2. 弹出提示框："MountainRescueDrone modules are missing or built with a different engine version. Would you like to rebuild them now?"
3. 点击 **Yes**
4. 等待编译完成（约 3-8 分钟）
   - ✅ 正常：UE编辑器自动打开
   - ❌ 失败：在项目根目录右键 "Generate Visual Studio project files"，然后用 Visual Studio 打开 `.sln`，配置选择 `Development Editor | Win64`，右键 `MountainRescueDrone` 项目 → Build

### Step 2️⃣ | 启用 Python 插件（只需一次）
1. 编辑器顶部菜单：**Edit → Plugins**
2. 搜索框输入：**Python Editor Script Plugin**
3. 勾选 **Enabled**
4. 同样搜索并启用：**Editor Scripting Utilities**
5. 点击 **Restart Now** 重启编辑器

### Step 3️⃣ | 一键生成所有可玩资产
1. 重启后的编辑器顶部菜单：**Window → Developer Tools → Output Log**
2. 在 Output Log 的右下角输入框（Cmd）中，粘贴以下命令并回车：
   ```
   py "Content/Python/GenerateAllAssets.py"
   ```
3. 等待执行完成（约 30-60 秒）
4. 看到 `✅ 资产全部生成完毕！` 的绿色日志即成功

   > 📦 生成内容清单（共 24+ 资产）：
   > - 10 × InputAction + 1 × InputMappingContext
   > - 11 × 蓝图子类 (GameMode / Drone / HUD / RouteManager / Waypoint / Target / DroppedSupply / 3Systems / PlayerController)
   > - 6 × UMG Widget 蓝图
   > - 1 × DataTable（示例救援目标）
   > - 1 × 关卡 L_MountainBase（含所有Actor摆放）

### Step 4️⃣ | 配置关卡 GameMode
1. 打开关卡 **Content/Maps/L_MountainBase** (双击)
2. 在右侧 **World Settings** 面板（若没有：Window → World Settings）
3. 找到 **GameMode Override** 下拉，选择 **BP_GameMode**
4. （可选）在 World Settings → GameMode → Default Pawn Class 检查是否为 **BP_Drone**

### Step 5️⃣ | 添加救援目标（核心玩法数据）
在 World Outliner 中找到并选中 **BP_GameMode → GameMode Base(MountainRescueGameMode)**（或从 Content Browser 打开 BP_GameMode 蓝图的 Class Defaults），找到：

**Current Task Config → RescueTargets** 数组，点击 **+** 添加3个目标：

| Index | 字段 | 值 |
|-------|------|----|
| **0** | TargetID | `T1_LightInjury` |
| | TargetType | `MinorInjury` (轻伤) |
| | Priority | `Normal` (普通) |
| | World Location | `X=20000, Y=8000, Z=120000` (即200m,80m,1200m，cm单位) |
| | RequiredSupplies | 点+，选 `MedicalKit` |
| | TimeLimitSeconds | `600` |
| | GoldenTimeSeconds | `300` |
| | BaseScore | `500` |
| | GoldenTimeBonus | `200` |
| | DisplayName | 轻伤-王师傅 |
| --- | --- | --- |
| **1** | TargetID | `T2_Hypothermia` |
| | TargetType | `Hypothermia` (失温) |
| | Priority | `High` (高) |
| | World Location | `X=-15000, Y=25000, Z=180000` |
| | RequiredSupplies | 2项：`WarmBlanket` + `MedicalKit` |
| | TimeLimitSeconds | `420` |
| | GoldenTimeSeconds | `240` |
| | BaseScore | `700` |
| | GoldenTimeBonus | `350` |
| | DisplayName | 失温-李大姐 |
| --- | --- | --- |
| **2** | TargetID | `T3_LostPerson` |
| | TargetType | `LostPerson` (迷路) |
| | Priority | `Low` (低) |
| | World Location | `X=35000, Y=-20000, Z=90000` |
| | RequiredSupplies | 1项：`LocatorBeacon` |
| | TimeLimitSeconds | `900` |
| | GoldenTimeSeconds | `480` |
| | BaseScore | `350` |
| | GoldenTimeBonus | `100` |
| | DisplayName | 迷路-张同学 |

> 💡 坐标以 cm 为单位，Home 起点在 (0,0,3000) 即 30m 高度

### Step 6️⃣ | 保存所有
1. 按 `Ctrl+Shift+S` (Save All)
2. 点击 Content Browser 空白处右键 → Save All
3. 关卡也按 `Ctrl+S` 保存

### Step 7️⃣ | 开始试玩 🎮
1. 点击编辑器主工具栏的 **▶ Play** 按钮 (或 Alt+P)
2. 你会看到：
   - 中央山谷的 Home 基地，无人机停在起降坪
   - 屏幕显示 HUD（电量100% / 信号100% / 目标列表）
   - 右上角航线编辑工具栏

3. **标准操作流程演示：**
   ```
   ① 按 1 键 → 进入"添加航点"模式
   ② 鼠标移动到山峰附近（绿色圈=轻伤目标）→ 左键点击
     → 屏幕出现航线点#1，自动升高到150m
   ③ 在红色圈(失温)目标附近再点击 → #2
   ④ 在黄色圈(迷路)目标附近再点击 → #3
   ⑤ 按 1 退出添加模式 → 空格键 开始任务！
   ⑥ 观察无人机按航线飞行、投放物资、目标倒计时
   ⑦ 完成后结算界面显示每个目标的评分和解释
   ```

---

## 🎮 完整快捷键

| 键位 | 功能 | 阶段 |
|------|------|------|
| `1` | 添加航线点模式 | 编辑阶段 |
| `2` | 移动航线点模式（拖拽移动） | 编辑阶段 |
| `3` | 删除航线点模式 | 编辑阶段 |
| `左键` | 执行当前模式的操作 | 编辑阶段 |
| `空格` / `Enter` | 验证航线 + 开始飞行 | 编辑阶段 |
| `R` | 强制返航（扣除信号分） | 飞行中 |
| `Tab` | 打开/关闭任务难度编辑器 | 所有阶段 |
| `Esc` / `P` | 暂停 | 飞行中 |

---

## 🧪 常见问题排查

### Q1: 双击.uproject编译失败
```
错误：cannot open include file 'MountainRescueTypes.generated.h'
```
**解决：** 右键.uproject → **Generate Visual Studio project files** → 用VS2022打开MountainRescueDrone.sln → 选择 "Development Editor | Win64" → 右键MountainRescueDrone项目 → Build。成功后再双击.uproject。

### Q2: 运行 py GenerateAllAssets.py 报类找不到
```
错误: 找不到C++类: MountainRescueGameMode
```
**解决：** Step1编译未成功！先回到Q1确保VS编译成功。C++类只有被UE加载后Python才能访问。

### Q3: Play后屏幕什么都没有
**解决：**
1. 按 `G` 退出 GameViewMode 查看是否有World Outliner
2. 检查 World Settings → GameMode Override 是否选了 BP_GameMode
3. 检查关卡中是否放了 BP_Drone、BP_RouteManager、BP_WeatherSystem、BP_SignalSystem、BP_ReplaySystem（Python脚本应该都放了，没有的话从Content Browser拖入关卡）

### Q4: Play后按1/2/3没反应
**解决：**
1. 检查 BP_PlayerController 的 Defaults 是否设置了 InputMappingContext 和所有 InputAction
   （Python脚本会尝试自动配置，如果失败需要手动）
2. 打开 BP_PlayerController → Class Defaults → 搜索 Input：
   - Input Mapping Context → 选 **IMC_MountainRescue**
   - Left Click Action → IA_LeftClick，以此类推

### Q5: 救援目标倒计时不跑
**解决：**
1. BP_GameMode → CurrentTaskConfig → RescueTargets 的每个目标 TimeLimitSeconds > 0
2. 确认按下空格 **开始飞行** 后倒计时才启动（编辑阶段不计时）

### Q6: 航线验证总是失败 - "投放点数量不足"
**解决：** 航线点只是经过点，还需要把经过目标的航点标记为**投放点**：
- 在Content Browser打开 BP_RouteManager（或关卡中选中RouteManager）
- 或在 WBP_RouteEditor 中创建 UI 按钮来调用 `SetWaypointDelivery(Index, true, SupplyType, TargetIndex)`
- 快速调试：直接修改 BP_GameMode 的航线验证逻辑可临时跳过此检查

---

## 🔧 难度调节（Tab 打开任务编辑器）

Python脚本已在 BP_GameMode 上挂了 TaskEditorComponent，按 Tab 打开 WBP_TaskEditor 后可调节：

| 类别 | 参数 | 影响 |
|------|------|------|
| 🌤️ 天气 | 风速 0~30m/s | >10m/s 显著增加耗电、吹偏航线 |
| | 阵风开关+强度 | 阵风强度2→颠簸耗电×1.3 |
| | 风向角度 | 顺风省电，逆风多耗30% |
| 🔋 电量 | 初始电量 10%~100% | 直接决定航程 |
| | 耗电倍率 x0.5~x2.0 | 越高越难 |
| 🎒 物资 | 3类物资数量+重量 | 超重→耗电×1.5 |
| 📡 信号 | 盲区个数+最大范围 | 进入盲区15秒后触发返航扣150分 |

预设难度：**简单 / 普通 / 困难 / 专家**

---

## 🗂️ 项目文件索引

| 文件 | 作用 |
|------|------|
| `BLUEPRINT_IMPLEMENTATION_GUIDE.md` | 23页完整蓝图指南（必读进阶） |
| `Content/Python/GenerateAllAssets.py` | **★核心：一键生成所有资产脚本** |
| `Config/DefaultEngine.ini` | 项目配置（GameMode/PC/HUD类绑定） |
| `Source/MountainRescueDrone/` | 13个C++基类（所有玩法逻辑） |

---

## 🎯 小型试玩目标清单

- [ ] 打开关卡 L_MountainBase
- [ ] 设置 BP_GameMode 并添加 3 个救援目标
- [ ] 用 1 键放置 4 个航线点（3目标+1返航）
- [ ] 空格开始飞行，观察电量随载重/风速下降
- [ ] 观察无人机进入信号盲区时触发返航（如果航线经过）
- [ ] 至少 2 个目标成功救援，获得 ≥1200 分
- [ ] 结算界面阅读"延误/偏差/物资错误"具体说明
- [ ] 点击"查看回放"，调节 x2 倍速观看飞行轨迹
- [ ] Tab打开难度编辑器，切到"困难"再玩一次

**✅ 完成以上 = 你已经完整体验了所有核心玩法！**

---

*遇到问题？参考：*
1. Output Log 红色错误内容
2. BLUEPRINT_IMPLEMENTATION_GUIDE.md 第10章 排错
3. 检查 C++ 编译是否有 warning
