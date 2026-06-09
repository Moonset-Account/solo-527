import type { Viewport } from './ParticleSystem';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gridSize: number = 40,
  viewport: Viewport
): void {
  const { px, py, scale } = viewport;
  const cellSize = gridSize * scale;

  if (cellSize < 4) return;

  const startX = ((-px * scale) % cellSize + cellSize) % cellSize;
  const startY = ((-py * scale) % cellSize + cellSize) % cellSize;

  ctx.save();

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX; x < w; x += cellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = startY; y < h; y += cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  const majorSize = cellSize * 5;
  const majorStartX = ((-px * scale) % majorSize + majorSize) % majorSize;
  const majorStartY = ((-py * scale) % majorSize + majorSize) % majorSize;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = majorStartX; x < w; x += majorSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = majorStartY; y < h; y += majorSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  const originX = (0 + px) * scale;
  const originY = (0 + py) * scale;

  if (originX >= 0 && originX <= w) {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, h);
    ctx.stroke();
  }

  if (originY >= 0 && originY <= h) {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    ctx.stroke();
  }

  if (cellSize >= 15) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = `${Math.min(11, cellSize * 0.3)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = majorStartX; x < w; x += majorSize) {
      const worldX = Math.round((x / scale) - px);
      if (Math.abs(worldX) >= gridSize * 5) {
        ctx.fillText(`${worldX}`, x, Math.max(2, originY + 4));
      }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let y = majorStartY; y < h; y += majorSize) {
      const worldY = Math.round((y / scale) - py);
      if (Math.abs(worldY) >= gridSize * 5) {
        ctx.fillText(`${worldY}`, Math.max(2, originX + 4), y);
      }
    }
  }

  if (originX >= -20 && originX <= w + 20 && originY >= -20 && originY <= h + 20) {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('O', originX + 6, originY - 6);

    ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
    ctx.fillText('Y', originX + 6, 16);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
    ctx.fillText('X', w - 16, originY - 6);
  }

  ctx.restore();
}
