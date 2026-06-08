import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class DebugScene extends Phaser.Scene {
  private logTexts: Phaser.GameObjects.Text[] = [];
  private scrollOffset: number = 0;
  private filterLevel: LogLevel | 'all' = 'all';
  private container!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'DebugScene' });
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a1a);

    this.add.text(GAME_WIDTH / 2, 20, '调试日志', {
      fontSize: '20px', fontFamily: 'monospace', color: '#e6a817',
    }).setOrigin(0.5);

    const filterY = 50;
    const levels: (LogLevel | 'all')[] = ['all', 'info', 'warn', 'error', 'debug'];
    for (let i = 0; i < levels.length; i++) {
      const btn = this.add.text(20 + i * 80, filterY, levels[i].toUpperCase(), {
        fontSize: '12px', fontFamily: 'monospace', color: '#9ca3af',
      }).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.filterLevel = levels[i];
        this.refreshLogs();
      });
      btn.on('pointerover', () => btn.setColor('#e6a817'));
      btn.on('pointerout', () => btn.setColor('#9ca3af'));
    }

    const dataBtn = this.add.text(GAME_WIDTH - 120, filterY, '关卡数据', {
      fontSize: '12px', fontFamily: 'monospace', color: '#60a5fa',
    }).setInteractive({ useHandCursor: true });
    dataBtn.on('pointerdown', () => this.showLevelData());

    const saveBtn = this.add.text(GAME_WIDTH - 220, filterY, '存档数据', {
      fontSize: '12px', fontFamily: 'monospace', color: '#4ade80',
    }).setInteractive({ useHandCursor: true });
    saveBtn.on('pointerdown', () => this.showSaveData());

    const clearBtn = this.add.text(GAME_WIDTH - 60, filterY, '清除', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ef4444',
    }).setInteractive({ useHandCursor: true });
    clearBtn.on('pointerdown', () => this.clearLogs());

    this.container = this.add.container(0, 70);
    this.container.setMask(this.make.graphics({ x: 0, y: 70 }).createGeometryMask());

    const backBtn = this.add.text(60, GAME_HEIGHT - 20, '返回主菜单', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#9ca3af',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
      this.input.keyboard.on('keydown-UP', () => { this.scrollOffset = Math.max(0, this.scrollOffset - 3); this.refreshLogs(); });
      this.input.keyboard.on('keydown-DOWN', () => { this.scrollOffset += 3; this.refreshLogs(); });
    }

    this.refreshLogs();
  }

  private refreshLogs(): void {
    this.container.removeAll(true);
    this.logTexts = [];

    const logs = this.game.registry.get('debugLogs') as Array<{ timestamp: number; level: string; message: string; data?: unknown }> || [];
    const filtered = this.filterLevel === 'all' ? logs : logs.filter(l => l.level === this.filterLevel);
    const visibleLogs = filtered.slice(this.scrollOffset, this.scrollOffset + 25);

    for (let i = 0; i < visibleLogs.length; i++) {
      const entry = visibleLogs[i];
      const color = this.getLogColor(entry.level);
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const text = this.add.text(10, i * 22, `[${time}] [${entry.level.toUpperCase()}] ${entry.message}`, {
        fontSize: '12px', fontFamily: 'monospace', color,
      });
      this.container.add(text);
      this.logTexts.push(text);
    }

    if (filtered.length === 0) {
      const empty = this.add.text(GAME_WIDTH / 2, 100, '暂无日志记录', {
        fontSize: '14px', fontFamily: 'sans-serif', color: '#6b7280',
      }).setOrigin(0.5);
      this.container.add(empty);
    }

    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 20, `${filtered.length} 条记录 | 滚动: ↑↓`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#6b7280',
    }).setOrigin(1, 0.5);
  }

  private getLogColor(level: string): string {
    switch (level) {
      case 'info': return '#60a5fa';
      case 'warn': return '#fbbf24';
      case 'error': return '#ef4444';
      case 'debug': return '#9ca3af';
      default: return '#f0e6d3';
    }
  }

  private showLevelData(): void {
    const levelId = this.game.registry.get('currentLevelId') || '无';
    this.addLog('info', `当前关卡ID: ${levelId}`);
    this.refreshLogs();
  }

  private showSaveData(): void {
    const saveSystem = this.game.registry.get('saveSystem');
    if (saveSystem) {
      const save = saveSystem.getSave();
      this.addLog('info', `存档版本: ${save.version}, 上次关卡: ${save.lastPlayedLevel}`);
      for (const [id, data] of Object.entries(save.levels)) {
        this.addLog('info', `  ${id}: 完成=${(data as any).completed}, 最佳=${(data as any).bestSteps}步, 星级=${(data as any).stars}`);
      }
    }
    this.refreshLogs();
  }

  private addLog(level: string, message: string): void {
    const logs = this.game.registry.get('debugLogs') as Array<{ timestamp: number; level: string; message: string }>;
    if (logs) logs.push({ timestamp: Date.now(), level, message });
  }

  private clearLogs(): void {
    this.game.registry.set('debugLogs', []);
    this.scrollOffset = 0;
    this.refreshLogs();
  }
}
