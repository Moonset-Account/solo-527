import { LabObject, ReactionEffect } from '@/types/game';

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  labObjects: LabObject[];
  effects: ReactionEffect[];
  temperature: number;
  hoveredObject: string | null;
  selectedObject: string | null;
  time: number;
}

class CanvasRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(context: RenderContext): void {
    if (!this.ctx || !this.canvas) return;
    const { ctx, width, height } = context;
    ctx.clearRect(0, 0, width, height);
    this.drawBackground(ctx, width, height);
    this.drawLabBench(ctx, width, height);
    context.labObjects.forEach(obj => this.drawLabObject(ctx, obj, context));
    context.effects.forEach(effect => this.drawEffect(ctx, effect, context.time));
    if (context.temperature > 0) {
      this.drawTemperatureGauge(ctx, width, height, context.temperature);
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a2e2e');
    grad.addColorStop(0.6, '#0D4F4F');
    grad.addColorStop(1, '#0a3a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(245,197,66,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  private drawLabBench(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const benchY = h * 0.72;
    const grad = ctx.createLinearGradient(0, benchY, 0, h);
    grad.addColorStop(0, '#2a1a0a');
    grad.addColorStop(0.1, '#3d2817');
    grad.addColorStop(0.5, '#3d2817');
    grad.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, benchY, w, h - benchY);
    ctx.strokeStyle = '#5a3d25';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, benchY); ctx.lineTo(w, benchY); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, benchY, w, 3);
  }

  private drawLabObject(ctx: CanvasRenderingContext2D, obj: LabObject, context: RenderContext): void {
    const isHovered = context.hoveredObject === obj.id;
    const isSelected = context.selectedObject === obj.id;
    ctx.save();
    ctx.translate(obj.x, obj.y);
    if (isSelected) {
      ctx.shadowColor = '#F5C542';
      ctx.shadowBlur = 15;
    } else if (isHovered) {
      ctx.shadowColor = '#F5C542';
      ctx.shadowBlur = 8;
    }
    if (obj.type === 'apparatus') {
      this.drawApparatus(ctx, obj.refId, obj.width, obj.height, obj.placed);
    } else {
      this.drawReagent(ctx, obj.refId, obj.width, obj.height);
    }
    ctx.restore();
  }

  private drawApparatus(ctx: CanvasRenderingContext2D, refId: string, w: number, h: number, placed: boolean): void {
    ctx.globalAlpha = placed ? 1 : 0.7;
    const alpha = placed ? 'cc' : '88';
    switch (refId) {
      case 'beaker':
        ctx.fillStyle = `#8ecae6${alpha}`;
        ctx.strokeStyle = '#4a90a4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/2 + 4, -h/2);
        ctx.lineTo(-w/2, h/2);
        ctx.lineTo(w/2, h/2);
        ctx.lineTo(w/2 - 4, -h/2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-w/2 + 4, -h/2);
        ctx.lineTo(-w/2 - 6, -h/2 - 4);
        ctx.stroke();
        break;
      case 'flask':
        ctx.fillStyle = `#8ecae6${alpha}`;
        ctx.strokeStyle = '#4a90a4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -h/2);
        ctx.lineTo(-6, -h/4);
        ctx.lineTo(-w/2, h/2);
        ctx.lineTo(w/2, h/2);
        ctx.lineTo(6, -h/4);
        ctx.lineTo(6, -h/2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;
      case 'test_tube':
        ctx.fillStyle = `#8ecae6${alpha}`;
        ctx.strokeStyle = '#4a90a4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/4, -h/2);
        ctx.lineTo(-w/4, h/4);
        ctx.arc(0, h/4, w/4, Math.PI, 0);
        ctx.lineTo(w/4, -h/2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;
      case 'thermometer':
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -h/2);
        ctx.lineTo(0, h/4);
        ctx.stroke();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, h/3, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bunsen_burner':
        ctx.fillStyle = '#555';
        ctx.fillRect(-w/4, 0, w/2, h/2);
        ctx.fillStyle = '#333';
        ctx.fillRect(-w/6, -h/4, w/3, h/4);
        break;
      case 'dropper':
        ctx.fillStyle = '#7a5c3a';
        ctx.fillRect(-3, -h/2, 6, h/3);
        ctx.fillStyle = `#8ecae6${alpha}`;
        ctx.beginPath();
        ctx.moveTo(-2, -h/2 + h/3);
        ctx.lineTo(-4, h/4);
        ctx.lineTo(4, h/4);
        ctx.lineTo(2, -h/2 + h/3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4a90a4'; ctx.lineWidth = 1; ctx.stroke();
        break;
      case 'stirrer':
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -h/2);
        ctx.lineTo(0, h/3);
        ctx.stroke();
        ctx.fillStyle = '#aaa';
        ctx.fillRect(-5, h/3 - 2, 10, 8);
        break;
      case 'funnel':
        ctx.fillStyle = `#8ecae6${alpha}`;
        ctx.strokeStyle = '#4a90a4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/2, -h/2);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-4, h/2);
        ctx.lineTo(4, h/2);
        ctx.lineTo(4, 0);
        ctx.lineTo(w/2, -h/2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;
      case 'graduated_cylinder':
        ctx.fillStyle = `#8ecae6${alpha}`;
        ctx.strokeStyle = '#4a90a4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/3, -h/2);
        ctx.lineTo(-w/3, h/2);
        ctx.lineTo(w/3, h/2);
        ctx.lineTo(w/3, -h/2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        for (let i = 1; i <= 4; i++) {
          const y = -h/2 + (h / 5) * i;
          ctx.beginPath();
          ctx.moveTo(-w/3, y);
          ctx.lineTo(-w/3 + 8, y);
          ctx.stroke();
        }
        break;
    }
    ctx.globalAlpha = 1;
  }

  private drawReagent(ctx: CanvasRenderingContext2D, refId: string, w: number, h: number): void {
    ctx.fillStyle = '#444';
    ctx.fillRect(-w/2 + 2, -h/3, w - 4, h * 2/3);
    ctx.fillRect(-w/4, -h/2, w/2, h/3 + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-w/2 + 2, -h/3, w - 4, 2);
  }

  private drawEffect(ctx: CanvasRenderingContext2D, effect: ReactionEffect, time: number): void {
    const progress = (time % effect.duration) / effect.duration;
    ctx.save();
    ctx.translate(effect.x, effect.y);
    switch (effect.type) {
      case 'bubble':
        ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - progress)})`;
        for (let i = 0; i < 3; i++) {
          const ox = Math.sin(time / 200 + i * 2) * 10;
          const oy = -progress * 40 * (i + 1) / 3;
          const r = 3 + i * 1.5;
          ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'color_change':
        ctx.fillStyle = effect.color || '#F5C542';
        ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.3;
        ctx.fillRect(-30, -30, 60, 60);
        break;
      case 'precipitate':
        ctx.fillStyle = effect.color || '#fff';
        ctx.globalAlpha = 0.7 * progress;
        for (let i = 0; i < 5; i++) {
          const px = (i - 2) * 8;
          const py = progress * 20;
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'heat_glow':
        const intensity = Math.sin(progress * Math.PI) * effect.intensity;
        const gradient = ctx.createRadialGradient(0, -10, 0, 0, -10, 40);
        gradient.addColorStop(0, `rgba(255,100,0,${0.4 * intensity})`);
        gradient.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(-40, -50, 80, 60);
        break;
      case 'steam':
        ctx.strokeStyle = `rgba(200,200,200,${0.4 * (1 - progress)})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-8 + i * 8, 0);
          ctx.quadraticCurveTo(-4 + i * 8 + Math.sin(time/300) * 5, -progress * 30, -8 + i * 8 + 3, -progress * 50);
          ctx.stroke();
        }
        break;
      case 'smoke':
        ctx.fillStyle = `rgba(80,80,80,${0.3 * (1 - progress)})`;
        for (let i = 0; i < 4; i++) {
          const ox = Math.sin(time / 500 + i) * 15;
          const oy = -progress * 40 - i * 8;
          const r = 6 + progress * 8;
          ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill();
        }
        break;
    }
    ctx.restore();
  }

  private drawTemperatureGauge(ctx: CanvasRenderingContext2D, w: number, h: number, temp: number): void {
    const gx = w - 50;
    const gy = 40;
    const gh = h * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(gx - 12, gy, 24, gh);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx - 12, gy, 24, gh);
    const fillH = (temp / 100) * gh;
    const tGrad = ctx.createLinearGradient(0, gy + gh - fillH, 0, gy + gh);
    tGrad.addColorStop(0, '#e74c3c');
    tGrad.addColorStop(1, '#f39c12');
    ctx.fillStyle = tGrad;
    ctx.fillRect(gx - 10, gy + gh - fillH, 20, fillH);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(temp)}°C`, gx, gy - 6);
  }

  getCanvas(): HTMLCanvasElement | null { return this.canvas; }
}

export const canvasRenderer = new CanvasRenderer();
