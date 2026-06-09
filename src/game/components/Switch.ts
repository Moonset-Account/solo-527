import { BaseCircuitComponent, PortOffset } from './BaseComponent';

export class Switch extends BaseCircuitComponent {
  getPortLocalOffsets(): PortOffset[] {
    const { w } = this.getSize();
    return [
      { index: 0, offset: { x: -w / 2, y: 0 } },
      { index: 1, offset: { x: w / 2, y: 0 } },
    ];
  }

  getSize(): { w: number; h: number } {
    return { w: 70, h: 35 };
  }

  toggle(): void {
    const current = this.getProperty<boolean>('closed');
    this.setProperty('closed', !current);
  }

  getRenderOutline(canvasCtx: CanvasRenderingContext2D): void {
    const { w } = this.getSize();
    const closed = this.getProperty<boolean>('closed');
    const nodeR = 5;
    const leverLen = w * 0.5;

    canvasCtx.save();

    canvasCtx.fillStyle = '#4ADE80';
    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 2;

    canvasCtx.beginPath();
    canvasCtx.arc(-w / 2 + nodeR, 0, nodeR, 0, Math.PI * 2);
    canvasCtx.fill();
    canvasCtx.stroke();

    canvasCtx.beginPath();
    canvasCtx.arc(w / 2 - nodeR, 0, nodeR, 0, Math.PI * 2);
    canvasCtx.fill();
    canvasCtx.stroke();

    canvasCtx.strokeStyle = closed ? '#22C55E' : '#EF4444';
    canvasCtx.lineWidth = 3;
    const startX = -w / 2 + nodeR;
    const endX = w / 2 - nodeR;
    if (closed) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(startX, 0);
      canvasCtx.lineTo(endX, 0);
      canvasCtx.stroke();
    } else {
      const angle = Math.PI / 6;
      const leverEndX = startX + leverLen * Math.cos(angle);
      const leverEndY = -leverLen * Math.sin(angle);
      canvasCtx.beginPath();
      canvasCtx.moveTo(startX, 0);
      canvasCtx.lineTo(leverEndX, leverEndY);
      canvasCtx.stroke();
    }

    canvasCtx.restore();
  }
}
