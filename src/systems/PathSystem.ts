import type { PathNode, Vec2, Rect } from '@/types';
import { distanceV, lerpV, pointInRect, subV, normalizeV, addV, scaleV } from '@/utils/math';

export class PathSystem {
  private nodes: PathNode[] = [];
  private segLengths: number[] = [];
  private totalLength: number = 0;
  private buildableAreas: Rect[] = [];
  private pathWidth: number = 48;

  setPath(nodes: PathNode[]): void {
    this.nodes = nodes.slice();
    this.recalculate();
  }

  setBuildableAreas(areas: Rect[]): void {
    this.buildableAreas = areas.slice();
  }

  setPathWidth(w: number): void {
    this.pathWidth = w;
  }

  private recalculate(): void {
    this.segLengths = [];
    this.totalLength = 0;
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const d = distanceV(this.nodes[i].position, this.nodes[i + 1].position);
      this.segLengths.push(d);
      this.totalLength += d;
    }
  }

  getNodes(): PathNode[] {
    return this.nodes;
  }

  getTotalLength(): number {
    return this.totalLength;
  }

  getStart(): Vec2 {
    return this.nodes[0]?.position ?? { x: 0, y: 0 };
  }

  getEnd(): Vec2 {
    return this.nodes[this.nodes.length - 1]?.position ?? { x: 0, y: 0 };
  }

  getPositionAt(distance: number): Vec2 {
    if (this.nodes.length < 2) return { x: 0, y: 0 };
    let d = Math.max(0, Math.min(this.totalLength, distance));
    for (let i = 0; i < this.segLengths.length; i++) {
      if (d <= this.segLengths[i]) {
        const t = this.segLengths[i] === 0 ? 0 : d / this.segLengths[i];
        return lerpV(this.nodes[i].position, this.nodes[i + 1].position, t);
      }
      d -= this.segLengths[i];
    }
    return this.nodes[this.nodes.length - 1].position;
  }

  getDirectionAt(distance: number): Vec2 {
    if (this.nodes.length < 2) return { x: 1, y: 0 };
    let d = Math.max(0, Math.min(this.totalLength - 0.001, distance));
    for (let i = 0; i < this.segLengths.length; i++) {
      if (d <= this.segLengths[i]) {
        return normalizeV(subV(this.nodes[i + 1].position, this.nodes[i].position));
      }
      d -= this.segLengths[i];
    }
    const last = this.nodes[this.nodes.length - 1];
    const prev = this.nodes[this.nodes.length - 2];
    return normalizeV(subV(last.position, prev.position));
  }

  isOnPath(p: Vec2, margin: number = 0): boolean {
    const threshold = this.pathWidth / 2 + margin;
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const a = this.nodes[i].position;
      const b = this.nodes[i + 1].position;
      const ab = subV(b, a);
      const ap = subV(p, a);
      const abLenSq = ab.x * ab.x + ab.y * ab.y;
      if (abLenSq === 0) continue;
      let t = (ap.x * ab.x + ap.y * ab.y) / abLenSq;
      t = Math.max(0, Math.min(1, t));
      const closest = addV(a, scaleV(ab, t));
      if (distanceV(p, closest) <= threshold) return true;
    }
    return false;
  }

  canBuildAt(p: Vec2, size: number = 40, existingPositions: Vec2[] = []): boolean {
    for (const area of this.buildableAreas) {
      if (pointInRect(p, area)) {
        if (this.isOnPath(p, size * 0.35)) return false;
        for (const ep of existingPositions) {
          if (distanceV(p, ep) < size) return false;
        }
        return true;
      }
    }
    return false;
  }

  getBuildableAreas(): Rect[] {
    return this.buildableAreas;
  }

  getPathWidth(): number {
    return this.pathWidth;
  }

  addNode(pos: Vec2, index?: number): void {
    if (index === undefined || index >= this.nodes.length) {
      this.nodes.push({ position: pos });
    } else {
      this.nodes.splice(index, 0, { position: pos });
    }
    this.recalculate();
  }

  removeNode(index: number): void {
    if (this.nodes.length > 2 && index > 0 && index < this.nodes.length - 1) {
      this.nodes.splice(index, 1);
      this.recalculate();
    }
  }

  moveNode(index: number, pos: Vec2): void {
    if (index >= 0 && index < this.nodes.length) {
      this.nodes[index] = { ...this.nodes[index], position: pos };
      this.recalculate();
    }
  }

  render(ctx: CanvasRenderingContext2D, showNodes: boolean = false): void {
    if (this.nodes.length < 2) return;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;

    ctx.strokeStyle = '#5d4e37';
    ctx.lineWidth = this.pathWidth + 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.nodes[0].position.x, this.nodes[0].position.y);
    for (let i = 1; i < this.nodes.length; i++) {
      ctx.lineTo(this.nodes[i].position.x, this.nodes[i].position.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#b8a07a';
    ctx.lineWidth = this.pathWidth;
    ctx.beginPath();
    ctx.moveTo(this.nodes[0].position.x, this.nodes[0].position.y);
    for (let i = 1; i < this.nodes.length; i++) {
      ctx.lineTo(this.nodes[i].position.x, this.nodes[i].position.y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(139, 195, 74, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(this.nodes[0].position.x, this.nodes[0].position.y);
    for (let i = 1; i < this.nodes.length; i++) {
      ctx.lineTo(this.nodes[i].position.x, this.nodes[i].position.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const start = this.nodes[0].position;
    const end = this.nodes[this.nodes.length - 1].position;

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('起', start.x, start.y);

    ctx.fillStyle = '#8bc34a';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('仓', end.x, end.y);

    if (showNodes) {
      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i].position;
        ctx.fillStyle = 'rgba(78, 205, 196, 0.8)';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  renderBuildableAreas(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const area of this.buildableAreas) {
      ctx.fillStyle = 'rgba(139, 195, 74, 0.06)';
      ctx.fillRect(area.x, area.y, area.width, area.height);
      ctx.strokeStyle = 'rgba(139, 195, 74, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}
