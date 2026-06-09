import { EventBus } from '@/core/EventBus';
import type { GameEvents } from '@/types';

export class ResourceSystem {
  private eventBus: EventBus;

  private _gold: number = 0;
  private _lives: number = 0;
  private startLives: number = 0;

  private goldSpent: number = 0;
  private goldEarned: number = 0;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  init(startGold: number, startLives: number): void {
    this._gold = startGold;
    this._lives = startLives;
    this.startLives = startLives;
    this.goldSpent = 0;
    this.goldEarned = 0;
  }

  get gold(): number {
    return this._gold;
  }

  get lives(): number {
    return this._lives;
  }

  get startLivesCount(): number {
    return this.startLives;
  }

  getGoldStats() {
    return { spent: this.goldSpent, earned: this.goldEarned };
  }

  canAfford(cost: number): boolean {
    return this._gold >= cost;
  }

  addGold(amount: number, silent: boolean = false): void {
    if (amount <= 0) return;
    const old = this._gold;
    this._gold += amount;
    this.goldEarned += amount;
    if (!silent) this.eventBus.emit('resource:change', { type: 'gold', old, new: this._gold });
  }

  spendGold(amount: number): boolean {
    if (amount <= 0 || !this.canAfford(amount)) return false;
    const old = this._gold;
    this._gold -= amount;
    this.goldSpent += amount;
    this.eventBus.emit('resource:change', { type: 'gold', old, new: this._gold });
    return true;
  }

  loseLives(amount: number): boolean {
    if (amount <= 0) return true;
    const old = this._lives;
    this._lives = Math.max(0, this._lives - amount);
    this.eventBus.emit('resource:change', { type: 'lives', old, new: this._lives });
    return this._lives <= 0;
  }

  healLives(amount: number): void {
    if (amount <= 0) return;
    const old = this._lives;
    this._lives = Math.min(this.startLives, this._lives + amount);
    if (old !== this._lives) {
      this.eventBus.emit('resource:change', { type: 'lives', old, new: this._lives });
    }
  }

  isGameOver(): boolean {
    return this._lives <= 0;
  }

  getLifePercent(): number {
    return this.startLives > 0 ? (this._lives / this.startLives) * 100 : 0;
  }
}

// Ensure the event type reference is properly exported
export type _ResourceEventType = GameEvents['resource:change'];
