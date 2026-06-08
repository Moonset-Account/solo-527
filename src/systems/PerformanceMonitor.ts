import { PerformanceStats } from '@core/types';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private stats: PerformanceStats;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private maxHistorySize: number = 60;
  private entityCount: number = 0;
  private drawCallCount: number = 0;

  private constructor() {
    this.stats = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      memoryUsed: 0,
      entities: 0
    };
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startFrame(): void {
    this.frameCount++;
    this.drawCallCount = 0;
  }

  endFrame(delta: number): void {
    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this.stats.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      this.fpsHistory.push(this.stats.fps);
      if (this.fpsHistory.length > this.maxHistorySize) {
        this.fpsHistory.shift();
      }
    }

    this.stats.frameTime = Math.round(delta * 1000 * 100) / 100;
    this.frameTimeHistory.push(this.stats.frameTime);
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }

    this.stats.memoryUsed = this.getMemoryUsage();
    this.stats.entities = this.entityCount;
    this.stats.drawCalls = this.drawCallCount;
  }

  registerDrawCalls(count: number): void {
    this.drawCallCount += count;
  }

  setEntityCount(count: number): void {
    this.entityCount = count;
  }

  addEntity(delta: number = 1): void {
    this.entityCount += delta;
  }

  removeEntity(delta: number = 1): void {
    this.entityCount = Math.max(0, this.entityCount - delta);
  }

  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return this.stats.fps;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return this.stats.frameTime;
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frameTimeHistory.length * 100) / 100;
  }

  getFPSHistory(): number[] {
    return [...this.fpsHistory];
  }

  getFrameTimeHistory(): number[] {
    return [...this.frameTimeHistory];
  }

  reset(): void {
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.fpsHistory = [];
    this.frameTimeHistory = [];
    this.entityCount = 0;
    this.stats = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      memoryUsed: 0,
      entities: 0
    };
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      return Math.round(mem.usedJSHeapSize / 1048576);
    }
    return 0;
  }

  getPerformanceGrade(): 'excellent' | 'good' | 'average' | 'poor' {
    const fps = this.stats.fps;
    if (fps >= 58) return 'excellent';
    if (fps >= 50) return 'good';
    if (fps >= 30) return 'average';
    return 'poor';
  }

  formatStats(): string {
    const s = this.stats;
    return `FPS: ${s.fps} | FT: ${s.frameTime}ms | MEM: ${s.memoryUsed}MB | ENT: ${s.entities}`;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
