export enum ComponentType {
  Resistor = 'Resistor',
  Capacitor = 'Capacitor',
  Switch = 'Switch',
  Bulb = 'Bulb',
  Battery = 'Battery',
}

export interface PinInfo {
  x: number;
  y: number;
  label: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ComponentConfig {
  type: ComponentType;
  defaultValue: number;
  unit: string;
  min: number;
  max: number;
  width: number;
  height: number;
  pins: PinInfo[];
}

export interface TutorialStep {
  text: string;
  highlight: string;
  action: string;
  waitCondition: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  availableComponents: ComponentType[];
  goal: string;
  hints: string[];
  successCriteria: string;
  tutorialSteps: TutorialStep[];
  difficulty: number;
  prereqs: string[];
}

export interface KeyBindings {
  pan: string[];
  zoomIn: string[];
  zoomOut: string[];
  delete: string[];
  rotate: string[];
  undo: string[];
  redo: string[];
  save: string[];
  load: string[];
  pause: string[];
  hint: string[];
}

export interface Settings {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  simSpeed: number;
  volume: number;
  language: string;
  keyBindings: KeyBindings;
  showPerfStats: boolean;
  autoSave: boolean;
  theme: string;
}

export interface SaveData {
  version: string;
  timestamp: number;
  level: string;
  components: unknown[];
  wires: unknown[];
  analytics: unknown;
  settings: Settings;
}

export const APP_CONFIG = {
  APP_NAME: '电路沙盒',
  APP_VERSION: '1.0.0',
  CANVAS_BG_COLOR: '#1a1a2e',
  GRID_COLOR: '#2a2a4a',
  GRID_LINE_WIDTH: 0.5,
  gridSize: 20,
  WIRE_COLOR: '#00ff88',
  WIRE_WIDTH: 2,
  WIRE_HIGHLIGHT_COLOR: '#66ffbb',
  SELECTED_COLOR: '#ffcc00',
  HOVER_COLOR: '#88ccff',
  COMPONENT_FILL: '#2d2d4a',
  COMPONENT_STROKE: '#aaaacc',
  COMPONENT_TEXT_COLOR: '#ffffff',
  PIN_RADIUS: 4,
  PIN_COLOR: '#ff6644',
  PIN_HOVER_COLOR: '#ffaa88',
  SIMULATION_TICK_MS: 16,
  MAX_SIM_SPEED: 5,
  MIN_SIM_SPEED: 0.1,
  AUTO_SAVE_INTERVAL_MS: 30000,
  UNDO_STACK_SIZE: 50,
  ZOOM_MIN: 0.25,
  ZOOM_MAX: 4,
  ZOOM_STEP: 0.1,
  PAN_STEP: 50,
  DRAG_THRESHOLD: 3,
  SNAP_THRESHOLD: 8,
  PORT_VOLTAGE_TOLERANCE: 0.01,
  SHORT_CIRCUIT_CURRENT: 1000,
} as const;

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  pan: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
  zoomIn: ['=', '+'],
  zoomOut: ['-', '_'],
  delete: ['Delete', 'Backspace'],
  rotate: ['r', 'R'],
  undo: ['z', 'Z'],
  redo: ['y', 'Y'],
  save: ['s', 'S'],
  load: ['l', 'L'],
  pause: ['Space'],
  hint: ['h', 'H'],
};

export const COMPONENT_CONFIGS: Record<ComponentType, ComponentConfig> = {
  [ComponentType.Resistor]: {
    type: ComponentType.Resistor,
    defaultValue: 100,
    unit: 'Ω',
    min: 1,
    max: 10000,
    width: 80,
    height: 30,
    pins: [
      { x: 0, y: 15, label: '1' },
      { x: 80, y: 15, label: '2' },
    ],
  },
  [ComponentType.Capacitor]: {
    type: ComponentType.Capacitor,
    defaultValue: 100,
    unit: 'μF',
    min: 1,
    max: 1000,
    width: 60,
    height: 30,
    pins: [
      { x: 0, y: 15, label: '1' },
      { x: 60, y: 15, label: '2' },
    ],
  },
  [ComponentType.Switch]: {
    type: ComponentType.Switch,
    defaultValue: 0,
    unit: '',
    min: 0,
    max: 1,
    width: 70,
    height: 30,
    pins: [
      { x: 0, y: 15, label: '1' },
      { x: 70, y: 15, label: '2' },
    ],
  },
  [ComponentType.Bulb]: {
    type: ComponentType.Bulb,
    defaultValue: 0,
    unit: 'W',
    min: 0,
    max: 100,
    width: 50,
    height: 50,
    pins: [
      { x: 0, y: 25, label: '1' },
      { x: 50, y: 25, label: '2' },
    ],
  },
  [ComponentType.Battery]: {
    type: ComponentType.Battery,
    defaultValue: 9,
    unit: 'V',
    min: 1,
    max: 24,
    width: 60,
    height: 40,
    pins: [
      { x: 0, y: 20, label: '-' },
      { x: 60, y: 20, label: '+' },
    ],
  },
};

export const BULB_RATED_VOLTAGE = 5;

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 'level-1',
    name: '让灯泡亮起来',
    description: '学习最基础的电路：用导线将电池和灯泡连接起来，让灯泡发光。',
    availableComponents: [ComponentType.Battery, ComponentType.Bulb],
    goal: '将电池与灯泡用导线连接，使灯泡点亮',
    hints: [
      '电池的正极（+）需要连接到灯泡的一端',
      '灯泡的另一端需要连接回电池的负极（-）',
      '形成完整的回路，灯泡才会亮',
    ],
    successCriteria: 'bulb_lit',
    tutorialSteps: [
      { text: '从左侧面板拖一个电池到画布上', highlight: '.component-panel .battery', action: 'place', waitCondition: 'component_placed:Battery' },
      { text: '再拖一个灯泡到画布上', highlight: '.component-panel .bulb', action: 'place', waitCondition: 'component_placed:Bulb' },
      { text: '点击电池正极引脚，再点击灯泡一端引脚，画出导线', highlight: '.pin', action: 'wire', waitCondition: 'wire_connected' },
      { text: '再连接灯泡另一端到电池负极，形成完整回路', highlight: '.pin', action: 'wire', waitCondition: 'circuit_complete' },
    ],
    difficulty: 1,
    prereqs: [],
  },
  {
    id: 'level-2',
    name: '开关控制',
    description: '加入开关元件，学习如何用开关控制灯泡的亮灭。',
    availableComponents: [ComponentType.Battery, ComponentType.Bulb, ComponentType.Switch],
    goal: '在电路中加入开关，通过开关控制灯泡的亮灭',
    hints: [
      '开关需要串联在电路中',
      '点击开关可以切换开/关状态',
      '开关断开时，电路不通，灯泡熄灭',
    ],
    successCriteria: 'switch_toggle',
    tutorialSteps: [
      { text: '放置电池、灯泡和开关到画布上', highlight: '.component-panel', action: 'place', waitCondition: 'all_components_placed' },
      { text: '将所有元件用导线串联连接', highlight: '.pin', action: 'wire', waitCondition: 'circuit_complete' },
      { text: '点击开关，观察灯泡的状态变化', highlight: '.component.switch', action: 'click', waitCondition: 'switch_toggled' },
    ],
    difficulty: 1,
    prereqs: ['level-1'],
  },
  {
    id: 'level-3',
    name: '电阻限流',
    description: '加入电阻，观察电阻对灯泡亮度的影响。电阻越大，电流越小，灯泡越暗。',
    availableComponents: [ComponentType.Battery, ComponentType.Bulb, ComponentType.Switch, ComponentType.Resistor],
    goal: '在电路中串联电阻，观察灯泡变暗的现象',
    hints: [
      '电阻串联在电路中会限制电流',
      '电阻值越大，灯泡越暗',
      '尝试修改电阻的阻值，观察亮度变化',
    ],
    successCriteria: 'resistor_effect_observed',
    tutorialSteps: [
      { text: '搭建一个包含电池、电阻和灯泡的串联电路', highlight: '.component-panel', action: 'place', waitCondition: 'all_components_placed' },
      { text: '双击电阻修改阻值，观察灯泡亮度变化', highlight: '.component.resistor', action: 'edit', waitCondition: 'value_changed' },
      { text: '尝试不同阻值，记录灯泡亮度的变化', highlight: '.status-bar', action: 'observe', waitCondition: 'observation_recorded' },
    ],
    difficulty: 2,
    prereqs: ['level-2'],
  },
  {
    id: 'level-4',
    name: '串联电路',
    description: '学习串联电路的特点：电流处处相等，电压分配到各元件上。',
    availableComponents: [ComponentType.Battery, ComponentType.Bulb, ComponentType.Switch, ComponentType.Resistor],
    goal: '搭建串联电路，测量并验证各元件的电压降之和等于电源电压',
    hints: [
      '串联电路中电流只有一条路径',
      '各元件的电压降之和等于总电压',
      '用电压表测量每个元件两端的电压',
    ],
    successCriteria: 'voltage_drops_measured',
    tutorialSteps: [
      { text: '搭建一个包含两个灯泡的串联电路', highlight: '.component-panel', action: 'place', waitCondition: 'all_components_placed' },
      { text: '用电压表分别测量每个灯泡两端的电压', highlight: '.toolbar .voltmeter', action: 'measure', waitCondition: 'voltage_measured' },
      { text: '验证两个灯泡电压之和是否等于电池电压', highlight: '.info-panel', action: 'observe', waitCondition: 'observation_recorded' },
    ],
    difficulty: 2,
    prereqs: ['level-3'],
  },
  {
    id: 'level-5',
    name: '并联电路',
    description: '学习并联电路的特点：各支路电压相同，电流在节点处分流。',
    availableComponents: [ComponentType.Battery, ComponentType.Bulb, ComponentType.Switch, ComponentType.Resistor],
    goal: '搭建并联电路，观察电流在支路中的分配',
    hints: [
      '并联电路中各支路两端电压相同',
      '干路电流等于各支路电流之和',
      '即使一条支路断开，其他支路仍可工作',
    ],
    successCriteria: 'current_split_observed',
    tutorialSteps: [
      { text: '搭建包含两个灯泡的并联电路', highlight: '.component-panel', action: 'place', waitCondition: 'all_components_placed' },
      { text: '观察两个灯泡是否同样亮', highlight: '.component.bulb', action: 'observe', waitCondition: 'observation_recorded' },
      { text: '断开一条支路，观察另一条支路的灯泡是否仍然亮着', highlight: '.pin', action: 'disconnect', waitCondition: 'branch_disconnected' },
    ],
    difficulty: 3,
    prereqs: ['level-4'],
  },
  {
    id: 'level-6',
    name: '电容充放电',
    description: '学习电容的基本特性：充电和放电过程，观察时间常数对充放电速度的影响。',
    availableComponents: [ComponentType.Battery, ComponentType.Bulb, ComponentType.Switch, ComponentType.Resistor, ComponentType.Capacitor],
    goal: '利用开关观察电容的充电和放电过程',
    hints: [
      '电容充电需要时间，灯泡会逐渐变暗',
      '断开电源后，电容会通过灯泡放电',
      '电阻和电容的乘积决定充放电速度（时间常数 τ=RC）',
    ],
    successCriteria: 'capacitor_charge_discharge_observed',
    tutorialSteps: [
      { text: '搭建包含电池、开关、电阻和电容的电路', highlight: '.component-panel', action: 'place', waitCondition: 'all_components_placed' },
      { text: '闭合开关，观察电容充电过程中灯泡的亮度变化', highlight: '.component.switch', action: 'click', waitCondition: 'switch_toggled' },
      { text: '断开开关，观察电容通过灯泡放电的过程', highlight: '.component.switch', action: 'click', waitCondition: 'discharge_observed' },
    ],
    difficulty: 3,
    prereqs: ['level-5'],
  },
  {
    id: 'level-7',
    name: '混合电路',
    description: '综合运用所学知识，分析和搭建包含多种元件的复杂电路。',
    availableComponents: [ComponentType.Battery, ComponentType.Bulb, ComponentType.Switch, ComponentType.Resistor, ComponentType.Capacitor],
    goal: '搭建一个包含串并联、开关和电容的混合电路，并分析其工作原理',
    hints: [
      '先识别电路中哪些部分是串联，哪些是并联',
      '逐步分析每个元件的作用',
      '尝试改变元件参数，观察整体电路行为的变化',
    ],
    successCriteria: 'mixed_circuit_analyzed',
    tutorialSteps: [
      { text: '规划一个混合电路的布局', highlight: '.canvas', action: 'plan', waitCondition: 'planning_done' },
      { text: '按规划放置所有需要的元件', highlight: '.component-panel', action: 'place', waitCondition: 'all_components_placed' },
      { text: '连接导线完成电路', highlight: '.pin', action: 'wire', waitCondition: 'circuit_complete' },
      { text: '操作开关，观察电路在不同状态下的行为', highlight: '.component.switch', action: 'click', waitCondition: 'observation_recorded' },
    ],
    difficulty: 4,
    prereqs: ['level-6'],
  },
  {
    id: 'level-8',
    name: '自由探索',
    description: '所有元件均可使用，自由搭建你想要的电路！',
    availableComponents: [ComponentType.Battery, ComponentType.Bulb, ComponentType.Switch, ComponentType.Resistor, ComponentType.Capacitor],
    goal: '自由探索电路的奥秘',
    hints: [
      '尝试不同的元件组合',
      '探索短路会发生什么',
      '设计一个实用的电路',
    ],
    successCriteria: 'free_play',
    tutorialSteps: [],
    difficulty: 5,
    prereqs: ['level-7'],
  },
];

export const DEFAULT_SETTINGS: Settings = {
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  simSpeed: 1,
  volume: 0.7,
  language: 'zh-CN',
  keyBindings: { ...DEFAULT_KEY_BINDINGS },
  showPerfStats: false,
  autoSave: true,
  theme: 'dark',
};
