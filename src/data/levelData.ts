import level001 from './levels/level-001.json';
import level002 from './levels/level-002.json';
import level003 from './levels/level-003.json';
import level004 from './levels/level-004.json';
import level005 from './levels/level-005.json';
import level006 from './levels/level-006.json';
import level007 from './levels/level-007.json';
import level008 from './levels/level-008.json';

import type { LevelConfig, PlayerProgress } from '../game/types';

const rawLevels: LevelConfig[] = [
  level001 as unknown as LevelConfig,
  level002 as unknown as LevelConfig,
  level003 as unknown as LevelConfig,
  level004 as unknown as LevelConfig,
  level005 as unknown as LevelConfig,
  level006 as unknown as LevelConfig,
  level007 as unknown as LevelConfig,
  level008 as unknown as LevelConfig,
];

export const LEVELS: LevelConfig[] = [...rawLevels].sort((a, b) => a.order - b.order);

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function getLevelByOrder(order: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.order === order);
}

export function getTutorialLevels(): LevelConfig[] {
  return LEVELS.filter((level) => level.difficulty === 'tutorial');
}

export function getNextLevelId(currentId: string): string | null {
  const currentIndex = LEVELS.findIndex((level) => level.id === currentId);
  if (currentIndex === -1 || currentIndex >= LEVELS.length - 1) {
    return null;
  }
  return LEVELS[currentIndex + 1].id;
}

export function isLevelUnlocked(progress: PlayerProgress, levelId: string): boolean {
  const level = getLevelById(levelId);
  if (!level) return false;

  if (level.prerequisites.length === 0) return true;

  return level.prerequisites.every((prereqId) =>
    progress.unlockedLevelIds.includes(prereqId)
  );
}
