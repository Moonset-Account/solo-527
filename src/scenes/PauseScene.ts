import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { AudioSystem } from '@/systems/AudioSystem';
import { SettingsData } from '@/systems/SaveSystem';

export class PauseScene extends Phaser.Scene {
  private audioSys!: AudioSystem;
  private container!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'pause' });
  }

  create(): void {
    this.audioSys = new AudioSystem(this);
    const cx = GameConfig.CANVAS_WIDTH / 2;
    const cy = GameConfig.CANVAS_HEIGHT / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    this.container = this.add.container(cx, cy);

    const w = 360;
    const h = 440;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(GameConfig.Colors.SHADOW, 0.85);
    panelBg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    panelBg.fillStyle(GameConfig.Colors.BG_FLOOR, 1);
    panelBg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 14);
    panelBg.lineStyle(2, GameConfig.Colors.ACCENT, 0.5);
    panelBg.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 14);

    const title = this.add.text(0, -h / 2 + 48, '游戏暂停', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const btnResume = this.makeButton(0, -160, 220, 48, '继续游戏', () => {
      this.audioSys.destroy();
      this.scene.resume('game');
      this.scene.stop();
    });

    const btnRestart = this.makeButton(0, -100, 220, 48, '重新开始', () => {
      this.audioSys.destroy();
      this.scene.stop('game');
      this.scene.start('game');
      this.scene.stop();
    });

    const btnSettings = this.makeButton(0, -40, 220, 48, '音量设置', () => {
      this.scene.launch('settings');
      this.scene.pause();
    });

    const btnMenu = this.makeButton(0, 20, 220, 48, '返回主菜单', () => {
      this.audioSys.destroy();
      this.scene.stop('game');
      this.scene.start('level_select');
      this.scene.stop();
    });

    const tip = this.add.text(0, h / 2 - 40, '按 P 或 ESC 继续', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    this.container.add([panelBg, title, btnResume, btnRestart, btnSettings, btnMenu, tip]);
    this.container.setAlpha(0);
    this.tweens.add({
      targets: this.container,
      alpha: 1,
      y: cy,
      duration: 250,
      ease: 'Cubic.easeOut',
    });

    const esc = this.input.keyboard?.addKey('ESC');
    esc?.once('down', () => {
      this.audioSys.destroy();
      this.scene.resume('game');
      this.scene.stop();
    });
    const p = this.input.keyboard?.addKey('P');
    p?.once('down', () => {
      this.audioSys.destroy();
      this.scene.resume('game');
      this.scene.stop();
    });
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
      fontSize: '16px',
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
      cont.setScale(1.04);
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

  updateSettingsForGame(settings: SettingsData): void {
    this.audioSys.updateSettings(settings);
  }

  shutdown(): void {
    this.audioSys?.destroy();
  }
}
