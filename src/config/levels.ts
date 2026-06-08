import type {
  LevelConfig,
  TrafficLightConfig,
  TrafficDensity,
  BusRouteConfig,
  TutorialStep,
} from '@/engine/types';
import { TRAFFIC_LIGHT_DEFAULTS } from './traffic';

function makeDefaultTrafficLightConfigs(intersectionIds: string[]): TrafficLightConfig[] {
  return intersectionIds.map((id) => ({
    intersectionId: id,
    nsGreenDuration: TRAFFIC_LIGHT_DEFAULTS.greenDuration,
    ewGreenDuration: TRAFFIC_LIGHT_DEFAULTS.greenDuration,
    yellowDuration: TRAFFIC_LIGHT_DEFAULTS.yellowDuration,
    busPriorityEnabled: false,
    busPriorityAdvanceSeconds: TRAFFIC_LIGHT_DEFAULTS.busPriority.advanceSeconds,
    busPriorityExtendSeconds: TRAFFIC_LIGHT_DEFAULTS.busPriority.extendSeconds,
    busPriorityCooldown: TRAFFIC_LIGHT_DEFAULTS.busPriority.cooldown,
  }));
}

function makeTrafficDensity(
  directions: TrafficDensity['direction'][],
  vpm: number,
  peakMultiplier = 1,
  peakStartTime = 0,
  peakEndTime = 0,
): TrafficDensity[] {
  return directions.map((direction) => ({
    direction,
    vehiclesPerMinute: vpm,
    peakMultiplier,
    peakStartTime,
    peakEndTime,
  }));
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到交通指挥官',
    description: '你将扮演交通指挥官，通过调整红绿灯配时来疏导车流。',
    highlightElement: 'scene',
  },
  {
    id: 'observe',
    title: '观察车流',
    description: '先观察一下路口的车流情况，注意哪些方向车辆较多。',
    highlightElement: 'scene',
    action: 'wait',
  },
  {
    id: 'select-intersection',
    title: '选择路口',
    description: '点击路口来选中它，选中后可以调整该路口的信号灯配时。',
    highlightElement: 'intersection',
    action: 'select-intersection',
  },
  {
    id: 'adjust-green',
    title: '调整绿灯时长',
    description: '拖动滑块调整南北方向绿灯时长。车流多的方向应该给更长的绿灯时间。',
    highlightElement: 'control-panel',
    action: 'adjust-green',
  },
  {
    id: 'adjust-ew-green',
    title: '调整东西绿灯',
    description: '同样调整东西方向的绿灯时长，使两个方向的通行效率均衡。',
    highlightElement: 'control-panel',
    action: 'adjust-ew-green',
  },
  {
    id: 'observe-result',
    title: '观察效果',
    description: '调整完成后，观察车流变化。绿灯时间越长，该方向通行越顺畅。',
    highlightElement: 'scene',
    action: 'observe',
  },
  {
    id: 'check-score',
    title: '查看评分',
    description: '底部的评分条显示当前拥堵程度，分数越低表示交通越顺畅。',
    highlightElement: 'score-bar',
    action: 'check-score',
  },
  {
    id: 'complete',
    title: '教程完成',
    description: '恭喜完成教程！现在你可以在正式关卡中挑战更复杂的路口了。',
  },
];

const LEVEL1_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'l1-start',
    title: '新手路口',
    description: '这是一个简单的十字路口，尝试调整信号灯让拥堵评分低于30。',
    highlightElement: 'scene',
  },
  {
    id: 'l1-ns',
    title: '调整南北绿灯',
    description: '南北方向车流量适中，合理分配绿灯时长。',
    highlightElement: 'control-panel',
    action: 'adjust-green',
  },
  {
    id: 'l1-ew',
    title: '调整东西绿灯',
    description: '东西方向同样需要合理的绿灯时间，注意总周期不宜过长。',
    highlightElement: 'control-panel',
    action: 'adjust-ew-green',
  },
  {
    id: 'l1-target',
    title: '达到目标',
    description: '将拥堵评分降到30以下即可过关，试试不同配时方案的效果！',
    highlightElement: 'score-bar',
    action: 'check-score',
  },
];

const SINGLE_IDS = ['int-1'];
const DOUBLE_IDS = ['int-1', 'int-2'];
const GRID_2X2_IDS = ['int-1', 'int-2', 'int-3', 'int-4'];
const GRID_3X3_IDS = ['int-1', 'int-2', 'int-3', 'int-4', 'int-5', 'int-6', 'int-7', 'int-8', 'int-9'];

const tutorial: LevelConfig = {
  id: 'tutorial',
  name: '教程',
  description: '学习基本操作：如何选择路口、调整信号灯配时、观察效果。',
  roadLayout: 'single',
  targetScore: 50,
  timeLimit: 90,
  trafficDensity: makeTrafficDensity(['north', 'south', 'east', 'west'], 2),
  busRoutes: [],
  initialTrafficLightConfigs: makeDefaultTrafficLightConfigs(SINGLE_IDS),
  tutorialSteps: TUTORIAL_STEPS,
};

const level1: LevelConfig = {
  id: 'level-1',
  name: '新手路口',
  description: '单路口，低车流量。学会基本的信号灯配时调整，将拥堵评分降至30以下。',
  roadLayout: 'single',
  targetScore: 30,
  timeLimit: 120,
  trafficDensity: makeTrafficDensity(['north', 'south', 'east', 'west'], 5),
  busRoutes: [],
  initialTrafficLightConfigs: makeDefaultTrafficLightConfigs(SINGLE_IDS),
  tutorialSteps: LEVEL1_TUTORIAL_STEPS,
};

const level2: LevelConfig = {
  id: 'level-2',
  name: '早高峰',
  description: '单路口，南北方向车流明显多于东西方向。需要根据方向不均衡调整配时，主路拥堵评分低于20。',
  roadLayout: 'single',
  targetScore: 20,
  timeLimit: 120,
  trafficDensity: [
    ...makeTrafficDensity(['north', 'south'], 15),
    ...makeTrafficDensity(['east', 'west'], 8),
  ],
  busRoutes: [],
  initialTrafficLightConfigs: [
    {
      intersectionId: 'int-1',
      nsGreenDuration: 40,
      ewGreenDuration: 20,
      yellowDuration: TRAFFIC_LIGHT_DEFAULTS.yellowDuration,
      busPriorityEnabled: false,
      busPriorityAdvanceSeconds: TRAFFIC_LIGHT_DEFAULTS.busPriority.advanceSeconds,
      busPriorityExtendSeconds: TRAFFIC_LIGHT_DEFAULTS.busPriority.extendSeconds,
      busPriorityCooldown: TRAFFIC_LIGHT_DEFAULTS.busPriority.cooldown,
    },
  ],
};

const level3: LevelConfig = {
  id: 'level-3',
  name: '公交优先',
  description: '双路口，含一条公交路线。启用公交优先策略，让公交等待时间减少30%，目标拥堵评分25以下。',
  roadLayout: 'double',
  targetScore: 25,
  timeLimit: 150,
  trafficDensity: [
    ...makeTrafficDensity(['north', 'south'], 10),
    ...makeTrafficDensity(['east', 'west'], 8),
  ],
  busRoutes: [
    {
      routeId: 'bus-1',
      stops: ['int-1', 'int-2'],
      frequency: 4,
      color: '#ffd700',
    },
  ],
  initialTrafficLightConfigs: makeDefaultTrafficLightConfigs(DOUBLE_IDS).map((config) => ({
    ...config,
    busPriorityEnabled: true,
  })),
};

const level4: LevelConfig = {
  id: 'level-4',
  name: '复杂路网',
  description: '4路口网格路网，高车流量，2条公交路线。需要协调多个路口的信号灯配时，目标拥堵评分25以下。',
  roadLayout: 'grid-2x2',
  targetScore: 25,
  timeLimit: 180,
  trafficDensity: [
    ...makeTrafficDensity(['north', 'south'], 12),
    ...makeTrafficDensity(['east', 'west'], 10),
  ],
  busRoutes: [
    {
      routeId: 'bus-1',
      stops: ['int-1', 'int-2'],
      frequency: 4,
      color: '#ffd700',
    },
    {
      routeId: 'bus-2',
      stops: ['int-1', 'int-3'],
      frequency: 3,
      color: '#ff6b6b',
    },
  ],
  initialTrafficLightConfigs: makeDefaultTrafficLightConfigs(GRID_2X2_IDS).map((config) => ({
    ...config,
    busPriorityEnabled: true,
  })),
};

const level5: LevelConfig = {
  id: 'level-5',
  name: '终极挑战',
  description: '9路口网格路网，极高车流量，3条公交路线，早晚高峰切换。目标高峰期拥堵评分35以下。',
  roadLayout: 'grid-3x3',
  targetScore: 35,
  timeLimit: 300,
  trafficDensity: [
    ...makeTrafficDensity(['north', 'south'], 15, 1.5, 60, 120),
    ...makeTrafficDensity(['east', 'west'], 12, 1.5, 60, 120),
  ],
  busRoutes: [
    {
      routeId: 'bus-1',
      stops: ['int-1', 'int-2', 'int-3'],
      frequency: 5,
      color: '#ffd700',
    },
    {
      routeId: 'bus-2',
      stops: ['int-1', 'int-4', 'int-7'],
      frequency: 4,
      color: '#ff6b6b',
    },
    {
      routeId: 'bus-3',
      stops: ['int-7', 'int-8', 'int-9'],
      frequency: 3,
      color: '#4ecdc4',
    },
  ],
  initialTrafficLightConfigs: makeDefaultTrafficLightConfigs(GRID_3X3_IDS).map((config) => ({
    ...config,
    busPriorityEnabled: true,
  })),
};

const sandbox: LevelConfig = {
  id: 'sandbox',
  name: '沙盒模式',
  description: '自由模式，可调整所有参数。无胜负限制，尽情实验不同的信号灯配时方案。',
  roadLayout: 'grid-3x3',
  targetScore: 0,
  timeLimit: 0,
  trafficDensity: [
    ...makeTrafficDensity(['north', 'south'], 10),
    ...makeTrafficDensity(['east', 'west'], 10),
  ],
  busRoutes: [
    {
      routeId: 'bus-1',
      stops: ['int-1', 'int-2', 'int-3'],
      frequency: 4,
      color: '#ffd700',
    },
    {
      routeId: 'bus-2',
      stops: ['int-1', 'int-4', 'int-7'],
      frequency: 3,
      color: '#ff6b6b',
    },
    {
      routeId: 'bus-3',
      stops: ['int-7', 'int-8', 'int-9'],
      frequency: 2,
      color: '#4ecdc4',
    },
  ],
  initialTrafficLightConfigs: makeDefaultTrafficLightConfigs(GRID_3X3_IDS),
};

export const LEVELS: LevelConfig[] = [tutorial, level1, level2, level3, level4, level5, sandbox];

export const LEVEL_MAP: Record<string, LevelConfig> = Object.fromEntries(
  LEVELS.map((level) => [level.id, level]),
);

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVEL_MAP[id];
}

export function getIntersectionIds(layout: LevelConfig['roadLayout']): string[] {
  switch (layout) {
    case 'single':
      return SINGLE_IDS;
    case 'double':
      return DOUBLE_IDS;
    case 'grid-2x2':
      return GRID_2X2_IDS;
    case 'grid-3x3':
      return GRID_3X3_IDS;
  }
}

export function getIntersectionCount(layout: LevelConfig['roadLayout']): number {
  return getIntersectionIds(layout).length;
}
