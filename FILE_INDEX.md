# 文件索引与快速跳转

## 核心系统
| 文件 | 说明 |
|------|------|
| [GameManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/GameManager.cs#L5-L108) | 游戏状态机/关卡切换/暂停/胜利逻辑 |
| [EventManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/EventManager.cs#L7-L119) | 全局事件总线（11 种事件） |
| [SaveManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/SaveManager.cs#L60-L229) | JSON 存档读写/收集品/开关状态 |
| [SettingsManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/SettingsManager.cs#L35-L207) | 音量/画质/键位设置 |
| [LightManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/LightManager.cs#L18-L232) | 4 方向光源切换/平台激活判断/视觉过渡 |
| [ShadowPlatform.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/ShadowPlatform.cs#L15-L241) | 影子平台激活/消失/闪烁预警/缩放震动 |
| [AudioManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/AudioManager.cs#L12-L338) | BGM/SFX/UI 音源管理 |
| [SceneBootstrap.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/SceneBootstrap.cs#L20-L158) | 自动初始化所有 Manager |
| [GameConfig.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/GameConfig.cs) | 全局 ScriptableObject 调参 |
| [LevelConfig.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Core/LevelConfig.cs) | 单关 ScriptableObject 配置 |

## 玩家系统
| 文件 | 说明 |
|------|------|
| [PlayerController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Player/PlayerController.cs#L10-L410) | 移动/跳跃/状态机/死亡/重生 |
| [PlayerAnimator.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Player/PlayerAnimator.cs#L12-L163) | 挤压拉伸/闪烁/动画参数 |
| [PlayerAudio.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Player/PlayerAudio.cs#L10-L89) | 脚步音效自动触发 |

## 关卡系统
| 文件 | 说明 |
|------|------|
| [Checkpoint.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Level/Checkpoint.cs#L10-L243) | 旗帜升起/存档/激活光效 |
| [LevelGoal.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Level/LevelGoal.cs#L11-L144) | 终点传送门/完成过渡 |
| [TutorialTrigger.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Level/TutorialTrigger.cs#L11-L154) | 教程区域触发 |
| [LevelBuilder.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Level/LevelBuilder.cs#L11-L264) | 关卡初始化/相机边界/生成玩家 |

## 机关系统
| 文件 | 说明 |
|------|------|
| [InteractableSwitch.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Interactables/InteractableSwitch.cs#L7-L197) | 切换型/瞬动型/触发型开关 |
| [DoorController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Interactables/DoorController.cs#L7-L229) | 4 种门开启动画 |
| [PressurePlate.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Interactables/PressurePlate.cs#L7-L149) | 压力板缩放下压 |
| [Collectible.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Interactables/Collectible.cs#L11-L207) | 收集品浮动/收集动画 |

## 危险物
| 文件 | 说明 |
|------|------|
| [HazardBase.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Hazard/HazardBase.cs#L10-L217) | 6 种危险物/激活预警/击退 |

## 摄像机
| 文件 | 说明 |
|------|------|
| [CameraController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Camera/CameraController.cs#L11-L216) | 跟随/前瞻/动态缩放/震动 |

## UI 系统
| 文件 | 说明 |
|------|------|
| [UIManager.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/UI/UIManager.cs#L11-L321) | Canvas 管理/淡入淡出 |
| [HUDController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/UI/HUDController.cs#L10-L342) | 关卡/收集/光向/血量显示 |
| [MainMenuController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/UI/MainMenuController.cs#L9-L159) | 主菜单/标题漂浮 |
| [PauseMenuController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/UI/PauseMenuController.cs#L9-L145) | 暂停菜单 |
| [SettingsMenuController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/UI/SettingsMenuController.cs#L10-L318) | 设置菜单/键位重绑 |
| [TutorialPanelController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/UI/TutorialPanelController.cs#L9-L155) | 教程气泡滑入滑出 |
| [GameOverController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/UI/GameOverController.cs#L9-L151) | 死亡画面 |
| [VictoryController.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/UI/VictoryController.cs#L9-L226) | 胜利画面/烟花 |

## 编辑器工具
| 文件 | 说明 |
|------|------|
| [PlaceholderResourceGenerator.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/EditorTools/PlaceholderResourceGenerator.cs) | 程序化生成 Sprite |
| [SceneSetupHelper.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/EditorTools/SceneSetupHelper.cs) | 场景对象工厂方法 |
| [ProjectBuilder.cs](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Assets/_Scripts/Editor/ProjectBuilder.cs) | 一键 Setup 菜单 |

## 配置文件
| 文件 | 说明 |
|------|------|
| [ProjectVersion.txt](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/ProjectSettings/ProjectVersion.txt) | Unity 版本 2022.3.20f1 |
| [TagManager.asset](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/ProjectSettings/TagManager.asset) | Layer/Tag/SortingLayer 配置 |
| [InputManager.asset](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/ProjectSettings/InputManager.asset) | 按键映射 |
| [EditorBuildSettings.asset](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/ProjectSettings/EditorBuildSettings.asset) | 构建场景列表 (4 个) |
| [manifest.json](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/Packages/manifest.json) | 包依赖 |
| [ProjectSettings.asset](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-260/ProjectSettings/ProjectSettings.asset) | 全局项目设置 |
