import { WireInstance } from './types';

export class WireSystem {
  wires: WireInstance[];

  constructor() {
    this.wires = [];
  }

  private generateId(): string {
    return `wire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addWire(fromPortId: string, toPortId: string): string | null {
    if (fromPortId === toPortId) {
      return null;
    }

    const exists = this.wires.some(
      (w) =>
        (w.fromPortId === fromPortId && w.toPortId === toPortId) ||
        (w.fromPortId === toPortId && w.toPortId === fromPortId)
    );

    if (exists) {
      return null;
    }

    const newWire: WireInstance = {
      id: this.generateId(),
      fromPortId,
      toPortId,
    };

    this.wires.push(newWire);
    return newWire.id;
  }

  removeWire(id: string): boolean {
    const index = this.wires.findIndex((w) => w.id === id);
    if (index !== -1) {
      this.wires.splice(index, 1);
      return true;
    }
    return false;
  }

  removeWiresForComponent(componentId: string): void {
    this.wires = this.wires.filter(
      (w) =>
        !w.fromPortId.startsWith(`${componentId}:`) &&
        !w.toPortId.startsWith(`${componentId}:`)
    );
  }

  getWiresConnectedToPort(portId: string): WireInstance[] {
    return this.wires.filter(
      (w) => w.fromPortId === portId || w.toPortId === portId
    );
  }

  getPortsConnectedToPort(portId: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [portId];
    const connected: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (current !== portId) {
        connected.push(current);
      }

      const connectedWires = this.getWiresConnectedToPort(current);
      for (const wire of connectedWires) {
        const neighbor =
          wire.fromPortId === current ? wire.toPortId : wire.fromPortId;
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    return connected;
  }

  clear(): void {
    this.wires = [];
  }

  toJSON(): WireInstance[] {
    return this.wires.map((w) => ({ ...w }));
  }

  loadJSON(wires: WireInstance[]): void {
    this.wires = wires.map((w) => ({ ...w }));
  }
}
