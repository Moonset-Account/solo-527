import mitt, { type Emitter } from 'mitt';
import type { GameEvents } from '@/types';

const emitter: Emitter<GameEvents> = mitt<GameEvents>();

export const eventBus = {
  on: emitter.on.bind(emitter),
  off: emitter.off.bind(emitter),
  emit: emitter.emit.bind(emitter),
  all: emitter.all,
};

export type EventBusType = typeof eventBus;
