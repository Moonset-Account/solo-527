import { UIState } from '../data/types.js';

export class UIStateManager {
  private state: UIState = 'idle';
  private listeners: Map<UIState, (() => void)[]> = new Map();

  getState(): UIState {
    return this.state;
  }

  setState(newState: UIState): void {
    const oldState = this.state;
    this.state = newState;
    const cbs = this.listeners.get(newState);
    if (cbs) cbs.forEach(cb => cb());
  }

  onState(state: UIState, callback: () => void): void {
    if (!this.listeners.has(state)) this.listeners.set(state, []);
    this.listeners.get(state)!.push(callback);
  }

  clearListeners(): void {
    this.listeners.clear();
  }
}
