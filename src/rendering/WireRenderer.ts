import type { Wire, SimState, NodeId } from '../simulation/types';
import type { Viewport } from './ParticleSystem';

interface CurrentParticle {
  t: number;
  speed: number;
  color: string;
}

interface WireAnimState {
  particles: CurrentParticle[];
  lastSpawn: number;
}

const wireAnimStates = new Map<string, WireAnimState>();

interface DrawWireOptions {
  hovered?: boolean;
  selected?: boolean;
  globalTime?: number;
}

export function drawWire(
  ctx: CanvasRenderingContext2D,
  wire: Wire,
  sim: SimState,
  nodeVoltages: Map<NodeId, number>,
  viewport: Viewport,
  options: DrawWireOptions = {}
): void {
  const { px, py, scale } = viewport;
  const { hovered = false, selected = false, globalTime = 0 } = options;

  if (wire.pathPoints.length < 2) return;

  const fromV = nodeVoltages.get(wire.fromNode) ?? 0;
  const toV = nodeVoltages.get(wire.toNode) ?? 0;
  const vDiff = Math.abs(fromV - toV);
  const current = sim.running && vDiff > 0.001 ? vDiff : 0;
  const highToLow = fromV >= toV;

  const screenPoints = wire.pathPoints.map((p) => ({
    x: (p.x + px) * scale,
    y: (p.y + py) * scale,
  }));

  const totalLen = calcPathLength(screenPoints);

  let animState = wireAnimStates.get(wire.id);
  if (!animState) {
    animState = { particles: [], lastSpawn: 0 };
    wireAnimStates.set(wire.id, animState);
  }

  if (sim.running && current > 0 && totalLen > 0) {
    const spawnInterval = Math.max(0.05, 0.35 / (1 + current * 0.5));
    if (globalTime - animState.lastSpawn > spawnInterval) {
      const baseSpeed = Math.min(400, 60 + current * 60);
      animState.particles.push({
        t: highToLow ? 0 : 1,
        speed: baseSpeed * (0.8 + Math.random() * 0.5),
        color: current > 15 ? 'rgba(251, 191, 36, 0.95)' : 'rgba(103, 232, 249, 0.95)',
      });
      animState.lastSpawn = globalTime;
    }

    const direction = highToLow ? 1 : -1;
    const alive: CurrentParticle[] = [];
    for (const p of animState.particles) {
      p.t += (direction * p.speed * (1 / 60)) / Math.max(1, totalLen);
      if (p.t >= -0.05 && p.t <= 1.05) {
        alive.push(p);
      }
    }
    animState.particles = alive;
  } else {
    animState.particles = [];
  }

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (current > 0 && sim.running && totalLen > 0) {
    const startIdx = highToLow ? 0 : screenPoints.length - 1;
    const endIdx = highToLow ? screenPoints.length - 1 : 0;
    const startP = screenPoints[startIdx];
    const endP = screenPoints[endIdx];

    const grad = ctx.createLinearGradient(startP.x, startP.y, endP.x, endP.y);
    const hi = current > 12;
    grad.addColorStop(0, hi ? 'rgba(251, 191, 36, 0.95)' : 'rgba(6, 182, 212, 0.95)');
    grad.addColorStop(0.5, hi ? 'rgba(252, 211, 77, 0.85)' : 'rgba(34, 211, 238, 0.8)');
    grad.addColorStop(1, hi ? 'rgba(253, 224, 71, 0.65)' : 'rgba(165, 243, 252, 0.65)');
    ctx.strokeStyle = grad;
  } else {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
  }

  const baseWidth = hovered ? 7 : selected ? 6 : 4;
  ctx.lineWidth = baseWidth * (sim.running && current > 0 ? 1 : 0.9);

  ctx.beginPath();
  ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
  for (let i = 1; i < screenPoints.length; i++) {
    ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
  }
  ctx.stroke();

  if (current > 0 && sim.running) {
    ctx.shadowColor = current > 12 ? 'rgba(251, 191, 36, 0.55)' : 'rgba(6, 182, 212, 0.45)';
    ctx.shadowBlur = 12;
    ctx.lineWidth = (baseWidth - 1) * 0.7;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
    for (let i = 1; i < screenPoints.length; i++) {
      ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  if (selected) {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
    for (let i = 1; i < screenPoints.length; i++) {
      ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const p of animState.particles) {
    const t = Math.max(0, Math.min(1, p.t));
    const pos = pointAtT(screenPoints, t);
    if (!pos) continue;
    const r = (hovered ? 4.5 : 3.5) * (0.85 + current * 0.04);
    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 2.2);
    grad.addColorStop(0, p.color);
    grad.addColorStop(0.5, p.color.replace(/[\d.]+\)$/, '0.5)'));
    grad.addColorStop(1, p.color.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const sp of screenPoints) {
    ctx.fillStyle = current > 0 && sim.running
      ? 'rgba(103, 232, 249, 0.95)'
      : 'rgba(148, 163, 184, 0.9)';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, hovered ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function calcPathLength(pts: { x: number; y: number }[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

function pointAtT(
  pts: { x: number; y: number }[],
  t: number
): { x: number; y: number } | null {
  if (pts.length < 2) return null;
  const total = calcPathLength(pts);
  if (total <= 0) return pts[0];

  const target = t * total;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const seg = Math.sqrt(dx * dx + dy * dy);
    if (acc + seg >= target) {
      const f = seg === 0 ? 0 : (target - acc) / seg;
      return {
        x: pts[i - 1].x + dx * f,
        y: pts[i - 1].y + dy * f,
      };
    }
    acc += seg;
  }
  return pts[pts.length - 1];
}

export function clearWireAnimCache(wireId?: string): void {
  if (wireId) {
    wireAnimStates.delete(wireId);
  } else {
    wireAnimStates.clear();
  }
}
