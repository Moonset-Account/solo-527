import { createButton } from '../utils/helpers.js';

const FONT_FAMILY = '"Courier New", monospace';

export class ReplayControls extends Phaser.GameObjects.Container {
  private undoButton: Phaser.GameObjects.Container;
  private resetButton: Phaser.GameObjects.Container;
  private playbackButton: Phaser.GameObjects.Container;
  private undoBg: Phaser.GameObjects.Image;
  private playbackBg: Phaser.GameObjects.Image;
  private playbackLabel: Phaser.GameObjects.Text;
  private isPlaybackMode: boolean = false;

  constructor(
    scene: Phaser.Scene, x: number, y: number,
    onUndo: () => void, onReset: () => void, onPlayback: () => void
  ) {
    super(scene, x, y);

    this.undoButton = createButton(scene, 0, 0, '撤销', 'btn_neutral', onUndo);
    this.add(this.undoButton);

    this.playbackButton = createButton(scene, 120, 0, '回放', 'btn_neutral', () => {
      if (!this.isPlaybackMode) {
        onPlayback();
      }
    });
    this.add(this.playbackButton);

    this.resetButton = createButton(scene, 240, 0, '重置', 'btn_neutral', onReset);
    this.add(this.resetButton);

    this.undoBg = this.undoButton.getAt(0) as Phaser.GameObjects.Image;
    this.playbackBg = this.playbackButton.getAt(0) as Phaser.GameObjects.Image;
    this.playbackLabel = this.playbackButton.getAt(1) as Phaser.GameObjects.Text;
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

  setPlaybackEnabled(enabled: boolean) {
    if (enabled) {
      this.playbackBg.clearTint();
      this.playbackBg.setAlpha(1);
      this.playbackButton.setAlpha(1);
    } else {
      this.playbackBg.setTint(0x555555);
      this.playbackButton.setAlpha(0.5);
    }
  }

  setPlaybackMode(active: boolean) {
    this.isPlaybackMode = active;
    if (active) {
      this.playbackLabel.setText('停止回放');
      this.playbackBg.setTint(0x22c55e);
    } else {
      this.playbackLabel.setText('回放');
      this.playbackBg.clearTint();
    }
  }
}
