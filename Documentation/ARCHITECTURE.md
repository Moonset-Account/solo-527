# 项目架构文档

## 概述

本项目是一个基于 Unity 2022.3.10f1 开发的游戏项目，采用模块化的代码架构设计，将游戏系统划分为核心、游戏玩法、元系统、数据和 UI 等多个独立模块，便于维护和扩展。

## 目录结构

```
Assets/
├── Scenes/
│   └── BootScene.unity          # 启动场景
├── Scripts/
│   ├── Core/                    # 核心系统模块
│   ├── Data/                    # 数据定义模块
│   ├── Gameplay/                # 游戏玩法模块
│   ├── Meta/                    # 元系统模块
│   └── UI/                      # 用户界面模块
ProjectSettings/                 # Unity 项目设置
Packages/                        # 包管理
Documentation/                   # 项目文档
```

## 模块说明

### 1. 核心模块 (Core)

核心模块提供游戏的基础架构和通用功能：

| 文件 | 功能描述 |
|------|----------|
| `GameBootstrapper.cs` | 游戏启动器，负责在启动场景中初始化所有核心系统 |
| `GameManager.cs` | 游戏管理器，控制游戏全局状态和流程 |
| `Singleton.cs` | 单例模式基类，为全局管理器提供统一的单例实现 |
| `EventBus.cs` | 事件总线，实现模块间的解耦通信 |
| `LevelSceneManager.cs` | 关卡场景管理器，负责场景加载和切换 |
| `SaveSystem.cs` | 存档系统，处理游戏数据的持久化 |
| `AudioManager.cs` | 音频管理器，统一管理背景音乐和音效播放 |
| `SerializableDictionary.cs` | 可序列化字典工具类 |

### 2. 数据模块 (Data)

数据模块定义游戏中的数据结构：

| 文件 | 功能描述 |
|------|----------|
| `LevelConfigData.cs` | 关卡配置数据，定义关卡的各项参数 |

### 3. 游戏玩法模块 (Gameplay)

游戏玩法模块包含核心游戏逻辑：

| 文件 | 功能描述 |
|------|----------|
| `BoatController.cs` | 船只控制器，处理船只的物理移动和操作 |
| `BoatAnimationController.cs` | 船只动画控制器，管理船只相关动画 |
| `InputController.cs` | 输入控制器，统一处理玩家输入 |
| `TaskSystem.cs` | 任务系统，管理游戏任务的进度和完成判定 |
| `WeatherSystem.cs` | 天气系统，控制游戏中的天气变化 |
| `GallerySystem.cs` | 图鉴系统，管理收集品和图鉴解锁 |

### 4. 元系统模块 (Meta)

元系统模块包含游戏的外围系统：

| 文件 | 功能描述 |
|------|----------|
| `AchievementSystem.cs` | 成就系统，管理成就的解锁和进度追踪 |
| `LeaderboardSystem.cs` | 排行榜系统，处理分数排名数据 |

### 5. UI 模块 (UI)

UI 模块管理所有用户界面：

| 文件 | 功能描述 |
|------|----------|
| `UIManager.cs` | UI 管理器，负责界面的打开、关闭和层级管理 |
| `MainMenuPanel.cs` | 主菜单面板 |
| `HUDPanel.cs` | 游戏内 HUD 面板 |
| `PauseMenuPanel.cs` | 暂停菜单面板 |
| `ResultPanel.cs` | 结算面板 |
| `LevelSelectPanel.cs` | 关卡选择面板 |
| `RoutePlannerPanel.cs` | 航线规划面板 |
| `SettingsMenuPanel.cs` | 设置菜单面板 |
| `GalleryPanel.cs` | 图鉴面板 |
| `AchievementsPanel.cs` | 成就面板 |
| `TutorialPanel.cs` | 教程面板 |
| `MetaPanels.cs` | 元面板汇总 |
| `UIComponents.cs` | 通用 UI 组件 |

## 架构设计原则

### 1. 单例模式 (Singleton)
全局管理器（如 GameManager、UIManager、AudioManager 等）继承自 `Singleton<T>` 基类，确保全局唯一实例并提供便捷的访问方式。

### 2. 事件驱动 (EventBus)
模块间通过 `EventBus` 进行解耦通信，避免直接引用依赖，提高代码的可维护性和可测试性。

### 3. 分层架构
- **表现层 (UI)**：负责用户交互和数据展示
- **逻辑层 (Gameplay)**：处理核心游戏逻辑
- **核心层 (Core)**：提供通用服务和基础设施
- **数据层 (Data)**：定义数据结构和配置

### 4. 场景流程
```
BootScene (启动场景)
    ↓ GameBootstrapper 初始化核心系统
主菜单场景 / 关卡场景
    ↓ LevelSceneManager 管理场景切换
各游戏场景
```

## 系统交互示例

### 任务完成流程
1. 玩家操作触发任务条件
2. `TaskSystem` 检测到条件满足
3. 通过 `EventBus` 发布任务完成事件
4. `AchievementSystem` 监听事件并更新成就进度
5. `UIManager` 显示任务完成提示

### 关卡切换流程
1. `LevelSceneManager` 接收切换请求
2. 触发加载动画并保存当前状态
3. 异步加载目标场景
4. 初始化新场景的游戏对象
5. 通知相关系统场景加载完成

## 扩展建议

1. **新增系统**：在对应模块下创建新类，遵循现有命名规范
2. **新增 UI**：继承 Panel 基类，在 UIManager 中注册
3. **数据配置**：使用 ScriptableObject 进行数据配置
4. **性能优化**：考虑对象池、异步加载等优化手段
