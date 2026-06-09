import type { BaseComponent, SimState, Wire, NodeId } from '../simulation/types';
import { drawGrid } from './GridRenderer';
import { drawComponent } from './ComponentRenderer';
import { drawWire } from './WireRenderer';
import { ParticleSystem, type Viewport } from './ParticleSystem';

export interface RendererOptions {
  gridSize?: number;
  backgroundColor?: string;
}

interface HighlightState {
  selectedComponentId?: string;
  selectedWireId?: string;
  hoveredComponentId?: string;
  hoveredWireId?: string;
  deleteWireMode?: boolean;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly particleSystem: ParticleSystem;

  width: number = 0;
  height: number = 0;
  viewport: Viewport = { px: 0, py: 0, scale: 1 };
  gridSize: number;
  backgroundColor: string;

  private globalTime: number = 0;
  private dpr: number = 1;
  private frameCount: number = 0;

  highlights: HighlightState = {};

  constructor(canvas: HTMLCanvasElement, options: RendererOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.particleSystem = new ParticleSystem();
    this.gridSize = options.gridSize ?? 40;
    this.backgroundColor = options.backgroundColor ?? '#0F172A';
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setViewport(px: number, py: number, scale: number): void {
    this.viewport = { px, py, scale: Math.max(0.15, Math.min(5, scale)) };
  }

  translate(dx: number, dy: number): void {
    this.viewport.px += dx / this.viewport.scale;
    this.viewport.py += dy / this.viewport.scale;
  }

  zoomAt(sx: number, sy: number, factor: number): void {
    const worldX = (sx / this.viewport.scale) - this.viewport.px;
    const worldY = (sy / this.viewport.scale) - this.viewport.py;
    const newScale = Math.max(0.15, Math.min(5, this.viewport.scale * factor));
    this.viewport.scale = newScale;
    this.viewport.px = (sx / newScale) - worldX;
    this.viewport.py = (sy / newScale) - worldY;
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: (wx + this.viewport.px) * this.viewport.scale,
      y: (wy + this.viewport.py) * this.viewport.scale,
    };
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx / this.viewport.scale) - this.viewport.px,
      y: (sy / this.viewport.scale) - this.viewport.py,
    };
  }

  clear(): void {
    this.ctx.save();
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const grad = this.ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.4,
      50,
      this.width * 0.5,
      this.height * 0.5,
      Math.max(this.width, this.height) * 0.75
    );
    grad.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  beginFrame(dt: number): void {
    this.globalTime += dt;
    this.frameCount++;
    this.clear();
    this.particleSystem.update(dt);
  }

  drawGrid(): void {
    drawGrid(this.ctx, this.width, this.height, this.gridSize, this.viewport);
  }

  drawAllWires(wires: Iterable<Wire>, sim: SimState): void {
    for (const wire of wires) {
      drawWire(this.ctx, wire, sim, sim.nodeVoltages, this.viewport, {
        hovered: this.highlights.hoveredWireId === wire.id,
        selected: this.highlights.selectedWireId === wire.id,
        globalTime: this.globalTime,
      });
    }
  }

  drawAllComponents(components: Iterable<BaseComponent>, sim: SimState): void {
    for (const comp of components) {
      drawComponent(this.ctx, comp, sim, this.viewport, {
        selected: this.highlights.selectedComponentId === comp.id,
        hovered: this.highlights.hoveredComponentId === comp.id,
        particleSystem: this.particleSystem,
      });
    }
  }

  drawParticles(): void {
    this.particleSystem.render(this.ctx, this.viewport);
  }

  endFrame(): void {}

  renderFrame(
    dt: number,
    sim: SimState,
    components: Iterable<BaseComponent>,
    wires: Iterable<Wire>
  ): void {
    this.beginFrame(dt);
    this.drawGrid();
    this.drawAllWires(wires, sim);
    this.drawAllComponents(components, sim);
    this.drawParticles();
    this.endFrame();
  }

  setSelected(componentId?: string, wireId?: string): void {
    this.highlights.selectedComponentId = componentId;
    this.highlights.selectedWireId = wireId;
  }

  setHovered(componentId?: string, wireId?: string): void {
    this.highlights.hoveredComponentId = componentId;
    this.highlights.hoveredWireId = wireId;
  }

  setDeleteWireMode(enabled: boolean): void {
    this.highlights.deleteWireMode = enabled;
  }

  snapToGrid(value: number): number {
    const g = this.gridSize;
    return Math.round(value / g) * g;
  }

  snapToGridPoint(x: number, y: number): { x: number; y: number } {
    return { x: this.snapToGrid(x), y: this.snapToGrid(y) };
  }

  getGridSize(): number {
    return this.gridSize;
  }

  get time(): number {
    return this.globalTime;
  }

  get frame(): number {
    return this.frameCount;
  }
}
