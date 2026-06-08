import { Train as TrainData, Conflict } from '../data/types.js';
import { TrackNetwork } from './TrackNetwork.js';
import { TrainEntity } from './Train.js';

export class TrainScheduler {
  private network: TrackNetwork;
  private trains: TrainEntity[] = [];
  private gameTime: number = 0;
  private conflicts: Conflict[] = [];

  constructor(network: TrackNetwork) {
    this.network = network;
  }

  init(trainsData: TrainData[]): void {
    this.trains = [];
    this.conflicts = [];
    this.gameTime = 0;
    for (const td of trainsData) {
      this.trains.push(new TrainEntity(td, this.network));
    }
  }

  update(delta: number): Conflict[] {
    this.gameTime += delta / 1000;
    const newConflicts: Conflict[] = [];

    for (const train of this.trains) {
      if (train.data.state === 'waiting') {
        if (train.data.schedule.some(e => e.arrivalTime <= this.gameTime)) {
          train.tryResume(this.gameTime);
        }
        if (train.data.state === 'waiting') {
          const shouldStart = train.data.schedule[0]?.arrivalTime ?? Infinity;
          if (this.gameTime >= shouldStart && train.data.currentPathIndex === 0 && train.data.progress === 0) {
            train.data.state = 'running';
          }
        }
      }

      const result = train.update(delta, this.gameTime);
      if (result.atNode) {
        newConflicts.push(...this.checkConflictsAtNode(train, result.atNode));
      }
    }

    newConflicts.push(...this.checkSameTrackConflicts());
    this.conflicts.push(...newConflicts);
    return newConflicts;
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
