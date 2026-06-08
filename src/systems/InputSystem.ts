import Phaser from 'phaser';
import { Direction } from '@/types';

export class InputSystem {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key } | null = null;
  private lastDirection: Direction | null = null;
  private moveCooldown: number = 0;
  private readonly COOLDOWN_MS = 180;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        w: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  getDirection(): Direction | null {
    if (this.moveCooldown > 0) return null;

    let dir: Direction | null = null;

    if (this.cursors) {
      if (this.cursors.up.isDown) dir = 'up';
      else if (this.cursors.down.isDown) dir = 'down';
      else if (this.cursors.left.isDown) dir = 'left';
      else if (this.cursors.right.isDown) dir = 'right';
    }

    if (!dir && this.wasdKeys) {
      if (this.wasdKeys.w.isDown) dir = 'up';
      else if (this.wasdKeys.s.isDown) dir = 'down';
      else if (this.wasdKeys.a.isDown) dir = 'left';
      else if (this.wasdKeys.d.isDown) dir = 'right';
    }

    if (!dir && this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
      const pad = this.scene.input.gamepad.getPad(0);
      if (pad) {
        if (pad.up) dir = 'up';
        else if (pad.down) dir = 'down';
        else if (pad.left) dir = 'left';
        else if (pad.right) dir = 'right';
        else if (Math.abs(pad.axes[0]?.getValue() || 0) > 0.5 || Math.abs(pad.axes[1]?.getValue() || 0) > 0.5) {
          const hx = pad.axes[0]?.getValue() || 0;
          const hy = pad.axes[1]?.getValue() || 0;
          if (Math.abs(hx) > Math.abs(hy)) {
            dir = hx > 0 ? 'right' : 'left';
          } else {
            dir = hy > 0 ? 'down' : 'up';
          }
        }
      }
    }

    if (dir && dir !== this.lastDirection) {
      this.lastDirection = dir;
      this.moveCooldown = this.COOLDOWN_MS;
      return dir;
    }

    if (!dir) this.lastDirection = null;
    return null;
  }

  update(delta: number): void {
    if (this.moveCooldown > 0) {
      this.moveCooldown = Math.max(0, this.moveCooldown - delta);
    }
  }

  isEscapePressed(): boolean {
    if (!this.scene.input.keyboard) return false;
    return Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC));
  }

  isEnterPressed(): boolean {
    if (!this.scene.input.keyboard) return false;
    return Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER));
  }

  destroy(): void {
    this.cursors = null;
    this.wasdKeys = null;
  }
}
