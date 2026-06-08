import Phaser from 'phaser';

export interface InputAction {
  key: string;
  callback: () => void;
}

export class InputMapper {
  private scene: Phaser.Scene;
  private bindings: Map<string, InputAction> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scene.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      const action = this.bindings.get(event.key.toLowerCase());
      if (action) action.callback();
    });
  }

  bind(key: string, callback: () => void): void {
    this.bindings.set(key.toLowerCase(), { key, callback });
  }

  unbind(key: string): void {
    this.bindings.delete(key.toLowerCase());
  }

  unbindAll(): void {
    this.bindings.clear();
  }
}
