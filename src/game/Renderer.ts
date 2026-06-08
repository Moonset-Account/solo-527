import type { EquipmentInstance, Particle } from '../types/game';
import { getEquipmentById } from '../utils/config';
import { clamp, lerp, withAlpha } from '../utils/math';
import { drawLiquid, drawVapor, getEquipmentCapacity, getEquipmentVolume } from './fluids/FluidRenderer';
import type { GraphicsSettings } from '../types/config';

export class Renderer {
  private width = 960;
  private height = 640;
  private time = 0;
  private settings: GraphicsSettings;

  constructor(settings: GraphicsSettings) {
    this.settings = settings;
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
  }

  setSettings(s: GraphicsSettings): void { this.settings = s; }

  render(
    ctx: CanvasRenderingContext2D,
    equipment: EquipmentInstance[],
    particles: Particle[],
    draggingReagent: { reagentId: string; volume: number; x: number; y: number } | null,
    reagentColorMap: Record<string, { color: string; glow?: string }>,
  ): void {
    this.time += 1 / 60;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground(ctx);
    this.drawBench(ctx);
    this.drawGrid(ctx);

    equipment.forEach(eq => { if (eq.isHeating) this.drawHeatingEffect(ctx, eq); });

    const sorted = [...equipment].sort((a, b) => a.y - b.y);
    sorted.forEach(eq => this.drawEquipmentShadow(ctx, eq));
    sorted.forEach(eq => this.drawEquipment(ctx, eq));
    sorted.forEach(eq => {
      const result = drawLiquid(ctx, eq, this.settings.fluidPrecision, this.time);
      drawVapor(ctx, eq, eq.temperature, this.time);
      if (result.liquidTopY && this.settings.postProcessing) {
        this.drawGlow(ctx, eq.x, result.liquidTopY, 50, result.liquidColor, 0.12);
      }
    });

    if (this.settings.particlesEnabled) {
      particles.forEach(p => this.drawParticle(ctx, p));
    }

    sorted.forEach(eq => { if (eq.selected) this.drawSelectionRing(ctx, eq); });
    sorted.forEach(eq => this.drawEquipmentLabel(ctx, eq));
    sorted.forEach(eq => this.drawScaleMarks(ctx, eq));

    if (draggingReagent && reagentColorMap[draggingReagent.reagentId]) {
      this.drawDraggingReagent(ctx, draggingReagent, reagentColorMap[draggingReagent.reagentId].color);
    }

    if (this.settings.postProcessing && this.settings.bloomIntensity > 0) {
      this.applyBloom(ctx);
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const g = ctx.createRadialGradient(this.width / 2, this.height / 2, 100, this.width / 2, this.height / 2, 800);
    g.addColorStop(0, '#122236');
    g.addColorStop(0.6, '#0c1a2c');
    g.addColorStop(1, '#060d18');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.width, this.height);

    const vignette = ctx.createRadialGradient(this.width / 2, this.height / 2, this.width * 0.3, this.width / 2, this.height / 2, this.width * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawBench(ctx: CanvasRenderingContext2D): void {
    const benchY = 500;
    const benchH = this.height - benchY;
    const g = ctx.createLinearGradient(0, benchY, 0, this.height);
    g.addColorStop(0, '#2d3a4a');
    g.addColorStop(0.1, '#1f2c3c');
    g.addColorStop(1, '#152030');
    ctx.fillStyle = g;
    ctx.fillRect(0, benchY, this.width, benchH);

    ctx.fillStyle = '#3a4a5c';
    ctx.fillRect(0, benchY - 3, this.width, 5);
    ctx.fillStyle = '#5a6a7c';
    ctx.fillRect(0, benchY - 4, this.width, 1);

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const x = (this.width / 8) * i + 30;
      ctx.beginPath();
      ctx.moveTo(x, benchY + 10);
      ctx.lineTo(x + 40, this.height - 10);
      ctx.stroke();
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke();
    }
    for (let y = 0; y <= 500; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }
  }

  private drawEquipmentShadow(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf) return;
    const { width, height } = conf.renderParams;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(eq.x + 4, eq.y + height / 2 + 18, width * 0.42, height * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.filter = 'blur(6px)';
    ctx.fill();
    ctx.restore();
  }

  private drawEquipment(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf) return;
    switch (conf.type) {
      case 'beaker': this.drawBeaker(ctx, eq); break;
      case 'flask': this.drawFlask(ctx, eq); break;
      case 'burette': this.drawBurette(ctx, eq); break;
      case 'pipette': this.drawPipette(ctx, eq); break;
      case 'thermometer': this.drawThermometer(ctx, eq); break;
      case 'burner': this.drawBurner(ctx, eq); break;
      case 'stirrer': this.drawStirrer(ctx, eq); break;
    }
  }

  private drawGlassContainer(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    options: { neck?: number; bottomR?: number; topR?: number; body?: 'rect' | 'cone' } = {},
  ): void {
    const { neck = 0, bottomR = 10, topR = 8, body = 'rect' } = options;
    ctx.save();
    ctx.beginPath();
    if (body === 'rect') {
      ctx.moveTo(x - w / 2 + topR, y - h / 2);
      ctx.lineTo(x + w / 2 - topR, y - h / 2);
      ctx.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + topR);
      ctx.lineTo(x + w / 2, y + h / 2 - bottomR);
      ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2 - bottomR, y + h / 2);
      ctx.lineTo(x - w / 2 + bottomR, y + h / 2);
      ctx.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - bottomR);
      ctx.lineTo(x - w / 2, y - h / 2 + topR);
      ctx.quadraticCurveTo(x - w / 2, y - h / 2, x - w / 2 + topR, y - h / 2);
    } else {
      const nw = neck || w * 0.4;
      const nh = h * 0.35;
      ctx.moveTo(x - nw / 2, y - h / 2);
      ctx.lineTo(x + nw / 2, y - h / 2);
      ctx.lineTo(x + nw / 2 + 4, y - h / 2 + nh);
      ctx.lineTo(x + w / 2 - bottomR, y + h / 2 - bottomR * 1.2);
      ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2 - bottomR, y + h / 2);
      ctx.lineTo(x - w / 2 + bottomR, y + h / 2);
      ctx.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - bottomR * 1.2);
      ctx.lineTo(x - nw / 2 - 4, y - h / 2 + nh);
    }
    ctx.closePath();
    const glass = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
    glass.addColorStop(0, 'rgba(220, 240, 255, 0.08)');
    glass.addColorStop(0.15, 'rgba(220, 240, 255, 0.22)');
    glass.addColorStop(0.5, 'rgba(220, 240, 255, 0.05)');
    glass.addColorStop(0.85, 'rgba(220, 240, 255, 0.18)');
    glass.addColorStop(1, 'rgba(220, 240, 255, 0.06)');
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.3, y - h / 2 + 8);
    ctx.lineTo(x - w * 0.3, y + h / 2 - 15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawBeaker(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId)!;
    const { width: w, height: h, radius } = conf.renderParams;
    this.drawGlassContainer(ctx, eq.x, eq.y, w, h, { bottomR: radius, topR: radius });
    ctx.save();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.45)';
    ctx.fillRect(eq.x - w / 2 - 6, eq.y - h / 2 - 3, w + 12, 6);
    ctx.strokeStyle = 'rgba(140, 180, 220, 0.6)';
    ctx.strokeRect(eq.x - w / 2 - 6, eq.y - h / 2 - 3, w + 12, 6);
    ctx.restore();
  }

  private drawFlask(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId)!;
    const { width: w, height: h, radius } = conf.renderParams;
    this.drawGlassContainer(ctx, eq.x, eq.y, w, h, { neck: w * 0.3, bottomR: radius, body: 'cone' });
  }

  private drawBurette(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId)!;
    const { width: w, height: h } = conf.renderParams;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(eq.x - w / 2, eq.y - h / 2, w, h * 0.9, w / 2);
    ctx.fillStyle = 'rgba(220, 240, 255, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eq.x - 3, eq.y + h * 0.4);
    ctx.lineTo(eq.x, eq.y + h / 2);
    ctx.lineTo(eq.x + 3, eq.y + h * 0.4);
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
    ctx.stroke();
    ctx.restore();
  }

  private drawPipette(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId)!;
    const { width: w, height: h } = conf.renderParams;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(eq.x - w / 2, eq.y - h / 2, w, h, w / 2);
    ctx.fillStyle = 'rgba(220, 240, 255, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.45)';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(eq.x, eq.y, w * 1.4, w * 1.8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  private drawThermometer(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId)!;
    const { width: w, height: h } = conf.renderParams;
    const temp = clamp(eq.temperature, -10, 120);
    const tRatio = (temp + 10) / 130;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(eq.x - w / 2, eq.y - h / 2, w, h * 0.85, w);
    ctx.fillStyle = 'rgba(220, 240, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
    ctx.stroke();
    const bulbR = w * 1.3;
    ctx.beginPath();
    ctx.arc(eq.x, eq.y + h / 2 - 10, bulbR, 0, Math.PI * 2);
    const tempColor = temp < 30 ? '#44aaff' : temp < 60 ? '#ffaa44' : '#ff4444';
    ctx.fillStyle = tempColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.stroke();
    const colTop = eq.y - h / 2 + 8;
    const colBot = eq.y + h / 2 - 20;
    const colH = colBot - colTop;
    const fillY = colBot - colH * tRatio;
    ctx.fillStyle = tempColor;
    ctx.fillRect(eq.x - 2, fillY, 4, colBot - fillY);
    for (let i = 0; i <= 10; i++) {
      const y = lerp(colBot, colTop, i / 10);
      ctx.fillStyle = 'rgba(220,240,255,0.6)';
      ctx.fillRect(eq.x + w / 2 + 2, y, i % 5 === 0 ? 10 : 5, 1);
      if (i % 5 === 0) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(180,220,255,0.8)';
        ctx.fillText(`${(i / 10 * 130 - 10).toFixed(0)}°`, eq.x + w / 2 + 14, y + 3);
      }
    }
    ctx.restore();
  }

  private drawBurner(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId)!;
    const { width: w, height: h } = conf.renderParams;
    ctx.save();
    const baseY = eq.y + h / 2 - 12;
    ctx.fillStyle = '#2a3542';
    ctx.beginPath();
    ctx.ellipse(eq.x, baseY + 5, w * 0.55, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d4a5c';
    ctx.fillRect(eq.x - w * 0.15, eq.y - 5, w * 0.3, h * 0.6);
    ctx.fillStyle = '#4d5d70';
    ctx.fillRect(eq.x - w * 0.1, eq.y - 8, w * 0.2, 8);
    if (eq.isHeating) {
      const flameH = 30 + eq.heatLevel * 25;
      const flicker = Math.sin(this.time * 20) * 2;
      const flameGrad = ctx.createRadialGradient(eq.x, eq.y - 10, 2, eq.x, eq.y - flameH * 0.4, flameH);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.2, '#ffff88');
      flameGrad.addColorStop(0.5, '#ffaa22');
      flameGrad.addColorStop(0.85, 'rgba(255,80,0,0.6)');
      flameGrad.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.beginPath();
      ctx.moveTo(eq.x - 14, eq.y - 8);
      ctx.quadraticCurveTo(eq.x - 18 + flicker, eq.y - flameH * 0.6, eq.x, eq.y - flameH);
      ctx.quadraticCurveTo(eq.x + 18 - flicker, eq.y - flameH * 0.6, eq.x + 14, eq.y - 8);
      ctx.closePath();
      ctx.fillStyle = flameGrad;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eq.x, eq.y - flameH * 0.3, 8, flameH * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120, 200, 255, 0.5)';
      ctx.fill();
    }
    ctx.restore();
  }

  private drawStirrer(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId)!;
    const { width: w, height: h } = conf.renderParams;
    ctx.save();
    const g = ctx.createLinearGradient(0, eq.y, 0, eq.y + h);
    g.addColorStop(0, '#3a4a5c');
    g.addColorStop(1, '#1f2c3c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(eq.x - w / 2, eq.y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#4a5a6c';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (eq.isStirring) {
      ctx.save();
      ctx.translate(eq.x, eq.y + h / 2);
      ctx.rotate(this.time * eq.stirringSpeed * 5);
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha('#00d4ff', 0.6);
      ctx.fill();
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = eq.isStirring ? '#00ff88' : '#4a5a6c';
    ctx.beginPath();
    ctx.arc(eq.x + w / 2 - 12, eq.y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawHeatingEffect(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf || !eq.isHeating) return;
    const { width, height } = conf.renderParams;
    const intensity = clamp(eq.heatLevel, 0, 1);
    ctx.save();
    const heatGrad = ctx.createRadialGradient(eq.x, eq.y + height / 2, 5, eq.x, eq.y + height / 2, width);
    heatGrad.addColorStop(0, `rgba(255, 150, 50, ${0.2 * intensity})`);
    heatGrad.addColorStop(1, 'rgba(255, 150, 50, 0)');
    ctx.fillStyle = heatGrad;
    ctx.fillRect(eq.x - width, eq.y, width * 2, height + 40);
    for (let i = 0; i < 3; i++) {
      const t = (this.time * (0.8 + i * 0.3)) % 1;
      const x = eq.x + Math.sin(this.time * 3 + i) * 8;
      const y = eq.y + height / 2 + 20 - t * 40;
      ctx.beginPath();
      ctx.arc(x, y, 4 + t * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 180, 80, ${(1 - t) * 0.15 * intensity})`;
      ctx.fill();
    }
    ctx.restore();
  }

  private drawSelectionRing(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf) return;
    const { width, height } = conf.renderParams;
    ctx.save();
    ctx.strokeStyle = withAlpha('#00d4ff', 0.7 + Math.sin(this.time * 4) * 0.3);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -this.time * 20;
    ctx.beginPath();
    ctx.roundRect(eq.x - width / 2 - 6, eq.y - height / 2 - 6, width + 12, height + 12, 12);
    ctx.stroke();
    ctx.restore();
  }

  private drawEquipmentLabel(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf) return;
    const { width, height } = conf.renderParams;
    const cap = getEquipmentCapacity(eq);
    const vol = getEquipmentVolume(eq);
    if (cap > 0) {
      ctx.save();
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(180, 220, 255, 0.75)';
      ctx.textAlign = 'center';
      ctx.fillText(`${vol.toFixed(0)}/${cap}mL`, eq.x, eq.y + height / 2 + 38);
      const temp = eq.temperature;
      if (conf.measurable || temp !== 25) {
        const tempColor = temp > 70 ? '#ff6666' : temp > 50 ? '#ffaa66' : '#88ddff';
        ctx.fillStyle = tempColor;
        ctx.fillText(`${temp.toFixed(1)}°C`, eq.x, eq.y + height / 2 + 52);
      }
      ctx.restore();
    }
  }

  private drawScaleMarks(ctx: CanvasRenderingContext2D, eq: EquipmentInstance): void {
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf?.measurable) return;
    const { width, height } = conf.renderParams;
    const cap = conf.capacity || 100;
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.font = '9px sans-serif';
    ctx.fillStyle = 'rgba(180, 220, 255, 0.7)';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 5; i++) {
      const ratio = i / 5;
      const y = eq.y + height / 2 - 8 - ratio * height * 0.82;
      const ml = cap * ratio;
      const len = i % 2 === 0 ? 10 : 5;
      ctx.beginPath();
      ctx.moveTo(eq.x - width / 2 + 2, y);
      ctx.lineTo(eq.x - width / 2 + 2 + len, y);
      ctx.stroke();
      if (i % 2 === 0) {
        ctx.fillText(`${ml.toFixed(0)}`, eq.x - width / 2 - 28, y + 3);
      }
    }
    ctx.restore();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.save();
    if (p.type === 'bubble') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(p.color, alpha * 0.25);
      ctx.fill();
      ctx.strokeStyle = withAlpha(p.color, alpha * 0.6);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else if (p.type === 'smoke') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + (1 - alpha) * 2), 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(p.color, alpha * 0.3);
      ctx.fill();
    } else if (p.type === 'spark') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(p.color, alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8 * alpha;
      ctx.fill();
    } else if (p.type === 'glow') {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      g.addColorStop(0, withAlpha(p.color, alpha * 0.8));
      g.addColorStop(1, withAlpha(p.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(p.x - p.size * 2, p.y - p.size * 2, p.size * 4, p.size * 4);
    } else if (p.type === 'precipitate') {
      ctx.fillStyle = withAlpha(p.color, alpha);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }

  private drawDraggingReagent(
    ctx: CanvasRenderingContext2D,
    drag: { reagentId: string; volume: number; x: number; y: number },
    color: string,
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(drag.x, drag.y, 30, 40, 0, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(color, 0.7);
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.strokeStyle = withAlpha('#ffffff', 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${drag.volume.toFixed(0)}mL`, drag.x, drag.y + 4);
    ctx.restore();
  }

  private drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, intensity: number): void {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(color, intensity));
    g.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  private applyBloom(ctx: CanvasRenderingContext2D): void {
    if (!this.settings.postProcessing) return;
  }
}
