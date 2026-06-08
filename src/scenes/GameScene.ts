import Phaser from 'phaser';
import { LevelData, BookData, ShelfData, InventoryItem } from '../models/types';
import { SaveManager } from '../systems/SaveManager';
import { InventoryManager } from '../systems/InventoryManager';
import { ClueBoardManager } from '../systems/ClueBoardManager';
import { HintManager, HintTier } from '../systems/HintManager';
import { FeedbackManager } from '../systems/FeedbackManager';
import { AudioManager } from '../systems/AudioManager';

import chapter1Data from '../data/chapter1.json';
import chapter2Data from '../data/chapter2.json';
import chapter3Data from '../data/chapter3.json';

const LEVEL_MAP: Record<number, LevelData[]> = {
  1: [chapter1Data as unknown as LevelData],
  2: [chapter2Data as unknown as LevelData],
  3: [chapter3Data as unknown as LevelData],
};

const BOOK_COLORS: Record<string, number> = {
  '文学': 0xc2956e,
  '科学': 0x5b8ca8,
  '历史': 0x8b6f47,
  '哲学': 0x7b6b8d,
};

export class GameScene extends Phaser.Scene {
  private levelData!: LevelData;
  private saveManager!: SaveManager;
  private inventoryManager!: InventoryManager;
  private clueBoardManager!: ClueBoardManager;
  private hintManager!: HintManager;
  private feedbackManager!: FeedbackManager;
  private audioManager!: AudioManager;

  private bookObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private shelfObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private highlightObjects: Map<string, Phaser.GameObjects.Image> = new Map();

  private inventoryBar!: Phaser.GameObjects.Container;
  private topBar!: Phaser.GameObjects.Container;
  private selectedBookId: string | null = null;
  private detailPanel: Phaser.GameObjects.Container | null = null;

  private timerText!: Phaser.GameObjects.Text;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private remainingTime: number = 0;
  private timerPaused: boolean = false;

  private ladderObject: Phaser.GameObjects.Image | null = null;
  private ladderTargetShelf: string | null = null;
  private isLadderMoving: boolean = false;

  private wrongAttempts: number = 0;
  private resultData: { success: boolean; reasons: string[]; missed: string[] } | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { chapter: number; levelIndex: number }): void {
    const chapters = LEVEL_MAP[data.chapter];
    if (!chapters || !chapters[data.levelIndex]) {
      this.scene.start('MenuScene');
      return;
    }

    this.levelData = chapters[data.levelIndex];
    this.saveManager = SaveManager.getInstance();
    this.inventoryManager = new InventoryManager();
    this.clueBoardManager = new ClueBoardManager();
    this.hintManager = new HintManager();
    this.feedbackManager = new FeedbackManager(this);
    this.audioManager = new AudioManager(this);

    this.inventoryManager.reset();
    this.clueBoardManager.loadClues(this.levelData.clues);
    this.hintManager.setLevelData(this.levelData);
    this.saveManager.resetWrongAttempts();

    this.bookObjects.clear();
    this.shelfObjects.clear();
    this.highlightObjects.clear();
    this.selectedBookId = null;
    this.detailPanel = null;
    this.ladderObject = null;
    this.ladderTargetShelf = null;
    this.isLadderMoving = false;
    this.wrongAttempts = 0;
    this.resultData = null;
    this.timerEvent = null;
    this.timerPaused = false;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    this.createTopBar(width);
    this.createShelves();
    this.createBooks();
    this.createInventoryBar(width, height);
    this.createActionButtons(width, height);

    if (this.levelData.hasLadder) {
      this.createLadder();
    }

    if (this.levelData.hasTimer) {
      this.startTimer();
    }

    this.autoDiscoverInitialClues();

    this.add.text(width / 2, height - 15, `${this.levelData.title} — ${this.levelData.description}`, {
      fontSize: '12px',
      color: '#475569',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  private createTopBar(width: number): void {
    this.topBar = this.add.container(0, 0);

    const bg = this.add.rectangle(width / 2, 22, width, 44, 0x0f3460, 0.8);
    this.topBar.add(bg);

    const title = this.add.text(16, 22, this.levelData.title, {
      fontSize: '16px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.topBar.add(title);

    const clueBtn = this.add.image(width - 180, 22, 'icon_card').setInteractive({ useHandCursor: true });
    clueBtn.on('pointerdown', () => {
      this.audioManager.playPageFlip();
      this.scene.launch('ClueBoardScene', {
        levelData: this.levelData,
        returnScene: 'GameScene',
      });
      this.scene.pause();
    });
    this.topBar.add(clueBtn);

    const clueLabel = this.add.text(width - 160, 22, '线索板', {
      fontSize: '14px',
      color: '#60a5fa',
      fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    this.topBar.add(clueLabel);

    const hintBtn = this.add.image(width - 90, 22, 'icon_hint').setInteractive({ useHandCursor: true });
    hintBtn.on('pointerdown', () => {
      this.showHint();
    });
    this.topBar.add(hintBtn);

    const hintLabel = this.add.text(width - 70, 22, '提示', {
      fontSize: '14px',
      color: '#34d399',
      fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    this.topBar.add(hintLabel);

    if (this.levelData.hasTimer) {
      this.timerText = this.add.text(width / 2, 22, '', {
        fontSize: '16px',
        color: '#fbbf24',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.topBar.add(this.timerText);
    }
  }

  private createShelves(): void {
    for (const shelf of this.levelData.shelves) {
      const container = this.add.container(shelf.x, shelf.y);

      const bg = this.add.image(shelf.width / 2, shelf.height / 2, 'shelf').setDisplaySize(shelf.width, shelf.height);

      const label = this.add.text(shelf.width / 2, -14, shelf.label, {
        fontSize: '14px',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const category = this.add.text(shelf.width / 2, shelf.height + 14, `[${shelf.category}]`, {
        fontSize: '12px',
        color: '#94a3b8',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      container.add([bg, label, category]);

      if (shelf.requiresLadder && !shelf.reachable) {
        const lockIcon = this.add.text(shelf.width / 2, shelf.height / 2, '🔒', {
          fontSize: '28px',
        }).setOrigin(0.5).setAlpha(0.5);
        container.add(lockIcon);
      }

      const hitArea = this.add.rectangle(shelf.width / 2, shelf.height / 2, shelf.width, shelf.height, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerdown', () => {
        this.onShelfClick(shelf);
      });

      container.add(hitArea);

      this.shelfObjects.set(shelf.id, container);
    }
  }

  private createBooks(): void {
    const booksByShelf = new Map<string, BookData[]>();
    for (const book of this.levelData.books) {
      const list = booksByShelf.get(book.currentShelfId) || [];
      list.push(book);
      booksByShelf.set(book.currentShelfId, list);
    }

    for (const [shelfId, books] of booksByShelf) {
      const shelf = this.levelData.shelves.find((s) => s.id === shelfId);
      if (!shelf) continue;

      books.forEach((book, index) => {
        const bx = shelf.x + 20 + (index % 3) * 62;
        const by = shelf.y + 20 + Math.floor(index / 3) * 90;

        const container = this.add.container(bx, by);

        const bookColor = BOOK_COLORS[book.category] ?? 0x8b5e3c;
        const bookBg = this.add.rectangle(26, 35, 52, 70, bookColor);
        bookBg.setStrokeStyle(1, 0xd4a574);

        const titleText = this.add.text(26, 28, this.truncateTitle(book.title), {
          fontSize: '10px',
          color: '#fef3c7',
          fontFamily: 'sans-serif',
          align: 'center',
          wordWrap: { width: 44 },
        }).setOrigin(0.5);

        const categoryTag = this.add.text(26, 55, book.category, {
          fontSize: '8px',
          color: '#e2e8f0',
          fontFamily: 'sans-serif',
          backgroundColor: '#00000044',
          padding: { x: 3, y: 1 },
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(26, 35, 56, 74, 0x000000, 0.001)
          .setInteractive({ useHandCursor: true });

        hitArea.on('pointerdown', () => {
          this.onBookClick(book);
        });

        hitArea.on('pointerover', () => {
          bookBg.setStrokeStyle(2, 0xfbbf24);
          this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });

        hitArea.on('pointerout', () => {
          bookBg.setStrokeStyle(1, 0xd4a574);
          this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
        });

        container.add([bookBg, titleText, categoryTag, hitArea]);
        this.bookObjects.set(book.id, container);
      });
    }
  }

  private createInventoryBar(width: number, height: number): void {
    this.inventoryBar = this.add.container(0, height - 80);

    const bg = this.add.rectangle(width / 2, 40, width, 80, 0x0a0a1a, 0.9);
    this.inventoryBar.add(bg);

    const label = this.add.text(16, 15, '物品栏', {
      fontSize: '12px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    });
    this.inventoryBar.add(label);

    this.refreshInventoryUI();
  }

  private refreshInventoryUI(): void {
    const items = this.inventoryManager.getItems();

    this.inventoryBar.each((child: Phaser.GameObjects.GameObject) => {
      if (child.getData('isInventoryItem')) {
        child.destroy();
      }
    });

    items.forEach((item, index) => {
      const ix = 16 + index * 100;
      const iy = 48;

      const iconKey = this.getIconKeyForType(item.type);
      const icon = this.add.image(ix, iy, iconKey).setInteractive({ useHandCursor: true });
      icon.setData('isInventoryItem', true);

      const name = this.add.text(ix + 20, iy, item.label, {
        fontSize: '11px',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);
      name.setData('isInventoryItem', true);

      icon.on('pointerdown', () => {
        this.showItemDetail(item);
      });

      this.inventoryBar.add(icon);
      this.inventoryBar.add(name);
    });
  }

  private createActionButtons(width: number, height: number): void {
    const submitBtn = this.add.image(width - 100, height - 130, 'button').setInteractive({ useHandCursor: true });
    const submitText = this.add.text(width - 100, height - 130, '提交判断', {
      fontSize: '14px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    submitBtn.on('pointerdown', () => {
      this.onSubmitJudgment();
    });

    submitBtn.on('pointerover', () => {
      submitBtn.setTexture('button_hover');
    });
    submitBtn.on('pointerout', () => {
      submitBtn.setTexture('button');
    });

    const menuBtn = this.add.image(90, height - 130, 'button').setDisplaySize(120, 44).setInteractive({ useHandCursor: true });
    const menuText = this.add.text(90, height - 130, '主菜单', {
      fontSize: '13px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => {
      this.saveManager.save();
      this.scene.start('MenuScene');
    });

    menuBtn.on('pointerover', () => {
      menuBtn.setTexture('button_hover');
    });
    menuBtn.on('pointerout', () => {
      menuBtn.setTexture('button');
    });
  }

  private createLadder(): void {
    const { width, height } = this.cameras.main;
    this.ladderObject = this.add.image(width / 2, height / 2 - 40, 'ladder')
      .setInteractive({ useHandCursor: true, draggable: true });

    this.input.setDraggable(this.ladderObject);

    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
      if (gameObject === this.ladderObject && !this.isLadderMoving) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    });

    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      if (gameObject === this.ladderObject) {
        this.onLadderPlaced();
      }
    });

    const ladderLabel = this.add.text(this.ladderObject.x, this.ladderObject.y + 80, '拖动书梯到书架旁', {
      fontSize: '12px',
      color: '#a78bfa',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  private onLadderPlaced(): void {
    if (!this.ladderObject) return;

    for (const shelf of this.levelData.shelves) {
      if (!shelf.requiresLadder) continue;

      const shelfCenter = { x: shelf.x + shelf.width / 2, y: shelf.y + shelf.height / 2 };
      const dist = Phaser.Math.Distance.Between(
        this.ladderObject.x, this.ladderObject.y,
        shelfCenter.x, shelfCenter.y
      );

      if (dist < 120) {
        this.ladderTargetShelf = shelf.id;
        shelf.reachable = true;

        this.isLadderMoving = true;
        this.tweens.add({
          targets: this.ladderObject,
          x: shelf.x + shelf.width + 20,
          y: shelf.y + shelf.height - 70,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            this.isLadderMoving = false;
          },
        });

        this.feedbackManager.playDiscoveryFeedback(shelfCenter.x, shelf.y - 20, `${shelf.label}现在可以检查了！`);
        this.audioManager.playDiscovery();

        this.updateShelfVisual(shelf);
        return;
      }
    }

    this.ladderTargetShelf = null;
  }

  private updateShelfVisual(shelf: ShelfData): void {
    const container = this.shelfObjects.get(shelf.id);
    if (!container) return;

    container.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Text && child.text === '🔒') {
        child.destroy();
      }
    });
  }

  private onShelfClick(shelf: ShelfData): void {
    if (shelf.requiresLadder && !shelf.reachable) {
      this.audioManager.playWrong();
      this.showNotification(`需要移动书梯到${shelf.label}旁边才能检查高层书架`, '#ef4444');
      return;
    }

    this.audioManager.playShelfScan();
    this.feedbackManager.playShelfScan(shelf.x, shelf.y, shelf.width, shelf.height);

    const shelfClues = this.levelData.clues.filter(
      (c) => c.relatedShelfIds.includes(shelf.id) && !this.clueBoardManager.getDiscoveredClues().some((dc) => dc.id === c.id)
    );

    shelfClues.forEach((clue) => {
      this.clueBoardManager.discoverClue(clue.id);
      const item: InventoryItem = {
        id: `inv_${clue.id}`,
        type: clue.type === 'borrowing_card' ? 'borrowing_card' : 'note',
        label: clue.type === 'borrowing_card' ? `借阅卡#${clue.id}` : `线索#${clue.id}`,
        description: clue.description,
        relatedClueIds: [clue.id],
      };
      this.inventoryManager.addItem(item);
      this.feedbackManager.playDiscoveryFeedback(
        shelf.x + shelf.width / 2,
        shelf.y + shelf.height / 2,
        `发现线索：${clue.type === 'borrowing_card' ? '借阅卡' : '线索'}`
      );
      this.audioManager.playDiscovery();
    });

    this.refreshInventoryUI();
  }

  private onBookClick(book: BookData): void {
    const shelf = this.levelData.shelves.find((s) => s.id === book.currentShelfId);
    if (shelf && shelf.requiresLadder && !shelf.reachable) {
      this.audioManager.playWrong();
      this.showNotification('需要先移动书梯到这个书架旁', '#ef4444');
      return;
    }

    this.audioManager.playPageFlip();
    this.feedbackManager.playBookPull(this.bookObjects.get(book.id)!);

    this.selectedBookId = book.id;

    const marked = this.clueBoardManager.isMarked(book.id);
    this.clueBoardManager.toggleSuspect(book.id);

    if (this.clueBoardManager.isMarked(book.id)) {
      this.showNotification(`已标记《${book.title}》为嫌疑项`, '#fbbf24');
    } else {
      this.showNotification(`取消标记《${book.title}》`, '#94a3b8');
    }

    this.showBookDetail(book);
  }

  private showBookDetail(book: BookData): void {
    if (this.detailPanel) {
      this.detailPanel.destroy(true);
    }

    const { width, height } = this.cameras.main;
    const px = width / 2;
    const py = height / 2;

    const panel = this.add.container(px, py).setDepth(100);
    this.detailPanel = panel;

    const panelBg = this.add.image(0, 0, 'panel').setDisplaySize(500, 300);
    panel.add(panelBg);

    const title = this.add.text(0, -120, `《${book.title}》`, {
      fontSize: '20px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    panel.add(title);

    const shelf = this.levelData.shelves.find((s) => s.id === book.currentShelfId);

    const info = this.add.text(0, -70, [
      `分类标记：${book.category}`,
      `当前书架：${shelf?.label ?? '未知'}`,
      `被标记为嫌疑：${this.clueBoardManager.isMarked(book.id) ? '是' : '否'}`,
    ].join('\n'), {
      fontSize: '14px',
      color: '#cbd5e1',
      fontFamily: 'sans-serif',
      lineSpacing: 8,
    }).setOrigin(0.5);
    panel.add(info);

    const relatedClues = this.levelData.clues.filter((c) => c.relatedBookIds.includes(book.id));
    const discoveredClueIds = this.clueBoardManager.getDiscoveredClues().map((c) => c.id);
    const visibleClues = relatedClues.filter((c) => discoveredClueIds.includes(c.id));

    if (visibleClues.length > 0) {
      const clueTitle = this.add.text(0, 10, '相关线索：', {
        fontSize: '13px',
        color: '#fbbf24',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      panel.add(clueTitle);

      visibleClues.forEach((clue, i) => {
        const clueText = this.add.text(0, 35 + i * 22, `• ${clue.description}`, {
          fontSize: '11px',
          color: '#94a3b8',
          fontFamily: 'sans-serif',
          wordWrap: { width: 440 },
        }).setOrigin(0.5);
        panel.add(clueText);
      });
    } else {
      const noClue = this.add.text(0, 10, '暂无已发现的关联线索\n（检查书架可能发现更多）', {
        fontSize: '12px',
        color: '#64748b',
        fontFamily: 'sans-serif',
        align: 'center',
      }).setOrigin(0.5);
      panel.add(noClue);
    }

    const closeBtn = this.add.image(200, -130, 'button').setDisplaySize(60, 30).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(200, -130, '关闭', {
      fontSize: '12px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    panel.add(closeBtn);
    panel.add(closeText);

    closeBtn.on('pointerdown', () => {
      this.detailPanel?.destroy(true);
      this.detailPanel = null;
    });
  }

  private onSubmitJudgment(): void {
    const markedSuspects = this.clueBoardManager.getMarkedSuspects();
    const correctIds = this.levelData.misplacedBookIds;

    if (markedSuspects.length === 0) {
      this.showNotification('请先点击书籍标记你认为错位的藏书', '#fbbf24');
      return;
    }

    const correctMarks = markedSuspects.filter((id) => correctIds.includes(id));
    const wrongMarks = markedSuspects.filter((id) => !correctIds.includes(id));
    const missedIds = correctIds.filter((id) => !markedSuspects.includes(id));

    if (wrongMarks.length === 0 && missedIds.length === 0) {
      this.onLevelComplete();
      return;
    }

    this.wrongAttempts++;
    this.saveManager.incrementWrongAttempts();
    this.audioManager.playWrong();

    const reasons: string[] = [];
    const missed: string[] = [];

    wrongMarks.forEach((bookId) => {
      const book = this.levelData.books.find((b) => b.id === bookId)!;
      const shelf = this.levelData.shelves.find((s) => s.id === book.currentShelfId);
      reasons.push(
        `你标记了《${book.title}》，但它的分类标记「${book.category}」与${shelf?.label ?? '当前书架'}的标签一致——没有矛盾线索表明它错位了`
      );
    });

    missedIds.forEach((bookId) => {
      const book = this.levelData.books.find((b) => b.id === bookId)!;
      const currentShelf = this.levelData.shelves.find((s) => s.id === book.currentShelfId);
      missed.push(
        `你遗漏了《${book.title}》——它的借阅卡归属区域与${currentShelf?.label ?? '当前书架'}的标签存在矛盾，而你未标记它`
      );
    });

    this.resultData = { success: false, reasons, missed };

    this.showFailureFeedback(reasons, missed);

    if (this.saveManager.getWrongAttempts() >= 3) {
      this.showHintHighlight();
    } else if (this.saveManager.getWrongAttempts() >= 1) {
      this.showHint();
    }
  }

  private showFailureFeedback(reasons: string[], missed: string[]): void {
    if (this.detailPanel) {
      this.detailPanel.destroy(true);
      this.detailPanel = null;
    }

    const { width, height } = this.cameras.main;
    const panel = this.add.container(width / 2, height / 2).setDepth(100);
    this.detailPanel = panel;

    const panelH = Math.min(400, 100 + (reasons.length + missed.length) * 40);
    const panelBg = this.add.image(0, 0, 'panel').setDisplaySize(600, panelH);
    panel.add(panelBg);

    const header = this.add.text(0, -panelH / 2 + 25, '判断有误', {
      fontSize: '20px',
      color: '#ef4444',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    panel.add(header);

    let yPos = -panelH / 2 + 60;

    if (reasons.length > 0) {
      const wrongHeader = this.add.text(0, yPos, '❌ 错误标记：', {
        fontSize: '14px',
        color: '#fbbf24',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      panel.add(wrongHeader);
      yPos += 24;

      reasons.forEach((reason) => {
        const text = this.add.text(0, yPos, reason, {
          fontSize: '11px',
          color: '#fca5a5',
          fontFamily: 'sans-serif',
          wordWrap: { width: 540 },
        }).setOrigin(0.5);
        panel.add(text);
        yPos += 30;
      });
    }

    if (missed.length > 0) {
      yPos += 8;
      const missHeader = this.add.text(0, yPos, '👀 遗漏项目：', {
        fontSize: '14px',
        color: '#60a5fa',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      panel.add(missHeader);
      yPos += 24;

      missed.forEach((m) => {
        const text = this.add.text(0, yPos, m, {
          fontSize: '11px',
          color: '#93c5fd',
          fontFamily: 'sans-serif',
          wordWrap: { width: 540 },
        }).setOrigin(0.5);
        panel.add(text);
        yPos += 30;
      });
    }

    const attemptsText = this.add.text(0, panelH / 2 - 45, `连续错误次数：${this.wrongAttempts}${this.wrongAttempts >= 3 ? '（已触发区域高亮提示）' : ''}`, {
      fontSize: '12px',
      color: '#64748b',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    panel.add(attemptsText);

    const retryBtn = this.add.image(0, panelH / 2 - 15, 'button').setDisplaySize(120, 36).setInteractive({ useHandCursor: true });
    const retryText = this.add.text(0, panelH / 2 - 15, '继续排查', {
      fontSize: '13px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    panel.add(retryBtn);
    panel.add(retryText);

    retryBtn.on('pointerdown', () => {
      this.detailPanel?.destroy(true);
      this.detailPanel = null;
    });
  }

  private showHint(): void {
    const hint = this.hintManager.requestHint();
    if (hint.text) {
      this.showNotification(`💡 提示：${hint.text}`, '#34d399');
    }
  }

  private showHintHighlight(): void {
    const hint = this.hintManager.requestHint();
    if (hint.text) {
      this.showNotification(`💡 提示：${hint.text}`, '#34d399');
    }

    if (hint.highlightArea) {
      const shelf = this.levelData.shelves.find((s) => s.id === hint.highlightArea!.shelfId);
      if (shelf) {
        const hl = this.add.image(shelf.x + shelf.width / 2, shelf.y + shelf.height / 2, 'highlight')
          .setDisplaySize(shelf.width + 20, shelf.height + 20)
          .setAlpha(0.3)
          .setDepth(50);
        this.highlightObjects.set(shelf.id, hl);
        this.feedbackManager.playHighlightPulse(hl, 4000);

        this.time.delayedCall(4000, () => {
          hl.destroy();
          this.highlightObjects.delete(shelf.id);
        });
      }

      const bookObj = this.bookObjects.get(hint.highlightArea.bookId);
      if (bookObj) {
        this.tweens.add({
          targets: bookObj,
          alpha: { from: 0.5, to: 1 },
          duration: 400,
          yoyo: true,
          repeat: 4,
        });
      }
    }
  }

  private onLevelComplete(): void {
    this.stopTimer();
    this.audioManager.playLevelComplete();

    this.saveManager.completeLevel(this.levelData.id);

    const nextChapter = this.levelData.chapter + 1;
    const hasNextLevel = LEVEL_MAP[nextChapter];

    this.scene.start('ResultScene', {
      success: true,
      levelData: this.levelData,
      nextChapter: hasNextLevel ? nextChapter : null,
    });
  }

  private startTimer(): void {
    this.remainingTime = this.levelData.timeLimitSeconds;
    this.updateTimerDisplay();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.timerPaused) return;
        this.remainingTime--;
        this.updateTimerDisplay();

        if (this.remainingTime <= 10 && this.remainingTime > 0) {
          this.audioManager.playTimerTick(true);
        } else if (this.remainingTime > 10 && this.remainingTime % 30 === 0) {
          this.audioManager.playTimerTick(false);
        }

        if (this.remainingTime <= 0) {
          this.onTimeUp();
        }
      },
      loop: true,
    });
  }

  private stopTimer(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }
  }

  private updateTimerDisplay(): void {
    if (!this.timerText) return;
    const mins = Math.floor(this.remainingTime / 60);
    const secs = this.remainingTime % 60;
    this.timerText.setText(`⏰ ${mins}:${secs.toString().padStart(2, '0')}`);

    if (this.remainingTime <= 30) {
      this.timerText.setColor('#ef4444');
    } else if (this.remainingTime <= 60) {
      this.timerText.setColor('#fbbf24');
    }
  }

  private onTimeUp(): void {
    this.stopTimer();
    this.audioManager.playGameOver();

    const markedSuspects = this.clueBoardManager.getMarkedSuspects();
    const correctIds = this.levelData.misplacedBookIds;

    const reasons: string[] = ['闭馆时间已到！你未能在限定时间内完成排查。'];
    const missed: string[] = [];

    correctIds.forEach((bookId) => {
      if (!markedSuspects.includes(bookId)) {
        const book = this.levelData.books.find((b) => b.id === bookId)!;
        const currentShelf = this.levelData.shelves.find((s) => s.id === book.currentShelfId);
        missed.push(
          `《${book.title}》——它的借阅卡归属区域与${currentShelf?.label ?? '当前书架'}的标签存在矛盾，你未发现这处矛盾`
        );
      }
    });

    this.scene.start('ResultScene', {
      success: false,
      levelData: this.levelData,
      failureReason: 'timeout',
      reasons,
      missed,
    });
  }

  private autoDiscoverInitialClues(): void {
    const initialClues = this.levelData.clues.filter(
      (c) => c.type === 'borrowing_card' || c.type === 'shelf_label'
    );

    initialClues.forEach((clue) => {
      this.clueBoardManager.discoverClue(clue.id);
      const item: InventoryItem = {
        id: `inv_${clue.id}`,
        type: clue.type === 'borrowing_card' ? 'borrowing_card' : 'note',
        label: clue.type === 'borrowing_card' ? `借阅卡#${clue.id}` : `书架记录#${clue.id}`,
        description: clue.description,
        relatedClueIds: [clue.id],
      };
      this.inventoryManager.addItem(item);
    });

    this.refreshInventoryUI();
  }

  private showNotification(text: string, color: string = '#e2e8f0'): void {
    const { width } = this.cameras.main;
    const notif = this.add.text(width / 2, 70, text, {
      fontSize: '14px',
      color,
      fontFamily: 'sans-serif',
      backgroundColor: '#0a0a1a88',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: notif,
      y: 50,
      alpha: 0,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => notif.destroy(),
    });
  }

  private showItemDetail(item: InventoryItem): void {
    this.audioManager.playPageFlip();

    if (this.detailPanel) {
      this.detailPanel.destroy(true);
    }

    const { width, height } = this.cameras.main;
    this.detailPanel = this.add.container(width / 2, height / 2).setDepth(100);

    const panelBg = this.add.image(0, 0, 'panel').setDisplaySize(450, 200);
    this.detailPanel.add(panelBg);

    const title = this.add.text(0, -70, item.label, {
      fontSize: '16px',
      color: '#fbbf24',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.detailPanel.add(title);

    const desc = this.add.text(0, -20, item.description, {
      fontSize: '13px',
      color: '#cbd5e1',
      fontFamily: 'sans-serif',
      wordWrap: { width: 400 },
    }).setOrigin(0.5);
    this.detailPanel.add(desc);

    const closeBtn = this.add.image(0, 60, 'button').setDisplaySize(100, 34).setInteractive({ useHandCursor: true });
    const closeText = this.add.text(0, 60, '关闭', {
      fontSize: '13px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    this.detailPanel.add(closeBtn);
    this.detailPanel.add(closeText);

    closeBtn.on('pointerdown', () => {
      this.detailPanel?.destroy(true);
      this.detailPanel = null;
    });
  }

  private truncateTitle(title: string): string {
    if (title.length <= 5) return title;
    return title.substring(0, 4) + '…';
  }

  private getIconKeyForType(type: InventoryItem['type']): string {
    switch (type) {
      case 'borrowing_card': return 'icon_card';
      case 'flashlight': return 'icon_flashlight';
      case 'ladder_key': return 'icon_ladder';
      case 'note': return 'icon_note';
    }
  }
}
