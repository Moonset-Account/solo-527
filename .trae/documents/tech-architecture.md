## 1. 架构设计

```mermaid
flowchart TD
    subgraph "前端层（Phaser 3）"
        "BootScene" --> "MenuScene"
        "MenuScene" --> "TutorialScene"
        "MenuScene" --> "GameScene"
        "TutorialScene" --> "GameScene"
        "GameScene" --> "ResultScene"
        "ResultScene" --> "MenuScene"
        "ResultScene" --> "GameScene"
    end

    subgraph "核心模块"
        "SceneManager" --> "场景切换与过渡"
        "InputMapper" --> "输入映射与快捷键"
        "AssetLoader" --> "资源预加载"
        "UIStateManager" --> "UI状态管理"
        "AudioManager" --> "音频触发与混音"
        "SaveManager" --> "存档读写"
        "LevelConfig" --> "关卡配置数据"
    end

    subgraph "游戏逻辑"
        "TrackNetwork" --> "轨道节点与连接"
        "SignalSystem" --> "信号灯状态"
        "TrainScheduler" --> "车次调度与时刻"
        "ConflictDetector" --> "冲突检测引擎"
        "ReplaySystem" --> "回放记录与回退"
    end
```

## 2. 技术说明

- **前端框架**：Phaser 3（游戏引擎）+ TypeScript
- **构建工具**：Vite
- **包管理器**：npm
- **后端**：无（纯前端）
- **数据库**：无（localStorage 存档）
- **音频**：Phaser 内置音频系统 + Web Audio API
- **存档**：localStorage JSON 序列化

## 3. 场景定义

| 场景 | 用途 |
|------|------|
| BootScene | 资源预加载、初始化核心模块 |
| MenuScene | 开始菜单、关卡选择 |
| TutorialScene | 交互式教程引导 |
| GameScene | 核心游戏玩法 |
| ResultScene | 结算界面（通关/失败） |

## 4. 数据模型

### 4.1 轨道网络模型

```typescript
interface TrackNode {
  id: string;
  x: number;
  y: number;
  type: 'junction' | 'platform' | 'signal' | 'endpoint';
  connections: string[];
  switchState?: number;
  signalState?: 'red' | 'green';
  platformId?: string;
}

interface TrackEdge {
  from: string;
  to: string;
  length: number;
  speedLimit: number;
}
```

### 4.2 列车模型

```typescript
interface Train {
  id: string;
  type: 'passenger' | 'freight';
  name: string;
  color: number;
  speed: number;
  priority: number;
  schedule: ScheduleEntry[];
  currentEdge?: string;
  progress: number;
  state: 'waiting' | 'running' | 'arrived' | 'delayed' | 'crashed';
}

interface ScheduleEntry {
  nodeId: string;
  arrivalTime: number;
  departureTime: number;
  action: 'pass' | 'stop';
}
```

### 4.3 关卡配置模型

```typescript
interface LevelConfig {
  id: string;
  name: string;
  description: string;
  timeLimit: number;
  nodes: TrackNode[];
  edges: TrackEdge[];
  trains: Train[];
  starThresholds: { one: number; two: number; three: number };
  tutorialSteps?: TutorialStep[];
}
```

### 4.4 冲突模型

```typescript
interface Conflict {
  type: 'same_track' | 'delay_chain' | 'platform_occupied';
  severity: 'warning' | 'critical';
  trains: string[];
  location: string;
  time: number;
  message: string;
}
```

### 4.5 存档模型

```typescript
interface SaveData {
  unlockedLevels: string[];
  levelResults: Record<string, {
    stars: number;
    bestTime: number;
    completed: boolean;
  }>;
  settings: {
    musicVolume: number;
    sfxVolume: number;
  };
}
```

## 5. 目录结构

```
src/
├── main.ts                  # 入口文件，Phaser游戏配置
├── config/
│   └── gameConfig.ts        # Phaser游戏配置
├── scenes/
│   ├── BootScene.ts         # 资源加载场景
│   ├── MenuScene.ts         # 开始菜单场景
│   ├── TutorialScene.ts     # 教程场景
│   ├── GameScene.ts         # 主游戏场景
│   └── ResultScene.ts       # 结算场景
├── core/
│   ├── SceneManager.ts      # 场景管理器
│   ├── InputMapper.ts       # 输入映射
│   ├── AssetLoader.ts       # 资源加载器
│   ├── UIStateManager.ts    # UI状态管理
│   ├── AudioManager.ts      # 音频管理器
│   ├── SaveManager.ts       # 存档管理器
│   └── ReplaySystem.ts      # 回放系统
├── game/
│   ├── TrackNetwork.ts      # 轨道网络逻辑
│   ├── SignalSystem.ts      # 信号灯系统
│   ├── TrainScheduler.ts    # 列车调度器
│   ├── ConflictDetector.ts  # 冲突检测器
│   └── Train.ts             # 列车实体
├── levels/
│   ├── level1.ts            # 关卡1：单岔口
│   ├── level2.ts            # 关卡2：双岔口
│   ├── level3.ts            # 关卡3：站台停靠
│   ├── level4.ts            # 关卡4：晚点连锁
│   └── level5.ts            # 关卡5：综合挑战
├── ui/
│   ├── TrainSchedulePanel.ts # 车次表面板
│   ├── ConflictAlert.ts     # 冲突提示弹窗
│   ├── TimelineBar.ts       # 时间轴
│   └── ReplayControls.ts    # 回放控制
├── data/
│   └── saveData.ts          # 存档数据操作
└── utils/
    └── helpers.ts           # 工具函数
```

## 6. 关卡设计

| 关卡 | 名称 | 难度 | 核心机制 | 教学点 |
|------|------|------|----------|--------|
| 关卡1 | 单岔口 | ★ | 1个岔口、2辆列车 | 学会切换岔口 |
| 关卡2 | 双岔口 | ★★ | 2个岔口、3辆列车 | 学会协调多个岔口 |
| 关卡3 | 站台停靠 | ★★★ | 岔口+站台、4辆列车 | 学会安排站台停靠 |
| 关卡4 | 晚点连锁 | ★★★ | 信号灯+优先级、4辆列车 | 学会应对晚点连锁 |
| 关卡5 | 综合调度 | ★★★★ | 全部机制、5辆列车 | 综合运用 |
