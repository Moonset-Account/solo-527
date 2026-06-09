import type { EventHandler, GameEvents } from '@/types';

type EventKey = keyof GameEvents;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<EventKey, Set<EventHandler<any>>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on<K extends EventKey>(event: K, handler: EventHandler<GameEvents[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends EventKey>(event: K, handler: EventHandler<GameEvents[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends EventKey>(event: K, data: GameEvents[K]): void {
    this.handlers.get(event)?.forEach((h) => {
      try {
        (h as EventHandler<GameEvents[K]>)(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for ${event}:`, err);
      }
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = EventBus.getInstance();
