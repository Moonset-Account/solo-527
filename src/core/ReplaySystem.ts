import { ReplayAction } from '../data/types.js';

export class ReplaySystem {
  private actions: ReplayAction[] = [];
  private playbackIndex: number = 0;
  private isPlaying: boolean = false;

  reset(): void {
    this.actions = [];
    this.playbackIndex = 0;
    this.isPlaying = false;
  }

  record(action: ReplayAction): void {
    this.actions.push(action);
  }

  getActions(): ReplayAction[] {
    return [...this.actions];
  }

  startPlayback(): void {
    this.playbackIndex = 0;
    this.isPlaying = true;
  }

  getNextAction(upToTime: number): ReplayAction | null {
    if (!this.isPlaying || this.playbackIndex >= this.actions.length) return null;
    const action = this.actions[this.playbackIndex];
    if (action.time <= upToTime) {
      this.playbackIndex++;
      return action;
    }
    return null;
  }

  stopPlayback(): void {
    this.isPlaying = false;
  }

  getActionCount(): number {
    return this.actions.length;
  }

  undoLast(): ReplayAction | null {
    if (this.actions.length === 0) return null;
    return this.actions.pop()!;
  }
}
