import type { PlayRecord, TowerType, WeatherType, Vec2 } from '@/types';
import { uuid } from '@/utils/math';

type TowerCount = Record<TowerType, number>;

const emptyTowerCount: TowerCount = {
  sniper: 0,
  cannon: 0,
  frost: 0,
  poison: 0,
  tesla: 0,
  barrier: 0,
};

export class PlayRecorder {
  private record: Omit<PlayRecord, 'date' | 'result' | 'startTime'> & { startTime: number };

  constructor(levelId: string, startTime: number, weather: WeatherType) {
    this.record = {
      levelId,
      startTime,
      weather,
      waveReached: 0,
      livesRemaining: 0,
      goldRemaining: 0,
      goldSpent: 0,
      towersBuilt: { ...emptyTowerCount },
      towersUpgraded: 0,
      enemiesKilled: 0,
      criticalChoices: [],
    };
  }

  setWaveReached(w: number): void {
    this.record.waveReached = Math.max(this.record.waveReached, w);
  }

  setLivesRemaining(l: number): void {
    this.record.livesRemaining = l;
  }

  setGoldRemaining(g: number): void {
    this.record.goldRemaining = g;
  }

  setGoldSpent(g: number): void {
    this.record.goldSpent = g;
  }

  registerTowerBuilt(type: TowerType, position: Vec2, wave: number): void {
    this.record.towersBuilt[type] = (this.record.towersBuilt[type] ?? 0) + 1;
    this.addChoice(`第${wave}波于(${position.x.toFixed(0)},${position.y.toFixed(0)})建造${this.getTowerName(type)}`);
  }

  registerTowerUpgraded(type: TowerType, fromLv: number, toLv: number, wave: number): void {
    this.record.towersUpgraded++;
    this.addChoice(`第${wave}波将${this.getTowerName(type)}从${fromLv}级升至${toLv}级`);
  }

  registerTowerSold(type: TowerType, wave: number): void {
    this.addChoice(`第${wave}波出售了一座${this.getTowerName(type)}`);
  }

  registerEnemyKilled(): void {
    this.record.enemiesKilled++;
  }

  setFailureReason(reason: string): void {
    this.record.failureReason = reason;
  }

  addChoice(choice: string): void {
    if (this.record.criticalChoices.length < 10) {
      this.record.criticalChoices.push(choice);
    }
  }

  private getTowerName(t: TowerType): string {
    const names: Record<TowerType, string> = {
      sniper: '狙击塔',
      cannon: '炮台',
      frost: '冰霜塔',
      poison: '毒雾塔',
      tesla: '闪电塔',
      barrier: '路障塔',
    };
    return names[t] ?? t;
  }

  finalize(result: 'win' | 'lose' | 'quit', endTime: number): PlayRecord {
    const duration = endTime - this.record.startTime;
    return {
      id: uuid(),
      date: new Date().toISOString().split('T')[0],
      startTime: this.record.startTime,
      endTime,
      duration,
      result,
      waveReached: this.record.waveReached,
      livesRemaining: this.record.livesRemaining,
      goldRemaining: this.record.goldRemaining,
      goldSpent: this.record.goldSpent,
      towersBuilt: this.record.towersBuilt,
      towersUpgraded: this.record.towersUpgraded,
      enemiesKilled: this.record.enemiesKilled,
      criticalChoices: this.record.criticalChoices,
      failureReason: this.record.failureReason,
      levelId: this.record.levelId,
      weather: this.record.weather,
    } as PlayRecord;
  }

  getStats() {
    return {
      ...this.record,
      totalTowers: Object.values(this.record.towersBuilt).reduce((a, b) => a + b, 0),
    };
  }
}
