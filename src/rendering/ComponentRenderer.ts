import type { BaseComponent, SimState } from '../simulation/types';
import type { Viewport } from './ParticleSystem';
import type { ParticleSystem } from './ParticleSystem';

interface DrawComponentOptions {
  selected?: boolean;
  hovered?: boolean;
  particleSystem?: ParticleSystem;
}

export function drawComponent(
  ctx: CanvasRenderingContext2D,
  comp: BaseComponent,
  sim: SimState,
  viewport: Viewport,
  options: DrawComponentOptions = {}
): void {
  const { px, py, scale } = viewport;
  const { selected = false, hovered = false, particleSystem } = options;

  const sx = (comp.x + px) * scale;
  const sy = (comp.y + py) * scale;
  const rot = comp.rotation;

  const compState = sim.componentStates.get(comp.id) ?? {};
  const brightness = typeof compState.brightness === 'number' ? compState.brightness : 0;
  const isOn = comp.type === 'switch' ? comp.state.closed !== false : true;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);

  if (selected) {
    ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
    ctx.shadowBlur = 18 * (1 / scale);
  } else if (hovered) {
    ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
    ctx.shadowBlur = 10 * (1 / scale);
  }

  ctx.lineWidth = 2.5 / scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (comp.type) {
    case 'battery':
      drawBattery(ctx, comp, isOn);
      break;
    case 'resistor':
      drawResistor(ctx, comp);
      break;
    case 'capacitor':
      drawCapacitor(ctx, comp);
      break;
    case 'switch':
      drawSwitch(ctx, comp, comp.state.closed !== false);
      break;
    case 'bulb':
      drawBulb(ctx, comp, brightness, particleSystem);
      break;
    case 'wire_joint':
      drawWireJoint(ctx, comp);
      break;
  }

  if (selected) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([4 / scale, 3 / scale]);
    const bb = getComponentBoundingBox(comp);
    ctx.strokeRect(bb.minX - 6, bb.minY - 6, bb.maxX - bb.minX + 12, bb.maxY - bb.minY + 12);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawBattery(ctx: CanvasRenderingContext2D, comp: BaseComponent, _isOn: boolean): void {
  const voltage = typeof comp.params.voltage === 'number' ? comp.params.voltage : 9;
  const width = 80;
  const height = 28;
  const halfW = width / 2;
  const halfH = height / 2;

  const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
  grad.addColorStop(0, 'rgba(51, 65, 85, 0.95)');
  grad.addColorStop(0.5, 'rgba(71, 85, 105, 0.95)');
  grad.addColorStop(1, 'rgba(30, 41, 59, 0.95)');
  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
  roundRect(ctx, -halfW, -halfH, width, height, 6);
  ctx.fill();
  ctx.stroke();

  const sepX = -halfW + 18;
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sepX, -halfH + 4);
  ctx.lineTo(sepX, halfH - 4);
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 14px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${voltage}V`, -halfW + 48, 0);

  ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
  ctx.beginPath();
  ctx.moveTo(halfW, -6);
  ctx.lineTo(halfW + 10, 0);
  ctx.lineTo(halfW, 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', halfW + 20, 0);

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-halfW - 10, -4);
  ctx.lineTo(-halfW - 10, 4);
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('−', -halfW - 22, 0);

  drawPin(ctx, -halfW, 0);
  drawPin(ctx, halfW, 0);
}

function drawResistor(ctx: CanvasRenderingContext2D, comp: BaseComponent): void {
  const resistance = typeof comp.params.resistance === 'number' ? comp.params.resistance : 1000;
  const totalW = 80;
  const halfW = totalW / 2;
  const zigzagStart = -halfW + 12;
  const zigzagEnd = halfW - 12;
  const zigzagW = zigzagEnd - zigzagStart;
  const teeth = 8;
  const toothW = zigzagW / teeth;
  const amp = 9;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-halfW, 0);
  ctx.lineTo(zigzagStart, 0);
  ctx.stroke();

  const grad = ctx.createLinearGradient(zigzagStart, -amp, zigzagStart, amp);
  grad.addColorStop(0, 'rgba(251, 191, 36, 0.95)');
  grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.95)');
  grad.addColorStop(1, 'rgba(217, 119, 6, 0.95)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(zigzagStart, 0);
  for (let i = 0; i < teeth; i++) {
    const x1 = zigzagStart + toothW * (i + 0.25);
    const y1 = i % 2 === 0 ? -amp : amp;
    const x2 = zigzagStart + toothW * (i + 0.75);
    const y2 = i % 2 === 0 ? amp : -amp;
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.lineTo(zigzagEnd, 0);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(zigzagEnd, 0);
  ctx.lineTo(halfW, 0);
  ctx.stroke();

  const label = formatResistance(resistance);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelY = amp + 14;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  const labelW = ctx.measureText(label).width + 10;
  roundRect(ctx, -labelW / 2, labelY - 9, labelW, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(label, 0, labelY);

  drawPin(ctx, -halfW, 0);
  drawPin(ctx, halfW, 0);
}

function drawCapacitor(ctx: CanvasRenderingContext2D, comp: BaseComponent): void {
  const capacitance = typeof comp.params.capacitance === 'number' ? comp.params.capacitance : 100e-6;
  const totalW = 60;
  const halfW = totalW / 2;
  const gap = 10;
  const plateH = 28;
  const halfH = plateH / 2;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-halfW, 0);
  ctx.lineTo(-gap / 2, 0);
  ctx.moveTo(gap / 2, 0);
  ctx.lineTo(halfW, 0);
  ctx.stroke();

  const plateGrad = ctx.createLinearGradient(-gap / 2 - 4, 0, gap / 2 + 4, 0);
  plateGrad.addColorStop(0, 'rgba(236, 72, 153, 0.95)');
  plateGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.95)');
  plateGrad.addColorStop(1, 'rgba(99, 102, 241, 0.95)');
  ctx.strokeStyle = plateGrad;
  ctx.lineWidth = 4;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(-gap / 2, -halfH);
  ctx.lineTo(-gap / 2, halfH);
  ctx.moveTo(gap / 2, -halfH);
  ctx.lineTo(gap / 2, halfH);
  ctx.stroke();
  ctx.lineCap = 'round';

  const label = formatCapacitance(capacitance);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelY = halfH + 16;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  const labelW = ctx.measureText(label).width + 10;
  roundRect(ctx, -labelW / 2, labelY - 9, labelW, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(label, 0, labelY);

  drawPin(ctx, -halfW, 0);
  drawPin(ctx, halfW, 0);
}

function drawSwitch(ctx: CanvasRenderingContext2D, comp: BaseComponent, closed: boolean): void {
  const totalW = 70;
  const halfW = totalW / 2;
  const pivotX = -halfW + 8;
  const contactX = halfW - 8;
  const handleLen = contactX - pivotX;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-halfW, 0);
  ctx.lineTo(pivotX, 0);
  ctx.moveTo(contactX, 0);
  ctx.lineTo(halfW, 0);
  ctx.stroke();

  ctx.fillStyle = closed ? 'rgba(16, 185, 129, 0.95)' : 'rgba(100, 116, 139, 0.95)';
  ctx.strokeStyle = closed ? 'rgba(52, 211, 153, 0.9)' : 'rgba(148, 163, 184, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pivotX, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(contactX, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = closed ? 'rgba(16, 185, 129, 0.95)' : 'rgba(100, 116, 139, 0.6)';
  ctx.fill();
  ctx.stroke();

  const handleAngle = closed ? 0 : -0.75;
  const handleEndX = pivotX + Math.cos(-handleAngle) * handleLen;
  const handleEndY = 0 + Math.sin(-handleAngle) * handleLen;

  ctx.strokeStyle = closed ? 'rgba(16, 185, 129, 0.95)' : 'rgba(245, 158, 11, 0.95)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pivotX, 0);
  ctx.lineTo(handleEndX, handleEndY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.95)';
  ctx.beginPath();
  ctx.arc(handleEndX, handleEndY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const label = closed ? 'ON' : 'OFF';
  ctx.fillStyle = closed ? 'rgba(16, 185, 129, 0.95)' : 'rgba(245, 158, 11, 0.95)';
  ctx.font = 'bold 10px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelY = 18;
  const labelW = ctx.measureText(label).width + 12;
  roundRect(ctx, -labelW / 2, labelY - 9, labelW, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(label, 0, labelY);

  drawPin(ctx, -halfW, 0);
  drawPin(ctx, halfW, 0);
}

function drawBulb(
  ctx: CanvasRenderingContext2D,
  comp: BaseComponent,
  brightness: number,
  particleSystem?: ParticleSystem
): void {
  const radius = 18;
  const baseY = radius + 6;
  const baseW = 20;
  const baseH = 12;
  const totalW = 60;
  const halfW = totalW / 2;

  if (brightness > 0.05) {
    const glowR = radius + 30 + brightness * 60;
    const grad = ctx.createRadialGradient(0, -2, 2, 0, -2, glowR);
    grad.addColorStop(0, `rgba(254, 249, 195, ${0.8 * brightness})`);
    grad.addColorStop(0.3, `rgba(253, 224, 71, ${0.45 * brightness})`);
    grad.addColorStop(0.6, `rgba(251, 191, 36, ${0.18 * brightness})`);
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -2, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  const bulbGrad = ctx.createRadialGradient(-4, -8, 2, 0, 0, radius + 2);
  bulbGrad.addColorStop(0, brightness > 0.1 ? 'rgba(254, 252, 232, 0.95)' : 'rgba(241, 245, 249, 0.25)');
  bulbGrad.addColorStop(0.6, brightness > 0.1 ? 'rgba(254, 243, 199, 0.85)' : 'rgba(203, 213, 225, 0.18)');
  bulbGrad.addColorStop(1, brightness > 0.1 ? 'rgba(253, 224, 71, 0.5)' : 'rgba(148, 163, 184, 0.1)');
  ctx.fillStyle = bulbGrad;
  ctx.strokeStyle = brightness > 0.1 ? 'rgba(250, 204, 21, 0.85)' : 'rgba(148, 163, 184, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -2, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = brightness > 0.3 ? 'rgba(180, 83, 9, 0.95)' : 'rgba(100, 116, 139, 0.85)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(0, 2);
  ctx.lineTo(8, -8);
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 6);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = 'rgba(71, 85, 105, 0.95)';
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, -baseW / 2, baseY - 2, baseW, baseH, 3);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-halfW, baseY + baseH / 2);
  ctx.lineTo(-baseW / 2, baseY + baseH / 2);
  ctx.moveTo(baseW / 2, baseY + baseH / 2);
  ctx.lineTo(halfW, baseY + baseH / 2);
  ctx.stroke();

  drawPin(ctx, -halfW, baseY + baseH / 2);
  drawPin(ctx, halfW, baseY + baseH / 2);

  const pct = Math.max(0, Math.min(1, brightness));
  const label = `${Math.round(pct * 100)}%`;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelY = baseY + baseH + 14;
  const labelW = ctx.measureText(label).width + 10;
  roundRect(ctx, -labelW / 2, labelY - 9, labelW, 18, 4);
  ctx.fill();
  ctx.fillStyle = pct > 0.5 ? 'rgba(250, 204, 21, 0.95)' : 'rgba(148, 163, 184, 0.9)';
  ctx.fillText(label, 0, labelY);
}

function drawWireJoint(ctx: CanvasRenderingContext2D, _comp: BaseComponent): void {
  ctx.fillStyle = 'rgba(6, 182, 212, 0.95)';
  ctx.strokeStyle = 'rgba(8, 145, 178, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = 'rgba(148, 163, 184, 0.95)';
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function formatResistance(r: number): string {
  if (r >= 1e6) return `${(r / 1e6).toFixed(r % 1e6 === 0 ? 0 : 2)}MΩ`;
  if (r >= 1e3) return `${(r / 1e3).toFixed(r % 1e3 === 0 ? 0 : 2)}kΩ`;
  return `${r}Ω`;
}

function formatCapacitance(c: number): string {
  if (c >= 1) return `${c.toFixed(2)}F`;
  if (c >= 1e-3) return `${(c * 1e3).toFixed(2)}mF`;
  if (c >= 1e-6) return `${(c * 1e6).toFixed(c * 1e9 % 1000 === 0 ? 0 : 2)}µF`;
  if (c >= 1e-9) return `${(c * 1e9).toFixed(2)}nF`;
  return `${(c * 1e12).toFixed(2)}pF`;
}

function getComponentBoundingBox(comp: BaseComponent): { minX: number; minY: number; maxX: number; maxY: number } {
  switch (comp.type) {
    case 'battery':
      return { minX: -60, minY: -22, maxX: 60, maxY: 22 };
    case 'resistor':
      return { minX: -45, minY: -18, maxX: 45, maxY: 35 };
    case 'capacitor':
      return { minX: -35, minY: -20, maxX: 35, maxY: 35 };
    case 'switch':
      return { minX: -40, minY: -25, maxX: 40, maxY: 30 };
    case 'bulb':
      return { minX: -35, minY: -30, maxX: 35, maxY: 45 };
    case 'wire_joint':
      return { minX: -10, minY: -10, maxX: 10, maxY: 10 };
    default:
      return { minX: -30, minY: -30, maxX: 30, maxY: 30 };
  }
}
