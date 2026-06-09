import { BaseCircuitComponent } from './components/BaseComponent';
import { Battery } from './components/Battery';
import { Resistor } from './components/Resistor';
import { Capacitor } from './components/Capacitor';
import { Switch } from './components/Switch';
import { Bulb } from './components/Bulb';
import { ComponentInstance, ComponentType, Vec2 } from './types';

export type ComponentCategory = 'source' | 'passive' | 'active' | 'output';

export interface ComponentDefinition {
  class: new (instance: ComponentInstance) => BaseCircuitComponent;
  name: string;
  description: string;
  category: ComponentCategory;
}

export interface GroupedDefinitions {
  source: { type: ComponentType; definition: ComponentDefinition }[];
  passive: { type: ComponentType; definition: ComponentDefinition }[];
  active: { type: ComponentType; definition: ComponentDefinition }[];
  output: { type: ComponentType; definition: ComponentDefinition }[];
}

export class ComponentLibrary {
  private static _instance: ComponentLibrary | null = null;
  private registry: Map<ComponentType, ComponentDefinition>;

  private constructor() {
    this.registry = new Map();
    this.registerAll();
  }

  static getInstance(): ComponentLibrary {
    if (!ComponentLibrary._instance) {
      ComponentLibrary._instance = new ComponentLibrary();
    }
    return ComponentLibrary._instance;
  }

  private registerAll(): void {
    this.register('battery', {
      class: Battery,
      name: '电源',
      description: '提供电压驱动电路',
      category: 'source',
    });

    this.register('resistor', {
      class: Resistor,
      name: '电阻',
      description: '限制电流大小',
      category: 'passive',
    });

    this.register('capacitor', {
      class: Capacitor,
      name: '电容',
      description: '储存和释放电荷',
      category: 'passive',
    });

    this.register('switch', {
      class: Switch,
      name: '开关',
      description: '控制电路通断',
      category: 'active',
    });

    this.register('bulb', {
      class: Bulb,
      name: '灯泡',
      description: '电流足够时点亮',
      category: 'output',
    });
  }

  register(type: ComponentType, definition: ComponentDefinition): void {
    this.registry.set(type, definition);
  }

  getDefinition(type: ComponentType): ComponentDefinition | undefined {
    return this.registry.get(type);
  }

  listDefinitions(): { type: ComponentType; definition: ComponentDefinition }[] {
    const result: { type: ComponentType; definition: ComponentDefinition }[] = [];
    this.registry.forEach((definition, type) => {
      result.push({ type, definition });
    });
    return result;
  }

  listDefinitionsGrouped(): GroupedDefinitions {
    const grouped: GroupedDefinitions = {
      source: [],
      passive: [],
      active: [],
      output: [],
    };

    this.registry.forEach((definition, type) => {
      grouped[definition.category].push({ type, definition });
    });

    return grouped;
  }

  createComponentInstance(
    type: ComponentType,
    position: Vec2,
    rotation: number = 0
  ): ComponentInstance {
    return BaseCircuitComponent.createInstance(type, position, rotation);
  }

  createComponentObject(instance: ComponentInstance): BaseCircuitComponent {
    const definition = this.registry.get(instance.type);
    if (!definition) {
      throw new Error(`Unknown component type: ${instance.type}`);
    }
    const ComponentClass = definition.class as new (
      instance: ComponentInstance
    ) => BaseCircuitComponent;
    return new ComponentClass(instance);
  }
}
