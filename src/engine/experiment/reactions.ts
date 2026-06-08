import { ReactionEffect } from '@/types/game';
import { eventEmitter } from '@/engine/events/emitter';

export interface ReactionResult {
  success: boolean;
  effects: ReactionEffect[];
  description: string;
}

const reactionMap: Record<string, ReactionResult> = {
  'nacl_water': {
    success: true,
    effects: [
      { type: 'bubble', x: 0, y: 0, duration: 2000, intensity: 0.5 },
    ],
    description: '氯化钠溶解在水中，形成均匀溶液',
  },
  'naoh_hcl': {
    success: true,
    effects: [
      { type: 'heat_glow', x: 0, y: -20, duration: 3000, intensity: 0.8 },
      { type: 'color_change', x: 0, y: 0, duration: 2000, color: '#ffeb3b', intensity: 0.5 },
    ],
    description: '酸碱中和反应放出热量，指示剂变色',
  },
  'agno3_nacl': {
    success: true,
    effects: [
      { type: 'precipitate', x: 0, y: 10, duration: 3000, color: '#ffffff', intensity: 1 },
    ],
    description: '银离子与氯离子结合生成白色沉淀',
  },
  'cuso4_naoh': {
    success: true,
    effects: [
      { type: 'precipitate', x: 0, y: 10, duration: 3000, color: '#2196f3', intensity: 1 },
    ],
    description: '铜离子与氢氧根结合生成蓝色沉淀',
  },
  'heating': {
    success: true,
    effects: [
      { type: 'steam', x: 0, y: -30, duration: 4000, intensity: 0.6 },
      { type: 'heat_glow', x: 0, y: 20, duration: 4000, intensity: 0.5 },
    ],
    description: '加热过程中产生水蒸气',
  },
};

export function simulateReaction(reagentIds: string[], temperature: number): ReactionResult {
  const key = reagentIds.sort().join('_');
  if (reactionMap[key]) {
    const result = { ...reactionMap[key] };
    result.effects = result.effects.map(e => ({ ...e }));
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
