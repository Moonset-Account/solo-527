import Phaser from 'phaser';
import { LevelConfig, TileType, Point, Direction } from '@core/types';
import { COLORS } from '@config/constants';
import { configManager } from '@systems/ConfigManager';
import { inputManager } from '@systems/InputManager';
import { audioSystem } from '@systems/AudioSystem';
import { saveSystem } from '@systems/SaveSystem';
import { eventBus, GameEvents } from '@core/EventBus';
import { generateId } from '@core/utils';

type EditorTool = 'wall' | 'floor' | 'player' | 'bookshelf' | 'bookslot' | 'clue' | 'indexcard';

const TOOL_LABELS: Record<EditorTool, string> = {
  wall: '🧱 墙壁',
  floor: '⬜ 地板',
  player: '🚶 玩家起点',
  bookshelf: '📚 书架',
  bookslot: '📖 目标书架',
  clue: '📝 线索',
  indexcard: '📇 索引卡'
};

const CATEGORIES = ['fiction', 'history', 'science', 'art', 'literature', 'philosophy', 'mystery', 'romance', 'scifi', 'biography', 'cooking'];
const BOOK_COLORS = [0xe06c75, 0x98c379, 0x56b6c2, 0xc678dd, 0xe5c07b, 0x7aa2f7, 0xff85a8, 0xd19a66, 0xffa94d];

export class EditorScene extends Phaser.Scene {
  private level: LevelConfig;
  private tileSize: number = 36;
  private currentTool: EditorTool = 'wall';
  private selectedCategory: string = 'fiction';
  private grid: TileType[][] = [];
  private playerStart: Point = { x: 1, y: 1 };
  private shelves: Array<{ pos: Point; isTarget: boolean; category: string; id: string }> = [];
  private clues: Array<{ pos: Point; id: string }> = [];
  private cards: Array<{ pos: Point; id: string; clueId: string; bookId: string }> = [];
  private books: Array<{ id: string; name: string; category: string; color: number; correctShelfId: string }> = [];
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private toolButtons: Map<EditorTool, Phaser.GameObjects.Container> = new Map();
  private isPainting: boolean = false;
  private editorContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'EditorScene' });
    this.level = configManager.createEmptyLevel(12, 10);
    this.grid = this.level.grid.map(row => [...row]);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    inputManager.initialize(this);

    this.createUI();
    this.drawEditorGrid();
    this.setupInteraction();

    eventBus.emit(GameEvents.EDITOR_OPEN);

    this.scale.on('resize', () => this.onResize());
  }

  private createUI(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.hudBg, 0.95);
    topBar.fillRect(0, 0, w, 60);
    topBar.lineStyle(1, COLORS.hudBorder, 0.8);
    topBar.lineBetween(0, 60, w, 60);

    const title = this.add.text(w / 2, 30, '🛠 关卡编辑器', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffd866',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const backBtn = this.add.container(80, 30);
    const backBg = this.add.graphics();
    backBg.fillStyle(COLORS.hudBorder, 0.9);
    backBg.fillRoundedRect(-50, -20, 100, 40, 8);
    const backText = this.add.text(0, 0, '← 返回', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e8e8f0'
    });
    backText.setOrigin(0.5);
    backBtn.add([backBg, backText]);
    backBtn.setSize(100, 40);
    backBtn.setInteractive();
    backBtn.on('pointerdown', () => {
      audioSystem.play('click');
      this.goBack();
    });

    const saveBtn = this.add.container(w - 90, 30);
    const saveBg = this.add.graphics();
    saveBg.fillStyle(COLORS.success, 0.9);
    saveBg.fillRoundedRect(-55, -20, 110, 40, 8);
    const saveText = this.add.text(0, 0, '💾 保存关卡', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#0a0a14',
      fontStyle: 'bold'
    });
    saveText.setOrigin(0.5);
    saveBtn.add([saveBg, saveText]);
    saveBtn.setSize(110, 40);
    saveBtn.setInteractive();
    saveBtn.on('pointerover', () => saveBtn.setScale(1.05));
    saveBtn.on('pointerout', () => saveBtn.setScale(1));
    saveBtn.on('pointerdown', () => {
      audioSystem.play('click');
      this.saveLevel();
    });

    this.createToolPalette();
    this.createPropertyPanel();
    this.createBottomBar();
  }

  private createToolPalette(): void {
    const panelX = 16;
    const panelY = 80;
    const tools: EditorTool[] = ['wall', 'floor', 'player', 'bookshelf', 'bookslot', 'clue', 'indexcard'];

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.hudBg, 0.9);
    bg.fillRoundedRect(panelX - 8, panelY - 8, 156, tools.length * 46 + 24, 10);
    bg.lineStyle(1, COLORS.hudBorder, 0.7);
    bg.strokeRoundedRect(panelX - 8, panelY - 8, 156, tools.length * 46 + 24, 10);

    const label = this.add.text(panelX + 68, panelY, '工具', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#8892b0'
    });
    label.setOrigin(0.5, 0);

    tools.forEach((tool, i) => {
      const y = panelY + 28 + i * 46;
      const btn = this.add.container(panelX + 68, y + 18);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(this.currentTool === tool ? COLORS.accent : COLORS.hudBorder, this.currentTool === tool ? 0.6 : 0.6);
      btnBg.fillRoundedRect(-60, -18, 136, 36, 6);
      if (this.currentTool === tool) {
        btnBg.lineStyle(2, COLORS.accent, 0.9);
        btnBg.strokeRoundedRect(-60, -18, 136, 36, 6);
      }

      const btnText = this.add.text(-52, 0, TOOL_LABELS[tool], {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: this.currentTool === tool ? '#ffffff' : '#e8e8f0'
      });
      btnText.setOrigin(0, 0.5);

      btn.add([btnBg, btnText]);
      btn.setSize(136, 36);
      btn.setInteractive();
      btn.on('pointerover', () => btn.setScale(1.03));
      btn.on('pointerout', () => btn.setScale(1));
      btn.on('pointerdown', () => {
        audioSystem.play('select');
        this.currentTool = tool;
        this.updateToolPalette();
      });

      this.toolButtons.set(tool, btn);
    });
  }

  private updateToolPalette(): void {
    this.toolButtons.forEach((btn, tool) => {
      const [bg, ...rest] = btn.list as [Phaser.GameObjects.Graphics, ...Phaser.GameObjects.GameObject[]];
      const text = rest[0] as Phaser.GameObjects.Text;
      
      bg.clear();
      bg.fillStyle(this.currentTool === tool ? COLORS.accent : COLORS.hudBorder, this.currentTool === tool ? 0.6 : 0.6);
      bg.fillRoundedRect(-60, -18, 136, 36, 6);
      if (this.currentTool === tool) {
        bg.lineStyle(2, COLORS.accent, 0.9);
        bg.strokeRoundedRect(-60, -18, 136, 36, 6);
      }
      text.setColor(this.currentTool === tool ? '#ffffff' : '#e8e8f0');
    });
  }

  private createPropertyPanel(): void {
    const w = this.scale.width;
    const panelX = w - 200;
    const panelY = 80;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.hudBg, 0.9);
    bg.fillRoundedRect(panelX - 8, panelY - 8, 192, 320, 10);
    bg.lineStyle(1, COLORS.hudBorder, 0.7);
    bg.strokeRoundedRect(panelX - 8, panelY - 8, 192, 320, 10);

    const title = this.add.text(panelX + 88, panelY, '属性设置', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#8892b0'
    });
    title.setOrigin(0.5, 0);

    const catLabel = this.add.text(panelX, panelY + 40, '书籍分类：', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e8e8f0'
    });

    CATEGORIES.forEach((cat, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = panelX + col * 88;
      const y = panelY + 70 + row * 32;

      const catBg = this.add.graphics();
      catBg.fillStyle(this.selectedCategory === cat ? COLORS.success : COLORS.hudBorder, 0.8);
      catBg.fillRoundedRect(x, y, 82, 26, 5);

      const catText = this.add.text(x + 41, y + 13, cat.slice(0, 6), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e8e8f0',
        fontStyle: 'bold'
      });
      catText.setOrigin(0.5);

      const clickable = this.add.container(x + 41, y + 13);
      clickable.setSize(82, 26);
      clickable.setInteractive();
      clickable.on('pointerdown', () => {
        audioSystem.play('select');
        this.selectedCategory = cat;
        this.createPropertyPanel();
      });
    });

    const sizeLabel = this.add.text(panelX, panelY + 220, '地图尺寸：', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e8e8f0'
    });

    const sizeText = this.add.text(panelX + 80, panelY + 220, `${this.grid[0].length} × ${this.grid.length}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#7aa2f7'
    });

    const stepLabel = this.add.text(panelX, panelY + 250, '最大步数：', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e8e8f0'
    });

    const stepBg = this.add.graphics();
    stepBg.fillStyle(COLORS.hudBorder, 0.9);
    stepBg.fillRoundedRect(panelX + 76, panelY + 242, 70, 28, 5);
    const stepText = this.add.text(panelX + 111, panelY + 256, this.level.maxSteps.toString(), {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd866',
      fontStyle: 'bold'
    });
    stepText.setOrigin(0.5);
  }

  private createBottomBar(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.hudBg, 0.95);
    bg.fillRect(0, h - 48, w, 48);
    bg.lineStyle(1, COLORS.hudBorder, 0.8);
    bg.lineBetween(0, h - 48, w, h - 48);

    const stats = [
      { label: '书架', value: this.shelves.length, color: '#8b5a3c' },
      { label: '目标书架', value: this.shelves.filter(s => s.isTarget).length, color: '#98c379' },
      { label: '线索', value: this.clues.length, color: '#ffd866' },
      { label: '索引卡', value: this.cards.length, color: '#c678dd' },
      { label: '书籍', value: this.books.length, color: '#e06c75' }
    ];

    stats.forEach((s, i) => {
      const x = 30 + i * 150;
      const label = this.add.text(x, h - 24, `${s.label}:`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8892b0'
      });
      label.setOrigin(0, 0.5);
      const value = this.add.text(x + 52, h - 24, s.value.toString(), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: s.color,
        fontStyle: 'bold'
      });
      value.setOrigin(0, 0.5);
    });

    const hint = this.add.text(w - 20, h - 24, '左键绘制 | 右键擦除 | 点击书架/线索/索引卡可删除', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#5a5a7a'
    });
    hint.setOrigin(1, 0.5);
  }

  private drawEditorGrid(): void {
    if (this.graphics) this.graphics.destroy();
    this.graphics = this.add.graphics();

    const offsetX = 200;
    const offsetY = 100;
    const rows = this.grid.length;
    const cols = this.grid[0].length;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const wx = offsetX + x * this.tileSize;
        const wy = offsetY + y * this.tileSize;
        const tile = this.grid[y][x];
        const isAlt = (x + y) % 2 === 0;

        if (tile === 'wall') {
          this.graphics.fillStyle(COLORS.wall, 1);
          this.graphics.fillRect(wx, wy, this.tileSize, this.tileSize);
          this.graphics.fillStyle(COLORS.wallDark, 0.3);
          this.graphics.fillRect(wx, wy, this.tileSize, this.tileSize * 0.2);
        } else {
          this.graphics.fillStyle(isAlt ? COLORS.floor : COLORS.floorAlt, 1);
          this.graphics.fillRect(wx, wy, this.tileSize, this.tileSize);
        }

        this.graphics.lineStyle(1, COLORS.wallDark, 0.3);
        this.graphics.strokeRect(wx + 0.5, wy + 0.5, this.tileSize - 1, this.tileSize - 1);
      }
    }

    const px = offsetX + this.playerStart.x * this.tileSize + this.tileSize / 2;
    const py = offsetY + this.playerStart.y * this.tileSize + this.tileSize / 2;
    this.graphics.fillStyle(COLORS.player, 0.9);
    this.graphics.fillCircle(px, py, this.tileSize * 0.35);
    this.graphics.lineStyle(2, COLORS.playerDark, 1);
    this.graphics.strokeCircle(px, py, this.tileSize * 0.35);
    const playerLabel = this.add.text(px, py, '🚶', { fontSize: `${this.tileSize * 0.5}px` });
    playerLabel.setOrigin(0.5);
    this.playerStartLabel = playerLabel;

    this.shelves.forEach(shelf => {
      const sx = offsetX + shelf.pos.x * this.tileSize + this.tileSize / 2;
      const sy = offsetY + shelf.pos.y * this.tileSize + this.tileSize / 2;

      this.graphics!.fillStyle(shelf.isTarget ? COLORS.bookCorrect : COLORS.bookshelf, 0.95);
      this.graphics!.fillRoundedRect(sx - this.tileSize * 0.4, sy - this.tileSize * 0.4, this.tileSize * 0.8, this.tileSize * 0.8, this.tileSize * 0.1);

      if (shelf.isTarget) {
        this.graphics!.lineStyle(2, COLORS.success, 1);
        this.graphics!.strokeRoundedRect(sx - this.tileSize * 0.4, sy - this.tileSize * 0.4, this.tileSize * 0.8, this.tileSize * 0.8, this.tileSize * 0.1);
      }

      const catColorMap: Record<string, number> = {};
      CATEGORIES.forEach((c, i) => catColorMap[c] = BOOK_COLORS[i % BOOK_COLORS.length]);

      this.graphics!.fillStyle(catColorMap[shelf.category] || COLORS.accent, 0.7);
      this.graphics!.fillRect(sx - this.tileSize * 0.35, sy - this.tileSize * 0.15, this.tileSize * 0.7, this.tileSize * 0.12);
    });

    this.clues.forEach(clue => {
      const cx = offsetX + clue.pos.x * this.tileSize + this.tileSize / 2;
      const cy = offsetY + clue.pos.y * this.tileSize + this.tileSize / 2;

      this.graphics!.fillStyle(COLORS.clue, 0.9);
      this.graphics!.fillCircle(cx, cy, this.tileSize * 0.25);
      this.graphics!.lineStyle(2, COLORS.clueGlow, 0.8);
      this.graphics!.strokeCircle(cx, cy, this.tileSize * 0.3);

      const q = this.add.text(cx, cy, '?', {
        fontFamily: 'monospace',
        fontSize: `${this.tileSize * 0.35}px`,
        color: '#0a0a14',
        fontStyle: 'bold'
      });
      q.setOrigin(0.5);
    });

    this.cards.forEach(card => {
      const cx = offsetX + card.pos.x * this.tileSize + this.tileSize / 2;
      const cy = offsetY + card.pos.y * this.tileSize + this.tileSize / 2;

      this.graphics!.fillStyle(COLORS.indexCard, 0.9);
      this.graphics!.fillRoundedRect(cx - this.tileSize * 0.3, cy - this.tileSize * 0.35, this.tileSize * 0.6, this.tileSize * 0.7, 4);
      this.graphics!.lineStyle(2, COLORS.indexCardBroken, 0.8);
      this.graphics!.strokeRoundedRect(cx - this.tileSize * 0.3, cy - this.tileSize * 0.35, this.tileSize * 0.6, this.tileSize * 0.7, 4);
    });

    if (!this.editorContainer) {
      this.editorContainer = this.add.container(offsetX, offsetY);
    }
    this.gridOffset = { x: offsetX, y: offsetY };
  }
  private playerStartLabel: Phaser.GameObjects.Text | null = null;
  private gridOffset: Point = { x: 200, y: 100 };

  private setupInteraction(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 2) {
        this.isPainting = true;
        this.eraseAt(pointer);
      } else if (pointer.button === 0) {
        this.isPainting = true;
        this.applyToolAt(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPainting) return;
      if (pointer.rightButtonDown()) {
        this.eraseAt(pointer);
      } else if (pointer.leftButtonDown()) {
        this.applyToolAt(pointer);
      }
    });

    this.input.on('pointerup', () => {
      this.isPainting = false;
    });

    this.input.on('pointerdown:right', (e: Event) => e.preventDefault());
  }

  private getGridPosition(pointer: Phaser.Input.Pointer): Point | null {
    const wx = pointer.x - this.gridOffset.x;
    const wy = pointer.y - this.gridOffset.y;
    
    if (wx < 0 || wy < 0) return null;
    
    const gx = Math.floor(wx / this.tileSize);
    const gy = Math.floor(wy / this.tileSize);

    if (gy < 0 || gy >= this.grid.length) return null;
    if (gx < 0 || gx >= this.grid[gy].length) return null;
    
    return { x: gx, y: gy };
  }

  private applyToolAt(pointer: Phaser.Input.Pointer): void {
    const pos = this.getGridPosition(pointer);
    if (!pos) return;

    if (this.currentTool === 'wall' || this.currentTool === 'floor') {
      this.grid[pos.y][pos.x] = this.currentTool === 'wall' ? 'wall' : 'floor';
    } else if (this.currentTool === 'player') {
      if (this.grid[pos.y][pos.x] !== 'wall') {
        this.playerStart = { ...pos };
      }
    } else if (this.currentTool === 'bookshelf' || this.currentTool === 'bookslot') {
      if (this.grid[pos.y][pos.x] !== 'wall' &&
          (pos.x !== this.playerStart.x || pos.y !== this.playerStart.y)) {
        const existing = this.shelves.findIndex(s => s.pos.x === pos.x && s.pos.y === pos.y);
        if (existing === -1) {
          this.shelves.push({
            pos: { ...pos },
            isTarget: this.currentTool === 'bookslot',
            category: this.selectedCategory,
            id: `shelf_${generateId('e')}`
          });
          if (this.currentTool === 'bookslot') {
            this.books.push({
              id: `book_${generateId('e')}`,
              name: `书籍${this.books.length + 1}`,
              category: this.selectedCategory,
              color: BOOK_COLORS[this.books.length % BOOK_COLORS.length],
              correctShelfId: this.shelves[this.shelves.length - 1].id
            });
            this.level.targetBooks.push(this.books[this.books.length - 1].id);
          }
        }
      }
    } else if (this.currentTool === 'clue') {
      if (this.grid[pos.y][pos.x] !== 'wall') {
        const existing = this.clues.findIndex(c => c.pos.x === pos.x && c.pos.y === pos.y);
        if (existing === -1) {
          const newClue = { pos: { ...pos }, id: `clue_${generateId('e')}` };
          this.clues.push(newClue);
          
          const targetShelves = this.shelves.filter(s => s.isTarget);
          if (targetShelves.length > 0) {
            const shelf = targetShelves[this.clues.length % targetShelves.length];
            const bookForShelf = this.books.find(b => b.correctShelfId === shelf.id);
            this.cards.push({
              pos: { ...pos },
              id: `card_${generateId('e')}`,
              clueId: newClue.id,
              bookId: bookForShelf?.id || this.books[0]?.id || ''
            });
          }
        }
      }
    } else if (this.currentTool === 'indexcard') {
      if (this.grid[pos.y][pos.x] !== 'wall' && this.clues.length > 0) {
        const existing = this.cards.findIndex(c => c.pos.x === pos.x && c.pos.y === pos.y);
        if (existing === -1) {
          const targetShelves = this.shelves.filter(s => s.isTarget);
          const shelf = targetShelves[this.cards.length % Math.max(1, targetShelves.length)];
          const bookForShelf = this.books.find(b => b.correctShelfId === shelf?.id);
          
          this.cards.push({
            pos: { ...pos },
            id: `card_${generateId('e')}`,
            clueId: this.clues[this.cards.length % this.clues.length].id,
            bookId: bookForShelf?.id || this.books[0]?.id || ''
          });
        }
      }
    }

    audioSystem.play('move');
    this.drawEditorGrid();
    this.createBottomBar();
  }

  private eraseAt(pointer: Phaser.Input.Pointer): void {
    const pos = this.getGridPosition(pointer);
    if (!pos) return;

    this.grid[pos.y][pos.x] = 'floor';

    const shelfIdx = this.shelves.findIndex(s => s.pos.x === pos.x && s.pos.y === pos.y);
    if (shelfIdx >= 0) {
      const removedId = this.shelves[shelfIdx].id;
      this.shelves.splice(shelfIdx, 1);

      const bookIdx = this.books.findIndex(b => b.correctShelfId === removedId);
      if (bookIdx >= 0) {
        const bookId = this.books[bookIdx].id;
        this.books.splice(bookIdx, 1);
        const targetIdx = this.level.targetBooks.indexOf(bookId);
        if (targetIdx >= 0) this.level.targetBooks.splice(targetIdx, 1);
      }
    }

    const clueIdx = this.clues.findIndex(c => c.pos.x === pos.x && c.pos.y === pos.y);
    if (clueIdx >= 0) {
      const removedId = this.clues[clueIdx].id;
      this.clues.splice(clueIdx, 1);
      for (let i = this.cards.length - 1; i >= 0; i--) {
        if (this.cards[i].clueId === removedId) {
          this.cards.splice(i, 1);
        }
      }
    }

    const cardIdx = this.cards.findIndex(c => c.pos.x === pos.x && c.pos.y === pos.y);
    if (cardIdx >= 0) this.cards.splice(cardIdx, 1);

    this.drawEditorGrid();
    this.createBottomBar();
  }

  private saveLevel(): void {
    const targetShelves = this.shelves.filter(s => s.isTarget);
    if (targetShelves.length === 0) {
      this.showEditorMessage('至少需要一个目标书架！', 'error');
      return;
    }
    if (this.books.length === 0) {
      this.showEditorMessage('至少需要一个目标书架来生成书籍！', 'error');
      return;
    }
    if (this.clues.length === 0) {
      this.showEditorMessage('至少添加一些线索！', 'warning');
    }

    const newLevel: LevelConfig = {
      id: `custom_${Date.now().toString(36)}`,
      name: `自定义关卡 #${saveSystem.getCustomLevels().length + 1}`,
      description: '玩家在关卡编辑器中创建的关卡',
      width: this.grid[0].length,
      height: this.grid.length,
      maxSteps: this.level.maxSteps,
      grid: this.grid.map(row => [...row]),
      playerStart: { ...this.playerStart },
      bookshelves: this.shelves.map(s => ({
        id: s.id,
        position: { ...s.pos },
        isTarget: s.isTarget,
        category: s.category
      })),
      books: this.books.map(b => ({
        id: b.id,
        name: b.name,
        category: b.category,
        color: b.color,
        correctShelfId: b.correctShelfId,
        isPlaced: false
      })),
      clues: this.clues.map((c, i) => ({
        id: c.id,
        title: `线索 #${i + 1}`,
        description: `这是第 ${i + 1} 条线索`,
        position: { ...c.pos },
        collected: false,
        hintForBook: this.cards[i]?.bookId
      })),
      indexCards: this.cards.map(c => ({
        id: c.id,
        position: { ...c.pos },
        bookId: c.bookId,
        isFixed: false,
        requiredClueIds: [c.clueId]
      })),
      targetBooks: [...this.level.targetBooks]
    };

    const validation = configManager.isValidLevel(newLevel);
    if (!validation.valid) {
      this.showEditorMessage(`关卡无效：${validation.errors[0]}`, 'error');
      return;
    }

    configManager.saveCustomLevel(newLevel);
    this.showEditorMessage('✓ 关卡已保存！返回菜单可选择游玩', 'success');
  }

  private showEditorMessage(msg: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    eventBus.emit(GameEvents.NOTIFICATION, {
      id: `editor_${Date.now()}`,
      message: msg,
      type,
      duration: 3000
    });
  }

  private goBack(): void {
    eventBus.emit(GameEvents.EDITOR_CLOSE);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }

  private onResize(): void {
    this.createUI();
    this.createToolPalette();
    this.createPropertyPanel();
    this.createBottomBar();
    this.drawEditorGrid();
  }
}
