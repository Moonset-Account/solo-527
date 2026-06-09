import type { NodeId, Wire, WireId } from '@/simulation/types';

let wireIdCounter = 0;

function generateWireId(): WireId {
  wireIdCounter += 1;
  return `wire_${Date.now().toString(36)}_${wireIdCounter.toString(36)}` as WireId;
}

export class WireManager {
  private wires: Map<WireId, Wire>;

  constructor() {
    this.wires = new Map();
  }

  addWire(
    fromNode: NodeId,
    toNode: NodeId,
    pathPoints: { x: number; y: number }[] = []
  ): Wire {
    if (fromNode === toNode) {
      throw new Error('Cannot connect a node to itself');
    }
    const id = generateWireId();
    const wire: Wire = {
      id,
      fromNode,
      toNode,
      pathPoints,
    };
    this.wires.set(id, wire);
    return wire;
  }

  removeWire(id: WireId): boolean {
    return this.wires.delete(id);
  }

  getWire(id: WireId): Wire | undefined {
    return this.wires.get(id);
  }

  getWiresByNode(nodeId: NodeId): Wire[] {
    const result: Wire[] = [];
    for (const wire of this.wires.values()) {
      if (wire.fromNode === nodeId || wire.toNode === nodeId) {
        result.push(wire);
      }
    }
    return result;
  }

  hasWireBetween(fromNode: NodeId, toNode: NodeId): boolean {
    for (const wire of this.wires.values()) {
      const hasDirect =
        (wire.fromNode === fromNode && wire.toNode === toNode) ||
        (wire.fromNode === toNode && wire.toNode === fromNode);
      if (hasDirect) {
        return true;
      }
    }
    return false;
  }

  getAllWires(): Wire[] {
    return Array.from(this.wires.values());
  }

  getWireCount(): number {
    return this.wires.size;
  }

  clear(): void {
    this.wires.clear();
  }

  forEach(callback: (wire: Wire) => void): void {
    this.wires.forEach(callback);
  }

  toArray(): Wire[] {
    return this.getAllWires();
  }

  getWireMap(): Map<WireId, Wire> {
    return new Map(this.wires);
  }
}
