# 档案室时间线推理

基于 Godot 4.2 开发的桌面式时间线推理游戏。

## 游戏特色

- **拖拽排序**：鼠标拖拽卡片到时间线正确位置
- **标签系统**：为每张卡片添加正确类别标签
- **证据关联**：建立卡片之间的因果关联线
- **分层提示**：三级提示系统，由浅入深逐步给出线索
- **评分系统**：根据正确性、用时、提示使用情况给出D到S级评价

## 技术架构

### 核心模块（Autoload）
| 文件 | 功能 |
|------|------|
| [GameManager.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/core/GameManager.gd) | 游戏状态管理、核心逻辑 |
| [EventBus.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/core/EventBus.gd) | 全局事件总线 |
| [ConfigManager.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/core/ConfigManager.gd) | 关卡/游戏配置加载 |
| [SaveManager.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/core/SaveManager.gd) | 存档序列化与读档 |
| [AudioManager.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/core/AudioManager.gd) | 程序化音效生成与管理 |
| [InputManager.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/core/InputManager.gd) | 输入重映射 |
| [PerformanceStats.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/core/PerformanceStats.gd) | FPS/内存等性能统计 |

### 游戏模块
| 文件 | 功能 |
|------|------|
| [EvidenceCard.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/EvidenceCard.gd) | 可拖拽的证据卡片组件 |
| [TimelineSlot.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/TimelineSlot.gd) | 时间线上的放置槽位 |
| [TimelineComponent.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/TimelineComponent.gd) | 完整时间线排序系统 |
| [UnplacedCardArea.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/UnplacedCardArea.gd) | 待归档卡片区域 |
| [TagPanel.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/TagPanel.gd) | 标签编辑面板 |
| [EvidenceLinkPanel.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/EvidenceLinkPanel.gd) | 证据关联面板 |
| [HintPanel.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/HintPanel.gd) | 分层提示面板 |
| [ResultPanel.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/ResultPanel.gd) | 成功/失败结果面板 |
| [FeedbackManager.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/FeedbackManager.gd) | Toast式反馈通知 |
| [GameScene.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/game/GameScene.gd) | 主游戏场景控制器 |

### UI 模块
| 文件 | 功能 |
|------|------|
| [MainMenu.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/ui/MainMenu.gd) | 主菜单 |
| [TutorialScreen.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/ui/TutorialScreen.gd) | 分步骤教程 |
| [PauseMenu.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/ui/PauseMenu.gd) | 暂停菜单 |
| [SettingsPanel.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/ui/SettingsPanel.gd) | 设置面板（显示/音频/游戏/操作） |
| [PerformanceHUD.gd](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-274/scripts/ui/PerformanceHUD.gd) | 性能统计HUD |

## 扩展内容

### 添加新关卡
在 `configs/levels/` 目录下创建新的 JSON 文件，格式参考：

```json
{
  "id": "chapter2",
  "title": "关卡标题",
  "description": "关卡描述",
  "difficulty": 2,
  "time_limit": 0,
  "cards": [
    {
      "id": "card_id",
      "type": "letter",
      "title": "卡片标题",
      "content": "卡片内容",
      "correct_year": 1935,
      "correct_month": 6,
      "correct_day": 1,
      "image_hint": "视觉描述",
      "correct_tags": ["标签1", "标签2"]
    }
  ],
  "timeline_slots": 4,
  "available_tags": ["标签1", "标签2", "标签3"],
  "hints": [
    {"level": 1, "text": "第一级提示"},
    {"level": 2, "text": "第二级提示"},
    {"level": 3, "text": "第三级答案级提示"}
  ],
  "evidence_links": [
    {"from": "card_a", "to": "card_b"}
  ],
  "success_message": "成功文案",
  "failure_messages": ["失败原因1", "失败原因2"]
}
```

卡片类型(type)支持：`letter`(信件)、`photo`(照片)、`document`(档案)、`newspaper`(剪报)、`note`(便签)

### 调整数值
编辑 `configs/scoring.json` 可调整：
- 基础分、单卡片分、单标签分、单关联分
- 时间奖励系数
- 各级提示惩罚分
- 重试惩罚分
- 完美/零提示/一次成功奖励分
- 等级门槛分

## 操作说明

| 操作 | 按键 |
|------|------|
| 拖拽卡片 | 鼠标左键按住拖动 |
| 打开卡片标签 | 双击卡片 / 选中后点标签面板 |
| 暂停/继续 | Esc |
| 获取提示 | H |
| 提交推理 | Enter |

## 运行项目

使用 Godot 4.2 或更高版本打开 `project.godot` 文件，点击运行即可启动游戏。

命令行运行：
```
godot --path /path/to/project
```

## 构建导出项目

在 Godot 编辑器中选择菜单 `项目 -> 导出`，添加对应平台的导出预设后即可生成可运行的构建。

本项目使用 GL Compatibility 渲染器，兼容性更好，可在大多数设备上运行。
