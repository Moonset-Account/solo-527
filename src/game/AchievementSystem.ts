import {
  ACHIEVEMENTS,
  checkAllAchievements,
  type SaveDataLite,
} from './data/achievements';

export class AchievementSystem {
  static checkNewAchievements(
    prevSave: SaveDataLite,
    newSave: SaveDataLite
  ): string[] {
    const prevUnlocked = new Set(prevSave.achievements ?? []);
    const newAchievements = checkAllAchievements(newSave);
    const result: string[] = [];
    for (const id of newAchievements) {
      if (!prevUnlocked.has(id)) {
        result.push(id);
      }
    }
    return result;
  }

  static getUnlockedAchievements(saveData: SaveDataLite): string[] {
    return saveData.achievements ?? [];
  }

  static updateAchievements(
    currentUnlocked: string[],
    newIds: string[]
  ): string[] {
    const set = new Set(currentUnlocked);
    for (const id of newIds) {
      set.add(id);
    }
    return Array.from(set);
  }

  static isAchievementUnlocked(
    achievementId: string,
    saveData: SaveDataLite
  ): boolean {
    return (saveData.achievements ?? []).includes(achievementId);
  }

  static getAchievementProgress(
    achievementId: string,
    saveData: SaveDataLite
  ): { unlocked: boolean; description: string; current: number; target: number } {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    const unlocked = AchievementSystem.isAchievementUnlocked(
      achievementId,
      saveData
    );

    const prog = AchievementSystem.getProgressValues(achievementId, saveData);
    return {
      unlocked,
      description: achievement?.desc ?? '',
      current: prog.current,
      target: prog.target,
    };
  }

  private static getProgressValues(
    id: string,
    sd: SaveDataLite
  ): { current: number; target: number } {
    switch (id) {
      case 'first_bulb':
        return { current: Math.min(sd.totalBulbsLit ?? 0, 1), target: 1 };
      case 'three_bulbs':
        return { current: Math.min(sd.totalBulbsLit ?? 0, 3), target: 3 };
      case 'flawless': {
        const records = Object.values(sd.levelRecords ?? {});
        const perfect = records.filter(
          (r) => r.completed && r.mistakes === 0
        ).length;
        return { current: Math.min(perfect, 1), target: 1 };
      }
      case 'resistor_artist':
        return { current: Math.min(sd.resistorsUsed ?? 0, 20), target: 20 };
      case 'capacitor_pioneer':
        return { current: Math.min(sd.capacitorsUsed ?? 0, 1), target: 1 };
      case 'zero_mistake_master':
        return { current: Math.min(sd.perfectLevels ?? 0, 5), target: 5 };
      case 'speed_runner': {
        const records = Object.values(sd.levelRecords ?? {});
        const fast = records.some((r) => r.completed && r.time > 0 && r.time < 30)
          ? 1
          : 0;
        return { current: fast, target: 1 };
      }
      case 'sandbox_architect':
        return { current: Math.min(sd.sandboxComponents ?? 0, 50), target: 50 };
      case 'three_day_streak':
        return { current: Math.min(sd.dailyPlayStreak ?? 0, 3), target: 3 };
      case 'perfectionist':
        return { current: Math.min(sd.threeStarLevels ?? 0, 5), target: 5 };
      case 'explorer':
        return { current: Math.min(sd.levelsCompleted ?? 0, 10), target: 10 };
      case 'short_circuit_researcher':
        return { current: Math.min(sd.totalShortCircuits ?? 0, 10), target: 10 };
      default:
        return { current: 0, target: 1 };
    }
  }

  static getTotalAchievementCount(): number {
    return ACHIEVEMENTS.length;
  }

  static getUnlockedCount(saveData: SaveDataLite): number {
    return (saveData.achievements ?? []).length;
  }
}
