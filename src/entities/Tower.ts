import type { Vec2, DamageType, TowerType } from '@/types';
import { getTowerConfig, getTowerStats, getTowerUpgradeCost, getTowerSellValue } from '@/config/TowerConfig';
import type { Enemy } from './Enemy';
import { uuid, distanceV } from '@/utils/math';
import type { Projectile } from './Projectile';

export type TowerCallback = (p: Projectile) => void;

export class Tower {
  id: string = uuid();
  alive: boolean = true;
  position: Vec2;

  private _type: TowerType;
  private _level: number = 1;
  private _target: Enemy | null = null;
  private _fireCooldown: number = 0;
  private _angle: number = 0;
  private _targetingMode: number = 0;
  private _firedThisFrame: Projectile | null = null;
  private _totalKills: number = 0;
  private _totalDamage: number = 0;
  private _fireFlash: number = 0;
  private _bouncePulse: number = 0;

  onFire?: TowerCallback;
  onUpgrade?: (newLevel: number, cost: number) => void;

  constructor(type: TowerType, position: Vec2) {
    this._type = type;
    this.position = { ...position };
  }

  get type(): TowerType {
    return this._type;
  }
  get level(): number {
    return this._level;
  }
  get angle(): number {
    return this._angle;
  }
  get totalKills(): number {
    return this._totalKills;
  }
  get totalDamage(): number {
    return this._totalDamage;
  }
  get targetingModeIndex(): number {
    return this._targetingMode;
  }

  get definition() {
    return getTowerConfig(this._type);
  }

  get stats() {
    const base = getTowerStats(this._type, this._level)!;
    return { ...base };
  }

  getEffectiveStats(weatherRangeMult: number, weatherFireRateMult: number) {
    const s = this.stats;
    return {
      damage: s.damage,
      range: s.range * weatherRangeMult,
      fireRate: s.fireRate * weatherFireRateMult,
      projectileSpeed: s.projectileSpeed ?? 500,
      splashRadius: s.splashRadius ?? 0,
    };
  }

  get upgradeCost(): number {
    return getTowerUpgradeCost(this._type, this._level);
  }

  get sellValue(): number {
    return getTowerSellValue(this._type, this._level);
  }

  get maxLevel(): number {
    return this.definition.levels.length;
  }

  get canUpgrade(): boolean {
    return this._level < this.maxLevel;
  }

  cycleTargetingMode(): string {
    const modes = this.definition.targeting ?? ['first'];
    this._targetingMode = (this._targetingMode + 1) % modes.length;
    return modes[this._targetingMode];
  }

  getCurrentTargetingMode(): string {
    const modes = this.definition.targeting ?? ['first'];
    return modes[this._targetingMode];
  }

  upgrade(): boolean {
    if (!this.canUpgrade) return false;
    const cost = this.upgradeCost;
    this._level++;
    this._bouncePulse = 0.4;
    this.onUpgrade?.(this._level, cost);
    return true;
  }

  registerKill(): void {
    this._totalKills++;
  }

  addDamage(d: number): void {
    this._totalDamage += d;
  }

  update(dt: number, enemies: Enemy[], weatherRangeMult: number, weatherFireRateMult: number): void {
    if (!this.alive) return;

    if (this._fireFlash > 0) this._fireFlash -= dt;
    if (this._bouncePulse > 0) this._bouncePulse -= dt;

    const eff = this.getEffectiveStats(weatherRangeMult, weatherFireRateMult);
    const cd = 1 / eff.fireRate;
    if (this._fireCooldown > 0) this._fireCooldown -= dt;

    this.findTarget(enemies, eff.range);

    if (this._target && this._target.alive && this._target.status === 'alive') {
      const dx = this._target.position.x - this.position.x;
      const dy = this._target.position.y - this.position.y;
      const targetAngle = Math.atan2(dy, dx);

      let diff = targetAngle - this._angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this._angle += diff * Math.min(1, dt * 8);

      if (this._fireCooldown <= 0 && Math.abs(diff) < 0.4) {
        this.fire(this._target, eff);
        this._fireCooldown = cd;
      }
    } else {
      this._target = null;
    }

    this._firedThisFrame = null;
  }

  private findTarget(enemies: Enemy[], range: number): void {
    if (this._target) {
      if (!this._target.alive || this._target.status !== 'alive' || distanceV(this.position, this._target.position) > range) {
        this._target = null;
      } else {
        return;
      }
    }

    const modes = this.definition.targeting ?? ['first'];
    const mode = modes[this._targetingMode] ?? 'first';
    const inRange: Enemy[] = [];

    for (const e of enemies) {
      if (!e.alive || e.status !== 'alive') continue;
      if (distanceV(this.position, e.position) <= range) {
        inRange.push(e);
      }
    }
    if (inRange.length === 0) return;

    switch (mode) {
      case 'first':
        inRange.sort((a, b) => b.pathDistance - a.pathDistance);
        break;
      case 'strongest':
        inRange.sort((a, b) => b.hp - a.hp);
        break;
      case 'furthest':
        inRange.sort((a, b) => a.pathDistance - b.pathDistance);
        break;
      case 'closest':
      default:
        inRange.sort((a, b) => distanceV(a.position, this.position) - distanceV(b.position, this.position));
        break;
    }
    this._target = inRange[0];
  }

  private fire(target: Enemy, eff: { damage: number; range: number; fireRate: number; projectileSpeed: number; splashRadius: number }): void {
    this._fireFlash = 0.08;
    const def = this.definition;

    if (this._type === 'tesla') {
      this._firedThisFrame = this.createTeslaBolt(target, eff.damage);
      this.onFire?.(this._firedThisFrame);
      return;
    }

    if (this._type === 'barrier') {
      this._firedThisFrame = this.createBarrierAura(eff.damage);
      this.onFire?.(this._firedThisFrame);
      return;
    }

    const dir = {
      x: Math.cos(this._angle),
      y: Math.sin(this._angle),
    };

    const proj: Projectile = {
      id: uuid(),
      alive: true,
      position: { x: this.position.x + dir.x * 22, y: this.position.y + dir.y * 22 },
      velocity: { x: dir.x * eff.projectileSpeed, y: dir.y * eff.projectileSpeed },
      target,
      damage: eff.damage,
      damageType: def.damageType as DamageType,
      speed: eff.projectileSpeed,
      splashRadius: eff.splashRadius,
      effects: def.effects ?? [],
      color: def.color,
      type: this._type,
      life: 4,
      trail: [],
      hitFlash: 0,
      owner: this,
      update: () => {},
      render: () => {},
      dispose: () => {},
    };

    this._firedThisFrame = proj;
    this.onFire?.(proj);
  }

  private createTeslaBolt(target: Enemy, damage: number): Projectile {
    return {
      id: uuid(),
      alive: true,
      position: { ...this.position },
      velocity: { x: 0, y: 0 },
      target,
      damage,
      damageType: 'energy',
      speed: 0,
      splashRadius: 120,
      effects: [],
      color: '#ffeaa7',
      type: 'tesla',
      life: 0.25,
      trail: [],
      hitFlash: 0.2,
      owner: this,
      instant: true,
      chains: 2,
      update: () => {},
      render: () => {},
      dispose: () => {},
    };
  }

  private createBarrierAura(damage: number): Projectile {
    return {
      id: uuid(),
      alive: true,
      position: { ...this.position },
      velocity: { x: 0, y: 0 },
      target: null,
      damage,
      damageType: 'physical',
      speed: 0,
      splashRadius: this.getEffectiveStats(1, 1).range,
      effects: [{ id: 'slow-barrier', type: 'slow', duration: 1.5, multiplier: 0.4 }],
      color: '#fab1a0',
      type: 'barrier',
      life: 0.6,
      trail: [],
      hitFlash: 0,
      owner: this,
      instant: true,
      aura: true,
      update: () => {},
      render: () => {},
      dispose: () => {},
    };
  }

  render(ctx: CanvasRenderingContext2D, showRange: boolean): void {
    const def = this.definition;
    const s = 22;

    ctx.save();

    if (this._bouncePulse > 0) {
      ctx.translate(this.position.x, this.position.y);
      ctx.scale(1 + this._bouncePulse * 0.5, 1 + this._bouncePulse * 0.5);
      ctx.translate(-this.position.x, -this.position.y);
    }

    if (showRange) {
      const range = this.stats.range;
      ctx.fillStyle = `${def.color}18`;
      ctx.strokeStyle = `${def.color}66`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = '#3a3a52';
    ctx.strokeStyle = '#2a2a42';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, s + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const grd = ctx.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, s);
    grd.addColorStop(0, this.lighten(def.color, 0.2));
    grd.addColorStop(1, def.color);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, s - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(this.position.x - s * 0.4, this.position.y - s * 0.4, s * 0.35, 0, Math.PI * 2);
    ctx.fill();

    this.renderWeapon(ctx, s);

    for (let i = 0; i < this._level; i++) {
      const px = this.position.x - 8 + i * 8;
      const py = this.position.y + s + 10;
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderWeapon(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this._angle);

    const flash = this._fireFlash;

    switch (this._type) {
      case 'sniper':
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-4, -4, s + 16 + flash * 20, 8);
        ctx.fillStyle = '#1a252f';
        ctx.fillRect(s + 8, -3, 10, 6);
        if (flash > 0) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(s + 22, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'cannon':
        ctx.fillStyle = '#4a3434';
        ctx.fillRect(-2, -7, s + 10, 14);
        ctx.fillStyle = '#3a2626';
        ctx.fillRect(s + 2, -8, 8, 16);
        if (flash > 0) {
          ctx.fillStyle = '#ff8844';
          ctx.beginPath();
          ctx.arc(s + 18, 0, 10, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'frost':
        ctx.fillStyle = '#3d6fa5';
        ctx.fillRect(-2, -5, s + 8, 10);
        ctx.fillStyle = '#74b9ff';
        ctx.beginPath();
        ctx.arc(s + 8, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        if (flash > 0) {
          ctx.fillStyle = '#dfe6e9';
          ctx.beginPath();
          ctx.arc(s + 18, 0, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'poison':
        ctx.fillStyle = '#5a8038';
        ctx.fillRect(-2, -5, s + 6, 10);
        ctx.fillStyle = '#a8e063';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(s + 4 + i * 4, -5 + (i % 2) * 10, 4 + flash * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'tesla':
        ctx.fillStyle = '#7a6a2a';
        ctx.fillRect(-4, -6, s + 8, 12);
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        ctx.arc(s + 4, 0, 7 + flash * 8, 0, Math.PI * 2);
        ctx.fill();
        if (flash > 0) {
          ctx.strokeStyle = '#fff8a0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s + 10, 0);
          ctx.lineTo(s + 20, -8);
          ctx.lineTo(s + 18, 2);
          ctx.lineTo(s + 28, 10);
          ctx.stroke();
        }
        break;
      case 'barrier':
        ctx.fillStyle = '#7a4a3a';
        ctx.fillRect(-10, -8, 20, 16);
        ctx.fillStyle = '#fab1a0';
        for (let i = -1; i <= 1; i++) {
          ctx.fillRect(i * 6 - 2, -6, 4, 12);
        }
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        for (let i = -8; i < 10; i += 4) {
          ctx.beginPath();
          ctx.moveTo(i, -8);
          ctx.lineTo(i + 2, -8);
          ctx.lineTo(i + 4, 8);
          ctx.lineTo(i + 2, 8);
          ctx.closePath();
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }

  private lighten(hex: string, amt: number): string {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const lr = Math.round(r + (255 - r) * amt);
    const lg = Math.round(g + (255 - g) * amt);
    const lb = Math.round(b + (255 - b) * amt);
    return `rgb(${lr}, ${lg}, ${lb})`;
  }

  dispose(): void {
    this._target = null;
  }
}
