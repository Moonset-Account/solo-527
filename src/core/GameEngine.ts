import type { GameState, Vec2 } from '@/types';
import { EventBus } from './EventBus';
import { EntityManager } from './EntityManager';

export class GameEngine {
  private static instance: GameEngine;

  public readonly eventBus: EventBus;
  public readonly entities: EntityManager;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;

  public state: GameState = 'menu';
  public speed: number = 1;
  public elapsed: number = 0;
  public camera: Vec2 = { x: 0, y: 0 };
  public viewport: { width: number; height: number } = { width: 0, height: 0 };
  public worldSize: { width: number; height: number } = { width: 1600, height: 1000 };

  public debug: Record<string, boolean> = {
    showGrid: false,
    showPath: true,
    showRange: false,
    showHitbox: false,
    showFPS: true,
  };

  public fps: number = 60;
  private fpsCounter: { frames: number; time: number } = { frames: 0, time: 0 };

  public readonly fixedDt = 1 / 60;
  private _onUpdate?: (dt: number) => void;
  private _onRender?: (ctx: CanvasRenderingContext2D) => void;

  private constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.eventBus = EventBus.getInstance();
    this.entities = new EntityManager();

    this.resize();
    window.addEventListener('resize', this.resize);
  }

  public static create(canvas: HTMLCanvasElement): GameEngine {
    if (GameEngine.instance) {
      return GameEngine.instance;
    }
    GameEngine.instance = new GameEngine(canvas);
    return GameEngine.instance;
  }

  public static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      throw new Error('GameEngine not initialized');
    }
    return GameEngine.instance;
  }

  private resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewport = { width: w, height: h };
  };

  public setUpdateHandler(handler: (dt: number) => void): void {
    this._onUpdate = handler;
  }

  public setRenderHandler(handler: (ctx: CanvasRenderingContext2D) => void): void {
    this._onRender = handler;
  }

  public start(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    this.loop();
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public setState(state: GameState): void {
    if (this.state !== state) {
      this.state = state;
      this.eventBus.emit('game:stateChange', state);
    }
  }

  public setSpeed(s: number): void {
    this.speed = Math.max(0.25, Math.min(4, s));
  }

  public toggleDebug(key: string): void {
    this.debug[key] = !this.debug[key];
    this.eventBus.emit('debug:toggle', { key, value: this.debug[key] });
  }

  public worldToScreen(wp: Vec2): Vec2 {
    return {
      x: wp.x - this.camera.x + this.viewport.width / 2,
      y: wp.y - this.camera.y + this.viewport.height / 2,
    };
  }

  public screenToWorld(sp: Vec2): Vec2 {
    return {
      x: sp.x + this.camera.x - this.viewport.width / 2,
      y: sp.y + this.camera.y - this.viewport.height / 2,
    };
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  private loop = (): void => {
    const now = performance.now();
    const realDt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.fpsCounter.frames++;
    this.fpsCounter.time += realDt;
    if (this.fpsCounter.time >= 0.5) {
      this.fps = this.fpsCounter.frames / this.fpsCounter.time;
      this.fpsCounter.frames = 0;
      this.fpsCounter.time = 0;
    }

    if (this.state === 'playing') {
      const dt = realDt * this.speed;
      this.accumulator += dt;
      while (this.accumulator >= this.fixedDt) {
        this.update(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }
      this.elapsed += dt;
    }

    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.entities.update(dt);
    this._onUpdate?.(dt);
    this.entities.cleanup();
  }

  private render(): void {
    const ctx = this.ctx;
    const { width, height } = this.viewport;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 - this.camera.x, height / 2 - this.camera.y);

    if (this.debug.showGrid) this.renderGrid();

    this._onRender?.(ctx);
    this.entities.render(ctx);

    ctx.restore();
  }

  private renderGrid(): void {
    const ctx = this.ctx;
    const size = 50;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.worldSize.width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldSize.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.worldSize.height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldSize.width, y);
      ctx.stroke();
    }
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.resize);
    this.entities.dispose();
  }
}
