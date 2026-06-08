import Phaser from 'phaser';
import { Point, Direction } from '@core/types';
import { COLORS } from '@config/constants';
import { gridToWorld } from '@core/utils';

export class PlayerEntity {
  public sprite: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private bodySprite!: Phaser.GameObjects.Graphics;
  private shadowSprite!: Phaser.GameObjects.Graphics;
  private directionIndicator!: Phaser.GameObjects.Graphics;
  private tileSize: number;
  private currentWorldPos: Point;
  private targetWorldPos: Point;
  private isMoving: boolean = false;
  private moveTween: Phaser.Tweens.Tween | null = null;
  private currentDirection: Direction = 'down';
  private animationDuration: number = 200;
  private bobbingTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, startPos: Point, tileSize: number, animationDuration: number) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.animationDuration = animationDuration;

    const startWorld = gridToWorld(startPos.x, startPos.y, tileSize);
    this.currentWorldPos = { ...startWorld };
    this.targetWorldPos = { ...startWorld };

    this.sprite = scene.add.container(startWorld.x, startWorld.y);
    this.sprite.setDepth(100);

    this.createGraphics();
    this.startBobbingAnimation();
  }

  private createGraphics(): void {
    this.shadowSprite = this.scene.add.graphics();
    this.shadowSprite.fillStyle(0x000000, 0.3);
    this.shadowSprite.fillEllipse(0, this.tileSize * 0.2, this.tileSize * 0.5, this.tileSize * 0.15);

    this.bodySprite = this.scene.add.graphics();
    this.drawBody();

    this.directionIndicator = this.scene.add.graphics();
    this.drawDirectionIndicator();

    this.sprite.add([this.shadowSprite, this.bodySprite, this.directionIndicator]);
  }

  private drawBody(): void {
    this.bodySprite.clear();
    
    const s = this.tileSize * 0.18;

    this.bodySprite.fillStyle(COLORS.playerDark, 1);
    this.bodySprite.fillRoundedRect(-s, -s * 1.8, s * 2, s * 2.4, s * 0.4);
    
    this.bodySprite.fillStyle(COLORS.player, 1);
    this.bodySprite.fillRoundedRect(-s * 0.9, -s * 1.7, s * 1.8, s * 2, s * 0.3);
    
    this.bodySprite.fillStyle(COLORS.player, 1);
    this.bodySprite.fillCircle(0, -s * 2.2, s * 0.8);

    this.bodySprite.fillStyle(0xffffff, 1);
    this.bodySprite.fillCircle(-s * 0.35, -s * 2.3, s * 0.18);
    this.bodySprite.fillCircle(s * 0.35, -s * 2.3, s * 0.18);
    
    this.bodySprite.fillStyle(0x1a1a2e, 1);
    this.bodySprite.fillCircle(-s * 0.3, -s * 2.28, s * 0.1);
    this.bodySprite.fillCircle(s * 0.4, -s * 2.28, s * 0.1);
    
    this.bodySprite.fillStyle(COLORS.wallDark, 1);
    this.bodySprite.fillRoundedRect(-s * 1.1, -s * 0.9, s * 0.4, s * 0.8, s * 0.15);
    this.bodySprite.fillRoundedRect(s * 0.7, -s * 0.9, s * 0.4, s * 0.8, s * 0.15);
  }

  private drawDirectionIndicator(): void {
    this.directionIndicator.clear();
    const s = this.tileSize * 0.15;
    this.directionIndicator.fillStyle(COLORS.accent, 0.5);

    let offsetX = 0, offsetY = 0;
    switch (this.currentDirection) {
      case 'up': offsetY = -this.tileSize * 0.3; break;
      case 'down': offsetY = this.tileSize * 0.3; break;
      case 'left': offsetX = -this.tileSize * 0.3; break;
      case 'right': offsetX = this.tileSize * 0.3; break;
    }
    this.directionIndicator.fillCircle(offsetX, offsetY, s);
  }

  private startBobbingAnimation(): void {
    if (this.bobbingTween) this.bobbingTween.remove();
    
    this.bobbingTween = this.scene.tweens.add({
      targets: this.bodySprite,
      y: this.tileSize * 0.02,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  moveTo(gridPos: Point, direction: Direction, onComplete?: () => void): void {
    if (this.isMoving) {
      if (this.moveTween) this.moveTween.stop();
    }

    this.isMoving = true;
    this.currentDirection = direction;
    this.drawDirectionIndicator();

    const targetWorld = gridToWorld(gridPos.x, gridPos.y, this.tileSize);
    this.targetWorldPos = { ...targetWorld };

    if (this.bobbingTween) this.bobbingTween.pause();
    this.bodySprite.setY(0);

    this.moveTween = this.scene.tweens.add({
      targets: this.sprite,
      x: targetWorld.x,
      y: targetWorld.y,
      duration: this.animationDuration,
      ease: 'Sine.easeOut',
      onUpdate: (tween, target, key) => {
        const progress = tween.progress;
        if (progress < 0.5) {
          this.bodySprite.setY(-Math.sin(progress * Math.PI) * this.tileSize * 0.08);
        }
      },
      onComplete: () => {
        this.currentWorldPos = { ...targetWorld };
        this.isMoving = false;
        this.bodySprite.setY(0);
        this.startBobbingAnimation();
        onComplete?.();
      }
    });

    this.scene.tweens.add({
      targets: this.shadowSprite,
      scale: 0.95,
      duration: this.animationDuration / 2,
      ease: 'Sine.easeInOut',
      yoyo: true
    });
  }

  pushAnimation(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.08,
      duration: this.animationDuration / 3,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete
    });
  }

  bumpAnimation(direction: Direction, onComplete?: () => void): void {
    const offset = this.tileSize * 0.1;
    let dx = 0, dy = 0;
    switch (direction) {
      case 'up': dy = -offset; break;
      case 'down': dy = offset; break;
      case 'left': dx = -offset; break;
      case 'right': dx = offset; break;
    }

    const originalX = this.sprite.x;
    const originalY = this.sprite.y;

    this.scene.tweens.add({
      targets: this.sprite,
      x: originalX + dx,
      y: originalY + dy,
      duration: this.animationDuration / 3,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete
    });
  }

  collectAnimation(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 1, to: 0.6 },
      duration: 200,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete
    });
    
    try {
      this.sprite.postFX?.addGlow?.(COLORS.success, 0.3, 16);
    } catch (e) {
      // Ignore FX errors
    }
    this.scene.time.delayedCall(400, () => {
      try {
        this.sprite.postFX?.clear?.();
      } catch (e) {}
    });
  }

  failAnimation(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.5 },
      duration: 100,
      repeat: 4,
      yoyo: true,
      onComplete: () => {
        onComplete?.();
      }
    });
  }

  winAnimation(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      scale: 1.3,
      duration: 600,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete: () => {
        this.sprite.setAngle(0);
        this.sprite.setScale(1);
        onComplete?.();
      }
    });
  }

  getGridPosition(): Point {
    return {
      x: Math.floor(this.sprite.x / this.tileSize),
      y: Math.floor(this.sprite.y / this.tileSize)
    };
  }

  getWorldPosition(): Point {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    };
  }

  getDirection(): Direction {
    return this.currentDirection;
  }

  isInMotion(): boolean {
    return this.isMoving;
  }

  destroy(): void {
    this.moveTween?.stop?.();
    this.bobbingTween?.remove?.();
    this.sprite.destroy();
  }

  updateTileSize(newTileSize: number): void {
    this.tileSize = newTileSize;
    this.shadowSprite.clear();
    this.shadowSprite.fillStyle(0x000000, 0.3);
    this.shadowSprite.fillEllipse(0, this.tileSize * 0.2, this.tileSize * 0.5, this.tileSize * 0.15);
    this.drawBody();
    this.drawDirectionIndicator();

    const gridPos = this.getGridPosition();
    const worldPos = gridToWorld(gridPos.x, gridPos.y, this.tileSize);
    this.sprite.setPosition(worldPos.x, worldPos.y);
  }
}
