import { ReactionEffect } from '@/types/game';
import { eventEmitter } from '@/engine/events/emitter';

export interface ReactionResult {
  success: boolean;
  effects: ReactionEffect[];
  description: string;
}

interface ReactionDef {
  reagents: string[];
  result: Omit<ReactionResult, 'success'>;
  priority: number;
}

const reactionDefs: ReactionDef[] = [
  {
    reagents: ['naoh', 'phenolphthalein', 'hcl'],
    priority: 10,
    result: {
      effects: [
        { type: 'color_change', x: 0, y: 0, duration: 2500, color: '#f48fb1', intensity: 0.7 },
        { type: 'color_change', x: 0, y: 0, duration: 3000, color: '#ffffff', intensity: 0.5 },
      ],
      description: '酚酞在碱液中变红，加入盐酸后红色褪去，达到中和点',
    },
  },
  {
    reagents: ['naoh', 'phenolphthalein'],
    priority: 8,
    result: {
      effects: [
        { type: 'color_change', x: 0, y: 0, duration: 2000, color: '#f48fb1', intensity: 0.8 },
      ],
      description: '酚酞在碱性环境中变为粉红色',
    },
  },
  {
    reagents: ['cuso4', 'naoh'],
    priority: 8,
    result: {
      effects: [
        { type: 'precipitate', x: 0, y: 10, duration: 3000, color: '#2196f3', intensity: 1 },
      ],
      description: '铜离子与氢氧根结合生成蓝色氢氧化铜沉淀',
    },
  },
  {
    reagents: ['bacl2', 'na2so4'],
    priority: 8,
    result: {
      effects: [
        { type: 'precipitate', x: 0, y: 10, duration: 3000, color: '#ffffff', intensity: 1 },
      ],
      description: '钡离子与硫酸根结合生成白色硫酸钡沉淀',
    },
  },
  {
    reagents: ['naoh', 'hcl'],
    priority: 5,
    result: {
      effects: [
        { type: 'heat_glow', x: 0, y: -20, duration: 3000, intensity: 0.8 },
        { type: 'color_change', x: 0, y: 0, duration: 2000, color: '#ffeb3b', intensity: 0.5 },
      ],
      description: '酸碱中和反应放出热量，指示剂变色',
    },
  },
  {
    reagents: ['agno3', 'nacl'],
    priority: 5,
    result: {
      effects: [
        { type: 'precipitate', x: 0, y: 10, duration: 3000, color: '#ffffff', intensity: 1 },
      ],
      description: '银离子与氯离子结合生成白色沉淀',
    },
  },
  {
    reagents: ['nacl', 'water'],
    priority: 3,
    result: {
      effects: [
        { type: 'bubble', x: 0, y: 0, duration: 2000, intensity: 0.5 },
      ],
      description: '氯化钠溶解在水中，形成均匀溶液',
    },
  },
  {
    reagents: ['cuso4', 'water'],
    priority: 3,
    result: {
      effects: [
        { type: 'color_change', x: 0, y: 0, duration: 2000, color: '#42a5f5', intensity: 0.6 },
      ],
      description: '硫酸铜溶解在水中，溶液变为蓝色',
    },
  },
];

function matchesReaction(activeReagents: string[], defReagents: string[]): boolean {
  return defReagents.every(r => activeReagents.includes(r));
}

export function simulateReaction(reagentIds: string[], temperature: number): ReactionResult {
  const sorted = [...reagentIds].sort();
  const matched: ReactionDef[] = [];

  for (const def of reactionDefs) {
    if (matchesReaction(sorted, def.reagents)) {
      matched.push(def);
    }
  }

  matched.sort((a, b) => b.priority - a.priority);

  if (matched.length > 0) {
    const best = matched[0];
    const result: ReactionResult = {
      success: true,
      effects: best.result.effects.map(e => ({ ...e })),
      description: best.result.description,
    };
    eventEmitter.emit('reaction:occur', result);
    return result;
  }

  if (temperature > 60) {
    const result: ReactionResult = {
      success: true,
      effects: [
        { type: 'steam', x: 0, y: -30, duration: 3000, intensity: 0.4 },
        { type: 'heat_glow', x: 0, y: 20, duration: 3000, intensity: temperature / 100 },
      ],
      description: '加热反应进行中',
    };
    eventEmitter.emit('reaction:occur', result);
    return result;
  }

  return { success: false, effects: [], description: '没有观察到明显反应' };
}
