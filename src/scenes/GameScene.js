import Phaser from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '../config/GameConfig.js';
import { AnimationController } from '../systems/AnimationController.js';
import { SoundManager, SFX_TYPES } from '../systems/SoundManager.js';
import { LevelManager } from '../data/LevelData.js';
import { TrackNode, NODE_TYPES } from '../models/TrackNode.js';
import { Signal, SIGNAL_STATES, SIGNAL_MODES } from '../models/Signal.js';
import { Train, TRAIN_STATES } from '../models/Train.js';
import { GameState } from '../models/GameState.js';
import { ConflictDetector } from '../models/ConflictDetector.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  init(data) {
    this.levelId = data?.levelId || 'level_01';
    this.fromTutorial = data?.fromTutorial || false;
    this.animationCtrl = new AnimationController(this);
    this.soundManager = new SoundManager(this);
    this.levelManager = new LevelManager();
    this.gameState = new GameState();
    this.conflictDetector = new ConflictDetector();
    this.nodeGraphics = {};
    this.signalGraphics = {};
    this.trainSprites = {};
    this.trackLines = [];
    this.conflictMarkers = [];
    this.deltaAccumulator = 0;
    this.conflictCheckTimer = 0;
    this.failureReason = null;
    this.gameEnded = false;
  }

  create() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1628);
    this.createGridPattern();
    this.loadLevel(this.levelId);
    this.createTopBar();
    this.createBottomBar();
    this.createSchedulePanel();
    this.createConflictPanel();
    this.createObjectivePanel();
    this.createStartDialog();
    window.SaveSystem?.startSession(this.levelId);
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

  loadLevel(levelId) {
    const level = this.levelManager.selectLevel(levelId);
    if (!level) return;
    this.gameState.startLevel(level);
    this.currentLevel = level;
    this.layout = level.layout || { offsetX: 100, offsetY: 150, tileSize: 64 };
    level.nodes.forEach(nodeConfig => {
      const node = new TrackNode({
        ...nodeConfig,
        x: this.layout.offsetX + nodeConfig.gridX * this.layout.tileSize,
        y: this.layout.offsetY + nodeConfig.gridY * this.layout.tileSize
      });
      this.gameState.nodes[node.id] = node;
    });
    level.signals.forEach(sigConfig => {
      const signal = new Signal({
        ...sigConfig,
        mode: sigConfig.mode === 'manual' ? SIGNAL_MODES.MANUAL : SIGNAL_MODES.AUTO,
        state: this.mapSignalState(sigConfig.state)
      });
      this.gameState.signals.push(signal);
    });
    level.schedules.forEach(schedConfig => {
      const startNode = this.gameState.nodes[schedConfig.startNodeId];
      const train = new Train({
        ...schedConfig,
        x: startNode?.x || 0,
        y: startNode?.y || 0,
        currentNodeId: schedConfig.startNodeId,
        state: TRAIN_STATES.WAITING
      });
      this.gameState.trains.push(train);
    });
    this.buildSegments();
    this.renderTracks();
    this.renderNodes();
    this.renderSignals();
    this.renderTrains();
  }

  mapSignalState(stateStr) {
    switch (stateStr) {
      case 'green': return SIGNAL_STATES.GREEN;
      case 'yellow': return SIGNAL_STATES.YELLOW;
      case 'red': default: return SIGNAL_STATES.RED;
    }
  }

  buildSegments() {
    const nodeIds = Object.keys(this.gameState.nodes);
    const processed = new Set();
    nodeIds.forEach(nid => {
      const node = this.gameState.nodes[nid];
      node.getAllConnections().forEach(cid => {
        const key = [nid, cid].sort().join('_');
        if (!processed.has(key)) {
          processed.add(key);
          this.gameState.segments.push({ id: key, from: nid, to: cid });
        }
      });
    });
  }

  renderTracks() {
    this.trackLines.forEach(l => { try { l.destroy(); } catch (e) { } });
    this.trackLines = [];
    this.gameState.segments.forEach(seg => {
      const fromNode = this.gameState.nodes[seg.from];
      const toNode = this.gameState.nodes[seg.to];
      if (!fromNode || !toNode) return;
      const g = this.add.graphics();
      g.lineStyle(10, 0x2a3c5c, 1);
      g.beginPath();
      g.moveTo(fromNode.x, fromNode.y);
      g.lineTo(toNode.x, toNode.y);
      g.strokePath();
      g.lineStyle(6, 0x3d4f6f, 1);
      g.beginPath();
      g.moveTo(fromNode.x, fromNode.y);
      g.lineTo(toNode.x, toNode.y);
      g.strokePath();
      this.trackLines.push(g);
    });
  }

  renderNodes() {
    const colors = GAME_CONFIG.colors;
    Object.values(this.gameState.nodes).forEach(node => {
      const container = this.add.container(node.x, node.y);
      container.setSize(50, 50);
      let bgColor = 0x3d4f6f, borderColor = 0x6b8cbf, radius = 18;
      switch (node.type) {
        case NODE_TYPES.SPAWN:
          bgColor = 0x4ecdc4; borderColor = 0x7be3dd; radius = 20; break;
        case NODE_TYPES.TERMINAL:
          bgColor = 0xff6b6b; borderColor = 0xffa5a5; radius = 20; break;
        case NODE_TYPES.PLATFORM:
          bgColor = 0x6c5ce7; borderColor = 0xa29bfe; radius = 22; break;
        case NODE_TYPES.JUNCTION:
          bgColor = 0x4a9eff; borderColor = 0x7eb8ff; radius = 22; break;
      }
      const bg = this.add.circle(0, 0, radius, bgColor, 0.9);
      bg.setStrokeStyle(3, borderColor, 1);
      container.add(bg);
      if (node.isSwitch) {
        const indicator = this.add.circle(0, 0, 8, 0xffffff, 0.8);
        container.add(indicator);
        this.tweens.add({ targets: indicator, scale: 1.3, alpha: 0.4, duration: 900, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
      }
      if (node.type === NODE_TYPES.PLATFORM && node.platformName) {
        const label = this.add.text(0, radius + 18, node.platformName, {
          fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#a29bfe'
        });
        label.setOrigin(0.5);
        container.add(label);
      } else if (node.label) {
        const label = this.add.text(0, radius + 18, node.label, {
          fontFamily: 'Arial', fontSize: '11px', color: colors.textSecondary
        });
        label.setOrigin(0.5);
        container.add(label);
      }
      if (node.isSwitch || node.type === NODE_TYPES.SPAWN ||
        node.type === NODE_TYPES.TERMINAL || node.type === NODE_TYPES.PLATFORM) {
        bg.setInteractive(new Phaser.Geom.Circle(0, 0, radius + 5), Phaser.Geom.Circle.Contains);
        bg.on('pointerover', () => {
          this.tweens.add({ targets: bg, scale: 1.15, duration: 150 });
          node.isHovered = true;
          this.soundManager.playSFX(SFX_TYPES.HOVER);
        });
        bg.on('pointerout', () => {
          this.tweens.add({ targets: bg, scale: 1, duration: 150 });
          node.isHovered = false;
        });
        bg.on('pointerdown', () => this.onNodeClick(node, container));
      }
      node.graphics = container;
      node.hitArea = bg;
      this.nodeGraphics[node.id] = container;
    });
  }

  renderSignals() {
    const colors = GAME_CONFIG.colors;
    this.gameState.signals.forEach(signal => {
      const node = this.gameState.nodes[signal.nodeId];
      if (!node) return;
      const offsetX = 28, offsetY = -28;
      const container = this.add.container(node.x + offsetX, node.y + offsetY);
      const pole = this.add.rectangle(-10, 12, 4, 24, 0x3d4f6f, 1);
      const bg = this.add.circle(0, 0, 14, 0x0f1628, 1);
      bg.setStrokeStyle(2, 0x6b8cbf, 1);
      const colorHex = this.getSignalColorHex(signal);
      const light = this.add.circle(0, 0, 9, colorHex, 1);
      const glow = this.add.circle(0, 0, 18, colorHex, 0.2);
      this.tweens.add({ targets: glow, alpha: 0.4, scale: 1.2, duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
      if (signal.label) {
        const label = this.add.text(0, 24, signal.label, {
          fontFamily: 'Arial', fontSize: '10px', color: colors.textMuted
        });
        label.setOrigin(0.5);
        container.add(label);
      }
      container.add([pole, bg, light, glow]);
      container.setSize(30, 30);
      bg.setInteractive(new Phaser.Geom.Circle(0, 0, 16), Phaser.Geom.Circle.Contains);
      bg.on('pointerover', () => {
        this.tweens.add({ targets: container, scale: 1.15, duration: 150 });
        this.soundManager.playSFX(SFX_TYPES.HOVER);
      });
      bg.on('pointerout', () => {
        this.tweens.add({ targets: container, scale: 1, duration: 150 });
      });
      bg.on('pointerdown', () => this.onSignalClick(signal, container, light, glow));
      signal.graphics = container;
      signal.glowGraphics = glow;
      this.signalGraphics[signal.id] = { container, light, glow };
    });
  }

  getSignalColorHex(signal) {
    switch (signal.state) {
      case SIGNAL_STATES.GREEN: return 0x00b894;
      case SIGNAL_STATES.YELLOW: return 0xfdcb6e;
      case SIGNAL_STATES.RED: default: return 0xff4757;
    }
  }

  renderTrains() {
    this.gameState.trains.forEach(train => {
      const startNode = this.gameState.nodes[train.startNodeId];
      if (!startNode) return;
      const container = this.add.container(startNode.x, startNode.y);
      container.setDepth(100);
      const typeConfig = GAME_CONFIG.trainTypes[train.type];
      const colorHex = parseInt((typeConfig?.color || '#00cec9').replace('#', ''), 16);
      const shadow = this.add.ellipse(0, 18, 70, 10, 0x000000, 0.3);
      const body = this.add.rectangle(0, 0, 70, 30, colorHex, 0.95);
      body.setStrokeStyle(3, 0xffffff, 1);
      const icon = this.add.text(-18, 0, typeConfig?.icon || '🚄', { fontSize: '20px' });
      icon.setOrigin(0.5);
      const numberLabel = this.add.text(15, 0, train.trainNumber || train.id, {
        fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold',
        color: '#ffffff', stroke: '#000000', strokeThickness: 2
      });
      numberLabel.setOrigin(0.5);
      container.add([shadow, body, icon, numberLabel]);
      container.setAlpha(0.5);
      container.setScale(0.9);
      train.graphics = container;
      train.bodySprite = body;
      train.labelText = numberLabel;
      this.trainSprites[train.id] = container;
    });
  }

  createTopBar() {
    const { width } = this.scale;
    const colors = GAME_CONFIG.colors;
    const topBar = this.add.container(width / 2, 36);
    const bg = this.add.rectangle(0, 0, width, 60, 0x0a0f1c, 0.95);
    bg.setStrokeStyle(1, colors.primary, 0.3);
    const levelLabel = this.add.text(-width / 2 + 30, 0, `📍 ${this.currentLevel?.name || '关卡'}`, {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: colors.primary
    });
    levelLabel.setOrigin(0, 0.5);
    this.timeDisplay = this.add.text(0, -10, '⏱ 00:00', {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: colors.textPrimary
    });
    this.timeDisplay.setOrigin(0.5);
    this.parTimeDisplay = this.add.text(0, 14, `目标: ${this.formatParTime()}`, {
      fontFamily: 'Arial', fontSize: '12px', color: colors.textMuted
    });
    this.parTimeDisplay.setOrigin(0.5);
    this.scoreDisplay = this.add.text(width / 2 - 30, -10, '🏆 0', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: colors.warning
    });
    this.scoreDisplay.setOrigin(1, 0.5);
    this.progressDisplay = this.add.text(width / 2 - 30, 14, `🚄 0 / ${this.gameState.trains.length}`, {
      fontFamily: 'Arial', fontSize: '13px', color: colors.textSecondary
    });
    this.progressDisplay.setOrigin(1, 0.5);
    const pauseBtn = this.createTopBarButton(width / 2 - 130, 0, '⏸', () => this.togglePause());
    this.speedBtn = this.createTopBarButton(width / 2 - 90, 0, '⏩1x', () => this.cycleSpeed());
    topBar.add([bg, levelLabel, this.timeDisplay, this.parTimeDisplay, this.scoreDisplay, this.progressDisplay, pauseBtn, this.speedBtn]);
    const menuBtn = this.add.text(20, 68, '← 菜单', {
      fontFamily: 'Arial', fontSize: '14px', color: colors.textMuted
    });
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.soundManager.playSFX(SFX_TYPES.CLICK);
      this.endGame(false, 'exit');
    });
  }

  createTopBarButton(x, y, label, callback) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 36, 32, 0x1a2642, 1);
    bg.setStrokeStyle(2, colors.primary, 0.8);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial', fontSize: '11px', color: colors.primary
    });
    text.setOrigin(0.5);
    container.add([bg, text]);
    bg.setInteractive(new Phaser.Geom.Rectangle(-18, -16, 36, 32), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.1, duration: 150 });
      this.soundManager.playSFX(SFX_TYPES.HOVER);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 150 });
    });
    bg.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.9, duration: 100, yoyo: true });
      this.soundManager.playSFX(SFX_TYPES.CLICK);
    });
    bg.on('pointerup', () => { if (callback) callback(); });
    return container;
  }

  createBottomBar() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    this.hintText = this.add.text(width / 2, height - 25,
      '💡 点击道岔切换轨道方向，点击信号灯切换颜色，点击绿色入口节点放行列车',
      { fontFamily: 'Arial', fontSize: '14px', color: colors.textMuted }
    );
    this.hintText.setOrigin(0.5);
  }

  createSchedulePanel() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    const panelW = 260, panelH = height - 200;
    this.schedulePanel = this.add.container(width - panelW / 2 - 10, height / 2 - 20);
    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x0a0f1c, 0.95);
    bg.setStrokeStyle(2, colors.primary, 0.3);
    const title = this.add.text(0, -panelH / 2 + 25, '🚦 车次调度表', {
      fontFamily: 'Arial', fontSize: '17px', fontStyle: 'bold', color: colors.primary
    });
    title.setOrigin(0.5);
    const header1 = this.add.text(-panelW / 2 + 20, -panelH / 2 + 50, '车次', {
      fontFamily: 'Arial', fontSize: '11px', color: colors.textMuted
    });
    const header2 = this.add.text(-panelW / 2 + 80, -panelH / 2 + 50, '状态', {
      fontFamily: 'Arial', fontSize: '11px', color: colors.textMuted
    });
    const header3 = this.add.text(-panelW / 2 + 140, -panelH / 2 + 50, '优先级', {
      fontFamily: 'Arial', fontSize: '11px', color: colors.textMuted
    });
    const header4 = this.add.text(-panelW / 2 + 200, -panelH / 2 + 50, '时刻', {
      fontFamily: 'Arial', fontSize: '11px', color: colors.textMuted
    });
    [header1, header2, header3, header4].forEach(h => h.setOrigin(0, 0.5));
    this.schedulePanel.add([bg, title, header1, header2, header3, header4]);
    this.scheduleItems = {};
    this.scheduleStateTexts = {};
    this.schedulePriorityContainers = {};
    this.gameState.trains.forEach((train, i) => {
      this.createScheduleItem(train, i, panelW, panelH);
    });
  }

  createScheduleItem(train, index, panelW, panelH) {
    const colors = GAME_CONFIG.colors;
    const startY = -panelH / 2 + 80 + index * 55;
    const container = this.add.container(0, startY);
    const typeConfig = GAME_CONFIG.trainTypes[train.type];
    const colorHex = parseInt((typeConfig?.color || '#00cec9').replace('#', ''), 16);
    const itemBg = this.add.rectangle(0, 0, panelW - 20, 48, 0x1a2642, 0.7);
    itemBg.setStrokeStyle(1, 0x3d4f6f, 0.8);
    const nameText = this.add.text(-panelW / 2 + 30, -12, `${train.trainNumber || train.id}`, {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold',
      color: '#' + colorHex.toString(16).padStart(6, '0')
    });
    nameText.setOrigin(0, 0.5);
    const typeText = this.add.text(-panelW / 2 + 30, 12, `${typeConfig?.name || ''}`, {
      fontFamily: 'Arial', fontSize: '10px', color: colors.textMuted
    });
    typeText.setOrigin(0, 0.5);
    const stateText = this.add.text(-panelW / 2 + 85, 0, this.getTrainStateText(train), {
      fontFamily: 'Arial', fontSize: '11px', color: this.getTrainStateColor(train)
    });
    stateText.setOrigin(0, 0.5);
    this.scheduleStateTexts[train.id] = stateText;
    const priorityContainer = this.add.container(-panelW / 2 + 148, 0);
    this.renderPriorityIndicator(priorityContainer, train);
    this.schedulePriorityContainers[train.id] = priorityContainer;
    priorityContainer.setSize(40, 32);
    priorityContainer.setInteractive(new Phaser.Geom.Rectangle(-20, -16, 40, 32), Phaser.Geom.Rectangle.Contains);
    priorityContainer.on('pointerdown', () => this.cycleTrainPriority(train));
    priorityContainer.on('pointerover', () => {
      this.tweens.add({ targets: priorityContainer, scale: 1.1, duration: 150 });
      this.soundManager.playSFX(SFX_TYPES.HOVER);
    });
    priorityContainer.on('pointerout', () => {
      this.tweens.add({ targets: priorityContainer, scale: 1, duration: 150 });
    });
    const timeText = this.add.text(-panelW / 2 + 210, -12, `发${this.formatClock(train.scheduledDeparture)}`, {
      fontFamily: 'Arial', fontSize: '10px', color: colors.textSecondary
    });
    timeText.setOrigin(0, 0.5);
    const arrText = this.add.text(-panelW / 2 + 210, 12, `到${this.formatClock(train.scheduledArrival)}`, {
      fontFamily: 'Arial', fontSize: '10px', color: colors.textSecondary
    });
    arrText.setOrigin(0, 0.5);
    container.add([itemBg, nameText, typeText, stateText, priorityContainer, timeText, arrText]);
    itemBg.setInteractive(new Phaser.Geom.Rectangle(-(panelW - 20) / 2, -24, panelW - 20, 48), Phaser.Geom.Rectangle.Contains);
    itemBg.on('pointerover', () => {
      this.tweens.add({ targets: itemBg, fillColor: 0x2a3c5c, duration: 150 });
      this.highlightTrain(train.id, true);
    });
    itemBg.on('pointerout', () => {
      this.tweens.add({ targets: itemBg, fillColor: 0x1a2642, duration: 150 });
      this.highlightTrain(train.id, false);
    });
    this.schedulePanel.add(container);
    this.scheduleItems[train.id] = container;
  }

  renderPriorityIndicator(container, train) {
    container.removeAll(true);
    const priority = train.getFinalPriority();
    const priorityNames = ['', '低', '中', '高', '特快'];
    const priorityColors = ['', 0x95a5a6, 0x3498db, 0xf39c12, 0xe74c3c];
    const count = Math.min(priority, 4);
    for (let i = 0; i < 3; i++) {
      const color = i < count ? (priorityColors[priority] || 0xffffff) : 0x3d4f6f;
      const dot = this.add.circle(i * 10 - 10, 0, 4, color, 1);
      container.add(dot);
    }
    const label = this.add.text(14, 0, priorityNames[priority] || '?', {
      fontFamily: 'Arial', fontSize: '10px',
      color: '#' + ((priorityColors[priority] || 0x95a5a6).toString(16).padStart(6, '0'))
    });
    label.setOrigin(0, 0.5);
    container.add(label);
  }

  getTrainStateText(train) {
    switch (train.state) {
      case TRAIN_STATES.WAITING: return '待发车';
      case TRAIN_STATES.SPAWNED: return '已发车';
      case TRAIN_STATES.MOVING: return '运行中';
      case TRAIN_STATES.STOPPED: return train.stoppedReason || '停车';
      case TRAIN_STATES.AT_PLATFORM: return '停靠中';
      case TRAIN_STATES.COMPLETED: return '✅完成';
      case TRAIN_STATES.DERAILED: return '❌脱轨';
      default: return train.state;
    }
  }

  getTrainStateColor(train) {
    const colors = GAME_CONFIG.colors;
    switch (train.state) {
      case TRAIN_STATES.WAITING: return colors.textMuted;
      case TRAIN_STATES.SPAWNED:
      case TRAIN_STATES.MOVING: return colors.success;
      case TRAIN_STATES.STOPPED: return colors.warning;
      case TRAIN_STATES.AT_PLATFORM: return colors.primary;
      case TRAIN_STATES.COMPLETED: return colors.success;
      case TRAIN_STATES.DERAILED: return colors.danger;
      default: return colors.textSecondary;
    }
  }

  createConflictPanel() {
    const { height } = this.scale;
    const colors = GAME_CONFIG.colors;
    const panelW = 280, panelH = 180;
    this.conflictPanel = this.add.container(panelW / 2 + 10, height - 120);
    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x0a0f1c, 0.95);
    bg.setStrokeStyle(2, colors.danger, 0.4);
    const title = this.add.text(0, -panelH / 2 + 20, '⚠️ 冲突告警', {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: colors.warning
    });
    title.setOrigin(0.5);
    this.conflictCountText = this.add.text(panelW / 2 - 20, -panelH / 2 + 20, '0', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: colors.success
    });
    this.conflictCountText.setOrigin(1, 0.5);
    this.conflictListBg = this.add.rectangle(0, 10, panelW - 20, panelH - 55, 0x1a2642, 0.6);
    this.conflictListText = this.add.text(-panelW / 2 + 20, -panelH / 2 + 45,
      '✅ 当前无冲突\n所有列车运行正常',
      { fontFamily: 'Arial', fontSize: '12px', color: colors.textSecondary, wordWrap: { width: panelW - 40 }, lineSpacing: 4 }
    );
    this.conflictListText.setOrigin(0, 0);
    this.conflictPanel.add([bg, title, this.conflictCountText, this.conflictListBg, this.conflictListText]);
  }

  createObjectivePanel() {
    const colors = GAME_CONFIG.colors;
    const panelW = 240, panelH = 130;
    this.objectivePanel = this.add.container(panelW / 2 + 10, 130);
    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x0a0f1c, 0.95);
    bg.setStrokeStyle(2, colors.success, 0.3);
    const title = this.add.text(0, -panelH / 2 + 20, '🎯 目标', {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: colors.success
    });
    title.setOrigin(0.5);
    const objectives = this.currentLevel?.objectives || [];
    this.objectiveTexts = [];
    objectives.slice(0, 3).forEach((obj, i) => {
      const y = -panelH / 2 + 50 + i * 25;
      const txt = this.add.text(-panelW / 2 + 20, y, `⬜ ${obj.description}`, {
        fontFamily: 'Arial', fontSize: '12px', color: colors.textSecondary, wordWrap: { width: panelW - 40 }
      });
      txt.setOrigin(0, 0.5);
      this.objectivePanel.add(txt);
      this.objectiveTexts.push({ text: txt, obj });
    });
    this.objectivePanel.add([bg, title]);
  }

  createStartDialog() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    this.startOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.startOverlay.setDepth(5000);
    this.startDialog = this.add.container(width / 2, height / 2);
    this.startDialog.setDepth(5001);
    const dialogW = 520, dialogH = 380;
    const bg = this.add.rectangle(0, 0, dialogW, dialogH, 0x1a2642, 0.98);
    bg.setStrokeStyle(3, colors.primary, 1);
    const title = this.add.text(0, -dialogH / 2 + 45, `🚂 ${this.currentLevel?.name || '关卡'}`, {
      fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold', color: colors.primary
    });
    title.setOrigin(0.5);
    const difficultyStr = '★'.repeat(this.currentLevel?.difficulty || 1) +
      '☆'.repeat(3 - (this.currentLevel?.difficulty || 1));
    const difficultyText = this.add.text(0, -dialogH / 2 + 80, `难度 ${difficultyStr}  |  目标时间 ${this.formatParTime()}`, {
      fontFamily: 'Arial', fontSize: '13px', color: colors.warning
    });
    difficultyText.setOrigin(0.5);
    const descText = this.add.text(0, -dialogH / 2 + 120, this.currentLevel?.description || '', {
      fontFamily: 'Arial', fontSize: '14px', color: colors.textSecondary,
      align: 'center', wordWrap: { width: dialogW - 80 }
    });
    descText.setOrigin(0.5, 0);
    const objectivesTitle = this.add.text(-dialogW / 2 + 40, -30, '🎯 关卡目标：', {
      fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: colors.success
    });
    objectivesTitle.setOrigin(0, 0);
    const objectives = this.currentLevel?.objectives || [];
    objectives.slice(0, 3).forEach((obj, i) => {
      const t = this.add.text(-dialogW / 2 + 60, 0 + i * 22, `• ${obj.description}`, {
        fontFamily: 'Arial', fontSize: '13px', color: colors.textSecondary
      });
      t.setOrigin(0, 0);
      this.startDialog.add(t);
    });
    const startBtn = this.createDialogButton(-100, dialogH / 2 - 50, '🚀 开始调度', 'primary',
      () => this.startGameFromDialog());
    const cancelBtn = this.createDialogButton(100, dialogH / 2 - 50, '返回菜单', 'secondary',
      () => {
        this.soundManager.playSFX(SFX_TYPES.CLICK);
        this.scene.start(SCENE_KEYS.MENU);
      });
    this.startDialog.add([bg, title, difficultyText, descText, objectivesTitle, startBtn, cancelBtn]);
    this.animationCtrl.popIn(this.startDialog, 500);
  }

  createDialogButton(x, y, label, style, callback) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);
    const isPrimary = style === 'primary';
    const bg = this.add.rectangle(0, 0, 160, 46, isPrimary ? 0x4a9eff : 0x0f1628, 0.95);
    bg.setStrokeStyle(2, isPrimary ? 0x7eb8ff : colors.primary, 1);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold',
      color: isPrimary ? '#ffffff' : colors.primary
    });
    text.setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(160, 46);
    bg.setInteractive(new Phaser.Geom.Rectangle(-80, -23, 160, 46), Phaser.Geom.Rectangle.Contains);
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
    bg.on('pointerup', () => { if (callback) callback(); });
    return container;
  }

  startGameFromDialog() {
    this.animationCtrl.fadeOut(this.startOverlay, 300);
    this.animationCtrl.popOut(this.startDialog, 300, 0, () => {
      this.gameState.startGame();
      this.soundManager.playSFX(SFX_TYPES.SUCCESS);
      this.animationCtrl.screenFlash(0x4ecdc4, 0.1, 300);
      this.hintText.setText('💡 点击绿色入口节点 或 将信号灯切绿 来放行列车！');
    });
    if (this.currentLevel?.tutorialLevel && this.fromTutorial) {
      this.time.delayedCall(1000, () => this.runTutorial());
    }
  }

  runTutorial() {
    const steps = this.currentLevel?.tutorialSteps || [];
    if (!steps.length) return;
    this.showTutorialTip(steps[0].title + ': ' + steps[0].text, 5000);
  }

  showTutorialTip(msg, duration = 4000) {
    const { width } = this.scale;
    const colors = GAME_CONFIG.colors;
    const tip = this.add.container(width / 2, 160);
    tip.setDepth(4000);
    const text = this.add.text(0, 0, '📚 ' + msg, {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold',
      color: colors.warning, wordWrap: { width: 600 }, align: 'center'
    });
    text.setOrigin(0.5);
    const pad = 20;
    const bg = this.add.rectangle(0, 0, text.width + pad * 2, text.height + pad, 0x1a2642, 0.95);
    bg.setStrokeStyle(2, colors.warning, 0.9);
    tip.add([bg, text]);
    tip.setAlpha(0);
    this.tweens.add({ targets: tip, alpha: 1, y: 170, duration: 300, ease: 'Back.easeOut' });
    this.time.delayedCall(duration, () => {
      this.tweens.add({ targets: tip, alpha: 0, y: 150, duration: 400, onComplete: () => tip.destroy() });
    });
  }

  formatParTime() {
    const t = this.currentLevel?.parTime || 120;
    return `${Math.floor(t / 60)}分${(t % 60).toString().padStart(2, '0')}秒`;
  }

  formatClock(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  onNodeClick(node, container) {
    this.soundManager.playSFX(SFX_TYPES.CLICK);
    this.animationCtrl.shake(container, 5, 250);
    if (node.isSwitch) this.onSwitchClick(node);
    else if (node.type === NODE_TYPES.SPAWN) this.onSpawnClick(node);
    else if (node.type === NODE_TYPES.PLATFORM) this.onPlatformClick(node);
  }

  onSwitchClick(node) {
    const prevState = node.switchState;
    const success = node.toggleSwitch();
    if (success) {
      this.soundManager.playSFX(SFX_TYPES.SWITCH);
      this.animationCtrl.flashRect(node.x, node.y, 80, 80, 0x4a9eff, 0.4, 400);
      this.gameState.recordAction('switch', { nodeId: node.id, oldState: prevState, newState: node.switchState });
      this.hintText.setText(`🔀 道岔 ${node.label || node.id} 切换到路线 ${node.switchState + 1}`);
    } else {
      this.soundManager.playSFX(SFX_TYPES.ERROR);
      this.showToast('道岔已锁定，无法切换', 'error');
    }
  }

  onSpawnClick(node) {
    const train = this.gameState.trains.find(t =>
      t.startNodeId === node.id &&
      (t.state === TRAIN_STATES.WAITING || t.state === TRAIN_STATES.SPAWNED)
    );
    if (train && train.state === TRAIN_STATES.WAITING) {
      this.tryStartTrain(train);
    } else if (train) {
      this.highlightTrain(train.id, true);
      this.time.delayedCall(1000, () => this.highlightTrain(train.id, false));
    }
  }

  onPlatformClick(node) {
    const platformId = node.platformId;
    const occupied = node.occupantTrainId;
    if (occupied) {
      const train = this.gameState.getTrainById(occupied);
      if (train) {
        this.highlightTrain(train.id, true);
        this.hintText.setText(`🏛 站台 ${node.platformName} 被 ${train.displayName} 占用`);
        this.time.delayedCall(2000, () => this.highlightTrain(train.id, false));
      }
    } else {
      this.hintText.setText(`🏛 站台 ${node.platformName} 当前空闲`);
    }
  }

  onSignalClick(signal, container, light, glow) {
    const prevState = signal.state;
    if (signal.mode === SIGNAL_MODES.MANUAL && !signal.locked) {
      signal.toggle();
      this.soundManager.playSFX(SFX_TYPES.SIGNAL_CHANGE);
      this.animationCtrl.shake(container, 4, 200);
      const newColor = this.getSignalColorHex(signal);
      light.fillColor = newColor;
      glow.fillColor = newColor;
      this.gameState.recordAction('signal', { signalId: signal.id, oldState: prevState, newState: signal.state });
      this.hintText.setText(`🚦 ${signal.label || signal.id}: ${this.getSignalStateName(signal.state)}`);
    } else {
      this.soundManager.playSFX(SFX_TYPES.ERROR);
      this.showToast('此信号为自动控制模式', 'warning');
    }
  }

  getSignalStateName(state) {
    switch (state) {
      case SIGNAL_STATES.GREEN: return '绿灯（通行）';
      case SIGNAL_STATES.YELLOW: return '黄灯（减速）';
      case SIGNAL_STATES.RED: default: return '红灯（停止）';
    }
  }

  tryStartTrain(train) {
    const node = this.gameState.nodes[train.startNodeId];
    const signal = this.gameState.getSignalByNodeId(train.startNodeId);
    if (this.gameState.gameTime < train.scheduledDeparture) {
      const waitTime = train.scheduledDeparture - this.gameState.gameTime;
      this.soundManager.playSFX(SFX_TYPES.ERROR);
      this.showToast(`未到发车时间，还需等待 ${waitTime.toFixed(0)} 秒`, 'warning');
      return;
    }
    if (signal && !signal.canPass()) {
      this.soundManager.playSFX(SFX_TYPES.ERROR);
      this.showToast(`${signal.label || '信号灯'}为红灯，请切换为绿灯`, 'error');
      if (signal.graphics) this.animationCtrl.shake(signal.graphics, 8, 400);
      return;
    }
    train.state = TRAIN_STATES.SPAWNED;
    train.actualDeparture = this.gameState.gameTime;
    const sprite = this.trainSprites[train.id];
    if (sprite) {
      sprite.setAlpha(1);
      sprite.setScale(1);
      this.animationCtrl.popIn(sprite, 300, 1);
    }
    this.soundManager.playSFX(SFX_TYPES.TRAIN_HORN);
    this.animationCtrl.flashRect(node.x, node.y, 100, 100, 0x00cec9, 0.3, 500);
    this.animationCtrl.counterText(node.x, node.y - 50, '出发!', GAME_CONFIG.colors.success, 1000);
    this.gameState.recordAction('start_train', { trainId: train.id, time: this.gameState.gameTime });
    this.hintText.setText(`🚂 ${train.displayName} 已发车！`);
    this.time.delayedCall(800, () => this.dispatchTrainToNext(train));
  }

  dispatchTrainToNext(train) {
    if (train.state === TRAIN_STATES.COMPLETED || train.state === TRAIN_STATES.DERAILED) return;
    train.state = TRAIN_STATES.MOVING;
    const currentNode = this.gameState.nodes[train.currentNodeId];
    const connections = currentNode.getActiveConnections();
    let nextNodeId = null;
    if (train.waypoints && train.waypoints.length > 0) {
      const nextWp = train.waypoints[0];
      if (connections.includes(nextWp)) {
        nextNodeId = nextWp;
        train.waypoints.shift();
      }
    }
    if (!nextNodeId && train.targetPlatformId) {
      nextNodeId = connections.find(cid => {
        const node = this.gameState.nodes[cid];
        return node && (node.platformId === train.targetPlatformId ||
          node.type === NODE_TYPES.TERMINAL || (node.type !== NODE_TYPES.SPAWN));
      });
    }
    if (!nextNodeId) {
      nextNodeId = connections.find(cid => {
        const node = this.gameState.nodes[cid];
        return node && cid !== train.prevNodeId && node.type !== NODE_TYPES.SPAWN;
      });
    }
    if (!nextNodeId) nextNodeId = connections.find(cid => cid !== train.prevNodeId) || connections[0];
    if (!nextNodeId) {
      train.state = TRAIN_STATES.STOPPED;
      train.stoppedReason = '无路可走';
      this.soundManager.playSFX(SFX_TYPES.ERROR);
      this.showToast(`${train.displayName} 找不到前进路线，请切换道岔！`, 'error');
      return;
    }
    const nextNode = this.gameState.nodes[nextNodeId];
    const nextSignal = this.gameState.getSignalByNodeId(nextNodeId);
    if (nextNode.occupied && nextNode.occupantTrainId !== train.id) {
      if (nextNode.type === NODE_TYPES.PLATFORM && nextNode.platformId === train.targetPlatformId) {
        train.state = TRAIN_STATES.STOPPED;
        train.stoppedReason = '等待站台';
        this.time.delayedCall(1500, () => { if (!nextNode.occupied) this.dispatchTrainToNext(train); });
        return;
      }
      const occupant = this.gameState.getTrainById(nextNode.occupantTrainId);
      if (occupant && occupant.state === TRAIN_STATES.MOVING) {
        train.state = TRAIN_STATES.STOPPED;
        train.stoppedReason = `等待 ${occupant.displayName} 通过`;
        return;
      }
    }
    train.prevNodeId = train.currentNodeId;
    train.nextNodeId = nextNodeId;
    train.progressOnSegment = 0;
    train.segmentLength = Phaser.Math.Distance.Between(currentNode.x, currentNode.y, nextNode.x, nextNode.y) || 100;
    const dx = nextNode.x - currentNode.x;
    const dy = nextNode.y - currentNode.y;
    train.targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    train.currentSpeed = train.baseSpeed * 0.5;
  }

  cycleTrainPriority(train) {
    this.soundManager.playSFX(SFX_TYPES.CLICK);
    const priorities = [1, 2, 3, 3];
    const current = train.getFinalPriority();
    const idx = priorities.indexOf(current);
    const nextPri = priorities[(idx + 1) % priorities.length];
    train.setManualPriority(nextPri);
    const container = this.schedulePriorityContainers[train.id];
    if (container) {
      this.renderPriorityIndicator(container, train);
      this.animationCtrl.shake(container, 3, 200);
    }
    this.gameState.recordAction('priority', { trainId: train.id, priority: nextPri });
  }

  highlightTrain(trainId, highlight) {
    const sprite = this.trainSprites[trainId];
    if (!sprite) return;
    this.tweens.add({ targets: sprite, scale: highlight ? 1.2 : 1, duration: 200 });
  }

  showToast(message, type = 'info') {
    const { width } = this.scale;
    const colors = GAME_CONFIG.colors;
    let bgColor = 0x1a2642, borderColor = colors.primary, textColor = colors.textPrimary;
    switch (type) {
      case 'error': bgColor = 0x3a1a1a; borderColor = colors.danger; textColor = colors.danger; break;
      case 'warning': bgColor = 0x3a2e1a; borderColor = colors.warning; textColor = colors.warning; break;
      case 'success': bgColor = 0x1a3a32; borderColor = colors.success; textColor = colors.success; break;
    }
    const y = 90;
    const container = this.add.container(width / 2, y);
    container.setDepth(3000);
    const text = this.add.text(0, 0, message, {
      fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold',
      color: textColor, wordWrap: { width: 500 }
    });
    text.setOrigin(0.5);
    const padding = 20;
    const bg = this.add.rectangle(0, 0, text.width + padding * 2, text.height + padding, bgColor, 0.95);
    bg.setStrokeStyle(2, borderColor, 0.9);
    container.add([bg, text]);
    container.y = 60;
    container.setAlpha(0);
    this.tweens.add({ targets: container, y: 90, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: container, y: 100, alpha: 0, duration: 2500, delay: 1500,
      ease: 'Cubic.easeIn', onComplete: () => container.destroy()
    });
  }

  togglePause() {
    if (this.gameState.isRunning()) {
      this.gameState.pause();
      this.soundManager.playSFX(SFX_TYPES.CLICK);
      this.showToast('⏸ 游戏已暂停', 'info');
    } else if (this.gameState.status === 'paused') {
      this.gameState.resume();
      this.soundManager.playSFX(SFX_TYPES.CLICK);
      this.showToast('▶ 游戏继续', 'success');
    }
  }

  cycleSpeed() {
    const speeds = [GAME_CONFIG.gameSpeed.normal, GAME_CONFIG.gameSpeed.fast, GAME_CONFIG.gameSpeed.superFast];
    const labels = { 1: '⏩1x', 2: '⏩2x', 4: '⏩4x' };
    const idx = speeds.indexOf(this.gameState.gameSpeed);
    const nextSpeed = speeds[(idx + 1) % speeds.length];
    this.gameState.setGameSpeed(nextSpeed);
    if (this.speedBtn) {
      const t = this.speedBtn.list[1];
      if (t) t.setText(labels[nextSpeed] || ('⏩' + nextSpeed));
    }
    this.soundManager.playSFX(SFX_TYPES.TICK);
    this.showToast(`⏩ 游戏速度: ${labels[nextSpeed] || nextSpeed}`, 'info');
  }

  update(time, delta) {
    if (!this.gameState || !this.gameState.isRunning() || this.gameEnded) return;
    const gameDelta = delta * this.gameState.gameSpeed;
    this.gameState.update(gameDelta);
    this.deltaAccumulator += gameDelta;
    if (this.deltaAccumulator >= 16) {
      this.updateGameLogic(this.deltaAccumulator);
      this.deltaAccumulator = 0;
    }
    this.updateUI();
    this.conflictCheckTimer += delta;
    if (this.conflictCheckTimer >= 500) {
      this.conflictCheckTimer = 0;
      this.runConflictDetection();
    }
    this.checkVictoryConditions();
  }

  updateGameLogic(deltaMs) {
    const deltaSec = deltaMs / 1000;
    this.gameState.trains.forEach(train => {
      if (train.state === TRAIN_STATES.MOVING && train.nextNodeId) {
        this.updateTrainPosition(train, deltaSec);
      } else if (train.state === TRAIN_STATES.AT_PLATFORM) {
        train.platformProgress += deltaSec;
        const waitTime = train.platformWaitTime || 20;
        if (train.platformProgress >= waitTime) this.onTrainDepartPlatform(train);
      } else if (train.state === TRAIN_STATES.STOPPED) {
        this.updateStoppedTrain(train, deltaSec);
      }
    });
  }

  updateTrainPosition(train, deltaSec) {
    const speed = train.currentSpeed * 50 * deltaSec;
    train.progressOnSegment += speed / train.segmentLength;
    if (train.progressOnSegment >= 0.2) {
      const curNode = this.gameState.nodes[train.currentNodeId];
      if (curNode) curNode.setOccupied(false);
    }
    if (train.progressOnSegment >= 0.8) {
      const nextNode = this.gameState.nodes[train.nextNodeId];
      if (nextNode && nextNode.isSwitch) {
        const connections = nextNode.getActiveConnections();
        const canContinue = connections.some(cid => cid !== train.currentNodeId) || connections.length === 0;
        const hasAlt = nextNode.altConnections && nextNode.altConnections.length > 0;
        if (hasAlt) {
          const active = nextNode.getActiveConnections();
          const fromId = train.currentNodeId;
          if (!active.includes(fromId)) {
            this.soundManager.playSFX(SFX_TYPES.ERROR);
            this.showToast(`${train.displayName} 前方道岔错误，已脱轨！`, 'error');
            train.state = TRAIN_STATES.DERAILED;
            this.failureReason = 'switchError';
            const sprite = this.trainSprites[train.id];
            if (sprite) {
              this.animationCtrl.shake(sprite, 15, 800);
              this.animationCtrl.flashRect(nextNode.x, nextNode.y, 100, 100, 0xff4757, 0.6, 700);
            }
            this.endGame(false, 'switchError');
            return;
          }
        }
      }
      const nextSignal = this.gameState.getSignalByNodeId(train.nextNodeId);
      if (nextSignal && nextSignal.isRed() && !nextSignal.locked && train.progressOnSegment < 0.92) {
        train.progressOnSegment = 0.9;
        train.state = TRAIN_STATES.STOPPED;
        train.stoppedReason = '红灯停车';
        this.time.delayedCall(1200, () => {
          if (train.state === TRAIN_STATES.STOPPED) {
            const s = this.gameState.getSignalByNodeId(train.nextNodeId);
            if (s && s.canPass()) {
              train.state = TRAIN_STATES.MOVING;
              train.stoppedReason = null;
            }
          }
        });
        return;
      }
    }
    if (train.progressOnSegment >= 1) {
      this.onTrainArriveNode(train);
      return;
    }
    const fromNode = this.gameState.nodes[train.currentNodeId];
    const toNode = this.gameState.nodes[train.nextNodeId];
    if (fromNode && toNode) {
      train.x = Phaser.Math.Linear(fromNode.x, toNode.x, train.progressOnSegment);
      train.y = Phaser.Math.Linear(fromNode.y, toNode.y, train.progressOnSegment);
      const sprite = this.trainSprites[train.id];
      if (sprite) {
        sprite.setPosition(train.x, train.y);
        const targetAngle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) * 180 / Math.PI;
        sprite.setAngle(targetAngle);
      }
    }
    const targetSpeed = train.baseSpeed;
    train.updateSpeed(targetSpeed, deltaSec * 1000);
  }

  onTrainArriveNode(train) {
    const nextNode = this.gameState.nodes[train.nextNodeId];
    if (!nextNode) return;
    train.currentNodeId = train.nextNodeId;
    train.nextNodeId = null;
    train.progressOnSegment = 0;
    if (nextNode) {
      nextNode.setOccupied(true, train.id);
      train.x = nextNode.x;
      train.y = nextNode.y;
      const sprite = this.trainSprites[train.id];
      if (sprite) {
        sprite.setPosition(nextNode.x, nextNode.y);
        sprite.setAngle(0);
      }
    }
    this.soundManager.playSFX(SFX_TYPES.TRAIN_ARRIVE);
    this.animationCtrl.flashRect(nextNode.x, nextNode.y, 80, 80, 0x4ecdc4, 0.3, 400);
    if (nextNode.type === NODE_TYPES.PLATFORM &&
      (!train.targetPlatformId || nextNode.platformId === train.targetPlatformId)) {
      train.state = TRAIN_STATES.AT_PLATFORM;
      train.platformProgress = 0;
      this.showToast(`🚉 ${train.displayName} 到达 ${nextNode.platformName}`, 'success');
      return;
    }
    if (nextNode.type === NODE_TYPES.TERMINAL || (train.endNodeId && nextNode.id === train.endNodeId)) {
      this.onTrainComplete(train);
      return;
    }
    this.time.delayedCall(600, () => this.dispatchTrainToNext(train));
  }

  onTrainDepartPlatform(train) {
    const node = this.gameState.nodes[train.currentNodeId];
    if (node) node.setOccupied(false);
    this.soundManager.playSFX(SFX_TYPES.TRAIN_DEPART);
    this.showToast(`🚂 ${train.displayName} 驶离站台`, 'info');
    train.state = TRAIN_STATES.MOVING;
    train.platformProgress = 0;
    this.time.delayedCall(400, () => this.dispatchTrainToNext(train));
  }

  updateStoppedTrain(train, deltaSec) {
    if (!train.stoppedReason || train.stoppedReason.includes('等待')) {
      train.addDelay(deltaSec);
      this.time.delayedCall(2000, () => {
        if (train.state === TRAIN_STATES.STOPPED) this.dispatchTrainToNext(train);
      });
    }
    if (train.isSeverelyDelayed() && !this.failureReason) {
      this.failureReason = 'delayChain';
    }
  }

  onTrainComplete(train) {
    train.state = TRAIN_STATES.COMPLETED;
    train.actualArrival = this.gameState.gameTime;
    const node = this.gameState.nodes[train.currentNodeId];
    if (node) node.setOccupied(false);
    const sprite = this.trainSprites[train.id];
    if (sprite) {
      this.animationCtrl.fadeOut(sprite, 600);
      this.animationCtrl.flashRect(train.x, train.y, 120, 120, 0x4ecdc4, 0.5, 700);
      this.animationCtrl.createConfetti(train.x, train.y, 25);
    }
    this.soundManager.playSFX(SFX_TYPES.SUCCESS);
    this.animationCtrl.counterText(train.x, train.y - 40, `+${train.getScoreBonus()}分`, GAME_CONFIG.colors.success, 1000);
    this.gameState.addScore(train.getScoreBonus());
    this.gameState.addScore(-train.getScorePenalty());
    window.SaveSystem?.updateStatistics('totalTrainsDispatched', 1);
    this.showToast(`🏆 ${train.displayName} 完成！(+${train.getScoreBonus()})`, 'success');
  }

  runConflictDetection() {
    const conflicts = this.conflictDetector.detectAll(
      this.gameState.nodes, this.gameState.signals, this.gameState.trains
    );
    this.gameState.currentConflicts = conflicts;
    if (conflicts.length > 0) {
      this.updateConflictPanel();
      const criticals = this.conflictDetector.getCriticalConflicts();
      if (criticals.length >= 2 && !this.failureReason) {
        this.failureReason = criticals[0].type;
      }
      conflicts.forEach(c => {
        if (c.severity === 'critical' && !this.gameEnded) {
          if (criticals.length >= 3) {
            this.failureReason = c.type;
            this.endGame(false, c.type);
          }
        }
      });
    } else {
      this.updateConflictPanel();
    }
  }

  updateConflictPanel() {
    const colors = GAME_CONFIG.colors;
    const conflicts = this.conflictDetector.getActiveConflicts();
    const criticalCount = this.conflictDetector.getCriticalConflicts().length;
    const warningCount = this.conflictDetector.getWarningConflicts().length;
    this.conflictCountText.setText(`${conflicts.length}`);
    this.conflictCountText.setColor(
      criticalCount > 0 ? colors.danger : (warningCount > 0 ? colors.warning : colors.success)
    );
    if (conflicts.length === 0) {
      this.conflictListText.setText('✅ 当前无冲突\n所有列车运行正常');
      this.conflictListText.setColor(colors.success);
      this.conflictPanel.list[0].setStrokeStyle(2, colors.success, 0.4);
      return;
    }
    this.conflictPanel.list[0].setStrokeStyle(
      2, criticalCount > 0 ? colors.danger : colors.warning, 0.6
    );
    const typeNames = GAME_CONFIG.conflictTypes;
    const lines = conflicts.slice(0, 5).map(c => {
      const icon = c.severity === 'critical' ? '🔴' : '🟡';
      const name = typeNames[c.type]?.name || c.type;
      return `${icon} ${name}`;
    });
    if (conflicts.length > 5) lines.push(`... 另有 ${conflicts.length - 5} 项冲突`);
    this.conflictListText.setText(lines.join('\n'));
    this.conflictListText.setColor(criticalCount > 0 ? colors.danger : colors.warning);
  }

  updateUI() {
    const colors = GAME_CONFIG.colors;
    if (this.timeDisplay) {
      this.timeDisplay.setText(`⏱ ${this.gameState.getGameTimeFormatted()}`);
    }
    if (this.scoreDisplay) {
      this.scoreDisplay.setText(`🏆 ${this.gameState.score}`);
    }
    if (this.progressDisplay) {
      const done = this.gameState.getTrainCompletionCount();
      this.progressDisplay.setText(`🚄 ${done} / ${this.gameState.trains.length}`);
    }
    this.gameState.trains.forEach(train => {
      const stateText = this.scheduleStateTexts[train.id];
      if (stateText) {
        stateText.setText(this.getTrainStateText(train));
        stateText.setColor(this.getTrainStateColor(train));
      }
    });
    this.updateObjectives();
  }

  updateObjectives() {
    const colors = GAME_CONFIG.colors;
    if (!this.objectiveTexts) return;
    this.objectiveTexts.forEach(item => {
      const obj = item.obj;
      let completed = false;
      let progress = 0;
      switch (obj.type) {
        case 'trains_completed':
          progress = this.gameState.getTrainCompletionCount();
          completed = progress >= obj.target;
          break;
        case 'critical_conflicts':
          progress = this.conflictDetector.getConflictCount();
          const criticalCount = this.conflictDetector.getSummary().critical;
          completed = criticalCount <= obj.target;
          progress = obj.target - criticalCount;
          break;
        case 'on_time_rate':
          progress = this.gameState.getOnTimeRate();
          completed = progress >= obj.target;
          break;
        default:
          completed = false;
      }
      const icon = completed ? '✅' : (progress > 0 ? '◻️' : '⬜');
      item.text.setText(`${icon} ${obj.description}${obj.target > 1 ? ` (${progress}/${obj.target})` : ''}`);
      item.text.setColor(completed ? colors.success : colors.textSecondary);
    });
  }

  checkVictoryConditions() {
    if (this.gameEnded) return;
    const allDone = this.gameState.areAllTrainsCompleted();
    if (allDone) {
      const successCount = this.gameState.getTrainCompletionCount();
      const total = this.gameState.trains.length;
      const rate = this.gameState.getOnTimeRate();
      const criticals = this.conflictDetector.getSummary().critical;
      let success = successCount === total;
      if (success && criticals > 2) success = false;
      if (success && rate < 50) success = false;
      this.endGame(success, success ? null : (this.failureReason || 'quality'));
    }
    const maxTime = (this.currentLevel?.parTime || 120) * 3;
    if (this.gameState.gameTime > maxTime && !this.gameEnded) {
      this.endGame(false, 'timeout');
    }
  }

  endGame(success, reason) {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.gameState.status = success ? 'completed' : 'failed';
    const colors = GAME_CONFIG.colors;
    const total = this.gameState.trains.length;
    const completed = this.gameState.getTrainCompletionCount();
    const onTimeRate = this.gameState.getOnTimeRate();
    let stars = 0;
    if (success) {
      stars = 1;
      if (onTimeRate >= 80) stars = 2;
      const summary = this.conflictDetector.getSummary();
      if (onTimeRate >= 95 && summary.total === 0) stars = 3;
    }
    const time = this.gameState.gameTime;
    const score = this.gameState.score + stars * 500 + Math.max(0, Math.floor((this.currentLevel?.parTime || 120) - time)) * 5;
    window.EventBus.emit('level:complete', { levelId: this.levelId, stars, time, score });
    if (success && window.SaveSystem) {
      window.SaveSystem.onLevelComplete({ levelId: this.levelId, stars, time, score });
    }
    const sessionData = window.SaveSystem?.endSession({ success, stars, reason });
    this.conflictDetector.activeConflicts.forEach(c => c.resolve('game_end'));
    this.time.delayedCall(800, () => {
      if (success) this.animationCtrl.screenFlash(0x4ecdc4, 0.2, 500);
      else this.animationCtrl.screenFlash(0xff4757, 0.2, 500);
      this.scene.start(SCENE_KEYS.RESULT, {
        result: {
          success,
          levelId: this.levelId,
          levelName: this.currentLevel?.name || this.levelId,
          score,
          stars,
          time,
          trainsCompleted: completed,
          trainsTotal: total,
          onTimeRate,
          conflicts: this.conflictDetector.getConflictHistory(),
          criticalConflicts: this.conflictDetector.getSummary().critical,
          reason,
          sessionData
        }
      });
    });
  }
}
