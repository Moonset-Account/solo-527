type EventHandler = (...args: any[]) => void;

export class EventBus {
  private static handlers: Map<string, Set<EventHandler>> = new Map();

  static on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  static off(event: string, handler: EventHandler): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  static emit(event: string, ...args: any[]): void {
    const set = this.handlers.get(event);
    if (set) {
      set.forEach((fn) => {
        try {
          fn(...args);
        } catch (e) {
          console.error(`[EventBus] Error in handler for "${event}":`, e);
        }
      });
    }
  }

  static clear(): void {
    this.handlers.clear();
  }
}

export type GameEvent =
  | 'settings_changed'
  | 'level_start'
  | 'level_complete'
  | 'level_fail'
  | 'achievement_unlock'
  | 'daily_complete'
  | 'pause'
  | 'resume';
