import type { IGameEntity, Vec2, EnemyType, DamageType, EffectType } from '@/types';
import { getEnemyConfig } from '@/config/EnemyConfig';
import type { PathSystem } from '@/systems/PathSystem';
import { uuid } from '@/utils/math';

export type EnemyStatus = 'alive' | 'dying' | 'reached' | 'dead';

export class Enemy implements IGameEntity {
  id: string = uuid();
  alive: boolean = true;
  position: Vec2 = { x: 0, y: 0 };

  private _type: EnemyType;
  private _hp: number = 0;
  private _maxHp: number = 0;
  private _baseSpeed: number = 0;
  private _pathDist: number = 0;
  private _pathSystem: PathSystem;
  private _reward: number = 0;
  private _damage: number = 0;
  private _color: string = '#fff';
  private _size: number = 12;
  private _status: EnemyStatus = 'alive';
  private _dieTimer: number = 0;
  private _speedMulAccum: number = 1;
  private _weatherSpeedMult: number = 1;
  private _resistances: Partial<Record<DamageType, number>> = {};
  private _weaks: Partial<Record<DamageType, number>> = {};
  private _activeEffects: Map<string, { effect: EffectType; timeLeft: number; tickTimer: number }> = new Map();
  private _hitFlash: number = 0;
  private _rotation: number = 0;
  private _challengeFlags: { hpBoost?: boolean; doubleSpeed?: boolean } = {};

  constructor(type: EnemyType, pathSystem: PathSystem, hpMultiplier: number = 1, weatherSpeedMult: number = 1, challengeFlags?: { hpBoost?: boolean; doubleSpeed?: boolean }) {
    this._type = type;
    this._pathSystem = pathSystem;
    this._weatherSpeedMult = weatherSpeedMult;
    if (challengeFlags) this._challengeFlags = challengeFlags;

    const cfg = getEnemyConfig(type);
    this._maxHp = Math.floor(cfg.hp * hpMultiplier);
    this._hp = this._maxHp;
    this._baseSpeed = cfg.speed;
    this._reward = cfg.reward;
    this._damage = cfg.damage;
    this._color = cfg.color;
    this._size = cfg.size;
    this._resistances = cfg.resistances ?? {};
    this._weaks = cfg.weak ?? {};

    this.position = { ...pathSystem.getStart() };
  }

  get type(): EnemyType {
    return this._type;
  }
  get hp(): number {
    return this._hp;
  }
  get maxHp(): number {
    return this._maxHp;
  }
  get reward(): number {
    return this._reward;
  }
  get damage(): number {
    return this._damage;
  }
  get status(): EnemyStatus {
    return this._status;
  }
  get size(): number {
    return this._size;
  }
  get pathDistance(): number {
    return this._pathDist;
  }
  get hpPercent(): number {
    return this._maxHp > 0 ? (this._hp / this._maxHp) * 100 : 0;
  }

  setWeatherSpeedMult(m: number): void {
    this._weatherSpeedMult = m;
  }

  applyEffect(effect: EffectType): void {
    const existing = this._activeEffects.get(effect.id);
    if (existing) {
      existing.timeLeft = Math.max(existing.timeLeft, effect.duration);
    } else {
      this._activeEffects.set(effect.id, { effect, timeLeft: effect.duration, tickTimer: 0 });
    }
  }

  takeDamage(amount: number, type: DamageType = 'physical'): void {
    if (this._status !== 'alive') return;

    let dmg = amount;
    if (this._resistances[type]) dmg *= this._resistances[type]!;
    if (this._weaks[type]) dmg *= this._weaks[type]!;

    this._hp = Math.max(0, this._hp - dmg);
    this._hitFlash = 0.15;

    if (this._hp <= 0) {
      this._status = 'dying';
      this._dieTimer = 0.3;
    }
  }

  markReached(): void {
    if (this._status === 'alive') {
      this._status = 'reached';
      this.alive = false;
    }
  }

  update(dt: number): void {
    if (this._hitFlash > 0) this._hitFlash -= dt;

    if (this._status === 'dying') {
      this._dieTimer -= dt;
      if (this._dieTimer <= 0) {
        this._status = 'dead';
        this.alive = false;
      }
      return;
    }
    if (this._status !== 'alive') return;

    this._speedMulAccum = 1;
    this._activeEffects.forEach((data, id) => {
      data.timeLeft -= dt;
      const eff = data.effect;
      if (eff.type === 'slow' && eff.multiplier) {
        this._speedMulAccum = Math.min(this._speedMulAccum, eff.multiplier);
      } else if (eff.type === 'poison' && eff.value) {
        data.tickTimer -= dt;
        if (data.tickTimer <= 0) {
          this.takeDamage(eff.value, 'poison');
          data.tickTimer = 1;
        }
      }
      if (data.timeLeft <= 0) {
        this._activeEffects.delete(id);
      }
    });

    const speed = this._baseSpeed * this._speedMulAccum * this._weatherSpeedMult;
    this._pathDist += speed * dt;
    const totalLen = this._pathSystem.getTotalLength();

    if (this._pathDist >= totalLen) {
      this.markReached();
      return;
    }

    this.position = this._pathSystem.getPositionAt(this._pathDist);
    const dir = this._pathSystem.getDirectionAt(this._pathDist);
    this._rotation = Math.atan2(dir.y, dir.x);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this._challengeFlags.doubleSpeed && this._status === 'alive' && this._pathDist > 20) {
      const prev = this._pathSystem.getPositionAt(Math.max(0, this._pathDist - 18));
      ctx.save();
      ctx.strokeStyle = 'rgba(206, 147, 216, 0.55)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(this.position.x, this.position.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this._rotation);

    if (this._status === 'dying') {
      const t = 1 - this._dieTimer / 0.3;
      ctx.globalAlpha = 1 - t;
      ctx.scale(1 + t * 0.5, 1 + t * 0.5);
    }

    const s = this._size;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    let bodyColor = this._color;
    if (this._hitFlash > 0) bodyColor = '#fff';

    if (this._type === 'boss') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-s, -s * 0.7, s * 2, s * 1.4, 6);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.fillRect(s * 0.3, -s * 0.4, s * 0.4, s * 0.8);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-s * 0.5, s * 0.7, s * 0.35, 0, Math.PI * 2);
      ctx.arc(s * 0.5, s * 0.7, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (this._type === 'tank') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-s, -s * 0.65, s * 2, s * 1.3, 4);
      ctx.fill();
      ctx.strokeStyle = '#5f5f8f';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#3a3a5a';
      ctx.fillRect(s * 0.25, -s * 0.4, s * 0.5, s * 0.8);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-s * 0.5, s * 0.65, s * 0.3, 0, Math.PI * 2);
      ctx.arc(s * 0.5, s * 0.65, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this._type === 'truck') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-s, -s * 0.55, s * 2, s * 1.1, 3);
      ctx.fill();
      ctx.fillStyle = '#2a4870';
      ctx.fillRect(s * 0.15, -s * 0.35, s * 0.5, s * 0.7);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-s * 0.45, s * 0.55, s * 0.25, 0, Math.PI * 2);
      ctx.arc(s * 0.45, s * 0.55, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (this._type === 'swarm') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s * 0.3, -s * 0.2, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-s, -s * 0.5, s * 2, s, 4);
      ctx.fill();
      ctx.fillStyle = '#2a6e5a';
      ctx.fillRect(s * 0.15, -s * 0.3, s * 0.4, s * 0.6);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-s * 0.5, s * 0.5, s * 0.25, 0, Math.PI * 2);
      ctx.arc(s * 0.5, s * 0.5, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (this._status === 'alive' || this._status === 'dying') {
      this.renderHpBar(ctx);
      this.renderEffects(ctx);
    }
  }

  private renderHpBar(ctx: CanvasRenderingContext2D): void {
    const w = Math.max(24, this._size * 2.2);
    const h = 4;
    const x = this.position.x - w / 2;
    const y = this.position.y - this._size - 10;
    const pct = Math.max(0, this._hp / this._maxHp);
    const hasHpBoost = this._challengeFlags.hpBoost;

    if (hasHpBoost) {
      ctx.fillStyle = 'rgba(239, 154, 154, 0.25)';
      ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      ctx.strokeStyle = '#ef9a9a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = pct > 0.5 ? (hasHpBoost ? '#ef5350' : '#8bc34a') : pct > 0.25 ? '#ffa726' : '#ff6b6b';
    ctx.fillRect(x, y, w * pct, h);

    if (hasHpBoost) {
      ctx.fillStyle = '#ef9a9a';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('🛡', x + w + 1, y + 4);
    }
  }

  private renderEffects(ctx: CanvasRenderingContext2D): void {
    this._activeEffects.forEach((data) => {
      const eff = data.effect;
      if (eff.type === 'slow') {
        ctx.fillStyle = 'rgba(116, 185, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this._size + 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (eff.type === 'poison') {
        const flicker = Math.sin(performance.now() / 80) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(168, 224, 99, ${0.4 * flicker})`;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this._size + 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  dispose(): void {
    this._activeEffects.clear();
  }
}
