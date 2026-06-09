import type { ComponentType } from '@/simulation/types';

export type ComponentCategory = 'power' | 'passive' | 'active' | 'connection';

export interface ComponentMeta {
  name: string;
  type: ComponentType;
  category: ComponentCategory;
  description: string;
  symbol: string;
  defaultParams: Record<string, number | boolean>;
}

export const COMPONENTS_META: Record<ComponentType, ComponentMeta> = {
  battery: {
    name: '电池',
    type: 'battery',
    category: 'power',
    description: '提供直流电压的电源元件。正极输出电压，负极接地。可调节电压参数。',
    symbol: '⊶',
    defaultParams: { voltage: 5 },
  },
  resistor: {
    name: '电阻',
    type: 'resistor',
    category: 'passive',
    description: '限制电流流动的无源元件。根据欧姆定律 V=IR，可用于分压、限流和调光。',
    symbol: '▭',
    defaultParams: { resistance: 100 },
  },
  capacitor: {
    name: '电容',
    type: 'capacitor',
    category: 'passive',
    description: '储存电荷的无源元件。可用于RC延时电路、滤波和定时应用。',
    symbol: '⊥⊤',
    defaultParams: { capacitance: 0.01 },
  },
  switch: {
    name: '开关',
    type: 'switch',
    category: 'active',
    description: '手动控制电路通断的元件。点击切换开/关状态，控制电流流动。',
    symbol: '⟋',
    defaultParams: { isOn: 0 },
  },
  bulb: {
    name: '灯泡',
    type: 'bulb',
    category: 'passive',
    description: '通过电流加热灯丝发光的元件。亮度随电流变化，超过最大功率会烧毁。',
    symbol: '◉',
    defaultParams: { resistance: 50, Pmax: 1 },
  },
  wire_joint: {
    name: '接线柱',
    type: 'wire_joint',
    category: 'connection',
    description: '四向连接节点。用于复杂布线，可同时连接多根导线，实现导线汇合与分支。',
    symbol: '✦',
    defaultParams: {},
  },
};

export const AVAILABLE_COMPONENTS: ComponentMeta[] = Object.values(COMPONENTS_META);

export function getComponentMeta(type: ComponentType): ComponentMeta {
  return COMPONENTS_META[type];
}

export function getComponentsByCategory(category: ComponentCategory): ComponentMeta[] {
  return AVAILABLE_COMPONENTS.filter((c) => c.category === category);
}

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  power: '电源',
  passive: '无源元件',
  active: '控制元件',
  connection: '连接元件',
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  'power',
  'active',
  'passive',
  'connection',
];
