import Phaser from 'phaser';
import { TrackNetwork } from '../game/TrackNetwork.js';
import { SignalSystem } from '../game/SignalSystem.js';
import { AudioManager } from '../core/AudioManager.js';
import { LevelConfig, TutorialStep } from '../data/types.js';
import { createButton, flashScreen } from '../utils/helpers.js';
import { level1 } from '../levels/level1.js';
import { ReplaySystem } from '../core/ReplaySystem.js';

const FONT = '"Courier New", monospace';

export class TutorialScene extends Phaser.Scene {
  private network!: TrackNetwork;
  private signalSystem!: SignalSystem;
  private audio!: AudioManager;
  private replay!: ReplaySystem;
  private config: LevelConfig = level1;

  private currentStep: number = 0;
  private steps: TutorialStep[] = [];
  private stepText!: Phaser.GameObjects.Text;
  private stepCounter!: Phaser.GameObjects.Text;
  private messagePanel!: Phaser.GameObjects.Container;
  private highlightGraphics!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Rectangle;
  private arrow!: Phaser.GameObjects.Polygon;
  private nextButton!: Phaser.GameObjects.Container;
  private skipButton!: Phaser.GameObjects.Container;
  private startButton: Phaser.GameObjects.Container | null = null;

  private nodeGraphics!: Phaser.GameObjects.Graphics;
  private nodeLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private junctionObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private signalObjects: Map<string, Phaser.GameObjects.Container> = new Map();

  private pulseTween: Phaser.Tweens.Tween | null = null;
  private completed: boolean = false;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a2744');
    this.cameras.main.fadeIn(300);

    this.network = new TrackNetwork(this.config.nodes, this.config.edges);
    this.signalSystem = new SignalSystem(this.network);
    this.audio = new AudioManager(this);
    this.replay = new ReplaySystem();
    this.steps = this.config.tutorialSteps ?? [];
    this.currentStep = 0;
    this.completed = false;

    this.drawTracks();
    this.createTopBar();
    this.createOverlay();
    this.createHighlightGraphics();
    this.createMessagePanel();
    this.createSkipButton();
    this.showStep();
  }

  private drawTracks() {
    this.nodeGraphics = this.add.graphics();

    for (const edge of this.config.edges) {
      const fromNode = this.network.getNode(edge.from);
      const toNode = this.network.getNode(edge.to);
      if (!fromNode || !toNode) continue;
      this.nodeGraphics.lineStyle(4, 0x6c757d);
      this.nodeGraphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);
    }

    for (const node of this.config.nodes) {
      this.drawNode(node);
      const label = this.add.text(node.x, node.y + 24, node.id, {
        fontSize: '10px',
        fontFamily: FONT,
        color: '#94a3b8',
      }).setOrigin(0.5);
      this.nodeLabels.set(node.id, label);
    }
  }

  private drawNode(node: Phaser.GameObjects.GameObject | { id: string; x: number; y: number; type: string; switchState?: number; signalState?: string; connections?: string[] }) {
    const n = node as { id: string; x: number; y: number; type: string; switchState?: number; signalState?: string; connections?: string[] };

    if (n.type === 'junction') {
      this.drawJunction(n);
    } else if (n.type === 'signal') {
      this.drawSignal(n);
    } else if (n.type === 'platform') {
      this.drawPlatform(n);
    } else if (n.type === 'endpoint') {
      this.drawEndpoint(n);
    }
  }

  private drawJunction(node: { id: string; x: number; y: number; switchState?: number }) {
    const container = this.add.container(node.x, node.y);
    const g = this.add.graphics();

    g.fillStyle(0xfbbf24);
    g.fillCircle(0, 0, 18);
    g.lineStyle(2, 0x92400e);
    g.strokeCircle(0, 0, 18);

    const conns = this.network.getConnections(node.id);
    const state = node.switchState ?? 0;
    if (conns.length > 1) {
      const filtered = conns.slice(1);
      const targetId = filtered[state % filtered.length];
      const targetNode = this.network.getNode(targetId);
      if (targetNode) {
        const angle = Math.atan2(targetNode.y - node.y, targetNode.x - node.x);
        g.lineStyle(3, 0x92400e);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
        g.strokePath();
      }
    }

    container.add(g);

    const hitArea = this.add.circle(0, 0, 22, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.onJunctionClick(node.id));
    container.add(hitArea);

    this.junctionObjects.set(node.id, container);
  }

  private drawSignal(node: { id: string; x: number; y: number; signalState?: string }) {
    const container = this.add.container(node.x, node.y);
    const g = this.add.graphics();
    const color = node.signalState === 'green' ? 0x2a9d8f : 0xe63946;

    g.fillStyle(color);
    g.fillCircle(0, 0, 10);
    g.lineStyle(2, 0x4a5568);
    g.strokeCircle(0, 0, 10);

    container.add(g);

    const hitArea = this.add.circle(0, 0, 14, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.onSignalClick(node.id));
    container.add(hitArea);

    this.signalObjects.set(node.id, container);
  }

  private drawPlatform(node: { id: string; x: number; y: number }) {
    const g = this.add.graphics();
    g.fillStyle(0x8b5cf6);
    g.fillRoundedRect(node.x - 40, node.y - 12, 80, 24, 6);
  }

  private drawEndpoint(node: { id: string; x: number; y: number }) {
    const g = this.add.graphics();
    g.fillStyle(0x4a5568);
    g.fillCircle(node.x, node.y, 8);
  }

  private redrawJunction(nodeId: string) {
    const container = this.junctionObjects.get(nodeId);
    if (!container) return;
    container.removeAll(true);

    const node = this.network.getNode(nodeId);
    if (!node) return;

    const g = this.add.graphics();

    g.fillStyle(0xfbbf24);
    g.fillCircle(0, 0, 18);
    g.lineStyle(2, 0x92400e);
    g.strokeCircle(0, 0, 18);

    const conns = this.network.getConnections(nodeId);
    const state = node.switchState ?? 0;
    if (conns.length > 1) {
      const filtered = conns.slice(1);
      const targetId = filtered[state % filtered.length];
      const targetNode = this.network.getNode(targetId);
      if (targetNode) {
        const angle = Math.atan2(targetNode.y - node.y, targetNode.x - node.x);
        g.lineStyle(3, 0x92400e);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
        g.strokePath();
      }
    }

    container.add(g);

    const hitArea = this.add.circle(0, 0, 22, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.onJunctionClick(nodeId));
    container.add(hitArea);
  }

  private redrawSignal(nodeId: string) {
    const container = this.signalObjects.get(nodeId);
    if (!container) return;
    container.removeAll(true);

    const node = this.network.getNode(nodeId);
    if (!node) return;

    const g = this.add.graphics();
    const color = node.signalState === 'green' ? 0x2a9d8f : 0xe63946;

    g.fillStyle(color);
    g.fillCircle(0, 0, 10);
    g.lineStyle(2, 0x4a5568);
    g.strokeCircle(0, 0, 10);

    container.add(g);

    const hitArea = this.add.circle(0, 0, 14, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.onSignalClick(nodeId));
    container.add(hitArea);
  }

  private onJunctionClick(nodeId: string) {
    this.audio.playSwitch();
    const prevState = this.network.getNode(nodeId)?.switchState ?? 0;
    this.network.toggleSwitch(nodeId);
    const newNode = this.network.getNode(nodeId);

    this.replay.record({
      time: 0,
      type: 'switch',
      nodeId,
      prevState,
      newState: newNode?.switchState ?? 0,
    });

    this.redrawJunction(nodeId);

    const container = this.junctionObjects.get(nodeId);
    if (container) {
      this.tweens.add({
        targets: container,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
    }

    flashScreen(this, 0xfbbf24, 0.1, 150);

    if (!this.completed) {
      this.checkStepAction('switch', nodeId);
    }
  }

  private onSignalClick(nodeId: string) {
    this.audio.playSignal();
    const prevState = this.network.getNode(nodeId)?.signalState ?? 'red';
    this.signalSystem.toggleSignal(nodeId);

    this.replay.record({
      time: 0,
      type: 'signal',
      nodeId,
      prevState,
      newState: prevState === 'red' ? 'green' : 'red',
    });

    this.redrawSignal(nodeId);

    if (!this.completed) {
      this.checkStepAction('signal', nodeId);
    }
  }

  private checkStepAction(actionType: string, nodeId: string) {
    if (this.currentStep >= this.steps.length) return;
    const step = this.steps[this.currentStep];
    if (step.waitForAction === actionType && step.highlightNodeIds.includes(nodeId)) {
      this.advanceStep();
    }
  }

  private createTopBar() {
    this.add.rectangle(
      this.cameras.main.centerX, 30,
      this.cameras.main.width, 50,
      0x0f172a, 0.8
    );

    this.add.text(this.cameras.main.centerX, 30, '教程', {
      fontSize: '22px',
      fontFamily: FONT,
      fontStyle: 'bold',
      color: '#e2e8f0',
    }).setOrigin(0.5);

    this.stepCounter = this.add.text(this.cameras.main.centerX + 200, 30, '', {
      fontSize: '16px',
      fontFamily: FONT,
      color: '#94a3b8',
    }).setOrigin(0.5);
  }

  private createOverlay() {
    this.overlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x0f172a,
      0.3
    );
    this.overlay.setDepth(5);
  }

  private createHighlightGraphics() {
    this.highlightGraphics = this.add.graphics();
    this.highlightGraphics.setDepth(10);
  }

  private createMessagePanel() {
    this.messagePanel = this.add.container(this.cameras.main.centerX, 640);
    this.messagePanel.setDepth(20);

    const panelBg = this.add.image(0, 0, 'panel').setDisplaySize(700, 80);
    this.messagePanel.add(panelBg);

    this.stepText = this.add.text(0, -8, '', {
      fontSize: '16px',
      fontFamily: FONT,
      color: '#e2e8f0',
      wordWrap: { width: 620 },
      align: 'center',
    }).setOrigin(0.5);
    this.messagePanel.add(this.stepText);
  }

  private createSkipButton() {
    this.skipButton = createButton(this, this.cameras.main.width - 80, 30, '跳过教程', 'btn_neutral', () => {
      this.audio.playClick();
      this.scene.start('MenuScene');
    });
    this.skipButton.setDepth(30);
  }

  private showStep() {
    if (this.currentStep >= this.steps.length) {
      this.showCompletion();
      return;
    }

    const step = this.steps[this.currentStep];
    this.stepText.setText(step.message);

    const total = this.steps.length;
    this.stepCounter.setText(`步骤 ${this.currentStep + 1}/${total}`);

    this.updateHighlight(step.highlightNodeIds);

    if (this.nextButton) {
      this.nextButton.destroy();
      this.nextButton = null as any;
    }

    if (step.waitForAction === 'none') {
      this.nextButton = createButton(this, this.cameras.main.centerX, 690, '下一步', 'btn_primary', () => {
        this.audio.playClick();
        this.advanceStep();
      });
      this.nextButton.setDepth(25);
    }
  }

  private updateHighlight(nodeIds: string[]) {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    if (this.arrow) {
      this.arrow.destroy();
      this.arrow = null as any;
    }
    this.highlightGraphics.clear();

    for (const nodeId of nodeIds) {
      const node = this.network.getNode(nodeId);
      if (!node) continue;

      this.highlightGraphics.lineStyle(3, 0xfbbf24, 0.6);
      this.highlightGraphics.strokeCircle(node.x, node.y, 28);

      const arrowY = node.y - 45;
      const arrow = this.add.polygon(
        node.x, arrowY,
        [
          { x: 0, y: 12 },
          { x: -10, y: -6 },
          { x: 10, y: -6 },
        ],
        0xfbbf24,
        0.8
      );
      arrow.setDepth(10);
      this.arrow = arrow as any;

      this.tweens.add({
        targets: arrow,
        y: arrowY + 5,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.pulseTween = this.tweens.addCounter({
      from: 0.3,
      to: 0.8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const alpha = tween.getValue() ?? 0.3;
        this.highlightGraphics.clear();
        for (const nodeId of nodeIds) {
          const node = this.network.getNode(nodeId);
          if (!node) continue;
          this.highlightGraphics.lineStyle(3, 0xfbbf24, alpha);
          this.highlightGraphics.strokeCircle(node.x, node.y, 28);
        }
      },
    });
  }

  private advanceStep() {
    this.currentStep++;
    this.showStep();
  }

  private showCompletion() {
    this.completed = true;

    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    this.highlightGraphics.clear();
    if (this.arrow) {
      this.arrow.destroy();
      this.arrow = null as any;
    }
    if (this.nextButton) {
      this.nextButton.destroy();
      this.nextButton = null as any;
    }
    this.overlay.setAlpha(0);

    this.stepText.setText('准备就绪！开始游戏');
    this.stepCounter.setText('完成');

    this.audio.playSuccess();
    flashScreen(this, 0x22c55e, 0.1, 300);

    if (this.startButton) {
      this.startButton.destroy();
    }
    this.startButton = createButton(this, this.cameras.main.centerX, 690, '开始游戏', 'btn_primary', () => {
      this.audio.playClick();
      this.scene.start('GameScene', { level: this.config });
    });
    this.startButton.setDepth(25);
  }
}
