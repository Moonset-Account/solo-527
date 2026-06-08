import { Train as TrainData, TrackNode } from '../data/types.js';
import { TrackNetwork } from './TrackNetwork.js';

export class TrainEntity {
  data: TrainData;
  private network: TrackNetwork;
  sprite?: Phaser.GameObjects.Container;
  private prevNodeId: string = '';

  constructor(data: TrainData, network: TrackNetwork) {
    this.data = { ...data, progress: 0, currentPathIndex: 0, delayAmount: 0, state: 'waiting', misrouted: false };
    this.network = network;
  }

  update(delta: number, gameTime: number, blockedNodeIds?: Set<string>): { arrived: boolean; crashed: boolean; delayed: boolean; atNode: string | null } {
    if (this.data.state !== 'running') return { arrived: false, crashed: false, delayed: false, atNode: null };

    const result = { arrived: false, crashed: false, delayed: false, atNode: null as string | null };
    const speedFactor = this.data.speed * (delta / 1000) / 150;
    this.data.progress += speedFactor;

    const path = this.data.path;
    if (this.data.currentPathIndex >= path.length - 1) {
      this.data.state = 'arrived';
      this.data.progress = 1;
      result.arrived = true;
      return result;
    }

    if (this.data.progress >= 1) {
      this.data.progress = 0;
      const currentNodeId = path[this.data.currentPathIndex];
      const nextIndex = this.data.currentPathIndex + 1;
      const nextNodeId = path[nextIndex];

      const node = this.network.getNode(nextNodeId);
      if (node) {
        result.atNode = nextNodeId;

        if (node.type === 'signal' && this.network.isSignalBlocked(nextNodeId)) {
          this.data.state = 'waiting';
          this.data.progress = 0.95;
          result.delayed = true;
          return result;
        }

        if (node.type === 'platform' && blockedNodeIds && blockedNodeIds.has(nextNodeId)) {
          this.data.state = 'waiting';
          this.data.progress = 0.95;
          result.delayed = true;
          return result;
        }
      }

      const nextNode = this.network.getNode(nextNodeId);
      if (nextNode && this.data.currentPathIndex > 0) {
        const currentNodeId = path[this.data.currentPathIndex];
        const currentNode = this.network.getNode(currentNodeId);
        if (currentNode && currentNode.type === 'junction') {
          const switchTarget = this.network.getSwitchTarget(currentNodeId, this.prevNodeId);
          if (switchTarget && switchTarget !== nextNodeId) {
            this.data.state = 'crashed';
            this.data.misrouted = true;
            result.crashed = true;
            return result;
          }
        }
      }

      this.data.currentPathIndex = nextIndex;
      this.prevNodeId = currentNodeId;

      for (const entry of this.data.schedule) {
        if (entry.nodeId === nextNodeId && entry.action === 'stop') {
          this.data.state = 'waiting';
          const departTime = entry.departureTime;
          if (gameTime < departTime) {
            result.delayed = true;
          }
          return result;
        }
      }
    }

    return result;
  }

  tryResume(gameTime: number, blockedNodeIds?: Set<string>): boolean {
    if (this.data.state !== 'waiting') return false;
    const currentNodeId = this.data.path[this.data.currentPathIndex];
    if (!currentNodeId) return false;

    const node = this.network.getNode(currentNodeId);
    if (node && node.type === 'signal' && this.network.isSignalBlocked(currentNodeId)) {
      return false;
    }

    const nextIdx = this.data.currentPathIndex + 1;
    if (nextIdx < this.data.path.length) {
      const nextNodeId = this.data.path[nextIdx];
      const nextNode = this.network.getNode(nextNodeId);
      if (nextNode && nextNode.type === 'signal' && this.network.isSignalBlocked(nextNodeId)) {
        return false;
      }
      if (nextNode && nextNode.type === 'platform' && blockedNodeIds && blockedNodeIds.has(nextNodeId)) {
        return false;
      }
    }

    for (const entry of this.data.schedule) {
      if (entry.nodeId === currentNodeId && entry.action === 'stop') {
        if (gameTime < entry.departureTime) return false;
      }
    }

    this.data.state = 'running';
    return true;
  }

  getWorldPosition(): { x: number; y: number; angle: number } {
    const path = this.data.path;
    if (path.length === 0) return { x: 0, y: 0, angle: 0 };

    const idx = Math.min(this.data.currentPathIndex, path.length - 1);
    const currentNodePos = this.network.getNodePosition(path[idx]);

    if (this.data.currentPathIndex >= path.length - 1 || !currentNodePos) {
      return currentNodePos ? { x: currentNodePos.x, y: currentNodePos.y, angle: 0 } : { x: 0, y: 0, angle: 0 };
    }

    const nextIdx = Math.min(idx + 1, path.length - 1);
    const nextNodePos = this.network.getNodePosition(path[nextIdx]);

    if (!nextNodePos) return { x: currentNodePos.x, y: currentNodePos.y, angle: 0 };

    const t = this.data.progress;
    const x = currentNodePos.x + (nextNodePos.x - currentNodePos.x) * t;
    const y = currentNodePos.y + (nextNodePos.y - currentNodePos.y) * t;
    const angle = Math.atan2(nextNodePos.y - currentNodePos.y, nextNodePos.x - currentNodePos.x);

    return { x, y, angle };
  }

  crash(): void {
    this.data.state = 'crashed';
  }

  reset(data: TrainData): void {
    this.data = { ...data, progress: 0, currentPathIndex: 0, delayAmount: 0, state: 'waiting', misrouted: false };
    this.prevNodeId = '';
  }
}
