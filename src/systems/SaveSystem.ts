import { SaveData, GameSettings, GameStateData, LevelConfig } from '@core/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS, SAVE_VERSION } from '@config/defaults';
import { eventBus, GameEvents } from '@core/EventBus';
import { deepClone } from '@core/utils';

export class SaveSystem {
  private static instance: SaveSystem;
  private saveData: SaveData;

  private constructor() {
    this.saveData = this.createDefaultSaveData();
  }

  static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  private createDefaultSaveData(): SaveData {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      settings: deepClone(DEFAULT_SETTINGS),
      completedLevels: [],
      levelProgress: {},
      customLevels: []
    };
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVE_DATA);
      if (!raw) {
        this.saveData = this.createDefaultSaveData();
        return false;
      }

      const parsed = JSON.parse(raw);
      
      if (parsed.version !== SAVE_VERSION) {
        this.migrateSaveData(parsed);
      } else {
        this.saveData = parsed;
      }

      eventBus.emit(GameEvents.LOAD_COMPLETE, this.saveData);
      return true;
    } catch (error) {
      console.error('[SaveSystem] Load failed:', error);
      this.saveData = this.createDefaultSaveData();
      return false;
    }
  }

  private migrateSaveData(data: any): void {
    const defaultData = this.createDefaultSaveData();
    this.saveData = {
      ...defaultData,
      ...data,
      settings: {
        ...defaultData.settings,
        ...data.settings
      }
    };
  }

  save(): boolean {
    try {
      this.saveData.timestamp = Date.now();
      localStorage.setItem(STORAGE_KEYS.SAVE_DATA, JSON.stringify(this.saveData));
      eventBus.emit(GameEvents.SAVE_COMPLETE, this.saveData);
      return true;
    } catch (error) {
      console.error('[SaveSystem] Save failed:', error);
      return false;
    }
  }

  getSaveData(): SaveData {
    return deepClone(this.saveData);
  }

  getSettings(): GameSettings {
    return deepClone(this.saveData.settings);
  }

  updateSettings(settings: Partial<GameSettings>): void {
    this.saveData.settings = {
      ...this.saveData.settings,
      ...settings
    };
    eventBus.emit(GameEvents.SETTINGS_CHANGED, this.saveData.settings);
    this.save();
  }

  setSettings(settings: GameSettings): void {
    this.saveData.settings = deepClone(settings);
    eventBus.emit(GameEvents.SETTINGS_CHANGED, this.saveData.settings);
    this.save();
  }

  completeLevel(levelId: string, steps: number, time: number): void {
    if (!this.saveData.completedLevels.includes(levelId)) {
      this.saveData.completedLevels.push(levelId);
    }

    const currentProgress = this.saveData.levelProgress[levelId];
    const stars = this.calculateStars(steps, time);
    
    if (!currentProgress ||
        steps < currentProgress.bestSteps ||
        time < currentProgress.bestTime ||
        stars > currentProgress.stars) {
      this.saveData.levelProgress[levelId] = {
        bestSteps: currentProgress ? Math.min(steps, currentProgress.bestSteps) : steps,
        bestTime: currentProgress ? Math.min(time, currentProgress.bestTime) : time,
        stars: currentProgress ? Math.max(stars, currentProgress.stars) : stars
      };
    }

    this.save();
  }

  private calculateStars(steps: number, time: number): number {
    let stars = 1;
    if (time < 180) stars = 2;
    if (time < 120 && steps < 100) stars = 3;
    return stars;
  }

  getLevelProgress(levelId: string) {
    return this.saveData.levelProgress[levelId];
  }

  saveLevelState(levelId: string, state: GameStateData): void {
    this.saveData.currentLevelState = state;
    this.save();
  }

  loadLevelState(): GameStateData | undefined {
    return this.saveData.currentLevelState;
  }

  clearLevelState(): void {
    delete this.saveData.currentLevelState;
    this.save();
  }

  getCustomLevels(): LevelConfig[] {
    return deepClone(this.saveData.customLevels);
  }

  addCustomLevel(level: LevelConfig): void {
    const idx = this.saveData.customLevels.findIndex(l => l.id === level.id);
    if (idx >= 0) {
      this.saveData.customLevels[idx] = deepClone(level);
    } else {
      this.saveData.customLevels.push(deepClone(level));
    }
    this.save();
  }

  removeCustomLevel(levelId: string): boolean {
    const idx = this.saveData.customLevels.findIndex(l => l.id === levelId);
    if (idx >= 0) {
      this.saveData.customLevels.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  exportSaveData(): string {
    return JSON.stringify(this.saveData, null, 2);
  }

  importSaveData(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (!data.version || !data.settings) {
        return false;
      }
      this.saveData = data;
      this.save();
      return true;
    } catch {
      return false;
    }
  }

  reset(): void {
    this.saveData = this.createDefaultSaveData();
    localStorage.removeItem(STORAGE_KEYS.SAVE_DATA);
    this.save();
  }

  resetProgress(): void {
    this.saveData.completedLevels = [];
    this.saveData.levelProgress = {};
    this.save();
  }

  hardReset(): void {
    localStorage.removeItem(STORAGE_KEYS.SAVE_DATA);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_LEVELS);
    this.saveData = this.createDefaultSaveData();
  }
}

export const saveSystem = SaveSystem.getInstance();
