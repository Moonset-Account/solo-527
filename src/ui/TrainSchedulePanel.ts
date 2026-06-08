import { Train } from '../data/types.js';
import { getTrainDisplayName, formatTime } from '../utils/helpers.js';

const FONT_FAMILY = '"Courier New", monospace';

const STATE_LABELS: Record<Train['state'], string> = {
  waiting: '等待',
  running: '运行',
  arrived: '到达',
  delayed: '晚点',
  crashed: '事故',
};

const STATE_COLORS: Record<Train['state'], number> = {
  waiting: 0x94a3b8,
  running: 0x22c55e,
  arrived: 0x3b82f6,
  delayed: 0xfbbf24,
  crashed: 0xe63946,
};

export class TrainSchedulePanel extends Phaser.GameObjects.Container {
  private trainRows: Map<string, Phaser.GameObjects.Container> = new Map();
  private panelWidth = 420;
  private rowHeight = 56;
  private headerHeight = 36;
  private padding = 8;
  private onPriorityChange?: (trainId: string, newPriority: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, trains: Train[], onPriorityChange?: (trainId: string, newPriority: number) => void) {
    super(scene, x, y);
    this.onPriorityChange = onPriorityChange;
    this.buildPanel(trains);
  }

  private buildPanel(trains: Train[]) {
    this.removeAll(true);
    this.trainRows.clear();

    const panelHeight = this.headerHeight + trains.length * this.rowHeight + this.padding * 2;

    const bg = this.scene.add.image(0, 0, 'panel');
    bg.setDisplaySize(this.panelWidth, panelHeight);
    bg.setOrigin(0, 0);
    this.add(bg);

    const header = this.scene.add.text(this.padding + 4, this.padding, '列车时刻表', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    });
    this.add(header);

    const prioHeader = this.scene.add.text(this.panelWidth - this.padding - 80, this.padding, '优先级', {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#94a3b8',
    });
    this.add(prioHeader);

    const divider = this.scene.add.rectangle(
      this.panelWidth / 2,
      this.headerHeight,
      this.panelWidth - this.padding * 2,
      1,
      0x475569
    );
    this.add(divider);

    trains.forEach((train, i) => {
      const row = this.createTrainRow(train, i);
      this.trainRows.set(train.id, row);
      this.add(row);
    });
  }

  private createTrainRow(train: Train, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, this.headerHeight + index * this.rowHeight);

    const indicatorColor = STATE_COLORS[train.state];
    const indicator = this.scene.add.circle(this.padding + 10, this.rowHeight / 2, 5, indicatorColor);
    container.add(indicator);

    const displayName = getTrainDisplayName(train.type, train.name);
    const typeLabel = train.type === 'passenger' ? '客运' : '货运';
    const nameText = this.scene.add.text(this.padding + 24, 4, `${displayName} [${typeLabel}]`, {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#f1f5f9',
      fontStyle: 'bold',
    });
    container.add(nameText);

    const scheduleSummary = this.buildScheduleSummary(train);
    const scheduleText = this.scene.add.text(this.padding + 24, 20, scheduleSummary, {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#94a3b8',
    });
    container.add(scheduleText);

    const stateText = this.scene.add.text(this.panelWidth - this.padding - 80, this.rowHeight / 2, STATE_LABELS[train.state], {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${indicatorColor.toString(16).padStart(6, '0')}`,
    });
    stateText.setOrigin(1, 0.5);
    container.add(stateText);

    const prioX = this.panelWidth - this.padding - 30;
    const prioY = this.rowHeight / 2;

    const prioDownBtn = this.scene.add.text(prioX - 20, prioY, '▼', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    prioDownBtn.on('pointerdown', () => {
      if (this.onPriorityChange && train.priority > 1) {
        this.onPriorityChange(train.id, train.priority - 1);
      }
    });
    prioDownBtn.on('pointerover', () => prioDownBtn.setColor('#e2e8f0'));
    prioDownBtn.on('pointerout', () => prioDownBtn.setColor('#94a3b8'));
    container.add(prioDownBtn);

    const prioLabel = this.scene.add.text(prioX, prioY, `P${train.priority}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(prioLabel);

    const prioUpBtn = this.scene.add.text(prioX + 20, prioY, '▲', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    prioUpBtn.on('pointerdown', () => {
      if (this.onPriorityChange) {
        this.onPriorityChange(train.id, train.priority + 1);
      }
    });
    prioUpBtn.on('pointerover', () => prioUpBtn.setColor('#e2e8f0'));
    prioUpBtn.on('pointerout', () => prioUpBtn.setColor('#94a3b8'));
    container.add(prioUpBtn);

    return container;
  }

  private buildScheduleSummary(train: Train): string {
    if (train.schedule.length === 0) return '--:-- → --:--';
    const first = train.schedule[0];
    const last = train.schedule[train.schedule.length - 1];
    return `${formatTime(first.arrivalTime)} → ${formatTime(last.departureTime)}`;
  }

  updateTrains(trains: Train[]) {
    this.buildPanel(trains);
  }

  highlightTrain(trainId: string) {
    const row = this.trainRows.get(trainId);
    if (!row) return;

    const highlight = this.scene.add.rectangle(
      this.panelWidth / 2,
      row.y + this.rowHeight / 2,
      this.panelWidth - this.padding * 2,
      this.rowHeight - 4,
      0xfbbf24,
      0.3
    );
    this.add(highlight);

    this.scene.tweens.add({
      targets: highlight,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      yoyo: true,
      repeat: 2,
      onComplete: () => highlight.destroy(),
    });
  }
}
