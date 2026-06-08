import { SaveData, InventoryItem } from '../models/types';

const SAVE_KEY = 'library_night_patrol_save';

export class SaveManager {
  private static instance: SaveManager;
  private data: SaveData;

  private constructor() {
    this.data = this.loadFromStorage();
  }

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  private loadFromStorage(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        return JSON.parse(raw) as SaveData;
      }
    } catch (e) {
      console.warn('存档读取失败，使用默认数据', e);
    }
    return this.getDefault();
  }

  private getDefault(): SaveData {
    return {
      currentChapter: 1,
      currentLevelIndex: 0,
      completedLevels: [],
      inventory: [],
      discoveredClues: [],
      markedSuspects: [],
      wrongAttempts: 0,
      totalWrongAttempts: 0,
      timestamp: Date.now(),
    };
  }

  save(): void {
    this.data.timestamp = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('存档保存失败', e);
    }
  }

  getData(): SaveData {
    return { ...this.data };
  }

  setCurrentChapter(chapter: number): void {
    this.data.currentChapter = chapter;
    this.save();
  }

  setCurrentLevelIndex(index: number): void {
    this.data.currentLevelIndex = index;
    this.save();
  }

  completeLevel(levelId: string): void {
    if (!this.data.completedLevels.includes(levelId)) {
      this.data.completedLevels.push(levelId);
    }
    this.save();
  }

  isLevelCompleted(levelId: string): boolean {
    return this.data.completedLevels.includes(levelId);
  }

  addInventoryItem(item: InventoryItem): void {
    const exists = this.data.inventory.some((i) => i.id === item.id);
    if (!exists) {
      this.data.inventory.push(item);
      this.save();
    }
  }

  removeInventoryItem(id: string): void {
    this.data.inventory = this.data.inventory.filter((i) => i.id !== id);
    this.save();
  }

  getInventory(): InventoryItem[] {
    return [...this.data.inventory];
  }

  discoverClue(clueId: string): void {
    if (!this.data.discoveredClues.includes(clueId)) {
      this.data.discoveredClues.push(clueId);
      this.save();
    }
  }

  getDiscoveredClues(): string[] {
    return [...this.data.discoveredClues];
  }

  markSuspect(bookId: string): void {
    if (!this.data.markedSuspects.includes(bookId)) {
      this.data.markedSuspects.push(bookId);
      this.save();
    }
  }

  unmarkSuspect(bookId: string): void {
    this.data.markedSuspects = this.data.markedSuspects.filter((id) => id !== bookId);
    this.save();
  }

  toggleSuspect(bookId: string): void {
    if (this.data.markedSuspects.includes(bookId)) {
      this.unmarkSuspect(bookId);
    } else {
      this.markSuspect(bookId);
    }
  }

  getMarkedSuspects(): string[] {
    return [...this.data.markedSuspects];
  }

  incrementWrongAttempts(): void {
    this.data.wrongAttempts += 1;
    this.data.totalWrongAttempts += 1;
    this.save();
  }

  resetWrongAttempts(): void {
    this.data.wrongAttempts = 0;
    this.save();
  }

  getWrongAttempts(): number {
    return this.data.wrongAttempts;
  }

  resetForNewLevel(): void {
    this.data.inventory = [];
    this.data.discoveredClues = [];
    this.data.markedSuspects = [];
    this.data.wrongAttempts = 0;
    this.save();
  }

  clearSave(): void {
    this.data = this.getDefault();
    localStorage.removeItem(SAVE_KEY);
  }
}
