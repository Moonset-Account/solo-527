const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;
const FIXED_DT = 1 / 60;
const MAX_FRAME_SKIP = 5;

type UpdateCallback = (dt: number) => void;
type RenderCallback = () => void;
type FixedUpdateCallback = (fixedDt: number) => void;

class Engine {
  private running = false;
  private paused = false;
  private lastTime = 0;
  private accumulator = 0;
  private frameCount = 0;
  private deltaTime = 0;
  private currentFps = 0;
  private fpsAccumulator = 0;
  private fpsFrameCount = 0;
  private rafId = 0;

  private onUpdate: UpdateCallback | null = null;
  private onRender: RenderCallback | null = null;
  private onFixedUpdate: FixedUpdateCallback | null = null;

  setOnUpdate(cb: UpdateCallback) {
    this.onUpdate = cb;
  }

  setOnRender(cb: RenderCallback) {
    this.onRender = cb;
  }

  setOnFixedUpdate(cb: FixedUpdateCallback) {
    this.onFixedUpdate = cb;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frameCount = 0;
    this.fpsAccumulator = 0;
    this.fpsFrameCount = 0;
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    this.paused = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  pause() {
    if (!this.running) return;
    this.paused = true;
  }

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  isRunning() {
    return this.running;
  }

  isPaused() {
    return this.paused;
  }

  getDeltaTime() {
    return this.deltaTime;
  }

  getFPS() {
    return this.currentFps;
  }

  getFrameCount() {
    return this.frameCount;
  }

  private loop = (now: number) => {
    if (!this.running) return;

    this.rafId = requestAnimationFrame(this.loop);

    const elapsed = now - this.lastTime;

    if (elapsed <= 0) {
      this.lastTime = now;
      return;
    }

    if (elapsed < FRAME_DURATION * 0.5) {
      return;
    }

    this.lastTime = now;
    this.deltaTime = Math.min(elapsed / 1000, 0.1);

    this.fpsAccumulator += elapsed;
    this.fpsFrameCount++;
    if (this.fpsAccumulator >= 1000) {
      this.currentFps = Math.round((this.fpsFrameCount * 1000) / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
    }

    this.frameCount++;

    if (this.paused) {
      this.onRender?.();
      return;
    }

    this.accumulator += this.deltaTime;

    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_FRAME_SKIP) {
      this.onFixedUpdate?.(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps++;
    }

    if (this.accumulator > FIXED_DT * MAX_FRAME_SKIP) {
      this.accumulator = 0;
    }

    this.onUpdate?.(this.deltaTime);
    this.onRender?.();
  };
}

export const engine = new Engine();
export { Engine };
