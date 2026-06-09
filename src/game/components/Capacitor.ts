import { BaseCircuitComponent, PortOffset } from './BaseComponent';

export class Capacitor extends BaseCircuitComponent {
  getPortLocalOffsets(): PortOffset[] {
    const { w } = this.getSize();
    return [
      { index: 0, offset: { x: -w / 2, y: 0 } },
      { index: 1, offset: { x: w / 2, y: 0 } },
    ];
  }

  getSize(): { w: number; h: number } {
    return { w: 60, h: 40 };
  }

  getRenderOutline(canvasCtx: CanvasRenderingContext2D): void {
    const { w, h } = this.getSize();
    const plateH = h * 0.8;
    const gap = w * 0.15;
    const plateW = 2;

    canvasCtx.save();
    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 2;

    canvasCtx.beginPath();
    canvasCtx.moveTo(-w / 2, 0);
    canvasCtx.lineTo(-gap / 2 - plateW / 2, 0);
    canvasCtx.moveTo(gap / 2 + plateW / 2, 0);
    canvasCtx.lineTo(w / 2, 0);
    canvasCtx.stroke();

    canvasCtx.strokeStyle = '#9333EA';
    canvasCtx.lineWidth = 4;
    canvasCtx.beginPath();
    canvasCtx.moveTo(-gap / 2 - plateW / 2, -plateH / 2);
    canvasCtx.lineTo(-gap / 2 - plateW / 2, plateH / 2);
    canvasCtx.moveTo(gap / 2 + plateW / 2, -plateH / 2);
    canvasCtx.lineTo(gap / 2 + plateW / 2, plateH / 2);
    canvasCtx.stroke();

    canvasCtx.restore();
  }
}
