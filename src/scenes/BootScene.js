import Phaser from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '../config/GameConfig.js';
import { AnimationController } from '../systems/AnimationController.js';
import { SoundManager, SFX_TYPES } from '../systems/SoundManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  init() {
    this.animationCtrl = new AnimationController(this);
    this.soundManager = new SoundManager(this);
  }

  preload() {
    const { width, height } = this.scale;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1628);

    const logoContainer = this.add.container(width / 2, height / 2 - 50);
    const logoBg = this.add.rectangle(0, 0, 200, 200, 0x1a2642, 1);
    logoBg.setStrokeStyle(3, 0x4a9eff);
    const trainIcon = this.add.text(0, 0, '🚄', {
      fontFamily: 'Arial',
      fontSize: '96px'
    });
    trainIcon.setOrigin(0.5);
    logoContainer.add([logoBg, trainIcon]);

    const title = this.add.text(width / 2, height / 2 + 100, '铁路调度拼图', {
      fontFamily: 'Arial',
      fontSize: '48px',
      fontStyle: 'bold',
      color: GAME_CONFIG.colors.primary
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 + 160, 'Railway Dispatch Puzzle', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: GAME_CONFIG.colors.textMuted
    });
    subtitle.setOrigin(0.5);

    const progressBg = this.add.rectangle(width / 2, height / 2 + 220, 400, 12, 0x1a2642);
    progressBg.setStrokeStyle(1, 0x4a9eff, 0.5);
    const progressBar = this.add.rectangle(width / 2 - 198, height / 2 + 220, 0, 8, 0x4a9eff);
    progressBar.setOrigin(0, 0.5);

    const loadingText = this.add.text(width / 2, height / 2 + 250, '正在加载资源...', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: GAME_CONFIG.colors.textMuted
    });
    loadingText.setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = 396 * value;
      loadingText.setText(`正在加载资源... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.setText('加载完成！');
    });

    this.createPlaceholderGraphics();
  }

  createPlaceholderGraphics() {
    const colors = GAME_CONFIG.colors;

    const graphics = this.make.graphics({ add: false });

    graphics.fillStyle(0x3d4f6f, 1);
    graphics.fillRoundedRect(0, 0, 300, 60, 6);
    graphics.generateTexture('ui_panel_dark', 300, 60);

    graphics.clear();
    graphics.fillStyle(0x4a9eff, 1);
    graphics.fillRoundedRect(0, 0, 200, 56, 8);
    graphics.generateTexture('btn_primary', 200, 56);

    graphics.clear();
    graphics.fillStyle(0x1a2642, 1);
    graphics.lineStyle(2, 0x4a9eff, 1);
    graphics.strokeRoundedRect(0, 0, 200, 56, 8);
    graphics.generateTexture('btn_secondary', 200, 56);

    graphics.clear();
    graphics.lineStyle(8, 0x3d4f6f, 1);
    graphics.beginPath();
    graphics.moveTo(0, 32);
    graphics.lineTo(128, 32);
    graphics.strokePath();
    graphics.generateTexture('track_horizontal', 128, 64);

    graphics.clear();
    graphics.lineStyle(8, 0x6b8cbf, 1);
    graphics.beginPath();
    graphics.moveTo(0, 32);
    graphics.lineTo(128, 32);
    graphics.strokePath();
    graphics.generateTexture('track_horizontal_active', 128, 64);

    graphics.clear();
    graphics.lineStyle(8, 0x3d4f6f, 1);
    graphics.beginPath();
    graphics.moveTo(32, 0);
    graphics.lineTo(32, 128);
    graphics.strokePath();
    graphics.generateTexture('track_vertical', 64, 128);

    graphics.clear();
    graphics.lineStyle(8, 0x3d4f6f, 1);
    graphics.beginPath();
    graphics.moveTo(0, 32);
    graphics.lineTo(32, 32);
    graphics.lineTo(32, 64);
    graphics.strokePath();
    graphics.generateTexture('track_curve_bl', 64, 64);

    graphics.clear();
    graphics.fillStyle(0x3d4f6f, 1);
    graphics.fillCircle(32, 32, 20);
    graphics.lineStyle(4, 0x6b8cbf, 1);
    graphics.strokeCircle(32, 32, 20);
    graphics.generateTexture('node_normal', 64, 64);

    graphics.clear();
    graphics.fillStyle(0x6c5ce7, 1);
    graphics.fillCircle(32, 32, 22);
    graphics.lineStyle(4, 0xa29bfe, 1);
    graphics.strokeCircle(32, 32, 22);
    graphics.generateTexture('node_platform', 64, 64);

    graphics.clear();
    graphics.fillStyle(0x4ecdc4, 1);
    graphics.fillCircle(32, 32, 22);
    graphics.lineStyle(4, 0x7be3dd, 1);
    graphics.strokeCircle(32, 32, 22);
    graphics.generateTexture('node_spawn', 64, 64);

    graphics.clear();
    graphics.fillStyle(0xff6b6b, 1);
    graphics.fillCircle(32, 32, 22);
    graphics.lineStyle(4, 0xffa5a5, 1);
    graphics.strokeCircle(32, 32, 22);
    graphics.generateTexture('node_terminal', 64, 64);

    graphics.clear();
    graphics.fillStyle(0x4a9eff, 1);
    graphics.fillCircle(32, 32, 24);
    graphics.lineStyle(4, 0x7eb8ff, 1);
    graphics.strokeCircle(32, 32, 24);
    graphics.generateTexture('node_junction', 64, 64);

    graphics.clear();
    graphics.fillStyle(0xff4757, 1);
    graphics.fillCircle(16, 16, 14);
    graphics.generateTexture('signal_red', 32, 32);

    graphics.clear();
    graphics.fillStyle(0x00b894, 1);
    graphics.fillCircle(16, 16, 14);
    graphics.generateTexture('signal_green', 32, 32);

    graphics.clear();
    graphics.fillStyle(0xfdcb6e, 1);
    graphics.fillCircle(16, 16, 14);
    graphics.generateTexture('signal_yellow', 32, 32);

    graphics.clear();
    graphics.fillStyle(0x00cec9, 1);
    graphics.fillRoundedRect(0, 0, 80, 40, 6);
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeRoundedRect(0, 0, 80, 40, 6);
    graphics.generateTexture('train_passenger', 80, 40);

    graphics.clear();
    graphics.fillStyle(0xe17055, 1);
    graphics.fillRoundedRect(0, 0, 80, 40, 6);
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeRoundedRect(0, 0, 80, 40, 6);
    graphics.generateTexture('train_freight', 80, 40);

    graphics.clear();
    graphics.fillStyle(0xa29bfe, 1);
    graphics.fillRoundedRect(0, 0, 80, 40, 6);
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeRoundedRect(0, 0, 80, 40, 6);
    graphics.generateTexture('train_express', 80, 40);

    graphics.destroy();
  }

  create() {
    const { width, height } = this.scale;

    window.AnimCtrl = this.animationCtrl;
    window.SoundMgr = this.soundManager;

    this.soundManager.initPlaceholderSounds();

    const container = this.add.container(width / 2, height / 2);
    const title = this.children.list.find(c => c.type === 'Text' && c.text === '铁路调度拼图');
    if (title) {
      this.animationCtrl.popIn(title, 500, 1, 300);
    }

    this.time.delayedCall(800, () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }
}
