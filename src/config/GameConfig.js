import { deepClone } from '../core/Utils.js';
export { GAME_STATES } from '../core/StateMachine.js';

export const PRIORITY = Object.freeze({
  HIGH: 'high',
  MID: 'mid',
  LOW: 'low',
});

export const RESOURCE_TYPE = Object.freeze({
  REPAIR_TEAM: 'repair_team',
  POWER_CREW: 'power_crew',
  SUPPLY_TRUCK: 'supply_truck',
  POLICE: 'police',
  FIRE_TRUCK: 'fire_truck',
});

export const BUILDING_TYPE = Object.freeze({
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  HOSPITAL: 'hospital',
  SCHOOL: 'school',
  POWER_PLANT: 'power_plant',
  SUBSTATION: 'substation',
  WATER_TOWER: 'water_tower',
  ROAD: 'road',
  INTERSECTION: 'intersection',
  WAREHOUSE: 'warehouse',
});

export const TASK_TYPE = Object.freeze({
  POWER_RESTORE: 'power_restore',
  FLOOD_CLEAR: 'flood_clear',
  TRAFFIC_CLEAR: 'traffic_clear',
  SUPPLY_DELIVER: 'supply_deliver',
  ROAD_REPAIR: 'road_repair',
  FIRE_SUPPRESS: 'fire_suppress',
});

export const DISASTER_TYPE = Object.freeze({
  RAINSTORM: 'rainstorm',
  BLACKOUT: 'blackout',
  TRAFFIC_JAM: 'traffic_jam',
  FLOOD: 'flood',
  FIRE: 'fire',
});

const BASE_CONFIG = {
  game: {
    tickRate: 60,
    timeScale: 1.0,
    minSatisfaction: 0,
    maxSatisfaction: 100,
    startSatisfaction: 80,
    failSatisfaction: 20,
    starThresholds: [60, 75, 90],
  },
  economy: {
    startBudget: 5000,
    dispatchCostMultiplier: 1.0,
    overtimeCostRate: 0.5,
    taskCompleteBonus: 1.0,
    failPenaltyRate: 1.5,
  },
  resources: {
    [RESOURCE_TYPE.REPAIR_TEAM]: {
      name: '维修队', icon: '🔧', color: '#38bdf8',
      baseSpeed: 80, baseCost: 200, workSpeed: 1.0, capacity: 3,
      skills: { road_repair: 1.2, flood_clear: 0.8 },
    },
    [RESOURCE_TYPE.POWER_CREW]: {
      name: '电力组', icon: '⚡', color: '#facc15',
      baseSpeed: 70, baseCost: 300, workSpeed: 1.0, capacity: 2,
      skills: { power_restore: 1.5 },
    },
    [RESOURCE_TYPE.SUPPLY_TRUCK]: {
      name: '物资车', icon: '📦', color: '#4ade80',
      baseSpeed: 60, baseCost: 150, workSpeed: 1.0, capacity: 10,
      skills: { supply_deliver: 1.3 },
    },
    [RESOURCE_TYPE.POLICE]: {
      name: '交警', icon: '🚓', color: '#a78bfa',
      baseSpeed: 90, baseCost: 250, workSpeed: 1.0, capacity: 4,
      skills: { traffic_clear: 1.4 },
    },
    [RESOURCE_TYPE.FIRE_TRUCK]: {
      name: '消防车', icon: '🚒', color: '#ef4444',
      baseSpeed: 85, baseCost: 400, workSpeed: 1.0, capacity: 5,
      skills: { fire_suppress: 1.5, flood_clear: 0.9 },
    },
  },
  tasks: {
    [TASK_TYPE.POWER_RESTORE]: {
      name: '恢复供电', desc: '紧急修复电力设施', color: '#facc15',
      baseWorkload: 100, baseTimeLimit: 120, baseReward: 500,
      requiredResource: RESOURCE_TYPE.POWER_CREW,
      satisfactionLossPerSec: 0.15, scoreMultiplier: 1.5,
    },
    [TASK_TYPE.FLOOD_CLEAR]: {
      name: '排涝作业', desc: '清理道路积水，保障通行', color: '#38bdf8',
      baseWorkload: 120, baseTimeLimit: 150, baseReward: 450,
      requiredResource: RESOURCE_TYPE.FIRE_TRUCK,
      altResource: RESOURCE_TYPE.REPAIR_TEAM,
      satisfactionLossPerSec: 0.12, scoreMultiplier: 1.3,
    },
    [TASK_TYPE.TRAFFIC_CLEAR]: {
      name: '疏导交通', desc: '清除交通堵塞，恢复通行', color: '#a78bfa',
      baseWorkload: 60, baseTimeLimit: 90, baseReward: 300,
      requiredResource: RESOURCE_TYPE.POLICE,
      satisfactionLossPerSec: 0.2, scoreMultiplier: 1.2,
    },
    [TASK_TYPE.SUPPLY_DELIVER]: {
      name: '物资配送', desc: '向受灾区域运送紧急物资', color: '#4ade80',
      baseWorkload: 80, baseTimeLimit: 180, baseReward: 400,
      requiredResource: RESOURCE_TYPE.SUPPLY_TRUCK,
      satisfactionLossPerSec: 0.08, scoreMultiplier: 1.4,
    },
    [TASK_TYPE.ROAD_REPAIR]: {
      name: '道路维修', desc: '修复受损路面与桥梁', color: '#f97316',
      baseWorkload: 150, baseTimeLimit: 200, baseReward: 550,
      requiredResource: RESOURCE_TYPE.REPAIR_TEAM,
      satisfactionLossPerSec: 0.10, scoreMultiplier: 1.2,
    },
    [TASK_TYPE.FIRE_SUPPRESS]: {
      name: '消防灭火', desc: '扑灭火灾，控制火势蔓延', color: '#ef4444',
      baseWorkload: 100, baseTimeLimit: 80, baseReward: 600,
      requiredResource: RESOURCE_TYPE.FIRE_TRUCK,
      satisfactionLossPerSec: 0.3, scoreMultiplier: 1.8,
    },
  },
  disasters: {
    [DISASTER_TYPE.RAINSTORM]: {
      name: '暴雨', icon: '🌧️', color: '#38bdf8',
      globalEffect: { allSpeedMod: 0.7, roadSpeedMod: 0.6 },
      taskWeights: { flood_clear: 2, road_repair: 1, power_restore: 0.5 },
      spawnRate: 0.08,
      description: '暴雨侵袭，通行速度下降，易产生内涝',
    },
    [DISASTER_TYPE.BLACKOUT]: {
      name: '大面积停电', icon: '💡', color: '#facc15',
      globalEffect: { visibilityMod: 0.5, buildingSatisfactionMod: 0.8 },
      taskWeights: { power_restore: 3, traffic_clear: 1 },
      spawnRate: 0.06,
      description: '城市电网瘫痪，急需恢复供电',
    },
    [DISASTER_TYPE.TRAFFIC_JAM]: {
      name: '全城拥堵', icon: '🚧', color: '#a78bfa',
      globalEffect: { allSpeedMod: 0.5, roadSpeedMod: 0.4 },
      taskWeights: { traffic_clear: 3, supply_deliver: 1 },
      spawnRate: 0.07,
      description: '交通瘫痪，所有资源移动速度大幅下降',
    },
    [DISASTER_TYPE.FLOOD]: {
      name: '洪水', icon: '🌊', color: '#0ea5e9',
      globalEffect: { allSpeedMod: 0.55, roadRepairMod: 0.7 },
      taskWeights: { flood_clear: 3, road_repair: 2, supply_deliver: 1 },
      spawnRate: 0.05,
      description: '洪水淹没大片区域',
    },
    [DISASTER_TYPE.FIRE]: {
      name: '火灾', icon: '🔥', color: '#ef4444',
      globalEffect: { fireRiskMod: 1.5 },
      taskWeights: { fire_suppress: 3, power_restore: 1 },
      spawnRate: 0.04,
      description: '火灾蔓延，需紧急扑灭',
    },
  },
  audio: {
    masterVolume: 0.7,
    sfxVolume: 0.6,
    bgmVolume: 0.3,
    muted: false,
  },
  visual: {
    gridSize: 40,
    roadWidth: 14,
    buildingSize: { min: 30, max: 70 },
    animationSpeed: 1.0,
    particleDensity: 1.0,
  },
  controls: {
    enableKeyboard: true,
    enableGamepad: true,
    enableTouch: true,
    panSpeed: 400,
    zoomSpeed: 0.1,
  },
};

const LEVELS = [
  {
    id: 1, name: '初露锋芒', difficulty: 1,
    description: '学习基础调度操作，应对小型突发事件',
    duration: 180,
    targetSatisfaction: 50,
    targetCompletedTasks: 5,
    resources: [
      { type: RESOURCE_TYPE.REPAIR_TEAM, count: 1 },
      { type: RESOURCE_TYPE.SUPPLY_TRUCK, count: 1 },
      { type: RESOURCE_TYPE.POLICE, count: 1 },
    ],
    disasters: [DISASTER_TYPE.TRAFFIC_JAM],
    disasterInterval: 45,
    taskSpawnInterval: 20,
    maxConcurrentTasks: 4,
    citySize: { buildings: 12, roads: 8 },
  },
  {
    id: 2, name: '风雨欲来', difficulty: 2,
    description: '面对持续性暴雨，管理积水与电力故障',
    duration: 240,
    targetSatisfaction: 55,
    targetCompletedTasks: 8,
    resources: [
      { type: RESOURCE_TYPE.REPAIR_TEAM, count: 2 },
      { type: RESOURCE_TYPE.POWER_CREW, count: 1 },
      { type: RESOURCE_TYPE.SUPPLY_TRUCK, count: 1 },
      { type: RESOURCE_TYPE.FIRE_TRUCK, count: 1 },
    ],
    disasters: [DISASTER_TYPE.RAINSTORM, DISASTER_TYPE.BLACKOUT],
    disasterInterval: 40,
    taskSpawnInterval: 15,
    maxConcurrentTasks: 5,
    citySize: { buildings: 18, roads: 12 },
  },
  {
    id: 3, name: '危机四伏', difficulty: 3,
    description: '多重灾害同时袭来，考验你的统筹能力',
    duration: 300,
    targetSatisfaction: 60,
    targetCompletedTasks: 12,
    resources: [
      { type: RESOURCE_TYPE.REPAIR_TEAM, count: 2 },
      { type: RESOURCE_TYPE.POWER_CREW, count: 2 },
      { type: RESOURCE_TYPE.SUPPLY_TRUCK, count: 2 },
      { type: RESOURCE_TYPE.POLICE, count: 2 },
      { type: RESOURCE_TYPE.FIRE_TRUCK, count: 1 },
    ],
    disasters: [DISASTER_TYPE.RAINSTORM, DISASTER_TYPE.BLACKOUT, DISASTER_TYPE.TRAFFIC_JAM],
    disasterInterval: 35,
    taskSpawnInterval: 12,
    maxConcurrentTasks: 6,
    citySize: { buildings: 24, roads: 16 },
  },
  {
    id: 4, name: '水火交加', difficulty: 4,
    description: '洪水与火灾同时出现，每一个决定都至关重要',
    duration: 360,
    targetSatisfaction: 65,
    targetCompletedTasks: 16,
    resources: [
      { type: RESOURCE_TYPE.REPAIR_TEAM, count: 3 },
      { type: RESOURCE_TYPE.POWER_CREW, count: 2 },
      { type: RESOURCE_TYPE.SUPPLY_TRUCK, count: 2 },
      { type: RESOURCE_TYPE.POLICE, count: 2 },
      { type: RESOURCE_TYPE.FIRE_TRUCK, count: 2 },
    ],
    disasters: [DISASTER_TYPE.FLOOD, DISASTER_TYPE.FIRE, DISASTER_TYPE.BLACKOUT],
    disasterInterval: 30,
    taskSpawnInterval: 10,
    maxConcurrentTasks: 7,
    citySize: { buildings: 30, roads: 20 },
  },
  {
    id: 5, name: '终极考验', difficulty: 5,
    description: '最恶劣的情况，你能拯救这座城市吗？',
    duration: 420,
    targetSatisfaction: 70,
    targetCompletedTasks: 22,
    resources: [
      { type: RESOURCE_TYPE.REPAIR_TEAM, count: 3 },
      { type: RESOURCE_TYPE.POWER_CREW, count: 3 },
      { type: RESOURCE_TYPE.SUPPLY_TRUCK, count: 3 },
      { type: RESOURCE_TYPE.POLICE, count: 3 },
      { type: RESOURCE_TYPE.FIRE_TRUCK, count: 2 },
    ],
    disasters: Object.values(DISASTER_TYPE),
    disasterInterval: 25,
    taskSpawnInterval: 8,
    maxConcurrentTasks: 9,
    citySize: { buildings: 36, roads: 24 },
  },
];

export class ConfigManager {
  constructor() {
    this.config = deepClone(BASE_CONFIG);
    this.levels = deepClone(LEVELS);
  }

  get(key) {
    if (!key) return this.config;
    return key.split('.').reduce((acc, k) => acc?.[k], this.config);
  }

  set(key, value) {
    const keys = key.split('.');
    const last = keys.pop();
    const target = keys.reduce((acc, k) => {
      if (!acc[k]) acc[k] = {};
      return acc[k];
    }, this.config);
    target[last] = value;
  }

  getLevel(id) {
    return this.levels.find(l => l.id === id) || this.levels[0];
  }

  getLevelCount() { return this.levels.length; }

  getResourceDef(type) { return this.config.resources[type]; }
  getTaskDef(type) { return this.config.tasks[type]; }
  getDisasterDef(type) { return this.config.disasters[type]; }

  getPriorityWeight(p) {
    return { high: 2.5, mid: 1.5, low: 1.0 }[p] ?? 1.0;
  }

  getPriorityColor(p) {
    return { high: '#ef4444', mid: '#f59e0b', low: '#22c55e' }[p] ?? '#64748b';
  }

  getPriorityLabel(p) {
    return { high: '紧急', mid: '重要', low: '普通' }[p] ?? '普通';
  }

  getStarsFromScore(score, levelId) {
    const level = this.getLevel(levelId);
    const thresholds = this.config.game.starThresholds;
    if (score >= thresholds[2] + level.difficulty * 2) return 3;
    if (score >= thresholds[1] + level.difficulty) return 2;
    if (score >= thresholds[0]) return 1;
    return 0;
  }
}

export const configManager = new ConfigManager();
export { BASE_CONFIG, LEVELS };
