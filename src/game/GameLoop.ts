import { PerfMonitor } from '../utils/perf';

export type UpdateCallback = (deltaTime: number) => void;
export type RenderCallback = (ctx: CanvasRenderingContext2D, alpha: number) => void;

export class GameLoop {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private running = false;
  private paused = false;
  private lastTime = 0;
  private accumulator = 0;
  private targetDelta: number;
  private fixedTimestep = 1 / 60;
  private updateCallbacks: UpdateCallback[] = [];
  private renderCallbacks: RenderCallback[] = [];
  private maxFrameTime = 1 / 10;
  private perfMonitor = new PerfMonitor();
  private _drawCalls = 0;

  constructor(targetFPS = 60) {
    this.targetDelta = 1 / targetFPS;
    this.fixedTimestep = 1 / targetFPS;
  }

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
  }

  detach(): void {
    this.stop();
    this.canvas = null;
    this.ctx = null;
  }

  setTargetFPS(fps: number): void {
    this.targetDelta = 1 / Math.max(1, fps);
    this.fixedTimestep = this.targetDelta;
  }

  onUpdate(cb: UpdateCallback): () => void {
    this.updateCallbacks.push(cb);
    return () => { this.updateCallbacks = this.updateCallbacks.filter(c => c !== cb); };
  }

  onRender(cb: RenderCallback): () => void {
    this.renderCallbacks.push(cb);
    return () => { this.renderCallbacks = this.renderCallbacks.filter(c => c !== cb); };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.perfMonitor.reset();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause(): void { this.paused = true; }
  resume(): void {
    if (!this.running) { this.start(); return; }
    this.paused = false;
    this.lastTime = performance.now();
  }

  getPerfStats() { return this.perfMonitor.getStats(); }
  incrementDrawCalls(n = 1): void { this._drawCalls += n; }
  resetDrawCalls(): void { this._drawCalls = 0; }

  isRunning(): boolean { return this.running; }
  isPaused(): boolean { return this.paused; }

  private loop = (now: number): void => {
    if (!this.running) return;
    const frameStart = this.perfMonitor.beginFrame();

    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > this.maxFrameTime) dt = this.maxFrameTime;

    if (!this.paused) {
      this.accumulator += dt;
      while (this.accumulator >= this.fixedTimestep) {
        this.runUpdates(this.fixedTimestep);
        this.accumulator -= this.fixedTimestep;
      }
    }
    const alpha = this.accumulator / this.fixedTimestep;
    this.runRender(alpha);

    this.perfMonitor.endFrame(frameStart, 0, this._drawCalls);
    this._drawCalls = 0;
    this.rafId = requestAnimationFrame(this.loop);
  };

  private runUpdates(dt: number): void {
    for (const cb of this.updateCallbacks) cb(dt);
  }

  private runRender(alpha: number): void {
    if (!this.ctx || !this.canvas) return;
    const { width, height } = this.canvas;
    this.ctx.save();
    this.ctx.fillStyle = '#0a1628';
    this.ctx.fillRect(0, 0, width, height);
    for (const cb of this.renderCallbacks) cb(this.ctx, alpha);
    this.ctx.restore();
  }
}
