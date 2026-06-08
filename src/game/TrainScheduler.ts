import { Train as TrainData, Conflict } from '../data/types.js';
import { TrackNetwork } from './TrackNetwork.js';
import { TrainEntity } from './Train.js';

export class TrainScheduler {
  private network: TrackNetwork;
  private trains: TrainEntity[] = [];
  private gameTime: number = 0;
  private conflicts: Conflict[] = [];
  private previousDelayState: Map<string, boolean> = new Map();

  constructor(network: TrackNetwork) {
    this.network = network;
  }

  init(trainsData: TrainData[]): void {
    this.trains = [];
    this.conflicts = [];
    this.gameTime = 0;
    this.previousDelayState.clear();
    for (const td of trainsData) {
      this.trains.push(new TrainEntity(td, this.network));
      this.previousDelayState.set(td.id, false);
    }
  }

  update(delta: number): Conflict[] {
    this.gameTime += delta / 1000;
    const newConflicts: Conflict[] = [];

    this.resumeByPriority();

    for (const train of this.trains) {
      if (train.data.state === 'waiting') {
        const shouldStart = train.data.schedule[0]?.arrivalTime ?? Infinity;
        if (this.gameTime >= shouldStart && train.data.currentPathIndex === 0 && train.data.progress === 0) {
          train.data.state = 'running';
        }
      }

      const result = train.update(delta, this.gameTime);
      if (result.atNode) {
        newConflicts.push(...this.checkConflictsAtNode(train, result.atNode));
      }
    }

    newConflicts.push(...this.checkSameTrackConflicts());
    newConflicts.push(...this.checkDelayChainConflicts());
    this.conflicts.push(...newConflicts);
    return newConflicts;
  }

  private resumeByPriority(): void {
    const waitingTrains = this.trains.filter(t => t.data.state === 'waiting');
    if (waitingTrains.length === 0) return;

    const trainsByLocation = new Map<string, TrainEntity[]>();
    for (const train of waitingTrains) {
      const currentNodeId = train.data.path[train.data.currentPathIndex];
      if (!currentNodeId) continue;
      const node = this.network.getNode(currentNodeId);
      if (!node) continue;

      let locationKey: string;
      if (node.type === 'signal') {
        const conns = this.network.getConnections(currentNodeId);
        locationKey = conns.length > 0 ? conns[0] : currentNodeId;
      } else if (node.type === 'platform') {
        locationKey = node.platformId ?? currentNodeId;
      } else {
        continue;
      }

      if (!trainsByLocation.has(locationKey)) {
        trainsByLocation.set(locationKey, []);
      }
      trainsByLocation.get(locationKey)!.push(train);
    }

    for (const [, trainsAtLocation] of trainsByLocation) {
      if (trainsAtLocation.length <= 1) {
        trainsAtLocation[0].tryResume(this.gameTime);
        continue;
      }

      trainsAtLocation.sort((a, b) => b.data.priority - a.data.priority);

      const highest = trainsAtLocation[0];
      if (highest.tryResume(this.gameTime)) {
        for (let i = 1; i < trainsAtLocation.length; i++) {
          const blocked = trainsAtLocation[i];
          const currentNodeId = blocked.data.path[blocked.data.currentPathIndex];
          const node = this.network.getNode(currentNodeId);
          if (node && node.type === 'signal' && !this.network.isSignalBlocked(currentNodeId)) {
            continue;
          }
        }
      }
    }

    for (const train of waitingTrains) {
      if (train.data.state === 'waiting') {
        train.tryResume(this.gameTime);
      }
    }
  }

  private checkDelayChainConflicts(): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const train of this.trains) {
      const isCurrentlyDelayed = train.data.state === 'waiting' && train.data.currentPathIndex > 0;
      const wasPreviouslyDelayed = this.previousDelayState.get(train.data.id) ?? false;
      this.previousDelayState.set(train.data.id, isCurrentlyDelayed);

      if (isCurrentlyDelayed && !wasPreviouslyDelayed) {
        const currentNodeId = train.data.path[train.data.currentPathIndex];
        if (!currentNodeId) continue;

        const blocker = this.findBlockerForTrain(train);
        if (blocker) {
          const currentNode = this.network.getNode(currentNodeId);
          const locationDesc = currentNode
            ? (currentNode.type === 'platform' ? `站台${currentNode.platformId ?? currentNode.id}` : `节点${currentNodeId}`)
            : currentNodeId;

          conflicts.push({
            type: 'delay_chain',
            severity: 'warning',
            trains: [train.data.id, blocker.data.id],
            location: currentNodeId,
            time: this.gameTime,
            message: `${train.data.name} 因 ${blocker.data.name} 占用${locationDesc}而晚点`,
          });
        }
      }
    }

    return conflicts;
  }

  private findBlockerForTrain(train: TrainEntity): TrainEntity | null {
    const currentNodeId = train.data.path[train.data.currentPathIndex];
    if (!currentNodeId) return null;

    const node = this.network.getNode(currentNodeId);
    if (!node) return null;

    if (node.type === 'platform') {
      for (const other of this.trains) {
        if (other.data.id === train.data.id) continue;
        if (other.data.state !== 'running' && other.data.state !== 'waiting') continue;
        const otherNodeId = other.data.path[other.data.currentPathIndex];
        if (otherNodeId === currentNodeId) {
          return other;
        }
      }
    }

    if (node.type === 'signal') {
      const blockedEdge = this.getBlockedEdge(train);
      if (blockedEdge) {
        for (const other of this.trains) {
          if (other.data.id === train.data.id) continue;
          if (other.data.state !== 'running' && other.data.state !== 'waiting') continue;
          const otherEdge = this.getTrainCurrentEdge(other);
          if (otherEdge === blockedEdge) {
            return other;
          }
        }
      }
    }

    return null;
  }

  private getBlockedEdge(train: TrainEntity): string | null {
    const path = train.data.path;
    const idx = train.data.currentPathIndex;
    if (idx >= path.length - 1) return null;
    const from = path[idx];
    const to = path[idx + 1];
    return [from, to].sort().join('-');
  }

  setPriority(trainId: string, newPriority: number): number | null {
    const train = this.trains.find(t => t.data.id === trainId);
    if (!train) return null;
    const oldPriority = train.data.priority;
    train.data.priority = newPriority;
    return oldPriority;
  }

  startTrain(trainId: string): void {
    const train = this.trains.find(t => t.data.id === trainId);
    if (train && train.data.state === 'waiting') {
      train.data.state = 'running';
    }
  }

  startAllReady(): void {
    for (const train of this.trains) {
      if (train.data.state === 'waiting') {
        const firstArrival = train.data.schedule[0]?.arrivalTime ?? 0;
        if (this.gameTime >= firstArrival) {
          train.data.state = 'running';
        }
      }
    }
  }

  private checkConflictsAtNode(train: TrainEntity, nodeId: string): Conflict[] {
    const conflicts: Conflict[] = [];
    for (const other of this.trains) {
      if (other.data.id === train.data.id) continue;
      if (other.data.state !== 'running' && other.data.state !== 'waiting') continue;
      const otherNode = other.data.path[other.data.currentPathIndex];
      if (otherNode === nodeId) {
        const node = this.network.getNode(nodeId);
        if (node && node.type === 'platform') {
          conflicts.push({
            type: 'platform_occupied',
            severity: 'critical',
            trains: [train.data.id, other.data.id],
            location: nodeId,
            time: this.gameTime,
            message: `站台 ${node.platformId ?? nodeId} 被 ${other.data.name} 占用`,
          });
        }
      }
    }
    return conflicts;
  }

  private checkSameTrackConflicts(): Conflict[] {
    const conflicts: Conflict[] = [];
    for (let i = 0; i < this.trains.length; i++) {
      for (let j = i + 1; j < this.trains.length; j++) {
        const a = this.trains[i];
        const b = this.trains[j];
        if (a.data.state !== 'running' || b.data.state !== 'running') continue;
        const aEdge = this.getTrainCurrentEdge(a);
        const bEdge = this.getTrainCurrentEdge(b);
        if (aEdge && bEdge && aEdge === bEdge) {
          const dist = Math.abs(a.data.progress - b.data.progress);
          if (dist < 0.5) {
            conflicts.push({
              type: 'same_track',
              severity: 'critical',
              trains: [a.data.id, b.data.id],
              location: aEdge,
              time: this.gameTime,
              message: `${a.data.name} 和 ${b.data.name} 在同一段轨道上相向行驶`,
            });
            a.crash();
            b.crash();
          }
        }
      }
    }
    return conflicts;
  }

  private getTrainCurrentEdge(train: TrainEntity): string | null {
    const path = train.data.path;
    const idx = train.data.currentPathIndex;
    if (idx >= path.length - 1) return null;
    const from = path[idx];
    const to = path[idx + 1];
    return [from, to].sort().join('-');
  }

  getTrains(): TrainEntity[] {
    return this.trains;
  }

  getGameTime(): number {
    return this.gameTime;
  }

  getConflicts(): Conflict[] {
    return this.conflicts;
  }

  isAllArrived(): boolean {
    return this.trains.every(t => t.data.state === 'arrived');
  }

  hasCrash(): boolean {
    return this.trains.some(t => t.data.state === 'crashed');
  }

  reset(trainsData: TrainData[]): void {
    this.init(trainsData);
  }
}
