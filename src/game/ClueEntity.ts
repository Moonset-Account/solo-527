import Phaser from 'phaser';
import { Point, ClueData } from '@core/types';
import { COLORS } from '@config/constants';
import { gridToWorld } from '@core/utils';

export class ClueEntity {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private clueId: string;
  private data: ClueData;
  private tileSize: number;
  private icon: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text | null = null;
  private hoverTween: Phaser.Tweens.Tween | null = null;
  private isCollected: boolean = false;
  private collectedCallback: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    data: ClueData,
    tileSize: number
  ) {
    this.scene = scene;
    this.data = { ...data };
    this.clueId = data.id;
    this.tileSize = tileSize;

    const worldPos = gridToWorld(data.position.x, data.position.y, tileSize);

    this.container = scene.add.container(worldPos.x, worldPos.y);
    this.container.setDepth(30);

    this.glow = scene.add.graphics();
    this.icon = scene.add.graphics();

    this.drawGlow();
    this.drawIcon();
    this.createLabel();

    this.container.add([this.glow, this.icon]);
    if (this.label) this.container.add(this.label);

    this.startHoverAnimation();
    this.setupInteraction();
  }

  private drawGlow(): void {
    this.glow.clear();
    const s = this.tileSize;
    const time = this.scene.time.now / 600;
    const pulse = Math.sin(time) * 0.3 + 0.7;
    
    this.glow.fillStyle(COLORS.clueGlow, pulse * 0.35);
    this.glow.fillCircle(0, 0, s * 0.38);

    this.glow.lineStyle(s * 0.02, COLORS.clue, pulse * 0.8);
    this.glow.strokeCircle(0, 0, s * 0.35);
  }

  private drawIcon(): void {
    this.icon.clear();
    const s = this.tileSize;

    const cardW = s * 0.3;
    const cardH = s * 0.38;
    const r = s * 0.08;

    this.icon.fillStyle(COLORS.clue, 0.95);
    this.icon.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, r);

    this.icon.fillStyle(0x0a0a14, 0.85);
    const lineY = [-s * 0.12, -s * 0.03, s * 0.06];
    lineY.forEach((y, i) => {
      const lineW = s * (i === 0 ? 0.18 : 0.22);
      this.icon.fillRect(-cardW * 0.7, y, lineW, s * 0.03);
    });
  }

  private createLabel(): void {
    const s = this.tileSize;
    const fontSize = Math.max(8, Math.floor(s * 0.14));
    
    this.label = this.scene.add.text(0, s * 0.38, '?', {
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      color: '#ffd866'
    });
    this.label.setOrigin(0.5);
  }

  private startHoverAnimation(): void {
    this.hoverTween = this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - s * 0.05,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private setupInteraction(): void {
    const s = this.tileSize;
    
    this.container.setSize(s * 0.6, s * 0.6);
    this.container.setInteractive();

    this.container.on('pointerover', () => {
      if (this.isCollected) return;
      this.container.setScale(1.15);
    });

    this.container.on('pointerout', () => {
      this.container.setScale(1);
    });
  }

  public collect(onComplete?: () => void): void {
    if (this.isCollected) return;
    this.isCollected = true;

    this.collectedCallback = onComplete || null;

    if (this.hoverTween) {
      this.hoverTween.stop();
    }

    this.container.disableInteractive();

    this.scene.tweens.add({
      targets: this.container,
      scale: 1.8,
      alpha: 0,
      y: this.container.y - this.tileSize * 0.4,
      duration: 400,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
        onComplete?.();
      }
    });

    this.scene.tweens.add({
      targets: this.glow,
      scale: 2.5,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut'
    });
  }

  public pulse(): void {
    this.scene.tweens.add({
      targets: this.container,
      scale: 1.3,
      duration: 200,
      ease: 'Cubic.easeOut',
      yoyo: true
    });
  }

  public getId(): string {
    return this.clueId;
  }

  public getData(): ClueData {
    return { ...this.data };
  }

  public getPosition(): Point {
    return { ...this.data.position };
  }

  public hasBeenCollected(): boolean {
    return this.isCollected;
  }

  public update(time: number): void {
    if (!this.isCollected) {
      this.drawGlow();
    }
  }

  public destroy(): void {
    this.container.destroy();
  }

  public updateTileSize(newTileSize: number): void {
    this.tileSize = newTileSize;
    const worldPos = gridToWorld(this.data.position.x, this.data.position.y, this.tileSize);
    this.container.setPosition(worldPos.x, worldPos.y);
    this.drawGlow();
    this.drawIcon();
    if (this.label) {
      this.label.setFontSize(Math.max(8, Math.floor(this.tileSize * 0.14)));
      this.label.setY(this.tileSize * 0.38);
    }
  }
}

const s = 1;
