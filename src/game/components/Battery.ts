import { BaseCircuitComponent, PortOffset } from './BaseComponent';

export class Battery extends BaseCircuitComponent {
  getPortLocalOffsets(): PortOffset[] {
    const { w } = this.getSize();
    return [
      { index: 0, offset: { x: -w / 2, y: 0 }, label: '-' },
      { index: 1, offset: { x: w / 2, y: 0 }, label: '+' },
    ];
  }

  getSize(): { w: number; h: number } {
    return { w: 80, h: 50 };
  }

  getRenderOutline(canvasCtx: CanvasRenderingContext2D): void {
    const { w, h } = this.getSize();
    const lineLen = h * 0.7;
    const gap = w * 0.08;
    const thickW = w * 0.12;
    const thinW = w * 0.05;

    canvasCtx.save();
    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 2;

    canvasCtx.beginPath();
    canvasCtx.moveTo(-thickW / 2 - gap - thinW / 2, -lineLen / 2);
    canvasCtx.lineTo(-thickW / 2 - gap - thinW / 2, lineLen / 2);
    canvasCtx.stroke();

    canvasCtx.lineWidth = 4;
    canvasCtx.beginPath();
    canvasCtx.moveTo(thickW / 2 + gap + thinW / 2, -h / 2);
    canvasCtx.lineTo(thickW / 2 + gap + thinW / 2, h / 2);
    canvasCtx.stroke();

    canvasCtx.restore();
  }
}
