type EventCallback = (...args: any[]) => void;

interface EventListener {
  callback: EventCallback;
  once: boolean;
  priority: number;
  id: number;
}

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, EventListener[]> = new Map();
  private listenerIdCounter = 0;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, callback: EventCallback, priority: number = 0): number {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const id = ++this.listenerIdCounter;
    this.listeners.get(event)!.push({
      callback,
      once: false,
      priority,
      id
    });
    this.listeners.get(event)!.sort((a, b) => b.priority - a.priority);
    return id;
  }

  once(event: string, callback: EventCallback, priority: number = 0): number {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const id = ++this.listenerIdCounter;
    this.listeners.get(event)!.push({
      callback,
      once: true,
      priority,
      id
    });
    this.listeners.get(event)!.sort((a, b) => b.priority - a.priority);
    return id;
  }

  off(event: string, id: number): boolean {
    const listeners = this.listeners.get(event);
    if (!listeners) return false;
    const index = listeners.findIndex(l => l.id === id);
    if (index !== -1) {
      listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    
    const toRemove: number[] = [];
    
    for (const listener of listeners) {
      try {
        listener.callback(...args);
      } catch (error) {
        console.error(`[EventBus] Error in listener for event '${event}':`, error);
      }
      if (listener.once) {
        toRemove.push(listener.id);
      }
    }

    if (toRemove.length > 0) {
      for (const id of toRemove) {
        this.off(event, id);
      }
    }
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  hasListeners(event: string): boolean {
    const listeners = this.listeners.get(event);
    return listeners !== undefined && listeners.length > 0;
  }

  getListenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }
}

export const eventBus = EventBus.getInstance();

export const GameEvents = {
  PLAYER_MOVE: 'player:move',
  PLAYER_PUSH: 'player:push',
  BOOKSHELF_MOVED: 'bookshelf:moved',
  CLUE_COLLECTED: 'clue:collected',
  INDEXCARD_FIXED: 'indexcard:fixed',
  BOOK_PLACED: 'book:placed',
  GAME_WIN: 'game:win',
  GAME_FAIL: 'game:fail',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  LEVEL_START: 'level:start',
  LEVEL_RESTART: 'level:restart',
  NOTIFICATION: 'ui:notification',
  SFX_PLAY: 'sfx:play',
  SETTINGS_CHANGED: 'settings:changed',
  INPUT_REMAPPED: 'input:remapped',
  SAVE_COMPLETE: 'save:complete',
  LOAD_COMPLETE: 'load:complete',
  EDITOR_OPEN: 'editor:open',
  EDITOR_CLOSE: 'editor:close',
  UNDO_ACTION: 'action:undo'
};
