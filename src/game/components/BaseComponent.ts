import {
  ComponentInstance,
  ComponentProperties,
  ComponentType,
  Port,
  Vec2,
} from '@/game/types';

export interface PortOffset {
  index: number;
  offset: Vec2;
  label?: string;
}

export abstract class BaseCircuitComponent {
  protected instance: ComponentInstance;

  constructor(instance: ComponentInstance) {
    this.instance = instance;
  }

  abstract getPortLocalOffsets(): PortOffset[];
  abstract getSize(): { w: number; h: number };
  abstract getRenderOutline(canvasCtx: CanvasRenderingContext2D): void;

  getWorldPorts(): { id: string; position: Vec2 }[] {
    const offsets = this.getPortLocalOffsets();
    const { position, rotation } = this.instance;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return offsets.map((p) => {
      const x = p.offset.x * cos - p.offset.y * sin + position.x;
      const y = p.offset.x * sin + p.offset.y * cos + position.y;
      return {
        id: `${this.instance.id}:${p.index}`,
        position: { x, y },
      };
    });
  }

  getProperty<K>(key: string): K {
    return (this.instance.properties as Record<string, any>)[key] as K;
  }

  setProperty(key: string, value: any): void {
    (this.instance.properties as Record<string, any>)[key] = value;
  }

  containsPoint(worldPoint: Vec2): boolean {
    const { position, rotation } = this.instance;
    const { w, h } = this.getSize();

    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const dx = worldPoint.x - position.x;
    const dy = worldPoint.y - position.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    return (
      localX >= -w / 2 && localX <= w / 2 && localY >= -h / 2 && localY <= h / 2
    );
  }

  toJSON(): ComponentInstance {
    return { ...this.instance };
  }

  static generateId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createPorts(componentId: string, offsets: PortOffset[]): Port[] {
    return offsets.map((p) => ({
      id: `${componentId}:${p.index}`,
      componentId,
      localOffset: { ...p.offset },
      label: p.label,
    }));
  }

  static createInstance(
    type: ComponentType,
    position: Vec2,
    rotation: number = 0
  ): ComponentInstance {
    const id = BaseCircuitComponent.generateId();
    let properties: ComponentProperties;
    let dummyOffsets: PortOffset[] = [];

    switch (type) {
      case 'battery':
        properties = { type: 'battery', voltage: 9 };
        dummyOffsets = [
          { index: 0, offset: { x: -40, y: 0 }, label: '-' },
          { index: 1, offset: { x: 40, y: 0 }, label: '+' },
        ];
        break;
      case 'resistor':
        properties = { type: 'resistor', resistance: 100 };
        dummyOffsets = [
          { index: 0, offset: { x: -35, y: 0 } },
          { index: 1, offset: { x: 35, y: 0 } },
        ];
        break;
      case 'capacitor':
        properties = { type: 'capacitor', capacitance: 1000 };
        dummyOffsets = [
          { index: 0, offset: { x: -30, y: 0 } },
          { index: 1, offset: { x: 30, y: 0 } },
        ];
        break;
      case 'switch':
        properties = { type: 'switch', closed: false };
        dummyOffsets = [
          { index: 0, offset: { x: -35, y: 0 } },
          { index: 1, offset: { x: 35, y: 0 } },
        ];
        break;
      case 'bulb':
        properties = { type: 'bulb', resistance: 50, thresholdPower: 0.5 };
        dummyOffsets = [
          { index: 0, offset: { x: -25, y: 0 } },
          { index: 1, offset: { x: 25, y: 0 } },
        ];
        break;
    }

    const ports = BaseCircuitComponent.createPorts(id, dummyOffsets);

    return {
      id,
      type,
      position: { ...position },
      rotation,
      properties,
      ports,
    };
  }
}
