import { TrackNode } from '../data/types.js';
import { TrackNetwork } from './TrackNetwork.js';

export class SignalSystem {
  private network: TrackNetwork;
  private signalNodes: TrackNode[] = [];

  constructor(network: TrackNetwork) {
    this.network = network;
    this.signalNodes = this.network.getAllNodes().filter(n => n.type === 'signal');
  }

  toggleSignal(nodeId: string): boolean {
    return this.network.toggleSignal(nodeId);
  }

  getSignalState(nodeId: string): 'red' | 'green' | null {
    const node = this.network.getNode(nodeId);
    if (!node || node.type !== 'signal') return null;
    return node.signalState ?? 'red';
  }

  isBlocked(nodeId: string): boolean {
    return this.network.isSignalBlocked(nodeId);
  }

  getAllSignals(): { id: string; state: 'red' | 'green' }[] {
    return this.signalNodes.map(n => ({
      id: n.id,
      state: n.signalState ?? 'red',
    }));
  }
}
