import { EventBus } from '@/core/EventBus';
import { getWeatherConfig } from '@/config/WeatherConfig';
import type { WeatherType, GameEvents, Vec2 } from '@/types';
import { randomRange } from '@/utils/math';

type Particle = {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  size: number;
  type: WeatherType;
};

export class WeatherSystem {
  private eventBus: EventBus;
  private _current: WeatherType = 'sunny';
  private particles: Particle[] = [];
  private worldSize: Vec2 = { x: 1600, y: 1000 };
  private emitTimer: number = 0;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  init(worldWidth: number, worldHeight: number): void {
    this.worldSize = { x: worldWidth, y: worldHeight };
    this._current = 'sunny';
    this.particles = [];
  }

  get current(): WeatherType {
    return this._current;
  }

  setWeather(type: WeatherType): void {
    const from = this._current;
    if (from !== type) {
      this._current = type;
      this.particles = [];
      this.eventBus.emit('weather:change', { from, to: type });
    }
  }

  getEnemySpeedMultiplier(): number {
    return getWeatherConfig(this._current).effects.enemySpeedMult ?? 1;
  }

  getTowerFireRateMultiplier(): number {
    return getWeatherConfig(this._current).effects.towerFireRateMult ?? 1;
  }

  getTowerRangeMultiplier(): number {
    return getWeatherConfig(this._current).effects.towerRangeMult ?? 1;
  }

  getVisibility(): number {
    return getWeatherConfig(this._current).effects.visibilityMult ?? 1;
  }

  update(dt: number): void {
    const def = getWeatherConfig(this._current);
    const particleName = def.effects.particleName;
    if (!particleName) {
      this.particles = [];
      return;
    }

    this.emitParticles(particleName, dt);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.life -= dt;
      if (
        p.life <= 0 ||
        p.pos.x < -50 ||
        p.pos.x > this.worldSize.x + 50 ||
        p.pos.y < -50 ||
        p.pos.y > this.worldSize.y + 50
      ) {
        this.particles.splice(i, 1);
      }
    }
  }

  private emitParticles(type: string, dt: number): void {
    this.emitTimer += dt;
    const interval = type === 'snow' ? 0.03 : type === 'rain' ? 0.02 : type === 'fog' ? 0.08 : 0.05;
    const count = type === 'typhoon' ? 8 : type === 'fog' ? 2 : 4;

    while (this.emitTimer >= interval) {
      this.emitTimer -= interval;
      for (let i = 0; i < count; i++) {
        this.particles.push(this.createParticle(type as WeatherType));
      }
      if (this.particles.length > 1200) break;
    }
  }

  private createParticle(type: WeatherType): Particle {
    switch (type) {
      case 'rain':
        return {
          pos: { x: randomRange(0, this.worldSize.x), y: randomRange(-40, 0) },
          vel: { x: randomRange(-40, 0), y: randomRange(600, 900) },
          life: randomRange(1.5, 2.5),
          maxLife: 2,
          size: randomRange(1.5, 3),
          type,
        };
      case 'snow':
        return {
          pos: { x: randomRange(0, this.worldSize.x), y: randomRange(-20, 20) },
          vel: { x: randomRange(-30, 30), y: randomRange(40, 100) },
          life: randomRange(4, 7),
          maxLife: 5,
          size: randomRange(2, 5),
          type,
        };
      case 'fog':
        return {
          pos: { x: randomRange(0, this.worldSize.x), y: randomRange(0, this.worldSize.y) },
          vel: { x: randomRange(5, 15), y: randomRange(-2, 2) },
          life: randomRange(6, 10),
          maxLife: 8,
          size: randomRange(40, 100),
          type,
        };
      case 'typhoon':
        return {
          pos: { x: randomRange(-50, this.worldSize.x + 50), y: randomRange(-20, 40) },
          vel: { x: randomRange(-400, -200), y: randomRange(200, 500) },
          life: randomRange(0.8, 1.8),
          maxLife: 1.5,
          size: randomRange(2, 4),
          type,
        };
      default:
        return {
          pos: { x: 0, y: 0 },
          vel: { x: 0, y: 0 },
          life: 0,
          maxLife: 0,
          size: 0,
          type: 'sunny',
        };
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const def = getWeatherConfig(this._current);
    ctx.save();

    if (this._current === 'fog') {
      for (const p of this.particles) {
        const alpha = Math.min(1, p.life / p.maxLife) * 0.35;
        ctx.fillStyle = `rgba(220, 220, 230, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this._current === 'rain') {
      ctx.strokeStyle = 'rgba(150, 180, 220, 0.55)';
      ctx.lineWidth = 1.5;
      for (const p of this.particles) {
        const len = p.size * 6;
        const angle = Math.atan2(p.vel.y, p.vel.x);
        ctx.beginPath();
        ctx.moveTo(p.pos.x, p.pos.y);
        ctx.lineTo(p.pos.x + Math.cos(angle) * len, p.pos.y + Math.sin(angle) * len);
        ctx.stroke();
      }
    } else if (this._current === 'snow') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (const p of this.particles) {
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this._current === 'typhoon') {
      ctx.strokeStyle = 'rgba(180, 200, 230, 0.4)';
      ctx.lineWidth = 1.2;
      for (const p of this.particles) {
        const len = p.size * 12;
        const angle = Math.atan2(p.vel.y, p.vel.x);
        ctx.beginPath();
        ctx.moveTo(p.pos.x, p.pos.y);
        ctx.lineTo(p.pos.x + Math.cos(angle) * len, p.pos.y + Math.sin(angle) * len);
        ctx.stroke();
      }
    }

    if (def.effects.visibilityMult && def.effects.visibilityMult < 1) {
      const visAlpha = (1 - def.effects.visibilityMult) * 0.25;
      ctx.fillStyle = `rgba(200, 210, 220, ${visAlpha})`;
      ctx.fillRect(0, 0, this.worldSize.x, this.worldSize.y);
    }

    ctx.restore();
  }
}

export type _WeatherEventType = GameEvents['weather:change'];
