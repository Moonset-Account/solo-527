import type {
  ComponentInstance,
  ComponentState,
  WireInstance,
  Vec2,
  BatteryProps,
  ResistorProps,
  SwitchProps,
  BulbProps,
  CapacitorProps,
} from '@/game/types';
import { AnimationSystem } from './AnimationSystem';
import { drawRoundRect, drawGlow, lerp, clamp } from './helpers';

const RESISTOR_COLORS: Record<number, string> = {
  0: '#000000',
  1: '#8B4513',
  2: '#FF0000',
  3: '#FF8C00',
  4: '#FFD700',
  5: '#008000',
  6: '#0000FF',
  7: '#9400D3',
  8: '#808080',
  9: '#FFFFFF',
};

export class ComponentRenderer {
  private _selectedId: string | null = null;

  setSelectedId(id: string | null): void {
    this._selectedId = id;
  }

  renderComponent(
    ctx: CanvasRenderingContext2D,
    instance: ComponentInstance,
    state: ComponentState | null,
    animSystem: AnimationSystem,
    worldToScreen: (v: Vec2) => Vec2
  ): void {
    const sp = worldToScreen(instance.position);
    const scale = animSystem.getPlaceScale(instance.id);

    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(instance.rotation);
    ctx.scale(scale, scale);

    switch (instance.type) {
      case 'battery':
        this._renderBattery(ctx, instance, state);
        break;
      case 'resistor':
        this._renderResistor(ctx, instance, state);
        break;
      case 'capacitor':
        this._renderCapacitor(ctx, instance, state);
        break;
      case 'switch':
        this._renderSwitch(ctx, instance, state, animSystem);
        break;
      case 'bulb':
        this._renderBulb(ctx, instance, state, animSystem);
        break;
    }

    ctx.restore();

    if (this._selectedId === instance.id) {
      this._renderSelectionBox(ctx, instance, worldToScreen);
    }
  }

  renderPorts(
    ctx: CanvasRenderingContext2D,
    instance: ComponentInstance,
    hoveredPortId: string | null,
    wiring: boolean,
    worldToScreen: (v: Vec2) => Vec2
  ): void {
    const { position, rotation, ports } = instance;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    for (const port of ports) {
      const worldPos: Vec2 = {
        x: position.x + port.localOffset.x * cos - port.localOffset.y * sin,
        y: position.y + port.localOffset.x * sin + port.localOffset.y * cos,
      };
      const sp = worldToScreen(worldPos);

      const isHovered = hoveredPortId === port.id;
      const baseSize = isHovered ? 6 : 4;
      const highlight = isHovered || wiring;

      if (highlight) {
        drawGlow(
          ctx,
          () => {
            ctx.fillStyle = isHovered ? '#00ff88' : '#00d4ff';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, baseSize + 1, 0, Math.PI * 2);
            ctx.fill();
          },
          isHovered ? 20 : 10,
          isHovered ? 'rgba(0,255,136,0.7)' : 'rgba(0,212,255,0.5)'
        );
      } else {
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, baseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  renderWire(
    ctx: CanvasRenderingContext2D,
    wire: WireInstance,
    pathPoints: Vec2[],
    current: number,
    isError: boolean,
    worldToScreen: (v: Vec2) => Vec2,
    _animSystem: AnimationSystem,
    time: number
  ): void {
    if (pathPoints.length < 2) return;

    const screenPoints = pathPoints.map((p) => worldToScreen(p));

    const baseColor = isError ? '#f87171' : '#00d4ff';
    const glowColor = isError ? 'rgba(248,113,113,0.6)' : 'rgba(0,212,255,0.5)';

    let displayColor = baseColor;
    if (isError) {
      const flash = Math.sin(time * 0.012) * 0.5 + 0.5;
      displayColor = flash > 0.5 ? '#f87171' : '#fca5a5';
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawGlow(
      ctx,
      () => {
        ctx.strokeStyle = displayColor;
        ctx.lineWidth = 3;
        this._strokePath(ctx, screenPoints);
      },
      isError ? 12 : 8,
      glowColor
    );

    if (Math.abs(current) > 0 && !isError) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 5;
      const segments = this._pathSegments(screenPoints);
      for (const seg of segments) {
        const { p1, p2, length } = seg;
        const dots = Math.max(1, Math.floor(length / 30));
        for (let i = 0; i < dots; i++) {
          const t = ((i / dots) + time * 0.0005 * (current >= 0 ? 1 : -1)) % 1;
          const tt = t < 0 ? t + 1 : t;
          const px = lerp(p1.x, p2.x, tt);
          const py = lerp(p1.y, p2.y, tt);
          const alpha = 0.4 + Math.sin(time * 0.005 + i * 0.7) * 0.3;
          ctx.strokeStyle = `rgba(0,212,255,${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    ctx.restore();

    const endpoints = [screenPoints[0], screenPoints[screenPoints.length - 1]];
    for (const ep of endpoints) {
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _strokePath(ctx: CanvasRenderingContext2D, points: Vec2[]): void {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const cpx = (p0.x + p1.x + p2.x) / 3;
      const cpy = (p0.y + p1.y + p2.y) / 3;
      ctx.quadraticCurveTo(cpx, cpy, p2.x, p2.y);
    }
    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    }
    ctx.stroke();
  }

  private _pathSegments(points: Vec2[]): { p1: Vec2; p2: Vec2; length: number }[] {
    const result: { p1: Vec2; p2: Vec2; length: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      result.push({ p1, p2, length });
    }
    return result;
  }

  private _renderSelectionBox(
    ctx: CanvasRenderingContext2D,
    instance: ComponentInstance,
    worldToScreen: (v: Vec2) => Vec2
  ): void {
    const sp = worldToScreen(instance.position);
    const size = this._getComponentSize(instance.type);

    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(instance.rotation);

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    drawRoundRect(ctx, -size.w / 2 - 6, -size.h / 2 - 6, size.w + 12, size.h + 12, 6);
    ctx.stroke();

    ctx.setLineDash([]);
    const corners = [
      { x: -size.w / 2 - 6, y: -size.h / 2 - 6 },
      { x: size.w / 2 + 6, y: -size.h / 2 - 6 },
      { x: -size.w / 2 - 6, y: size.h / 2 + 6 },
      { x: size.w / 2 + 6, y: size.h / 2 + 6 },
    ];
    ctx.fillStyle = '#00d4ff';
    for (const c of corners) {
      ctx.fillRect(c.x - 3, c.y - 3, 6, 6);
    }

    ctx.restore();
  }

  private _getComponentSize(type: string): { w: number; h: number } {
    switch (type) {
      case 'battery':
        return { w: 80, h: 40 };
      case 'resistor':
        return { w: 70, h: 24 };
      case 'capacitor':
        return { w: 60, h: 40 };
      case 'switch':
        return { w: 70, h: 36 };
      case 'bulb':
        return { w: 50, h: 50 };
      default:
        return { w: 40, h: 40 };
    }
  }

  private _renderBattery(
    ctx: CanvasRenderingContext2D,
    instance: ComponentInstance,
    state: ComponentState | null
  ): void {
    const props = instance.properties as BatteryProps;
    const hasVoltage = (state?.voltage ?? 0) !== 0 || props.voltage > 0;

    ctx.save();

    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(-28, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(40, 0);
    ctx.stroke();

    drawRoundRect(ctx, -28, -18, 56, 36, 6);
    const grad = ctx.createLinearGradient(-28, -18, -28, 18);
    grad.addColorStop(0, '#4a5568');
    grad.addColorStop(0.5, '#718096');
    grad.addColorStop(1, '#2d3748');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1a202c';
    ctx.fillRect(-28, -18, 8, 36);

    if (hasVoltage) {
      drawGlow(
        ctx,
        () => {
          ctx.fillStyle = '#00d4ff';
          ctx.fillRect(24, -18, 4, 36);
        },
        10,
        'rgba(0,212,255,0.6)'
      );
    } else {
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(24, -18, 4, 36);
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('-', -22, 0);
    ctx.fillText('+', 16, 0);

    ctx.fillStyle = '#a0aec0';
    ctx.font = '9px monospace';
    ctx.fillText(`${props.voltage}V`, 0, 0);

    ctx.restore();
  }

  private _renderResistor(
    ctx: CanvasRenderingContext2D,
    instance: ComponentInstance,
    _state: ComponentState | null
  ): void {
    const props = instance.properties as ResistorProps;
    const bands = this._getResistorBands(props.resistance);

    ctx.save();

    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.lineTo(-22, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(35, 0);
    ctx.stroke();

    drawRoundRect(ctx, -22, -12, 44, 24, 4);
    const bodyGrad = ctx.createLinearGradient(-22, -12, -22, 12);
    bodyGrad.addColorStop(0, '#d4a574');
    bodyGrad.addColorStop(0.5, '#e8c39e');
    bodyGrad.addColorStop(1, '#b8956a');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;
    ctx.stroke();

    const bandPositions = [-14, -7, 2, 13];
    for (let i = 0; i < bands.length && i < bandPositions.length; i++) {
      ctx.fillStyle = RESISTOR_COLORS[bands[i]] ?? '#000';
      ctx.fillRect(bandPositions[i] - 1.5, -12, 3, 24);
    }

    ctx.restore();
  }

  private _getResistorBands(resistance: number): number[] {
    if (resistance <= 0) return [0, 0, 0];
    const r = Math.round(resistance);
    const str = r.toString();
    if (str.length < 2) {
      return [parseInt(str[0]), 0, 0];
    }
    const d1 = parseInt(str[0]);
    const d2 = parseInt(str[1]);
    const multiplier = Math.max(0, str.length - 2);
    return [d1, d2, multiplier];
  }

  private _renderCapacitor(
    ctx: CanvasRenderingContext2D,
    instance: ComponentInstance,
    state: ComponentState | null
  ): void {
    const props = instance.properties as CapacitorProps;
    const charge = state?.charge ?? 0;
    const chargeRatio = clamp(charge / props.capacitance, 0, 1);

    ctx.save();

    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-8, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();

    ctx.strokeStyle = chargeRatio > 0.1 ? '#f59e0b' : '#718096';
    ctx.lineWidth = 3;
    if (chargeRatio > 0.1) {
      drawGlow(
        ctx,
        () => {
          ctx.beginPath();
          ctx.moveTo(-8, -18);
          ctx.lineTo(-8, 18);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(8, -18);
          ctx.lineTo(8, 18);
          ctx.stroke();
        },
        8,
        'rgba(245,158,11,0.5)'
      );
    } else {
      ctx.beginPath();
      ctx.moveTo(-8, -18);
      ctx.lineTo(-8, 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -18);
      ctx.lineTo(8, 18);
      ctx.stroke();
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('+', -8, -22);

    ctx.fillStyle = '#a0aec0';
    ctx.font = '8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(`${props.capacitance}µF`, 0, 22);

    ctx.restore();
  }

  private _renderSwitch(
    ctx: CanvasRenderingContext2D,
    instance: ComponentInstance,
    _state: ComponentState | null,
    _animSystem: AnimationSystem
  ): void {
    const props = instance.properties as SwitchProps;
    const targetAngle = props.closed ? -0.35 : -1.2;
    const leverAngle = targetAngle;

    ctx.save();

    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.lineTo(-20, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(35, 0);
    ctx.stroke();

    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, -24, -6, 48, 12, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.arc(-20, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.arc(20, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = props.closed ? '#10b981' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.save();
    ctx.translate(-20, 0);
    ctx.rotate(leverAngle);
    if (props.closed) {
      drawGlow(
        ctx,
        () => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(40, 0);
          ctx.stroke();
        },
        8,
        'rgba(16,185,129,0.5)'
      );
    } else {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(40, 0);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = props.closed ? '#10b981' : '#ef4444';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(props.closed ? 'ON' : 'OFF', 0, -14);

    ctx.restore();
  }

  private _renderBulb(
    ctx: CanvasRenderingContext2D,
    instance: ComponentInstance,
    state: ComponentState | null,
    animSystem: AnimationSystem
  ): void {
    const _props = instance.properties as BulbProps;
    const lit = state?.lit ?? false;
    const glowPhase = animSystem.getBulbGlowPhase(instance.id);
    const glowIntensity = lit ? 0.7 + Math.sin(glowPhase * Math.PI * 2) * 0.3 : 0;

    ctx.save();

    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(-14, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(25, 0);
    ctx.stroke();

    if (lit) {
      const glowSize = 28 + glowIntensity * 10;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
      gradient.addColorStop(0, `rgba(255, 220, 100, ${0.9 * glowIntensity})`);
      gradient.addColorStop(0.4, `rgba(255, 180, 50, ${0.5 * glowIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
      ctx.fill();

      drawGlow(
        ctx,
        () => {
          ctx.strokeStyle = `rgba(255, 200, 80, ${glowIntensity})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.stroke();
        },
        25,
        'rgba(255, 180, 50, 0.8)'
      );
    }

    const bulbGrad = ctx.createRadialGradient(-4, -4, 0, 0, 0, 16);
    if (lit) {
      bulbGrad.addColorStop(0, `rgba(255, 240, 200, ${0.5 + glowIntensity * 0.4})`);
      bulbGrad.addColorStop(1, `rgba(255, 200, 80, ${0.2 + glowIntensity * 0.3})`);
    } else {
      bulbGrad.addColorStop(0, 'rgba(200, 210, 220, 0.3)');
      bulbGrad.addColorStop(1, 'rgba(100, 110, 130, 0.2)');
    }
    ctx.fillStyle = bulbGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = lit ? 'rgba(255, 200, 80, 0.8)' : 'rgba(120, 130, 150, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = lit ? `rgba(255, 180, 50, ${glowIntensity})` : '#718096';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-2, 5);
    ctx.lineTo(2, -5);
    ctx.lineTo(6, 4);
    ctx.stroke();

    if (lit) {
      drawGlow(
        ctx,
        () => {
          ctx.fillStyle = `rgba(255, 240, 180, ${glowIntensity})`;
          ctx.beginPath();
          ctx.arc(-2, 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(2, -2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        },
        6,
        'rgba(255, 220, 100, 0.8)'
      );
    }

    ctx.restore();
  }
}
