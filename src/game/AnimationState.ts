import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';

export enum AnimState {
  IDLE = 'IDLE',
  WALKING = 'WALKING',
  PUSHING = 'PUSHING',
  INTERACTING = 'INTERACTING',
  HURT = 'HURT',
  WIN = 'WIN',
}

export enum EntityAnim {
  PLAYER_IDLE = 'PLAYER_IDLE',
  PLAYER_WALK = 'PLAYER_WALK',
  SHELF_PUSH = 'SHELF_PUSH',
  BOOK_FLOAT = 'BOOK_FLOAT',
  CLUE_GLOW = 'CLUE_GLOW',
  CARD_FLIP = 'CARD_FLIP',
}

interface BounceState {
  active: boolean;
  offset: number;
  speed: number;
  time: number;
  baseY: number;
}

interface PulseState {
  active: boolean;
  color: number;
  speed: number;
  time: number;
}

export class AnimationController {
  private sprite: Phaser.GameObjects.GameObject;
  private scene: Phaser.Scene;
  private currentState: AnimState = AnimState.IDLE;
  private loop: boolean = true;
  private bounceState: BounceState = {
    active: false,
    offset: 0,
    speed: 0,
    time: 0,
    baseY: 0,
  };
  private pulseState: PulseState = {
    active: false,
    color: 0xffffff,
    speed: 0,
    time: 0,
  };

  constructor(sprite: Phaser.GameObjects.GameObject, scene: Phaser.Scene) {
    this.sprite = sprite;
    this.scene = scene;
  }

  set(state: AnimState, loop: boolean = true): void {
    this.currentState = state;
    this.loop = loop;
    this.applyStateAnimation();
  }

  update(delta: number): void {
    if (this.bounceState.active) {
      this.bounceState.time += delta;
      const bounceY = Math.sin(this.bounceState.time * 0.001 * this.bounceState.speed) * this.bounceState.offset;
      (this.sprite as Phaser.GameObjects.Sprite).y = this.bounceState.baseY + bounceY;
    }

    if (this.pulseState.active) {
      this.pulseState.time += delta;
      const alpha = 0.5 + Math.sin(this.pulseState.time * 0.001 * this.pulseState.speed) * 0.5;
      this.applyPulse(alpha);
    }
  }

  bounce(floatOffset: number = 4, speed: number = 3): void {
    this.bounceState = {
      active: true,
      offset: floatOffset,
      speed,
      time: 0,
      baseY: (this.sprite as Phaser.GameObjects.Sprite).y,
    };
  }

  pulse(glowColor: number = 0xffffff, speed: number = 4): void {
    this.pulseState = {
      active: true,
      color: glowColor,
      speed,
      time: 0,
    };
  }

  private applyStateAnimation(): void {
    const spriteObj = this.sprite as Phaser.GameObjects.Sprite;
    if (!spriteObj.anims) return;

    let animKey: string | null = null;

    switch (this.currentState) {
      case AnimState.IDLE:
        animKey = EntityAnim.PLAYER_IDLE;
        break;
      case AnimState.WALKING:
        animKey = EntityAnim.PLAYER_WALK;
        break;
      case AnimState.PUSHING:
        animKey = EntityAnim.SHELF_PUSH;
        break;
      case AnimState.INTERACTING:
        animKey = EntityAnim.CARD_FLIP;
        break;
      case AnimState.HURT:
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: { from: 1, to: 0.3 },
          duration: 100,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            (this.sprite as Phaser.GameObjects.Sprite).alpha = 1;
          },
        });
        break;
      case AnimState.WIN:
        this.scene.tweens.add({
          targets: this.sprite,
          scale: { from: 1, to: 1.2 },
          angle: { from: 0, to: 360 },
          duration: 500,
          ease: 'Back.easeOut',
          repeat: this.loop ? -1 : 0,
        });
        break;
    }

    if (animKey && spriteObj.anims.exists(animKey)) {
      spriteObj.anims.play(animKey, this.loop);
    }
  }

  private applyPulse(alpha: number): void {
    if (this.sprite instanceof Phaser.GameObjects.Sprite) {
      const r = (this.pulseState.color >> 16) & 0xff;
      const g = (this.pulseState.color >> 8) & 0xff;
      const b = this.pulseState.color & 0xff;
      const tintColor = Phaser.Display.Color.GetColor(
        Math.floor(r * alpha + 255 * (1 - alpha)),
        Math.floor(g * alpha + 255 * (1 - alpha)),
        Math.floor(b * alpha + 255 * (1 - alpha))
      );
      this.sprite.setTint(tintColor);
    }
  }

  static createFloatAnim(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): void {
    scene.tweens.add({
      targets: sprite,
      y: sprite.y - 6,
      duration: GameConfig.MOVE_DURATION * 1.5,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  static createGlowAnim(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, color: number = 0x9ff0a0): void {
    const startAlpha = 0.6;
    const endAlpha = 1;
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    scene.tweens.add({
      targets: sprite,
      alpha: { from: startAlpha, to: endAlpha },
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        const t = (sprite.alpha - startAlpha) / (endAlpha - startAlpha);
        const tint = Phaser.Display.Color.GetColor(
          Math.floor(r * t + 255 * (1 - t)),
          Math.floor(g * t + 255 * (1 - t)),
          Math.floor(b * t + 255 * (1 - t))
        );
        sprite.setTint(tint);
      },
    });
  }

  static createFlipAnim(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, onComplete?: () => void): void {
    scene.tweens.add({
      targets: sprite,
      scaleX: { from: 1, to: 0 },
      duration: 150,
      ease: 'Quad.easeIn',
      onComplete: () => {
        scene.tweens.add({
          targets: sprite,
          scaleX: { from: 0, to: 1 },
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => onComplete?.(),
        });
      },
    });
  }
}
