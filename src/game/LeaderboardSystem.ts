export type LeaderboardMode = 'campaign' | 'daily' | 'sandbox';

export interface LeaderboardEntry {
  id: string;
  mode: LeaderboardMode;
  levelId: string;
  name: string;
  score: number;
  time: number;
  mistakes: number;
  stars: number;
  createdAt: number;
}

const LEADERBOARD_KEY = 'circuit-sandbox-leaderboard-v1';
const MAX_ENTRIES_PER_KEY = 100;

function storageKey(mode: LeaderboardMode, levelId: string): string {
  return `${LEADERBOARD_KEY}:${mode}:${levelId}`;
}

function generateEntryId(): string {
  return `entry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function hasLocalStorage(): boolean {
  try {
    const testKey = '__ls_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function readEntries(mode: LeaderboardMode, levelId: string): LeaderboardEntry[] {
  const key = storageKey(mode, levelId);
  try {
    if (!hasLocalStorage()) return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LeaderboardEntry[];
  } catch (e) {
    console.warn('[LeaderboardSystem] Failed to read entries:', e);
    return [];
  }
}

function writeEntries(
  mode: LeaderboardMode,
  levelId: string,
  entries: LeaderboardEntry[]
): void {
  const key = storageKey(mode, levelId);
  try {
    if (!hasLocalStorage()) return;
    const sorted = sortEntries(entries).slice(0, MAX_ENTRIES_PER_KEY);
    localStorage.setItem(key, JSON.stringify(sorted));
  } catch (e) {
    console.warn('[LeaderboardSystem] Failed to write entries:', e);
  }
}

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.time !== b.time) return a.time - b.time;
    if (b.mistakes !== a.mistakes) return a.mistakes - b.mistakes;
    return a.createdAt - b.createdAt;
  });
}

export function calculateScore(
  stars: number,
  time: number,
  mistakes: number
): number {
  const starScore = stars * 1000;
  const timeBonus = time > 0 ? Math.max(0, 600 - time * 5) : 0;
  const mistakePenalty = mistakes * 50;
  return Math.max(0, starScore + timeBonus - mistakePenalty);
}

export class LeaderboardSystem {
  static addEntry(
    mode: LeaderboardMode,
    levelId: string,
    name: string,
    score: number,
    time: number,
    mistakes: number,
    stars: number = 0
  ): LeaderboardEntry {
    const entry: LeaderboardEntry = {
      id: generateEntryId(),
      mode,
      levelId,
      name: name.trim() || '匿名玩家',
      score,
      time,
      mistakes,
      stars,
      createdAt: Date.now(),
    };
    const entries = readEntries(mode, levelId);
    entries.push(entry);
    writeEntries(mode, levelId, entries);
    return entry;
  }

  static getTopEntries(
    mode: LeaderboardMode,
    levelId: string,
    limit: number = 10
  ): LeaderboardEntry[] {
    const entries = readEntries(mode, levelId);
    return sortEntries(entries).slice(0, Math.max(1, limit));
  }

  static getPlayerRank(
    mode: LeaderboardMode,
    levelId: string,
    entryId: string
  ): number {
    const entries = sortEntries(readEntries(mode, levelId));
    const idx = entries.findIndex((e) => e.id === entryId);
    return idx === -1 ? -1 : idx + 1;
  }

  static getPlayerRankByScore(
    mode: LeaderboardMode,
    levelId: string,
    score: number,
    time: number = 0,
    mistakes: number = 0
  ): number {
    const entries = sortEntries(readEntries(mode, levelId));
    let rank = 1;
    for (const e of entries) {
      if (e.score > score) {
        rank++;
      } else if (e.score === score) {
        if (e.time < time) {
          rank++;
        } else if (e.time === time && e.mistakes < mistakes) {
          rank++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return rank;
  }

  static clearLevelEntries(mode: LeaderboardMode, levelId: string): void {
    const key = storageKey(mode, levelId);
    try {
      if (hasLocalStorage()) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('[LeaderboardSystem] Failed to clear entries:', e);
    }
  }

  static clearAll(): void {
    try {
      if (!hasLocalStorage()) return;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LEADERBOARD_KEY)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[LeaderboardSystem] Failed to clear all:', e);
    }
  }

  static getEntryCount(mode: LeaderboardMode, levelId: string): number {
    return readEntries(mode, levelId).length;
  }

  static hasEntry(
    mode: LeaderboardMode,
    levelId: string,
    name: string
  ): boolean {
    const entries = readEntries(mode, levelId);
    return entries.some((e) => e.name === name);
  }

  static getPersonalBest(
    mode: LeaderboardMode,
    levelId: string,
    name: string
  ): LeaderboardEntry | null {
    const entries = readEntries(mode, levelId).filter((e) => e.name === name);
    if (entries.length === 0) return null;
    return sortEntries(entries)[0];
  }
}
