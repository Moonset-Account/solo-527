export type NodeId = string;
export type ComponentId = string;
export type WireId = string;

export interface Pin {
  nodeId: NodeId;
  localX: number;
  localY: number;
}

export type ComponentType =
  | 'battery'
  | 'resistor'
  | 'capacitor'
  | 'switch'
  | 'bulb'
  | 'wire_joint';

export interface BaseComponent {
  id: ComponentId;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  pins: Pin[];
  params: Record<string, number | boolean>;
  state: Record<string, number | boolean>;
}

export interface Wire {
  id: WireId;
  fromNode: NodeId;
  toNode: NodeId;
  pathPoints: { x: number; y: number }[];
}

export interface CircuitGraph {
  components: Map<ComponentId, BaseComponent>;
  wires: Map<WireId, Wire>;
  nodes: Map<NodeId, { voltage: number; components: Set<ComponentId> }>;
}

export interface SimError {
  type: 'short_circuit' | 'no_power' | 'overload';
  severity: 'warn' | 'error';
  message: string;
  relatedIds: string[];
}

export interface SimState {
  running: boolean;
  time: number;
  nodeVoltages: Map<NodeId, number>;
  componentStates: Map<ComponentId, Record<string, number | boolean>>;
  errors: SimError[];
}

export interface Loop {
  pathComponents: ComponentId[];
  totalResistance: number;
}
