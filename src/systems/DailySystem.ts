import { GameConfig, LevelData } from '@/config/GameConfig';
import { LEVELS } from '@/config/levels';

export interface LeaderboardEntry {
  name: string;
  levelId: number;
  steps: number;
  stars: number;
  timestamp: number;
  isDaily?: boolean;
}

export interface DailyChallenge {
  dateKey: string;
  levelId: number;
  seed: number;
  modifiedLevel: LevelData;
  parSteps: number;
  expiresAt: number;
}

export class DailySystem {
  static getDateKey(d: Date = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  static getSeedFromDate(d: Date = new Date()): number {
    const key = this.getDateKey(d).replace(/-/g, '');
    let h = GameConfig.DAILY_SEED_BASE;
    for (let i = 0; i < key.length; i++) {
      h = (h * 31 + Number(key[i])) >>> 0;
    }
    return h;
  }

  private static mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  static getDailyChallenge(): DailyChallenge {
    const today = new Date();
    const dateKey = this.getDateKey(today);
    const seed = this.getSeedFromDate(today);
    const rng = this.mulberry32(seed);
    const baseLevelIdx = 1 + Math.floor(rng() * Math.min(4, LEVELS.length - 1));
    const base = LEVELS[baseLevelIdx];
    const shuffleFactor = Math.floor(rng() * 3) + 1;
    const maxSteps = Math.max(
      10,
      Math.round(base.maxSteps * (0.85 + rng() * 0.25))
    );

    const modifiedLevel: LevelData = JSON.parse(JSON.stringify(base));
    modifiedLevel.id = -1;
    modifiedLevel.name = `每日挑战 · ${dateKey}`;
    modifiedLevel.description = `${base.description}（每日挑战：在更少的步数内完成！）`;
    modifiedLevel.maxSteps = maxSteps;
    modifiedLevel.starThresholds = [
      maxSteps,
      Math.round(maxSteps * 0.8),
      Math.round(maxSteps * 0.6),
    ] as [number, number, number];

    const shuffledBooks = [...modifiedLevel.books];
    for (let s = 0; s < shuffleFactor; s++) {
      for (let i = shuffledBooks.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = shuffledBooks[i].pos;
        shuffledBooks[i] = { ...shuffledBooks[i], pos: shuffledBooks[j].pos };
        shuffledBooks[j] = { ...shuffledBooks[j], pos: tmp };
      }
    }
    modifiedLevel.books = shuffledBooks;

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      dateKey,
      levelId: base.id,
      seed,
      modifiedLevel,
      parSteps: maxSteps,
      expiresAt: tomorrow.getTime(),
    };
  }

  static getLeaderboard(levelId: number, dailyOnly: boolean = false): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(GameConfig.Storage.KEY_LEADERBOARD);
      const all: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
      return all
        .filter((e) => e.levelId === levelId && (dailyOnly ? !!e.isDaily : !e.isDaily))
        .sort((a, b) => {
          if (a.stars !== b.stars) return b.stars - a.stars;
          return a.steps - b.steps;
        })
        .slice(0, 10);
    } catch (e) {
      return [];
    }
  }

  static submitScore(entry: Omit<LeaderboardEntry, 'timestamp'>): LeaderboardEntry {
    const full: LeaderboardEntry = { ...entry, timestamp: Date.now() };
    try {
      const raw = localStorage.getItem(GameConfig.Storage.KEY_LEADERBOARD);
      const all: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
      all.push(full);
      all.sort((a, b) => {
        if (a.levelId !== b.levelId) return a.levelId - b.levelId;
        if (a.stars !== b.stars) return b.stars - a.stars;
        return a.steps - b.steps;
      });
      const filtered: LeaderboardEntry[] = [];
      const seen = new Set<string>();
      for (const e of all) {
        const key = `${e.isDaily ? 'd' : 'n'}-${e.levelId}-${e.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        filtered.push(e);
      }
      localStorage.setItem(GameConfig.Storage.KEY_LEADERBOARD, JSON.stringify(filtered.slice(0, 200)));
    } catch (e) {
      console.warn('[DailySystem] Failed to submit score');
    }
    return full;
  }

  static getPlayerName(): string {
    try {
      return localStorage.getItem('bookstore_player_name') || '无名管理员';
    } catch {
      return '无名管理员';
    }
  }

  static setPlayerName(name: string): void {
    try {
      localStorage.setItem('bookstore_player_name', name.slice(0, 12));
    } catch {}
  }

  static getTodayProgress(): { completed: boolean; bestSteps: number; stars: number } {
    try {
      const key = `daily_${this.getDateKey()}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { completed: false, bestSteps: -1, stars: 0 };
  }

  static setTodayProgress(steps: number, stars: number): void {
    try {
      const existing = this.getTodayProgress();
      const newEntry = {
        completed: true,
        bestSteps: existing.bestSteps < 0 || steps < existing.bestSteps ? steps : existing.bestSteps,
        stars: Math.max(existing.stars, stars),
      };
      localStorage.setItem(`daily_${this.getDateKey()}`, JSON.stringify(newEntry));
    } catch {}
  }

  static resetLeaderboard(): void {
    try {
      localStorage.removeItem(GameConfig.Storage.KEY_LEADERBOARD);
    } catch {}
  }
}
