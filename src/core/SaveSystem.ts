export const SAVE_KEY = 'circuit-sandbox-save-v1';
export const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  createdAt: number;
  updatedAt: number;
  data: Record<string, unknown>;
}

export type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

export interface SaveSystemOptions {
  saveKey?: string;
  migrations?: Record<number, MigrationFn>;
  currentVersion?: number;
}

export class SaveSystem {
  private saveKey: string;
  private currentVersion: number;
  private migrations: Record<number, MigrationFn>;
  private inMemoryCache: Record<string, unknown> | null = null;
  private useMemoryFallback: boolean;

  constructor(options: SaveSystemOptions = {}) {
    this.saveKey = options.saveKey ?? SAVE_KEY;
    this.currentVersion = options.currentVersion ?? SAVE_VERSION;
    this.migrations = options.migrations ?? {};
    this.useMemoryFallback = false;
  }

  private hasLocalStorage(): boolean {
    try {
      const testKey = '__ls_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private readRaw(): SaveData | null {
    if (!this.useMemoryFallback && this.hasLocalStorage()) {
      try {
        const raw = localStorage.getItem(this.saveKey);
        if (!raw) return null;
        return JSON.parse(raw) as SaveData;
      } catch (e) {
        console.warn('[SaveSystem] Failed to read save, resetting:', e);
        return null;
      }
    }
    if (this.inMemoryCache === null) return null;
    return {
      version: this.currentVersion,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: this.inMemoryCache,
    };
  }

  private writeRaw(data: SaveData): void {
    if (!this.useMemoryFallback && this.hasLocalStorage()) {
      try {
        localStorage.setItem(this.saveKey, JSON.stringify(data));
        return;
      } catch (e) {
        console.warn('[SaveSystem] Failed to write save, using memory fallback:', e);
        this.useMemoryFallback = true;
      }
    }
    this.inMemoryCache = data.data;
  }

  private migrateIfNeeded(save: SaveData): SaveData {
    if (save.version >= this.currentVersion) {
      return save;
    }
    let data = save.data;
    for (let v = save.version; v < this.currentVersion; v++) {
      const migration = this.migrations[v];
      if (migration) {
        try {
          data = migration(data);
        } catch (e) {
          console.error(`[SaveSystem] Migration from v${v} failed:`, e);
        }
      }
    }
    return {
      ...save,
      version: this.currentVersion,
      updatedAt: Date.now(),
      data,
    };
  }

  private loadOrInit(): SaveData {
    let save = this.readRaw();
    if (!save) {
      save = {
        version: this.currentVersion,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };
      this.writeRaw(save);
      return save;
    }
    if (save.version < this.currentVersion) {
      save = this.migrateIfNeeded(save);
      this.writeRaw(save);
    }
    return save;
  }

  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const save = this.loadOrInit();
    const value = save.data[key];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value as T;
  }

  set<T = unknown>(key: string, value: T): void {
    const save = this.loadOrInit();
    save.data[key] = value as unknown;
    save.updatedAt = Date.now();
    this.writeRaw(save);
  }

  remove(key: string): boolean {
    const save = this.loadOrInit();
    if (!(key in save.data)) {
      return false;
    }
    delete save.data[key];
    save.updatedAt = Date.now();
    this.writeRaw(save);
    return true;
  }

  has(key: string): boolean {
    const save = this.loadOrInit();
    return key in save.data;
  }

  reset(): void {
    const newSave: SaveData = {
      version: this.currentVersion,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {},
    };
    this.writeRaw(newSave);
  }

  getAll(): Record<string, unknown> {
    const save = this.loadOrInit();
    return { ...save.data };
  }

  getSaveMeta(): { version: number; createdAt: number; updatedAt: number } {
    const save = this.loadOrInit();
    return {
      version: save.version,
      createdAt: save.createdAt,
      updatedAt: save.updatedAt,
    };
  }

  exportRaw(): SaveData {
    return this.loadOrInit();
  }

  importRaw(data: SaveData): boolean {
    try {
      if (typeof data !== 'object' || data === null) return false;
      if (typeof data.version !== 'number') return false;
      if (typeof data.data !== 'object' || data.data === null) return false;
      let save = data;
      if (save.version < this.currentVersion) {
        save = this.migrateIfNeeded(save);
      }
      this.writeRaw(save);
      return true;
    } catch (e) {
      console.error('[SaveSystem] Import failed:', e);
      return false;
    }
  }

  getVersion(): number {
    return this.currentVersion;
  }

  getSaveKey(): string {
    return this.saveKey;
  }
}
