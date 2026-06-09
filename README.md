# 社团活动战术棋 (Club Activity Tactics)

一款回合制棋盘策略游戏，指挥社团成员完成布展、宣传和接待任务，获取足够满意度。

## 项目结构

```
project.godot                      # Godot 项目配置
icon.svg                           # 项目图标
data/                              # 配置数据（可编辑JSON）
  ├─ characters.json              # 角色属性、技能配置
  ├─ balance.json                 # 游戏数值平衡配置
  ├─ level_list.json              # 关卡列表与解锁条件
  └─ levels/
      ├─ level_01_tutorial.json   # 教程关卡
      ├─ level_02_open_day.json   # 校园开放日
      └─ level_03_festival.json   # 文化节决战
scripts/
  ├─ Main.gd                      # 主场景控制器
  ├─ autoload/                    # 全局单例
  │   ├─ ConfigLoader.gd          # JSON配置加载
  │   ├─ GameManager.gd           # 游戏逻辑核心
  │   ├─ SaveSystem.gd            # 存档/设置持久化
  │   ├─ InputManager.gd          # 输入重映射
  │   ├─ AudioManager.gd          # 音效播放与音量
  │   └─ PerformanceStats.gd      # 性能统计面板
  ├─ core/                        # 核心游戏组件
  │   ├─ GameBoard.gd             # 网格地图与寻路
  │   ├─ CharacterNode.gd         # 角色节点显示
  │   ├─ TaskNode.gd              # 任务节点显示
  │   ├─ GuiInputDetector.gd      # 格子输入检测
  │   └─ OutlineLabelContainer.gd # 描边文字容器
  └─ ui/                          # UI界面
      ├─ StyledButton.gd          # 样式化按钮
      ├─ TitleScreen.gd           # 标题画面
      ├─ LevelSelect.gd           # 关卡选择
      ├─ GameHUD.gd               # 游戏HUD
      ├─ PauseMenu.gd             # 暂停菜单
      ├─ SettingsScreen.gd        # 设置页面
      ├─ ResultScreen.gd          # 结算画面
      ├─ DialogBox.gd             # 剧情/事件对话框
      └─ TutorialScreen.gd        # 教程页面
scenes/
  └─ main.tscn                    # 入口场景
```

## 核心系统

### 🎮 回合制战斗系统
- 每回合玩家指挥所有社团成员行动
- 每个角色拥有行动点(AP)，移动、工作、技能消耗AP
- 按 E 键或结束回合按钮进入下一回合

### 🗺️ 网格地图
- 自定义尺寸网格（JSON配置），墙壁/走廊等地块类型
- A* 寻路算法自动找最短路径
- 可到达范围自动高亮显示

### 🎭 角色技能
每个角色3个独特技能：
- **会长**：激励演讲、高效布置、领导光环
- **设计**：完美设计、海报攻势、艺术灵感
- **宣传**：大声吆喝、传单雨、人脉网络
- **接待**：温暖微笑、团队士气、贵宾到来

### 📊 任务系统
- **🎪 布展**：搭建展板、舞台
- **📣 宣传**：派发传单、广播
- **🤝 接待**：迎接嘉宾、签到
- 不同角色属性加成不同，站在任务格子上效率×1.5

### 🔀 剧情事件
- 每个关卡配置多个触发事件
- 回合开始/任务完成等触发器
- 多选项选择，影响满意度、任务进度、属性Buff

### 💾 存档与设置
- 自动保存通关进度和关卡解锁
- 音量、全屏、帧率、垂直同步可配置
- 所有输入按键支持重新绑定
- 性能统计面板（FPS、帧时间、内存）

## 操作说明

| 操作 | 默认按键 |
|---|---|
| 视角/单步移动 | W A S D 或 方向键 |
| 确认 / 工作 | 空格 / 回车 |
| 取消 / 暂停 | Esc |
| 结束回合 | E |
| 使用技能 1/2/3 | 数字键 1 2 3 |

## 如何扩展

1. **新增角色**：编辑 `data/characters.json` 添加角色对象
2. **新增关卡**：在 `data/levels/` 添加JSON，在 `level_list.json` 注册
3. **调整数值**：修改 `data/balance.json` 的平衡参数
4. **添加新技能效果**：在 `GameManager.gd` 的 `_execute_skill` 函数中增加匹配分支

## 构建与运行

使用 Godot 4.2+ 打开本项目目录，按 F5 运行。
