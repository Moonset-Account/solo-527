import type { PlayerProfile, TowerType, PlayRecord, LeaderboardEntry } from '@/types';
import { LEVEL_CONFIGS } from '@/config/LevelConfig';
import { uuid } from '@/utils/math';

const PROFILE_KEY = 'tgtd_profile';
const RECORDS_KEY = 'tgtd_playrecords';
const LEADERBOARD_KEY = 'tgtd_leaderboard';

export class ProfileSystem {
  private profile: PlayerProfile;
  private playRecords: PlayRecord[] = [];
  private leaderboard: LeaderboardEntry[] = [];

  constructor() {
    this.profile = this.loadProfile();
    this.playRecords = this.loadRecords();
    this.leaderboard = this.loadLeaderboard();
  }

  private loadProfile(): PlayerProfile {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[Profile] Failed to load profile:', e);
    }
    return this.createDefaultProfile();
  }

  private createDefaultProfile(): PlayerProfile {
    return {
      id: uuid(),
      name: '茶农' + Math.floor(Math.random() * 9000 + 1000),
      level: 1,
      experience: 0,
      gold: 1000,
      unlockedLevels: [LEVEL_CONFIGS[0].id],
      unlockedTowers: ['sniper', 'cannon', 'frost', 'poison', 'tesla', 'barrier'],
      achievements: {},
      completedLevels: {},
      totalPlayTime: 0,
      totalWins: 0,
      totalLosses: 0,
      totalKills: 0,
      highestWave: 0,
      challengeStreak: 0,
      lastDailyDate: '',
    };
  }

  private loadRecords(): PlayRecord[] {
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[Profile] Failed to load records:', e);
    }
    return [];
  }

  private loadLeaderboard(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[Profile] Failed to load leaderboard:', e);
    }
    return this.generateSeedLeaderboard();
  }

  private generateSeedLeaderboard(): LeaderboardEntry[] {
    const names = ['茶仙·陆羽', '茶圣·桑苎', '龙井居士', '武夷山人', '普洱老茶', '蒙顶采茶', '碧螺春意', '铁观音手'];
    const lb: LeaderboardEntry[] = [];
    for (let i = 0; i < names.length; i++) {
      for (const lvl of LEVEL_CONFIGS) {
        lb.push({
          playerId: `seed_${i}_${lvl.id}`,
          playerName: names[i],
          levelId: lvl.id,
          score: Math.floor((100 - i * 10) * lvl.difficulty * 100 + Math.random() * 500),
          time: 60 + i * 30 + Math.floor(Math.random() * 120),
          wave: lvl.waves.length - (i > 3 ? 1 : 0),
          date: new Date(Date.now() - i * 86400000 * 3).toISOString(),
        });
      }
    }
    return lb;
  }

  save(): void {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
      localStorage.setItem(RECORDS_KEY, JSON.stringify(this.playRecords.slice(-100)));
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboard));
    } catch (e) {
      console.warn('[Profile] Save failed:', e);
    }
  }

  getProfile(): PlayerProfile {
    return { ...this.profile };
  }

  getPlayerName(): string {
    return this.profile.name;
  }

  renamePlayer(name: string): void {
    this.profile.name = name;
    this.save();
  }

  getProfileLevel(): { level: number; exp: number; nextExp: number } {
    const lvl = this.profile.level;
    const exp = this.profile.experience;
    const next = lvl * 500;
    return { level: lvl, exp, nextExp: next };
  }

  addExperience(amount: number): number {
    this.profile.experience += amount;
    let leveled = 0;
    while (this.profile.experience >= this.profile.level * 500) {
      this.profile.experience -= this.profile.level * 500;
      this.profile.level++;
      leveled++;
    }
    this.save();
    return leveled;
  }

  addGold(amount: number): void {
    this.profile.gold += amount;
    this.save();
  }

  spendGold(amount: number): boolean {
    if (this.profile.gold >= amount) {
      this.profile.gold -= amount;
      this.save();
      return true;
    }
    return false;
  }

  unlockLevel(levelId: string): boolean {
    if (!this.profile.unlockedLevels.includes(levelId)) {
      this.profile.unlockedLevels.push(levelId);
      this.save();
      return true;
    }
    return false;
  }

  unlockTower(type: TowerType): boolean {
    if (!this.profile.unlockedTowers.includes(type)) {
      this.profile.unlockedTowers.push(type);
      this.save();
      return true;
    }
    return false;
  }

  isLevelUnlocked(levelId: string): boolean {
    return this.profile.unlockedLevels.includes(levelId);
  }

  isTowerUnlocked(type: TowerType): boolean {
    return this.profile.unlockedTowers.includes(type);
  }

  recordPlay(rec: PlayRecord): void {
    this.playRecords.push(rec);
    if (rec.result === 'win') {
      this.profile.totalWins++;
    } else if (rec.result === 'lose') {
      this.profile.totalLosses++;
    }
    this.profile.totalPlayTime += rec.duration ?? 0;
    this.profile.totalKills += rec.enemiesKilled;
    this.profile.highestWave = Math.max(this.profile.highestWave, rec.waveReached);
    this.save();
  }

  getPlayRecords(levelId?: string): PlayRecord[] {
    if (!levelId) return this.playRecords.slice(-30);
    return this.playRecords.filter((r) => r.levelId === levelId).slice(-30);
  }

  setCompletedLevel(levelId: string, stars: number, time: number, wave: number): { isFirst: boolean; improved: boolean } {
    const existing = this.profile.completedLevels[levelId];
    const isFirst = !existing;
    let improved = false;
    if (!existing || stars > existing.stars || (stars === existing.stars && time < existing.bestTime)) {
      this.profile.completedLevels[levelId] = { stars, bestTime: time, bestWave: wave };
      improved = true;
    }
    const idx = LEVEL_CONFIGS.findIndex((l) => l.id === levelId);
    if (idx >= 0 && idx < LEVEL_CONFIGS.length - 1) {
      this.unlockLevel(LEVEL_CONFIGS[idx + 1].id);
    }
    this.save();
    return { isFirst, improved };
  }

  getLevelProgress(levelId: string) {
    return this.profile.completedLevels[levelId];
  }

  getTotalLosses(levelId?: string): number {
    if (!levelId) return this.profile.totalLosses;
    return this.playRecords.filter((r) => r.levelId === levelId && r.result === 'lose').length;
  }

  getTotalWins(levelId?: string): number {
    if (!levelId) return this.profile.totalWins;
    return this.playRecords.filter((r) => r.levelId === levelId && r.result === 'win').length;
  }

  submitLeaderboard(entry: Omit<LeaderboardEntry, 'playerId' | 'playerName' | 'date'>): LeaderboardEntry {
    const full: LeaderboardEntry = {
      ...entry,
      playerId: this.profile.id,
      playerName: this.profile.name,
      date: new Date().toISOString(),
    };
    this.leaderboard.push(full);
    this.save();
    return full;
  }

  getLeaderboard(levelId?: string, limit = 10): LeaderboardEntry[] {
    let list = this.leaderboard;
    if (levelId) list = list.filter((l) => l.levelId === levelId);
    return list.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  getPlayerRank(levelId?: string): number {
    const list = this.getLeaderboard(levelId, 99999);
    const idx = list.findIndex((l) => l.playerId === this.profile.id);
    return idx < 0 ? -1 : idx + 1;
  }

  resetProfile(): void {
    this.profile = this.createDefaultProfile();
    this.playRecords = [];
    this.save();
  }
}
