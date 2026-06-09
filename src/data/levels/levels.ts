import type { LevelConfig } from '@/types';

const defaultRoadNetwork = {
  intersections: [
    { id: 'int_main', position: { x: 0, z: 0 }, size: 16 },
  ],
  roads: [
    {
      id: 'road_ns_1',
      from: { x: 0, z: -80 },
      to: { x: 0, z: 80 },
      lanes: 4,
      direction: 'V' as const,
    },
    {
      id: 'road_ew_1',
      from: { x: -80, z: 0 },
      to: { x: 80, z: 0 },
      lanes: 4,
      direction: 'H' as const,
    },
  ],
};

export const LEVELS: LevelConfig[] = [
  {
    id: 'level_1',
    name: '初识信号灯',
    description: '欢迎来到星城第一路口！学习调节红绿灯周期，让车流顺畅通过。',
    difficulty: 1,
    unlockRequirement: null,
    roadNetwork: defaultRoadNetwork,
    spawnPatterns: [
      {
        time: 0,
        duration: 60,
        rate: 0.8,
        directionBias: { N: 0.3, S: 0.3, E: 0.2, W: 0.2 },
        busRate: 0.03,
        taxiRate: 0.1,
      },
    ],
    duration: 60,
    targetConditions: [
      {
        type: 'congestion_below',
        value: 45,
        description: '拥堵指数低于 45',
      },
      {
        type: 'avg_wait_below',
        value: 25,
        description: '平均等待时间低于 25 秒',
      },
    ],
    newRules: [
      {
        ruleId: 'basic_timing',
        title: '信号灯基础',
        description: '调节南北/东西绿灯时长，平衡双向车流。',
        uiHighlight: 'timing-sliders',
      },
    ],
    initialPhaseConfig: {
      nsGreen: 20,
      ewGreen: 20,
      yellow: 3,
      allRed: 2,
      busPriority: false,
      busThreshold: 3,
    },
    tutorialSteps: [
      {
        id: 1,
        title: '欢迎来到信号灯模拟！',
        description:
          '在这个游戏中，你将扮演交通工程师，通过调整信号灯配时来优化路口通行效率。',
        position: 'center',
      },
      {
        id: 2,
        title: '调节绿灯时长',
        description:
          '试试拖动左侧的滑块，调整「南北绿灯」和「东西绿灯」的时长。配时会影响路口的拥堵程度。',
        highlightElement: 'timing-sliders',
        position: 'left',
      },
      {
        id: 3,
        title: '应用配时 & 观察',
        description:
          '点击「应用配时」按钮开始模拟。观察 3D 场景中的车流变化，底部 HUD 会实时显示拥堵指标。',
        highlightElement: 'apply-button',
        position: 'left',
      },
      {
        id: 4,
        title: '达成目标',
        description:
          '每关都有通关目标，确保拥堵指数和等待时间在目标值以内即可过关！如果失败，可以多次重试优化策略。',
        position: 'center',
      },
    ],
  },
  {
    id: 'level_2',
    name: '早高峰挑战',
    description: '早高峰到来，南北方向车流激增。学会根据潮汐交通分配绿灯时长。',
    difficulty: 2,
    unlockRequirement: 'level_1',
    roadNetwork: defaultRoadNetwork,
    spawnPatterns: [
      {
        time: 0,
        duration: 20,
        rate: 0.6,
        directionBias: { N: 0.2, S: 0.2, E: 0.3, W: 0.3 },
        busRate: 0.03,
        taxiRate: 0.1,
      },
      {
        time: 20,
        duration: 40,
        rate: 1.6,
        directionBias: { N: 0.45, S: 0.45, E: 0.05, W: 0.05 },
        busRate: 0.08,
        taxiRate: 0.15,
      },
      {
        time: 60,
        duration: 20,
        rate: 0.9,
        directionBias: { N: 0.3, S: 0.3, E: 0.2, W: 0.2 },
        busRate: 0.05,
        taxiRate: 0.1,
      },
    ],
    duration: 80,
    targetConditions: [
      {
        type: 'congestion_below',
        value: 55,
        description: '拥堵指数低于 55',
      },
      {
        type: 'avg_wait_below',
        value: 30,
        description: '平均等待时间低于 30 秒',
      },
      {
        type: 'throughput_above',
        value: 60,
        description: '至少通过 60 辆车',
      },
    ],
    newRules: [
      {
        ruleId: 'peak_hour',
        title: '潮汐交通',
        description: '高峰时段车流方向会集中，需要根据时间变化调整配时。',
        uiHighlight: 'time-indicator',
      },
    ],
    initialPhaseConfig: {
      nsGreen: 25,
      ewGreen: 15,
      yellow: 3,
      allRed: 2,
      busPriority: false,
      busThreshold: 3,
    },
  },
  {
    id: 'level_3',
    name: '公交优先',
    description: '新开通了公交路线！启用公交优先功能，确保公交准点率达标。',
    difficulty: 3,
    unlockRequirement: 'level_2',
    roadNetwork: defaultRoadNetwork,
    spawnPatterns: [
      {
        time: 0,
        duration: 90,
        rate: 1.2,
        directionBias: { N: 0.3, S: 0.3, E: 0.2, W: 0.2 },
        busRate: 0.12,
        taxiRate: 0.1,
      },
    ],
    duration: 90,
    targetConditions: [
      {
        type: 'congestion_below',
        value: 50,
        description: '拥堵指数低于 50',
      },
      {
        type: 'avg_wait_below',
        value: 28,
        description: '平均等待时间低于 28 秒',
      },
      {
        type: 'bus_on_time_above',
        value: 80,
        description: '公交准点率不低于 80%',
      },
    ],
    newRules: [
      {
        ruleId: 'bus_priority',
        title: '公交优先',
        description:
          '开启公交优先开关，当公交车排队超过阈值时，信号灯会自动给公交方向延长绿灯。',
        uiHighlight: 'bus-priority',
      },
    ],
    initialPhaseConfig: {
      nsGreen: 22,
      ewGreen: 22,
      yellow: 3,
      allRed: 2,
      busPriority: true,
      busThreshold: 2,
    },
  },
  {
    id: 'level_4',
    name: '晚高峰考验',
    description: '晚高峰车流汹涌，东西方向大流量+公交密集，考验你的综合配时能力！',
    difficulty: 4,
    unlockRequirement: 'level_3',
    roadNetwork: defaultRoadNetwork,
    spawnPatterns: [
      {
        time: 0,
        duration: 30,
        rate: 1.0,
        directionBias: { N: 0.25, S: 0.25, E: 0.25, W: 0.25 },
        busRate: 0.06,
        taxiRate: 0.12,
      },
      {
        time: 30,
        duration: 60,
        rate: 2.0,
        directionBias: { N: 0.1, S: 0.1, E: 0.4, W: 0.4 },
        busRate: 0.15,
        taxiRate: 0.18,
      },
      {
        time: 90,
        duration: 30,
        rate: 1.2,
        directionBias: { N: 0.25, S: 0.25, E: 0.25, W: 0.25 },
        busRate: 0.08,
        taxiRate: 0.1,
      },
    ],
    duration: 120,
    targetConditions: [
      {
        type: 'congestion_below',
        value: 60,
        description: '拥堵指数低于 60',
      },
      {
        type: 'avg_wait_below',
        value: 35,
        description: '平均等待时间低于 35 秒',
      },
      {
        type: 'bus_on_time_above',
        value: 75,
        description: '公交准点率不低于 75%',
      },
      {
        type: 'throughput_above',
        value: 150,
        description: '至少通过 150 辆车',
      },
    ],
    newRules: [
      {
        ruleId: 'advanced',
        title: '综合策略',
        description: '综合运用配时调节和公交优先，应对复杂的晚高峰交通流。',
        uiHighlight: 'replay-panel',
      },
    ],
    initialPhaseConfig: {
      nsGreen: 18,
      ewGreen: 28,
      yellow: 3,
      allRed: 2,
      busPriority: true,
      busThreshold: 3,
    },
  },
  {
    id: 'level_5',
    name: '终极大师',
    description: '最终挑战：不规则车流、突发高峰、公交高要求。证明你是真正的交通大师！',
    difficulty: 5,
    unlockRequirement: 'level_4',
    roadNetwork: defaultRoadNetwork,
    spawnPatterns: [
      {
        time: 0,
        duration: 25,
        rate: 0.8,
        directionBias: { N: 0.3, S: 0.2, E: 0.3, W: 0.2 },
        busRate: 0.04,
        taxiRate: 0.1,
      },
      {
        time: 25,
        duration: 35,
        rate: 2.2,
        directionBias: { N: 0.5, S: 0.1, E: 0.3, W: 0.1 },
        busRate: 0.18,
        taxiRate: 0.2,
      },
      {
        time: 60,
        duration: 30,
        rate: 1.4,
        directionBias: { N: 0.1, S: 0.4, E: 0.1, W: 0.4 },
        busRate: 0.12,
        taxiRate: 0.12,
      },
      {
        time: 90,
        duration: 60,
        rate: 2.4,
        directionBias: { N: 0.15, S: 0.15, E: 0.35, W: 0.35 },
        busRate: 0.2,
        taxiRate: 0.2,
      },
    ],
    duration: 150,
    targetConditions: [
      {
        type: 'congestion_below',
        value: 55,
        description: '拥堵指数低于 55',
      },
      {
        type: 'avg_wait_below',
        value: 32,
        description: '平均等待时间低于 32 秒',
      },
      {
        type: 'bus_on_time_above',
        value: 82,
        description: '公交准点率不低于 82%',
      },
      {
        type: 'throughput_above',
        value: 240,
        description: '至少通过 240 辆车',
      },
    ],
    newRules: [],
    initialPhaseConfig: {
      nsGreen: 20,
      ewGreen: 20,
      yellow: 3,
      allRed: 2,
      busPriority: true,
      busThreshold: 2,
    },
  },
];

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVELS.find((l) => l.id === id);
}

export const SANDBOX_LEVEL: LevelConfig = {
  id: 'sandbox',
  name: '沙盒模式',
  description: '自由调节所有参数，无通关目标，尽情实验配时策略。',
  difficulty: 0,
  unlockRequirement: null,
  roadNetwork: defaultRoadNetwork,
  spawnPatterns: [
    {
      time: 0,
      duration: 999,
      rate: 1.2,
      directionBias: { N: 0.25, S: 0.25, E: 0.25, W: 0.25 },
      busRate: 0.08,
      taxiRate: 0.12,
    },
  ],
  duration: 999,
  targetConditions: [],
  newRules: [],
  initialPhaseConfig: {
    nsGreen: 20,
    ewGreen: 20,
    yellow: 3,
    allRed: 2,
    busPriority: false,
    busThreshold: 3,
  },
};

LEVELS.push(SANDBOX_LEVEL);

export function getNextLevelId(currentId: string): string | null {
  const idx = LEVELS.findIndex((l) => l.id === currentId);
  if (idx === -1 || idx >= LEVELS.length - 1) return null;
  return LEVELS[idx + 1].id;
}
