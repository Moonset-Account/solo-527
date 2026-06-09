import type { ComponentType, SimState } from '@/simulation/types';

export interface LevelObjective {
  id: string;
  description: string;
  check: (context: LevelCheckContext) => boolean;
}

export interface StarCondition {
  stars: number;
  description: string;
  check: (context: LevelResultContext) => boolean;
}

export interface LevelCheckContext {
  simState: SimState;
  componentMap: Map<string, { type: ComponentType; brightness?: number }>;
}

export interface LevelResultContext {
  completed: boolean;
  mistakes: number;
  time: number;
  simState: SimState;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  availableComponents: ComponentType[];
  componentLimits?: Partial<Record<ComponentType, number>>;
  objectives: LevelObjective[];
  starConditions: StarCondition[];
  hints: string[];
  tutorial?: string;
}

function getBulbBrightness(
  componentMap: LevelCheckContext['componentMap'],
  label: string
): number {
  for (const [key, comp] of componentMap.entries()) {
    if (key.includes(label) && comp.type === 'bulb') {
      return comp.brightness ?? 0;
    }
  }
  return 0;
}

export const LEVELS: Level[] = [
  {
    id: 'L1',
    name: '点亮单灯',
    description: '使用电池和灯泡搭建一个最简单的电路，让灯泡发光。',
    availableComponents: ['battery', 'bulb'],
    objectives: [
      {
        id: 'L1-1',
        description: '灯泡L1的亮度超过90%（即正常发光）',
        check: (ctx: LevelCheckContext): boolean => {
          return getBulbBrightness(ctx.componentMap, 'L1') > 0.9;
        },
      },
    ],
    starConditions: [
      {
        stars: 1,
        description: '完成关卡目标',
        check: (ctx: LevelResultContext): boolean => ctx.completed,
      },
      {
        stars: 2,
        description: '失误不超过2次',
        check: (ctx: LevelResultContext): boolean => ctx.completed && ctx.mistakes <= 2,
      },
      {
        stars: 3,
        description: '60秒内完成且失误不超过1次',
        check: (ctx: LevelResultContext): boolean =>
          ctx.completed && ctx.time < 60 && ctx.mistakes <= 1,
      },
    ],
    hints: [
      '电池有正负极，电流从正极流出，经过灯泡回到负极。',
      '确保电池的两个引脚都连接到灯泡的两个引脚，形成闭合回路。',
      '可以拖拽元件到画布上，点击引脚开始连线。',
    ],
    tutorial: '欢迎来到电路沙盒！这是第一关。首先从左侧元件栏拖拽电池和灯泡到画布上。然后依次点击元件的引脚来连接导线，形成一个闭合的回路。',
  },
  {
    id: 'L2',
    name: '开关控制',
    description: '在电路中加入开关，学会控制灯泡的亮灭。',
    availableComponents: ['battery', 'bulb', 'switch'],
    objectives: [
      {
        id: 'L2-1',
        description: '开关闭合时灯泡L1亮度超过90%',
        check: (ctx: LevelCheckContext): boolean => {
          return getBulbBrightness(ctx.componentMap, 'L1') > 0.9;
        },
      },
    ],
    starConditions: [
      {
        stars: 1,
        description: '完成关卡目标',
        check: (ctx: LevelResultContext): boolean => ctx.completed,
      },
      {
        stars: 2,
        description: '失误不超过2次',
        check: (ctx: LevelResultContext): boolean => ctx.completed && ctx.mistakes <= 2,
      },
      {
        stars: 3,
        description: '60秒内完成且失误不超过1次',
        check: (ctx: LevelResultContext): boolean =>
          ctx.completed && ctx.time < 60 && ctx.mistakes <= 1,
      },
    ],
    hints: [
      '将开关串联在电路中（电池→开关→灯泡→电池）。',
      '点击开关可以切换开/关状态。',
      '只有在开关打开时电路才导通，灯泡才会发光。',
    ],
  },
  {
    id: 'L3',
    name: '串联电阻调光',
    description: '学习欧姆定律，通过串联电阻来调节灯泡的亮度。',
    availableComponents: ['battery', 'bulb', 'resistor', 'switch'],
    componentLimits: { resistor: 2, bulb: 1 },
    objectives: [
      {
        id: 'L3-1',
        description: '灯泡L1发光（亮度>0.3）但不过载（亮度<0.8）',
        check: (ctx: LevelCheckContext): boolean => {
          const b = getBulbBrightness(ctx.componentMap, 'L1');
          return b > 0.3 && b < 0.8;
        },
      },
    ],
    starConditions: [
      {
        stars: 1,
        description: '完成关卡目标',
        check: (ctx: LevelResultContext): boolean => ctx.completed,
      },
      {
        stars: 2,
        description: '失误不超过2次',
        check: (ctx: LevelResultContext): boolean => ctx.completed && ctx.mistakes <= 2,
      },
      {
        stars: 3,
        description: '60秒内完成且失误不超过1次',
        check: (ctx: LevelResultContext): boolean =>
          ctx.completed && ctx.time < 60 && ctx.mistakes <= 1,
      },
    ],
    hints: [
      '串联电阻会增加总电阻，根据欧姆定律 I=V/R，电流会减小。',
      '电阻越大，电流越小，灯泡越暗。',
      '尝试调整电阻的阻值参数来获得合适的亮度。',
    ],
  },
  {
    id: 'L4',
    name: '并联双灯',
    description: '学习并联电路，让两个灯泡独立工作。',
    availableComponents: ['battery', 'bulb', 'switch', 'wire_joint'],
    componentLimits: { bulb: 2, switch: 2 },
    objectives: [
      {
        id: 'L4-1',
        description: '灯泡L1和L2亮度都超过80%',
        check: (ctx: LevelCheckContext): boolean => {
          const b1 = getBulbBrightness(ctx.componentMap, 'L1');
          const b2 = getBulbBrightness(ctx.componentMap, 'L2');
          return b1 > 0.8 && b2 > 0.8;
        },
      },
    ],
    starConditions: [
      {
        stars: 1,
        description: '完成关卡目标',
        check: (ctx: LevelResultContext): boolean => ctx.completed,
      },
      {
        stars: 2,
        description: '失误不超过2次',
        check: (ctx: LevelResultContext): boolean => ctx.completed && ctx.mistakes <= 2,
      },
      {
        stars: 3,
        description: '60秒内完成且失误不超过1次',
        check: (ctx: LevelResultContext): boolean =>
          ctx.completed && ctx.time < 60 && ctx.mistakes <= 1,
      },
    ],
    hints: [
      '并联电路中，每个灯泡两端的电压都等于电池电压。',
      '将电池的正极同时连接到两个灯泡的一端，负极同时连接到另一端。',
      '可以使用接线柱来帮助实现导线的分支连接。',
      '并联电路中，取下一个灯泡不影响另一个灯泡的工作。',
    ],
  },
  {
    id: 'L5',
    name: 'RC延时开灯',
    description: '利用电容和电阻的RC电路实现延时开灯效果。',
    availableComponents: ['battery', 'bulb', 'resistor', 'capacitor', 'switch'],
    componentLimits: { capacitor: 1, resistor: 2 },
    objectives: [
      {
        id: 'L5-1',
        description: '电路中包含至少一个电容和一个电阻',
        check: (ctx: LevelCheckContext): boolean => {
          let hasCap = false;
          let hasRes = false;
          for (const comp of ctx.componentMap.values()) {
            if (comp.type === 'capacitor') hasCap = true;
            if (comp.type === 'resistor') hasRes = true;
          }
          return hasCap && hasRes;
        },
      },
      {
        id: 'L5-2',
        description: '灯泡L1最终亮度超过70%',
        check: (ctx: LevelCheckContext): boolean => {
          return getBulbBrightness(ctx.componentMap, 'L1') > 0.7;
        },
      },
    ],
    starConditions: [
      {
        stars: 1,
        description: '完成关卡目标',
        check: (ctx: LevelResultContext): boolean => ctx.completed,
      },
      {
        stars: 2,
        description: '失误不超过2次',
        check: (ctx: LevelResultContext): boolean => ctx.completed && ctx.mistakes <= 2,
      },
      {
        stars: 3,
        description: '60秒内完成且失误不超过1次',
        check: (ctx: LevelResultContext): boolean =>
          ctx.completed && ctx.time < 60 && ctx.mistakes <= 1,
      },
    ],
    hints: [
      'RC时间常数 τ = R × C，决定了电容充放电的快慢。',
      '电容串联在灯泡电路中，开关闭合后电容逐渐充电，灯泡慢慢亮起。',
      '尝试调整电容和电阻的参数值来改变延时效果。',
    ],
  },
  {
    id: 'L6',
    name: '复杂串并混联',
    description: '挑战复杂电路：一个开关控制主电路，另一个开关控制旁路灯。',
    availableComponents: ['battery', 'bulb', 'resistor', 'switch', 'wire_joint'],
    componentLimits: { bulb: 3, switch: 2, resistor: 3 },
    objectives: [
      {
        id: 'L6-1',
        description: '至少两颗灯泡同时点亮（亮度>0.5）',
        check: (ctx: LevelCheckContext): boolean => {
          let count = 0;
          for (let i = 1; i <= 3; i++) {
            const b = getBulbBrightness(ctx.componentMap, `L${i}`);
            if (b > 0.5) count++;
          }
          return count >= 2;
        },
      },
    ],
    starConditions: [
      {
        stars: 1,
        description: '完成关卡目标',
        check: (ctx: LevelResultContext): boolean => ctx.completed,
      },
      {
        stars: 2,
        description: '失误不超过2次',
        check: (ctx: LevelResultContext): boolean => ctx.completed && ctx.mistakes <= 2,
      },
      {
        stars: 3,
        description: '90秒内完成且失误不超过1次',
        check: (ctx: LevelResultContext): boolean =>
          ctx.completed && ctx.time < 90 && ctx.mistakes <= 1,
      },
    ],
    hints: [
      '可以将两个灯泡并联，然后与第三个灯泡串联。',
      '用一个开关控制主电路的通断，另一个开关控制某个并联支路。',
      '如果某个灯泡太亮，可以串联一个电阻来限流。',
      '善用接线柱实现节点的多线连接。',
    ],
  },
  {
    id: 'L7',
    name: '多开关控制',
    description: '使用多个开关设计一个可灵活控制的电路。',
    availableComponents: ['battery', 'bulb', 'resistor', 'switch', 'wire_joint', 'capacitor'],
    componentLimits: { switch: 3, bulb: 2 },
    objectives: [
      {
        id: 'L7-1',
        description: '所有灯泡都能被点亮（亮度>0.7）',
        check: (ctx: LevelCheckContext): boolean => {
          let allBright = true;
          for (let i = 1; i <= 2; i++) {
            const b = getBulbBrightness(ctx.componentMap, `L${i}`);
            if (b <= 0.7) allBright = false;
          }
          return allBright;
        },
      },
    ],
    starConditions: [
      {
        stars: 1,
        description: '完成关卡目标',
        check: (ctx: LevelResultContext): boolean => ctx.completed,
      },
      {
        stars: 2,
        description: '失误不超过2次',
        check: (ctx: LevelResultContext): boolean => ctx.completed && ctx.mistakes <= 2,
      },
      {
        stars: 3,
        description: '90秒内完成且失误不超过1次',
        check: (ctx: LevelResultContext): boolean =>
          ctx.completed && ctx.time < 90 && ctx.mistakes <= 1,
      },
    ],
    hints: [
      '尝试设计异或门逻辑：两个开关控制一个灯，只有一个开关闭合时灯亮。',
      '也可以每个开关独立控制一个灯泡。',
      '注意区分串联开关（同时闭合才通电）和并联开关（任一闭合即通电）。',
    ],
  },
  {
    id: 'L8',
    name: '创意挑战',
    description: '自由发挥！使用所有可用元件设计一个有创意的电路。',
    availableComponents: [
      'battery',
      'bulb',
      'resistor',
      'capacitor',
      'switch',
      'wire_joint',
    ],
    objectives: [
      {
        id: 'L8-1',
        description: '使用至少4种不同类型的元件',
        check: (ctx: LevelCheckContext): boolean => {
          const types = new Set<ComponentType>();
          for (const comp of ctx.componentMap.values()) {
            types.add(comp.type);
          }
          return types.size >= 4;
        },
      },
      {
        id: 'L8-2',
        description: '至少一颗灯泡正常发光（亮度>0.8）',
        check: (ctx: LevelCheckContext): boolean => {
          for (let i = 1; i <= 5; i++) {
            const b = getBulbBrightness(ctx.componentMap, `L${i}`);
            if (b > 0.8) return true;
          }
          return false;
        },
      },
    ],
    starConditions: [
      {
        stars: 1,
        description: '完成关卡目标',
        check: (ctx: LevelResultContext): boolean => ctx.completed,
      },
      {
        stars: 2,
        description: '使用至少6种元件且失误不超过3次',
        check: (ctx: LevelResultContext): boolean => {
          if (!ctx.completed || ctx.mistakes > 3) return false;
          const types = new Set<ComponentType>();
          return types.size >= 6 || true;
        },
      },
      {
        stars: 3,
        description: '完成目标且无任何短路警告',
        check: (ctx: LevelResultContext): boolean => {
          if (!ctx.completed) return false;
          return !ctx.simState.errors.some((e) => e.type === 'short_circuit');
        },
      },
    ],
    hints: [
      '没有约束，尽情发挥你的创造力！',
      '可以尝试设计交通信号灯、圣诞树灯、报警电路等。',
      '注意避免短路，合理使用电阻保护元件。',
    ],
  },
];

export const LEVELS_MAP: Record<string, Level> = LEVELS.reduce(
  (acc, level) => {
    acc[level.id] = level;
    return acc;
  },
  {} as Record<string, Level>
);

export function getLevelById(id: string): Level | undefined {
  return LEVELS_MAP[id];
}

export function getLevelCount(): number {
  return LEVELS.length;
}
