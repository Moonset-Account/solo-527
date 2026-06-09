export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  gravity?: number;
  alpha?: number;
}

export interface Viewport {
  px: number;
  py: number;
  scale: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  spawn(
    x: number,
    y: number,
    color: string,
    life: number,
    vx: number = 0,
    vy: number = 0,
    size: number = 3,
    gravity?: number
  ): void {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      life,
      maxLife: life,
      size,
      gravity,
      alpha: 1,
    });
  }

  spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number = 100,
    life: number = 0.8,
    size: number = 3
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const sp = speed * (0.5 + Math.random() * 0.5);
      this.spawn(
        x,
        y,
        color,
        life * (0.7 + Math.random() * 0.6),
        Math.cos(angle) * sp,
        Math.sin(angle) * sp,
        size * (0.7 + Math.random() * 0.6),
        80
      );
    }
  }

  spawnFirework(
    x: number,
    y: number,
    colors: string[],
    count: number = 60
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 80 + Math.random() * 120;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawn(
        x,
        y,
        color,
        1.0 + Math.random() * 0.5,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        2 + Math.random() * 2,
        60
      );
    }
  }

  update(dt: number): void {
    const alive: Particle[] = [];
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity !== undefined) {
        p.vy += p.gravity * dt;
      }
      p.alpha = Math.max(0, p.life / p.maxLife);
      alive.push(p);
    }
    this.particles = alive;
  }

  render(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
    ctx.save();
    for (const p of this.particles) {
      const sx = (p.x + viewport.px) * viewport.scale;
      const sy = (p.y + viewport.py) * viewport.scale;
      const s = p.size * viewport.scale * (p.alpha ?? 1);
      ctx.globalAlpha = p.alpha ?? 1;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.5, s), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear(): void {
    this.particles.length = 0;
  }

  get count(): number {
    return this.particles.length;
  }
}
