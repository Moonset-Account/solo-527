import { createButton } from '../utils/helpers.js';

const FONT_FAMILY = '"Courier New", monospace';

export class ReplayControls extends Phaser.GameObjects.Container {
  private undoButton: Phaser.GameObjects.Container;
  private resetButton: Phaser.GameObjects.Container;
  private undoBg: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, onUndo: () => void, onReset: () => void) {
    super(scene, x, y);

    this.undoButton = createButton(scene, 0, 0, '撤销', 'btn_neutral', onUndo);
    this.add(this.undoButton);

    this.resetButton = createButton(scene, 120, 0, '重置', 'btn_neutral', onReset);
    this.add(this.resetButton);

    this.undoBg = this.undoButton.getAt(0) as Phaser.GameObjects.Image;
  }

  setUndoEnabled(enabled: boolean) {
    if (enabled) {
      this.undoBg.clearTint();
      this.undoBg.setAlpha(1);
      this.undoButton.setAlpha(1);
    } else {
      this.undoBg.setTint(0x555555);
      this.undoButton.setAlpha(0.5);
    }
  }
}
