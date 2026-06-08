import type { Particle } from '../../types/game';
import { randomRange, uid } from '../../utils/math';

export class ParticleSystem {
  particles: Particle[] = [];
  private nextId = 1;
  maxParticles = 500;
  enabled = true;

  spawn(p: Partial<Particle> & Pick<Particle, 'x' | 'y' | 'type' | 'color'>): void {
    if (!this.enabled) return;
    if (this.particles.length >= this.maxParticles) this.particles.shift();
    const particle: Particle = {
      id: this.nextId++,
      x: p.x,
      y: p.y,
      vx: p.vx ?? randomRange(-0.5, 0.5),
      vy: p.vy ?? randomRange(-1.5, -0.2),
      life: p.maxLife ?? 1.0,
      maxLife: p.maxLife ?? 1.0,
      color: p.color,
      size: p.size ?? 3,
      type: p.type,
      parentEquipmentId: p.parentEquipmentId,
    };
    this.particles.push(particle);
  }

  burst(
    centerX: number, centerY: number,
    count: number,
    type: Particle['type'],
    color: string,
    opts: { spread?: number; speed?: number; life?: number; size?: number } = {},
  ): void {
    if (!this.enabled) return;
    const { spread = 1.5, speed = 1, life = 1, size = 3 } = opts;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * spread;
      this.spawn({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: Math.cos(angle) * speed * randomRange(0.3, 1),
        vy: Math.sin(angle) * speed * randomRange(0.3, 1) - 0.2,
        type, color,
        size: size * randomRange(0.6, 1.4),
        maxLife: life * randomRange(0.7, 1.3),
      });
    }
  }

  update(dt: number, gravity = 0.3): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.vy += gravity * dt * 60 * 0.01;
      if (p.type === 'smoke') { p.vx *= 0.98; p.vy *= 0.98; }
      if (p.type === 'bubble') { p.vy -= 0.02; p.vx += Math.sin(p.life * 8) * 0.02; }
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
    }
  }

  clear(): void { this.particles.length = 0; }
  count(): number { return this.particles.length; }
}
