import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';
import { SaveSystem } from '@/systems/SaveSystem';

export class SettingsScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private sliders: { key: string; text: Phaser.GameObjects.Text; bar: Phaser.GameObjects.Rectangle; handle: Phaser.GameObjects.Container; value: number }[] = [];
  private selectedIndex: number = 0;
  private items: string[] = ['masterVolume', 'bgmVolume', 'sfxVolume', 'fullscreen', 'back'];
  private fromScene: string = 'MainMenuScene';
  private dragging: boolean = false;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(data: { from?: string }): void {
    this.saveSystem = this.game.registry.get('saveSystem');
    this.fromScene = data.from || 'MainMenuScene';

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 500, 440, COLORS.panel, 0.95);
    panel.setStrokeStyle(2, COLORS.accent, 0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180, '设置', {
      fontSize: '28px', fontFamily: 'serif', color: '#e6a817',
    }).setOrigin(0.5);

    const settings = this.saveSystem.getSettings();
    this.createSlider('主音量', 'masterVolume', settings.masterVolume, GAME_HEIGHT / 2 - 100);
    this.createSlider('背景音乐', 'bgmVolume', settings.bgmVolume, GAME_HEIGHT / 2 - 30);
    this.createSlider('音效', 'sfxVolume', settings.sfxVolume, GAME_HEIGHT / 2 + 40);

    this.createToggle('全屏', 'fullscreen', settings.fullscreen, GAME_HEIGHT / 2 + 110);

    const backBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, '返回', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.goBack());
    backBtn.on('pointerover', () => backBtn.setColor('#e6a817'));

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
      this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
      this.input.keyboard.on('keydown-LEFT', () => this.adjustValue(-0.1));
      this.input.keyboard.on('keydown-RIGHT', () => this.adjustValue(0.1));
      this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
      this.input.keyboard.on('keydown-ESC', () => this.goBack());
    }

    this.updateSelection();
  }

  private createSlider(label: string, key: string, value: number, y: number): void {
    const cx = GAME_WIDTH / 2;

    this.add.text(cx - 200, y, label, {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0, 0.5);

    const barBg = this.add.rectangle(cx + 20, y, 240, 8, 0x4a4a6a);
    const bar = this.add.rectangle(cx + 20 - 120 + 120 * value, y, 240 * value, 8, COLORS.accent);
    bar.setOrigin(0, 0.5);

    const handle = this.add.container(cx + 20 - 120 + 240 * value, y);
    const handleCircle = this.add.circle(0, 0, 10, COLORS.accent);
    handle.add(handleCircle);
    handle.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
    handle.setDepth(5);

    this.input.setDraggable(handle);
    handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const minX = cx + 20 - 120;
      const maxX = cx + 20 + 120;
      const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
      handle.x = clampedX;
      const newValue = (clampedX - minX) / 240;
      bar.width = 240 * newValue;
      bar.x = minX;
      this.updateSetting(key, newValue);
    });

    const valueText = this.add.text(cx + 160, y, `${Math.round(value * 100)}%`, {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#e6a817',
    }).setOrigin(0, 0.5);

    this.sliders.push({ key, text: valueText, bar, handle, value });
  }

  private createToggle(label: string, key: string, value: boolean, y: number): void {
    const cx = GAME_WIDTH / 2;

    this.add.text(cx - 200, y, label, {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0, 0.5);

    const toggleBg = this.add.rectangle(cx + 20, y, 60, 28, value ? COLORS.success : 0x4a4a6a, 0.8);
    toggleBg.setStrokeStyle(1, 0xffffff, 0.3);

    const toggleText = this.add.text(cx + 20, y, value ? '开' : '关', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#ffffff',
    }).setOrigin(0.5);

    const toggleContainer = this.add.container(cx + 20, y);
    toggleContainer.add([toggleBg, toggleText]);
    toggleContainer.setSize(60, 28);
    toggleContainer.setInteractive({ useHandCursor: true });
    toggleContainer.on('pointerdown', () => {
      const settings = this.saveSystem.getSettings();
      const newVal = !(settings as any)[key];
      this.saveSystem.updateSettings({ [key]: newVal } as any);
      toggleBg.setFillStyle(newVal ? COLORS.success : 0x4a4a6a);
      toggleText.setText(newVal ? '开' : '关');
      if (key === 'fullscreen') {
        if (newVal) this.scale.startFullscreen();
        else this.scale.stopFullscreen();
      }
    });
  }

  private moveSelection(dir: number): void {
    this.selectedIndex = (this.selectedIndex + dir + this.items.length) % this.items.length;
    this.updateSelection();
  }

  private adjustValue(delta: number): void {
    const key = this.items[this.selectedIndex];
    if (key === 'masterVolume' || key === 'bgmVolume' || key === 'sfxVolume') {
      const settings = this.saveSystem.getSettings();
      const current = (settings as any)[key] as number;
      const newVal = Phaser.Math.Clamp(current + delta, 0, 1);
      this.updateSetting(key, newVal);
      const slider = this.sliders.find(s => s.key === key);
      if (slider) {
        slider.handle.x = GAME_WIDTH / 2 + 20 - 120 + 240 * newVal;
        slider.bar.width = 240 * newVal;
        slider.text.setText(`${Math.round(newVal * 100)}%`);
      }
    }
  }

  private updateSetting(key: string, value: number): void {
    this.saveSystem.updateSettings({ [key]: value } as any);
    const slider = this.sliders.find(s => s.key === key);
    if (slider) {
      slider.value = value;
      slider.text.setText(`${Math.round(value * 100)}%`);
    }
  }

  private confirmSelection(): void {
    const key = this.items[this.selectedIndex];
    if (key === 'back') this.goBack();
    if (key === 'fullscreen') {
      const settings = this.saveSystem.getSettings();
      this.saveSystem.updateSettings({ fullscreen: !settings.fullscreen });
      if (!settings.fullscreen) this.scale.startFullscreen();
      else this.scale.stopFullscreen();
    }
  }

  private updateSelection(): void {
    for (let i = 0; i < this.sliders.length; i++) {
      const slider = this.sliders[i];
      slider.handle.setScale(i === this.selectedIndex ? 1.2 : 1.0);
    }
  }

  private goBack(): void {
    if (this.fromScene === 'PauseScene') {
      this.scene.stop('SettingsScene');
    } else {
      this.scene.start(this.fromScene);
    }
  }
}
