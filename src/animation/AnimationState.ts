import type { AnimationState as AnimState } from '@/engine/types';

export interface AnimationTransition {
  from: AnimState;
  to: AnimState;
}

const VALID_TRANSITIONS: AnimationTransition[] = [
  { from: 'idle', to: 'playing' },
  { from: 'playing', to: 'paused' },
  { from: 'paused', to: 'playing' },
  { from: 'playing', to: 'fastForward' },
  { from: 'fastForward', to: 'playing' },
  { from: 'fastForward', to: 'paused' },
  { from: 'paused', to: 'fastForward' },
  { from: 'playing', to: 'replaying' },
  { from: 'replaying', to: 'playing' },
  { from: 'replaying', to: 'paused' },
  { from: 'paused', to: 'idle' },
  { from: 'playing', to: 'idle' },
];

export function canTransition(from: AnimState, to: AnimState): boolean {
  return VALID_TRANSITIONS.some(t => t.from === from && t.to === to);
}

export function getSpeedForState(state: AnimState): number {
  switch (state) {
    case 'idle': return 0;
    case 'playing': return 1;
    case 'paused': return 0;
    case 'fastForward': return 4;
    case 'replaying': return 2;
  }
}

export function getLabelForState(state: AnimState): string {
  switch (state) {
    case 'idle': return '待命';
    case 'playing': return '运行中';
    case 'paused': return '已暂停';
    case 'fastForward': return '快进';
    case 'replaying': return '回放中';
  }
}
