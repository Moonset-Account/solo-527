import {
  ComponentType,
  ComponentConfig,
  PinInfo,
  COMPONENT_CONFIGS,
  APP_CONFIG,
} from './config';

let componentCounter = 0;

export class Pin {
  id: string;
  localX: number;
  localY: number;
  worldX: number;
  worldY: number;
  label: string;
  connected: boolean;
  component: CircuitComponent;
  index: number;

  constructor(component: CircuitComponent, index: number, info: PinInfo) {
    this.component = component;
    this.index = index;
    this.id = `${component.id}_pin_${index}`;
    this.localX = info.x;
    this.localY = info.y;
    this.label = info.label;
    this.connected = false;
    this.worldX = 0;
    this.worldY = 0;
    this.updateWorldPos();
  }

  updateWorldPos() {
    const comp = this.component;
    const cx = comp.config.width / 2;
    const cy = comp.config.height / 2;
    const rx = this.localX - cx;
    const ry = this.localY - cy;
    const rad = (comp.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    this.worldX = comp.x + rx * cos - ry * sin;
    this.worldY = comp.y + rx * sin + ry * cos;
  }
}

export class CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  value: number;
  state: any;
  pins: Pin[];
  selected: boolean;
  hovered: boolean;
  config: ComponentConfig;

  constructor(type: ComponentType, x: number, y: number, value?: number) {
    const cfg = COMPONENT_CONFIGS[type];
    this.config = cfg;
    this.id = `comp_${type}_${++componentCounter}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.value = value ?? cfg.defaultValue;
    this.selected = false;
    this.hovered = false;

    switch (type) {
      case ComponentType.Switch:
        this.state = { closed: false };
        break;
      case ComponentType.Bulb:
        this.state = { brightness: 0 };
        break;
      case ComponentType.Capacitor:
        this.state = { charge: 0 };
        break;
      default:
        this.state = {};
    }

    this.pins = cfg.pins.map((info, i) => new Pin(this, i, info));
  }

  getPins(): Pin[] {
    for (const pin of this.pins) {
      pin.updateWorldPos();
    }
    return this.pins;
  }

  rotate(deg: number = 90) {
    this.rotation = (this.rotation + deg) % 360;
    if (this.rotation < 0) this.rotation += 360;
    for (const pin of this.pins) {
      pin.updateWorldPos();
    }
  }

  containsPoint(wx: number, wy: number): boolean {
    const rad = (-this.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = wx - this.x;
    const dy = wy - this.y;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const hw = this.config.width / 2;
    const hh = this.config.height / 2;
    return lx >= -hw && lx <= hw && ly >= -hh && ly <= hh;
  }

  hitTestPin(wx: number, wy: number, radius: number = APP_CONFIG.PIN_RADIUS * 2): Pin | null {
    for (const pin of this.getPins()) {
      const dx = wx - pin.worldX;
      const dy = wy - pin.worldY;
      if (dx * dx + dy * dy <= radius * radius) {
        return pin;
      }
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);

    if (this.selected) {
      ctx.shadowColor = APP_CONFIG.SELECTED_COLOR;
      ctx.shadowBlur = 12;
    }
    if (this.hovered) {
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.9;
    }

    switch (this.type) {
      case ComponentType.Resistor:
        this.drawResistor(ctx);
        break;
      case ComponentType.Capacitor:
        this.drawCapacitor(ctx);
        break;
      case ComponentType.Switch:
        this.drawSwitch(ctx);
        break;
      case ComponentType.Bulb:
        this.drawBulb(ctx);
        break;
      case ComponentType.Battery:
        this.drawBattery(ctx);
        break;
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    this.drawPins(ctx);
    this.drawValueLabel(ctx);

    if (this.selected) {
      this.drawSelectionBorder(ctx);
    }

    ctx.restore();
  }

  private drawPins(ctx: CanvasRenderingContext2D) {
    const cx = this.config.width / 2;
    const cy = this.config.height / 2;
    for (const pin of this.pins) {
      const px = pin.localX - cx;
      const py = pin.localY - cy;
      ctx.beginPath();
      ctx.arc(px, py, APP_CONFIG.PIN_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = pin.connected ? APP_CONFIG.WIRE_COLOR : APP_CONFIG.PIN_COLOR;
      ctx.fill();
      ctx.strokeStyle = '#ffffff44';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private drawValueLabel(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.rotate((-this.rotation * Math.PI) / 180);
    ctx.font = '11px monospace';
    ctx.fillStyle = APP_CONFIG.COMPONENT_TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.getValueLabel(), 0, this.config.height / 2 + 6);
    ctx.restore();
  }

  private drawSelectionBorder(ctx: CanvasRenderingContext2D) {
    const hw = this.config.width / 2 + 4;
    const hh = this.config.height / 2 + 4;
    ctx.strokeStyle = APP_CONFIG.SELECTED_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ctx.setLineDash([]);
  }

  private drawResistor(ctx: CanvasRenderingContext2D) {
    const hw = this.config.width / 2;
    const color = '#4488ff';

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    const zigStart = -hw + 12;
    const zigEnd = hw - 12;
    ctx.lineTo(zigStart, 0);

    const segLen = (zigEnd - zigStart) / 12;
    const amp = 8;
    for (let i = 0; i < 6; i++) {
      const x0 = zigStart + segLen * (i * 2);
      const x1 = zigStart + segLen * (i * 2 + 1);
      const x2 = zigStart + segLen * (i * 2 + 2);
      ctx.lineTo((x0 + x1) / 2, -amp);
      ctx.lineTo((x1 + x2) / 2, amp);
    }
    ctx.lineTo(zigEnd, 0);
    ctx.lineTo(hw, 0);
    ctx.stroke();
  }

  private drawCapacitor(ctx: CanvasRenderingContext2D) {
    const hw = this.config.width / 2;
    const hh = this.config.height / 2;
    const color = '#44cc66';
    const plateH = hh - 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(-4, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(hw, 0);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, -plateH);
    ctx.lineTo(-4, plateH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, -plateH);
    ctx.lineTo(4, plateH);
    ctx.stroke();

    const charge = this.state?.charge ?? 0;
    if (charge > 0) {
      ctx.fillStyle = `rgba(68, 204, 102, ${charge * 0.3})`;
      ctx.fillRect(-3, -plateH + 1, 6, plateH * 2 - 2);
    }
  }

  private drawSwitch(ctx: CanvasRenderingContext2D) {
    const hw = this.config.width / 2;
    const color = '#ff8844';

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(-10, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(hw, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-10, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(10, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    const closed = this.state?.closed ?? false;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    if (closed) {
      ctx.lineTo(10, 0);
    } else {
      ctx.lineTo(6, -16);
    }
    ctx.stroke();
  }

  private drawBulb(ctx: CanvasRenderingContext2D) {
    const hw = this.config.width / 2;
    const r = Math.min(hw, this.config.height / 2) - 4;
    const brightness = this.state?.brightness ?? 0;

    if (brightness > 0) {
      const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2);
      glow.addColorStop(0, `rgba(255, 255, 100, ${brightness * 0.5})`);
      glow.addColorStop(1, 'rgba(255, 255, 100, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
    }

    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    if (brightness > 0) {
      ctx.fillStyle = `rgba(255, 255, 100, ${brightness * 0.6})`;
      ctx.fill();
    }
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.6);
    ctx.lineTo(r * 0.6, r * 0.6);
    ctx.moveTo(r * 0.6, -r * 0.6);
    ctx.lineTo(-r * 0.6, r * 0.6);
    ctx.stroke();

    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(-r, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(hw, 0);
    ctx.stroke();
  }

  private drawBattery(ctx: CanvasRenderingContext2D) {
    const hw = this.config.width / 2;
    const hh = this.config.height / 2;
    const color = '#ff4455';

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(-8, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(hw, 0);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -hh + 4);
    ctx.lineTo(-8, hh - 4);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-3, -hh + 8);
    ctx.lineTo(-3, hh - 8);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(3, -hh + 4);
    ctx.lineTo(3, hh - 4);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, -hh + 8);
    ctx.lineTo(8, hh - 8);
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', 15, -6);
    ctx.fillText('−', -15, -6);
  }

  getValueLabel(): string {
    switch (this.type) {
      case ComponentType.Resistor:
        return `${this.value}Ω`;
      case ComponentType.Capacitor:
        return `${this.value}μF`;
      case ComponentType.Battery:
        return `${this.value}V`;
      case ComponentType.Switch:
        return this.state?.closed ? '闭合' : '断开';
      case ComponentType.Bulb:
        return `${this.value}W`;
      default:
        return `${this.value}`;
    }
  }

  serialize(): object {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      value: this.value,
      state: this.state,
    };
  }

  static deserialize(data: any): CircuitComponent {
    const comp = new CircuitComponent(data.type, data.x, data.y, data.value);
    comp.id = data.id;
    comp.rotation = data.rotation ?? 0;
    comp.state = data.state ?? comp.state;
    for (const pin of comp.pins) {
      pin.updateWorldPos();
    }
    return comp;
  }
}

export const ComponentFactory = {
  create(type: ComponentType, x: number, y: number, value?: number): CircuitComponent {
    return new CircuitComponent(type, x, y, value);
  },

  createFromConfig(config: ComponentConfig, x: number, y: number, value?: number): CircuitComponent {
    return new CircuitComponent(config.type, x, y, value);
  },
};
