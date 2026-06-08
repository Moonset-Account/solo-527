import { CircuitGraph } from './circuit';
import { SaveData, Settings, APP_CONFIG } from './config';

export class SaveManager {
  private storageKey: string = 'circuit_sandbox_save';
  private autoSaveTimer: number | null = null;

  save(graph: CircuitGraph, levelId: string, analytics: any, settings: Settings): void {
    const serialized = graph.serialize();
    const data: SaveData = {
      version: APP_CONFIG.APP_VERSION,
      timestamp: Date.now(),
      level: levelId,
      components: (serialized as any).components,
      wires: (serialized as any).wires,
      analytics,
      settings,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  load(): SaveData | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  loadIntoGraph(graph: CircuitGraph, data: SaveData): void {
    graph.deserialize(data);
  }

  share(graph: CircuitGraph, levelId: string): string {
    const serialized = graph.serialize();
    const data: SaveData = {
      version: APP_CONFIG.APP_VERSION,
      timestamp: Date.now(),
      level: levelId,
      components: (serialized as any).components,
      wires: (serialized as any).wires,
      analytics: null,
      settings: null as any,
    };
    const encoded = btoa(JSON.stringify(data));
    return window.location.origin + window.location.pathname + '?circuit=' + encoded;
  }

  loadFromShare(url: string): SaveData | null {
    try {
      const params = new URL(url).searchParams;
      const circuit = params.get('circuit');
      if (!circuit) return null;
      return JSON.parse(atob(circuit)) as SaveData;
    } catch {
      return null;
    }
  }

  startAutoSave(graph: CircuitGraph, levelId: string, analytics: any, settings: Settings, intervalMs?: number): void {
    this.stopAutoSave();
    const interval = intervalMs ?? APP_CONFIG.AUTO_SAVE_INTERVAL_MS;
    this.autoSaveTimer = window.setInterval(() => {
      this.save(graph, levelId, analytics, settings);
    }, interval);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }

  deleteSave(): void {
    localStorage.removeItem(this.storageKey);
  }
}
