import { Conflict } from '../data/types.js';

const FONT_FAMILY = '"Courier New", monospace';

const CONFLICT_LABELS: Record<Conflict['type'], string> = {
  same_track: '同轨冲突',
  delay_chain: '晚点连锁',
  platform_occupied: '站台占用',
};

const SEVERITY_COLORS: Record<Conflict['severity'], number> = {
  warning: 0xfbbf24,
  critical: 0xe63946,
};

export class ConflictAlert extends Phaser.GameObjects.Container {
  private alertBg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private typeIcon: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private severityIndicator: Phaser.GameObjects.Rectangle;
  private fadeTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.border = this.scene.add.rectangle(0, 0, 360, 60, 0xe63946);
    this.border.setOrigin(0.5);
    this.border.setStrokeStyle(2, 0xe63946);
    this.border.setVisible(false);
    this.add(this.border);

    this.alertBg = this.scene.add.rectangle(0, 0, 356, 56, 0x1e293b, 0.95);
    this.alertBg.setOrigin(0.5);
    this.alertBg.setVisible(false);
    this.add(this.alertBg);

    this.severityIndicator = this.scene.add.rectangle(-174, 0, 6, 56, 0xe63946);
    this.severityIndicator.setOrigin(0, 0.5);
    this.severityIndicator.setVisible(false);
    this.add(this.severityIndicator);

    this.typeIcon = this.scene.add.text(-156, -8, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f1f5f9',
    });
    this.typeIcon.setVisible(false);
    this.add(this.typeIcon);

    this.messageText = this.scene.add.text(-156, 10, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#cbd5e1',
      wordWrap: { width: 300 },
    });
    this.messageText.setVisible(false);
    this.add(this.messageText);

    this.setVisible(false);
  }

  showConflict(conflict: Conflict) {
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }

    const color = SEVERITY_COLORS[conflict.severity];

    this.border.setStrokeStyle(2, color);
    this.border.setVisible(true);

    this.alertBg.setVisible(true);

    this.severityIndicator.setFillStyle(color);
    this.severityIndicator.setVisible(true);

    this.typeIcon.setText(CONFLICT_LABELS[conflict.type]);
    this.typeIcon.setColor(`#${color.toString(16).padStart(6, '0')}`);
    this.typeIcon.setVisible(true);

    this.messageText.setText(conflict.message);
    this.messageText.setVisible(true);

    this.setAlpha(1);
    this.setVisible(true);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      delay: 2500,
      ease: 'Power2',
      onComplete: () => {
        this.clear();
      },
    });
  }

  clear() {
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
    this.border.setVisible(false);
    this.alertBg.setVisible(false);
    this.severityIndicator.setVisible(false);
    this.typeIcon.setVisible(false);
    this.messageText.setVisible(false);
    this.setAlpha(1);
    this.setVisible(false);
  }
}
