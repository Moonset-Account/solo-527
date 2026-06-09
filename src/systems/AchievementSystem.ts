import { EventBus } from '@/core/EventBus';
import { ACHIEVEMENTS } from '@/config/AchievementConfig';
import type { AchievementDef, PlayerProfile } from '@/types';

export class AchievementSystem {
  private eventBus: EventBus;
  private unlocked: Set<string>;
  private pendingUnlocks: AchievementDef[] = [];
  private stats: {
    bossKills: number;
    maxTowersBuilt: number;
    maxTower: boolean;
    perfectClear: number;
    weatherSet: Set<string>;
  } = {
    bossKills: 0,
    maxTowersBuilt: 0,
    maxTower: false,
    perfectClear: 0,
    weatherSet: new Set(),
  };

  constructor(profile: PlayerProfile) {
    this.eventBus = EventBus.getInstance();
    this.unlocked = new Set(Object.keys(profile.achievements).filter((k) => profile.achievements[k]));
  }

  registerBossKill(): void {
    this.stats.bossKills++;
  }

  registerTowersBuilt(count: number): void {
    this.stats.maxTowersBuilt = Math.max(this.stats.maxTowersBuilt, count);
  }

  registerMaxTower(): void {
    this.stats.maxTower = true;
  }

  registerPerfectClear(): void {
    this.stats.perfectClear++;
  }

  registerWeatherPlayed(w: string): void {
    this.stats.weatherSet.add(w);
  }

  checkAll(profile: PlayerProfile): AchievementDef[] {
    const newlyUnlocked: AchievementDef[] = [];

    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;
      let unlocked = false;
      switch (ach.condition) {
        case 'totalWins':
          unlocked = profile.totalWins >= ach.target;
          break;
        case 'totalKills':
          unlocked = profile.totalKills >= ach.target;
          break;
        case 'bossKills':
          unlocked = this.stats.bossKills >= ach.target;
          break;
        case 'towersBuilt10':
          unlocked = this.stats.maxTowersBuilt >= ach.target;
          break;
        case 'maxTower':
          unlocked = this.stats.maxTower;
          break;
        case 'perfectClear':
          unlocked = this.stats.perfectClear >= ach.target;
          break;
        case 'allWeather':
          unlocked = this.stats.weatherSet.size >= ach.target;
          break;
        case 'challengeStreak':
          unlocked = profile.challengeStreak >= ach.target;
          break;
        case 'level3Clear':
          unlocked = !!profile.completedLevels['level-3'];
          break;
      }
      if (unlocked) {
        this.unlocked.add(ach.id);
        newlyUnlocked.push(ach);
        this.eventBus.emit('achievement:unlock', ach);
      }
    }
    return newlyUnlocked;
  }

  getUnlocked(_profile: PlayerProfile): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    this.unlocked.forEach((id) => {
      result[id] = true;
    });
    return result;
  }

  getPending(): AchievementDef[] {
    return this.pendingUnlocks;
  }
}
