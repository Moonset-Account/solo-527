import Phaser from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '../config/GameConfig.js';
import { AnimationController } from '../systems/AnimationController.js';
import { SoundManager, SFX_TYPES } from '../systems/SoundManager.js';
import { LevelManager } from '../data/LevelData.js';
import { TrackNode, NODE_TYPES } from '../models/TrackNode.js';
import { Signal, SIGNAL_STATES, SIGNAL_MODES } from '../models/Signal.js';
import { Train, TRAIN_STATES } from '../models/Train.js';
import { GameState } from '../models/GameState.js';

export default class ReplayScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.REPLAY });
  }

  init(data) {
    this.animationCtrl = new AnimationController(this);
    this.soundManager = new SoundManager(this);
    this.levelId = data?.levelId || 'level_01';
    this.sessionData = data?.sessionData || null;
    this.resultData = data?.resultData || null;
    this.levelManager = new LevelManager();
    this.gameState = new GameState();
    this.nodeGraphics = {};
    this.signalGraphics = {};
    this.trainSprites = {};
    this.segments = [];
    this.replaySpeed = 1;
    this.isPlaying = false;
    this.replayTimeMs = 0;
    this.actionIndex = 0;
    this.maxTimestamp = this.sessionData?.duration || 60000;
    this.actions = this.sessionData?.actions || [];
    this.logLines = [];
    this.tickAccumulator = 0;
  }

  create() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1628);

    this.createGridPattern();

    this.loadLevel(this.levelId);
    this.buildSegments();
    this.renderTracks();
    this.renderNodes();
    this.renderSignals();
    this.renderTrains();

    this.createTopBar();
    this.createInfoPanel();
    this.createActionLogPanel();
    this.createControls(width / 2, height - 80);

    const backResultBtn = this.createTopButton(150, 40, '← 返回结算', () => this.backToResult());
    const backMenuBtn = this.createTopButton(40, 40, '🏠 菜单', () => this.backToMenu());
    this.soundManager.playSFX(SFX_TYPES.CLICK);

    this.prepareReplay();
  }

  createGridPattern() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a2642, 0.4);
    for (let x = 0; x < width; x += 32) {
      graphics.beginPath();
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
      graphics.strokePath();
    }
    for (let y = 0; y < height; y += 32) {
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
      graphics.strokePath();
    }
  }

  createTopBar() {
    const { width } = this.scale;
    const colors = GAME_CONFIG.colors;
    const topBar = this.add.container(width / 2, 90);
    const bg = this.add.rectangle(0, 0, width - 300, 60, 0x0a0f1c, 0.95);
    bg.setStrokeStyle(1, colors.primary, 0.3);
    const levelLabel = this.add.text(-(width - 300) / 2 + 20, -10, `🎞️ 回放模式`, {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: colors.primary
    });
    levelLabel.setOrigin(0, 0.5);
    this.levelNameLabel = this.add.text(-(width - 300) / 2 + 20, 15, `${this.currentLevel?.name || ''}  |  操作 ${this.actions.length} 条`, {
      fontFamily: 'Arial', fontSize: '13px', color: colors.textMuted
    });
    this.levelNameLabel.setOrigin(0, 0.5);
    this.timeDisplay = this.add.text(0, -10, '⏱ 00:00 / 00:00', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: colors.success
    });
    this.timeDisplay.setOrigin(0.5);
    this.progressLabel = this.add.text(0, 15, `列车 0 / ${this.gameState.trains.length}`, {
      fontFamily: 'Arial', fontSize: '12px', color: colors.textSecondary
    });
    this.progressLabel.setOrigin(0.5);
    this.statusDisplay = this.add.text((width - 300) / 2 - 20, 0, '准备', {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: colors.warning
    });
    this.statusDisplay.setOrigin(1, 0.5);
    topBar.add([bg, levelLabel, this.levelNameLabel, this.timeDisplay, this.progressLabel, this.statusDisplay]);
  }

  createTopButton(x, y, label, callback) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);
    const w = 100, h = 36;
    const bg = this.add.rectangle(0, 0, w, h, 0x1a2642, 1);
    bg.setStrokeStyle(2, colors.primary, 0.8);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: colors.primary
    });
    text.setOrigin(0.5);
    container.add([bg, text]);
    bg.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerover', () => { this.tweens.add({ targets: container, scale: 1.05, duration: 150 }); this.soundManager.playSFX(SFX_TYPES.HOVER); });
    bg.on('pointerout', () => { this.tweens.add({ targets: container, scale: 1, duration: 150 }); });
    bg.on('pointerdown', () => { this.tweens.add({ targets: container, scale: 0.95, duration: 100, yoyo: true }); this.soundManager.playSFX(SFX_TYPES.CLICK); });
    bg.on('pointerup', () => { if (callback) callback(); });
    return container;
  }

  createInfoPanel() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    const panelW = 250, panelH = 140;
    this.infoPanel = this.add.container(panelW / 2 + 10, 180);
    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x0a0f1c, 0.95);
    bg.setStrokeStyle(2, colors.success, 0.3);
    const title = this.add.text(0, -panelH / 2 + 20, '🎯 关卡目标', {
      fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: colors.success
    });
    title.setOrigin(0.5);
    const objectives = this.currentLevel?.objectives || [];
    objectives.slice(0, 3).forEach((obj, i) => {
      const t = this.add.text(-panelW / 2 + 20, -panelH / 2 + 50 + i * 22, `• ${obj.description}`, {
        fontFamily: 'Arial', fontSize: '11px', color: colors.textSecondary, wordWrap: { width: panelW - 40 }
      });
      t.setOrigin(0, 0.5);
      this.infoPanel.add(t);
    });
    this.infoPanel.add([bg, title]);
  }

  createActionLogPanel() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    const panelW = 260, panelH = 200;
    const x = width - panelW / 2 - 10;
    const y = height - 220;
    this.logPanel = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x0a0f1c, 0.95);
    bg.setStrokeStyle(2, colors.primary, 0.3);
    const title = this.add.text(0, -panelH / 2 + 18, '📋 操作日志', {
      fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: colors.primary
    });
    title.setOrigin(0.5);
    this.actionLogText = this.add.text(-panelW / 2 + 15, -panelH / 2 + 35, '', {
      fontFamily: 'Arial', fontSize: '11px', color: colors.textSecondary,
      wordWrap: { width: panelW - 30 }, lineSpacing: 3
    });
    this.actionLogText.setOrigin(0, 0);
    this.logPanel.add([bg, title, this.actionLogText]);
  }

  createControls(cx, cy) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(cx, cy);
    this.playPauseBtn = this.createCtrlButton(-220, 0, '▶ 播放', () => this.togglePlay());
    this.speedBtn = this.createCtrlButton(-100, 0, '⏩ 1x', () => this.cycleSpeed());
    const prevBtn = this.createCtrlButton(20, 0, '⏪ -5s', () => this.stepBack());
    const nextBtn = this.createCtrlButton(140, 0, '+5s ⏩', () => this.stepForward());
    const restartBtn = this.createCtrlButton(260, 0, '🔄 重置', () => this.restartReplay());
    this.progressBarBg = this.add.rectangle(0, 55, 620, 12, 0x1a2642, 1);
    this.progressBarBg.setStrokeStyle(1, colors.primary, 0.5);
    this.progressBar = this.add.rectangle(-308, 55, 0, 8, colors.primary);
    this.progressBar.setOrigin(0, 0.5);
    container.add([this.playPauseBtn, this.speedBtn, prevBtn, nextBtn, restartBtn, this.progressBarBg, this.progressBar]);
    return container;
  }

  createCtrlButton(x, y, label, callback) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);
    const w = 100, h = 40;
    const bg = this.add.rectangle(0, 0, w, h, 0x1a2642, 1);
    bg.setStrokeStyle(2, colors.primary, 1);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: colors.primary
    });
    text.setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(w, h);
    bg.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerover', () => { this.tweens.add({ targets: bg, scale: 1.05, duration: 150 }); this.soundManager.playSFX(SFX_TYPES.HOVER); });
    bg.on('pointerout', () => { this.tweens.add({ targets: bg, scale: 1, duration: 150 }); });
    bg.on('pointerdown', () => { this.tweens.add({ targets: [bg, text], scale: 0.95, duration: 100, yoyo: true }); this.soundManager.playSFX(SFX_TYPES.CLICK); });
    bg.on('pointerup', () => { if (callback && typeof callback === 'function') callback(); });
    return container;
  }

  loadLevel(levelId) {
    const level = this.levelManager.selectLevel(levelId);
    if (!level) return;
    this.gameState.startLevel(level);
    this.currentLevel = level;
    this.layout = level.layout || { offsetX: 100, offsetY: 200, tileSize: 64 };
    level.nodes.forEach(nodeConfig => {
      const node = new TrackNode({
        ...nodeConfig,
        x: this.layout.offsetX + nodeConfig.gridX * this.layout.tileSize,
        y: this.layout.offsetY + nodeConfig.gridY * this.layout.tileSize
      });
      this.gameState.nodes[node.id] = node;
    });
    (level.signals || []).forEach(signalConfig => {
      const node = this.gameState.nodes[signalConfig.nodeId];
      const sx = node ? node.x + (signalConfig.offsetX || 0) : 0;
      const sy = node ? node.y + (signalConfig.offsetY || -40) : 0;
      const signal = new Signal({
        ...signalConfig,
        x: sx, y: sy
      });
      this.gameState.signals.push(signal);
    });
    level.trains.forEach(trainConfig => {
      const startNode = this.gameState.nodes[trainConfig.startNodeId];
      const train = new Train({
        ...trainConfig,
        x: startNode ? startNode.x : 0,
        y: startNode ? startNode.y : 0,
        currentNodeId: trainConfig.startNodeId
      });
      this.gameState.trains.push(train);
    });
  }

  buildSegments() {
    this.segments = [];
    const added = new Set();
    Object.values(this.gameState.nodes).forEach(node => {
      const conns = [...node.connections, ...node.altConnections];
      conns.forEach(otherId => {
        const key = [node.id, otherId].sort().join('-');
        if (!added.has(key)) {
          added.add(key);
          const other = this.gameState.nodes[otherId];
          if (other) this.segments.push({ from: node, to: other });
        }
      });
    });
  }

  renderTracks() {
    const colors = GAME_CONFIG.colors;
    const trackColor = colors.track || '#3d4f6f';
    const edgeColor = colors.trackActive || '#6b8cbf';
    const trackInt = parseInt((typeof trackColor === 'string' ? trackColor.replace('#', '') : '3d4f6f'), 16);
    const edgeInt = parseInt((typeof edgeColor === 'string' ? edgeColor.replace('#', '') : '6b8cbf'), 16);
    this.trackGraphicsBottom = this.add.graphics();
    this.trackGraphicsTop = this.add.graphics();
    this.segments.forEach(seg => {
      const { from, to } = seg;
      this.trackGraphicsBottom.lineStyle(12, trackInt, 0.9);
      this.trackGraphicsBottom.beginPath();
      this.trackGraphicsBottom.moveTo(from.x, from.y);
      this.trackGraphicsBottom.lineTo(to.x, to.y);
      this.trackGraphicsBottom.strokePath();
      this.trackGraphicsBottom.lineStyle(6, 0x0a0f1c, 1);
      this.trackGraphicsBottom.strokePath();
      this.trackGraphicsTop.lineStyle(3, edgeInt, 0.6);
      this.trackGraphicsTop.setLineDash([6, 10]);
      this.trackGraphicsTop.beginPath();
      this.trackGraphicsTop.moveTo(from.x, from.y);
      this.trackGraphicsTop.lineTo(to.x, to.y);
      this.trackGraphicsTop.strokePath();
      this.trackGraphicsTop.setLineDash([]);
    });
  }

  renderNodes() {
    const colors = GAME_CONFIG.colors;
    Object.values(this.gameState.nodes).forEach(node => {
      const container = this.add.container(node.x, node.y);
      let size = 16, color = 0x3d4f6f, shape = 'circle';
      switch (node.type) {
        case NODE_TYPES.SPAWN: color = 0x00b894; size = 18; shape = 'circle'; break;
        case NODE_TYPES.TERMINAL: color = 0xff6b6b; size = 18; shape = 'circle'; break;
        case NODE_TYPES.PLATFORM: color = 0x6c5ce7; size = 20; shape = 'rect'; break;
        case NODE_TYPES.JUNCTION: color = 0x4a9eff; size = 18; shape = 'diamond'; break;
        default: color = 0x3d4f6f; size = 10;
      }
      let body;
      if (shape === 'rect') body = this.add.rectangle(0, 0, size + 12, size, color, 0.95);
      else if (shape === 'diamond') {
        body = this.add.rectangle(0, 0, size, size, color, 0.95);
        body.setAngle(45);
      } else body = this.add.circle(0, 0, size / 2, color, 0.95);
      body.setStrokeStyle(2, 0xffffff, 0.7);
      container.add(body);
      if (node.type === NODE_TYPES.JUNCTION) {
        const arrow = this.add.text(0, -size - 8, node.switchState === 0 ? '┃' : '╱', {
          fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: colors.textPrimary
        });
        arrow.setOrigin(0.5);
        container.add(arrow);
        this.tweens.add({
          targets: body, scale: { from: 1, to: 1.08 },
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', alpha: 0.8
        });
      }
      if (node.platformName) {
        const label = this.add.text(0, size + 4, node.platformName, {
          fontFamily: 'Arial', fontSize: '10px', fontStyle: 'bold', color: colors.textPrimary
        });
        label.setOrigin(0.5);
        container.add(label);
      }
      this.nodeGraphics[node.id] = { container, body };
    });
  }

  renderSignals() {
    const colors = GAME_CONFIG.colors;
    this.gameState.signals.forEach(signal => {
      const container = this.add.container(signal.x, signal.y);
      const post = this.add.rectangle(0, 20, 4, 30, 0x2c3e50, 1);
      const lampBg = this.add.rectangle(0, 0, 22, 40, 0x16213e, 1);
      lampBg.setStrokeStyle(2, 0x3d4f6f, 1);
      const red = this.add.circle(0, -12, 6, 0x2a1a1a, 1);
      red.setStrokeStyle(1, 0xff4757, 0.5);
      const yellow = this.add.circle(0, 2, 6, 0x2a2a1a, 1);
      yellow.setStrokeStyle(1, 0xfdcB6e, 0.5);
      const green = this.add.circle(0, 16, 6, 0x1a2a1a, 1);
      green.setStrokeStyle(1, 0x00b894, 0.5);
      let light;
      switch (signal.state) {
        case SIGNAL_STATES.GREEN:
          light = this.add.circle(0, 16, 6, 0x00b894, 1);
          break;
        case SIGNAL_STATES.YELLOW:
          light = this.add.circle(0, 2, 6, 0xfdcB6e, 1);
          break;
        case SIGNAL_STATES.RED:
        default:
          light = this.add.circle(0, -12, 6, 0xff4757, 1);
          break;
      }
      container.add([post, lampBg, red, yellow, green, light]);
      if (signal.label) {
        const label = this.add.text(0, -30, signal.label, {
          fontFamily: 'Arial', fontSize: '10px', fontStyle: 'bold', color: colors.textMuted
        });
        label.setOrigin(0.5);
        container.add(label);
      }
      signal.graphics = container;
      this.signalGraphics[signal.id] = { container, light };
    });
  }

  renderTrains() {
    const colors = GAME_CONFIG.colors;
    this.gameState.trains.forEach(train => {
      const typeConfig = GAME_CONFIG.trainTypes[train.type];
      const colorStr = typeConfig?.color || '#00cec9';
      const colorInt = parseInt(colorStr.replace('#', ''), 16);
      const icon = typeConfig?.icon || '🚄';
      const container = this.add.container(train.x || 0, train.y || 0);
      const shadow = this.add.ellipse(0, 12, 48, 8, 0x000000, 0.35);
      const body = this.add.rectangle(0, 0, 52, 22, colorInt, 0.92);
      body.setStrokeStyle(2, 0xffffff, 0.65);
      const iconText = this.add.text(0, 0, icon, { fontSize: '16px' });
      iconText.setOrigin(0.5);
      const numberLabel = this.add.text(0, -18, train.displayName, {
        fontFamily: 'Arial', fontSize: '10px', fontStyle: 'bold', color: '#ffffff'
      });
      numberLabel.setOrigin(0.5);
      container.add([shadow, body, iconText, numberLabel]);
      container.setAlpha(0.35);
      container.setScale(0.85);
      train.graphics = container;
      train.bodySprite = body;
      train.labelText = numberLabel;
      this.trainSprites[train.id] = container;
    });
  }

  prepareReplay() {
    this.actionIndex = 0;
    this.replayTimeMs = 0;
    this.logLines = [];
    this.statusDisplay.setText('就绪');
    this.updateInfoDisplay();
    this.appendLog(`[回放准备] 共 ${this.actions.length} 条操作记录，时长 ${this.formatMs(this.maxTimestamp)}`);
  }

  backToResult() {
    this.soundManager.playSFX(SFX_TYPES.CLICK);
    if (this.resultData) {
      this.scene.start(SCENE_KEYS.RESULT, this.resultData);
    } else {
      this.scene.start(SCENE_KEYS.MENU);
    }
  }

  backToMenu() {
    this.soundManager.playSFX(SFX_TYPES.CLICK);
    this.scene.start(SCENE_KEYS.MENU);
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    const btnText = this.playPauseBtn.list[1];
    btnText.setText(this.isPlaying ? '⏸ 暂停' : '▶ 播放');
    this.statusDisplay.setText(this.isPlaying ? '回放中...' : '已暂停');
    if (this.isPlaying) {
      this.replayWallStartTime = Date.now();
      this.replayTimeSnapshot = this.replayTimeMs;
    }
  }

  cycleSpeed() {
    const speeds = [0.5, 1, 2, 4];
    const idx = speeds.indexOf(this.replaySpeed);
    this.replaySpeed = speeds[(idx + 1) % speeds.length];
    const btnText = this.speedBtn.list[1];
    btnText.setText(`⏩ ${this.replaySpeed}x`);
    if (this.isPlaying) {
      this.replayWallStartTime = Date.now();
      this.replayTimeSnapshot = this.replayTimeMs;
    }
    this.soundManager.playSFX(SFX_TYPES.TICK);
  }

  stepBack() {
    const step = 5000;
    this.replayTimeMs = Math.max(0, this.replayTimeMs - step);
    this.seekToTime(this.replayTimeMs);
    if (this.isPlaying) { this.replayWallStartTime = Date.now(); this.replayTimeSnapshot = this.replayTimeMs; }
    this.soundManager.playSFX(SFX_TYPES.CLICK);
  }

  stepForward() {
    const step = 5000;
    this.replayTimeMs = Math.min(this.maxTimestamp, this.replayTimeMs + step);
    this.seekToTime(this.replayTimeMs);
    if (this.isPlaying) { this.replayWallStartTime = Date.now(); this.replayTimeSnapshot = this.replayTimeMs; }
    this.soundManager.playSFX(SFX_TYPES.CLICK);
  }

  restartReplay() {
    this.gameState.trains.forEach(train => {
      const typeConfig = GAME_CONFIG.trainTypes[train.type];
      train.state = TRAIN_STATES.WAITING;
      train.progressOnSegment = 0;
      train.prevNodeId = null;
      train.nextNodeId = null;
      train.delayTime = 0;
      train.actualDeparture = null;
      train.actualArrival = null;
      train.platformProgress = 0;
      train.currentSpeed = 0;
      train.stoppedReason = null;
      train.currentNodeId = train.startNodeId;
      const startNode = this.gameState.nodes[train.startNodeId];
      train.x = startNode ? startNode.x : 0;
      train.y = startNode ? startNode.y : 0;
      train.platformProgress = 0;
      const sprite = this.trainSprites[train.id];
      if (sprite) {
        sprite.setPosition(train.x, train.y);
        sprite.setAlpha(0.35);
        sprite.setScale(0.85);
        sprite.setAngle(0);
      }
    });
    Object.values(this.gameState.nodes).forEach(n => {
      n.setOccupied(false);
      if (n.isSwitch) { n.switchState = 0; this.refreshNodeSwitch(n); }
    });
    this.gameState.signals.forEach(s => {
      s.state = SIGNAL_STATES.RED;
      s.mode = SIGNAL_MODES.MANUAL;
      this.refreshSignalLight(s);
    });
    this.actionIndex = 0;
    this.replayTimeMs = 0;
    this.logLines = [];
    this.appendLog(`[重置] 已重置到初始状态`);
    this.statusDisplay.setText('已重置');
    this.updateInfoDisplay();
    this.updateProgressBar();
    this.soundManager.playSFX(SFX_TYPES.SUCCESS);
  }

  seekToTime(targetMs) {
    this.restartReplay();
    this.logLines.pop();
    while (this.actionIndex < this.actions.length && (this.actions[this.actionIndex]?.timestamp || 0) <= targetMs) {
      this.executeAction(this.actions[this.actionIndex], false);
      this.actionIndex++;
    }
    this.replayTimeMs = targetMs;
    this.updateInfoDisplay();
    this.updateProgressBar();
  }

  executeAction(action, playSound = true) {
    const typeMap = { 'switch': '切换道岔', 'signal': '切换信号', 'priority': '调整优先级', 'start_train': '放行列车' };
    const typeName = typeMap[action.type] || action.type || '操作';
    const details = action.details || {};
    const timeStr = this.formatMs(action.timestamp || 0);
    switch (action.type) {
      case 'switch': {
        const node = this.gameState.nodes[details.nodeId];
        if (node && node.isSwitch) {
          node.switchState = details.newState ?? (node.switchState === 0 ? 1 : 0);
          this.refreshNodeSwitch(node);
          if (playSound) this.soundManager.playSFX(SFX_TYPES.SWITCH);
          this.animationCtrl.shake(this.nodeGraphics[node.id]?.container, 4, 200);
          this.appendLog(`[${timeStr}] ${typeName} ${node.label || node.id} -> 路线${node.switchState + 1}`);
        }
        break;
      }
      case 'signal': {
        const signal = this.gameState.signals.find(s => s.id === details.signalId);
        if (signal) {
          signal.state = details.newState ?? (signal.state + 1) % 3;
          this.refreshSignalLight(signal);
          if (playSound) this.soundManager.playSFX(SFX_TYPES.SIGNAL_CHANGE);
          this.appendLog(`[${timeStr}] ${typeName} ${signal.label || signal.id} -> ${this.getSignalName(signal.state)}`);
        }
        break;
      }
      case 'start_train': {
        const train = this.gameState.getTrainById(details.trainId);
        if (train && train.state === TRAIN_STATES.WAITING) {
          train.state = TRAIN_STATES.SPAWNED;
          train.actualDeparture = action.timestamp / 1000;
          const sprite = this.trainSprites[train.id];
          if (sprite) { sprite.setAlpha(1); sprite.setScale(1); }
          if (playSound) this.soundManager.playSFX(SFX_TYPES.TRAIN_HORN);
          this.appendLog(`[${timeStr}] ${typeName}: ${train.displayName}`);
          this.time.delayedCall(300 * (1 / this.replaySpeed), () => this.dispatchTrain(train));
        }
        break;
      }
      case 'priority': {
        const train = this.gameState.getTrainById(details.trainId);
        if (train) {
          train.setManualPriority(details.priority);
          this.appendLog(`[${timeStr}] ${typeName}: ${train.displayName} -> P${details.priority}`);
        }
        break;
      }
      default:
        this.appendLog(`[${timeStr}] ${typeName}`);
    }
  }

  refreshNodeSwitch(node) {
    const g = this.nodeGraphics[node.id];
    if (!g) return;
    const arrow = g.container.list[2];
    if (arrow) arrow.setText(node.switchState === 0 ? '┃' : '╱');
  }

  refreshSignalLight(signal) {
    const g = this.signalGraphics[signal.id];
    if (!g) return;
    const container = g.container;
    const light = g.light;
    const newColor = this.getSignalHex(signal.state);
    let targetY = -12;
    switch (signal.state) {
      case SIGNAL_STATES.GREEN: targetY = 16; break;
      case SIGNAL_STATES.YELLOW: targetY = 2; break;
      case SIGNAL_STATES.RED: default: targetY = -12; break;
    }
    light.y = targetY;
    light.fillColor = newColor;
  }

  getSignalHex(state) {
    switch (state) {
      case SIGNAL_STATES.GREEN: return 0x00b894;
      case SIGNAL_STATES.YELLOW: return 0xfdcB6e;
      case SIGNAL_STATES.RED: default: return 0xff4757;
    }
  }

  getSignalName(state) {
    switch (state) {
      case SIGNAL_STATES.GREEN: return '绿灯';
      case SIGNAL_STATES.YELLOW: return '黄灯';
      case SIGNAL_STATES.RED: default: return '红灯';
    }
  }

  dispatchTrain(train) {
    if (train.state === TRAIN_STATES.COMPLETED || train.state === TRAIN_STATES.DERAILED) return;
    train.state = TRAIN_STATES.MOVING;
    const currentNode = this.gameState.nodes[train.currentNodeId];
    if (!currentNode) return;
    const connections = currentNode.getActiveConnections();
    let nextNodeId = null;
    if (train.targetPlatformId) {
      nextNodeId = connections.find(cid => {
        const node = this.gameState.nodes[cid];
        return node && (node.platformId === train.targetPlatformId || node.type === NODE_TYPES.TERMINAL);
      });
    }
    if (!nextNodeId) {
      nextNodeId = connections.find(cid => {
        const node = this.gameState.nodes[cid];
        return node && cid !== train.prevNodeId && node.type !== NODE_TYPES.SPAWN;
      });
    }
    if (!nextNodeId) nextNodeId = connections.find(cid => cid !== train.prevNodeId) || connections[0];
    if (!nextNodeId) { train.state = TRAIN_STATES.STOPPED; return; }
    const nextNode = this.gameState.nodes[nextNodeId];
    if (nextNode && nextNode.occupied && nextNode.occupantTrainId !== train.id) {
      train.state = TRAIN_STATES.STOPPED;
      this.time.delayedCall(1500 * (1 / this.replaySpeed), () => { if (train.state === TRAIN_STATES.STOPPED) this.dispatchTrain(train); });
      return;
    }
    train.prevNodeId = train.currentNodeId;
    train.nextNodeId = nextNodeId;
    train.progressOnSegment = 0;
    train.segmentLength = Phaser.Math.Distance.Between(currentNode.x, currentNode.y, nextNode.x, nextNode.y) || 100;
    train.currentSpeed = train.baseSpeed * 0.6;
  }

  appendLog(line) {
    this.logLines.push(line);
    const recent = this.logLines.slice(-12);
    if (this.actionLogText) this.actionLogText.setText(recent.join('\n'));
  }

  update(time, delta) {
    if (this.isPlaying) {
      const wallElapsed = Date.now() - this.replayWallStartTime;
      this.replayTimeMs = Math.min(this.maxTimestamp, this.replayTimeSnapshot + wallElapsed * this.replaySpeed);
      this.processNewActions();
      this.tickAccumulator += delta * this.replaySpeed;
      if (this.tickAccumulator >= 16) {
        this.updateTrains(this.tickAccumulator);
        this.tickAccumulator = 0;
      }
      this.updateInfoDisplay();
      this.updateProgressBar();
      if (this.replayTimeMs >= this.maxTimestamp && this.gameState.areAllTrainsCompleted() === false) {
        const notCompleted = this.gameState.trains.filter(t => t.state !== TRAIN_STATES.COMPLETED && t.state !== TRAIN_STATES.DERAILED);
        if (notCompleted.length === 0 || this.replayTimeMs >= this.maxTimestamp + 10000) {
          this.isPlaying = false;
          const btnText = this.playPauseBtn.list[1];
          btnText.setText('▶ 重放');
          this.statusDisplay.setText('回放完成');
          this.soundManager.playSFX(SFX_TYPES.SUCCESS);
        }
      } else if (this.replayTimeMs >= this.maxTimestamp && this.actionIndex >= this.actions.length) {
        this.isPlaying = false;
        const btnText = this.playPauseBtn.list[1];
        btnText.setText('▶ 重放');
        this.statusDisplay.setText('回放完成');
        this.soundManager.playSFX(SFX_TYPES.SUCCESS);
      }
    }
  }

  processNewActions() {
    while (this.actionIndex < this.actions.length && (this.actions[this.actionIndex]?.timestamp || 0) <= this.replayTimeMs) {
      this.executeAction(this.actions[this.actionIndex], true);
      this.actionIndex++;
    }
  }

  updateTrains(deltaMs) {
    const deltaSec = deltaMs / 1000;
    this.gameState.trains.forEach(train => {
      if (train.state === TRAIN_STATES.MOVING && train.nextNodeId) {
        this.updateTrainPos(train, deltaSec);
      } else if (train.state === TRAIN_STATES.AT_PLATFORM) {
        train.platformProgress += deltaSec;
        const wait = train.platformWaitTime || 20;
        if (train.platformProgress >= wait * 0.5) {
          train.platformProgress = 0;
          const node = this.gameState.nodes[train.currentNodeId];
          if (node) node.setOccupied(false);
          train.state = TRAIN_STATES.MOVING;
          this.time.delayedCall(200 * (1 / this.replaySpeed), () => this.dispatchTrain(train));
        }
      } else if (train.state === TRAIN_STATES.STOPPED && train.nextNodeId) {
        this.time.delayedCall(1000 * (1 / this.replaySpeed), () => {
          if (train.state === TRAIN_STATES.STOPPED) {
            train.state = TRAIN_STATES.MOVING;
          }
        });
      }
    });
  }

  updateTrainPos(train, deltaSec) {
    const speed = train.currentSpeed * 50 * deltaSec;
    train.progressOnSegment += speed / train.segmentLength;
    if (train.progressOnSegment >= 0.2) {
      const cur = this.gameState.nodes[train.currentNodeId];
      if (cur) cur.setOccupied(false);
    }
    const fromNode = this.gameState.nodes[train.currentNodeId];
    const toNode = this.gameState.nodes[train.nextNodeId];
    if (train.progressOnSegment >= 1) {
      const next = this.gameState.nodes[train.nextNodeId];
      train.currentNodeId = train.nextNodeId;
      train.nextNodeId = null;
      train.progressOnSegment = 0;
      if (next) {
        next.setOccupied(true, train.id);
        train.x = next.x; train.y = next.y;
        const sprite = this.trainSprites[train.id];
        if (sprite) { sprite.setPosition(next.x, next.y); sprite.setAngle(0); }
      }
      if (next?.type === NODE_TYPES.PLATFORM && (!train.targetPlatformId || next.platformId === train.targetPlatformId)) {
        train.state = TRAIN_STATES.AT_PLATFORM; train.platformProgress = 0;
      } else if (next?.type === NODE_TYPES.TERMINAL || (train.endNodeId && next?.id === train.endNodeId)) {
        train.state = TRAIN_STATES.COMPLETED; train.actualArrival = this.replayTimeMs / 1000;
        const sprite = this.trainSprites[train.id]; if (sprite) { sprite.setAlpha(0.5); }
        const node = this.gameState.nodes[train.currentNodeId]; if (node) node.setOccupied(false);
        this.appendLog(`[${this.formatMs(this.replayTimeMs)}] ✅ ${train.displayName} 完成`);
      } else {
        this.time.delayedCall(300 * (1 / this.replaySpeed), () => this.dispatchTrain(train));
      }
      return;
    }
    if (fromNode && toNode) {
      train.x = Phaser.Math.Linear(fromNode.x, toNode.x, train.progressOnSegment);
      train.y = Phaser.Math.Linear(fromNode.y, toNode.y, train.progressOnSegment);
      const sprite = this.trainSprites[train.id];
      if (sprite) {
        sprite.setPosition(train.x, train.y);
        const ang = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) * 180 / Math.PI;
        sprite.setAngle(ang);
      }
    }
    const targetSpeed = train.baseSpeed;
    train.updateSpeed(targetSpeed, deltaSec * 1000);
  }

  updateInfoDisplay() {
    if (this.timeDisplay) {
      this.timeDisplay.setText(`⏱ ${this.formatMs(this.replayTimeMs)} / ${this.formatMs(this.maxTimestamp)}`);
    }
    if (this.progressLabel) {
      const done = this.gameState.getTrainCompletionCount();
      this.progressLabel.setText(`列车 ${done} / ${this.gameState.trains.length}  |  进度 ${this.actionIndex}/${this.actions.length}`);
    }
  }

  updateProgressBar() {
    const ratio = this.maxTimestamp > 0 ? this.replayTimeMs / this.maxTimestamp : 0;
    this.progressBar.width = 616 * Math.max(0, Math.min(1, ratio));
  }

  formatMs(ms) {
    const secs = Math.floor((ms || 0) / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
