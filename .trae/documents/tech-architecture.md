## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        "React UI" --> "Zustand Store"
        "Zustand Store" --> "模拟引擎"
        "模拟引擎" --> "Three.js 渲染器"
        "模拟引擎" --> "物理/碰撞系统"
        "模拟引擎" --> "数值配置"
    end
    subgraph "模块层"
        "核心玩法脚本" --> "关卡配置"
        "动画状态机" --> "Three.js 渲染器"
        "调试面板" --> "数值配置"
        "音效系统" --> "模拟引擎"
    end
```

## 2. 技术说明

- **前端**：React@18 + TypeScript + Tailwind CSS + Vite
- **3D渲染**：Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing
- **状态管理**：Zustand
- **初始化工具**：vite-init (react-ts 模板)
- **后端**：无
- **数据库**：无，所有数据在本地存储

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 开始菜单 |
| `/levels` | 关卡选择 |
| `/game/:levelId` | 游戏主界面（含教程和正式关卡） |
| `/game/sandbox` | 沙盒模式 |
| `/result/:levelId` | 结算界面 |

## 4. 目录结构

```
src/
├── components/          # UI组件
│   ├── ui/              # 通用UI组件（按钮、滑块、面板）
│   ├── menu/            # 菜单相关组件
│   ├── game/            # 游戏HUD组件
│   └── result/          # 结算界面组件
├── three/               # Three.js 3D组件
│   ├── RoadNetwork.tsx  # 道路网渲染
│   ├── Intersection.tsx # 交叉路口渲染
│   ├── Vehicle.tsx      # 车辆渲染
│   ├── Bus.tsx          # 公交车渲染
│   ├── TrafficLight3D.tsx # 信号灯3D模型
│   ├── Buildings.tsx    # 建筑渲染
│   └── GameScene.tsx    # 场景容器
├── engine/              # 模拟引擎核心
│   ├── Simulation.ts    # 模拟主循环
│   ├── RoadGraph.ts     # 道路图数据结构
│   ├── VehicleAgent.ts  # 车辆AI代理
│   ├── BusAgent.ts      # 公交AI代理
│   ├── TrafficLight.ts  # 信号灯状态机
│   ├── CollisionSystem.ts # 碰撞/判定系统
│   └── ScoreCalculator.ts # 拥堵评分计算
├── animation/           # 动画状态
│   ├── AnimationState.ts # 动画状态机
│   └── Transitions.ts   # 过渡动画
├── config/              # 数值配置
│   ├── levels.ts        # 关卡配置
│   ├── vehicles.ts      # 车辆参数
│   ├── traffic.ts       # 信号灯参数
│   └── scoring.ts       # 评分参数
├── audio/               # 音效系统
│   └── AudioManager.ts  # 音效管理器
├── store/               # Zustand状态
│   ├── gameStore.ts     # 游戏主状态
│   ├── simulationStore.ts # 模拟状态
│   └── uiStore.ts       # UI状态
├── hooks/               # 自定义Hooks
│   ├── useSimulation.ts # 模拟循环Hook
│   ├── useReplay.ts     # 回放Hook
│   └── useAudio.ts      # 音效Hook
├── pages/               # 页面组件
│   ├── MainMenu.tsx     # 开始菜单
│   ├── LevelSelect.tsx  # 关卡选择
│   ├── GamePage.tsx     # 游戏主页面
│   └── ResultPage.tsx   # 结算页面
├── utils/               # 工具函数
│   └── helpers.ts
├── App.tsx              # 应用根组件
└── main.tsx             # 入口文件
```

## 5. 核心模块设计

### 5.1 模拟引擎（Simulation）

```typescript
interface SimulationState {
  time: number;
  vehicles: Vehicle[];
  buses: Bus[];
  intersections: Intersection[];
  trafficLights: TrafficLightState[];
  score: number;
  isRunning: boolean;
  speed: number; // 1x, 2x, 4x
}

interface Vehicle {
  id: string;
  position: Vector3;
  direction: Direction;
  speed: number;
  waitingTime: number;
  route: string[]; // 路口ID序列
  currentSegment: number;
  isWaiting: boolean;
  type: 'car' | 'bus';
}

interface TrafficLightState {
  intersectionId: string;
  phase: 'ns-green' | 'ns-yellow' | 'ew-green' | 'ew-yellow';
  timer: number;
  nsGreenDuration: number;
  ewGreenDuration: number;
  busPriorityEnabled: boolean;
  busPriorityCooldown: number;
}

interface Intersection {
  id: string;
  position: { x: number; z: number };
  roads: Direction[];
  trafficLightId: string;
}
```

### 5.2 道路图（RoadGraph）

```typescript
interface RoadSegment {
  id: string;
  from: string; // 路口ID
  to: string;   // 路口ID
  direction: Direction;
  length: number;
  lanes: number;
  isBusRoute: boolean;
}

type Direction = 'north' | 'south' | 'east' | 'west';

class RoadGraph {
  intersections: Map<string, Intersection>;
  segments: Map<string, RoadSegment>;
  adjacency: Map<string, string[]>;
  
  getShortestPath(from: string, to: string): string[];
  getSegmentsForIntersection(id: string): RoadSegment[];
  getVehicleSpawnPoints(): { intersectionId: string; direction: Direction }[];
}
```

### 5.3 信号灯状态机（TrafficLight）

```typescript
type LightPhase = 'ns-green' | 'ns-yellow' | 'ew-green' | 'ew-yellow';

interface TrafficLightConfig {
  nsGreenDuration: number;  // 10-90秒
  ewGreenDuration: number;  // 10-90秒
  yellowDuration: number;   // 固定3秒
  busPriorityEnabled: boolean;
  busPriorityAdvanceSeconds: number; // 提前切换秒数
  busPriorityExtendSeconds: number;  // 延长绿灯秒数
  busPriorityCooldown: number;       // 30秒冷却
}

class TrafficLightController {
  config: TrafficLightConfig;
  phase: LightPhase;
  timer: number;
  
  update(dt: number, approachingBuses: Bus[]): void;
  getLightState(direction: Direction): 'red' | 'yellow' | 'green';
  setConfig(config: Partial<TrafficLightConfig>): void;
}
```

### 5.4 碰撞/判定系统（CollisionSystem）

```typescript
class CollisionSystem {
  checkVehicleProximity(vehicles: Vehicle[]): Map<string, string[]>;
  checkIntersectionEntry(vehicle: Vehicle, intersection: Intersection): boolean;
  checkBusApproaching(bus: Bus, trafficLight: TrafficLightController): boolean;
  resolveConflicts(vehicles: Vehicle[]): Vehicle[];
}
```

### 5.5 拥堵评分（ScoreCalculator）

```typescript
interface ScoreResult {
  congestionScore: number;     // 0-100
  throughput: number;          // 通行量/分钟
  avgWaitTime: number;         // 平均等待时间
  busAvgWaitTime: number;      // 公交平均等待时间
  starRating: 0 | 1 | 2 | 3;  // 星级
}

class ScoreCalculator {
  calculate(vehicles: Vehicle[], time: number, targetScore: number): ScoreResult;
  compareSnapshots(before: ScoreResult, after: ScoreResult): ScoreComparison;
}
```

## 6. 动画状态机

```typescript
type AnimationState = 'idle' | 'playing' | 'paused' | 'fastForward' | 'replaying';

interface AnimationTransition {
  from: AnimationState;
  to: AnimationState;
  action: () => void;
}

const transitions: AnimationTransition[] = [
  { from: 'idle', to: 'playing', action: startSimulation },
  { from: 'playing', to: 'paused', action: pauseSimulation },
  { from: 'paused', to: 'playing', action: resumeSimulation },
  { from: 'playing', to: 'fastForward', action: setSpeed4x },
  { from: 'fastForward', to: 'playing', action: setSpeed1x },
  { from: 'playing', to: 'replaying', action: startReplay },
  { from: 'replaying', to: 'playing', action: endReplay },
];
```

## 7. 数值配置

### 关卡配置

```typescript
interface LevelConfig {
  id: string;
  name: string;
  description: string;
  roadLayout: 'single' | 'double' | 'grid-2x2' | 'grid-3x3';
  targetScore: number;
  timeLimit: number; // 秒
  trafficDensity: TrafficDensity[];
  busRoutes: BusRouteConfig[];
  initialTrafficLightConfig: TrafficLightConfig[];
  tutorialSteps?: TutorialStep[];
}

interface TrafficDensity {
  direction: Direction;
  vehiclesPerMinute: number;
  peakMultiplier: number;
  peakStartTime: number;
  peakEndTime: number;
}

interface BusRouteConfig {
  routeId: string;
  stops: string[]; // 路口ID
  frequency: number; // 班次/分钟
  color: string;
}
```

## 8. 回放系统

```typescript
interface ReplaySnapshot {
  timestamp: number;
  trafficLightConfig: TrafficLightConfig[];
  scoreSnapshot: ScoreResult;
}

class ReplaySystem {
  snapshots: ReplaySnapshot[];
  currentReplayIndex: number;
  
  captureSnapshot(config: TrafficLightConfig[], score: ScoreResult): void;
  startReplay(): void;
  stepForward(): ReplaySnapshot | null;
  stepBackward(): ReplaySnapshot | null;
  compareWithCurrent(snapshot: ReplaySnapshot): ScoreComparison;
}
```

## 9. 音效系统

```typescript
interface SoundConfig {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
}

const SOUNDS = {
  'traffic-light-switch': { volume: 0.3, loop: false },
  'car-horn': { volume: 0.2, loop: false },
  'bus-approaching': { volume: 0.4, loop: false },
  'congestion-warning': { volume: 0.5, loop: true },
  'level-complete': { volume: 0.6, loop: false },
  'level-fail': { volume: 0.4, loop: false },
  'button-click': { volume: 0.2, loop: false },
  'slider-change': { volume: 0.1, loop: false },
} as const;
```

## 10. 构建流程

- **开发**：`pnpm dev` — Vite开发服务器，HMR热更新
- **构建**：`pnpm build` — 生产构建，输出到 `dist/`
- **预览**：`pnpm preview` — 预览生产构建
- **类型检查**：`pnpm check` — TypeScript类型检查
- **代码质量**：ESLint + Prettier
