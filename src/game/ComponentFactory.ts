import type { BaseComponent, ComponentId, ComponentType, NodeId, Pin } from '@/simulation/types';

export interface PinLayout {
  localX: number;
  localY: number;
  label?: string;
}

export interface ComponentSpec {
  type: ComponentType;
  displayName: string;
  pins: PinLayout[];
  defaultParams: Record<string, number | boolean>;
}

const COMPONENT_SPECS: Record<ComponentType, ComponentSpec> = {
  battery: {
    type: 'battery',
    displayName: '电池',
    pins: [
      { localX: -30, localY: 0, label: '+' },
      { localX: 30, localY: 0, label: '-' },
    ],
    defaultParams: { voltage: 5 },
  },
  resistor: {
    type: 'resistor',
    displayName: '电阻',
    pins: [
      { localX: -30, localY: 0 },
      { localX: 30, localY: 0 },
    ],
    defaultParams: { resistance: 100 },
  },
  capacitor: {
    type: 'capacitor',
    displayName: '电容',
    pins: [
      { localX: -25, localY: 0 },
      { localX: 25, localY: 0 },
    ],
    defaultParams: { capacitance: 0.01 },
  },
  switch: {
    type: 'switch',
    displayName: '开关',
    pins: [
      { localX: -30, localY: 0 },
      { localX: 30, localY: 0 },
    ],
    defaultParams: { isOn: 0 },
  },
  bulb: {
    type: 'bulb',
    displayName: '灯泡',
    pins: [
      { localX: -25, localY: 0 },
      { localX: 25, localY: 0 },
    ],
    defaultParams: { resistance: 50, Pmax: 1 },
  },
  wire_joint: {
    type: 'wire_joint',
    displayName: '接线柱',
    pins: [
      { localX: -20, localY: 0 },
      { localX: 20, localY: 0 },
      { localX: 0, localY: -20 },
      { localX: 0, localY: 20 },
    ],
    defaultParams: {},
  },
};

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

function rotatePoint(x: number, y: number, rotation: number): { x: number; y: number } {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

export function getComponentSpec(type: ComponentType): ComponentSpec {
  const spec = COMPONENT_SPECS[type];
  if (!spec) {
    throw new Error(`Unknown component type: ${type}`);
  }
  return spec;
}

export function getAllComponentTypes(): ComponentType[] {
  return Object.keys(COMPONENT_SPECS) as ComponentType[];
}

export function createComponent(
  type: ComponentType,
  x: number,
  y: number,
  rotation: number = 0
): BaseComponent {
  const spec = getComponentSpec(type);
  const id = generateId(type) as ComponentId;

  const pins: Pin[] = spec.pins.map((pinLayout) => {
    const rotated = rotatePoint(pinLayout.localX, pinLayout.localY, rotation);
    return {
      nodeId: generateId('node') as NodeId,
      localX: rotated.x,
      localY: rotated.y,
    };
  });

  return {
    id,
    type,
    x,
    y,
    rotation,
    pins,
    params: { ...spec.defaultParams },
    state: {},
  };
}

export function getComponentDisplayName(type: ComponentType): string {
  return getComponentSpec(type).displayName;
}

export function getDefaultParams(type: ComponentType): Record<string, number | boolean> {
  return { ...getComponentSpec(type).defaultParams };
}
