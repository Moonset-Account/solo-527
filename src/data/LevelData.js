export const LEVEL_DATA = [
  {
    id: 'level_01',
    name: '新手入门 - 单线对接',
    description: '学习最基本的轨道切换，让两列客运列车顺序通过单线区段。',
    difficulty: 1,
    stars: 3,
    parTime: 120,
    unlockCondition: null,
    tutorialLevel: true,
    tutorialSteps: [
      { id: 1, title: '欢迎来到铁路调度中心', text: '你是一名铁路调度员。你的任务是切换轨道、安排车次，让所有列车准点到达目的地。' },
      { id: 2, title: '认识信号灯', text: '点击信号灯可以切换：红→黄→绿。红灯表示禁止通行，绿灯表示允许通行。' },
      { id: 3, title: '切换道岔', text: '蓝色闪烁的节点是道岔，点击它可以切换轨道方向。让我们先切换道岔！' },
      { id: 4, title: '调整优先级', text: '在车次表中点击列车可以调整优先级。优先级高的列车会被优先放行。' },
      { id: 5, title: '开始调度', text: '点击开始按钮，让列车出发！注意观察，避免冲突！' }
    ],
    objectives: [
      { id: 'obj1', description: '让2列列车全部到达', target: 2, type: 'trains_completed' },
      { id: 'obj2', description: '无严重冲突', target: 0, type: 'critical_conflicts' },
      { id: 'obj3', description: '正点率 ≥ 90%', target: 90, type: 'on_time_rate' }
    ],
    starConditions: [
      { stars: 1, description: '完成关卡', condition: { type: 'complete', value: true } },
      { stars: 2, description: '正点率 ≥ 80%', condition: { type: 'on_time_rate', value: 80 } },
      { stars: 3, description: '无冲突且全部正点', condition: { type: 'perfect', value: true } }
    ],
    layout: {
      offsetX: 100,
      offsetY: 150,
      tileSize: 64
    },
    nodes: [
      { id: 'N1', type: 'spawn', gridX: 0, gridY: 1, connections: ['N2'], label: 'A入口' },
      { id: 'N2', type: 'normal', gridX: 1, gridY: 1, connections: ['N1', 'N3'] },
      { id: 'N3', type: 'junction', gridX: 2, gridY: 1, connections: ['N2', 'N4'], altConnections: ['N6'], isSwitch: true, switchState: 0, label: '道岔1' },
      { id: 'N4', type: 'normal', gridX: 3, gridY: 1, connections: ['N3', 'N5'] },
      { id: 'N5', type: 'terminal', gridX: 4, gridY: 1, connections: ['N4'], label: 'A出口' },
      { id: 'N6', type: 'normal', gridX: 2, gridY: 2, connections: ['N3', 'N7'] },
      { id: 'N7', type: 'platform', gridX: 3, gridY: 2, connections: ['N6', 'N8'], platformId: 'P1', platformName: '1站台' },
      { id: 'N8', type: 'terminal', gridX: 4, gridY: 2, connections: ['N7'], label: 'B出口' },
      { id: 'N9', type: 'spawn', gridX: 0, gridY: 3, connections: ['N10'], label: 'B入口' },
      { id: 'N10', type: 'normal', gridX: 1, gridY: 3, connections: ['N9', 'N11'] },
      { id: 'N11', type: 'junction', gridX: 2, gridY: 3, connections: ['N10', 'N12'], altConnections: ['N7'], isSwitch: true, switchState: 0, label: '道岔2' },
      { id: 'N12', type: 'terminal', gridX: 4, gridY: 3, connections: ['N11'], label: 'C出口' }
    ],
    signals: [
      { id: 'S1', nodeId: 'N1', state: 'red', mode: 'manual', label: 'A入口信号' },
      { id: 'S2', nodeId: 'N9', state: 'red', mode: 'manual', label: 'B入口信号' },
      { id: 'S3', nodeId: 'N3', state: 'green', mode: 'auto', label: '道岔1前信号' }
    ],
    schedules: [
      {
        id: 'T1',
        type: 'passenger',
        trainNumber: 'K101',
        name: '京通快客',
        startNodeId: 'N1',
        endNodeId: 'N5',
        scheduledDeparture: 5,
        scheduledArrival: 45,
        priority: 2
      },
      {
        id: 'T2',
        type: 'passenger',
        trainNumber: 'K202',
        name: '通州快客',
        startNodeId: 'N9',
        endNodeId: 'N8',
        targetPlatformId: 'P1',
        scheduledDeparture: 15,
        scheduledArrival: 60,
        priority: 2,
        platformWaitTime: 20
      }
    ]
  },

  {
    id: 'level_02',
    name: '双线交汇 - 优先级调度',
    description: '特快与货运列车共用线路，请合理安排优先级和通过顺序。',
    difficulty: 2,
    stars: 3,
    parTime: 180,
    unlockCondition: { type: 'level', levelId: 'level_01' },
    tutorialLevel: false,
    objectives: [
      { id: 'obj1', description: '让4列列车全部到达', target: 4, type: 'trains_completed' },
      { id: 'obj2', description: '严重冲突不超过1次', target: 1, type: 'critical_conflicts' }
    ],
    starConditions: [
      { stars: 1, description: '完成关卡', condition: { type: 'complete', value: true } },
      { stars: 2, description: '正点率 ≥ 70%', condition: { type: 'on_time_rate', value: 70 } },
      { stars: 3, description: '特快列车正点', condition: { type: 'express_on_time', value: true } }
    ],
    layout: {
      offsetX: 80,
      offsetY: 120,
      tileSize: 64
    },
    nodes: [
      { id: 'N1', type: 'spawn', gridX: 0, gridY: 0, connections: ['N2'], label: '1入口' },
      { id: 'N2', type: 'normal', gridX: 1, gridY: 0, connections: ['N1', 'N3'] },
      { id: 'N3', type: 'junction', gridX: 2, gridY: 0, connections: ['N2', 'N4'], altConnections: ['N9'], isSwitch: true, switchState: 0, label: '上行道岔' },
      { id: 'N4', type: 'normal', gridX: 3, gridY: 0, connections: ['N3', 'N5'] },
      { id: 'N5', type: 'platform', gridX: 4, gridY: 0, connections: ['N4', 'N6'], platformId: 'P1', platformName: '1站台' },
      { id: 'N6', type: 'normal', gridX: 5, gridY: 0, connections: ['N5', 'N7'] },
      { id: 'N7', type: 'junction', gridX: 6, gridY: 0, connections: ['N6', 'N8'], altConnections: ['N14'], isSwitch: true, switchState: 0, label: '出口道岔' },
      { id: 'N8', type: 'terminal', gridX: 7, gridY: 0, connections: ['N7'], label: '1出口' },

      { id: 'N9', type: 'normal', gridX: 2, gridY: 1, connections: ['N3', 'N10'] },
      { id: 'N10', type: 'normal', gridX: 3, gridY: 1, connections: ['N9', 'N11'] },
      { id: 'N11', type: 'platform', gridX: 4, gridY: 1, connections: ['N10', 'N12'], platformId: 'P2', platformName: '2站台' },
      { id: 'N12', type: 'normal', gridX: 5, gridY: 1, connections: ['N11', 'N13'] },
      { id: 'N13', type: 'normal', gridX: 6, gridY: 1, connections: ['N12', 'N7'] },
      { id: 'N14', type: 'terminal', gridX: 7, gridY: 1, connections: ['N7'], label: '2出口' },

      { id: 'N15', type: 'spawn', gridX: 0, gridY: 2, connections: ['N16'], label: '2入口' },
      { id: 'N16', type: 'normal', gridX: 1, gridY: 2, connections: ['N15', 'N17'] },
      { id: 'N17', type: 'junction', gridX: 2, gridY: 2, connections: ['N16', 'N10'], altConnections: ['N9'], isSwitch: true, switchState: 0, label: '下行道岔' }
    ],
    signals: [
      { id: 'S1', nodeId: 'N1', state: 'red', mode: 'manual', label: '1入口' },
      { id: 'S2', nodeId: 'N15', state: 'red', mode: 'manual', label: '2入口' },
      { id: 'S3', nodeId: 'N3', state: 'green', mode: 'auto', label: '上行交汇' },
      { id: 'S4', nodeId: 'N17', state: 'green', mode: 'auto', label: '下行交汇' },
      { id: 'S5', nodeId: 'N7', state: 'green', mode: 'auto', label: '出口信号' }
    ],
    schedules: [
      {
        id: 'T1',
        type: 'express',
        trainNumber: 'G101',
        name: '高铁直特',
        startNodeId: 'N1',
        endNodeId: 'N8',
        targetPlatformId: 'P1',
        scheduledDeparture: 5,
        scheduledArrival: 55,
        priority: 3,
        platformWaitTime: 15
      },
      {
        id: 'T2',
        type: 'freight',
        trainNumber: 'H501',
        name: '货运501',
        startNodeId: 'N15',
        endNodeId: 'N14',
        targetPlatformId: 'P2',
        scheduledDeparture: 10,
        scheduledArrival: 90,
        priority: 1,
        platformWaitTime: 30
      },
      {
        id: 'T3',
        type: 'passenger',
        trainNumber: 'K203',
        name: '客运203',
        startNodeId: 'N1',
        endNodeId: 'N14',
        targetPlatformId: 'P2',
        scheduledDeparture: 40,
        scheduledArrival: 110,
        priority: 2,
        platformWaitTime: 20
      },
      {
        id: 'T4',
        type: 'express',
        trainNumber: 'G102',
        name: '高铁直特2',
        startNodeId: 'N15',
        endNodeId: 'N8',
        targetPlatformId: 'P1',
        scheduledDeparture: 55,
        scheduledArrival: 130,
        priority: 3,
        platformWaitTime: 15
      }
    ]
  },

  {
    id: 'level_03',
    name: '枢纽分流 - 多站台调度',
    description: '三进三出的铁路枢纽，合理安排站台避免连锁晚点。',
    difficulty: 3,
    stars: 3,
    parTime: 240,
    unlockCondition: { type: 'level', levelId: 'level_02' },
    tutorialLevel: false,
    objectives: [
      { id: 'obj1', description: '让6列列车全部到达', target: 6, type: 'trains_completed' },
      { id: 'obj2', description: '正点率 ≥ 75%', target: 75, type: 'on_time_rate' },
      { id: 'obj3', description: '严重冲突不超过2次', target: 2, type: 'critical_conflicts' }
    ],
    starConditions: [
      { stars: 1, description: '完成关卡', condition: { type: 'complete', value: true } },
      { stars: 2, description: '正点率 ≥ 75%', condition: { type: 'on_time_rate', value: 75 } },
      { stars: 3, description: '无连锁晚点', condition: { type: 'no_delay_chain', value: true } }
    ],
    layout: {
      offsetX: 60,
      offsetY: 80,
      tileSize: 60
    },
    nodes: [
      { id: 'S1', type: 'spawn', gridX: 0, gridY: 0, connections: ['M1'], label: '西入口A' },
      { id: 'S2', type: 'spawn', gridX: 0, gridY: 3, connections: ['M2'], label: '西入口B' },
      { id: 'S3', type: 'spawn', gridX: 0, gridY: 6, connections: ['M3'], label: '西入口C' },

      { id: 'M1', type: 'junction', gridX: 2, gridY: 0, connections: ['S1', 'J1'], altConnections: ['J2'], isSwitch: true, switchState: 0, label: '西道岔1' },
      { id: 'M2', type: 'junction', gridX: 2, gridY: 3, connections: ['S2', 'J2'], altConnections: ['J3'], isSwitch: true, switchState: 0, label: '西道岔2' },
      { id: 'M3', type: 'junction', gridX: 2, gridY: 6, connections: ['S3', 'J3'], altConnections: ['J2'], isSwitch: true, switchState: 0, label: '西道岔3' },

      { id: 'J1', type: 'normal', gridX: 4, gridY: 1, connections: ['M1', 'P1'] },
      { id: 'J2', type: 'normal', gridX: 4, gridY: 3, connections: ['M1', 'M2', 'M3', 'P2'], isSwitch: false, label: '中枢点' },
      { id: 'J3', type: 'normal', gridX: 4, gridY: 5, connections: ['M2', 'M3', 'P3'] },

      { id: 'P1', type: 'platform', gridX: 6, gridY: 1, connections: ['J1', 'E1'], platformId: 'P1', platformName: '1站台' },
      { id: 'P2', type: 'platform', gridX: 6, gridY: 3, connections: ['J2', 'E2'], platformId: 'P2', platformName: '2站台' },
      { id: 'P3', type: 'platform', gridX: 6, gridY: 5, connections: ['J3', 'E3'], platformId: 'P3', platformName: '3站台' },

      { id: 'E1', type: 'junction', gridX: 8, gridY: 1, connections: ['P1', 'T1'], altConnections: ['T2'], isSwitch: true, switchState: 0, label: '东道岔1' },
      { id: 'E2', type: 'junction', gridX: 8, gridY: 3, connections: ['P2', 'T2'], altConnections: ['T3'], isSwitch: true, switchState: 0, label: '东道岔2' },
      { id: 'E3', type: 'junction', gridX: 8, gridY: 5, connections: ['P3', 'T3'], altConnections: ['T2'], isSwitch: true, switchState: 0, label: '东道岔3' },

      { id: 'T1', type: 'terminal', gridX: 10, gridY: 0, connections: ['E1'], label: '东出口A' },
      { id: 'T2', type: 'terminal', gridX: 10, gridY: 3, connections: ['E1', 'E2', 'E3'], label: '东出口B' },
      { id: 'T3', type: 'terminal', gridX: 10, gridY: 6, connections: ['E2', 'E3'], label: '东出口C' }
    ],
    signals: [
      { id: 'SIG1', nodeId: 'S1', state: 'red', mode: 'manual', label: '西A信号' },
      { id: 'SIG2', nodeId: 'S2', state: 'red', mode: 'manual', label: '西B信号' },
      { id: 'SIG3', nodeId: 'S3', state: 'red', mode: 'manual', label: '西C信号' },
      { id: 'SIG4', nodeId: 'J2', state: 'green', mode: 'auto', label: '中枢信号' },
      { id: 'SIG5', nodeId: 'E1', state: 'green', mode: 'auto' },
      { id: 'SIG6', nodeId: 'E2', state: 'green', mode: 'auto' },
      { id: 'SIG7', nodeId: 'E3', state: 'green', mode: 'auto' }
    ],
    schedules: [
      {
        id: 'T01',
        type: 'express',
        trainNumber: 'G1',
        name: '京沪高铁',
        startNodeId: 'S1',
        endNodeId: 'T1',
        targetPlatformId: 'P1',
        scheduledDeparture: 3,
        scheduledArrival: 50,
        priority: 3,
        platformWaitTime: 12
      },
      {
        id: 'T02',
        type: 'passenger',
        trainNumber: 'K101',
        name: '京通快客',
        startNodeId: 'S2',
        endNodeId: 'T3',
        targetPlatformId: 'P2',
        scheduledDeparture: 8,
        scheduledArrival: 70,
        priority: 2,
        platformWaitTime: 18
      },
      {
        id: 'T03',
        type: 'freight',
        trainNumber: 'H201',
        name: '煤炭专列',
        startNodeId: 'S3',
        endNodeId: 'T2',
        targetPlatformId: 'P3',
        scheduledDeparture: 15,
        scheduledArrival: 110,
        priority: 1,
        platformWaitTime: 25
      },
      {
        id: 'T04',
        type: 'passenger',
        trainNumber: 'K102',
        name: '京哈快客',
        startNodeId: 'S1',
        endNodeId: 'T3',
        targetPlatformId: 'P1',
        scheduledDeparture: 40,
        scheduledArrival: 120,
        priority: 2,
        platformWaitTime: 15
      },
      {
        id: 'T05',
        type: 'express',
        trainNumber: 'G2',
        name: '沪深高铁',
        startNodeId: 'S2',
        endNodeId: 'T1',
        targetPlatformId: 'P2',
        scheduledDeparture: 50,
        scheduledArrival: 140,
        priority: 3,
        platformWaitTime: 12
      },
      {
        id: 'T06',
        type: 'freight',
        trainNumber: 'H202',
        name: '集装箱专列',
        startNodeId: 'S3',
        endNodeId: 'T2',
        targetPlatformId: 'P3',
        scheduledDeparture: 65,
        scheduledArrival: 190,
        priority: 1,
        platformWaitTime: 30
      }
    ]
  }
];

export class LevelManager {
  constructor() {
    this.levels = LEVEL_DATA;
    this.currentLevelId = null;
    this.currentLevelData = null;
  }

  getAllLevels() {
    return [...this.levels];
  }

  getLevel(levelId) {
    return this.levels.find(l => l.id === levelId) || null;
  }

  getLevelCount() {
    return this.levels.length;
  }

  selectLevel(levelId) {
    this.currentLevelId = levelId;
    this.currentLevelData = this.getLevel(levelId);
    return this.currentLevelData;
  }

  getCurrentLevel() {
    return this.currentLevelData;
  }

  isLevelUnlocked(levelId) {
    const level = this.getLevel(levelId);
    if (!level) return false;
    if (!window.SaveSystem) return true;
    return window.SaveSystem.isLevelUnlocked(levelId, level);
  }

  getCompletedLevelCount() {
    if (!window.SaveSystem) return 0;
    return this.levels.filter(l => window.SaveSystem.isLevelCompleted(l.id)).length;
  }

  getStarsForLevel(levelId) {
    if (!window.SaveSystem) return 0;
    return window.SaveSystem.getLevelStars(levelId);
  }

  getTotalStars() {
    if (!window.SaveSystem) return 0;
    return this.levels.reduce(
      (sum, l) => sum + window.SaveSystem.getLevelStars(l.id),
      0
    );
  }

  getMaxStars() {
    return this.levels.reduce((sum, l) => sum + (l.stars || 3), 0);
  }
}
