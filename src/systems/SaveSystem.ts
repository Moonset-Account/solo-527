import { SaveData, SettingsData, LevelSave } from '@/types';

const SAVE_KEY = 'nightbookstore_save';
const SETTINGS_KEY = 'nightbookstore_settings';

const DEFAULT_SAVE: SaveData = {
  version: '1.0.0',
  lastPlayedLevel: 0,
  levels: {},
};

const DEFAULT_SETTINGS: SettingsData = {
  masterVolume: 0.8,
  bgmVolume: 0.6,
  sfxVolume: 0.8,
  fullscreen: false,
};

export class SaveSystem {
  private saveData: SaveData;
  private settingsData: SettingsData;

  constructor() {
    this.saveData = this.loadSave();
    this.settingsData = this.loadSettings();
  }

  private loadSave(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load save:', e);
    }
    return { ...DEFAULT_SAVE, levels: {} };
  }

  private loadSettings(): SettingsData {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  persistSave(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.saveData));
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }

  persistSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settingsData));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  getSave(): SaveData { return this.saveData; }
  getSettings(): SettingsData { return this.settingsData; }

  getLevelSave(levelId: string): LevelSave | undefined {
    return this.saveData.levels[levelId];
  }

  saveLevelResult(levelId: string, completed: boolean, steps: number, stars: number): void {
    const existing = this.saveData.levels[levelId];
    if (!existing || steps < existing.bestSteps) {
      this.saveData.levels[levelId] = { levelId, completed, bestSteps: steps, stars };
    } else if (completed && !existing.completed) {
      existing.completed = true;
      existing.stars = Math.max(existing.stars, stars);
    }
    this.saveData.lastPlayedLevel = parseInt(levelId.replace(/\D/g, '')) || 0;
    this.persistSave();
  }

  isLevelUnlocked(levelId: string): boolean {
    const num = parseInt(levelId.replace(/\D/g, '')) || 0;
    if (num <= 1) return true;
    const prevId = `level_${String(num - 1).padStart(2, '0')}`;
    const prev = this.saveData.levels[prevId];
    return prev ? prev.completed : false;
  }

  updateSettings(partial: Partial<SettingsData>): void {
    Object.assign(this.settingsData, partial);
    this.persistSettings();
  }

  resetSave(): void {
    this.saveData = { ...DEFAULT_SAVE, levels: {} };
    this.persistSave();
  }
}
