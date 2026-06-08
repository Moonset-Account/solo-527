; 搬家大师 - 装箱挑战 项目架构文档

## 项目目录结构

```
project.godot                 # Godot 项目配置 (输入映射/图层/Autoload)
export_presets.cfg            # 5平台导出预设 (Mac/Win/Linux/Web/Android)
icon.svg                      # 游戏图标
build.sh                      # 自动化构建+验证脚本

audio/
└── bus_layout.tres           # 5条音频总线 (Master/Music/SFX/Ambient/UI)

config/
├── item_config.gd            # ItemConfig 资源类 (类型枚举+属性)
├── item_database.gd          # 23种物品完整配置数据
├── item_database.tres        # 物品数据库资源文件
├── balance_config.gd         # 平衡参数 (评分/物理/时间常量)
├── levels.gd                 # 8个关卡定义 (难度递进)
└── levels.tres               # 关卡资源文件

scripts/ (12个核心脚本)
├── GameManager.gd            # 全局单例: 游戏状态机/评分/解锁/撤销栈
├── LevelManager.gd           # 关卡运行时: 物品生成/放置校验/连击
├── PackableItem.gd           # 物品类: 渲染/碰撞/状态/破碎/反馈
├── PackingContainer.gd       # 容器类: 边界/重量/重叠/易碎受压
├── InputManager.gd           # 全局单例: 键鼠/手柄/触屏 4输入源统一
├── AudioManager.gd           # 全局单例: 21种SFX + 旋律音乐 (程序生成)
├── SaveManager.gd            # 全局单例: 存档/设置/统计持久化
├── UIManager.gd              # 全局单例: Toast/弹窗/文字动画
├── PlaySessionRecorder.gd    # 全局单例: 试玩过程全事件录制
├── GameHUD.gd                # HUD: 分数/时间/重量/失误/教程/连击
├── DebugPanel.gd             # 调试控制台: 生成物品/改参数/导出日志
├── ResultScreen.gd           # 结算屏: 星级/分数明细/解锁奖励
├── MainMenu.gd               # 主菜单
├── LevelSelect.gd            # 关卡选择 (卡片/分页/进度展示)
└── GameRoot.gd               # 游戏场景根节点: 状态过渡

scenes/ (3个主场景)
├── MainMenu.tscn             # 启动场景: 标题动画 + 5按钮菜单
├── LevelSelect.tscn          # 关卡卡片网格 + 星星统计
└── GameScene.tscn            # 游戏主场景: 容器+HUD+暂停+调试+结算

user://  (运行时生成)
├── savegame.cfg              # 玩家进度 (通关星级/最佳分数/设置)
└── play_sessions.json        # 最近100局试玩过程日志
```

## 核心系统设计

### 1. 游戏状态机 (GameManager.gd)
```
MAIN_MENU → LEVEL_SELECT → PLAYING → PAUSED → RESULT_SCREEN
                                          ↓ ↕ ↓
                                     (重玩/下一关/返回)
```
- 评分分解: 基础分 + 时间奖励 + 重量利用奖励 + 易碎保护奖励 - 失误惩罚
- 三星判定: 空间利用率(85%/65%/35%) + 易碎完好 + 失误数限制
- 撤销栈: 上限50步状态快照 (位置/旋转/分数/重量)

### 2. 物品系统 (PackableItem.gd)
5种状态: IN_TRAY → BEING_DRAGGED → IN_CONTAINER → BROKEN
- 程序化渲染: 23种多边形形状 (矩形/圆柱/镜面/吉他/椅子等异形)
- 易碎受压: 上方物品总重量 × 重叠面积比 ≥ 1.25×限值 → 破碎粒子
- 状态反馈: 选中高亮(蓝)/有效(绿)/无效(红)/警告(黄) 4色边框
- 重量标签 + 类型图标实时显示

### 3. 容器判定 (PackingContainer.gd)
- 3级重量反馈: <90%正常 / 90-100%黄闪+提示 / >100%红闪+扣分
- 放置质量评分: 完整在容器内/无碰撞/易碎靠上 = 高分
- 易碎检测: 每个物品实时计算上方重叠物品重量

### 4. 输入系统 (InputManager.gd) - 4输入源
| 操作 | 键鼠 | 手柄 | 触屏 |
|-----|-----|-----|-----|
| 选择拖拽 | 左键按住 | 方向键+A | 单指按住 |
| 顺时旋转 | E键 / 滚轮↑ | RB肩键 | 双击屏幕 |
| 逆时旋转 | Q键 / 滚轮↓ | LB肩键 | 双指旋转 |
| 撤销 | Ctrl+Z | X键 | - |
| 提交 | 空格/回车 | A键 | 长按 |
| 暂停 | ESC | B键/Start | 系统 |
| 切换选择 | Tab/Dir键 | D-Pad | - |
| 调试面板 | Shift+F1 | Start键 | - |

### 5. 动画 & 音效
- 选中放大/放下回弹(Tween Back过渡)
- 连击横幅 / 分数弹出 / 易碎震动
- 21种程序化生成音效 (方波/正弦/三角/锯齿包络)
- 4种场景背景旋律循环

### 6. 调试系统 (DebugPanel.gd)
- 实时FPS/状态/分数/时间/物品/碰撞数显示
- 一键生成任意物品 / 改重量上限 / 改时间
- 强制胜利/失败 / 导出会话JSON / 清除存档

### 7. 会话录制 (PlaySessionRecorder.gd)
每局记录：
- 事件流: 开始/放置/移除/撤销/重做/失误/决策 带时间戳
- 结束自动汇总: 用时/放置数/旋转数/撤销数/关键决策
- 持久化到 user://play_sessions.json （保留最近100局）

## 关卡配置 (8关难度递进)
| ID | 名称 | 难度 | 时间 | 物品数 | 易碎数 | 特点 |
|----|-----|-----|-----|-------|-------|-----|
| 1 | 初学乍练 | ⭐ | 120s | 8 | 0 | 入门教程 |
| 2 | 玻璃小心 | ⭐⭐ | 150s | 10 | 2 | 引入易碎品 |
| 3 | 家当登场 | ⭐⭐ | 180s | 12 | 1 | 大件家具 |
| 4 | 瓶瓶罐罐 | ⭐⭐⭐ | 180s | 14 | 4 | 多种形状 |
| 5 | 电子风暴 | ⭐⭐⭐ | 200s | 12 | 3 | 镜面摆放 |
| 6 | 异形挑战 | ⭐⭐⭐⭐ | 220s | 14 | 3 | 不规则形状 |
| 7 | 重量危机 | ⭐⭐⭐⭐ | 200s | 16 | 4 | 极限重量 |
| 8 | 终极搬家 | ⭐⭐⭐⭐⭐ | 300s | 22 | 6 | 综合挑战 |

## 构建发布流程
```bash
# 1. 快速验证 (不实际导出)
./build.sh none

# 2. 全平台构建
./build.sh all

# 3. 单平台构建
./build.sh macos      # macOS .app
./build.sh windows    # Windows .exe
./build.sh linux      # Linux 二进制
./build.sh web        # HTML5
./build.sh android    # APK (需额外配置SDK)

# 4. Godot编辑器运行
godot --path .        # 直接运行
godot --editor        # 打开编辑器
```
