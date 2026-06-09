import type { DailyChallenge, PlayRecord, WeatherType } from '@/types';
import { LEVEL_CONFIGS } from '@/config/LevelConfig';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function hashDate(dateStr: string, salt: string = 'tea-garden'): number {
  let h = 0;
  const s = dateStr + salt;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

const WEATHER_POOL: WeatherType[] = ['sunny', 'rain', 'fog', 'snow', 'typhoon'];

export class DailyChallengeSystem {
  getTodayChallenge(): DailyChallenge {
    const today = todayStr();
    const hash = hashDate(today);
    const levelIdx = hash % LEVEL_CONFIGS.length;
    const level = LEVEL_CONFIGS[levelIdx];
    const modifiers = this.generateModifiers(hash, level.difficulty);
    const reward = 100 + level.difficulty * 100;
    return {
      id: `challenge-${today}`,
      date: today,
      levelId: level.id,
      modifiers,
      reward,
    };
  }

  private generateModifiers(hash: number, diff: number): string[] {
    const pool: string[] = [
      'limited_gold',
      'reduced_range',
      'double_speed',
      'hp_boost',
      'weather_' + WEATHER_POOL[hash % WEATHER_POOL.length],
    ];
    if (diff >= 2) pool.push('no_tesla', 'no_frost');
    if (diff >= 3) pool.push('limited_towers');
    const mods: string[] = [];
    const count = Math.min(2, 1 + Math.floor(diff / 2));
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let idx = (hash >> (i * 3)) % pool.length;
      while (used.has(idx)) idx = (idx + 1) % pool.length;
      used.add(idx);
      mods.push(pool[idx]);
    }
    return mods;
  }

  getModifierDescription(mod: string): string {
    switch (mod) {
      case 'limited_gold':
        return '开局金币减少30%';
      case 'reduced_range':
        return '所有塔射程-15%';
      case 'double_speed':
        return '所有敌人速度+25%';
      case 'hp_boost':
        return '所有敌人HP+30%';
      case 'no_tesla':
        return '禁止使用闪电塔';
      case 'no_frost':
        return '禁止使用冰霜塔';
      case 'limited_towers':
        return '最多建造8个塔';
      default:
        if (mod.startsWith('weather_')) {
          const w = mod.split('_')[1];
          return `整局天气：${this.getWeatherName(w)}`;
        }
        return mod;
    }
  }

  private getWeatherName(w: string): string {
    const names: Record<string, string> = {
      sunny: '晴朗',
      rain: '下雨',
      fog: '浓雾',
      snow: '下雪',
      typhoon: '台风',
    };
    return names[w] ?? w;
  }

  isChallengeCompletedToday(lastDate: string): boolean {
    return lastDate === todayStr();
  }

  validate(record: PlayRecord, challenge: DailyChallenge): boolean {
    return (
      record.levelId === challenge.levelId &&
      record.result === 'win' &&
      record.date === challenge.date
    );
  }

  getHistory(days: number = 7): DailyChallenge[] {
    const result: DailyChallenge[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const str = d.toISOString().split('T')[0];
      const hash = hashDate(str);
      const levelIdx = hash % LEVEL_CONFIGS.length;
      const level = LEVEL_CONFIGS[levelIdx];
      const mods = this.generateModifiers(hash, level.difficulty);
      result.push({
        id: `challenge-${str}`,
        date: str,
        levelId: level.id,
        modifiers: mods,
        reward: 100 + level.difficulty * 100,
      });
    }
    return result;
  }
}
