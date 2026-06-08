import { CircuitComponent } from './components';
import { Wire } from './wire';
import { ComponentType, Point } from './config';

export interface CircuitNode {
  id: string;
  pins: { componentId: string; pinIndex: number }[];
  voltage: number;
}

export interface HitResult {
  type: 'component' | 'wire' | 'pin' | 'none';
  id?: string;
  pinIndex?: number;
}

let nodeCounter = 0;

export class CircuitGraph {
  components: Map<string, CircuitComponent>;
  wires: Map<string, Wire>;

  constructor() {
    this.components = new Map();
    this.wires = new Map();
  }

  addComponent(comp: CircuitComponent) {
    this.components.set(comp.id, comp);
  }

  removeComponent(id: string) {
    const wiresToRemove: string[] = [];
    for (const [wireId, wire] of this.wires) {
      if (wire.startPin.componentId === id || wire.endPin.componentId === id) {
        wiresToRemove.push(wireId);
      }
    }
    for (const wireId of wiresToRemove) {
      this.wires.delete(wireId);
    }
    this.components.delete(id);
  }

  addWire(wire: Wire): boolean {
    for (const [, existing] of this.wires) {
      const sameStart =
        existing.startPin.componentId === wire.startPin.componentId &&
        existing.startPin.pinIndex === wire.startPin.pinIndex;
      const sameEnd =
        existing.endPin.componentId === wire.endPin.componentId &&
        existing.endPin.pinIndex === wire.endPin.pinIndex;
      const reverseStart =
        existing.startPin.componentId === wire.endPin.componentId &&
        existing.startPin.pinIndex === wire.endPin.pinIndex;
      const reverseEnd =
        existing.endPin.componentId === wire.startPin.componentId &&
        existing.endPin.pinIndex === wire.startPin.pinIndex;
      if ((sameStart && sameEnd) || (reverseStart && reverseEnd)) {
        return false;
      }
    }
    this.wires.set(wire.id, wire);
    return true;
  }

  removeWire(id: string) {
    this.wires.delete(id);
  }

  getComponent(id: string): CircuitComponent | undefined {
    return this.components.get(id);
  }

  getWire(id: string): Wire | undefined {
    return this.wires.get(id);
  }

  getConnectedPins(componentId: string, pinIndex: number): { componentId: string; pinIndex: number }[] {
    const result: { componentId: string; pinIndex: number }[] = [];
    for (const [, wire] of this.wires) {
      if (wire.startPin.componentId === componentId && wire.startPin.pinIndex === pinIndex) {
        result.push({ componentId: wire.endPin.componentId, pinIndex: wire.endPin.pinIndex });
      } else if (wire.endPin.componentId === componentId && wire.endPin.pinIndex === pinIndex) {
        result.push({ componentId: wire.startPin.componentId, pinIndex: wire.startPin.pinIndex });
      }
    }
    return result;
  }

  getNodes(): CircuitNode[] {
    const pinToNodeId = new Map<string, string>();
    const nodes = new Map<string, { componentId: string; pinIndex: number }[]>();

    const pinKey = (compId: string, pinIdx: number) => `${compId}:${pinIdx}`;

    function ensureNode(compId: string, pinIdx: number): string {
      const key = pinKey(compId, pinIdx);
      if (pinToNodeId.has(key)) return pinToNodeId.get(key)!;
      const nodeId = `node_${++nodeCounter}`;
      pinToNodeId.set(key, nodeId);
      nodes.set(nodeId, [{ componentId: compId, pinIndex: pinIdx }]);
      return nodeId;
    }

    function mergeNodes(idA: string, idB: string) {
      if (idA === idB) return;
      const pinsA = nodes.get(idA)!;
      const pinsB = nodes.get(idB)!;
      for (const p of pinsB) {
        pinToNodeId.set(pinKey(p.componentId, p.pinIndex), idA);
        pinsA.push(p);
      }
      nodes.delete(idB);
    }

    for (const [, wire] of this.wires) {
      const nodeA = ensureNode(wire.startPin.componentId, wire.startPin.pinIndex);
      const nodeB = ensureNode(wire.endPin.componentId, wire.endPin.pinIndex);
      mergeNodes(nodeA, nodeB);
    }

    const result: CircuitNode[] = [];
    for (const [nodeId, pins] of nodes) {
      result.push({ id: nodeId, pins, voltage: 0 });
    }
    return result;
  }

  findPath(fromCompId: string, fromPin: number, toCompId: string, toPin: number): string[] {
    if (fromCompId === toCompId && fromPin === toPin) return [fromCompId];

    const visited = new Set<string>();
    const queue: { compId: string; pinIndex: number; path: string[] }[] = [
      { compId: fromCompId, pinIndex: fromPin, path: [fromCompId] },
    ];
    visited.add(`${fromCompId}:${fromPin}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const connected = this.getConnectedPins(current.compId, current.pinIndex);

      for (const conn of connected) {
        const key = `${conn.componentId}:${conn.pinIndex}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const newPath = [...current.path, conn.componentId];
        if (conn.componentId === toCompId && conn.pinIndex === toPin) {
          return newPath;
        }

        const comp = this.components.get(conn.componentId);
        if (!comp) continue;

        for (let i = 0; i < comp.pins.length; i++) {
          if (i !== conn.pinIndex) {
            const otherKey = `${conn.componentId}:${i}`;
            if (!visited.has(otherKey)) {
              visited.add(otherKey);
              queue.push({ compId: conn.componentId, pinIndex: i, path: newPath });
            }
          }
        }
      }
    }

    return [];
  }

  hitTest(wx: number, wy: number): HitResult {
    for (const [, comp] of this.components) {
      const pin = comp.hitTestPin(wx, wy);
      if (pin) {
        return { type: 'pin', id: comp.id, pinIndex: pin.index };
      }
    }

    for (const [, wire] of this.wires) {
      const startComp = this.components.get(wire.startPin.componentId);
      const endComp = this.components.get(wire.endPin.componentId);
      if (!startComp || !endComp) continue;

      const startPin = startComp.pins[wire.startPin.pinIndex];
      const endPin = endComp.pins[wire.endPin.pinIndex];
      if (!startPin || !endPin) continue;

      startPin.updateWorldPos();
      endPin.updateWorldPos();

      if (wire.hitTest(wx, wy, 8, { x: startPin.worldX, y: startPin.worldY }, { x: endPin.worldX, y: endPin.worldY })) {
        return { type: 'wire', id: wire.id };
      }
    }

    for (const [, comp] of this.components) {
      if (comp.containsPoint(wx, wy)) {
        return { type: 'component', id: comp.id };
      }
    }

    return { type: 'none' };
  }

  clear() {
    this.components.clear();
    this.wires.clear();
  }

  serialize(): object {
    return {
      components: Array.from(this.components.values()).map(c => c.serialize()),
      wires: Array.from(this.wires.values()).map(w => w.serialize()),
    };
  }

  deserialize(data: any) {
    this.clear();
    if (data.components) {
      for (const c of data.components) {
        const comp = CircuitComponent.deserialize(c);
        this.components.set(comp.id, comp);
      }
    }
    if (data.wires) {
      for (const w of data.wires) {
        const wire = Wire.deserialize(w);
        this.wires.set(wire.id, wire);
      }
    }
  }

  getStatistics(): { componentCount: number; wireCount: number; nodeCount: number } {
    return {
      componentCount: this.components.size,
      wireCount: this.wires.size,
      nodeCount: this.getNodes().length,
    };
  }
}

export const circuitGraph = new CircuitGraph();
