import Phaser from 'phaser';
import { GameConfig, TileType, EntityType, LevelData, Vec2 } from '@/config/GameConfig';
import { validateLevelData } from '@/config/levels';

const STORAGE_KEY = 'editor_custom_levels';

type BrushCategory = 'tile' | 'entity' | 'erase';
type TileBrush = 'WALL' | 'FLOOR' | 'TARGET' | 'CARD_SLOT' | 'EXIT';
type EntityBrush = 'Player' | 'Shelf' | 'Book' | 'Clue' | 'IndexCard';

interface EditorState {
  level: LevelData;
  history: LevelData[];
  redoStack: LevelData[];
}

interface SelectedEntity {
  type: EntityType;
  index: number;
}

const TILE_BRUSH_MAP: Record<TileBrush, TileType> = {
  WALL: TileType.WALL,
  FLOOR: TileType.FLOOR,
  TARGET: TileType.TARGET_ZONE,
  CARD_SLOT: TileType.CARD_SLOT,
  EXIT: TileType.EXIT,
};

const BRUSH_COLORS: Record<string, number> = {
  WALL: GameConfig.Colors.WALL,
  FLOOR: GameConfig.Colors.BG_FLOOR,
  TARGET: GameConfig.Colors.TARGET,
  CARD_SLOT: GameConfig.Colors.CARD,
  EXIT: GameConfig.Colors.SUCCESS,
  Player: GameConfig.Colors.PLAYER,
  Shelf: GameConfig.Colors.SHELF,
  Book: GameConfig.Colors.BOOK,
  Clue: GameConfig.Colors.CLUE,
  IndexCard: GameConfig.Colors.CARD,
  erase: 0xff6b6b,
};

export class EditorScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private entityGraphics!: Phaser.GameObjects.Graphics;
  private toolbarContainer!: Phaser.GameObjects.Container;
  private rightPanelContainer!: Phaser.GameObjects.Container;
  private topMenuContainer!: Phaser.GameObjects.Container;
  private coordTexts: Phaser.GameObjects.Text[] = [];
  private rightPanelInputs: Map<string, HTMLInputElement | HTMLTextAreaElement> = new Map();

  private state!: EditorState;
  private currentBrush: { category: BrushCategory; tile?: TileBrush; entity?: EntityBrush } = {
    category: 'tile',
    tile: 'WALL',
  };
  private selectedEntity: SelectedEntity | null = null;
  private showCoords: boolean = false;
  private isDrawing: boolean = false;

  private gridOriginX = 220;
  private gridOriginY = 100;

  constructor() {
    super({ key: 'editor' });
  }

  init(): void {
    this.state = {
      level: this.createEmptyLevel(),
      history: [],
      redoStack: [],
    };
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0f0d1a);
    this.gridOriginX = 220;
    this.gridOriginY = 100;

    this.createTopMenu();
    this.createToolbar();
    this.createRightPanel();
    this.createGrid();
    this.setupGridInput();
    this.setupKeyboard();
    this.renderAll();
  }

  private createEmptyLevel(): LevelData {
    const grid: number[][] = [];
    for (let r = 0; r < GameConfig.GRID_ROWS; r++) {
      const row: number[] = [];
      for (let c = 0; c < GameConfig.GRID_COLS; c++) {
        if (r === 0 || r === GameConfig.GRID_ROWS - 1 || c === 0 || c === GameConfig.GRID_COLS - 1) {
          row.push(TileType.WALL);
        } else {
          row.push(TileType.FLOOR);
        }
      }
      grid.push(row);
    }
    return {
      id: 1,
      name: '自定义关卡',
      description: '描述信息...',
      maxSteps: 50,
      starThresholds: [45, 35, 25],
      grid,
      playerStart: { x: 1, y: 1 },
      shelves: [],
      books: [],
      clues: [],
      indexCards: [],
      targetZones: [],
    };
  }

  private createTopMenu(): void {
    this.topMenuContainer = this.add.container(0, 0);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1726, 1);
    bg.fillRect(0, 0, this.scale.width, 60);
    bg.lineStyle(1, 0x8b7cff, 1);
    bg.strokeRect(0, 0, this.scale.width, 60);
    this.topMenuContainer.add(bg);

    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '12px',
      color: '#0a0818',
      backgroundColor: '#8b7cff',
      padding: { x: 10, y: 6 },
    };

    const makeBtn = (label: string, x: number, onClick: () => void) => {
      const b = this.add.text(x, 18, label, btnStyle).setInteractive({ useHandCursor: true });
      b.on('pointerdown', onClick);
      b.on('pointerover', () => b.setBackgroundColor('#a89cff'));
      b.on('pointerout', () => b.setBackgroundColor('#8b7cff'));
      this.topMenuContainer.add(b);
      return b;
    };

    let x = 16;
    makeBtn('新建', x, () => this.newLevel()); x += 80;
    makeBtn('加载', x, () => this.loadLevelsDialog()); x += 80;
    makeBtn('保存', x, () => this.saveToStorage()); x += 80;
    makeBtn('导出JSON', x, () => this.exportJSON()); x += 110;
    makeBtn('验证', x, () => this.validateLevel()); x += 70;
    makeBtn('测试', x, () => this.testLevel()); x += 70;
    makeBtn('坐标', x, () => this.toggleCoords()); x += 70;
    makeBtn('撤销', x, () => this.undo()); x += 70;
    makeBtn('重做', x, () => this.redo()); x += 70;
    makeBtn('返回', x, () => this.scene.start('menu'));
  }

  private createToolbar(): void {
    this.toolbarContainer = this.add.container(0, 60);
    const bg = this.add.graphics();
    bg.fillStyle(0x14111f, 1);
    bg.fillRect(0, 0, 200, this.scale.height - 60);
    bg.lineStyle(1, 0x2d2845, 1);
    bg.strokeRect(0, 0, 200, this.scale.height - 60);
    this.toolbarContainer.add(bg);

    let y = 16;
    const addTitle = (text: string) => {
      const t = this.add.text(16, y, text, {
        fontSize: '14px',
        color: '#8b7cff',
        fontStyle: 'bold',
      });
      this.toolbarContainer.add(t);
      y += 24;
    };

    const addBrushBtn = (label: string, onClick: () => void, colorKey: string) => {
      const container = this.add.container(16, y);
      const color = BRUSH_COLORS[colorKey] || 0x8b7cff;
      const swatch = this.add.graphics();
      swatch.fillStyle(color, 1);
      swatch.fillRect(0, 0, 18, 18);
      swatch.lineStyle(1, 0x2d2845, 1);
      swatch.strokeRect(0, 0, 18, 18);
      container.add(swatch);

      const btn = this.add.text(26, 1, label, {
        fontSize: '12px',
        color: '#e8e6f0',
      }).setInteractive({ useHandCursor: true });
      container.add(btn);

      const highlight = this.add.graphics();
      container.add(highlight);
      (container as any).updateHighlight = (active: boolean) => {
        highlight.clear();
        if (active) {
          highlight.lineStyle(2, 0xffb347, 1);
          highlight.strokeRect(-2, -2, 170, 22);
        }
      };

      btn.on('pointerdown', () => {
        onClick();
        this.updateToolbarHighlights();
      });
      swatch.setInteractive({ useHandCursor: true });
      swatch.on('pointerdown', () => {
        onClick();
        this.updateToolbarHighlights();
      });

      this.toolbarContainer.add(container);
      (container as any)._brushKey = colorKey + '_' + label;
      y += 28;
      return container;
    };

    addTitle('画笔 (格子)');
    (this as any)._tileBtns = [
      addBrushBtn('WALL 墙', () => this.setBrush('tile', 'WALL'), 'WALL'),
      addBrushBtn('FLOOR 地板', () => this.setBrush('tile', 'FLOOR'), 'FLOOR'),
      addBrushBtn('TARGET 目标区', () => this.setBrush('tile', 'TARGET'), 'TARGET'),
      addBrushBtn('CARD_SLOT 卡槽', () => this.setBrush('tile', 'CARD_SLOT'), 'CARD_SLOT'),
      addBrushBtn('EXIT 出口', () => this.setBrush('tile', 'EXIT'), 'EXIT'),
    ];
    y += 12;

    addTitle('实体');
    (this as any)._entityBtns = [
      addBrushBtn('Player 玩家', () => this.setBrush('entity', undefined, 'Player'), 'Player'),
      addBrushBtn('Shelf 书架', () => this.setBrush('entity', undefined, 'Shelf'), 'Shelf'),
      addBrushBtn('Book 书', () => this.setBrush('entity', undefined, 'Book'), 'Book'),
      addBrushBtn('Clue 线索', () => this.setBrush('entity', undefined, 'Clue'), 'Clue'),
      addBrushBtn('IndexCard 索引卡', () => this.setBrush('entity', undefined, 'IndexCard'), 'IndexCard'),
    ];
    y += 12;

    addTitle('操作');
    (this as any)._eraseBtn = addBrushBtn('擦除实体', () => {
      this.currentBrush = { category: 'erase' };
      this.selectedEntity = null;
      this.updateRightPanel();
    }, 'erase');

    this.updateToolbarHighlights();
  }

  private updateToolbarHighlights(): void {
    const all = [
      ...((this as any)._tileBtns || []),
      ...((this as any)._entityBtns || []),
      (this as any)._eraseBtn,
    ];
    all.forEach((c: any) => c.updateHighlight(false));

    if (this.currentBrush.category === 'tile' && this.currentBrush.tile) {
      const idx = (['WALL', 'FLOOR', 'TARGET', 'CARD_SLOT', 'EXIT'] as TileBrush[]).indexOf(this.currentBrush.tile);
      if (idx >= 0 && (this as any)._tileBtns[idx]) (this as any)._tileBtns[idx].updateHighlight(true);
    } else if (this.currentBrush.category === 'entity' && this.currentBrush.entity) {
      const idx = (['Player', 'Shelf', 'Book', 'Clue', 'IndexCard'] as EntityBrush[]).indexOf(this.currentBrush.entity);
      if (idx >= 0 && (this as any)._entityBtns[idx]) (this as any)._entityBtns[idx].updateHighlight(true);
    } else if (this.currentBrush.category === 'erase') {
      if ((this as any)._eraseBtn) (this as any)._eraseBtn.updateHighlight(true);
    }
  }

  private setBrush(category: BrushCategory, tile?: TileBrush, entity?: EntityBrush): void {
    if (category === 'tile' && tile) {
      this.currentBrush = { category, tile };
    } else if (category === 'entity' && entity) {
      this.currentBrush = { category, entity };
    }
    this.selectedEntity = null;
    this.updateRightPanel();
  }

  private createRightPanel(): void {
    const panelX = this.gridOriginX + GameConfig.GRID_COLS * GameConfig.TILE_SIZE + 20;
    this.rightPanelContainer = this.add.container(panelX, 60);
    const panelW = this.scale.width - panelX;
    const panelH = this.scale.height - 60;

    const bg = this.add.graphics();
    bg.fillStyle(0x14111f, 1);
    bg.fillRect(0, 0, panelW, panelH);
    bg.lineStyle(1, 0x2d2845, 1);
    bg.strokeRect(0, 0, panelW, panelH);
    this.rightPanelContainer.add(bg);

    this.addRightPanelTitle(12, 12, '关卡设置', '#8b7cff');
    let y = 36;
    y = this.addRightPanelInput(12, y, '关卡ID', 'level_id', 'number', '1');
    y = this.addRightPanelInput(12, y, '名称', 'level_name', 'text', '自定义关卡');
    y = this.addRightPanelTextarea(12, y, '描述', 'level_desc', '描述信息...', 3);
    y = this.addRightPanelInput(12, y, '最大步数', 'level_maxSteps', 'number', '50');

    const starLabel = this.add.text(12, y + 4, '三星阈值:', { fontSize: '11px', color: '#8a85a0' });
    this.rightPanelContainer.add(starLabel);
    y += 22;
    y = this.addRightPanelInput(12, y, '3星', 'star_3', 'number', '45', 60);
    y = this.addRightPanelInput(90, y - 24, '2星', 'star_2', 'number', '35', 60);
    y = this.addRightPanelInput(168, y - 48, '1星', 'star_1', 'number', '25', 60);

    y += 12;
    this.addRightPanelTitle(12, y, '选中实体属性', '#ffb347');
    y += 24;
    this.updateRightPanel();
  }

  private addRightPanelTitle(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontSize: '13px',
      color,
      fontStyle: 'bold',
    });
    this.rightPanelContainer.add(t);
  }

  private addRightPanelInput(x: number, y: number, label: string, key: string, type: string, value: string, width: number = 200): number {
    const lbl = this.add.text(x, y + 4, label + ':', { fontSize: '11px', color: '#8a85a0' });
    this.rightPanelContainer.add(lbl);

    const el = document.createElement('input');
    el.type = type;
    el.value = value;
    el.style.position = 'absolute';
    el.style.left = (x + this.gridOriginX + GameConfig.GRID_COLS * GameConfig.TILE_SIZE + 20 + 72) + 'px';
    el.style.top = (y + 60 + 2) + 'px';
    el.style.width = width + 'px';
    el.style.padding = '3px 6px';
    el.style.fontSize = '12px';
    el.style.backgroundColor = '#1a1726';
    el.style.color = '#e8e6f0';
    el.style.border = '1px solid #8b7cff';
    el.style.borderRadius = '3px';
    el.style.outline = 'none';
    document.body.appendChild(el);
    this.rightPanelInputs.set(key, el);

    el.addEventListener('input', () => this.syncLevelFromInputs());
    return y + 26;
  }

  private addRightPanelTextarea(x: number, y: number, label: string, key: string, value: string, rows: number): number {
    const lbl = this.add.text(x, y + 4, label + ':', { fontSize: '11px', color: '#8a85a0' });
    this.rightPanelContainer.add(lbl);

    const el = document.createElement('textarea');
    el.value = value;
    el.rows = rows;
    el.style.position = 'absolute';
    el.style.left = (x + this.gridOriginX + GameConfig.GRID_COLS * GameConfig.TILE_SIZE + 20 + 72) + 'px';
    el.style.top = (y + 60 + 2) + 'px';
    el.style.width = '200px';
    el.style.padding = '3px 6px';
    el.style.fontSize = '12px';
    el.style.fontFamily = 'sans-serif';
    el.style.backgroundColor = '#1a1726';
    el.style.color = '#e8e6f0';
    el.style.border = '1px solid #8b7cff';
    el.style.borderRadius = '3px';
    el.style.outline = 'none';
    el.style.resize = 'vertical';
    document.body.appendChild(el);
    this.rightPanelInputs.set(key, el);

    el.addEventListener('input', () => this.syncLevelFromInputs());
    return y + 24 * rows + 6;
  }

  private syncLevelFromInputs(): void {
    const lvl = this.state.level;
    const get = (k: string) => this.rightPanelInputs.get(k)?.value ?? '';
    const getNum = (k: string, def: number) => {
      const n = parseInt(get(k));
      return isNaN(n) ? def : n;
    };

    lvl.id = getNum('level_id', lvl.id);
    lvl.name = get('level_name') || lvl.name;
    lvl.description = get('level_desc') || lvl.description;
    lvl.maxSteps = getNum('level_maxSteps', lvl.maxSteps);
    lvl.starThresholds = [
      getNum('star_3', lvl.starThresholds[0]),
      getNum('star_2', lvl.starThresholds[1]),
      getNum('star_1', lvl.starThresholds[2]),
    ];

    if (this.selectedEntity) {
      const { type, index } = this.selectedEntity;
      if (type === EntityType.SHELF) {
        const s = lvl.shelves[index];
        if (s) s.targetZoneId = get('ent_targetZoneId') || undefined;
      } else if (type === EntityType.BOOK) {
        const b = lvl.books[index];
        if (b) {
          b.category = get('ent_category') || b.category;
          b.title = get('ent_title') || b.title;
          b.isWrongPlace = (document.getElementById('ent_isWrongPlace') as HTMLInputElement)?.checked ?? false;
        }
      } else if (type === EntityType.CLUE) {
        const c = lvl.clues[index];
        if (c) c.text = get('ent_text') || c.text;
      } else if (type === EntityType.INDEX_CARD) {
        const ic = lvl.indexCards[index];
        if (ic) ic.category = get('ent_category') || ic.category;
      }
    }
  }

  private updateRightPanel(): void {
    const lvl = this.state.level;
    const set = (k: string, v: string) => {
      const el = this.rightPanelInputs.get(k);
      if (el && el !== document.activeElement) el.value = v;
    };

    set('level_id', String(lvl.id));
    set('level_name', lvl.name);
    set('level_desc', lvl.description);
    set('level_maxSteps', String(lvl.maxSteps));
    set('star_3', String(lvl.starThresholds[0]));
    set('star_2', String(lvl.starThresholds[1]));
    set('star_1', String(lvl.starThresholds[2]));

    document.querySelectorAll('.ent-prop-el').forEach((el) => el.remove());

    if (!this.selectedEntity) return;
    const { type, index } = this.selectedEntity;

    const baseX = this.gridOriginX + GameConfig.GRID_COLS * GameConfig.TILE_SIZE + 20;
    const baseY = 60;
    let y = 340;

    const addEntInput = (label: string, key: string, value: string, isTextarea = false) => {
      const lbl = document.createElement('div');
      lbl.className = 'ent-prop-el';
      lbl.textContent = label + ':';
      lbl.style.position = 'absolute';
      lbl.style.left = (baseX + 12) + 'px';
      lbl.style.top = (baseY + y + 4) + 'px';
      lbl.style.fontSize = '11px';
      lbl.style.color = '#8a85a0';
      document.body.appendChild(lbl);

      const el = isTextarea ? document.createElement('textarea') : document.createElement('input');
      el.className = 'ent-prop-el';
      if (!isTextarea) (el as HTMLInputElement).type = 'text';
      else (el as HTMLTextAreaElement).rows = 2;
      el.id = key;
      el.value = value;
      el.style.position = 'absolute';
      el.style.left = (baseX + 12 + 72) + 'px';
      el.style.top = (baseY + y + 2) + 'px';
      el.style.width = '200px';
      el.style.padding = '3px 6px';
      el.style.fontSize = '12px';
      el.style.fontFamily = 'sans-serif';
      el.style.backgroundColor = '#1a1726';
      el.style.color = '#e8e6f0';
      el.style.border = '1px solid #ffb347';
      el.style.borderRadius = '3px';
      el.style.outline = 'none';
      if (isTextarea) el.style.resize = 'vertical';
      document.body.appendChild(el);
      el.addEventListener('input', () => this.syncLevelFromInputs());
      this.rightPanelInputs.set(key, el);
      y += isTextarea ? 52 : 26;
    };

    const addEntCheckbox = (label: string, key: string, checked: boolean) => {
      const lbl = document.createElement('label');
      lbl.className = 'ent-prop-el';
      lbl.textContent = label;
      lbl.style.position = 'absolute';
      lbl.style.left = (baseX + 12) + 'px';
      lbl.style.top = (baseY + y + 4) + 'px';
      lbl.style.fontSize = '11px';
      lbl.style.color = '#e8e6f0';
      lbl.style.display = 'inline-flex';
      lbl.style.alignItems = 'center';
      lbl.style.gap = '6px';
      document.body.appendChild(lbl);

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = key;
      cb.checked = checked;
      cb.className = 'ent-prop-el';
      cb.addEventListener('change', () => this.syncLevelFromInputs());
      lbl.insertBefore(cb, lbl.firstChild);
      y += 26;
    };

    const typeLabel = this.add.text(12, y - 12, `类型: ${type} [${index}]`, {
      fontSize: '11px',
      color: '#ffb347',
    });
    const g = this.add.graphics();
    this.rightPanelContainer.add(g);
    this.rightPanelContainer.add(typeLabel);
    g.setVisible(false);
    (this.rightPanelContainer as any)._entPropsCleanup = () => {
      typeLabel.destroy();
      g.destroy();
    };
    if ((this.rightPanelContainer as any)._prevEntCleanup) {
      (this.rightPanelContainer as any)._prevEntCleanup();
    }
    (this.rightPanelContainer as any)._prevEntCleanup = (this.rightPanelContainer as any)._entPropsCleanup;
    y += 12;

    if (type === EntityType.SHELF) {
      const s = lvl.shelves[index];
      if (s) addEntInput('targetZoneId', 'ent_targetZoneId', s.targetZoneId || '');
    } else if (type === EntityType.BOOK) {
      const b = lvl.books[index];
      if (b) {
        addEntInput('category', 'ent_category', b.category);
        addEntInput('title', 'ent_title', b.title);
        addEntCheckbox('isWrongPlace (错放)', 'ent_isWrongPlace', b.isWrongPlace || false);
      }
    } else if (type === EntityType.CLUE) {
      const c = lvl.clues[index];
      if (c) addEntInput('text', 'ent_text', c.text, true);
    } else if (type === EntityType.INDEX_CARD) {
      const ic = lvl.indexCards[index];
      if (ic) addEntInput('category', 'ent_category', ic.category);
    }
  }

  private createGrid(): void {
    this.gridGraphics = this.add.graphics();
    this.entityGraphics = this.add.graphics();
  }

  private setupGridInput(): void {
    const gw = GameConfig.GRID_COLS * GameConfig.TILE_SIZE;
    const gh = GameConfig.GRID_ROWS * GameConfig.TILE_SIZE;
    const zone = this.add.zone(
      this.gridOriginX + gw / 2,
      this.gridOriginY + gh / 2,
      gw,
      gh
    ).setInteractive();

    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.isDrawing = true;
      this.handleGridClick(p);
    });
    zone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.isDrawing && p.leftButtonDown()) {
        this.handleGridClick(p);
      }
    });
    this.input.on('pointerup', () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.pushHistory();
      }
    });
  }

  private handleGridClick(pointer: Phaser.Input.Pointer): void {
    const gx = Math.floor((pointer.x - this.gridOriginX) / GameConfig.TILE_SIZE);
    const gy = Math.floor((pointer.y - this.gridOriginY) / GameConfig.TILE_SIZE);
    if (gx < 0 || gx >= GameConfig.GRID_COLS || gy < 0 || gy >= GameConfig.GRID_ROWS) return;
    this.applyBrush(gx, gy);
    this.renderAll();
    this.updateRightPanel();
  }

  private applyBrush(gx: number, gy: number): void {
    const lvl = this.state.level;
    const pos: Vec2 = { x: gx, y: gy };

    if (this.currentBrush.category === 'tile' && this.currentBrush.tile) {
      const tileType = TILE_BRUSH_MAP[this.currentBrush.tile];
      lvl.grid[gy][gx] = tileType;

      if (tileType === TileType.TARGET_ZONE) {
        if (!lvl.targetZones.find((t: { pos: Vec2; id: string; category?: string }) => t.pos.x === gx && t.pos.y === gy)) {
          lvl.targetZones.push({
            pos: { ...pos },
            id: `t_${gx}_${gy}`,
          });
        }
      } else {
        lvl.targetZones = lvl.targetZones.filter((t: { pos: Vec2 }) => !(t.pos.x === gx && t.pos.y === gy));
      }
    } else if (this.currentBrush.category === 'entity' && this.currentBrush.entity) {
      const ent = this.currentBrush.entity;
      this.removeEntityAt(gx, gy);

      if (ent === 'Player') {
        lvl.playerStart = { ...pos };
      } else if (ent === 'Shelf') {
        lvl.shelves.push({
          pos: { ...pos },
          id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        });
      } else if (ent === 'Book') {
        lvl.books.push({
          pos: { ...pos },
          id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          category: '未分类',
          title: '新书',
        });
      } else if (ent === 'Clue') {
        lvl.clues.push({
          pos: { ...pos },
          id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: '新线索...',
        });
      } else if (ent === 'IndexCard') {
        lvl.indexCards.push({
          pos: { ...pos },
          id: `ic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          category: '未分类',
        });
      }
    } else if (this.currentBrush.category === 'erase') {
      const erased = this.removeEntityAt(gx, gy);
      if (erased) {
        this.selectedEntity = null;
      }
    }
  }

  private removeEntityAt(gx: number, gy: number): boolean {
    const lvl = this.state.level;
    const findIdx = <T extends { pos: Vec2 }>(arr: T[]) => arr.findIndex(e => e.pos.x === gx && e.pos.y === gy);

    const si = findIdx(lvl.shelves);
    if (si >= 0) { lvl.shelves.splice(si, 1); return true; }
    const bi = findIdx(lvl.books);
    if (bi >= 0) { lvl.books.splice(bi, 1); return true; }
    const ci = findIdx(lvl.clues);
    if (ci >= 0) { lvl.clues.splice(ci, 1); return true; }
    const ii = findIdx(lvl.indexCards);
    if (ii >= 0) { lvl.indexCards.splice(ii, 1); return true; }
    return false;
  }

  private setupKeyboard(): void {
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        this.redo();
      } else if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveToStorage();
      }
    });
  }

  private pushHistory(): void {
    const snapshot = JSON.parse(JSON.stringify(this.state.level)) as LevelData;
    this.state.history.push(snapshot);
    if (this.state.history.length > 100) this.state.history.shift();
    this.state.redoStack = [];
  }

  private undo(): void {
    if (this.state.history.length === 0) return;
    const current = JSON.parse(JSON.stringify(this.state.level)) as LevelData;
    this.state.redoStack.push(current);
    const prev = this.state.history.pop()!;
    this.state.level = prev;
    this.selectedEntity = null;
    this.renderAll();
    this.updateRightPanel();
  }

  private redo(): void {
    if (this.state.redoStack.length === 0) return;
    const current = JSON.parse(JSON.stringify(this.state.level)) as LevelData;
    this.state.history.push(current);
    const next = this.state.redoStack.pop()!;
    this.state.level = next;
    this.selectedEntity = null;
    this.renderAll();
    this.updateRightPanel();
  }

  private toggleCoords(): void {
    this.showCoords = !this.showCoords;
    this.renderAll();
  }

  private newLevel(): void {
    if (confirm('新建关卡？当前未保存的修改将丢失。')) {
      this.state.level = this.createEmptyLevel();
      this.state.history = [];
      this.state.redoStack = [];
      this.selectedEntity = null;
      this.renderAll();
      this.updateRightPanel();
    }
  }

  private saveToStorage(): void {
    try {
      let arr: LevelData[] = [];
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try { arr = JSON.parse(raw); } catch { arr = []; }
      }
      const existingIdx = arr.findIndex(l => l.id === this.state.level.id);
      const toSave = JSON.parse(JSON.stringify(this.state.level)) as LevelData;
      if (existingIdx >= 0) {
        arr[existingIdx] = toSave;
      } else {
        arr.push(toSave);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      this.showToast(`已保存: ${toSave.name} (共${arr.length}关)`);
    } catch (e) {
      this.showToast('保存失败: ' + (e as Error).message, true);
    }
  }

  private loadLevelsDialog(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { this.showToast('没有已保存的关卡', true); return; }
      const arr: LevelData[] = JSON.parse(raw);
      if (arr.length === 0) { this.showToast('没有已保存的关卡', true); return; }

      const menu = arr.map((l, i) => `${i + 1}. [${l.id}] ${l.name}`).join('\n');
      const input = prompt(`选择要加载的关卡 (输入编号):\n\n${menu}\n\n或输入 'clear' 清除所有`, '1');
      if (!input) return;
      if (input.toLowerCase() === 'clear') {
        if (confirm('确定清除所有已保存的自定义关卡？')) {
          localStorage.removeItem(STORAGE_KEY);
          this.showToast('已清除');
        }
        return;
      }
      const n = parseInt(input);
      if (isNaN(n) || n < 1 || n > arr.length) {
        this.showToast('无效编号', true);
        return;
      }
      this.state.level = JSON.parse(JSON.stringify(arr[n - 1]));
      this.state.history = [];
      this.state.redoStack = [];
      this.selectedEntity = null;
      this.renderAll();
      this.updateRightPanel();
      this.showToast(`已加载: ${arr[n - 1].name}`);
    } catch (e) {
      this.showToast('加载失败: ' + (e as Error).message, true);
    }
  }

  private exportJSON(): void {
    const json = JSON.stringify(this.state.level, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level_${this.state.level.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('已导出 JSON');
  }

  private validateLevel(): void {
    const result = validateLevelData(this.state.level);
    if (result.valid) {
      if (result.warnings && result.warnings.length > 0) {
        alert('✓ 验证通过，存在 ' + result.warnings.length + ' 个警告:\n\n'
          + result.warnings.map((w: string, i: number) => `${i + 1}. ${w}`).join('\n'));
      } else {
        this.showToast('✓ 验证通过! 关卡有效');
      }
    } else {
      alert('关卡验证失败:\n\n' + result.errors.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n'));
    }
  }

  private testLevel(): void {
    const result = validateLevelData(this.state.level);
    if (!result.valid) {
      if (!confirm('关卡未通过验证，仍要测试吗？\n' + result.errors[0])) return;
    }
    this.scene.start('game', { levelData: this.state.level, fromEditor: true });
  }

  private showToast(msg: string, isError = false): void {
    const toast = this.add.text(
      this.scale.width / 2,
      80,
      msg,
      {
        fontSize: '14px',
        color: isError ? '#ff6b6b' : '#6bff9a',
        backgroundColor: 'rgba(10,8,24,0.95)',
        padding: { x: 16, y: 8 },
      }
    ).setOrigin(0.5).setDepth(20000);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 2500,
      delay: 1500,
      onComplete: () => toast.destroy(),
    });
  }

  private renderAll(): void {
    this.renderGrid();
    this.renderEntities();
    this.renderCoords();
  }

  private renderGrid(): void {
    this.gridGraphics.clear();
    const TS = GameConfig.TILE_SIZE;
    const lvl = this.state.level;

    for (let r = 0; r < GameConfig.GRID_ROWS; r++) {
      for (let c = 0; c < GameConfig.GRID_COLS; c++) {
        const x = this.gridOriginX + c * TS;
        const y = this.gridOriginY + r * TS;
        const tile = lvl.grid[r][c];

        let fillColor = GameConfig.Colors.BG_FLOOR;
        if (tile === TileType.WALL) fillColor = GameConfig.Colors.WALL;
        else if (tile === TileType.FLOOR) fillColor = (r + c) % 2 === 0 ? GameConfig.Colors.BG_FLOOR : GameConfig.Colors.BG_FLOOR_ALT;
        else if (tile === TileType.TARGET_ZONE) fillColor = GameConfig.Colors.TARGET;
        else if (tile === TileType.CARD_SLOT) fillColor = GameConfig.Colors.CARD;
        else if (tile === TileType.EXIT) fillColor = GameConfig.Colors.SUCCESS;

        this.gridGraphics.fillStyle(fillColor, tile === TileType.TARGET_ZONE ? 0.5 : 1);
        this.gridGraphics.fillRect(x, y, TS, TS);
        this.gridGraphics.lineStyle(1, 0x2d2845, 0.6);
        this.gridGraphics.strokeRect(x, y, TS, TS);

        if (tile === TileType.CARD_SLOT) {
          this.gridGraphics.lineStyle(2, 0x8b7cff, 1);
          this.gridGraphics.strokeRect(x + 6, y + 6, TS - 12, TS - 12);
        }
        if (tile === TileType.EXIT) {
          this.gridGraphics.lineStyle(2, GameConfig.Colors.SUCCESS, 1);
          this.gridGraphics.strokeRect(x + 4, y + 4, TS - 8, TS - 8);
        }
      }
    }
  }

  private renderEntities(): void {
    this.entityGraphics.clear();
    const TS = GameConfig.TILE_SIZE;
    const lvl = this.state.level;
    const drawRect = (gx: number, gy: number, color: number, pad: number = 4) => {
      const x = this.gridOriginX + gx * TS + pad;
      const y = this.gridOriginY + gy * TS + pad;
      const s = TS - pad * 2;
      this.entityGraphics.fillStyle(color, 1);
      this.entityGraphics.fillRect(x, y, s, s);
      this.entityGraphics.lineStyle(2, 0x000000, 0.5);
      this.entityGraphics.strokeRect(x, y, s, s);
    };
    const drawCircle = (gx: number, gy: number, color: number, radius: number = TS / 2 - 4) => {
      const cx = this.gridOriginX + gx * TS + TS / 2;
      const cy = this.gridOriginY + gy * TS + TS / 2;
      this.entityGraphics.fillStyle(color, 1);
      this.entityGraphics.fillCircle(cx, cy, radius);
      this.entityGraphics.lineStyle(2, 0x000000, 0.5);
      this.entityGraphics.strokeCircle(cx, cy, radius);
    };
    const drawDiamond = (gx: number, gy: number, color: number) => {
      const cx = this.gridOriginX + gx * TS + TS / 2;
      const cy = this.gridOriginY + gy * TS + TS / 2;
      const r = TS / 2 - 6;
      this.entityGraphics.fillStyle(color, 1);
      this.entityGraphics.fillTriangle(cx, cy - r, cx + r, cy, cx, cy + r);
      this.entityGraphics.fillTriangle(cx, cy - r, cx, cy + r, cx - r, cy);
      this.entityGraphics.lineStyle(2, 0x000000, 0.5);
      this.entityGraphics.strokeTriangle(cx, cy - r, cx + r, cy, cx, cy + r);
      this.entityGraphics.strokeTriangle(cx, cy - r, cx, cy + r, cx - r, cy);
    };
    const drawSelection = (gx: number, gy: number) => {
      const x = this.gridOriginX + gx * TS;
      const y = this.gridOriginY + gy * TS;
      this.entityGraphics.lineStyle(3, GameConfig.Colors.DANGER, 1);
      this.entityGraphics.strokeRect(x + 1, y + 1, TS - 2, TS - 2);
    };

    lvl.targetZones.forEach((t: { pos: Vec2; id: string; category?: string }) => {
      drawRect(t.pos.x, t.pos.y, GameConfig.Colors.TARGET, 10);
    });

    drawCircle(lvl.playerStart.x, lvl.playerStart.y, GameConfig.Colors.PLAYER, TS / 2 - 8);
    if (this.selectedEntity && this.selectedEntity.type === EntityType.PLAYER) {
      drawSelection(lvl.playerStart.x, lvl.playerStart.y);
    }

    lvl.shelves.forEach((s: { pos: Vec2; id: string; targetZoneId?: string }, i: number) => {
      drawRect(s.pos.x, s.pos.y, GameConfig.Colors.SHELF, 3);
      if (this.selectedEntity && this.selectedEntity.type === EntityType.SHELF && this.selectedEntity.index === i) {
        drawSelection(s.pos.x, s.pos.y);
      }
    });

    lvl.books.forEach((b: { pos: Vec2; id: string; category: string; title: string; isWrongPlace?: boolean }, i: number) => {
      drawDiamond(b.pos.x, b.pos.y, GameConfig.Colors.BOOK);
      if (this.selectedEntity && this.selectedEntity.type === EntityType.BOOK && this.selectedEntity.index === i) {
        drawSelection(b.pos.x, b.pos.y);
      }
    });

    lvl.clues.forEach((c: { pos: Vec2; id: string; text: string; collected?: boolean }, i: number) => {
      const cx = this.gridOriginX + c.pos.x * TS + TS / 2;
      const cy = this.gridOriginY + c.pos.y * TS + TS / 2;
      const r = TS / 2 - 8;
      this.entityGraphics.fillStyle(GameConfig.Colors.CLUE, 1);
      this.entityGraphics.fillCircle(cx, cy, r);
      this.entityGraphics.lineStyle(2, 0x000000, 0.5);
      this.entityGraphics.strokeCircle(cx, cy, r);
      this.entityGraphics.lineStyle(2, 0x0a0818, 1);
      this.entityGraphics.lineBetween(cx - 5, cy - 4, cx - 5, cy + 4);
      this.entityGraphics.lineBetween(cx - 5, cy - 4, cx + 5, cy - 4);
      this.entityGraphics.lineBetween(cx - 5, cy, cx + 3, cy);
      this.entityGraphics.lineBetween(cx - 5, cy + 4, cx + 3, cy + 4);
      if (this.selectedEntity && this.selectedEntity.type === EntityType.CLUE && this.selectedEntity.index === i) {
        drawSelection(c.pos.x, c.pos.y);
      }
    });

    lvl.indexCards.forEach((ic: { pos: Vec2; id: string; category: string; repaired?: boolean }, i: number) => {
      drawRect(ic.pos.x, ic.pos.y, GameConfig.Colors.CARD, 8);
      if (this.selectedEntity && this.selectedEntity.type === EntityType.INDEX_CARD && this.selectedEntity.index === i) {
        drawSelection(ic.pos.x, ic.pos.y);
      }
    });
  }

  private renderCoords(): void {
    this.coordTexts.forEach(t => t.destroy());
    this.coordTexts = [];
    if (!this.showCoords) return;

    const TS = GameConfig.TILE_SIZE;
    for (let r = 0; r < GameConfig.GRID_ROWS; r++) {
      for (let c = 0; c < GameConfig.GRID_COLS; c++) {
        const t = this.add.text(
          this.gridOriginX + c * TS + 3,
          this.gridOriginY + r * TS + 1,
          `${c},${r}`,
          { fontSize: '9px', color: '#8a85a0', fontFamily: 'monospace' }
        );
        this.coordTexts.push(t);
      }
    }
  }

  shutdown(): void {
    this.rightPanelInputs.forEach(el => el.remove());
    document.querySelectorAll('.ent-prop-el').forEach(el => el.remove());
  }
}
