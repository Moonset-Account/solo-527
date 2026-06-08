import { APP_CONFIG } from './config';

const SMOOTH_FACTOR = 0.12;
const GRID_DOT_MIN_SPACING = 15;
const GRID_DOT_MAX_SPACING = 80;
const GRID_DOT_BASE_SIZE = 1.2;

class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  minZoom = APP_CONFIG.ZOOM_MIN;
  maxZoom = APP_CONFIG.ZOOM_MAX;

  private targetX = 0;
  private targetY = 0;
  private targetZoom = 1;
  private smoothing = true;

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - window.innerWidth / 2) / this.zoom + this.x,
      y: (sy - window.innerHeight / 2) / this.zoom + this.y,
    };
  }

  worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
    return {
      sx: (wx - this.x) * this.zoom + window.innerWidth / 2,
      sy: (wy - this.y) * this.zoom + window.innerHeight / 2,
    };
  }

  pan(dx: number, dy: number) {
    this.targetX += dx;
    this.targetY += dy;
    if (!this.smoothing) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  zoomAt(factor: number, screenX: number, screenY: number) {
    const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.targetZoom * factor));

    const worldBefore = this.screenToWorld(screenX, screenY);

    this.targetZoom = newZoom;

    const worldAfter: { x: number; y: number } = {
      x: (screenX - window.innerWidth / 2) / newZoom + this.targetX,
      y: (screenY - window.innerHeight / 2) / newZoom + this.targetY,
    };

    this.targetX += worldBefore.x - worldAfter.x;
    this.targetY += worldBefore.y - worldAfter.y;

    if (!this.smoothing) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.zoom = this.targetZoom;
    }
  }

  fitRect(x: number, y: number, w: number, h: number) {
    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;
    const padding = 0.85;

    const zoomX = (canvasW * padding) / w;
    const zoomY = (canvasH * padding) / h;
    this.targetZoom = Math.min(this.maxZoom, Math.max(this.minZoom, Math.min(zoomX, zoomY)));

    this.targetX = x + w / 2;
    this.targetY = y + h / 2;

    if (!this.smoothing) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.zoom = this.targetZoom;
    }
  }

  getTransform(): { offsetX: number; offsetY: number; scale: number } {
    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;
    return {
      offsetX: canvasW / 2 - this.x * this.zoom,
      offsetY: canvasH / 2 - this.y * this.zoom,
      scale: this.zoom,
    };
  }

  getViewBounds(): { x: number; y: number; w: number; h: number } {
    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;
    const halfW = canvasW / 2 / this.zoom;
    const halfH = canvasH / 2 / this.zoom;
    return {
      x: this.x - halfW,
      y: this.y - halfH,
      w: halfW * 2,
      h: halfH * 2,
    };
  }

  setSmoothing(enabled: boolean) {
    this.smoothing = enabled;
  }

  update(dt: number) {
    if (!this.smoothing) return;

    const t = 1 - Math.pow(1 - SMOOTH_FACTOR, dt * 60);

    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;
    this.zoom += (this.targetZoom - this.zoom) * t;
  }

  drawGrid(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    let baseSpacing = APP_CONFIG.gridSize;

    let spacing = baseSpacing * this.zoom;
    while (spacing < GRID_DOT_MIN_SPACING) {
      spacing *= 2;
      baseSpacing *= 2;
    }
    while (spacing > GRID_DOT_MAX_SPACING) {
      spacing /= 2;
      baseSpacing /= 2;
    }

    const bounds = this.getViewBounds();

    const startX = Math.floor(bounds.x / baseSpacing) * baseSpacing;
    const startY = Math.floor(bounds.y / baseSpacing) * baseSpacing;
    const endX = bounds.x + bounds.w + baseSpacing;
    const endY = bounds.y + bounds.h + baseSpacing;

    const dotSize = Math.max(0.5, GRID_DOT_BASE_SIZE * Math.min(this.zoom, 2));

    ctx.fillStyle = APP_CONFIG.GRID_COLOR;

    for (let wx = startX; wx <= endX; wx += baseSpacing) {
      for (let wy = startY; wy <= endY; wy += baseSpacing) {
        const screen = this.worldToScreen(wx, wy);
        if (screen.sx < -1 || screen.sx > canvasWidth + 1) continue;
        if (screen.sy < -1 || screen.sy > canvasHeight + 1) continue;

        ctx.fillRect(screen.sx - dotSize / 2, screen.sy - dotSize / 2, dotSize, dotSize);
      }
    }
  }

  snapToGrid(wx: number, wy: number): { x: number; y: number } {
    const g = APP_CONFIG.gridSize;
    return {
      x: Math.round(wx / g) * g,
      y: Math.round(wy / g) * g,
    };
  }
}

export const camera = new Camera();
export { Camera };
