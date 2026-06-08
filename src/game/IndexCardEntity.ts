import Phaser from 'phaser';
import { Point, IndexCardData } from '@core/types';
import { COLORS } from '@config/constants';
import { gridToWorld } from '@core/utils';

export class IndexCardEntity {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private cardId: string;
  private data: IndexCardData;
  private tileSize: number;
  private cardGraphics: Phaser.GameObjects.Graphics;
  private overlay: Phaser.GameObjects.Graphics;
  private indicator: Phaser.GameObjects.Graphics;
  private stateLabel: Phaser.GameObjects.Text;
  private rotationTween: Phaser.Tweens.Tween | null = null;
  private isFixed: boolean = false;
  private shimmerTween: Phaser.Tweens.Tween | null = null;

  constructor(
    scene: Phaser.Scene,
    data: IndexCardData,
    tileSize: number
  ) {
    this.scene = scene;
    this.data = { ...data };
    this.cardId = data.id;
    this.tileSize = tileSize;

    const worldPos = gridToWorld(data.position.x, data.position.y, tileSize);

    this.container = scene.add.container(worldPos.x, worldPos.y);
    this.container.setDepth(25);

    this.cardGraphics = scene.add.graphics();
    this.overlay = scene.add.graphics();
    this.indicator = scene.add.graphics();

    this.drawCard();
    this.drawOverlay();
    this.drawIndicator();

    const s = this.tileSize;
    const fontSize = Math.max(8, Math.floor(s * 0.16));
    this.stateLabel = scene.add.text(0, s * 0.36, '索引卡', {
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      color: this.isFixed ? '#6bff9f' : '#ff6b6b'
    });
    this.stateLabel.setOrigin(0.5);

    this.container.add([this.cardGraphics, this.overlay, this.indicator, this.stateLabel]);

    if (!this.isFixed) {
      this.startBrokenAnimation();
    }

    this.setupInteraction();
  }

  private drawCard(): void {
    this.cardGraphics.clear();
    const s = this.tileSize;

    const cardW = s * 0.5;
    const cardH = s * 0.62;
    const r = s * 0.06;

    this.cardGraphics.fillStyle(COLORS.indexCard, 0.95);
    this.cardGraphics.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, r);

    this.cardGraphics.lineStyle(s * 0.03, this.isFixed ? COLORS.indexCardFixed : COLORS.indexCardBroken, 0.6);
    this.cardGraphics.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, r);

    const lineColors = [0x333333, 0x333333, 0x333333, 0x333333, 0x333333];
    lineColors.forEach((color, i) => {
      const y = -cardH * 0.3 + i * s * 0.09;
      const width = i % 2 === 0 ? cardW * 0.7 : cardW * 0.55;
      this.cardGraphics.fillStyle(color, 0.4);
      this.cardGraphics.fillRect(-cardW / 2 + cardW * 0.12, y, width, s * 0.025);
    });
  }

  private drawOverlay(): void {
    this.overlay.clear();
    const s = this.tileSize;

    if (!this.isFixed) {
      const cardW = s * 0.5;
      const cardH = s * 0.62;

      this.overlay.lineStyle(s * 0.04, COLORS.indexCardBroken, 0.9);
      
      this.overlay.beginPath();
      this.overlay.moveTo(-cardW * 0.3, -cardH * 0.3);
      this.overlay.lineTo(cardW * 0.1, -cardH * 0.05);
      this.overlay.lineTo(-cardW * 0.15, cardH * 0.15);
      this.overlay.lineTo(cardW * 0.25, cardH * 0.35);
      this.overlay.strokePath();

      this.overlay.fillStyle(COLORS.indexCardBroken, 0.2);
      this.overlay.fillTriangle(-cardW * 0.3, -cardH * 0.3, cardW * 0.1, -cardH * 0.05, -cardW * 0.15, cardH * 0.15);
    }
  }

  private drawIndicator(): void {
    this.indicator.clear();
    const s = this.tileSize;
    const color = this.isFixed ? COLORS.indexCardFixed : COLORS.indexCardBroken;

    this.indicator.fillStyle(color, 0.9);
    const ringSize = s * 0.08;
    
    this.indicator.fillCircle(-s * 0.3, -s * 0.25, ringSize);
  }

  private startBrokenAnimation(): void {
    this.rotationTween = this.scene.tweens.add({
      targets: this.container,
      rotation: { from: -0.08, to: 0.08 },
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private setupInteraction(): void {
    const s = this.tileSize;
    this.container.setSize(s * 0.6, s * 0.7);
    this.container.setInteractive();

    this.container.on('pointerover', () => {
      this.container.setScale(1.1);
    });

    this.container.on('pointerout', () => {
      this.container.setScale(1);
    });
  }

  public fix(onComplete?: () => void): void {
    if (this.isFixed) return;
    this.isFixed = true;

    if (this.rotationTween) {
      this.rotationTween.stop();
    }

    this.scene.tweens.add({
      targets: this.container,
      rotation: 0,
      scale: 1.4,
      duration: 250,
      ease: 'Back.easeOut',
      yoyo: true
    });

    this.drawCard();
    this.drawOverlay();
    this.drawIndicator();

    this.stateLabel.setText('✓ 已修复');
    this.stateLabel.setColor('#6bff9f');

    this.startShimmer();

    this.scene.time.delayedCall(350, () => onComplete?.());
  }

  private startShimmer(): void {
    const s = this.tileSize;
    const shimmer = this.scene.add.graphics();
    shimmer.fillStyle(0xffffff, 0.8);

    this.scene.tweens.add({
      targets: shimmer,
      x: s * 0.5,
    });
  }

  public pulse(): void {
    this.scene.tweens.add({
      targets: this.container,
      scale: 1.25,
      duration: 180,
      ease: 'Cubic.easeOut',
      yoyo: true
    });
  }

  public shake(): void {
    const originalX = this.container.x;
    this.scene.tweens.add({
      targets: this.container,
      x: originalX + this.tileSize * 0.05,
      duration: 50,
      ease: 'Linear',
      yoyo: true,
      repeat: 3
    });
  }

  public getId(): string {
    return this.cardId;
  }

  public getData(): IndexCardData {
    return { ...this.data };
  }

  public getPosition(): Point {
    return { ...this.data.position };
  }

  public isCardFixed(): boolean {
    return this.isFixed;
  }

  public getRequiredClueIds(): string[] {
    return [...this.data.requiredClueIds];
  }

  public getBookId(): string {
    return this.data.bookId;
  }

  public update(time: number): void {}

  public destroy(): void {
    this.container.destroy();
  }

  public updateTileSize(newTileSize: number): void {
    this.tileSize = newTileSize;
    const worldPos = gridToWorld(this.data.position.x, this.data.position.y, this.tileSize);
    this.container.setPosition(worldPos.x, worldPos.y);
    this.drawCard();
    this.drawOverlay();
    this.drawIndicator();

    const s = this.tileSize;
    const fontSize = Math.max(8, Math.floor(s * 0.16));
    this.stateLabel.setFontSize(`${fontSize}px`);
    this.stateLabel.setY(s * 0.36);
  }
}
