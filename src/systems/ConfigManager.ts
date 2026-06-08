import { LevelConfig, TileType, GameSettings } from '@core/types';
import { eventBus, GameEvents } from '@core/EventBus';
import { DEFAULT_SETTINGS } from '@config/defaults';
import { saveSystem } from '@systems/SaveSystem';
import { deepClone } from '@core/utils';
import { demoLevels } from '@data/levels';

export class ConfigManager {
  private static instance: ConfigManager;
  private gameSettings: GameSettings;
  private levels: Map<string, LevelConfig> = new Map();

  private constructor() {
    this.gameSettings = deepClone(DEFAULT_SETTINGS);
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  initialize(): void {
    const savedSettings = saveSystem.load();
    if (savedSettings) {
      this.gameSettings = saveSystem.getSettings();
    }

    this.loadBuiltInLevels();
    this.loadCustomLevels();
  }

  private loadBuiltInLevels(): void {
    demoLevels.forEach(level => {
      this.levels.set(level.id, deepClone(level));
    });
  }

  private loadCustomLevels(): void {
    const customLevels = saveSystem.getCustomLevels();
    customLevels.forEach(level => {
      this.levels.set(level.id, deepClone(level));
    });
  }

  getSettings(): GameSettings {
    return deepClone(this.gameSettings);
  }

  updateSettings(settings: Partial<GameSettings>): void {
    this.gameSettings = {
      ...this.gameSettings,
      ...settings
    };
    saveSystem.updateSettings(settings);
    eventBus.emit(GameEvents.SETTINGS_CHANGED, this.gameSettings);
  }

  setSettings(settings: GameSettings): void {
    this.gameSettings = deepClone(settings);
    saveSystem.setSettings(settings);
    eventBus.emit(GameEvents.SETTINGS_CHANGED, this.gameSettings);
  }

  getAllLevels(): LevelConfig[] {
    return Array.from(this.levels.values());
  }

  getBuiltInLevels(): LevelConfig[] {
    return demoLevels.map(l => deepClone(l));
  }

  getCustomLevels(): LevelConfig[] {
    return saveSystem.getCustomLevels();
  }

  getLevel(levelId: string): LevelConfig | null {
    return this.levels.has(levelId) ? deepClone(this.levels.get(levelId)!) : null;
  }

  getFirstLevel(): LevelConfig | null {
    const builtIn = this.getBuiltInLevels();
    return builtIn.length > 0 ? deepClone(builtIn[0]) : null;
  }

  getNextLevel(currentLevelId: string): LevelConfig | null {
    const builtIn = this.getBuiltInLevels();
    const currentIndex = builtIn.findIndex(l => l.id === currentLevelId);
    if (currentIndex >= 0 && currentIndex < builtIn.length - 1) {
      return deepClone(builtIn[currentIndex + 1]);
    }
    return null;
  }

  saveCustomLevel(level: LevelConfig): void {
    this.levels.set(level.id, deepClone(level));
    saveSystem.addCustomLevel(level);
  }

  deleteCustomLevel(levelId: string): boolean {
    if (this.levels.has(levelId)) {
      this.levels.delete(levelId);
      return saveSystem.removeCustomLevel(levelId);
    }
    return false;
  }

  isValidLevel(level: LevelConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!level.id || !level.id.trim()) {
      errors.push('关卡ID不能为空');
    }
    if (!level.name || !level.name.trim()) {
      errors.push('关卡名称不能为空');
    }
    if (level.width < 3 || level.height < 3) {
      errors.push('关卡尺寸必须至少为3x3');
    }
    if (level.width > 30 || level.height > 30) {
      errors.push('关卡尺寸不能超过30x30');
    }
    if (!level.grid || level.grid.length !== level.height) {
      errors.push('网格数据不匹配关卡高度');
    } else {
      level.grid.forEach((row, y) => {
        if (row.length !== level.width) {
          errors.push(`第${y}行网格宽度不匹配`);
        }
      });
    }
    if (!level.playerStart) {
      errors.push('缺少玩家起始位置');
    } else {
      if (level.playerStart.x < 0 || level.playerStart.x >= level.width ||
          level.playerStart.y < 0 || level.playerStart.y >= level.height) {
        errors.push('玩家起始位置超出范围');
      }
    }
    if (!level.targetBooks || level.targetBooks.length === 0) {
      errors.push('至少需要一个目标书籍');
    }
    if (!level.maxSteps || level.maxSteps < 10) {
      errors.push('步数限制至少为10步');
    }
    if (!level.bookshelves || level.bookshelves.length === 0) {
      errors.push('至少需要一个书架');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  createEmptyLevel(width: number = 10, height: number = 8): LevelConfig {
    const grid: TileType[][] = [];
    for (let y = 0; y < height; y++) {
      const row: TileType[] = [];
      for (let x = 0; x < width; x++) {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          row.push('wall');
        } else {
          row.push('floor');
        }
      }
      grid.push(row);
    }

    return {
      id: `custom_${Date.now().toString(36)}`,
      name: '自定义关卡',
      description: '玩家创建的关卡',
      width,
      height,
      maxSteps: 100,
      grid,
      playerStart: { x: 1, y: 1 },
      bookshelves: [],
      books: [],
      clues: [],
      indexCards: [],
      targetBooks: []
    };
  }

  getTileSize(): number {
    return this.gameSettings.tileSize;
  }

  setTileSize(size: number): void {
    this.updateSettings({ tileSize: Math.max(16, Math.min(96, size)) });
  }

  getMoveSpeed(): number {
    return this.gameSettings.moveSpeed;
  }

  getAnimationDuration(): number {
    return this.gameSettings.animationDuration;
  }

  getTargetFPS(): number {
    return this.gameSettings.targetFPS;
  }

  isShowFPS(): boolean {
    return this.gameSettings.showFPS;
  }

  isShowGrid(): boolean {
    return this.gameSettings.showGrid;
  }

  toggleShowGrid(): boolean {
    const newValue = !this.gameSettings.showGrid;
    this.updateSettings({ showGrid: newValue });
    return newValue;
  }

  toggleShowFPS(): boolean {
    const newValue = !this.gameSettings.showFPS;
    this.updateSettings({ showFPS: newValue });
    return newValue;
  }

  calculateRequiredTileSize(levelWidth: number, levelHeight: number, maxPixelsWidth: number, maxPixelsHeight: number): number {
    const sizeByWidth = Math.floor(maxPixelsWidth / levelWidth);
    const sizeByHeight = Math.floor(maxPixelsHeight / levelHeight);
    return Math.max(24, Math.min(64, Math.min(sizeByWidth, sizeByHeight)));
  }
}

export const configManager = ConfigManager.getInstance();
