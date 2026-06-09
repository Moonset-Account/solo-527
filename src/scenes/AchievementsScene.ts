import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { AudioSystem } from '@/systems/AudioSystem';
import { AchievementSystem, Achievement } from '@/systems/AchievementSystem';

export class AchievementsScene extends Phaser.Scene {
  private audioSys!: AudioSystem;

  constructor() {
    super({ key: 'achievements' });
  }

  create(): void {
    this.audioSys = new AudioSystem(this);
    this.cameras.main.setBackgroundColor(`#${GameConfig.Colors.BG_NIGHT.toString(16).padStart(6, '0')}`);

    const cx = GameConfig.CANVAS_WIDTH / 2;

    this.add.text(cx, 40, '成就', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const all = AchievementSystem.loadAll();
    const unlockedCount = all.filter((a) => a.unlocked).length;

    this.add.text(cx, 74, `${unlockedCount} / ${all.length} 已解锁`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${GameConfig.Colors.ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    const barW = 360;
    const barH = 8;
    const barY = 100;
    const barBg = this.add.graphics();
    barBg.fillStyle(GameConfig.Colors.BG_FLOOR_ALT, 1);
    barBg.fillRoundedRect(cx - barW / 2, barY - barH / 2, barW, barH, 4);
    const barFill = this.add.graphics();
    const ratio = all.length > 0 ? unlockedCount / all.length : 0;
    barFill.fillStyle(GameConfig.Colors.ACCENT, 1);
    barFill.fillRoundedRect(cx - barW / 2, barY - barH / 2, barW * ratio, barH, 4);

    const listX = cx;
    let itemY = 140;
    const itemW = 520;
    const itemH = 70;

    for (const ach of all) {
      this.makeAchievementItem(listX, itemY, itemW, itemH, ach);
      itemY += itemH + 10;
    }

    this.makeButton(cx, itemY + 20, 160, 44, '返回', () => {
      this.audioSys.destroy();
      this.scene.start('level_select');
    });
  }

  private makeAchievementItem(
    x: number,
    y: number,
    w: number,
    h: number,
    ach: Achievement
  ): void {
    const cont = this.add.container(x, y);
    const g = this.add.graphics();
    const bgColor = ach.unlocked ? GameConfig.Colors.SUCCESS : GameConfig.Colors.BG_FLOOR_ALT;
    const bgAlpha = ach.unlocked ? 0.35 : 1;
    g.fillStyle(bgColor, bgAlpha);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    if (ach.unlocked) {
      g.lineStyle(2, GameConfig.Colors.SUCCESS, 0.5);
    } else {
      g.lineStyle(1, GameConfig.Colors.TEXT_DIM, 0.3);
    }
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    const iconX = -w / 2 + 40;
    const iconSize = 40;
    const iconBg = this.add.graphics();
    iconBg.fillStyle(ach.unlocked ? GameConfig.Colors.ACCENT : GameConfig.Colors.TEXT_DIM, ach.unlocked ? 0.7 : 0.4);
    iconBg.fillCircle(iconX, 0, iconSize / 2);
    const icon = this.add.text(iconX, 0, ach.icon, {
      fontFamily: 'monospace',
      fontSize: '28px',
    }).setOrigin(0.5).setAlpha(ach.unlocked ? 1 : 0.5);

    const nameX = -w / 2 + 80;
    const nameColor = ach.unlocked ? GameConfig.Colors.TEXT : GameConfig.Colors.TEXT_DIM;
    const name = this.add.text(nameX, -h / 2 + 20, ach.name, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: `#${nameColor.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const desc = this.add.text(nameX, 4, ach.description, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: ach.unlocked
        ? `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`
        : `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
      wordWrap: { width: w - 120 },
    }).setOrigin(0, 0.5);

    if (ach.progress && !ach.unlocked) {
      const progW = 180;
      const progH = 5;
      const progY = h / 2 - 14;
      const progBg = this.add.graphics();
      progBg.fillStyle(GameConfig.Colors.SHADOW, 0.4);
      progBg.fillRoundedRect(nameX, progY - progH / 2, progW, progH, 3);
      const progFill = this.add.graphics();
      const p = ach.progress.total > 0 ? ach.progress.current / ach.progress.total : 0;
      progFill.fillStyle(GameConfig.Colors.ACCENT, 0.8);
      progFill.fillRoundedRect(nameX, progY - progH / 2, progW * p, progH, 3);
      const progText = this.add.text(nameX + progW + 8, progY, `${ach.progress.current}/${ach.progress.total}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
      }).setOrigin(0, 0.5);
      cont.add([progBg, progFill, progText]);
    }

    if (ach.unlocked) {
      const statusX = w / 2 - 24;
      const status = this.add.text(statusX, 0, '✓', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: `#${GameConfig.Colors.SUCCESS.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      cont.add(status);
    }

    cont.add([g, iconBg, icon, name, desc]);
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const cont = this.add.container(x, y);
    const normalColor = GameConfig.Colors.ACCENT;
    const hoverColor = GameConfig.Colors.PLAYER;
    const g = this.add.graphics();
    g.fillStyle(normalColor, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([g, text]);
    cont.setSize(w, h);
    cont.setInteractive({ useHandCursor: true });
    cont.on('pointerover', () => {
      g.clear();
      g.fillStyle(hoverColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.6);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      cont.setScale(1.05);
    });
    cont.on('pointerout', () => {
      g.clear();
      g.fillStyle(normalColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      cont.setScale(1);
    });
    cont.on('pointerdown', () => {
      this.audioSys.playSfx('click');
      onClick();
    });
    return cont;
  }

  shutdown(): void {
    this.audioSys?.destroy();
  }
}
