type EventCallback = (...args: unknown[]) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }

  once(event: string, callback: EventCallback): () => void {
    const wrapper: EventCallback = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventEmitter = new EventEmitter();
