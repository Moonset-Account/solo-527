import type { IGameEntity, Vec2, DamageType, EffectType, TowerType } from '@/types';
import { distanceV, normalizeV, subV, addV, scaleV } from '@/utils/math';
import type { Enemy } from './Enemy';
import type { Tower } from './Tower';

export interface Projectile extends IGameEntity {
  id: string;
  alive: boolean;
  position: Vec2;
  velocity: Vec2;
  target: Enemy | null;
  damage: number;
  damageType: DamageType;
  speed: number;
  splashRadius: number;
  effects: EffectType[];
  color: string;
  type: TowerType;
  life: number;
  trail: Vec2[];
  hitFlash: number;
  owner?: Tower;
  instant?: boolean;
  aura?: boolean;
  chains?: number;
  hitEnemies?: Set<string>;
}

export function createProjectileBehavior(
  proj: Projectile,
  enemies: Enemy[],
  onHit: (enemy: Enemy, damage: number, type: DamageType, effects: EffectType[]) => void,
  onSplash: (pos: Vec2, radius: number, damage: number, type: DamageType, effects: EffectType[]) => void,
  onOwnerDamage?: (owner: Tower, damage: number) => void
): void {
  proj.update = (dt: number) => {
    if (!proj.alive) return;
    if (proj.instant || proj.aura) {
      proj.life -= dt;
      if (proj.hitFlash > 0) proj.hitFlash -= dt;

      if (!proj.hitEnemies) proj.hitEnemies = new Set();

      if (proj.aura && proj.life > 0.4) {
        for (const e of enemies) {
          if (!e.alive || e.status !== 'alive') continue;
          if (proj.hitEnemies.has(e.id)) continue;
          if (distanceV(proj.position, e.position) <= proj.splashRadius) {
            proj.hitEnemies.add(e.id);
            onHit(e, proj.damage, proj.damageType, proj.effects);
            onOwnerDamage?.(proj.owner!, proj.damage);
          }
        }
      } else if (proj.type === 'tesla' && proj.life > 0.2 && proj.hitEnemies.size === 0) {
        if (proj.target && proj.target.alive) {
          const chains = proj.chains ?? 2;
          let current: Enemy | null = proj.target;
          let remaining = chains + 1;
          const dmgDecay = 0.75;
          let dmg = proj.damage;
          while (current && remaining > 0) {
            if (proj.hitEnemies.has(current.id)) break;
            proj.hitEnemies.add(current.id);
            onHit(current, dmg, proj.damageType, proj.effects);
            onOwnerDamage?.(proj.owner!, dmg);

            if (remaining > 1) {
              const radius = proj.splashRadius;
              let next: Enemy | null = null;
              let bestDist = Infinity;
              for (const e of enemies) {
                if (!e.alive || e.status !== 'alive') continue;
                if (proj.hitEnemies.has(e.id)) continue;
                const d = distanceV(current.position, e.position);
                if (d <= radius && d < bestDist) {
                  bestDist = d;
                  next = e;
                }
              }
              current = next;
              dmg *= dmgDecay;
            }
            remaining--;
          }
          proj.trail.push({ ...proj.target.position });
        }
      }

      if (proj.life <= 0) proj.alive = false;
      return;
    }

    proj.life -= dt;
    if (proj.hitFlash > 0) proj.hitFlash -= dt;
    if (proj.life <= 0) {
      proj.alive = false;
      return;
    }

    if (proj.target && proj.target.alive && proj.target.status === 'alive') {
      const dir = normalizeV(subV(proj.target.position, proj.position));
      proj.velocity = scaleV(dir, proj.speed);
    }

    proj.position = addV(proj.position, scaleV(proj.velocity, dt));

    proj.trail.push({ ...proj.position });
    if (proj.trail.length > 8) proj.trail.shift();

    if (proj.target && proj.target.alive) {
      if (distanceV(proj.position, proj.target.position) <= proj.target.size + 4) {
        if (proj.splashRadius > 0 && proj.type !== 'frost') {
          onSplash(proj.position, proj.splashRadius, proj.damage, proj.damageType, proj.effects);
          if (proj.owner) onSplashDamage(proj.owner, proj.position, proj.splashRadius, enemies, proj.damage, onOwnerDamage);
        } else {
          onHit(proj.target, proj.damage, proj.damageType, proj.effects);
          onOwnerDamage?.(proj.owner!, proj.damage);
        }
        proj.alive = false;
      }
    }

    if (proj.position.x < -100 || proj.position.x > 2000 || proj.position.y < -100 || proj.position.y > 1400) {
      proj.alive = false;
    }
  };
}

function onSplashDamage(owner: Tower, pos: Vec2, radius: number, enemies: Enemy[], dmg: number, cb?: (o: Tower, d: number) => void): void {
  for (const e of enemies) {
    if (!e.alive || e.status !== 'alive') continue;
    if (distanceV(pos, e.position) <= radius + e.size) {
      cb?.(owner, dmg * 0.5);
    }
  }
}

export function renderProjectile(proj: Projectile, ctx: CanvasRenderingContext2D): void {
  if (!proj.alive) return;

  ctx.save();

  if (proj.type === 'tesla') {
    ctx.strokeStyle = proj.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = proj.color;
    ctx.shadowBlur = 15;
    const points: Vec2[] = [proj.position];
    if (proj.trail.length > 0) {
      points.push(proj.trail[0]);
    }
    let last = proj.position;
    for (let i = 0; i < points.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      for (let j = 1; j <= 4; j++) {
        const t = j / 4;
        const px = last.x + (points[i + 1].x - last.x) * t + (Math.random() - 0.5) * 16;
        const py = last.y + (points[i + 1].y - last.y) * t + (Math.random() - 0.5) * 16;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      last = points[i + 1];
    }
  } else if (proj.type === 'barrier') {
    const alpha = Math.max(0, proj.life / 0.6);
    const r = proj.splashRadius * (1 + (1 - alpha) * 0.4);
    ctx.strokeStyle = `rgba(250, 177, 160, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(proj.position.x, proj.position.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(250, 177, 160, ${alpha * 0.15})`;
    ctx.fill();
  } else {
    if (proj.trail.length > 1) {
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(proj.trail[0].x, proj.trail[0].y);
      for (let i = 1; i < proj.trail.length; i++) {
        ctx.globalAlpha = 0.4 * (i / proj.trail.length);
        ctx.lineTo(proj.trail[i].x, proj.trail[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.shadowColor = proj.color;
    ctx.shadowBlur = 8;

    if (proj.type === 'cannon') {
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(proj.position.x, proj.position.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (proj.type === 'frost') {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 2;
      const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
      ctx.translate(proj.position.x, proj.position.y);
      ctx.rotate(angle);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'poison') {
      ctx.fillStyle = proj.color;
      ctx.globalAlpha = 0.7 + Math.sin(performance.now() / 100) * 0.3;
      ctx.beginPath();
      ctx.arc(proj.position.x, proj.position.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
      ctx.translate(proj.position.x, proj.position.y);
      ctx.rotate(angle);
      ctx.roundRect(-8, -2, 16, 4, 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
