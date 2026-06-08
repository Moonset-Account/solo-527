import type { EquipmentType, ReactionEffect } from '@/types';

interface LabObject {
  type: EquipmentType;
  x: number;
  y: number;
  width: number;
  height: number;
  liquidLevel: number;
  liquidColor: string;
  isSelected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'bubble' | 'spark' | 'smoke' | 'precipitate';
}

export class LabRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private objects: LabObject[] = [];
  private particles: Particle[] = [];
  private temperature: number = 25;
  private isHeating: boolean = false;
  private isStirring: boolean = false;
  private reactionEffects: ReactionEffect[] = [];
  private animationFrame: number = 0;
  private frameCount: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.render();
  }

  render(): void {
    this.frameCount++;
    this.clear();
    this.drawBackground();
    this.drawTable();

    for (const obj of this.objects) {
      this.drawEquipment(obj);
    }

    this.drawParticles();

    if (this.isHeating) {
      for (const obj of this.objects) {
        if (['beaker', 'flask', 'test_tube'].includes(obj.type)) {
          this.drawFlame(obj.x + obj.width / 2, obj.y + obj.height + 5);
        }
      }
    }

    this.updateReactionEffects();
    this.updateParticles();
    this.animationFrame = requestAnimationFrame(() => this.render());
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  addObject(obj: LabObject): void {
    this.objects.push(obj);
  }

  removeObject(type: EquipmentType): void {
    this.objects = this.objects.filter((o) => o.type !== type);
  }

  clearObjects(): void {
    this.objects = [];
  }

  getObjectAt(x: number, y: number): LabObject | null {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const o = this.objects[i];
      if (x >= o.x && x <= o.x + o.width && y >= o.y && y <= o.y + o.height) {
        return o;
      }
    }
    return null;
  }

  setTemperature(temp: number): void {
    this.temperature = temp;
  }

  setHeating(heating: boolean): void {
    this.isHeating = heating;
  }

  setStirring(stirring: boolean): void {
    this.isStirring = stirring;
  }

  setReactionEffects(effects: ReactionEffect[]): void {
    this.reactionEffects = effects;
  }

  updateLiquid(equipmentType: EquipmentType, level: number, color: string): void {
    const obj = this.objects.find((o) => o.type === equipmentType);
    if (obj) {
      obj.liquidLevel = level;
      obj.liquidColor = color;
    }
  }

  addBubble(x: number, y: number, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const life = 40 + Math.random() * 40;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.8 - Math.random() * 1.5,
        life,
        maxLife: life,
        color: 'rgba(255,255,255,0.8)',
        size: 2 + Math.random() * 3,
        type: 'bubble',
      });
    }
  }

  addSpark(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const life = 20 + Math.random() * 25;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color: '#FFA500',
        size: 1 + Math.random() * 2,
        type: 'spark',
      });
    }
  }

  addSmoke(x: number, y: number, count: number = 4): void {
    for (let i = 0; i < count; i++) {
      const life = 50 + Math.random() * 50;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.5 - Math.random() * 1,
        life,
        maxLife: life,
        color: 'rgba(180,180,180,0.5)',
        size: 3 + Math.random() * 4,
        type: 'smoke',
      });
    }
  }

  addPrecipitate(x: number, y: number, count: number = 6): void {
    for (let i = 0; i < count; i++) {
      const life = 80 + Math.random() * 60;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.3 + Math.random() * 0.5,
        life,
        maxLife: life,
        color: '#B0C4DE',
        size: 1.5 + Math.random() * 2,
        type: 'precipitate',
      });
    }
  }

  updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      switch (p.type) {
        case 'bubble':
          p.vx += (Math.random() - 0.5) * 0.08;
          p.vy *= 0.995;
          break;
        case 'precipitate':
          p.vy += 0.015;
          p.vx *= 0.98;
          break;
        case 'spark':
          p.vy += 0.04;
          p.vx *= 0.96;
          p.vy *= 0.96;
          break;
        case 'smoke':
          p.vy -= 0.005;
          p.size += 0.04;
          p.vx += (Math.random() - 0.5) * 0.04;
          break;
      }
    }
  }

  private setGlow(color: string = '#00FF88', blur: number = 12): void {
    this.ctx.shadowBlur = blur;
    this.ctx.shadowColor = color;
  }

  private strokeOutline(path: Path2D, isSelected: boolean): void {
    const ctx = this.ctx;
    this.setGlow(isSelected ? '#00FFFF' : '#00FF88', isSelected ? 20 : 12);
    ctx.strokeStyle = isSelected ? '#00FFFF' : '#00FF88';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke(path);
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#0A2E36');
    grad.addColorStop(1, '#0D3B46');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawTable(): void {
    const ctx = this.ctx;
    const tableY = this.canvas.height * 0.75;
    const tableH = this.canvas.height * 0.25;

    ctx.save();
    this.setGlow('#2A1A0A', 5);
    const grad = ctx.createLinearGradient(0, tableY, 0, tableY + tableH);
    grad.addColorStop(0, '#3E2723');
    grad.addColorStop(0.3, '#4E342E');
    grad.addColorStop(1, '#3E2723');
    ctx.fillStyle = grad;
    ctx.fillRect(0, tableY, this.canvas.width, tableH);

    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, tableY);
    ctx.lineTo(this.canvas.width, tableY);
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, tableY + 20 + i * 30);
      ctx.lineTo(this.canvas.width, tableY + 25 + i * 30);
      ctx.strokeStyle = `rgba(93,64,55,${0.15 - i * 0.04})`;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBeaker(obj: LabObject): void {
    const ctx = this.ctx;
    const { x, y, width, height } = obj;
    const t = width * 0.08;

    const path = new Path2D();
    path.moveTo(x - 4, y + 5);
    path.lineTo(x + t, y);
    path.lineTo(x + width - t, y);
    path.lineTo(x + width + 4, y + 5);
    path.lineTo(x + width - t * 2, y + height);
    path.lineTo(x + t * 2, y + height);
    path.closePath();

    ctx.save();
    ctx.save();
    ctx.clip(path);
    this.drawLiquid(obj);
    ctx.restore();

    this.strokeOutline(path, obj.isSelected);
    ctx.restore();
  }

  private drawFlask(obj: LabObject): void {
    const ctx = this.ctx;
    const { x, y, width, height } = obj;
    const neckW = width * 0.25;
    const neckH = height * 0.3;
    const bodyTop = y + neckH;
    const cx = x + width / 2;

    const path = new Path2D();
    path.moveTo(cx - neckW / 2, y);
    path.lineTo(cx + neckW / 2, y);
    path.lineTo(cx + neckW / 2, bodyTop);
    path.lineTo(x + width, y + height);
    path.lineTo(x, y + height);
    path.lineTo(cx - neckW / 2, bodyTop);
    path.closePath();

    ctx.save();
    ctx.save();
    ctx.clip(path);
    this.drawLiquid(obj);
    ctx.restore();

    this.strokeOutline(path, obj.isSelected);
    ctx.restore();
  }

  private drawTestTube(obj: LabObject): void {
    const ctx = this.ctx;
    const { x, y, width, height } = obj;
    const r = width / 2;

    const path = new Path2D();
    path.moveTo(x, y);
    path.lineTo(x, y + height - r);
    path.arc(x + r, y + height - r, r, Math.PI, 0, false);
    path.lineTo(x + width, y);
    path.closePath();

    ctx.save();
    ctx.save();
    ctx.clip(path);
    this.drawLiquid(obj);
    ctx.restore();

    this.strokeOutline(path, obj.isSelected);

    ctx.beginPath();
    path.moveTo(x - 2, y - 3);
    ctx.lineTo(x + width + 2, y - 3);
    this.setGlow('#00FF88', 6);
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawAlcoholLamp(obj: LabObject): void {
    const ctx = this.ctx;
    const { x, y, width, height } = obj;
    const cx = x + width / 2;
    const bodyH = height * 0.55;
    const bodyY = y + height - bodyH;

    const path = new Path2D();
    path.ellipse(cx, bodyY, width / 2, height * 0.1, 0, Math.PI, 0, true);
    path.lineTo(x + width * 0.85, bodyY + bodyH);
    path.ellipse(cx, bodyY + bodyH, width * 0.35, height * 0.06, 0, 0, Math.PI, false);
    path.lineTo(x + width * 0.15, bodyY);
    path.closePath();

    ctx.save();
    this.setGlow('#FF8C00', 5);
    const grad = ctx.createLinearGradient(x, bodyY, x, bodyY + bodyH);
    grad.addColorStop(0, '#6B3A2A');
    grad.addColorStop(1, '#8B4513');
    ctx.fillStyle = grad;
    ctx.fill(path);
    this.strokeOutline(path, obj.isSelected);

    const wickW = 3;
    const wickH = height * 0.2;
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - wickW / 2, bodyY - wickH, wickW, wickH);
    this.setGlow('#00FF88', 4);
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - wickW / 2, bodyY - wickH, wickW, wickH);

    if (this.isHeating) {
      this.drawFlame(cx, bodyY - wickH);
    }
    ctx.restore();
  }

  private drawThermometer(obj: LabObject): void {
    const ctx = this.ctx;
    const { x, y, width, height } = obj;
    const cx = x + width / 2;
    const tubeW = width * 0.2;
    const bulbR = width * 0.3;

    ctx.save();
    const path = new Path2D();
    path.moveTo(cx - tubeW / 2, y);
    path.lineTo(cx + tubeW / 2, y);
    path.lineTo(cx + tubeW / 2, y + height - bulbR * 2);
    path.arc(cx, y + height - bulbR, bulbR, 0, Math.PI * 2);
    path.moveTo(cx + tubeW / 2, y + height - bulbR * 2);
    path.lineTo(cx - tubeW / 2, y + height - bulbR * 2);
    path.lineTo(cx - tubeW / 2, y);
    path.closePath();

    this.strokeOutline(path, obj.isSelected);

    const mercuryRatio = Math.min(1, Math.max(0, (this.temperature + 20) / 140));
    const mercuryH = (height - bulbR * 2.5) * mercuryRatio;
    const mercuryY = y + height - bulbR * 1.5 - mercuryH;
    const mercuryColor = this.temperature > 50 ? '#FF4444' : this.temperature < 0 ? '#4488FF' : '#FF6666';

    ctx.fillStyle = mercuryColor;
    this.setGlow(mercuryColor, 6);
    ctx.fillRect(cx - tubeW / 4, mercuryY, tubeW / 2, mercuryH + bulbR);

    ctx.beginPath();
    ctx.arc(cx, y + height - bulbR, bulbR * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = mercuryColor;
    ctx.fill();

    for (let i = 0; i <= 5; i++) {
      const markY = y + 5 + ((height - bulbR * 2.5 - 10) / 5) * i;
      ctx.beginPath();
      ctx.moveTo(cx + tubeW / 2 + 2, markY);
      ctx.lineTo(cx + tubeW / 2 + 6, markY);
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 3;
      ctx.shadowColor = '#00FF88';
      ctx.stroke();
    }

    ctx.fillStyle = '#00FF88';
    ctx.font = '9px monospace';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#00FF88';
    ctx.fillText(`${Math.round(this.temperature)}°`, cx + tubeW / 2 + 8, y + 15);
    ctx.restore();
  }

  private drawStirringRod(obj: LabObject): void {
    const ctx = this.ctx;
    const { x, y, width, height } = obj;
    const rodW = width * 0.12;
    const angle = this.isStirring ? Math.sin(this.frameCount * 0.1) * 0.08 : 0;

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(angle);

    const path = new Path2D();
    path.rect(-rodW / 2, -height / 2, rodW, height);
    this.strokeOutline(path, obj.isSelected);

    ctx.beginPath();
    ctx.arc(0, -height / 2, rodW / 2 + 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,136,0.2)';
    ctx.fill();
    ctx.restore();
  }

  private drawDropper(obj: LabObject): void {
    const ctx = this.ctx;
    const { x, y, width, height } = obj;
    const cx = x + width / 2;
    const tubeW = width * 0.15;
    const tubeH = height * 0.6;
    const bulbH = height * 0.25;

    ctx.save();
    const path = new Path2D();
    path.moveTo(cx - tubeW / 2, y + bulbH);
    path.lineTo(cx + tubeW / 2, y + bulbH);
    path.lineTo(cx + tubeW / 2, y + bulbH + tubeH);
    path.lineTo(cx + tubeW * 0.3, y + bulbH + tubeH + 8);
    path.lineTo(cx - tubeW * 0.3, y + bulbH + tubeH + 8);
    path.lineTo(cx - tubeW / 2, y + bulbH + tubeH);
    path.closePath();

    this.strokeOutline(path, obj.isSelected);

    ctx.beginPath();
    ctx.ellipse(cx, y + bulbH * 0.55, width * 0.35, bulbH * 0.55, 0, 0, Math.PI * 2);
    this.setGlow('#B06030', 6);
    ctx.fillStyle = '#8B4020';
    ctx.fill();
    ctx.strokeStyle = '#D07040';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (obj.liquidLevel > 0) {
      ctx.fillStyle = obj.liquidColor;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(cx - tubeW / 4, y + bulbH + 5, tubeW / 2, tubeH * obj.liquidLevel);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private drawGraduatedCylinder(obj: LabObject): void {
    const ctx = this.ctx;
    const { x, y, width, height } = obj;
    const wallT = width * 0.08;

    const path = new Path2D();
    path.moveTo(x, y);
    path.lineTo(x, y + height);
    path.lineTo(x + width, y + height);
    path.lineTo(x + width, y);
    path.closePath();

    ctx.save();
    ctx.save();
    ctx.clip(path);
    this.drawLiquid(obj);
    ctx.restore();

    this.strokeOutline(path, obj.isSelected);

    const markCount = 10;
    for (let i = 1; i < markCount; i++) {
      const markY = y + (height / markCount) * i;
      const markLen = i % 5 === 0 ? width * 0.4 : width * 0.2;
      ctx.beginPath();
      ctx.moveTo(x + wallT, markY);
      ctx.lineTo(x + wallT + markLen, markY);
      ctx.strokeStyle = 'rgba(0,255,136,0.4)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 2;
      ctx.shadowColor = '#00FF88';
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,255,136,0.6)';
    ctx.font = '8px monospace';
    ctx.shadowBlur = 3;
    ctx.shadowColor = '#00FF88';
    for (let i = 0; i <= 2; i++) {
      const val = 100 - i * 50;
      const my = y + 5 + (height / markCount) * i * 5;
      ctx.fillText(`${val}`, x + width + 3, my + 3);
    }
    ctx.restore();
  }

  private drawEquipment(obj: LabObject): void {
    const ctx = this.ctx;
    ctx.save();

    switch (obj.type) {
      case 'beaker':
        this.drawBeaker(obj);
        break;
      case 'flask':
        this.drawFlask(obj);
        break;
      case 'test_tube':
        this.drawTestTube(obj);
        break;
      case 'alcohol_lamp':
        this.drawAlcoholLamp(obj);
        break;
      case 'thermometer':
        this.drawThermometer(obj);
        break;
      case 'stirring_rod':
        this.drawStirringRod(obj);
        break;
      case 'dropper':
        this.drawDropper(obj);
        break;
      case 'graduated_cylinder':
        this.drawGraduatedCylinder(obj);
        break;
      default: {
        const path = new Path2D();
        path.rect(obj.x, obj.y, obj.width, obj.height);
        this.strokeOutline(path, obj.isSelected);
        break;
      }
    }

    ctx.restore();
  }

  private drawLiquid(obj: LabObject): void {
    if (obj.liquidLevel <= 0) return;

    const ctx = this.ctx;
    const { x, y, width, height, liquidLevel, liquidColor } = obj;
    const liquidH = height * liquidLevel;
    const surfaceY = y + height - liquidH;

    ctx.save();
    ctx.fillStyle = liquidColor;
    ctx.globalAlpha = 0.45;
    this.setGlow(liquidColor, 6);
    ctx.fillRect(x - 5, surfaceY, width + 10, liquidH + 5);

    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(x - 5, surfaceY);
    for (let px = x - 5; px <= x + width + 5; px++) {
      const wave = Math.sin((px + this.frameCount * 1.5) * 0.08) * 1.5;
      ctx.lineTo(px, surfaceY + wave);
    }
    ctx.lineTo(x + width + 5, surfaceY + 5);
    ctx.lineTo(x - 5, surfaceY + 5);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    if (this.isStirring) {
      const swirl = Math.sin(this.frameCount * 0.12) * 3;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.ellipse(x + width / 2 + swirl, surfaceY + liquidH * 0.5, width * 0.3, liquidH * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawParticles(): void {
    const ctx = this.ctx;

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      this.setGlow(p.color, 8);

      if (p.type === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawFlame(x: number, y: number): void {
    const ctx = this.ctx;
    const f1 = Math.sin(this.frameCount * 0.2) * 3;
    const f2 = Math.cos(this.frameCount * 0.15) * 2;
    const f3 = Math.sin(this.frameCount * 0.3) * 1.5;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.quadraticCurveTo(x - 8 + f2, y - 18, x + f1, y - 30 + f3);
    ctx.quadraticCurveTo(x + 8 - f2, y - 18, x + 10, y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,100,0,0.7)';
    this.setGlow('#FF6600', 25);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.quadraticCurveTo(x - 4 + f2 * 0.5, y - 12, x + f3 * 0.5, y - 20 + f1 * 0.4);
    ctx.quadraticCurveTo(x + 4 - f2 * 0.5, y - 12, x + 5, y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,220,50,0.8)';
    this.setGlow('#FFDD00', 15);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.quadraticCurveTo(x - 1, y - 6, x, y - 10 + f3 * 0.3);
    ctx.quadraticCurveTo(x + 1, y - 6, x + 2, y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    this.setGlow('#CCDDFF', 8);
    ctx.fill();

    ctx.restore();
  }

  private updateReactionEffects(): void {
    if (this.reactionEffects.length === 0 || this.objects.length === 0) return;

    for (const obj of this.objects) {
      if (obj.liquidLevel <= 0) continue;
      const cx = obj.x + obj.width / 2;
      const liqTop = obj.y + obj.height * (1 - obj.liquidLevel);

      if (
        (this.reactionEffects.includes('bubble') || this.reactionEffects.includes('gas_release')) &&
        this.frameCount % 8 === 0
      ) {
        this.addBubble(cx, liqTop, 2);
      }

      if (this.reactionEffects.includes('precipitate') && this.frameCount % 12 === 0) {
        this.addPrecipitate(cx, liqTop, 3);
      }

      if (this.reactionEffects.includes('heat_release') && this.frameCount % 20 === 0) {
        this.addSmoke(cx, obj.y - 5, 1);
      }

      if (this.reactionEffects.includes('heat_absorb') && this.frameCount % 25 === 0) {
        this.addSmoke(cx, obj.y - 5, 1);
      }

      if (this.reactionEffects.includes('flammable') && this.frameCount % 5 === 0) {
        this.addSpark(cx, liqTop, 2);
      }

      if (this.reactionEffects.includes('crystallize') && this.frameCount % 15 === 0) {
        this.addSpark(cx, liqTop + 10, 3);
      }
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.objects = [];
    this.particles = [];
    this.reactionEffects = [];
  }
}
