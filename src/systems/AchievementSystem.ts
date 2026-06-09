import { GameConfig } from '@/config/GameConfig';
import { SaveSystem, GameSaveData } from './SaveSystem';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: { current: number; total: number };
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (save: GameSaveData, event?: AchievementEvent) => boolean;
  progress?: (save: GameSaveData) => { current: number; total: number };
}

export interface AchievementEvent {
  type: 'level_complete' | 'book_sorted' | 'card_repaired' | 'clue_found' | 'perfect_level';
  levelId?: number;
  stars?: number;
  count?: number;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_step',
    name: '初入夜路',
    description: '完成第一关',
    icon: '🌙',
    check: (save) => save.levels[1]?.completed === true,
  },
  {
    id: 'bookworm',
    name: '书虫觉醒',
    description: '累计整理10本书',
    icon: '📚',
    check: (save) => save.totalBooksSorted >= 10,
    progress: (save) => ({ current: Math.min(save.totalBooksSorted, 10), total: 10 }),
  },
  {
    id: 'archivist',
    name: '归档大师',
    description: '累计修复20张索引卡',
    icon: '📇',
    check: (save) => save.totalCardsRepaired >= 20,
    progress: (save) => ({ current: Math.min(save.totalCardsRepaired, 20), total: 20 }),
  },
  {
    id: 'detective',
    name: '深夜侦探',
    description: '收集15条线索',
    icon: '🔍',
    check: (save) => save.totalCluesFound >= 15,
    progress: (save) => ({ current: Math.min(save.totalCluesFound, 15), total: 15 }),
  },
  {
    id: 'three_star_lv1',
    name: '完美起点',
    description: '第一关获得三星',
    icon: '⭐',
    check: (save) => save.levels[1]?.stars >= 3,
  },
  {
    id: 'all_levels',
    name: '深夜守护者',
    description: '完成所有关卡',
    icon: '🏆',
    check: (save) => {
      for (let i = 1; i <= GameConfig.TOTAL_LEVELS; i++) {
        if (!save.levels[i]?.completed) return false;
      }
      return true;
    },
    progress: (save) => {
      let done = 0;
      for (let i = 1; i <= GameConfig.TOTAL_LEVELS; i++) {
        if (save.levels[i]?.completed) done++;
      }
      return { current: done, total: GameConfig.TOTAL_LEVELS };
    },
  },
  {
    id: 'all_stars',
    name: '全星收藏家',
    description: '所有关卡获得三星',
    icon: '🌟',
    check: (save) => {
      for (let i = 1; i <= GameConfig.TOTAL_LEVELS; i++) {
        if (save.levels[i]?.stars < 3) return false;
      }
      return true;
    },
    progress: (save) => {
      let done = 0;
      for (let i = 1; i <= GameConfig.TOTAL_LEVELS; i++) {
        if (save.levels[i]?.stars >= 3) done++;
      }
      return { current: done, total: GameConfig.TOTAL_LEVELS };
    },
  },
  {
    id: 'efficient',
    name: '高效管理员',
    description: '在某关使用少于阈值一半的步数',
    icon: '⚡',
    check: (_save, event) => {
      return event?.type === 'level_complete' && event.stars === 3;
    },
  },
];

export class AchievementSystem {
  private static cache: Record<string, Achievement> | null = null;

  static loadAll(): Achievement[] {
    if (!this.cache) this.cache = this.loadFromStorage();
    const save = SaveSystem.loadSave();
    return ACHIEVEMENT_DEFS.map((def) => {
      const existing = this.cache![def.id];
      const progress = def.progress ? def.progress(save) : undefined;
      if (!existing) {
        return {
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          unlocked: false,
          progress,
        };
      }
      return { ...existing, progress };
    });
  }

  private static loadFromStorage(): Record<string, Achievement> {
    try {
      const raw = localStorage.getItem(GameConfig.Storage.KEY_ACHIEVEMENTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[AchievementSystem] Failed to load achievements');
    }
    return {};
  }

  private static persist(): void {
    if (!this.cache) return;
    try {
      localStorage.setItem(GameConfig.Storage.KEY_ACHIEVEMENTS, JSON.stringify(this.cache));
    } catch (e) {
      console.error('[AchievementSystem] Failed to persist:', e);
    }
  }

  static checkAndUnlock(event?: AchievementEvent): Achievement[] {
    if (!this.cache) this.cache = this.loadFromStorage();
    const save = SaveSystem.loadSave();
    const newlyUnlocked: Achievement[] = [];

    for (const def of ACHIEVEMENT_DEFS) {
      if (this.cache[def.id]?.unlocked) continue;
      try {
        if (def.check(save, event)) {
          const ach: Achievement = {
            id: def.id,
            name: def.name,
            description: def.description,
            icon: def.icon,
            unlocked: true,
            unlockedAt: Date.now(),
          };
          this.cache[def.id] = ach;
          newlyUnlocked.push(ach);
        }
      } catch (e) {
        console.warn(`[AchievementSystem] Error checking ${def.id}:`, e);
      }
    }

    if (newlyUnlocked.length > 0) this.persist();
    return newlyUnlocked;
  }

  static getUnlockedCount(): number {
    const all = this.loadAll();
    return all.filter((a) => a.unlocked).length;
  }

  static reset(): void {
    this.cache = {};
    this.persist();
  }
}
