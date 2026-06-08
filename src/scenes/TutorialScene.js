import Phaser from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '../config/GameConfig.js';
import { AnimationController } from '../systems/AnimationController.js';
import { SoundManager, SFX_TYPES } from '../systems/SoundManager.js';
import { LevelManager } from '../data/LevelData.js';

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.TUTORIAL });
  }

  init(data) {
    this.animationCtrl = new AnimationController(this);
    this.soundManager = new SoundManager(this);
    this.levelManager = new LevelManager();
    this.levelId = data?.levelId || 'level_01';
    this.currentStep = 0;
    this.tutorialSteps = [];
  }

  create() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1628);

    this.createTutorialDemoScene();

    this.backBtn = this.add.text(40, 40, '← 返回菜单', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: colors.textSecondary
    });
    this.backBtn.setInteractive({ useHandCursor: true });
    this.backBtn.on('pointerdown', () => {
      this.soundManager.playSFX(SFX_TYPES.CLICK);
      this.scene.start(SCENE_KEYS.MENU);
    });

    const title = this.add.text(width / 2, 50, '新手教程', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontStyle: 'bold',
      color: colors.primary
    });
    title.setOrigin(0.5);
    this.animationCtrl.fadeIn(title, 400);

    this.tutorialPanel = this.add.container(width / 2, height - 140);
    const panelW = 900;
    const panelH = 220;

    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x1a2642, 0.95);
    panelBg.setStrokeStyle(2, colors.primary, 0.8);

    this.stepNumber = this.add.text(-panelW / 2 + 30, -panelH / 2 + 25, '步骤 1 / 5', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: colors.textMuted
    });
    this.stepNumber.setOrigin(0, 0.5);

    this.stepTitle = this.add.text(0, -panelH / 2 + 25, '', {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: colors.textPrimary
    });
    this.stepTitle.setOrigin(0.5, 0.5);

    this.stepText = this.add.text(-panelW / 2 + 30, 10, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: colors.textSecondary,
      wordWrap: { width: panelW - 60 }
    });
    this.stepText.setOrigin(0, 0);

    this.prevBtn = this.createTutorialButton(
      -panelW / 2 + 60,
      panelH / 2 - 40,
      '← 上一步',
      'secondary',
      () => this.prevStep()
    );

    this.nextBtn = this.createTutorialButton(
      panelW / 2 - 60,
      panelH / 2 - 40,
      '下一步 →',
      'primary',
      () => this.nextStep()
    );

    this.skipBtn = this.createTutorialButton(
      0,
      panelH / 2 - 40,
      '跳过教程',
      'secondary',
      () => this.skipTutorial()
    );

    this.progressDots = [];
    this.tutorialSteps = this.getTutorialSteps();
    for (let i = 0; i < this.tutorialSteps.length; i++) {
      const dot = this.add.circle(
        (i - (this.tutorialSteps.length - 1) / 2) * 24,
        -panelH / 2 + 65,
        8,
        0x3d4f6f,
        1
      );
      this.progressDots.push(dot);
    }

    this.tutorialPanel.add([
      panelBg, this.stepNumber, this.stepTitle, this.stepText,
      this.prevBtn, this.nextBtn, this.skipBtn,
      ...this.progressDots
    ]);

    this.showStep(0);
    this.animationCtrl.fadeIn(this.tutorialPanel, 500, 0, 1, 300);
  }

  getTutorialSteps() {
    const level = this.levelManager.getLevel(this.levelId);
    return level?.tutorialSteps || [
      { id: 1, title: '欢迎来到铁路调度中心', text: '你是一名铁路调度员。你的任务是切换轨道、安排车次，让所有列车准点到达目的地。' },
      { id: 2, title: '认识信号灯', text: '红色信号灯表示禁止通行，绿色表示允许通行。点击信号灯可以切换状态。' },
      { id: 3, title: '切换道岔', text: '蓝色的节点是道岔，点击它可以切换轨道连接方向。' },
      { id: 4, title: '车次表与优先级', text: '在右侧车次表中，优先级高的列车会被优先安排通行。' },
      { id: 5, title: '开始调度吧！', text: '现在进入第一个关卡，运用学到的知识，让所有列车安全准点到达！' }
    ];
  }

  createTutorialDemoScene() {
    const { width, height } = this.scale;
    const centerY = height / 2 - 60;
    const offsetX = 200;

    const trackLine = this.add.graphics();
    trackLine.lineStyle(8, 0x3d4f6f, 1);
    trackLine.beginPath();
    trackLine.moveTo(offsetX, centerY);
    trackLine.lineTo(width - offsetX, centerY);
    trackLine.strokePath();

    trackLine.lineStyle(4, 0x6b8cbf, 0.5);
    trackLine.beginPath();
    trackLine.moveTo(offsetX + 100, centerY);
    trackLine.quadraticCurveTo(width / 2 - 50, centerY, width / 2, centerY - 50);
    trackLine.quadraticCurveTo(width / 2 + 50, centerY, width - offsetX - 100, centerY);
    trackLine.strokePath();

    const spawnNode = this.add.circle(offsetX, centerY, 22, 0x4ecdc4, 1);
    spawnNode.setStrokeStyle(4, 0x7be3dd, 1);
    const spawnLabel = this.add.text(offsetX, centerY + 45, '入口', {
      fontSize: '14px', color: '#4ecdc4'
    });
    spawnLabel.setOrigin(0.5);

    const junctionNode = this.add.circle(width / 2, centerY, 26, 0x4a9eff, 1);
    junctionNode.setStrokeStyle(4, 0x7eb8ff, 1);
    const junctionLabel = this.add.text(width / 2, centerY + 45, '道岔（点击切换）', {
      fontSize: '14px', color: GAME_CONFIG.colors.primary
    });
    junctionLabel.setOrigin(0.5);
    this.pulseTween = this.tweens.add({
      targets: junctionNode,
      scale: 1.15,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    junctionNode.setInteractive({ useHandCursor: true });
    junctionNode.on('pointerdown', () => {
      this.soundManager.playSFX(SFX_TYPES.SWITCH);
      this.animationCtrl.shake(junctionNode, 6, 300);
    });

    const platformNode = this.add.circle(width - offsetX, centerY, 22, 0x6c5ce7, 1);
    platformNode.setStrokeStyle(4, 0xa29bfe, 1);
    const platformLabel = this.add.text(width - offsetX, centerY + 45, '1站台', {
      fontSize: '14px', color: '#a29bfe'
    });
    platformLabel.setOrigin(0.5);

    const signal = this.add.circle(offsetX + 60, centerY - 50, 14, 0xff4757, 1);
    signal.setStrokeStyle(2, 0xffffff, 0.8);
    const signalLabel = this.add.text(offsetX + 60, centerY - 80, '信号灯', {
      fontSize: '12px', color: '#ff4757'
    });
    signalLabel.setOrigin(0.5);

    signal.setInteractive({ useHandCursor: true });
    signal.on('pointerdown', () => {
      this.soundManager.playSFX(SFX_TYPES.SIGNAL_CHANGE);
      const colors = [0xff4757, 0xfdcb6e, 0x00b894];
      const current = colors.indexOf(signal.fillColor);
      signal.fillColor = colors[(current + 1) % colors.length];
      signalLabel.setColor('#' + signal.fillColor.toString(16).padStart(6, '0'));
    });

    const trainDemo = this.add.container(offsetX - 100, centerY);
    const trainBody = this.add.rectangle(0, 0, 70, 32, 0x00cec9, 1);
    trainBody.setStrokeStyle(2, 0xffffff, 1);
    const trainIcon = this.add.text(0, 0, '🚄', { fontSize: '24px' });
    trainIcon.setOrigin(0.5);
    trainDemo.add([trainBody, trainIcon]);

    this.tweens.add({
      targets: trainDemo,
      x: offsetX + 30,
      duration: 2000,
      ease: 'Cubic.easeInOut',
      delay: 500,
      hold: 1500,
      yoyo: true,
      repeat: -1
    });

    const trainDemo2 = this.add.container(width - offsetX + 200, centerY - 50);
    const trainBody2 = this.add.rectangle(0, 0, 70, 32, 0xe17055, 1);
    trainBody2.setStrokeStyle(2, 0xffffff, 1);
    const trainIcon2 = this.add.text(0, 0, '🚂', { fontSize: '24px' });
    trainIcon2.setOrigin(0.5);
    trainDemo2.add([trainBody2, trainIcon2]);

    this.tweens.add({
      targets: trainDemo2,
      x: width - offsetX - 30,
      duration: 3000,
      ease: 'Cubic.easeInOut',
      delay: 2500,
      hold: 2000,
      yoyo: true,
      repeat: -1
    });
  }

  createTutorialButton(x, y, label, style, callback) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);
    const isPrimary = style === 'primary';
    const bgColor = isPrimary ? 0x4a9eff : 0x0f1628;
    const borderColor = isPrimary ? 0x7eb8ff : colors.primary;
    const textColor = isPrimary ? '#ffffff' : colors.primary;

    const w = 140;
    const h = 44;
    const bg = this.add.rectangle(0, 0, w, h, bgColor, 0.95);
    bg.setStrokeStyle(2, borderColor, 1);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: '15px',
      fontStyle: 'bold',
      color: textColor
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    bg.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    bg.on('pointerover', () => {
      this.tweens.add({ targets: bg, scale: 1.05, duration: 150 });
      this.soundManager.playSFX(SFX_TYPES.HOVER);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: bg, scale: 1, duration: 150 });
    });
    bg.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, text], scale: 0.95, duration: 100, yoyo: true });
      this.soundManager.playSFX(SFX_TYPES.CLICK);
    });
    bg.on('pointerup', () => {
      if (callback && typeof callback === 'function') callback();
    });

    return container;
  }

  showStep(index) {
    this.currentStep = Math.max(0, Math.min(index, this.tutorialSteps.length - 1));
    const step = this.tutorialSteps[this.currentStep];

    this.stepNumber.setText(`步骤 ${this.currentStep + 1} / ${this.tutorialSteps.length}`);
    this.animationCtrl.fadeIn(this.stepNumber, 200);

    this.stepTitle.setText(step.title);
    this.stepTitle.setAlpha(0);
    this.animationCtrl.fadeIn(this.stepTitle, 300, 0, 1, 100);

    this.stepText.setText(step.text);
    this.stepText.setAlpha(0);
    this.animationCtrl.fadeIn(this.stepText, 400, 0, 1, 200);

    this.progressDots.forEach((dot, i) => {
      const activeColor = i === this.currentStep ? 0x4a9eff : (i < this.currentStep ? 0x4ecdc4 : 0x3d4f6f);
      dot.fillColor = activeColor;
      dot.scale = i === this.currentStep ? 1.3 : 1;
    });

    this.prevBtn.setAlpha(this.currentStep > 0 ? 1 : 0.4);
    this.nextBtn.list[1].setText(
      this.currentStep === this.tutorialSteps.length - 1 ? '开始游戏 🚀' : '下一步 →'
    );
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.soundManager.playSFX(SFX_TYPES.CLICK);
      this.showStep(this.currentStep - 1);
    }
  }

  nextStep() {
    this.soundManager.playSFX(SFX_TYPES.CLICK);
    if (this.currentStep < this.tutorialSteps.length - 1) {
      this.showStep(this.currentStep + 1);
    } else {
      this.finishTutorial();
    }
  }

  skipTutorial() {
    this.soundManager.playSFX(SFX_TYPES.CLICK);
    this.finishTutorial();
  }

  finishTutorial() {
    window.SaveSystem?.updateSetting('showTutorial', false);
    this.animationCtrl.screenFlash(0x4a9eff, 0.3, 300);
    this.time.delayedCall(400, () => {
      this.scene.start(SCENE_KEYS.GAME, { levelId: this.levelId, fromTutorial: true });
    });
  }
}
