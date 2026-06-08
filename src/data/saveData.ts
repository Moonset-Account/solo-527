import { SaveData, LevelResult } from './types.js';

const SAVE_KEY = 'railway_dispatch_save';

const DEFAULT_SAVE: SaveData = {
  unlockedLevels: ['level1'],
  levelResults: {},
  settings: {
    musicVolume: 0.5,
    sfxVolume: 0.7,
  },
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function saveLevelResult(levelId: string, result: LevelResult): void {
  const save = loadSave();
  const existing = save.levelResults[levelId];
  if (!existing || result.stars > existing.stars || (result.stars === existing.stars && result.bestTime < existing.bestTime)) {
    save.levelResults[levelId] = result;
  }
  if (result.completed) {
    const nextLevel = getNextLevelId(levelId);
    if (nextLevel && !save.unlockedLevels.includes(nextLevel)) {
      save.unlockedLevels.push(nextLevel);
    }
  }
  writeSave(save);
}

export function isLevelUnlocked(levelId: string): boolean {
  const save = loadSave();
  return save.unlockedLevels.includes(levelId);
}

export function getLevelStars(levelId: string): number {
  const save = loadSave();
  return save.levelResults[levelId]?.stars ?? 0;
}

export function updateSettings(settings: Partial<SaveData['settings']>): void {
  const save = loadSave();
  save.settings = { ...save.settings, ...settings };
  writeSave(save);
}

function getNextLevelId(currentId: string): string | null {
  const num = parseInt(currentId.replace('level', ''));
  if (isNaN(num)) return null;
  return `level${num + 1}`;
}
