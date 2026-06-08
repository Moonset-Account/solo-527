import Phaser from 'phaser';

export class SceneManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  switchTo(key: string, data?: object): void {
    this.scene.cameras.main.fadeOut(300, 0, 0, 0);
    this.scene.time.delayedCall(300, () => {
      this.scene.scene.start(key, data);
    });
  }

  overlay(key: string, data?: object): void {
    this.scene.scene.launch(key, data);
  }

  closeOverlay(key: string): void {
    this.scene.scene.stop(key);
  }
}
