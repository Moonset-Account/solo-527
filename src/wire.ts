import { Point } from './config';

let wireCounter = 0;

export interface PinRef {
  componentId: string;
  pinIndex: number;
}

export interface WireSegment {
  from: Point;
  to: Point;
}

export class Wire {
  id: string;
  startPin: PinRef;
  endPin: PinRef;
  points: Point[];
  current: number;
  selected: boolean;
  hovered: boolean;

  constructor(startPin: PinRef, endPin: PinRef, points: Point[] = []) {
    this.id = `wire_${++wireCounter}`;
    this.startPin = startPin;
    this.endPin = endPin;
    this.points = points;
    this.current = 0;
    this.selected = false;
    this.hovered = false;
  }

  getSegments(startWorldPos: Point, endWorldPos: Point): WireSegment[] {
    const all: Point[] = [startWorldPos, ...this.points, endWorldPos];
    const segments: WireSegment[] = [];
    for (let i = 0; i < all.length - 1; i++) {
      segments.push({ from: all[i], to: all[i + 1] });
    }
    return segments;
  }

  draw(ctx: CanvasRenderingContext2D, startWorldPos: Point, endWorldPos: Point) {
    const segments = this.getSegments(startWorldPos, endWorldPos);
    if (segments.length === 0) return;

    let color: string;
    if (this.current === 0) {
      color = '#888888';
    } else {
      const t = Math.min(Math.abs(this.current) / 5, 1);
      const r = 255;
      const g = Math.round(255 * (1 - t));
      const b = 0;
      color = `rgb(${r},${g},${b})`;
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.selected) {
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 5;
      ctx.setLineDash([]);
      this.drawSegments(ctx, segments);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = this.hovered ? 3.5 : 2;
    ctx.setLineDash([]);

    if (this.current !== 0) {
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -(performance.now() / 30) % 12;
    }

    this.drawSegments(ctx, segments);
    ctx.setLineDash([]);

    const pinRadius = 4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(startWorldPos.x, startWorldPos.y, pinRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(endWorldPos.x, endWorldPos.y, pinRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawSegments(ctx: CanvasRenderingContext2D, segments: WireSegment[]) {
    ctx.beginPath();
    ctx.moveTo(segments[0].from.x, segments[0].from.y);
    for (const seg of segments) {
      ctx.lineTo(seg.to.x, seg.to.y);
    }
    ctx.stroke();
  }

  hitTest(wx: number, wy: number, threshold: number, startWorldPos: Point, endWorldPos: Point): boolean {
    const segments = this.getSegments(startWorldPos, endWorldPos);
    for (const seg of segments) {
      if (this.pointToSegmentDist(wx, wy, seg.from, seg.to) <= threshold) {
        return true;
      }
    }
    return false;
  }

  private pointToSegmentDist(px: number, py: number, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      const ex = px - a.x;
      const ey = py - a.y;
      return Math.sqrt(ex * ex + ey * ey);
    }
    let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    const ex = px - projX;
    const ey = py - projY;
    return Math.sqrt(ex * ex + ey * ey);
  }

  serialize(): object {
    return {
      id: this.id,
      startPin: { ...this.startPin },
      endPin: { ...this.endPin },
      points: this.points.map(p => ({ x: p.x, y: p.y })),
      current: this.current,
    };
  }

  static deserialize(data: any): Wire {
    const points = (data.points ?? []).map((p: any) => ({ x: p.x, y: p.y } as Point));
    const wire = new Wire(
      { componentId: data.startPin.componentId, pinIndex: data.startPin.pinIndex },
      { componentId: data.endPin.componentId, pinIndex: data.endPin.pinIndex },
      points,
    );
    wire.id = data.id;
    wire.current = data.current ?? 0;
    const counterMatch = data.id.match(/wire_(\d+)/);
    if (counterMatch) {
      const num = parseInt(counterMatch[1], 10);
      if (num > wireCounter) wireCounter = num;
    }
    return wire;
  }
}

export const WireFactory = {
  create(startPin: PinRef, endPin: PinRef, points?: Point[]): Wire {
    return new Wire(startPin, endPin, points);
  },
};
