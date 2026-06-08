import Phaser from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '../config/GameConfig.js';
import { AnimationController } from '../systems/AnimationController.js';
import { SoundManager, SFX_TYPES } from '../systems/SoundManager.js';

export default class ReplayScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.REPLAY });
  }

  init(data) {
    this.animationCtrl = new AnimationController(this);
    this.soundManager = new SoundManager(this);
    this.levelId = data?.levelId || 'level_01';
    this.sessionData = data?.sessionData || null;
    this.replaySpeed = 1;
    this.isPlaying = false;
    this.currentTimestamp = 0;
    this.actionIndex = 0;
    this.maxTimestamp = 0;
    this.actions = [];
  }

  create() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1628);

    const title = this.add.text(width / 2, 40, '🎞️ 回放模式', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontStyle: 'bold',
      color: colors.primary
    });
    title.setOrigin(0.5);

    const info = this.add.text(width / 2, 80,
      `关卡：${this.levelId}  |  操作数：${this.sessionData?.actions?.length || 0}`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: colors.textMuted
      }
    );
    info.setOrigin(0.5);

    this.createReplayCanvas(width / 2, height / 2 - 30, width - 100, height - 250);
    this.createControls(width / 2, height - 80);

    const backBtn = this.add.text(40, 40, '← 返回结果', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: colors.textSecondary
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.soundManager.playSFX(SFX_TYPES.CLICK);
      this.scene.stop();
    });

    this.prepareReplayData();
  }

  createReplayCanvas(cx, cy, w, h) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(cx, cy);

    const bg = this.add.rectangle(0, 0, w, h, 0x0a0f1c, 1);
    bg.setStrokeStyle(3, colors.primary, 0.4);

    this.trackGraphics = this.add.graphics();
    this.trainSprites = {};

    this.canvasW = w;
    this.canvasH = h;

    this.timeText = this.add.text(-w / 2 + 20, -h / 2 + 20, '时间: 00:00', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: colors.success
    });
    this.timeText.setOrigin(0, 0);

    this.statusText = this.add.text(w / 2 - 20, -h / 2 + 20, '准备回放', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: colors.textMuted
    });
    this.statusText.setOrigin(1, 0);

    this.actionLogText = this.add.text(-w / 2 + 20, h / 2 - 100, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: colors.textSecondary,
      wordWrap: { width: w - 40 }
    });
    this.actionLogText.setOrigin(0, 0);

    container.add([bg, this.trackGraphics, this.timeText, this.statusText, this.actionLogText]);
    this.replayCanvasContainer = container;

    this.drawPlaceholderTracks();
    return container;
  }

  createControls(cx, cy) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(cx, cy);

    this.playPauseBtn = this.createCtrlButton(-200, 0, '▶ 播放', () => this.togglePlay());
    this.speedBtn = this.createCtrlButton(-80, 0, '⏩ 1x', () => this.cycleSpeed());
    const prevBtn = this.createCtrlButton(40, 0, '⏪ 后退', () => this.stepBack());
    const nextBtn = this.createCtrlButton(160, 0, '快进 ⏩', () => this.stepForward());

    this.progressBarBg = this.add.rectangle(0, 55, 520, 12, 0x1a2642, 1);
    this.progressBarBg.setStrokeStyle(1, colors.primary, 0.5);
    this.progressBar = this.add.rectangle(-258, 55, 0, 8, colors.primary);
    this.progressBar.setOrigin(0, 0.5);

    container.add([
      this.playPauseBtn, this.speedBtn, prevBtn, nextBtn,
      this.progressBarBg, this.progressBar
    ]);

    return container;
  }

  createCtrlButton(x, y, label, callback) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);

    const w = 100;
    const h = 40;
    const bg = this.add.rectangle(0, 0, w, h, 0x1a2642, 1);
    bg.setStrokeStyle(2, colors.primary, 1);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: '14px',
      fontStyle: 'bold',
      color: colors.primary
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(w, h);

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

  drawPlaceholderTracks() {
    const g = this.trackGraphics;
    g.clear();
    const w = this.canvasW;
    const h = this.canvasH;
    const ox = -w / 2;
    const oy = -h / 2;

    for (let row = 1; row <= 4; row++) {
      const y = oy + (h / 5) * row;
      g.lineStyle(6, 0x3d4f6f, 0.8);
      g.beginPath();
      g.moveTo(ox + 40, y);
      g.lineTo(ox + w - 40, y);
      g.strokePath();

      g.lineStyle(3, 0x6b8cbf, 0.4);
      g.setLineDash([8, 8]);
      g.beginPath();
      g.moveTo(ox + 40, y);
      g.lineTo(ox + w - 40, y);
      g.strokePath();
      g.setLineDash([]);
    }

    g.lineStyle(4, 0x4a9eff, 0.5);
    g.beginPath();
    g.moveTo(ox + w / 3, oy + (h / 5) * 1);
    g.lineTo(ox + w / 3, oy + (h / 5) * 4);
    g.strokePath();

    for (let i = 1; i <= 4; i++) {
      g.fillStyle(0x4ecdc4, 1);
      g.fillCircle(ox + 60, oy + (h / 5) * i, 12);
      g.fillStyle(0xff6b6b, 1);
      g.fillCircle(ox + w - 60, oy + (h / 5) * i, 12);
    }

    g.fillStyle(0x6c5ce7, 1);
    g.fillCircle(ox + w / 2, oy + (h / 5) * 2, 14);
    g.fillCircle(ox + w / 2, oy + (h / 5) * 3, 14);

    g.fillStyle(0x4a9eff, 1);
    g.fillCircle(ox + w / 3, oy + (h / 5) * 1, 14);
    g.fillCircle(ox + w / 3, oy + (h / 5) * 4, 14);
  }

  prepareReplayData() {
    if (!this.sessionData || !this.sessionData.actions) {
      this.statusText.setText('无回放数据');
      return;
    }

    this.actions = this.sessionData.actions || [];
    this.maxTimestamp = this.sessionData.duration || 60000;
    this.currentTimestamp = 0;
    this.actionIndex = 0;

    this.drawTrainPlaceholders();
    this.updateProgress();
    this.statusText.setText(`就绪：${this.actions.length}个操作待回放`);
  }

  drawTrainPlaceholders() {
    const w = this.canvasW;
    const h = this.canvasH;
    const ox = -w / 2;
    const oy = -h / 2;

    Object.values(this.trainSprites).forEach(s => {
      try { s.destroy(); } catch (e) { }
    });
    this.trainSprites = {};

    const trainColors = [0x00cec9, 0xe17055, 0xa29bfe, 0xffd93d];
    const trainIcons = ['🚄', '🚂', '🚅', '🚇'];

    for (let i = 0; i < 4; i++) {
      const container = this.add.container(ox + 60, oy + (h / 5) * (i + 1));
      const body = this.add.rectangle(0, 0, 50, 24, trainColors[i % trainColors.length], 0.9);
      body.setStrokeStyle(2, 0xffffff, 0.8);
      const icon = this.add.text(0, 0, trainIcons[i % trainIcons.length], { fontSize: '18px' });
      icon.setOrigin(0.5);
      const label = this.add.text(0, -22, `T${i + 1}`, {
        fontFamily: 'Arial',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff'
      });
      label.setOrigin(0.5);
      container.add([body, icon, label]);
      container.setAlpha(0.8);
      this.trainSprites[`train_${i}`] = container;
      this.replayCanvasContainer.add(container);
    }
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    const btnText = this.playPauseBtn.list[1];
    btnText.setText(this.isPlaying ? '⏸ 暂停' : '▶ 播放');
    this.statusText.setText(this.isPlaying ? '回放中...' : '已暂停');

    if (this.isPlaying) {
      this.replayStartTime = Date.now();
      this.startTimestamp = this.currentTimestamp;
    }
  }

  cycleSpeed() {
    const speeds = [0.5, 1, 2, 4];
    const idx = speeds.indexOf(this.replaySpeed);
    this.replaySpeed = speeds[(idx + 1) % speeds.length];
    const btnText = this.speedBtn.list[1];
    btnText.setText(`⏩ ${this.replaySpeed}x`);
    if (this.isPlaying) {
      this.replayStartTime = Date.now();
      this.startTimestamp = this.currentTimestamp;
    }
    this.soundManager.playSFX(SFX_TYPES.TICK);
  }

  stepBack() {
    const step = 5000;
    this.currentTimestamp = Math.max(0, this.currentTimestamp - step);
    this.syncToTimestamp();
    if (this.isPlaying) {
      this.replayStartTime = Date.now();
      this.startTimestamp = this.currentTimestamp;
    }
    this.soundManager.playSFX(SFX_TYPES.CLICK);
  }

  stepForward() {
    const step = 5000;
    this.currentTimestamp = Math.min(this.maxTimestamp, this.currentTimestamp + step);
    this.syncToTimestamp();
    if (this.isPlaying) {
      this.replayStartTime = Date.now();
      this.startTimestamp = this.currentTimestamp;
    }
    this.soundManager.playSFX(SFX_TYPES.CLICK);
  }

  syncToTimestamp() {
    while (this.actionIndex > 0 &&
      (this.actions[this.actionIndex - 1]?.timestamp || 0) > this.currentTimestamp) {
      this.actionIndex--;
    }
    while (this.actionIndex < this.actions.length &&
      (this.actions[this.actionIndex]?.timestamp || 0) <= this.currentTimestamp) {
      this.processAction(this.actions[this.actionIndex]);
      this.actionIndex++;
    }
    this.updateProgress();
    this.animateTrains();
  }

  processAction(action) {
    const typeMap = {
      'switch': '切换道岔',
      'signal': '切换信号',
      'priority': '调整优先级',
      'start_train': '放行列车',
      'other': '操作'
    };
    const typeName = typeMap[action.type] || action.type || '操作';
    const details = action.details ? ` - ${JSON.stringify(action.details).slice(0, 30)}` : '';
    const timeSec = Math.floor((action.timestamp || 0) / 1000);
    this.appendActionLog(`[${this.formatMs(action.timestamp || 0)}] ${typeName}${details}`);
  }

  appendActionLog(line) {
    const current = this.actionLogText.text;
    const lines = current ? current.split('\n') : [];
    lines.push(line);
    const recent = lines.slice(-6);
    this.actionLogText.setText(recent.join('\n'));
  }

  updateProgress() {
    const ratio = this.maxTimestamp > 0 ? this.currentTimestamp / this.maxTimestamp : 0;
    this.progressBar.width = 516 * Math.max(0, Math.min(1, ratio));
    this.timeText.setText(`时间: ${this.formatMs(this.currentTimestamp)}`);
  }

  animateTrains() {
    const w = this.canvasW;
    const h = this.canvasH;
    const ox = -w / 2;
    const oy = -h / 2;
    const ratio = this.maxTimestamp > 0 ? this.currentTimestamp / this.maxTimestamp : 0;

    for (let i = 0; i < 4; i++) {
      const sprite = this.trainSprites[`train_${i}`];
      if (!sprite) continue;
      const y = oy + (h / 5) * (i + 1);
      const phase = (ratio + (i * 0.1)) % 1;
      const x = ox + 60 + (w - 120) * phase;
      sprite.setPosition(x, y);
    }
  }

  formatMs(ms) {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  update(time, delta) {
    if (this.isPlaying) {
      const elapsed = (Date.now() - this.replayStartTime) * this.replaySpeed;
      this.currentTimestamp = Math.min(
        this.maxTimestamp,
        this.startTimestamp + elapsed
      );

      this.syncToTimestamp();

      if (this.currentTimestamp >= this.maxTimestamp) {
        this.isPlaying = false;
        const btnText = this.playPauseBtn.list[1];
        btnText.setText('▶ 重放');
        this.statusText.setText('回放完成');
        this.soundManager.playSFX(SFX_TYPES.SUCCESS);
      }
    }
  }
}
