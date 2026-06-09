import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { AudioSystem } from '@/systems/AudioSystem';
import { SaveSystem, SettingsData } from '@/systems/SaveSystem';
import { DailySystem } from '@/systems/DailySystem';
import { AchievementSystem } from '@/systems/AchievementSystem';

export class SettingsScene extends Phaser.Scene {
  private audioSys!: AudioSystem;
  private settings!: SettingsData;
  private playerNameText!: Phaser.GameObjects.Text;
  private confirmResetPopup: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'settings' });
  }

  create(): void {
    this.audioSys = new AudioSystem(this);
    this.settings = SaveSystem.loadSettings();
    this.cameras.main.setBackgroundColor(`#${GameConfig.Colors.BG_NIGHT.toString(16).padStart(6, '0')}`);

    const cx = GameConfig.CANVAS_WIDTH / 2;

    this.add.text(cx, 40, '设置', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    let y = 100;
    const sliderW = 320;
    const sliderH = 10;
    const sliderX = cx;

    y += 40;
    this.addLabel(cx - sliderW / 2, y - 20, '主音量');
    this.makeSlider(sliderX, y, sliderW, sliderH, this.settings.masterVolume, (v) => {
      this.settings.masterVolume = v;
      SaveSystem.updateSettings({ masterVolume: v });
      this.audioSys.updateSettings(this.settings);
    });

    y += 50;
    this.addLabel(cx - sliderW / 2, y - 20, '音效音量');
    this.makeSlider(sliderX, y, sliderW, sliderH, this.settings.sfxVolume, (v) => {
      this.settings.sfxVolume = v;
      SaveSystem.updateSettings({ sfxVolume: v });
      this.audioSys.updateSettings(this.settings);
    }, true);

    y += 50;
    this.addLabel(cx - sliderW / 2, y - 20, '音乐音量');
    this.makeSlider(sliderX, y, sliderW, sliderH, this.settings.musicVolume, (v) => {
      this.settings.musicVolume = v;
      SaveSystem.updateSettings({ musicVolume: v });
      this.audioSys.updateSettings(this.settings);
    });

    y += 60;
    const toggleX = cx - sliderW / 2 + 10;
    this.makeToggle(toggleX, y, '启用音乐', this.settings.enableMusic, (v) => {
      this.settings.enableMusic = v;
      SaveSystem.updateSettings({ enableMusic: v });
      this.audioSys.updateSettings(this.settings);
    });

    y += 42;
    this.makeToggle(toggleX, y, '启用音效', this.settings.enableSfx, (v) => {
      this.settings.enableSfx = v;
      SaveSystem.updateSettings({ enableSfx: v });
      this.audioSys.updateSettings(this.settings);
    });

    y += 42;
    this.makeToggle(toggleX, y, '显示调试信息', this.settings.showDebug, (v) => {
      this.settings.showDebug = v;
      SaveSystem.updateSettings({ showDebug: v });
    });

    y += 42;
    this.makeToggle(toggleX, y, '显示网格', this.settings.showTileGrid, (v) => {
      this.settings.showTileGrid = v;
      SaveSystem.updateSettings({ showTileGrid: v });
    });

    y += 42;
    this.makeToggle(toggleX, y, '移动平滑', this.settings.moveSmoothing, (v) => {
      this.settings.moveSmoothing = v;
      SaveSystem.updateSettings({ moveSmoothing: v });
    });

    y += 60;
    this.add.text(toggleX, y, '玩家名称', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    this.playerNameText = this.add.text(cx - 30, y, DailySystem.getPlayerName(), {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.makeMiniButton(cx + 120, y, 100, 32, '修改', () => {
      const name = prompt('输入新的玩家名称（最多12字符）：', DailySystem.getPlayerName());
      if (name && name.trim().length > 0) {
        DailySystem.setPlayerName(name.trim().slice(0, 12));
        this.playerNameText.setText(DailySystem.getPlayerName());
      }
    });

    y += 60;
    this.makeButton(cx - 100, y, 180, 40, '重置所有存档', () => {
      this.showConfirmReset();
    });

    this.makeButton(cx + 120, y, 100, 40, '返回', () => {
      this.audioSys.destroy();
      const parent = this.scene.get('pause');
      if (parent && parent.scene.isActive()) {
        this.scene.resume('pause');
        this.scene.stop();
      } else {
        this.scene.start('level_select');
      }
    });
  }

  private addLabel(x: number, y: number, text: string): void {
    this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);
  }

  private makeSlider(
    x: number,
    y: number,
    w: number,
    h: number,
    initial: number,
    onChange: (v: number) => void,
    playOnChange: boolean = false
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.Colors.BG_FLOOR_ALT, 1);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 5);
    bg.lineStyle(1, GameConfig.Colors.TEXT_DIM, 0.3);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 5);

    const fill = this.add.graphics();
    const thumbW = 18;
    let value = initial;
    const updateFill = () => {
      fill.clear();
      fill.fillStyle(GameConfig.Colors.ACCENT, 1);
      fill.fillRoundedRect(x - w / 2, y - h / 2, w * value, h, 5);
    };
    updateFill();

    const thumb = this.add.graphics();
    const drawThumb = () => {
      const tx = x - w / 2 + w * value;
      thumb.clear();
      thumb.fillStyle(GameConfig.Colors.TEXT, 1);
      thumb.fillCircle(tx, y, thumbW / 2);
      thumb.fillStyle(GameConfig.Colors.ACCENT, 1);
      thumb.fillCircle(tx, y, thumbW / 2 - 2);
    };
    drawThumb();

    const hitArea = this.add.rectangle(x, y, w, h + 16, 0, 0).setInteractive({ useHandCursor: true });
    let dragging = false;
    const updateFromPointer = (px: number) => {
      const raw = (px - (x - w / 2)) / w;
      value = Phaser.Math.Clamp(raw, 0, 1);
      updateFill();
      drawThumb();
      onChange(value);
    };
    hitArea.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragging = true;
      updateFromPointer(p.x);
      if (playOnChange) this.audioSys.playSfx('move', 0.4);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (dragging) {
        updateFromPointer(p.x);
      }
    });
    this.input.on('pointerup', () => {
      if (dragging && playOnChange) {
        this.audioSys.playSfx('click');
      }
      dragging = false;
    });
  }

  private makeToggle(
    x: number,
    y: number,
    label: string,
    initial: boolean,
    onChange: (v: boolean) => void
  ): void {
    this.add.text(x + 6, y, label, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const w = 44;
    const h = 22;
    const gx = x + 220;
    let value = initial;

    const g = this.add.graphics();
    const draw = () => {
      g.clear();
      g.fillStyle(value ? GameConfig.Colors.SUCCESS : GameConfig.Colors.TEXT_DIM, 0.7);
      g.fillRoundedRect(gx - w / 2, y - h / 2, w, h, 11);
      const circleX = value ? gx + w / 2 - h / 2 : gx - w / 2 + h / 2;
      g.fillStyle(GameConfig.Colors.TEXT, 1);
      g.fillCircle(circleX, y, h / 2 - 2);
    };
    draw();

    const hit = this.add.rectangle(gx, y, w + 10, h + 8, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      value = !value;
      draw();
      this.audioSys.playSfx('click');
      onChange(value);
    });
  }

  private showConfirmReset(): void {
    const cx = GameConfig.CANVAS_WIDTH / 2;
    const cy = GameConfig.CANVAS_HEIGHT / 2;
    const w = 380;
    const h = 220;
    const cont = this.add.container(cx, cy);
    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.Colors.SHADOW, 0.85);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.fillStyle(GameConfig.Colors.BG_FLOOR, 1);
    bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 12);
    bg.lineStyle(2, GameConfig.Colors.DANGER, 0.5);
    bg.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 12);
    const t = this.add.text(0, -h / 2 + 36, '确认重置？', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: `#${GameConfig.Colors.DANGER.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const msg = this.add.text(0, 0, '这将清除所有游戏进度、\n成就和排行榜数据。\n此操作不可撤销！', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);
    const cancelBtn = this.makeMiniButton(-80, h / 2 - 40, 120, 38, '取消', () => {
      this.confirmResetPopup?.destroy();
      this.confirmResetPopup = null;
    });
    const okBtn = this.makeMiniButton(80, h / 2 - 40, 120, 38, '确认重置', () => {
      SaveSystem.resetAll();
      AchievementSystem.reset();
      DailySystem.resetLeaderboard();
      this.confirmResetPopup?.destroy();
      this.confirmResetPopup = null;
      this.audioSys.playSfx('fail');
      this.add.text(cx, cy + 120, '存档已重置', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: `#${GameConfig.Colors.SUCCESS.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
    });
    cont.add([bg, t, msg, cancelBtn, okBtn]);
    this.confirmResetPopup = cont;
  }

  private makeMiniButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const cont = this.add.container(x, y);
    const normalColor = GameConfig.Colors.ACCENT;
    const hoverColor = GameConfig.Colors.PLAYER;
    const g = this.add.graphics();
    g.fillStyle(normalColor, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    g.lineStyle(2, GameConfig.Colors.SHADOW, 0.3);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([g, text]);
    cont.setSize(w, h);
    cont.setInteractive({ useHandCursor: true });
    cont.on('pointerover', () => {
      g.clear();
      g.fillStyle(hoverColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.5);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
      cont.setScale(1.05);
    });
    cont.on('pointerout', () => {
      g.clear();
      g.fillStyle(normalColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.3);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
      cont.setScale(1);
    });
    cont.on('pointerdown', () => {
      this.audioSys.playSfx('click');
      onClick();
    });
    return cont;
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
      fontSize: '14px',
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
