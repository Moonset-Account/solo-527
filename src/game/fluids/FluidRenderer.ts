import { clamp, withAlpha, hexToRgb, mixColors } from '../../utils/math';
import type { EquipmentInstance, ReagentInstance } from '../../types/game';
import { getEquipmentById, getReagentById } from '../../utils/config';

export interface FluidLevel {
  volume: number;
  color: string;
  reagentIds: string[];
  opacity: number;
}

export function computeMixtureColor(contents: ReagentInstance[]): string {
  if (contents.length === 0) return '#ffffff';
  let totalVolume = 0;
  const contributions: { color: string; weight: number }[] = [];
  contents.forEach(ri => {
    const r = getReagentById(ri.reagentId);
    if (!r) return;
    totalVolume += ri.volume;
    contributions.push({ color: r.color, weight: ri.volume });
  });
  if (totalVolume === 0) return '#ffffff';
  let result = contributions[0].color;
  let accWeight = contributions[0].weight;
  for (let i = 1; i < contributions.length; i++) {
    const next = contributions[i];
    const t = next.weight / (accWeight + next.weight);
    result = mixColors(result, next.color, t);
    accWeight += next.weight;
  }
  return result;
}

export function computeTotalVolume(contents: ReagentInstance[]): number {
  return contents.reduce((s, c) => s + c.volume, 0);
}

export function getEquipmentVolume(eq: EquipmentInstance): number {
  return computeTotalVolume(eq.contents);
}

export function getEquipmentCapacity(eq: EquipmentInstance): number {
  const conf = getEquipmentById(eq.equipmentId);
  return conf?.capacity || 0;
}

export function drawLiquid(
  ctx: CanvasRenderingContext2D,
  eq: EquipmentInstance,
  precision: 'low' | 'medium' | 'high' = 'medium',
  time: number,
): { liquidTopY: number; liquidColor: string } {
  const conf = getEquipmentById(eq.equipmentId);
  if (!conf) return { liquidTopY: eq.y, liquidColor: '#ffffff' };
  const { width, height } = conf.renderParams;
  const totalVol = computeTotalVolume(eq.contents);
  const capacity = conf.capacity || 250;
  const fillRatio = clamp(totalVol / capacity, 0, 0.95);
  if (fillRatio <= 0.001) return { liquidTopY: eq.y + height / 2, liquidColor: '#ffffff' };

  const color = computeMixtureColor(eq.contents);
  const rgb = hexToRgb(color);
  const liquidHeight = height * fillRatio * 0.85;
  const liquidTop = eq.y + height / 2 - liquidHeight;
  const left = eq.x - width / 2;
  const right = eq.x + width / 2;

  const segments = precision === 'high' ? 24 : precision === 'medium' ? 12 : 6;
  const waveAmp = 1.5 + (eq.isStirring ? 3 : 0);
  const waveFreq = 0.1 + (eq.isStirring ? 0.08 : 0);
  const stirOffset = eq.isStirring ? time * eq.stirringSpeed * 3 : 0;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, eq.y + height / 2);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = left + (right - left) * t;
    const wave = Math.sin(t * Math.PI * 4 + time * waveFreq * 6 + stirOffset) * waveAmp
               + Math.cos(t * Math.PI * 3 + time * waveFreq * 4) * waveAmp * 0.4;
    const y = liquidTop + wave * fillRatio;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(right, eq.y + height / 2);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(eq.x, liquidTop - 5, eq.x, eq.y + height / 2);
  gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.85)`);
  gradient.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},0.95)`);
  gradient.addColorStop(1, `rgba(${Math.round(rgb.r * 0.6)},${Math.round(rgb.g * 0.6)},${Math.round(rgb.b * 0.6)},1)`);
  ctx.fillStyle = gradient;
  ctx.fill();

  if (fillRatio > 0.1) {
    ctx.beginPath();
    ctx.ellipse(eq.x, liquidTop, width * 0.42, 3 + waveAmp * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb.r + 40},${rgb.g + 40},${rgb.b + 40},0.4)`;
    ctx.fill();
  }

  if (eq.isStirring && fillRatio > 0.2) {
    ctx.save();
    ctx.translate(eq.x, liquidTop + liquidHeight / 2);
    ctx.rotate(time * eq.stirringSpeed * 4);
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.strokeStyle = withAlpha('#ffffff', 0.08 * r);
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 2; a += 0.2) {
        const radius = width * 0.15 * r + Math.sin(a * 3 + time * 2) * 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius * 0.3;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();

  return { liquidTopY: liquidTop, liquidColor: color };
}

export function drawVapor(
  ctx: CanvasRenderingContext2D,
  eq: EquipmentInstance,
  temperature: number,
  time: number,
  intensity = 1,
): void {
  if (temperature < 60) return;
  const conf = getEquipmentById(eq.equipmentId);
  if (!conf) return;
  const { width, height } = conf.renderParams;
  const totalVol = computeTotalVolume(eq.contents);
  const fillRatio = clamp(totalVol / (conf.capacity || 250), 0, 1);
  const liquidTop = eq.y + height / 2 - height * fillRatio * 0.85;
  const vaporAmount = clamp((temperature - 50) / 80, 0, 1.2) * intensity;
  const count = Math.floor(vaporAmount * 6);
  for (let i = 0; i < count; i++) {
    const t = (time * 0.3 + i * 0.7 + eq.x * 0.001) % 1;
    const x = eq.x + Math.sin(time * 2 + i * 3) * width * 0.2;
    const y = liquidTop - t * 60 - 10;
    const size = 8 + t * 20;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240,248,255,${(1 - t) * 0.15 * vaporAmount})`;
    ctx.fill();
  }
}
