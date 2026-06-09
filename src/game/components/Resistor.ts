import { BaseCircuitComponent, PortOffset } from './BaseComponent';

export class Resistor extends BaseCircuitComponent {
  getPortLocalOffsets(): PortOffset[] {
    const { w } = this.getSize();
    return [
      { index: 0, offset: { x: -w / 2, y: 0 } },
      { index: 1, offset: { x: w / 2, y: 0 } },
    ];
  }

  getSize(): { w: number; h: number } {
    return { w: 70, h: 30 };
  }

  getRenderOutline(canvasCtx: CanvasRenderingContext2D): void {
    const { w, h } = this.getSize();
    const bodyW = w * 0.6;
    const bodyH = h * 0.6;

    canvasCtx.save();
    canvasCtx.strokeStyle = '#8B4513';
    canvasCtx.fillStyle = '#D2B48C';
    canvasCtx.lineWidth = 2;

    canvasCtx.beginPath();
    canvasCtx.roundRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, 4);
    canvasCtx.fill();
    canvasCtx.stroke();

    const bands = ['#000', '#8B4513', '#8B4513', '#FFD700'];
    const bandCount = bands.length;
    const bandGap = bodyW / (bandCount + 1);
    const bandW = 3;
    bands.forEach((color, i) => {
      canvasCtx.fillStyle = color;
      const x = -bodyW / 2 + bandGap * (i + 1) - bandW / 2;
      canvasCtx.fillRect(x, -bodyH / 2, bandW, bodyH);
    });

    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    canvasCtx.moveTo(-w / 2, 0);
    canvasCtx.lineTo(-bodyW / 2, 0);
    canvasCtx.moveTo(bodyW / 2, 0);
    canvasCtx.lineTo(w / 2, 0);
    canvasCtx.stroke();

    canvasCtx.restore();
  }
}
