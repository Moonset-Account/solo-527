import { formatTime } from '../utils/helpers.js';

const FONT_FAMILY = '"Courier New", monospace';

interface MarkerData {
  container: Phaser.GameObjects.Container;
  time: number;
}

export class TimelineBar extends Phaser.GameObjects.Container {
  private barWidth = 800;
  private barHeight = 16;
  private timeLimit: number;
  private currentTime = 0;
  private progressFill: Phaser.GameObjects.Graphics;
  private progressMarker: Phaser.GameObjects.Polygon;
  private timeLabel: Phaser.GameObjects.Text;
  private markers: MarkerData[] = [];
  private bgBar: Phaser.GameObjects.Rectangle;
  private trackArea: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, timeLimit: number) {
    super(scene, x, y);
    this.timeLimit = timeLimit;

    this.bgBar = this.scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x1e293b);
    this.bgBar.setOrigin(0, 0.5);
    this.bgBar.setStrokeStyle(1, 0x334155);
    this.add(this.bgBar);

    this.trackArea = this.scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x0f172a);
    this.trackArea.setOrigin(0, 0.5);
    this.add(this.trackArea);

    this.progressFill = this.scene.add.graphics();
    this.add(this.progressFill);

    this.progressMarker = this.scene.add.polygon(
      0, -this.barHeight / 2 - 4,
      [
        -6, 0,
        6, 0,
        0, 8,
      ],
      0xffffff
    );
    this.progressMarker.setOrigin(0.5, 0);
    this.add(this.progressMarker);

    this.timeLabel = this.scene.add.text(this.barWidth / 2, -this.barHeight / 2 - 18, formatTime(0), {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#94a3b8',
    });
    this.timeLabel.setOrigin(0.5);
    this.add(this.timeLabel);

    this.drawProgress();
  }

  private drawProgress() {
    this.progressFill.clear();

    const progress = this.timeLimit > 0 ? this.currentTime / this.timeLimit : 0;
    const fillWidth = Math.max(0, Math.min(this.barWidth, this.barWidth * progress));

    const steps = Math.ceil(fillWidth);
    for (let i = 0; i < steps; i++) {
      const t = this.barWidth > 0 ? i / this.barWidth : 0;
      const r = Math.round(Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(0x22c55e),
        Phaser.Display.Color.IntegerToColor(0xe63946),
        1,
        t
      ).r * 255);
      const g = Math.round(Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(0x22c55e),
        Phaser.Display.Color.IntegerToColor(0xe63946),
        1,
        t
      ).g * 255);
      const b = Math.round(Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(0x22c55e),
        Phaser.Display.Color.IntegerToColor(0xe63946),
        1,
        t
      ).b * 255);
      this.progressFill.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      this.progressFill.fillRect(i, -this.barHeight / 2, 1, this.barHeight);
    }

    this.progressMarker.setX(fillWidth);
    this.timeLabel.setText(formatTime(this.currentTime));
  }

  setTime(currentTime: number) {
    this.currentTime = Math.max(0, Math.min(currentTime, this.timeLimit));
    this.drawProgress();
  }

  addMarker(time: number, label: string, color: number) {
    const progress = this.timeLimit > 0 ? time / this.timeLimit : 0;
    const xPos = this.barWidth * progress;

    const container = this.scene.add.container(xPos, 0);

    const tick = this.scene.add.rectangle(0, 0, 2, this.barHeight + 8, color);
    tick.setOrigin(0.5);
    container.add(tick);

    const labelText = this.scene.add.text(0, this.barHeight / 2 + 10, label, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: `#${color.toString(16).padStart(6, '0')}`,
    });
    labelText.setOrigin(0.5);
    container.add(labelText);

    this.add(container);
    this.markers.push({ container, time });
  }

  clearMarkers() {
    this.markers.forEach((m) => m.container.destroy());
    this.markers = [];
  }
}
