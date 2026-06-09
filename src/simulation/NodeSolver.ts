import { NodeId, CircuitGraph } from './types';

export class UnionFind {
  private parent: Map<NodeId, NodeId>;
  private rank: Map<NodeId, number>;

  constructor() {
    this.parent = new Map();
    this.rank = new Map();
  }

  makeSet(nodeId: NodeId): void {
    if (!this.parent.has(nodeId)) {
      this.parent.set(nodeId, nodeId);
      this.rank.set(nodeId, 0);
    }
  }

  find(nodeId: NodeId): NodeId {
    this.makeSet(nodeId);
    let root = this.parent.get(nodeId)!;
    while (root !== this.parent.get(root)) {
      this.parent.set(root, this.parent.get(this.parent.get(root)!)!);
      root = this.parent.get(root)!;
    }
    this.parent.set(nodeId, root);
    return root;
  }

  union(a: NodeId, b: NodeId): NodeId {
    const rootA = this.find(a);
    const rootB = this.find(b);

    if (rootA === rootB) return rootA;

    const rankA = this.rank.get(rootA)!;
    const rankB = this.rank.get(rootB)!;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
      return rootB;
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
      return rootA;
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
      return rootA;
    }
  }

  reset(): void {
    this.parent.clear();
    this.rank.clear();
  }

  getGroups(): Map<NodeId, NodeId[]> {
    const groups = new Map<NodeId, NodeId[]>();
    for (const nodeId of this.parent.keys()) {
      const root = this.find(nodeId);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root)!.push(nodeId);
    }
    return groups;
  }
}

export function buildNodeGroups(graph: CircuitGraph): Map<NodeId, NodeId> {
  const uf = new UnionFind();

  for (const nodeId of graph.nodes.keys()) {
    uf.makeSet(nodeId);
  }

  for (const component of graph.components.values()) {
    if (component.type === 'switch' && component.state.closed) {
      if (component.pins.length >= 2) {
        uf.union(component.pins[0].nodeId, component.pins[1].nodeId);
      }
    } else if (component.type === 'wire_joint') {
      const pinIds = component.pins.map(p => p.nodeId);
      for (let i = 1; i < pinIds.length; i++) {
        uf.union(pinIds[0], pinIds[i]);
      }
    }
  }

  for (const wire of graph.wires.values()) {
    uf.union(wire.fromNode, wire.toNode);
  }

  const nodeGroups = new Map<NodeId, NodeId>();
  for (const nodeId of graph.nodes.keys()) {
    nodeGroups.set(nodeId, uf.find(nodeId));
  }
  return nodeGroups;
}
