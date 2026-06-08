import Phaser from 'phaser';
import { LevelData, ClueData } from '../models/types';
import { ClueBoardManager } from '../systems/ClueBoardManager';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';

export class ClueBoardScene extends Phaser.Scene {
  private levelData!: LevelData;
  private clueBoardManager!: ClueBoardManager;
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private scrollOffset: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private suspectMarkers: Map<string, Phaser.GameObjects.Image> = new Map();

  constructor() {
    super({ key: 'ClueBoardScene' });
  }

  init(data: { levelData: LevelData; returnScene: string }): void {
    this.levelData = data.levelData;
    this.clueBoardManager = new ClueBoardManager();
    this.clueBoardManager.loadClues(this.levelData.clues);
    this.saveManager = SaveManager.getInstance();
    this.audioManager = new AudioManager(this);
    this.scrollOffset = 0;
    this.suspectMarkers.clear();
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a, 0.95);

    const header = this.add.text(width / 2, 30, '线索板', {
      fontSize: '24px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 55, '点击书籍可切换嫌疑标记 | 向上/向下滑动浏览更多线索', {
      fontSize: '11px',
      color: '#64748b',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.contentContainer = this.add.container(0, 75);

    this.renderClues(width);

    this.createSuspectSection(width, height);

    const closeBtn = this.add.image(width / 2, height - 35, 'button').setDisplaySize(140, 40).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(width / 2, height - 35, '返回巡查', {
      fontSize: '14px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      this.audioManager.playPageFlip();
      this.scene.resume('GameScene');
      this.scene.stop();
    });

    closeBtn.on('pointerover', () => closeBtn.setTexture('button_hover'));
    closeBtn.on('pointerout', () => closeBtn.setTexture('button'));

    this.setupScroll(height);
  }

  private renderClues(width: number): void {
    const discovered = this.clueBoardManager.getDiscoveredClues();
    const startY = 0;

    discovered.forEach((clue, index) => {
      const y = startY + index * 72;
      const container = this.add.container(width / 2, y);

      const bg = this.add.rectangle(0, 0, width - 60, 62, 0x16213e, 0.8);
      bg.setStrokeStyle(1, this.getClueBorderColor(clue));
      container.add(bg);

      const typeLabel = this.getClueTypeLabel(clue);
      const typeTag = this.add.text(-(width / 2 - 40), -20, typeLabel, {
        fontSize: '10px',
        color: this.getClueTypeColor(clue),
        fontFamily: 'sans-serif',
        backgroundColor: '#00000044',
        padding: { x: 4, y: 2 },
      });
      container.add(typeTag);

      if (clue.isMisleading) {
        const warnTag = this.add.text(-(width / 2 - 40), -20 + 18, '⚠ 可疑', {
          fontSize: '9px',
          color: '#f59e0b',
          fontFamily: 'sans-serif',
        });
        container.add(warnTag);
      }

      const desc = this.add.text(0, 5, clue.description, {
        fontSize: '12px',
        color: '#cbd5e1',
        fontFamily: 'sans-serif',
        wordWrap: { width: width - 100 },
      }).setOrigin(0.5);
      container.add(desc);

      this.contentContainer.add(container);
    });

    if (discovered.length === 0) {
      const empty = this.add.text(0, 40, '还没有发现任何线索\n点击书架可以发现更多线索', {
        fontSize: '14px',
        color: '#64748b',
        fontFamily: 'sans-serif',
        align: 'center',
      }).setOrigin(0.5);
      this.contentContainer.add(empty);
    }
  }

  private createSuspectSection(width: number, height: number): void {
    const sectionY = height - 220;

    const sectionBg = this.add.rectangle(width / 2, sectionY + 60, width - 40, 140, 0x1e1e3a, 0.9);
    sectionBg.setStrokeStyle(1, 0x0f3460);

    const header = this.add.text(width / 2, sectionY - 5, '嫌疑标记', {
      fontSize: '14px',
      color: '#ef4444',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const marked = this.saveManager.getMarkedSuspects();
    const allBooks = this.levelData.books;

    const bookStartX = 60;
    const bookStartY = sectionY + 25;

    allBooks.forEach((book, index) => {
      const bx = bookStartX + (index % 4) * (width - 80) / 4;
      const by = bookStartY + Math.floor(index / 4) * 55;

      const isMarked = marked.includes(book.id);

      const btn = this.add.rectangle(bx, by, (width - 120) / 4, 40, isMarked ? 0x7f1d1d : 0x16213e)
        .setStrokeStyle(1, isMarked ? 0xef4444 : 0x334155)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(bx, by, this.truncate(book.title, 6), {
        fontSize: '11px',
        color: isMarked ? '#fca5a5' : '#94a3b8',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      if (isMarked) {
        const mark = this.add.image(bx + 50, by - 15, 'icon_mark').setDisplaySize(16, 16);
        this.suspectMarkers.set(book.id, mark);
      }

      btn.on('pointerdown', () => {
        this.clueBoardManager.toggleSuspect(book.id);
        this.audioManager.playPageFlip();
        this.scene.restart({ levelData: this.levelData, returnScene: 'GameScene' });
      });
    });
  }

  private setupScroll(height: number): void {
    const maxScroll = Math.max(0, this.clueBoardManager.getDiscoveredClues().length * 72 - (height - 320));

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _dx: number, dy: number) => {
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy, -maxScroll, 0);
      this.contentContainer.y = 75 + this.scrollOffset;
    });

    let dragStartY = 0;
    let scrollStart = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < height - 220 && pointer.y > 70) {
        dragStartY = pointer.y;
        scrollStart = this.scrollOffset;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.y < height - 220) {
        const diff = pointer.y - dragStartY;
        this.scrollOffset = Phaser.Math.Clamp(scrollStart + diff, -maxScroll, 0);
        this.contentContainer.y = 75 + this.scrollOffset;
      }
    });
  }

  private getClueBorderColor(clue: ClueData): number {
    if (clue.isMisleading) return 0xf59e0b;
    switch (clue.type) {
      case 'borrowing_card': return 0x60a5fa;
      case 'shelf_label': return 0x34d399;
      case 'light_hint': return 0xfbbf24;
      case 'dust_trace': return 0xa78bfa;
      default: return 0x475569;
    }
  }

  private getClueTypeLabel(clue: ClueData): string {
    switch (clue.type) {
      case 'borrowing_card': return '借阅卡';
      case 'shelf_label': return '书架标签';
      case 'light_hint': return '灯光线索';
      case 'dust_trace': return '灰尘痕迹';
      case 'misleading': return '可疑线索';
      default: return '线索';
    }
  }

  private getClueTypeColor(clue: ClueData): string {
    switch (clue.type) {
      case 'borrowing_card': return '#60a5fa';
      case 'shelf_label': return '#34d399';
      case 'light_hint': return '#fbbf24';
      case 'dust_trace': return '#a78bfa';
      case 'misleading': return '#f59e0b';
      default: return '#94a3b8';
    }
  }

  private truncate(text: string, maxLen: number): string {
    return text.length > maxLen ? text.substring(0, maxLen - 1) + '…' : text;
  }
}
