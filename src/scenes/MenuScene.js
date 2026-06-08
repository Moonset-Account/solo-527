import Phaser from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '../config/GameConfig.js';
import { AnimationController } from '../systems/AnimationController.js';
import { SoundManager, SFX_TYPES } from '../systems/SoundManager.js';
import { LevelManager } from '../data/LevelData.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MENU });
  }

  init() {
    this.animationCtrl = (window.AnimCtrl ? new AnimationController(this) : window.AnimCtrl);
    this.soundManager = (window.SoundMgr ? new SoundManager(this) : window.SoundMgr);
    this.levelManager = new LevelManager();
  }

  create() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;

    this.createBackground();

    const title = this.add.text(width / 2, 120, '铁路调度拼图', {
      fontFamily: 'Arial',
      fontSize: '64px',
      fontStyle: 'bold',
      color: colors.primary
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, 'rgba(74,158,255,0.4)', 0, false, true);
    this.animationCtrl.slideIn(title, 'up', 600, 80, 100);

    const subtitle = this.add.text(width / 2, 180, 'Railway Dispatch Puzzle', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: colors.textMuted
    });
    subtitle.setOrigin(0.5);
    this.animationCtrl.fadeIn(subtitle, 500, 0, 1, 400);

    const decorTrain = this.add.text(width / 2 - 300, 220, '🚄🚃🚃🚃', {
      fontSize: '60px'
    });
    decorTrain.setOrigin(0.5);
    this.tweens.add({
      targets: decorTrain,
      x: width / 2 + 300,
      duration: 4000,
      ease: 'Linear',
      repeat: -1,
      delay: 0
    });

    const decorTrain2 = this.add.text(width / 2 + 300, 280, '🚂🚃🚃', {
      fontSize: '48px'
    });
    decorTrain2.setOrigin(0.5);
    this.tweens.add({
      targets: decorTrain2,
      x: width / 2 - 300,
      duration: 5000,
      ease: 'Linear',
      repeat: -1,
      delay: 1500
    });

    const startBtn = this.createButton(
      width / 2,
      height / 2 - 20,
      '开始游戏',
      'primary',
      () => this.onStartGame()
    );
    this.animationCtrl.slideIn(startBtn, 'left', 200, 500, 600);

    const tutorialBtn = this.createButton(
      width / 2,
      height / 2 + 50,
      '新手教程',
      'secondary',
      () => this.onTutorial()
    );
    this.animationCtrl.slideIn(tutorialBtn, 'right', 200, 500, 700);

    const levelBtn = this.createButton(
      width / 2,
      height / 2 + 120,
      '关卡选择',
      'secondary',
      () => this.onLevelSelect()
    );
    this.animationCtrl.slideIn(tutorialBtn, 'left', 200, 500, 800);

    const stats = this.createStatsPanel(width - 230, 120);
    this.animationCtrl.fadeIn(stats, 400, 0, 1, 900);

    const audioEnabled = window.SaveSystem?.getSetting('audioEnabled') !== false;
    const audioBtn = this.add.text(40, 40, audioEnabled ? '🔊' : '🔇', {
      fontSize: '32px'
    });
    audioBtn.setInteractive({ useHandCursor: true });
    audioBtn.on('pointerdown', () => {
      const newVal = !window.SaveSystem?.getSetting('audioEnabled');
      window.SaveSystem?.updateSetting('audioEnabled', newVal);
      audioBtn.setText(newVal ? '🔊' : '🔇');
      this.soundManager.setEnabled(newVal);
      this.soundManager.playSFX(SFX_TYPES.CLICK);
    });

    const version = this.add.text(width - 20, height - 20, `v${GAME_CONFIG.version}`, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: colors.textMuted
    });
    version.setOrigin(1, 1);

    if (window.SaveSystem?.getSetting('showTutorial')) {
      this.time.delayedCall(1500, () => {
        this.showFirstTimeDialog();
      });
    }
  }

  createBackground() {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1628);

    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 1.5 + 0.5,
        0x4a9eff,
        0.3 + Math.random() * 0.5
      );
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 2000 + Math.random() * 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000
      });
    }

    const trackGraphics = this.add.graphics();
    trackGraphics.lineStyle(4, 0x3d4f6f, 0.3);
    for (let y = 100; y < height; y += 120) {
      trackGraphics.beginPath();
      trackGraphics.moveTo(0, y);
      trackGraphics.lineTo(width, y);
      trackGraphics.strokePath();
    }
    for (let y = 160; y < height; y += 120) {
      trackGraphics.beginPath();
      trackGraphics.moveTo(0, y);
      trackGraphics.lineTo(width, y);
      trackGraphics.strokePath();
    }
  }

  createButton(x, y, label, style, callback) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);

    const isPrimary = style === 'primary';
    const bgColor = isPrimary ? 0x4a9eff : 0x1a2642;
    const borderColor = isPrimary ? 0x7eb8ff : 0x4a9eff;
    const textColor = isPrimary ? '#ffffff' : colors.primary;

    const btnWidth = 240;
    const btnHeight = 56;

    const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, bgColor, 0.95);
    bg.setStrokeStyle(2, borderColor, 1);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: textColor
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(btnWidth, btnHeight);

    bg.setInteractive(new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);

    bg.on('pointerover', () => {
      this.tweens.add({ targets: bg, scaleX: 1.05, scaleY: 1.05, duration: 150 });
      this.tweens.add({ targets: text, scale: 1.05, duration: 150 });
      this.soundManager.playSFX(SFX_TYPES.HOVER);
    });

    bg.on('pointerout', () => {
      this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 150 });
      this.tweens.add({ targets: text, scale: 1, duration: 150 });
    });

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, text],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true
      });
      this.soundManager.playSFX(SFX_TYPES.CLICK);
    });

    bg.on('pointerup', () => {
      if (callback && typeof callback === 'function') {
        callback();
      }
    });

    return container;
  }

  createStatsPanel(x, y) {
    const container = this.add.container(x, y);
    const w = 200;
    const h = 140;
    const bg = this.add.rectangle(0, 0, w, h, 0x1a2642, 0.9);
    bg.setStrokeStyle(2, 0x4a9eff, 0.5);

    const saveData = window.SaveSystem?.data;
    const totalStars = this.levelManager.getTotalStars();
    const maxStars = this.levelManager.getMaxStars();
    const completed = this.levelManager.getCompletedLevelCount();
    const total = this.levelManager.getLevelCount();

    const title = this.add.text(0, -55, '调度员档案', {
      fontFamily: 'Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: GAME_CONFIG.colors.primary
    });
    title.setOrigin(0.5);

    const items = [
      { label: '⭐ 星数', value: `${totalStars} / ${maxStars}` },
      { label: '🎯 通关', value: `${completed} / ${total}` },
      { label: '🏆 胜率', value: saveData?.statistics?.totalGamesPlayed
        ? `${Math.round((saveData.statistics.totalWins / saveData.statistics.totalGamesPlayed) * 100)}%`
        : '—'
      },
      { label: '👤 身份', value: saveData?.playerName || '调度员' }
    ];

    items.forEach((item, i) => {
      const labelTxt = this.add.text(-85, -25 + i * 25, item.label, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: GAME_CONFIG.colors.textSecondary
      });
      labelTxt.setOrigin(0, 0.5);

      const valueTxt = this.add.text(85, -25 + i * 25, item.value, {
        fontFamily: 'Arial',
        fontSize: '13px',
        fontStyle: 'bold',
        color: GAME_CONFIG.colors.textPrimary
      });
      valueTxt.setOrigin(1, 0.5);
    });

    container.add([bg, title, ...items.flatMap(() => [])]);
    items.forEach((item, i) => {
      const labelTxt = this.children.list[
        this.children.list.length - items.length * 2 + i * 2
      ] || this.add.text(x - 85, y - 25 + i * 25, item.label, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: GAME_CONFIG.colors.textSecondary
      }).setOrigin(0, 0.5);
      const valueTxt = this.children.list[
        this.children.list.length - items.length * 2 + i * 2 + 1
      ] || this.add.text(x + 85, y - 25 + i * 25, item.value, {
        fontFamily: 'Arial',
        fontSize: '13px',
        fontStyle: 'bold',
        color: GAME_CONFIG.colors.textPrimary
      }).setOrigin(1, 0.5);
      container.add([labelTxt, valueTxt]);
    });

    return container;
  }

  showFirstTimeDialog() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(1000);

    const dialog = this.add.container(width / 2, height / 2);
    dialog.setDepth(1001);

    const bg = this.add.rectangle(0, 0, 500, 320, 0x1a2642, 0.98);
    bg.setStrokeStyle(3, 0x4a9eff, 1);

    const title = this.add.text(0, -120, '🎉 欢迎调度员！', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontStyle: 'bold',
      color: GAME_CONFIG.colors.primary
    });
    title.setOrigin(0.5);

    const desc = this.add.text(0, -40,
      '作为一名调度员，你需要：\n\n' +
      '🔀 切换道岔方向，规划列车路径\n' +
      '🚦 控制信号灯，保障行车安全\n' +
      '⭐ 安排车次优先级，避免冲突\n' +
      '⏰ 让客运和货运列车准点到达！',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: GAME_CONFIG.colors.textSecondary,
        align: 'center',
        lineSpacing: 8
      }
    );
    desc.setOrigin(0.5);

    const startBtn = this.createButton(-90, 100, '开始教程', 'primary', () => {
      window.SaveSystem?.updateSetting('showTutorial', false);
      this.animationCtrl.fadeOut(overlay, 200);
      this.animationCtrl.popOut(dialog, 200, 0, () => {
        this.onTutorial();
      });
    });
    startBtn.setScale(0.85);
    startBtn.setDepth(1002);

    const skipBtn = this.createButton(90, 100, '直接开始', 'secondary', () => {
      window.SaveSystem?.updateSetting('showTutorial', false);
      this.animationCtrl.fadeOut(overlay, 200);
      this.animationCtrl.popOut(dialog, 200, 0, () => {
        this.onStartGame();
      });
    });
    skipBtn.setScale(0.85);
    skipBtn.setDepth(1002);

    dialog.add([bg, title, desc]);
    this.animationCtrl.popIn(dialog, 400);
  }

  onStartGame() {
    const levels = this.levelManager.getAllLevels();
    let levelToStart = levels.find(l => !this.levelManager.isLevelUnlocked(l.id)) || levels[0];
    if (this.levelManager.isLevelUnlocked(levels[0].id)) {
      const incomplete = levels.find(l => this.levelManager.isLevelUnlocked(l.id) && !window.SaveSystem?.isLevelCompleted(l.id));
      levelToStart = incomplete || levels[0];
    }
    this.scene.start(SCENE_KEYS.GAME, { levelId: levelToStart.id });
  }

  onTutorial() {
    const firstLevel = this.levelManager.getAllLevels().find(l => l.tutorialLevel);
    if (firstLevel) {
      this.scene.start(SCENE_KEYS.TUTORIAL, { levelId: firstLevel.id });
    } else {
      this.scene.start(SCENE_KEYS.TUTORIAL);
    }
  }

  onLevelSelect() {
    this.scene.start(SCENE_KEYS.LEVEL_SELECT);
  }
}
