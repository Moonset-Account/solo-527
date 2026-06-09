import type { Vec2, SimulationResult } from '@/game/types';
import { lerp, easeOutCubic } from './helpers';

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FlowParticle extends Particle {
  pathProgress: number;
  wireId: string;
}

export class AnimationSystem {
  private _particles: Particle[] = [];
  private _flowParticles: FlowParticle[] = [];
  private _bulbGlowPhases: Map<string, number> = new Map();
  private _placeAnimations: Map<string, { t: number; total: number }> = new Map();

  constructor() {}

  update(
    dt: number,
    simulationResult: SimulationResult | null,
    wirePathGetter: (wireId: string) => Vec2[] | null
  ): void {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this._particles.splice(i, 1);
        continue;
      }
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
    }

    const wireCurrents = simulationResult?.wireCurrents ?? {};
    for (let i = this._flowParticles.length - 1; i >= 0; i--) {
      const fp = this._flowParticles[i];
      const current = wireCurrents[fp.wireId] ?? 0;
      if (current <= 0) {
        this._flowParticles.splice(i, 1);
        continue;
      }

      const path = wirePathGetter(fp.wireId);
      if (!path || path.length < 2) {
        this._flowParticles.splice(i, 1);
        continue;
      }

      const totalSegments = path.length - 1;
      const speed = 0.3 + Math.abs(current) * 0.5;
      fp.pathProgress += speed * dt;
      if (fp.pathProgress >= totalSegments) {
        this._flowParticles.splice(i, 1);
        continue;
      }

      const segIndex = Math.floor(fp.pathProgress);
      const segT = fp.pathProgress - segIndex;
      const p1 = path[segIndex];
      const p2 = path[Math.min(segIndex + 1, path.length - 1)];
      fp.pos = {
        x: lerp(p1.x, p2.x, segT),
        y: lerp(p1.y, p2.y, segT),
      };
    }

    if (simulationResult) {
      const componentStates = simulationResult.componentStates;
      const existingIds = new Set<string>();

      for (const [id, state] of Object.entries(componentStates)) {
        if (state.lit) {
          existingIds.add(id);
          if (!this._bulbGlowPhases.has(id)) {
            this._bulbGlowPhases.set(id, 0);
          }
          const current = this._bulbGlowPhases.get(id) ?? 0;
          const next = (current + dt * 1.5) % 1;
          this._bulbGlowPhases.set(id, next);
        }
      }

      for (const id of this._bulbGlowPhases.keys()) {
        if (!existingIds.has(id)) {
          this._bulbGlowPhases.delete(id);
        }
      }
    }

    for (const [id, anim] of this._placeAnimations) {
      anim.t += dt;
      if (anim.t >= anim.total) {
        this._placeAnimations.delete(id);
      }
    }
  }

  getBulbGlowPhase(componentId: string): number {
    return this._bulbGlowPhases.get(componentId) ?? 0;
  }

  getPlaceScale(componentId: string): number {
    const anim = this._placeAnimations.get(componentId);
    if (!anim) return 1;
    const t = Math.min(anim.t / anim.total, 1);
    return easeOutCubic(t);
  }

  addBurst(pos: Vec2, color: string, count: number = 15): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this._particles.push({
        pos: { ...pos },
        vel: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  addPlacementAnimation(componentId: string): void {
    this._placeAnimations.set(componentId, { t: 0, total: 0.4 });
  }

  addFlowParticle(wireId: string, wireStart: Vec2): void {
    this._flowParticles.push({
      pos: { ...wireStart },
      vel: { x: 0, y: 0 },
      life: 10,
      maxLife: 10,
      color: '#00d4ff',
      size: 2.5,
      pathProgress: 0,
      wireId,
    });
  }

  renderParticles(
    ctx: CanvasRenderingContext2D,
    worldToScreen: (v: Vec2) => Vec2
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this._particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const sp = worldToScreen(p.pos);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderFlowParticles(
    ctx: CanvasRenderingContext2D,
    worldToScreen: (v: Vec2) => Vec2
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const fp of this._flowParticles) {
      const sp = worldToScreen(fp.pos);
      ctx.fillStyle = fp.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = fp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, fp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear(): void {
    this._particles = [];
    this._flowParticles = [];
    this._bulbGlowPhases.clear();
    this._placeAnimations.clear();
  }
}
