import type { Level, LevelResultContext } from './data/levels';
import { LEVELS } from './data/levels';
import type { LevelRecord } from './data/achievements';

export interface QuestSaveData {
  levelRecords?: Record<string, LevelRecord>;
  unlockedLevels?: string[];
}

export class QuestSystem {
  static isLevelUnlocked(
    levelId: string,
    saveData: QuestSaveData
  ): boolean {
    const unlocked = saveData.unlockedLevels ?? [];
    if (unlocked.includes(levelId)) return true;

    const levelIndex = LEVELS.findIndex((l) => l.id === levelId);
    if (levelIndex === -1) return false;
    if (levelIndex === 0) return true;

    const prevLevel = LEVELS[levelIndex - 1];
    const prevRecord = saveData.levelRecords?.[prevLevel.id];
    return prevRecord?.completed ?? false;
  }

  static getAvailableLevels(saveData: QuestSaveData): Level[] {
    return LEVELS.filter((level) => QuestSystem.isLevelUnlocked(level.id, saveData));
  }

  static getNextLevelId(
    currentId: string,
    saveData: QuestSaveData
  ): string | null {
    const currentIdx = LEVELS.findIndex((l) => l.id === currentId);
    if (currentIdx === -1 || currentIdx >= LEVELS.length - 1) {
      return null;
    }
    const nextLevel = LEVELS[currentIdx + 1];
    if (QuestSystem.isLevelUnlocked(nextLevel.id, saveData)) {
      return nextLevel.id;
    }
    return null;
  }

  static evaluateStars(
    level: Level,
    context: LevelResultContext
  ): number {
    let stars = 0;
    for (const condition of level.starConditions) {
      if (condition.check(context)) {
        stars = Math.max(stars, condition.stars);
      }
    }
    return stars;
  }

  static completeLevel(
    level: Level,
    context: LevelResultContext,
    saveData: QuestSaveData
  ): {
    levelRecords: Record<string, LevelRecord>;
    unlockedLevels: string[];
    stars: number;
    isNew: boolean;
    improvedStars: boolean;
    improvedTime: boolean;
  } {
    const stars = QuestSystem.evaluateStars(level, context);
    const existing = saveData.levelRecords?.[level.id];
    const isNew = !existing?.completed;
    const improvedStars = !existing || stars > (existing.stars ?? 0);
    const improvedTime =
      !existing || (context.time > 0 && context.time < (existing.time ?? Infinity));

    const levelRecord: LevelRecord = {
      levelId: level.id,
      completed: true,
      stars: Math.max(existing?.stars ?? 0, stars),
      mistakes: existing
        ? Math.min(existing.mistakes, context.mistakes)
        : context.mistakes,
      time:
        existing && existing.time > 0
          ? Math.min(existing.time, context.time > 0 ? context.time : existing.time)
          : context.time,
      completedAt: existing?.completedAt ?? Date.now(),
    };

    const levelRecords = {
      ...(saveData.levelRecords ?? {}),
      [level.id]: levelRecord,
    };

    const unlockedSet = new Set<string>(saveData.unlockedLevels ?? []);
    unlockedSet.add(level.id);

    const levelIndex = LEVELS.findIndex((l) => l.id === level.id);
    if (levelIndex >= 0 && levelIndex < LEVELS.length - 1) {
      unlockedSet.add(LEVELS[levelIndex + 1].id);
    }

    return {
      levelRecords,
      unlockedLevels: Array.from(unlockedSet),
      stars,
      isNew,
      improvedStars,
      improvedTime,
    };
  }

  static getLevelProgress(
    levelId: string,
    saveData: QuestSaveData
  ): LevelRecord | null {
    return saveData.levelRecords?.[levelId] ?? null;
  }

  static getTotalStars(saveData: QuestSaveData): number {
    const records = Object.values(saveData.levelRecords ?? {});
    return records.reduce((sum, r) => sum + (r.stars ?? 0), 0);
  }

  static getCompletedLevelCount(saveData: QuestSaveData): number {
    const records = Object.values(saveData.levelRecords ?? {});
    return records.filter((r) => r.completed).length;
  }

  static getThreeStarCount(saveData: QuestSaveData): number {
    const records = Object.values(saveData.levelRecords ?? {});
    return records.filter((r) => (r.stars ?? 0) >= 3).length;
  }

  static getPerfectLevelCount(saveData: QuestSaveData): number {
    const records = Object.values(saveData.levelRecords ?? {});
    return records.filter((r) => r.completed && r.mistakes === 0).length;
  }
}
