export class Timer {
  private startTs: number | null = null;
  private accumulated: number = 0;
  private paused = false;
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.accumulated = 0;
    this.startTs = performance.now();
  }

  stop(): void {
    if (!this.running) return;
    if (!this.paused && this.startTs !== null) {
      this.accumulated += performance.now() - this.startTs;
    }
    this.running = false;
    this.paused = false;
    this.startTs = null;
  }

  pause(): void {
    if (!this.running || this.paused || this.startTs === null) return;
    this.accumulated += performance.now() - this.startTs;
    this.startTs = null;
    this.paused = true;
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.startTs = performance.now();
  }

  reset(): void {
    this.running = false;
    this.paused = false;
    this.accumulated = 0;
    this.startTs = null;
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.running && this.paused;
  }

  getElapsed(): number {
    if (!this.running) {
      return this.accumulated;
    }
    if (this.paused || this.startTs === null) {
      return this.accumulated;
    }
    return this.accumulated + (performance.now() - this.startTs);
  }

  getElapsedSeconds(): number {
    return this.getElapsed() / 1000;
  }

  getElapsedMinutes(): number {
    return this.getElapsedSeconds() / 60;
  }

  getElapsedMilliseconds(): number {
    return this.getElapsed();
  }
}
