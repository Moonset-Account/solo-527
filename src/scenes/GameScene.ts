import Phaser from 'phaser';
import { TrackNetwork } from '../game/TrackNetwork.js';
import { SignalSystem } from '../game/SignalSystem.js';
import { TrainScheduler } from '../game/TrainScheduler.js';
import { TrainEntity } from '../game/Train.js';
import { LevelConfig, Conflict, ReplayAction } from '../data/types.js';
import { AudioManager } from '../core/AudioManager.js';
import { InputMapper } from '../core/InputMapper.js';
import { UIStateManager } from '../core/UIStateManager.js';
import { ReplaySystem } from '../core/ReplaySystem.js';
import { SaveManager } from '../core/SaveManager.js';
import { TrainSchedulePanel } from '../ui/TrainSchedulePanel.js';
import { ConflictAlert } from '../ui/ConflictAlert.js';
import { TimelineBar } from '../ui/TimelineBar.js';
import { ReplayControls } from '../ui/ReplayControls.js';
import { createButton, shakeScreen, flashScreen } from '../utils/helpers.js';
import { LEVELS } from '../levels/index.js';

const FONT_FAMILY = '"Courier New", monospace';

interface TrainSprite {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
}

export class GameScene extends Phaser.Scene {
  private levelConfig!: LevelConfig;
  private network!: TrackNetwork;
  private signalSystem!: SignalSystem;
  private scheduler!: TrainScheduler;
  private replaySystem!: ReplaySystem;
  private audioManager!: AudioManager;
  private inputMapper!: InputMapper;
  private uiStateManager!: UIStateManager;
  private saveManager!: SaveManager;

  private paused: boolean = true;
  private gameOver: boolean = false;
  private victory: boolean = false;
  private gameTime: number = 0;
  private speedMultiplier: number = 1;

  private trackGraphics!: Phaser.GameObjects.Graphics;
  private trackContainer!: Phaser.GameObjects.Container;
  private nodeGraphics!: Phaser.GameObjects.Container;
  private trainSprites: Map<string, TrainSprite> = new Map();
  private nodeVisuals: Map<string, { graphics: Phaser.GameObjects.Container; directionLine?: Phaser.GameObjects.Graphics; signalCircle?: Phaser.GameObjects.Arc }> = new Map();

  private schedulePanel!: TrainSchedulePanel;
  private timelineBar!: TimelineBar;
  private conflictAlert!: ConflictAlert;
  private replayControls!: ReplayControls;
  private startButton!: Phaser.GameObjects.Container;
  private pauseButton!: Phaser.GameObjects.Container;
  private levelNameText!: Phaser.GameObjects.Text;
  private speedButtons: Phaser.GameObjects.Container[] = [];
  private activeSpeedIndex: number = 0;

  private endTransitionScheduled: boolean = false;
  private lastPanelUpdate: number = 0;
  private panelUpdateInterval: number = 500;

  private isPlaybackMode: boolean = false;
  private playbackActions: ReplayAction[] = [];
  private playbackIndex: number = 0;
  private playbackOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelId?: string; level?: LevelConfig; playbackActions?: ReplayAction[] }): void {
    if (data.level) {
      this.levelConfig = data.level;
    } else {
      const found = LEVELS.find(l => l.id === data.levelId);
      this.levelConfig = found ?? LEVELS[0];
    }

    this.paused = true;
    this.gameOver = false;
    this.victory = false;
    this.gameTime = 0;
    this.speedMultiplier = 1;
    this.endTransitionScheduled = false;
    this.trainSprites.clear();
    this.nodeVisuals.clear();
    this.speedButtons = [];
    this.activeSpeedIndex = 0;
    this.isPlaybackMode = false;
    this.playbackActions = [];
    this.playbackIndex = 0;

    this.network = new TrackNetwork(this.levelConfig.nodes, this.levelConfig.edges);
    this.signalSystem = new SignalSystem(this.network);
    this.scheduler = new TrainScheduler(this.network);
    this.replaySystem = new ReplaySystem();
    this.audioManager = new AudioManager(this);
    this.inputMapper = new InputMapper(this);
    this.uiStateManager = new UIStateManager();
    this.saveManager = new SaveManager();

    if (data.playbackActions && data.playbackActions.length > 0) {
      this.isPlaybackMode = true;
      this.playbackActions = [...data.playbackActions];
      this.playbackIndex = 0;
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a2744');

    this.scheduler.init(this.levelConfig.trains);

    this.drawTrackNetwork();
    this.drawInteractiveNodes();
    this.createTrainSprites();
    this.createUI();
    this.createStartButton();
    this.bindInput();
    this.createSpeedControls();

    this.add.existing(this.schedulePanel);
    this.add.existing(this.timelineBar);
    this.add.existing(this.conflictAlert);
    this.add.existing(this.replayControls);

    this.uiStateManager.setState('idle');

    if (this.isPlaybackMode) {
      this.startButton.setVisible(false);
      this.paused = false;
      this.scheduler.startAllReady();
      this.showPlaybackOverlay();
      this.replayControls.setPlaybackMode(true);
      this.replayControls.setUndoEnabled(false);
      this.replayControls.setPlaybackEnabled(false);
      this.audioManager.playClick();
    }
  }

  private drawTrackNetwork(): void {
    this.trackContainer = this.add.container(0, 0).setDepth(0);
    this.trackGraphics = this.add.graphics().setDepth(0);

    for (const edge of this.network.getEdges()) {
      const fromPos = this.network.getNodePosition(edge.from);
      const toPos = this.network.getNodePosition(edge.to);
      if (!fromPos || !toPos) continue;

      this.trackGraphics.lineStyle(6, 0x4a5568);
      this.trackGraphics.beginPath();
      this.trackGraphics.moveTo(fromPos.x, fromPos.y);
      this.trackGraphics.lineTo(toPos.x, toPos.y);
      this.trackGraphics.strokePath();

      this.trackGraphics.lineStyle(2, 0x94a3b8);
      this.trackGraphics.beginPath();
      this.trackGraphics.moveTo(fromPos.x, fromPos.y);
      this.trackGraphics.lineTo(toPos.x, toPos.y);
      this.trackGraphics.strokePath();
    }

    this.trackContainer.add(this.trackGraphics);
  }

  private drawInteractiveNodes(): void {
    this.nodeGraphics = this.add.container(0, 0).setDepth(5);

    for (const node of this.network.getAllNodes()) {
      const container = this.createNodeInteractive(node);
      this.nodeGraphics.add(container);
    }
  }

  private createNodeInteractive(node: Phaser.GameObjects.Container | any): Phaser.GameObjects.Container {
    const trackNode = node as import('../data/types.js').TrackNode;
    const container = this.add.container(trackNode.x, trackNode.y);

    if (trackNode.type === 'junction') {
      const bg = this.add.circle(0, 0, 16, 0xfbbf24).setStrokeStyle(2, 0xd97706);
      container.add(bg);

      const directionLine = this.add.graphics();
      container.add(directionLine);
      this.drawJunctionDirection(directionLine, trackNode);

      bg.setInteractive(new Phaser.Geom.Circle(0, 0, 24), Phaser.Geom.Circle.Contains, true);
      bg.on('pointerdown', () => {
        this.toggleJunction(trackNode.id);
      });

      this.nodeVisuals.set(trackNode.id, { graphics: container, directionLine });
    } else if (trackNode.type === 'signal') {
      const darkBg = this.add.circle(0, 0, 14, 0x374151);
      container.add(darkBg);

      const stateColor = trackNode.signalState === 'green' ? 0x2a9d8f : 0xe63946;
      const signalCircle = this.add.circle(0, 0, 12, stateColor).setStrokeStyle(1, 0x1e293b);
      container.add(signalCircle);

      darkBg.setInteractive(new Phaser.Geom.Circle(0, 0, 24), Phaser.Geom.Circle.Contains, true);
      darkBg.on('pointerdown', () => {
        this.toggleSignal(trackNode.id);
      });

      this.nodeVisuals.set(trackNode.id, { graphics: container, signalCircle });
    } else if (trackNode.type === 'platform') {
      const rect = this.add.rectangle(0, 0, 80, 20, 0x8b5cf6).setStrokeStyle(2, 0x6d28d9);
      container.add(rect);

      const label = this.add.text(0, 0, trackNode.platformId ?? trackNode.id, {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(label);
    } else if (trackNode.type === 'endpoint') {
      const circle = this.add.circle(0, 0, 8, 0x4a5568);
      container.add(circle);

      const label = this.add.text(0, 16, trackNode.id, {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#94a3b8',
      }).setOrigin(0.5);
      container.add(label);
    }

    return container;
  }

  private drawJunctionDirection(graphics: Phaser.GameObjects.Graphics, node: import('../data/types.js').TrackNode): void {
    graphics.clear();
    const conns = this.network.getConnections(node.id);
    if (conns.length < 3) return;
    const state = node.switchState ?? 0;
    const filteredConns = conns.filter(c => c !== conns[0]);
    const targetId = filteredConns[state % filteredConns.length];
    if (!targetId) return;
    const targetPos = this.network.getNodePosition(targetId);
    if (!targetPos) return;
    const dx = targetPos.x - node.x;
    const dy = targetPos.y - node.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const nx = dx / len;
    const ny = dy / len;
    graphics.lineStyle(3, 0xd97706);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(nx * 20, ny * 20);
    graphics.strokePath();
  }

  private createTrainSprites(): void {
    for (const trainEntity of this.scheduler.getTrains()) {
      const startPos = trainEntity.getWorldPosition();
      const textureKey = trainEntity.data.type === 'passenger' ? 'train_passenger' : 'train_freight';

      const container = this.add.container(startPos.x, startPos.y).setDepth(10);

      const body = this.add.image(0, 0, textureKey);
      body.setTint(trainEntity.data.color);
      container.add(body);

      const glow = this.add.image(0, -12, 'train_head');
      glow.setTint(trainEntity.data.color);
      glow.setAlpha(0.6);
      container.add(glow);

      container.setVisible(false);
      this.trainSprites.set(trainEntity.data.id, { container, body, glow });
    }
  }

  private createUI(): void {
    const trainData = this.scheduler.getTrains().map(t => t.data);
    this.schedulePanel = new TrainSchedulePanel(this, 20, 20, trainData, (trainId, newPriority) => {
      this.handlePriorityChange(trainId, newPriority);
    });
    this.schedulePanel.setDepth(100);

    this.timelineBar = new TimelineBar(this, 240, 30, this.levelConfig.timeLimit);
    this.timelineBar.setDepth(100);

    for (const train of this.levelConfig.trains) {
      const firstSchedule = train.schedule[0];
      const lastSchedule = train.schedule[train.schedule.length - 1];
      if (firstSchedule) {
        this.timelineBar.addMarker(firstSchedule.arrivalTime, train.id.substring(0, 3), train.color);
      }
      if (lastSchedule && firstSchedule !== lastSchedule) {
        this.timelineBar.addMarker(lastSchedule.departureTime, train.id.substring(0, 3), train.color);
      }
    }

    this.conflictAlert = new ConflictAlert(this, 640, 80);
    this.conflictAlert.setDepth(200);

    this.replayControls = new ReplayControls(this, 1050, 680,
      () => this.undoAction(),
      () => this.resetLevel(),
      () => this.startPlayback()
    );
    this.replayControls.setDepth(100);
    this.replayControls.setUndoEnabled(false);
    this.replayControls.setPlaybackEnabled(false);

    this.levelNameText = this.add.text(this.cameras.main.width - 20, 20, this.levelConfig.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(100);

    this.pauseButton = createButton(this, this.cameras.main.width - 50, 60, '⏸', 'btn_neutral', () => {
      this.togglePause();
    });
    this.pauseButton.setDepth(100);
  }

  private createStartButton(): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.height - 60;
    this.startButton = createButton(this, cx, cy, '开始调度', 'btn_primary', () => {
      this.startButton.setVisible(false);
      this.paused = false;
      this.scheduler.startAllReady();
      this.audioManager.playTrainHorn();
      this.uiStateManager.setState('idle');
    });
    this.startButton.setDepth(150);
  }

  private bindInput(): void {
    this.inputMapper.bind('p', () => this.togglePause());
    this.inputMapper.bind('r', () => this.resetLevel());
    this.inputMapper.bind('escape', () => {
      if (this.isPlaybackMode) {
        this.stopPlayback();
      } else {
        this.scene.start('MenuScene');
      }
    });
  }

  private createSpeedControls(): void {
    const speeds = [1, 2, 3];
    const baseX = 240;
    const y = 60;

    for (let i = 0; i < speeds.length; i++) {
      const idx = i;
      const btn = createButton(this, baseX + i * 70, y, `${speeds[i]}x`, 'btn_neutral', () => {
        this.setSpeed(idx, speeds[idx]);
      });
      btn.setDepth(100);
      this.speedButtons.push(btn);
    }

    this.updateSpeedButtonVisuals();
  }

  private setSpeed(index: number, speed: number): void {
    this.speedMultiplier = speed;
    this.activeSpeedIndex = index;
    this.updateSpeedButtonVisuals();
  }

  private updateSpeedButtonVisuals(): void {
    for (let i = 0; i < this.speedButtons.length; i++) {
      const bg = this.speedButtons[i].getAt(0) as Phaser.GameObjects.Image;
      if (i === this.activeSpeedIndex) {
        bg.setTint(0x22c55e);
      } else {
        bg.clearTint();
      }
    }
  }

  update(time: number, delta: number): void {
    if (this.isPlaybackMode) {
      this.updatePlayback(delta);
      return;
    }

    if (this.paused || this.gameOver) return;

    const adjustedDelta = delta * this.speedMultiplier;
    const newConflicts = this.scheduler.update(adjustedDelta);
    this.gameTime = this.scheduler.getGameTime();

    this.updateTrainSpritesAll();

    this.timelineBar.setTime(this.gameTime);

    if (time - this.lastPanelUpdate > this.panelUpdateInterval) {
      const trainData = this.scheduler.getTrains().map(t => t.data);
      this.schedulePanel.updateTrains(trainData);
      this.lastPanelUpdate = time;
    }

    for (const conflict of newConflicts) {
      this.onConflict(conflict);
    }

    this.checkGameEnd();

    this.replayControls.setUndoEnabled(this.replaySystem.getActionCount() > 0);
    this.replayControls.setPlaybackEnabled(this.replaySystem.getActionCount() > 0);
  }

  private updateTrainSpritesAll(): void {
    for (const trainEntity of this.scheduler.getTrains()) {
      this.updateTrainSprite(trainEntity);
    }
  }

  private updateTrainSprite(trainEntity: TrainEntity): void {
    const sprite = this.trainSprites.get(trainEntity.data.id);
    if (!sprite) return;

    const state = trainEntity.data.state;

    if (state === 'running') {
      sprite.container.setVisible(true);
      const pos = trainEntity.getWorldPosition();
      sprite.container.setPosition(pos.x, pos.y);
      sprite.container.setRotation(pos.angle);
      sprite.body.setAlpha(1);
      sprite.body.clearTint();
      sprite.glow.setAlpha(0.4 + Math.sin(this.time.now / 200) * 0.3);
    } else if (state === 'waiting') {
      sprite.container.setVisible(true);
      const pos = trainEntity.getWorldPosition();
      sprite.container.setPosition(pos.x, pos.y);
      sprite.container.setRotation(pos.angle);
      sprite.body.setAlpha(0.5 + Math.sin(this.time.now / 300) * 0.3);
      sprite.body.clearTint();
      sprite.glow.setAlpha(0.3);
    } else if (state === 'arrived') {
      sprite.body.setAlpha(Math.max(0, sprite.body.alpha - 0.02));
      sprite.glow.setAlpha(Math.max(0, sprite.glow.alpha - 0.02));
      if (sprite.body.alpha <= 0.05) {
        sprite.container.setVisible(false);
      }
    } else if (state === 'crashed') {
      sprite.container.setVisible(true);
      sprite.body.setTint(0xe63946);
      sprite.glow.setTint(0xff0000);
      sprite.glow.setAlpha(0.8);
    } else {
      const startPos = this.network.getNodePosition(trainEntity.data.path[0]);
      if (startPos) {
        sprite.container.setPosition(startPos.x, startPos.y);
      }
      sprite.container.setVisible(false);
    }
  }

  private toggleJunction(nodeId: string): void {
    if (this.isPlaybackMode) return;
    const node = this.network.getNode(nodeId);
    if (!node || node.type !== 'junction') return;

    const prevState = node.switchState ?? 0;
    const toggled = this.network.toggleSwitch(nodeId);
    if (!toggled) return;
    const newState = node.switchState ?? 0;

    this.replaySystem.record({
      time: this.gameTime,
      type: 'switch',
      nodeId,
      prevState,
      newState,
    });

    this.audioManager.playSwitch();

    const visual = this.nodeVisuals.get(nodeId);
    if (visual && visual.directionLine) {
      this.drawJunctionDirection(visual.directionLine, node);
    }

    const container = visual?.graphics;
    if (container) {
      this.tweens.add({
        targets: container,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
      });
    }
  }

  private toggleSignal(nodeId: string): void {
    if (this.isPlaybackMode) return;
    const node = this.network.getNode(nodeId);
    if (!node || node.type !== 'signal') return;

    const prevState = node.signalState ?? 'red';
    this.signalSystem.toggleSignal(nodeId);
    const newState = node.signalState ?? 'red';

    this.replaySystem.record({
      time: this.gameTime,
      type: 'signal',
      nodeId,
      prevState,
      newState,
    });

    this.audioManager.playSignal();

    const visual = this.nodeVisuals.get(nodeId);
    if (visual && visual.signalCircle) {
      const color = newState === 'green' ? 0x2a9d8f : 0xe63946;
      visual.signalCircle.setFillStyle(color);
    }
  }

  private handlePriorityChange(trainId: string, newPriority: number): void {
    if (this.isPlaybackMode) return;
    const train = this.scheduler.getTrains().find(t => t.data.id === trainId);
    if (!train) return;

    const oldPriority = train.data.priority;
    if (newPriority === oldPriority) return;

    this.scheduler.setPriority(trainId, newPriority);

    this.replaySystem.record({
      time: this.gameTime,
      type: 'priority',
      nodeId: trainId,
      prevState: oldPriority,
      newState: newPriority,
    });

    this.audioManager.playClick();

    const trainData = this.scheduler.getTrains().map(t => t.data);
    this.schedulePanel.updateTrains(trainData);
  }

  private onConflict(conflict: Conflict): void {
    this.conflictAlert.showConflict(conflict);
    this.audioManager.playAlert();

    if (conflict.severity === 'critical') {
      shakeScreen(this, 8, 300);
      flashScreen(this, 0xe63946, 0.2, 200);

      for (const trainId of conflict.trains) {
        this.schedulePanel.highlightTrain(trainId);
      }
    }
  }

  private checkGameEnd(): void {
    if (this.endTransitionScheduled) return;

    if (this.scheduler.hasCrash()) {
      this.gameOver = true;
      this.victory = false;
      this.uiStateManager.setState('gameover');
      this.endTransitionScheduled = true;
      this.time.delayedCall(1000, () => {
        this.scene.start('ResultScene', this.getResultData());
      });
      return;
    }

    if (this.gameTime > this.levelConfig.timeLimit) {
      this.gameOver = true;
      this.victory = false;
      this.uiStateManager.setState('gameover');
      this.endTransitionScheduled = true;
      this.time.delayedCall(1000, () => {
        this.scene.start('ResultScene', this.getResultData());
      });
      return;
    }

    if (this.scheduler.isAllArrived()) {
      this.gameOver = true;
      this.victory = true;
      this.uiStateManager.setState('victory');
      this.endTransitionScheduled = true;
      this.audioManager.playSuccess();
      flashScreen(this, 0x22c55e, 0.15, 400);
      this.time.delayedCall(1000, () => {
        this.scene.start('ResultScene', this.getResultData());
      });
    }
  }

  private togglePause(): void {
    if (this.gameOver || this.isPlaybackMode) return;
    this.paused = !this.paused;
    this.uiStateManager.setState(this.paused ? 'paused' : 'idle');
  }

  private resetLevel(): void {
    if (this.isPlaybackMode) {
      this.stopPlayback();
    }
    this.scene.restart({ levelId: this.levelConfig.id });
  }

  private undoAction(): void {
    if (this.isPlaybackMode) return;
    const action = this.replaySystem.undoLast();
    if (!action) return;

    if (action.type === 'switch') {
      const node = this.network.getNode(action.nodeId);
      if (node && node.type === 'junction') {
        node.switchState = action.prevState as number;
        const visual = this.nodeVisuals.get(action.nodeId);
        if (visual && visual.directionLine) {
          this.drawJunctionDirection(visual.directionLine, node);
        }
      }
    } else if (action.type === 'signal') {
      const node = this.network.getNode(action.nodeId);
      if (node && node.type === 'signal') {
        node.signalState = action.prevState as 'red' | 'green';
        const visual = this.nodeVisuals.get(action.nodeId);
        if (visual && visual.signalCircle) {
          const color = node.signalState === 'green' ? 0x2a9d8f : 0xe63946;
          visual.signalCircle.setFillStyle(color);
        }
      }
    } else if (action.type === 'priority') {
      this.scheduler.setPriority(action.nodeId, action.prevState as number);
      const trainData = this.scheduler.getTrains().map(t => t.data);
      this.schedulePanel.updateTrains(trainData);
    }

    this.replayControls.setUndoEnabled(this.replaySystem.getActionCount() > 0);
    this.replayControls.setPlaybackEnabled(this.replaySystem.getActionCount() > 0);
  }

  private startPlayback(): void {
    const actions = this.replaySystem.getActions();
    if (actions.length === 0) return;

    this.scene.restart({
      levelId: this.levelConfig.id,
      playbackActions: actions,
    });
  }

  private stopPlayback(): void {
    this.isPlaybackMode = false;
    this.playbackActions = [];
    this.playbackIndex = 0;

    this.replayControls.setPlaybackMode(false);

    if (this.playbackOverlay) {
      this.playbackOverlay.destroy();
      this.playbackOverlay = undefined;
    }

    this.scene.restart({ levelId: this.levelConfig.id });
  }

  private showPlaybackOverlay(): void {
    this.playbackOverlay = this.add.container(this.cameras.main.centerX, this.cameras.main.height - 110).setDepth(300);

    const bg = this.add.rectangle(0, 0, 300, 40, 0x1e293b, 0.9).setStrokeStyle(1, 0x22c55e);
    this.playbackOverlay.add(bg);

    const label = this.add.text(0, 0, '回放模式', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#22c55e',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.playbackOverlay.add(label);

    const stopBtn = createButton(this, 140, 0, '停止', 'btn_neutral', () => {
      this.stopPlayback();
    });
    this.playbackOverlay.add(stopBtn);
  }

  private updatePlayback(delta: number): void {
    const adjustedDelta = delta * this.speedMultiplier;
    this.gameTime += adjustedDelta / 1000;

    while (this.playbackIndex < this.playbackActions.length) {
      const action = this.playbackActions[this.playbackIndex];
      if (action.time > this.gameTime) break;

      this.applyPlaybackAction(action);
      this.playbackIndex++;
    }

    this.scheduler.update(adjustedDelta);
    this.updateTrainSpritesAll();
    this.timelineBar.setTime(this.gameTime);

    const trainData = this.scheduler.getTrains().map(t => t.data);
    this.schedulePanel.updateTrains(trainData);

    if (this.playbackIndex >= this.playbackActions.length) {
      this.time.delayedCall(2000, () => {
        this.stopPlayback();
      });
    }
  }

  private applyPlaybackAction(action: ReplayAction): void {
    if (action.type === 'switch') {
      const node = this.network.getNode(action.nodeId);
      if (node && node.type === 'junction') {
        node.switchState = action.newState as number;
        const visual = this.nodeVisuals.get(action.nodeId);
        if (visual && visual.directionLine) {
          this.drawJunctionDirection(visual.directionLine, node);
        }
        this.audioManager.playSwitch();
      }
    } else if (action.type === 'signal') {
      const node = this.network.getNode(action.nodeId);
      if (node && node.type === 'signal') {
        node.signalState = action.newState as 'red' | 'green';
        const visual = this.nodeVisuals.get(action.nodeId);
        if (visual && visual.signalCircle) {
          const color = node.signalState === 'green' ? 0x2a9d8f : 0xe63946;
          visual.signalCircle.setFillStyle(color);
        }
        this.audioManager.playSignal();
      }
    } else if (action.type === 'priority') {
      this.scheduler.setPriority(action.nodeId, action.newState as number);
      this.audioManager.playClick();
    }
  }

  private calculateStars(): number {
    const thresholds = this.levelConfig.starThresholds;
    if (this.gameTime <= thresholds.three) return 3;
    if (this.gameTime <= thresholds.two) return 2;
    if (this.gameTime <= thresholds.one) return 1;
    return 0;
  }

  private getResultData() {
    return {
      levelId: this.levelConfig.id,
      levelName: this.levelConfig.name,
      victory: this.victory,
      time: this.gameTime,
      conflicts: this.scheduler.getConflicts(),
      stars: this.calculateStars(),
    };
  }
}
