import { TrackNode, TrackEdge } from '../data/types.js';

export class TrackNetwork {
  private nodes: Map<string, TrackNode> = new Map();
  private edges: TrackEdge[] = [];
  private adjacency: Map<string, string[]> = new Map();

  constructor(nodes: TrackNode[], edges: TrackEdge[]) {
    for (const node of nodes) {
      this.nodes.set(node.id, { ...node });
    }
    this.edges = edges.map(e => ({ ...e }));
    this.buildAdjacency();
  }

  private buildAdjacency(): void {
    this.adjacency.clear();
    for (const [id] of this.nodes) {
      this.adjacency.set(id, []);
    }
    for (const edge of this.edges) {
      this.adjacency.get(edge.from)!.push(edge.to);
      this.adjacency.get(edge.to)!.push(edge.from);
    }
  }

  getNode(id: string): TrackNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): TrackNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): TrackEdge[] {
    return this.edges;
  }

  getEdgeBetween(from: string, to: string): TrackEdge | undefined {
    return this.edges.find(e =>
      (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );
  }

  toggleSwitch(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node || node.type !== 'junction') return false;
    const conns = this.adjacency.get(nodeId) || [];
    if (conns.length < 3) return false;
    node.switchState = ((node.switchState ?? 0) + 1) % Math.max(1, conns.length - 1);
    return true;
  }

  getSwitchTarget(nodeId: string, fromNodeId: string): string | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    const conns = this.adjacency.get(nodeId) || [];
    if (conns.length === 0) return null;
    if (node.type !== 'junction' || conns.length <= 2) {
      return conns.find(c => c !== fromNodeId) || conns[0];
    }
    const state = node.switchState ?? 0;
    const filteredConns = conns.filter(c => c !== fromNodeId);
    return filteredConns[state % filteredConns.length] || null;
  }

  toggleSignal(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node || node.type !== 'signal') return false;
    node.signalState = node.signalState === 'red' ? 'green' : 'red';
    return true;
  }

  isSignalBlocked(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node || node.type !== 'signal') return false;
    return node.signalState === 'red';
  }

  findPath(fromId: string, toId: string): string[] | null {
    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[] }[] = [{ nodeId: fromId, path: [fromId] }];
    visited.add(fromId);
    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      if (nodeId === toId) return path;
      const conns = this.adjacency.get(nodeId) || [];
      for (const conn of conns) {
        if (visited.has(conn)) continue;
        visited.add(conn);
        queue.push({ nodeId: conn, path: [...path, conn] });
      }
    }
    return null;
  }

  getNodePosition(nodeId: string): { x: number; y: number } | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    return { x: node.x, y: node.y };
  }

  getConnections(nodeId: string): string[] {
    return this.adjacency.get(nodeId) || [];
  }

  getNodeIdAt(worldX: number, worldY: number, tolerance: number = 30): string | null {
    for (const [id, node] of this.nodes) {
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      if (Math.sqrt(dx * dx + dy * dy) <= tolerance) return id;
    }
    return null;
  }
}
