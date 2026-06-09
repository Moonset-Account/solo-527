import { BaseCircuitComponent, PortOffset } from './BaseComponent';

export class Bulb extends BaseCircuitComponent {
  getPortLocalOffsets(): PortOffset[] {
    const { w } = this.getSize();
    return [
      { index: 0, offset: { x: -w / 2, y: 0 } },
      { index: 1, offset: { x: w / 2, y: 0 } },
    ];
  }

  getSize(): { w: number; h: number } {
    return { w: 50, h: 50 };
  }

  getRenderOutline(canvasCtx: CanvasRenderingContext2D): void {
    const { w, h } = this.getSize();
    const radius = Math.min(w, h) * 0.4;

    canvasCtx.save();

    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    canvasCtx.moveTo(-w / 2, 0);
    canvasCtx.lineTo(-radius, 0);
    canvasCtx.moveTo(radius, 0);
    canvasCtx.lineTo(w / 2, 0);
    canvasCtx.stroke();

    canvasCtx.fillStyle = '#FEF3C7';
    canvasCtx.strokeStyle = '#B45309';
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    canvasCtx.arc(0, 0, radius, 0, Math.PI * 2);
    canvasCtx.fill();
    canvasCtx.stroke();

    canvasCtx.strokeStyle = '#92400E';
    canvasCtx.lineWidth = 1.5;
    canvasCtx.beginPath();
    canvasCtx.moveTo(-radius * 0.4, -radius * 0.2);
    canvasCtx.lineTo(-radius * 0.2, radius * 0.3);
    canvasCtx.lineTo(0, -radius * 0.2);
    canvasCtx.lineTo(radius * 0.2, radius * 0.3);
    canvasCtx.lineTo(radius * 0.4, -radius * 0.2);
    canvasCtx.stroke();

    canvasCtx.restore();
  }
}
