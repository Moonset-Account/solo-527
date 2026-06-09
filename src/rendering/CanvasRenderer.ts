import type { Vec2 } from '@/game/types';
import { GRID_SIZE } from '@/data/defaults';
import { drawRoundRect, drawScrew, drawGlow } from './helpers';

export { drawRoundRect, drawScrew, drawGlow };

export class CanvasRenderer {
  private _ctx: CanvasRenderingContext2D;
  private _canvas: HTMLCanvasElement;
  private _rafId: number | null = null;
  private _time: number = 0;
  private _dt: number = 0;
  private _renderCallbacks: Set<(ctx: CanvasRenderingContext2D, time: number, dt: number) => void> = new Set();
  private _width: number = 0;
  private _height: number = 0;
  private _dpr: number = 1;
  private _gridSize: number = GRID_SIZE;
  private _showGrid: boolean = true;
  private _canvasOffset: Vec2 = { x: 0, y: 0 };
  private _canvasScale: number = 1.0;
  private _shakeTime: number = 0;
  private _shakeAmplitude: number = 0;
  private _lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this._ctx = ctx;
    this._dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  start(): void {
    if (this._rafId !== null) return;
    this._lastTime = performance.now();
    const loop = (nowMs: number) => {
      this._loop(nowMs);
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  setShowGrid(v: boolean): void {
    this._showGrid = v;
  }

  setTransform(offset: Vec2, scale: number): void {
    this._canvasOffset = { ...offset };
    this._canvasScale = scale;
  }

  worldToScreen(wp: Vec2): Vec2 {
    return {
      x: (wp.x + this._canvasOffset.x) * this._canvasScale,
      y: (wp.y + this._canvasOffset.y) * this._canvasScale,
    };
  }

  screenToWorld(sp: Vec2): Vec2 {
    return {
      x: sp.x / this._canvasScale - this._canvasOffset.x,
      y: sp.y / this._canvasScale - this._canvasOffset.y,
    };
  }

  resize(): void {
    const rect = this._canvas.getBoundingClientRect();
    this._width = Math.floor(rect.width * this._dpr);
    this._height = Math.floor(rect.height * this._dpr);
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
  }

  onRender(cb: (ctx: CanvasRenderingContext2D, time: number, dt: number) => void): () => void {
    this._renderCallbacks.add(cb);
    return () => {
      this._renderCallbacks.delete(cb);
    };
  }

  triggerShake(durationMs: number = 300, amplitude: number = 5): void {
    this._shakeTime = durationMs;
    this._shakeAmplitude = amplitude;
  }

  clear(): void {
    this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  get ctx(): CanvasRenderingContext2D {
    return this._ctx;
  }

  get width(): number {
    return this._width / this._dpr;
  }

  get height(): number {
    return this._height / this._dpr;
  }

  get dpr(): number {
    return this._dpr;
  }

  get time(): number {
    return this._time;
  }

  get dt(): number {
    return this._dt;
  }

  get scale(): number {
    return this._canvasScale;
  }

  get offset(): Vec2 {
    return { ...this._canvasOffset };
  }

  private _loop(nowMs: number): void {
    const rawDt = (nowMs - this._lastTime) / 1000;
    this._dt = Math.min(rawDt, 0.1);
    this._lastTime = nowMs;
    this._time += this._dt * 1000;

    this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this._applyShake(this._ctx);
    this._renderBackground(this._ctx);
    this._renderGrid(this._ctx);

    this._ctx.save();
    this._ctx.scale(this._canvasScale, this._canvasScale);
    this._ctx.translate(this._canvasOffset.x, this._canvasOffset.y);

    this._renderCallbacks.forEach((cb) => {
      cb(this._ctx, this._time, this._dt);
    });

    this._ctx.restore();
  }

  private _renderBackground(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, w, h);

    const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  private _renderGrid(ctx: CanvasRenderingContext2D): void {
    if (!this._showGrid) return;

    const w = this.width;
    const h = this.height;
    const gridSize = this._gridSize * this._canvasScale;
    const offsetX = (this._canvasOffset.x * this._canvasScale) % gridSize;
    const offsetY = (this._canvasOffset.y * this._canvasScale) % gridSize;

    ctx.fillStyle = '#2d3a5c';
    ctx.globalAlpha = 0.5;

    for (let x = offsetX; x < w; x += gridSize) {
      for (let y = offsetY; y < h; y += gridSize) {
        ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
      }
    }

    ctx.globalAlpha = 1;
  }

  private _applyShake(ctx: CanvasRenderingContext2D): void {
    if (this._shakeTime > 0) {
      const shakeX = (Math.random() - 0.5) * this._shakeAmplitude * 2;
      const shakeY = (Math.random() - 0.5) * this._shakeAmplitude * 2;
      ctx.translate(shakeX, shakeY);
      this._shakeTime -= this._dt * 1000;
      if (this._shakeTime <= 0) {
        this._shakeTime = 0;
        this._shakeAmplitude = 0;
      }
    }
  }
}
