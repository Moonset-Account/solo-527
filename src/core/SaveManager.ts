import { SaveData, LevelResult } from '../data/types.js';
import { loadSave, writeSave, saveLevelResult, isLevelUnlocked, getLevelStars, updateSettings } from '../data/saveData.js';

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = loadSave();
  }

  getData(): SaveData {
    return this.data;
  }

  refresh(): void {
    this.data = loadSave();
  }

  saveLevelResult(levelId: string, result: LevelResult): void {
    saveLevelResult(levelId, result);
    this.data = loadSave();
  }

  isLevelUnlocked(levelId: string): boolean {
    return isLevelUnlocked(levelId);
  }

  getLevelStars(levelId: string): number {
    return getLevelStars(levelId);
  }

  updateSettings(settings: Partial<SaveData['settings']>): void {
    updateSettings(settings);
    this.data = loadSave();
  }

  resetAll(): void {
    localStorage.clear();
    this.data = loadSave();
  }
}
