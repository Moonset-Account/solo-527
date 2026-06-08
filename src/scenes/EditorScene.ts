import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '@/config/GameConfig';
import { LevelData, TileData, EntityData, ClueData } from '@/types';

type EditorTool = 'wall' | 'floor' | 'shelf_slot' | 'index_stand' | 'bookshelf' | 'book' | 'clue_item' | 'player' | 'eraser';

export class EditorScene extends Phaser.Scene {
  private gridWidth: number = 10;
  private gridHeight: number = 8;
  private tiles: Map<string, TileData> = new Map();
  private entities: EntityData[] = [];
  private playerStart: { x: number; y: number } = { x: 1, y: 1 };
  private currentTool: EditorTool = 'wall';
  private maxSteps: number = 40;
  private difficulty: number = 1;
  private levelName: string = '自定义关卡';
  private tileSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private entitySprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private offsetX: number = 0;
  private offsetY: number = 0;
  private playerSprite: Phaser.GameObjects.Container | null = null;
  private toolButtons: Map<EditorTool, Phaser.GameObjects.Text> = new Map();
  private selectedToolIndicator!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'EditorScene' });
  }

  create(): void {
    this.offsetX = 220;
    this.offsetY = 50;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    this.add.text(GAME_WIDTH / 2, 20, '关卡编辑器', {
      fontSize: '22px', fontFamily: 'serif', color: '#e6a817',
    }).setOrigin(0.5);

    this.createToolbar();
    this.createInfoPanel();
    this.createActionButtons();
    this.initGrid();
    this.setupInput();
  }

  private createToolbar(): void {
    const tools: { id: EditorTool; label: string; color: string }[] = [
      { id: 'wall', label: '墙壁', color: '#3d2b1f' },
      { id: 'floor', label: '地板', color: '#2a2a4a' },
      { id: 'shelf_slot', label: '书架位', color: '#5c3d2e' },
      { id: 'index_stand', label: '索引架', color: '#fbbf24' },
      { id: 'bookshelf', label: '书架', color: '#6b3a2a' },
      { id: 'book', label: '书籍', color: '#e6a817' },
      { id: 'clue_item', label: '线索', color: '#60a5fa' },
      { id: 'player', label: '玩家', color: '#60a5fa' },
      { id: 'eraser', label: '橡皮', color: '#ef4444' },
    ];

    const startY = 60;
    this.add.text(20, startY, '工具', { fontSize: '14px', color: '#f0e6d3' });

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      const y = startY + 30 + i * 32;
      const btn = this.add.text(20, y, tool.label, {
        fontSize: '14px', fontFamily: 'sans-serif', color: '#f0e6d3',
        backgroundColor: '#1a1a2e',
        padding: { x: 8, y: 4 },
      }).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.currentTool = tool.id;
        this.updateToolSelection();
      });

      this.toolButtons.set(tool.id, btn);
    }

    this.selectedToolIndicator = this.add.rectangle(15, startY + 30, 100, 28, COLORS.accent, 0.3);
    this.selectedToolIndicator.setOrigin(0, 0);
    this.selectedToolIndicator.setStrokeStyle(1, COLORS.accent);
  }

  private createInfoPanel(): void {
    const px = 20;
    const py = 380;

    this.add.text(px, py, '信息', { fontSize: '14px', color: '#f0e6d3' });

    this.add.text(px, py + 24, `尺寸: ${this.gridWidth}x${this.gridHeight}`, {
      fontSize: '12px', color: '#9ca3af',
    });

    const stepsBtn = this.add.text(px, py + 44, `限步: ${this.maxSteps} [+/-]`, {
      fontSize: '12px', color: '#e6a817',
    }).setInteractive({ useHandCursor: true });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-PLUS', () => { this.maxSteps += 5; stepsBtn.setText(`限步: ${this.maxSteps} [+/-]`); });
      this.input.keyboard.on('keydown-MINUS', () => { this.maxSteps = Math.max(5, this.maxSteps - 5); stepsBtn.setText(`限步: ${this.maxSteps} [+/-]`); });
    }

    const diffBtn = this.add.text(px, py + 64, `难度: ${this.difficulty}`, {
      fontSize: '12px', color: '#e6a817',
    }).setInteractive({ useHandCursor: true });
    diffBtn.on('pointerdown', () => {
      this.difficulty = (this.difficulty % 3) + 1;
      diffBtn.setText(`难度: ${this.difficulty}`);
    });
  }

  private createActionButtons(): void {
    const px = 20;
    const py = 500;

    const exportBtn = this.add.text(px, py, '导出JSON', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#4ade80',
    }).setInteractive({ useHandCursor: true });
    exportBtn.on('pointerdown', () => this.exportLevel());
    exportBtn.on('pointerover', () => exportBtn.setScale(1.1));
    exportBtn.on('pointerout', () => exportBtn.setScale(1));

    const clearBtn = this.add.text(px, py + 30, '清空画布', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#ef4444',
    }).setInteractive({ useHandCursor: true });
    clearBtn.on('pointerdown', () => this.clearGrid());

    const backBtn = this.add.text(px, py + 70, '返回主菜单', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#9ca3af',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
    }
  }

  private initGrid(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const isEdge = x === 0 || y === 0 || x === this.gridWidth - 1 || y === this.gridHeight - 1;
        const type = isEdge ? 'wall' : 'floor';
        this.tiles.set(`${x},${y}`, { x, y, type });
        this.renderTile(x, y, type);
      }
    }
  }

  private renderTile(gx: number, gy: number, type: string): void {
    const key = `tile_${gx}_${gy}`;
    const existing = this.tileSprites.get(key);
    if (existing) existing.destroy();

    const color = this.getTileColor(type);
    const sprite = this.add.rectangle(
      this.offsetX + gx * TILE_SIZE + TILE_SIZE / 2,
      this.offsetY + gy * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE - 1,
      TILE_SIZE - 1,
      color
    );
    sprite.setStrokeStyle(1, 0x0a0a1a, 0.3);
    this.tileSprites.set(key, sprite);
  }

  private getTileColor(type: string): number {
    switch (type) {
      case 'floor': return COLORS.floor;
      case 'wall': return COLORS.wall;
      case 'shelf_slot': return COLORS.shelfSlot;
      case 'index_stand': return COLORS.indexCard;
      default: return COLORS.floor;
    }
  }

  private setupInput(): void {
    const gridArea = this.add.rectangle(
      this.offsetX + (this.gridWidth * TILE_SIZE) / 2,
      this.offsetY + (this.gridHeight * TILE_SIZE) / 2,
      this.gridWidth * TILE_SIZE,
      this.gridHeight * TILE_SIZE,
      0xffffff, 0
    );
    gridArea.setInteractive();
    gridArea.setDepth(1);

    gridArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleGridClick(pointer.x, pointer.y);
    });
    gridArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.handleGridClick(pointer.x, pointer.y);
    });
  }

  private handleGridClick(wx: number, wy: number): void {
    const gx = Math.floor((wx - this.offsetX) / TILE_SIZE);
    const gy = Math.floor((wy - this.offsetY) / TILE_SIZE);

    if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) return;

    const tileTypes: EditorTool[] = ['wall', 'floor', 'shelf_slot', 'index_stand'];
    const entityTypes: EditorTool[] = ['bookshelf', 'book', 'clue_item'];

    if (tileTypes.includes(this.currentTool)) {
      this.tiles.set(`${gx},${gy}`, { x: gx, y: gy, type: this.currentTool as any });
      this.renderTile(gx, gy, this.currentTool);
      this.removeEntityAt(gx, gy);
    } else if (entityTypes.includes(this.currentTool)) {
      this.removeEntityAt(gx, gy);
      const entity: EntityData = {
        x: gx, y: gy,
        type: this.currentTool as any,
        bookId: `${this.currentTool}_${gx}_${gy}`,
        isMisplaced: this.currentTool === 'book',
        targetX: gx,
        targetY: gy,
      };
      this.entities.push(entity);
      this.renderEntity(entity);
    } else if (this.currentTool === 'player') {
      this.playerStart = { x: gx, y: gy };
      this.renderPlayer(gx, gy);
    } else if (this.currentTool === 'eraser') {
      this.tiles.set(`${gx},${gy}`, { x: gx, y: gy, type: 'floor' });
      this.renderTile(gx, gy, 'floor');
      this.removeEntityAt(gx, gy);
    }
  }

  private renderEntity(entity: EntityData): void {
    const key = `entity_${entity.x}_${entity.y}`;
    const existing = this.entitySprites.get(key);
    if (existing) existing.destroy();

    const worldX = this.offsetX + entity.x * TILE_SIZE + TILE_SIZE / 2;
    const worldY = this.offsetY + entity.y * TILE_SIZE + TILE_SIZE / 2;
    const container = this.add.container(worldX, worldY);

    let color = 0xe6a817;
    if (entity.type === 'bookshelf') color = COLORS.bookshelf;
    if (entity.type === 'clue_item') color = COLORS.clue;

    const rect = this.add.rectangle(0, 0, TILE_SIZE - 8, TILE_SIZE - 8, color, 0.9);
    const label = this.add.text(0, 0, entity.type === 'bookshelf' ? '架' : entity.type === 'book' ? '书' : '?', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    container.add([rect, label]);
    this.entitySprites.set(key, container);
  }

  private renderPlayer(gx: number, gy: number): void {
    if (this.playerSprite) this.playerSprite.destroy();
    const worldX = this.offsetX + gx * TILE_SIZE + TILE_SIZE / 2;
    const worldY = this.offsetY + gy * TILE_SIZE + TILE_SIZE / 2;
    this.playerSprite = this.add.container(worldX, worldY);
    const circle = this.add.circle(0, 0, 16, COLORS.player);
    const label = this.add.text(0, 0, 'P', { fontSize: '14px', color: '#fff', fontFamily: 'sans-serif' }).setOrigin(0.5);
    this.playerSprite!.add([circle, label]);
  }

  private removeEntityAt(gx: number, gy: number): void {
    const key = `entity_${gx}_${gy}`;
    const existing = this.entitySprites.get(key);
    if (existing) { existing.destroy(); this.entitySprites.delete(key); }
    this.entities = this.entities.filter(e => !(e.x === gx && e.y === gy));
  }

  private updateToolSelection(): void {
    const btn = this.toolButtons.get(this.currentTool);
    if (btn) {
      this.selectedToolIndicator.y = btn.y - 4;
    }
    this.toolButtons.forEach((b, tool) => {
      b.setColor(tool === this.currentTool ? '#e6a817' : '#f0e6d3');
    });
  }

  private exportLevel(): void {
    const levelData: LevelData = {
      id: 'custom_level',
      name: this.levelName,
      width: this.gridWidth,
      height: this.gridHeight,
      maxSteps: this.maxSteps,
      difficulty: this.difficulty,
      tiles: Array.from(this.tiles.values()),
      entities: this.entities,
      clues: this.entities.filter(e => e.type === 'clue_item').map((e, i) => ({
        id: `clue_${i}`,
        text: `线索 ${i + 1}`,
        bookId: e.bookId || '',
        x: e.x,
        y: e.y,
      })),
      playerStart: this.playerStart,
    };

    const json = JSON.stringify(levelData, null, 2);

    try {
      navigator.clipboard.writeText(json);
      const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'JSON 已复制到剪贴板！', {
        fontSize: '14px', fontFamily: 'sans-serif', color: '#4ade80',
      }).setOrigin(0.5);
      this.time.delayedCall(2000, () => msg.destroy());
    } catch {
      console.log('Level JSON:', json);
      const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '请查看控制台输出', {
        fontSize: '14px', fontFamily: 'sans-serif', color: '#fbbf24',
      }).setOrigin(0.5);
      this.time.delayedCall(2000, () => msg.destroy());
    }
  }

  private clearGrid(): void {
    this.entities = [];
    this.entitySprites.forEach(s => s.destroy());
    this.entitySprites.clear();
    if (this.playerSprite) { this.playerSprite.destroy(); this.playerSprite = null; }
    this.initGrid();
  }
}
