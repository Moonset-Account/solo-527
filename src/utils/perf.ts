import type { PerformanceStats } from '../types/game';

export class PerfMonitor {
  private frames = 0;
  private frameTimes: number[] = [];
  private lastFpsUpdate = performance.now();
  private _fps = 60;
  private _minFps = 60;
  private _maxFps = 60;
  private _avgFps = 60;
  private _frameTime = 16.67;
  private _drawCalls = 0;
  private _particles = 0;

  beginFrame(): number {
    return performance.now();
  }

  endFrame(start: number, particles = 0, drawCalls = 0): void {
    const now = performance.now();
    const ft = now - start;
    this.frames++;
    this.frameTimes.push(ft);
    if (this.frameTimes.length > 120) this.frameTimes.shift();
    this._drawCalls = drawCalls;
    this._particles = particles;

    if (now - this.lastFpsUpdate >= 500) {
      const elapsed = (now - this.lastFpsUpdate) / 1000;
      this._fps = this.frames / Math.max(0.001, elapsed);
      this._frameTime = this.frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, this.frameTimes.length);
      const instantFps = this.frameTimes.map(ft => 1000 / Math.max(1, ft));
      this._minFps = Math.min(...instantFps);
      this._maxFps = Math.max(...instantFps);
      this._avgFps = instantFps.reduce((a, b) => a + b, 0) / Math.max(1, instantFps.length);
      this.frames = 0;
      this.lastFpsUpdate = now;
    }
  }

  getStats(): PerformanceStats {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0;
    return {
      fps: Math.round(this._fps * 10) / 10,
      frameTime: Math.round(this._frameTime * 100) / 100,
      minFps: Math.round(this._minFps),
      maxFps: Math.round(this._maxFps),
      avgFps: Math.round(this._avgFps),
      drawCalls: this._drawCalls,
      particles: this._particles,
      memory: memory ? Math.round(memory / 1024 / 1024 * 10) / 10 : 0,
    };
  }

  reset(): void {
    this.frames = 0;
    this.frameTimes = [];
    this.lastFpsUpdate = performance.now();
    this._minFps = 60;
    this._maxFps = 60;
    this._drawCalls = 0;
    this._particles = 0;
  }
}
