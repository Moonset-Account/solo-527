import { GameConfig } from '@/config/GameConfig';

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  bestSteps: number;
  stars: number;
  completedAt?: number;
}

export interface GameSaveData {
  currentLevel: number;
  levels: Record<number, LevelProgress>;
  totalSteps: number;
  totalBooksSorted: number;
  totalCardsRepaired: number;
  totalCluesFound: number;
  lastPlayed: number;
  saveVersion: number;
}

export interface SettingsData {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  enableMusic: boolean;
  enableSfx: boolean;
  showDebug: boolean;
  showTileGrid: boolean;
  moveSmoothing: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  masterVolume: GameConfig.Audio.MASTER_VOLUME_DEFAULT,
  sfxVolume: GameConfig.Audio.SFX_VOLUME_DEFAULT,
  musicVolume: GameConfig.Audio.MUSIC_VOLUME_DEFAULT,
  enableMusic: true,
  enableSfx: true,
  showDebug: false,
  showTileGrid: false,
  moveSmoothing: true,
};

export class SaveSystem {
  private static saveCache: GameSaveData | null = null;
  private static settingsCache: SettingsData | null = null;

  static createDefaultSave(): GameSaveData {
    const levels: Record<number, LevelProgress> = {};
    for (let i = 1; i <= GameConfig.TOTAL_LEVELS; i++) {
      levels[i] = {
        levelId: i,
        completed: false,
        bestSteps: -1,
        stars: 0,
      };
    }
    return {
      currentLevel: 1,
      levels,
      totalSteps: 0,
      totalBooksSorted: 0,
      totalCardsRepaired: 0,
      totalCluesFound: 0,
      lastPlayed: Date.now(),
      saveVersion: 1,
    };
  }

  static loadSave(): GameSaveData {
    if (this.saveCache) return { ...this.saveCache };
    try {
      const raw = localStorage.getItem(GameConfig.Storage.KEY_SAVE);
      if (raw) {
        const parsed = JSON.parse(raw) as GameSaveData;
        this.saveCache = this.validateSave(parsed);
        return { ...this.saveCache };
      }
    } catch (e) {
      console.warn('[SaveSystem] Failed to load save, creating new one');
    }
    const fresh = this.createDefaultSave();
    this.saveCache = fresh;
    this.persistSave();
    return { ...fresh };
  }

  private static validateSave(data: GameSaveData): GameSaveData {
    const defaults = this.createDefaultSave();
    if (!data.levels) data.levels = defaults.levels;
    for (let i = 1; i <= GameConfig.TOTAL_LEVELS; i++) {
      if (!data.levels[i]) {
        data.levels[i] = defaults.levels[i];
      }
    }
    if (typeof data.totalSteps !== 'number') data.totalSteps = 0;
    if (typeof data.totalBooksSorted !== 'number') data.totalBooksSorted = 0;
    if (typeof data.totalCardsRepaired !== 'number') data.totalCardsRepaired = 0;
    if (typeof data.totalCluesFound !== 'number') data.totalCluesFound = 0;
    if (typeof data.currentLevel !== 'number') data.currentLevel = 1;
    return data;
  }

  static updateSaveLevel(levelId: number, steps: number, stars: number): GameSaveData {
    const save = this.loadSave();
    const level = save.levels[levelId] || this.createDefaultSave().levels[levelId];

    if (steps >= 0 && (!level.completed || level.bestSteps < 0 || steps < level.bestSteps)) {
      level.bestSteps = steps;
    }
    if (stars > level.stars) level.stars = stars;
    if (!level.completed) {
      level.completed = true;
      level.completedAt = Date.now();
    }
    save.levels[levelId] = level;
    save.totalSteps += steps;
    if (levelId >= save.currentLevel && levelId < GameConfig.TOTAL_LEVELS) {
      save.currentLevel = Math.max(save.currentLevel, levelId + 1);
    }
    save.lastPlayed = Date.now();
    this.saveCache = save;
    this.persistSave();
    return { ...save };
  }

  static incrementStats(books: number = 0, cards: number = 0, clues: number = 0): GameSaveData {
    const save = this.loadSave();
    save.totalBooksSorted += books;
    save.totalCardsRepaired += cards;
    save.totalCluesFound += clues;
    save.lastPlayed = Date.now();
    this.saveCache = save;
    this.persistSave();
    return { ...save };
  }

  static setCurrentLevel(levelId: number): GameSaveData {
    const save = this.loadSave();
    save.currentLevel = Math.max(1, Math.min(GameConfig.TOTAL_LEVELS, levelId));
    this.saveCache = save;
    this.persistSave();
    return { ...save };
  }

  static persistSave(): void {
    if (!this.saveCache) return;
    try {
      localStorage.setItem(GameConfig.Storage.KEY_SAVE, JSON.stringify(this.saveCache));
    } catch (e) {
      console.error('[SaveSystem] Failed to persist save:', e);
    }
  }

  static loadSettings(): SettingsData {
    if (this.settingsCache) return { ...this.settingsCache };
    try {
      const raw = localStorage.getItem(GameConfig.Storage.KEY_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsData>;
        this.settingsCache = { ...DEFAULT_SETTINGS, ...parsed };
        return { ...this.settingsCache };
      }
    } catch (e) {
      console.warn('[SaveSystem] Failed to load settings');
    }
    this.settingsCache = { ...DEFAULT_SETTINGS };
    this.persistSettings();
    return { ...this.settingsCache };
  }

  static updateSettings(patch: Partial<SettingsData>): SettingsData {
    const current = this.loadSettings();
    const merged = { ...current, ...patch };
    this.settingsCache = merged;
    this.persistSettings();
    return { ...merged };
  }

  static persistSettings(): void {
    if (!this.settingsCache) return;
    try {
      localStorage.setItem(GameConfig.Storage.KEY_SETTINGS, JSON.stringify(this.settingsCache));
    } catch (e) {
      console.error('[SaveSystem] Failed to persist settings:', e);
    }
  }

  static resetAll(): void {
    this.saveCache = this.createDefaultSave();
    this.settingsCache = { ...DEFAULT_SETTINGS };
    this.persistSave();
    this.persistSettings();
  }

  static resetLevel(levelId: number): void {
    const save = this.loadSave();
    save.levels[levelId] = this.createDefaultSave().levels[levelId];
    this.saveCache = save;
    this.persistSave();
  }
}
