export const Easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBack: (t: number): number => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  easeOutElastic: (t: number): number => { if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1; },
};

export interface TweenOptions {
  from: number;
  to: number;
  duration: number;
  easing?: (t: number) => number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export class Tween {
  private startTime: number = 0;
  private options: TweenOptions;
  private running: boolean = false;

  constructor(options: TweenOptions) {
    this.options = { easing: Easing.easeOutCubic, ...options };
  }

  start(): void {
    this.startTime = performance.now();
    this.running = true;
  }

  update(currentTime: number): boolean {
    if (!this.running) return false;
    const elapsed = currentTime - this.startTime;
    const rawProgress = Math.min(elapsed / this.options.duration, 1);
    const easedProgress = this.options.easing!(rawProgress);
    const value = this.options.from + (this.options.to - this.options.from) * easedProgress;
    this.options.onUpdate(value);
    if (rawProgress >= 1) {
      this.running = false;
      this.options.onComplete?.();
      return false;
    }
    return true;
  }

  stop(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}
