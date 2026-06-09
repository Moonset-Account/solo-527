export type EventHandler<T = unknown> = (payload: T) => void;

export interface EventMap {
  [key: string]: unknown;
}

export class EventBus<Events extends object = EventMap> {
  private listeners: Map<keyof Events, Set<EventHandler<any>>> = new Map();
  private onceListeners: Map<keyof Events, Set<EventHandler<any>>> = new Map();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    this.getOrCreate(this.listeners, event).add(handler);
    return () => this.off(event, handler);
  }

  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    this.getOrCreate(this.onceListeners, event).add(handler);
    return () => {
      const set = this.onceListeners.get(event);
      set?.delete(handler);
    };
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    this.listeners.get(event)?.delete(handler);
    this.onceListeners.get(event)?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const regular = this.listeners.get(event);
    if (regular) {
      for (const h of regular) {
        try {
          h(payload);
        } catch (e) {
          console.error(`[EventBus] handler error for ${String(event)}:`, e);
        }
      }
    }

    const once = this.onceListeners.get(event);
    if (once) {
      const handlers = Array.from(once);
      once.clear();
      for (const h of handlers) {
        try {
          h(payload);
        } catch (e) {
          console.error(`[EventBus] once handler error for ${String(event)}:`, e);
        }
      }
    }
  }

  clear(event?: keyof Events): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  private getOrCreate<K extends keyof Events>(
    map: Map<K, Set<EventHandler<any>>>,
    key: K
  ): Set<EventHandler<any>> {
    let set = map.get(key);
    if (!set) {
      set = new Set();
      map.set(key, set);
    }
    return set;
  }
}
