export const LEVELS = {
  level_1: {
    id: 'level_1',
    name: '新手路口',
    description: '单十字路口，早晚高峰车流量适中。学习信号灯周期调整。',
    difficulty: 1,
    duration: 120,
    gridSize: { cols: 3, rows: 3 },
    intersections: [
      { id: 'int_0', x: 0, z: 0, name: '中心路口' }
    ],
    trafficConfig: {
      baseSpawnRate: 0.8,
      morningPeak: { start: 15, end: 45, multiplier: 2.2 },
      eveningPeak: { start: 75, end: 105, multiplier: 2.4 },
      carRatio: 0.8,
      busRatio: 0.2
    },
    busRoutes: [
      { id: 'bus_1', stops: ['spawn_n', 'int_0', 'spawn_s'], interval: 30, color: 0xff6b6b }
    ],
    goals: {
      threeStar: { avgSpeed: 35, congestionIndex: 20, busOnTime: 90 },
      twoStar: { avgSpeed: 28, congestionIndex: 35, busOnTime: 80 },
      oneStar: { avgSpeed: 20, congestionIndex: 50, busOnTime: 70 }
    },
    failCondition: {
      maxCongestion: 80,
      duration: 15
    },
    tutorialHints: [
      '调整信号灯周期（30-120秒）平衡各方向等待',
      '观察早晚高峰时段车流量增加',
      '拥堵指数超过80持续15秒将失败'
    ]
  },
  level_2: {
    id: 'level_2',
    name: '双路口挑战',
    description: '两个相邻路口，需协调相位差避免连环拥堵。',
    difficulty: 2,
    duration: 150,
    gridSize: { cols: 5, rows: 3 },
    intersections: [
      { id: 'int_0', x: -20, z: 0, name: '西路口' },
      { id: 'int_1', x: 20, z: 0, name: '东路口' }
    ],
    trafficConfig: {
      baseSpawnRate: 1.0,
      morningPeak: { start: 20, end: 55, multiplier: 2.5 },
      eveningPeak: { start: 90, end: 125, multiplier: 2.8 },
      carRatio: 0.78,
      busRatio: 0.22
    },
    busRoutes: [
      { id: 'bus_1', stops: ['spawn_w', 'int_0', 'int_1', 'spawn_e'], interval: 25, color: 0xff6b6b },
      { id: 'bus_2', stops: ['spawn_n', 'int_0', 'spawn_s'], interval: 40, color: 0x7ee8fa }
    ],
    goals: {
      threeStar: { avgSpeed: 33, congestionIndex: 22, busOnTime: 88 },
      twoStar: { avgSpeed: 26, congestionIndex: 38, busOnTime: 78 },
      oneStar: { avgSpeed: 18, congestionIndex: 52, busOnTime: 68 }
    },
    failCondition: {
      maxCongestion: 82,
      duration: 12
    },
    tutorialHints: [
      '两个路口间距仅40米，需协调绿灯时间',
      '东西方向为主干道，优先保证畅通',
      '公交优先可提升公交准点率评分'
    ]
  },
  level_3: {
    id: 'level_3',
    name: '商业中心',
    description: 'T字路口+十字路口，商圈周边车流复杂，公交密集。',
    difficulty: 3,
    duration: 180,
    gridSize: { cols: 5, rows: 5 },
    intersections: [
      { id: 'int_0', x: 0, z: 0, name: '中心广场' },
      { id: 'int_1', x: 0, z: 30, name: '北商业街' }
    ],
    trafficConfig: {
      baseSpawnRate: 1.3,
      morningPeak: { start: 20, end: 60, multiplier: 2.4 },
      eveningPeak: { start: 100, end: 150, multiplier: 3.0 },
      carRatio: 0.72,
      busRatio: 0.28
    },
    busRoutes: [
      { id: 'bus_1', stops: ['spawn_s', 'int_0', 'int_1', 'spawn_n'], interval: 20, color: 0xff6b6b },
      { id: 'bus_2', stops: ['spawn_w', 'int_0', 'spawn_e'], interval: 28, color: 0x7ee8fa },
      { id: 'bus_3', stops: ['spawn_sw', 'int_0', 'int_1', 'spawn_ne'], interval: 45, color: 0xffd93d }
    ],
    goals: {
      threeStar: { avgSpeed: 30, congestionIndex: 25, busOnTime: 85 },
      twoStar: { avgSpeed: 24, congestionIndex: 40, busOnTime: 75 },
      oneStar: { avgSpeed: 17, congestionIndex: 55, busOnTime: 65 }
    },
    failCondition: {
      maxCongestion: 85,
      duration: 10
    },
    tutorialHints: [
      '商圈周边晚高峰更严重（100-150秒）',
      '启用公交优先提升公交准点率',
      '合理分配各方向绿灯时长'
    ]
  },
  level_4: {
    id: 'level_4',
    name: '快速路出口',
    description: '高速出口连接城区，潮汐车流明显，入口匝道易排队。',
    difficulty: 4,
    duration: 200,
    gridSize: { cols: 7, rows: 3 },
    intersections: [
      { id: 'int_0', x: -40, z: 0, name: '高速出口' },
      { id: 'int_1', x: 0, z: 0, name: '中环路' },
      { id: 'int_2', x: 40, z: 0, name: '城区入口' }
    ],
    trafficConfig: {
      baseSpawnRate: 1.5,
      morningPeak: { start: 25, end: 75, multiplier: 3.2 },
      eveningPeak: { start: 120, end: 170, multiplier: 2.8 },
      carRatio: 0.75,
      busRatio: 0.25
    },
    busRoutes: [
      { id: 'bus_1', stops: ['spawn_w', 'int_0', 'int_1', 'int_2', 'spawn_e'], interval: 22, color: 0xff6b6b },
      { id: 'bus_2', stops: ['spawn_n', 'int_1', 'spawn_s'], interval: 35, color: 0x7ee8fa }
    ],
    goals: {
      threeStar: { avgSpeed: 32, congestionIndex: 28, busOnTime: 85 },
      twoStar: { avgSpeed: 25, congestionIndex: 42, busOnTime: 75 },
      oneStar: { avgSpeed: 18, congestionIndex: 58, busOnTime: 65 }
    },
    failCondition: {
      maxCongestion: 88,
      duration: 10
    },
    tutorialHints: [
      '早高峰西向东为主，晚高峰相反',
      '绿波协调可大幅提升干道通行',
      '匝道汇入区域需额外关注'
    ]
  },
  level_5: {
    id: 'level_5',
    name: '城市核心区',
    description: '四路口网络，综合考验信号协调与公交优先策略。',
    difficulty: 5,
    duration: 240,
    gridSize: { cols: 5, rows: 5 },
    intersections: [
      { id: 'int_0', x: -20, z: -20, name: '西南路口' },
      { id: 'int_1', x: 20, z: -20, name: '东南路口' },
      { id: 'int_2', x: -20, z: 20, name: '西北路口' },
      { id: 'int_3', x: 20, z: 20, name: '东北路口' }
    ],
    trafficConfig: {
      baseSpawnRate: 1.8,
      morningPeak: { start: 30, end: 90, multiplier: 2.8 },
      eveningPeak: { start: 140, end: 200, multiplier: 3.2 },
      carRatio: 0.7,
      busRatio: 0.3
    },
    busRoutes: [
      { id: 'bus_1', stops: ['spawn_w', 'int_2', 'int_3', 'spawn_e'], interval: 20, color: 0xff6b6b },
      { id: 'bus_2', stops: ['spawn_s', 'int_0', 'int_1', 'spawn_e'], interval: 25, color: 0x7ee8fa },
      { id: 'bus_3', stops: ['spawn_s', 'int_0', 'int_2', 'spawn_n'], interval: 28, color: 0xffd93d },
      { id: 'bus_4', stops: ['spawn_sw', 'int_0', 'int_3', 'spawn_ne'], interval: 40, color: 0x49c77e }
    ],
    goals: {
      threeStar: { avgSpeed: 28, congestionIndex: 30, busOnTime: 82 },
      twoStar: { avgSpeed: 22, congestionIndex: 45, busOnTime: 72 },
      oneStar: { avgSpeed: 16, congestionIndex: 60, busOnTime: 62 }
    },
    failCondition: {
      maxCongestion: 90,
      duration: 8
    },
    tutorialHints: [
      '核心区车流交织，需全面协调',
      '四条公交线，优先策略至关重要',
      '注意各方向流量平衡'
    ]
  }
};

function _generateSimpleRoads() {
  return [
    { from: 'spawn_n', to: 'int_0', dir: 's', lanes: 2 },
    { from: 'int_0', to: 'spawn_s', dir: 's', lanes: 2 },
    { from: 'spawn_s', to: 'int_0', dir: 'n', lanes: 2 },
    { from: 'int_0', to: 'spawn_n', dir: 'n', lanes: 2 },
    { from: 'spawn_e', to: 'int_0', dir: 'w', lanes: 2 },
    { from: 'int_0', to: 'spawn_e', dir: 'e', lanes: 2 },
    { from: 'spawn_w', to: 'int_0', dir: 'e', lanes: 2 },
    { from: 'int_0', to: 'spawn_w', dir: 'w', lanes: 2 }
  ];
}

LEVELS.level_1.roads = _generateSimpleRoads();

export function getLevel(id) {
  return LEVELS[id] || null;
}

export function listLevels() {
  return Object.values(LEVELS);
}

export function getDifficultyStars(difficulty) {
  return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
}
