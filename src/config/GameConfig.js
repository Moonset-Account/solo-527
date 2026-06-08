export const GAME_CONFIG = {
  width: 1280,
  height: 720,
  backgroundColor: '#0f1628',
  debugPhysics: false,
  version: '0.1.0',

  tileSize: 64,
  gridCols: 18,
  gridRows: 10,

  gameSpeed: {
    pause: 0,
    normal: 1,
    fast: 2,
    superFast: 4
  },

  colors: {
    primary: '#4a9eff',
    secondary: '#ff6b6b',
    success: '#4ecdc4',
    warning: '#ffd93d',
    danger: '#ff4757',
    track: '#3d4f6f',
    trackActive: '#6b8cbf',
    platform: '#6c5ce7',
    trainPassenger: '#00cec9',
    trainFreight: '#e17055',
    signalRed: '#ff4757',
    signalGreen: '#00b894',
    signalYellow: '#fdcb6e',
    uiBg: 'rgba(15, 22, 40, 0.92)',
    uiBorder: 'rgba(74, 158, 255, 0.3)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)'
  },

  trainTypes: {
    passenger: {
      name: '客运列车',
      speed: 1.0,
      weight: 1,
      color: '#00cec9',
      priority: 2,
      icon: '🚄'
    },
    freight: {
      name: '货运列车',
      speed: 0.6,
      weight: 3,
      color: '#e17055',
      priority: 1,
      icon: '🚂'
    },
    express: {
      name: '特快列车',
      speed: 1.5,
      weight: 1,
      color: '#a29bfe',
      priority: 3,
      icon: '🚅'
    }
  },

  conflictTypes: {
    sameTrack: {
      id: 'sameTrack',
      name: '同轨冲突',
      description: '两列列车在同一轨道段对向行驶或追尾',
      severity: 'critical'
    },
    platformOccupied: {
      id: 'platformOccupied',
      name: '站台占用',
      description: '目标站台被其他列车占用',
      severity: 'warning'
    },
    delayChain: {
      id: 'delayChain',
      name: '晚点连锁',
      description: '前车晚点导致后车连锁延误',
      severity: 'warning'
    },
    signalViolation: {
      id: 'signalViolation',
      name: '信号违规',
      description: '列车闯红灯信号',
      severity: 'critical'
    },
    switchError: {
      id: 'switchError',
      name: '道岔错误',
      description: '列车经过时道岔位置错误',
      severity: 'critical'
    }
  },

  audio: {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    enabled: true
  }
};

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  TUTORIAL: 'TutorialScene',
  LEVEL_SELECT: 'LevelSelectScene',
  GAME: 'GameScene',
  RESULT: 'ResultScene',
  REPLAY: 'ReplayScene'
};
