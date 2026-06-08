import { Train as TrainData, Conflict } from '../data/types.js';
import { TrackNetwork } from './TrackNetwork.js';
import { TrainEntity } from './Train.js';

export class TrainScheduler {
  private network: TrackNetwork;
  private trains: TrainEntity[] = [];
  private gameTime: number = 0;
  private conflicts: Conflict[] = [];
  private reportedDelayChains: Set<string> = new Set();

  constructor(network: TrackNetwork) {
    this.network = network;
  }

  init(trainsData: TrainData[]): void {
    this.trains = [];
    this.conflicts = [];
    this.gameTime = 0;
    this.reportedDelayChains.clear();
    for (const td of trainsData) {
      this.trains.push(new TrainEntity(td, this.network));
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
    const noContentionTrains: TrainEntity[] = [];

    for (const train of waitingTrains) {
      const currentNodeId = train.data.path[train.data.currentPathIndex];
      if (!currentNodeId) continue;
      const node = this.network.getNode(currentNodeId);
      if (!node) continue;

      if (node.type === 'signal' || node.type === 'platform') {
        let locationKey: string;
        if (node.type === 'signal') {
          locationKey = `sig-${currentNodeId}`;
        } else {
          locationKey = `plat-${node.platformId ?? currentNodeId}`;
        }

        if (!trainsByLocation.has(locationKey)) {
          trainsByLocation.set(locationKey, []);
        }
        trainsByLocation.get(locationKey)!.push(train);
      } else {
        const nextIdx = train.data.currentPathIndex + 1;
        if (nextIdx < train.data.path.length) {
          const nextNodeId = train.data.path[nextIdx];
          const nextNode = this.network.getNode(nextNodeId);
          if (nextNode && nextNode.type === 'signal') {
            const locationKey = `sig-${nextNodeId}`;
            if (!trainsByLocation.has(locationKey)) {
              trainsByLocation.set(locationKey, []);
            }
            trainsByLocation.get(locationKey)!.push(train);
            continue;
          }
        }
        noContentionTrains.push(train);
      }
    }

    for (const [, trainsAtLocation] of trainsByLocation) {
      if (trainsAtLocation.length <= 1) {
        trainsAtLocation[0].tryResume(this.gameTime);
      } else {
        trainsAtLocation.sort((a, b) => b.data.priority - a.data.priority);
        trainsAtLocation[0].tryResume(this.gameTime);
      }
    }

    for (const train of noContentionTrains) {
      train.tryResume(this.gameTime);
    }
  }

  private checkDelayChainConflicts(): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const train of this.trains) {
      if (train.data.state !== 'waiting') continue;
      if (train.data.currentPathIndex === 0 && train.data.progress === 0) continue;

      const currentNodeId = train.data.path[train.data.currentPathIndex];
      if (!currentNodeId) continue;
      const currentNode = this.network.getNode(currentNodeId);

      if (currentNode) {
        const nextIdx = train.data.currentPathIndex + 1;
        if (nextIdx < train.data.path.length) {
          const nextNodeId = train.data.path[nextIdx];
          const nextNode = this.network.getNode(nextNodeId);

          if (nextNode && nextNode.type === 'signal' && this.network.isSignalBlocked(nextNodeId)) {
            const conflictKey = `${train.data.id}-signal-${nextNodeId}`;
            if (!this.reportedDelayChains.has(conflictKey)) {
              this.reportedDelayChains.add(conflictKey);
              const blocker = this.findBlockerPastSignal(nextNodeId, train.data.path, nextIdx);
              if (blocker) {
                conflicts.push({
                  type: 'delay_chain',
                  severity: 'warning',
                  trains: [train.data.id, blocker.data.id],
                  location: nextNodeId,
                  time: this.gameTime,
                  message: `${train.data.name} 因 ${blocker.data.name} 占道被信号灯阻挡而晚点`,
                });
              } else {
                conflicts.push({
                  type: 'delay_chain',
                  severity: 'warning',
                  trains: [train.data.id],
                  location: nextNodeId,
                  time: this.gameTime,
                  message: `${train.data.name} 因前方信号灯红灯而晚点`,
                });
              }
            }
          }
        }

        if (currentNode.type === 'platform') {
          const occupant = this.findPlatformOccupant(train, currentNodeId);
          if (occupant) {
            const conflictKey = `${train.data.id}-platform-${currentNodeId}`;
            if (!this.reportedDelayChains.has(conflictKey)) {
              this.reportedDelayChains.add(conflictKey);
              conflicts.push({
                type: 'delay_chain',
                severity: 'warning',
                trains: [train.data.id, occupant.data.id],
                location: currentNodeId,
                time: this.gameTime,
                message: `${train.data.name} 因 ${occupant.data.name} 占用站台${currentNode.platformId ?? currentNodeId}而晚点`,
              });
            }
          }
        }
      }
    }

    return conflicts;
  }

  private findBlockerPastSignal(signalNodeId: string, trainPath: string[], signalPathIdx: number): TrainEntity | null {
    for (const other of this.trains) {
      if (other.data.state !== 'running' && other.data.state !== 'waiting') continue;
      const otherNodeId = other.data.path[other.data.currentPathIndex];
      if (otherNodeId === signalNodeId) {
        return other;
      }
    }

    if (signalPathIdx + 1 < trainPath.length) {
      const afterSignalNodeId = trainPath[signalPathIdx + 1];
      const edgeKey = [signalNodeId, afterSignalNodeId].sort().join('-');
      for (const other of this.trains) {
        if (other.data.state !== 'running' && other.data.state !== 'waiting') continue;
        const otherEdge = this.getTrainCurrentEdge(other);
        if (otherEdge === edgeKey) {
          return other;
        }
      }
    }

    return null;
  }

  private findPlatformOccupant(train: TrainEntity, platformNodeId: string): TrainEntity | null {
    for (const other of this.trains) {
      if (other.data.id === train.data.id) continue;
      if (other.data.state !== 'running' && other.data.state !== 'waiting') continue;
      const otherNodeId = other.data.path[other.data.currentPathIndex];
      if (otherNodeId === platformNodeId) {
        return other;
      }
    }
    return null;
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
