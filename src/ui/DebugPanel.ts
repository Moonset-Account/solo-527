import Phaser from 'phaser';
import { Direction, Vec2, LevelData } from '@/config/GameConfig';

interface ShelfState {
  pos: Vec2;
  id: string;
  targetZoneId?: string;
  onTarget: boolean;
}

interface BookState {
  pos: Vec2;
  id: string;
  category: string;
  title: string;
  isWrongPlace?: boolean;
  collected: boolean;
  sorted: boolean;
}

interface ClueStateLike {
  pos: Vec2;
  id: string;
  text?: string;
  collected: boolean;
}

interface CardStateLike {
  pos: Vec2;
  id: string;
  category: string;
  repaired: boolean;
}

interface WinProgress {
  shelvesReady: boolean;
  cluesReady: boolean;
  cardsReady: boolean;
  booksReady: boolean;
  atExit: boolean;
}

export interface GameEngineLike {
  levelData: LevelData;
  currentLevelId: number;
  steps: number;
  playerPos: Vec2;
  playerDir: Direction;
  shelves: ShelfState[];
  books: BookState[];
  onEvent?: (handler: (event: string, data?: any) => void) => () => void;
  forceWin?: () => void;
  forceFail?: () => void;
  addSteps?: (n: number) => void;
  teleportPlayer?: (pos: Vec2) => void;
  exportState?: () => any;
  getWinProgress?: () => WinProgress;
  getClues?: () => ClueStateLike[];
  getCards?: () => CardStateLike[];
  getCluesCollected?: () => number;
  getTotalClues?: () => number;
  getCardsRepaired?: () => number;
  getTotalCards?: () => number;
}

export class DebugPanel {
  private scene: Phaser.Scene;
  private engine: GameEngineLike | null = null;
  private visible: boolean = false;
  private container: Phaser.GameObjects.Container;
  private panelBg: Phaser.GameObjects.Graphics;
  private panelWidth: number = 360;
  private toggleBtn: Phaser.GameObjects.Text;
  private logs: string[] = [];
  private maxLogs: number = 12;
  private texts: Map<string, Phaser.GameObjects.Text> = new Map();
  private logsText: Phaser.GameObjects.Text;
  private panelHeight: number;
  private unbindEngine?: () => void;

  constructor(scene: Phaser.Scene, engine?: GameEngineLike, options: { initiallyVisible?: boolean } = {}) {
    const { initiallyVisible = false } = options;
    this.scene = scene;
    this.panelHeight = scene.scale.height;

    const startX = initiallyVisible ? scene.scale.width - this.panelWidth : scene.scale.width;
    this.visible = initiallyVisible;
    this.container = scene.add.container(startX, 0);
    this.container.setDepth(10000);

    this.panelBg = scene.add.graphics();
    this.container.add(this.panelBg);

    this.toggleBtn = scene.add.text(0, 8, '◀', {
      fontSize: '20px',
      color: '#e8e6f0',
      backgroundColor: '#1a1726',
      padding: { x: 8, y: 4 },
    }).setInteractive({ useHandCursor: true });
    this.toggleBtn.on('pointerdown', () => this.toggle());
    this.container.add(this.toggleBtn);

    this.logsText = scene.add.text(10, 0, '', {
      fontSize: '11px',
      color: '#8a85a0',
      fontFamily: 'monospace',
    });
    this.container.add(this.logsText);

    this.drawPanel();
    this.createStaticTexts();

    if (engine) {
      this.setEngine(engine);
    }

    this.setupHotkey();
    this.update();
  }

  private drawPanel(): void {
    this.panelBg.clear();
    this.panelBg.fillStyle(0x0a0818, 0.92);
    this.panelBg.fillRect(0, 0, this.panelWidth, this.panelHeight);
    this.panelBg.lineStyle(2, 0x8b7cff, 1);
    this.panelBg.strokeRect(0, 0, this.panelWidth, this.panelHeight);
  }

  private createStaticTexts(): void {
    const addText = (key: string, x: number, y: number, text: string, style?: Phaser.Types.GameObjects.Text.TextStyle) => {
      const t = this.scene.add.text(x, y, text, {
        fontSize: '12px',
        color: '#e8e6f0',
        ...style,
      });
      this.container.add(t);
      this.texts.set(key, t);
      return t;
    };

    let y = 40;
    addText('title', 10, 12, 'DEBUG PANEL', { fontSize: '16px', color: '#8b7cff', fontStyle: 'bold' });

    addText('level_label', 10, y, '关卡:', { color: '#8a85a0' });
    addText('level_val', 64, y, '-');
    y += 20;
    addText('steps_label', 10, y, '步数:', { color: '#8a85a0' });
    addText('steps_val', 64, y, '-');
    y += 20;
    addText('player_label', 10, y, '玩家:', { color: '#8a85a0' });
    addText('player_val', 64, y, '-');
    y += 20;
    addText('dir_label', 10, y, '方向:', { color: '#8a85a0' });
    addText('dir_val', 64, y, '-');
    y += 28;

    addText('shelves_title', 10, y, '书架状态:', { color: '#ffb347', fontStyle: 'bold' });
    y += 20;
    addText('shelves_list', 10, y, '-');
    y += 44;

    addText('books_title', 10, y, '书籍状态:', { color: '#d4a855', fontStyle: 'bold' });
    y += 20;
    addText('books_list', 10, y, '-');
    y += 68;

    addText('cc_title', 10, y, '线索 / 索引卡:', { color: '#9ff0a0', fontStyle: 'bold' });
    y += 20;
    addText('clues_val', 10, y, '-', { fontSize: '11px' });
    y += 16;
    addText('cards_val', 10, y, '-', { fontSize: '11px' });
    y += 32;

    addText('win_title', 10, y, '胜利进度（全部✓后到达出口）:', { color: '#6bff9a', fontStyle: 'bold' });
    y += 20;
    addText('win_shelves', 10, y, '  书架在目标区: -', { fontFamily: 'monospace' });
    y += 16;
    addText('win_clues', 10, y, '  线索全收集: -', { fontFamily: 'monospace' });
    y += 16;
    addText('win_cards', 10, y, '  索引卡全修复: -', { fontFamily: 'monospace' });
    y += 16;
    addText('win_books', 10, y, '  错放书全归位: -', { fontFamily: 'monospace' });
    y += 16;
    addText('win_exit', 10, y, '  玩家到达出口: -', { fontFamily: 'monospace' });
    y += 32;

    addText('logs_title', 10, y, '事件日志:', { color: '#6bb7ff', fontStyle: 'bold' });
    y += 20;
    this.logsText.setPosition(10, y);

    this.createCommands(y + 180);
  }

  private createCommands(startY: number): void {
    let y = startY;
    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '11px',
      color: '#0a0818',
      backgroundColor: '#8b7cff',
      padding: { x: 8, y: 4 },
    };

    const makeBtn = (label: string, x: number, yPos: number, onClick: () => void) => {
      const b = this.scene.add.text(x, yPos, label, btnStyle)
        .setInteractive({ useHandCursor: true });
      b.on('pointerdown', onClick);
      b.on('pointerover', () => b.setBackgroundColor('#a89cff'));
      b.on('pointerout', () => b.setBackgroundColor('#8b7cff'));
      this.container.add(b);
      return b;
    };

    makeBtn('跳胜利', 10, y, () => this.engine?.forceWin?.());
    makeBtn('跳失败', 100, y, () => this.engine?.forceFail?.());
    makeBtn('+10步', 180, y, () => this.engine?.addSteps?.(10));
    y += 32;

    makeBtn('导出状态JSON', 10, y, () => {
      const state = this.engine?.exportState?.() || null;
      console.log('[DebugPanel] Exported state:', state);
      this.log(`导出状态: ${JSON.stringify(state).slice(0, 60)}...`);
    });
    y += 32;

    const tpLabel = this.scene.add.text(10, y, '传送(x,y):', { fontSize: '11px', color: '#8a85a0' });
    this.container.add(tpLabel);

    const inputBg = this.scene.add.graphics();
    inputBg.fillStyle(0x1a1726, 1);
    inputBg.fillRect(100, y - 2, 120, 22);
    inputBg.lineStyle(1, 0x8b7cff, 1);
    inputBg.strokeRect(100, y - 2, 120, 22);
    this.container.add(inputBg);

    const inputText = this.scene.add.text(104, y, '', {
      fontSize: '12px',
      color: '#e8e6f0',
      fontFamily: 'monospace',
    });
    this.container.add(inputText);

    let inputVal = '';
    this.scene.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (!this.visible) return;
      const x = parseInt(e.key);
      if (!isNaN(x) || e.key === ',' || e.key === 'Backspace') {
        if (e.key === 'Backspace') {
          inputVal = inputVal.slice(0, -1);
        } else {
          inputVal += e.key;
        }
        inputText.setText(inputVal);
      }
      if (e.key === 'Enter' && inputVal.includes(',')) {
        const parts = inputVal.split(',');
        const tx = parseInt(parts[0]);
        const ty = parseInt(parts[1]);
        if (!isNaN(tx) && !isNaN(ty)) {
          this.engine?.teleportPlayer?.({ x: tx, y: ty });
          this.log(`传送玩家 → (${tx},${ty})`);
        }
        inputVal = '';
        inputText.setText('');
      }
    });

    makeBtn('GO', 230, y, () => {
      if (inputVal.includes(',')) {
        const parts = inputVal.split(',');
        const tx = parseInt(parts[0]);
        const ty = parseInt(parts[1]);
        if (!isNaN(tx) && !isNaN(ty)) {
          this.engine?.teleportPlayer?.({ x: tx, y: ty });
          this.log(`传送玩家 → (${tx},${ty})`);
        }
        inputVal = '';
        inputText.setText('');
      }
    });
  }

  private setupHotkey(): void {
    this.scene.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.key === '`' || e.code === 'Backquote') {
        this.toggle();
      }
    });
  }

  setEngine(engine: GameEngineLike): void {
    if (this.unbindEngine) {
      this.unbindEngine();
    }
    this.engine = engine;
    if (engine.onEvent) {
      this.unbindEngine = engine.onEvent((event, data) => {
        const msg = typeof data === 'string' ? `${event}: ${data}` : event;
        this.log(msg);
      });
    }
    this.update();
  }

  toggle(): void {
    this.visible = !this.visible;
    const targetX = this.visible ? this.scene.scale.width - this.panelWidth : this.scene.scale.width;
    this.scene.tweens.add({
      targets: this.container,
      x: targetX,
      duration: 200,
      ease: 'Cubic.easeOut',
    });
    this.toggleBtn.setText(this.visible ? '▶' : '◀');
  }

  log(message: string): void {
    const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    this.logs.push(`[${ts}] ${message}`);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.updateLogs();
  }

  private updateLogs(): void {
    this.logsText.setText(this.logs.join('\n'));
  }

  private setText(key: string, value: string): void {
    const t = this.texts.get(key);
    if (t) t.setText(value);
  }

  update(): void {
    if (!this.engine) {
      this.setText('level_val', '-');
      this.setText('steps_val', '-');
      this.setText('player_val', '-');
      this.setText('dir_val', '-');
      this.setText('shelves_list', '无引擎数据');
      this.setText('books_list', '无引擎数据');
      this.setText('clues_val', '线索：- / -');
      this.setText('cards_val', '索引卡：- / -');
      this.setWinRow('shelves', '-', false);
      this.setWinRow('clues', '-', false);
      this.setWinRow('cards', '-', false);
      this.setWinRow('books', '-', false);
      this.setWinRow('exit', '-', false);
      return;
    }

    const e = this.engine;
    this.setText('level_val', `#${e.currentLevelId}  ${e.levelData.name.slice(0, 12)}`);
    this.setText('steps_val', String(e.steps));
    this.setText('player_val', `(${e.playerPos.x},${e.playerPos.y})`);
    this.setText('dir_val', this.dirToArrow(e.playerDir));

    const shelvesStr = e.shelves.map(s => {
      const marker = s.onTarget ? '✓' : '✗';
      return `  ${marker} ${s.id} (${s.pos.x},${s.pos.y}) ${s.targetZoneId ? `→${s.targetZoneId}` : ''}`;
    }).join('\n') || '  (无)';
    this.setText('shelves_list', shelvesStr);

    const booksStr = e.books.slice(0, 3).map(b => {
      const flags: string[] = [];
      if (b.collected) flags.push('收');
      if (b.sorted) flags.push('整');
      if (b.isWrongPlace) flags.push('错');
      return `  ${b.id} [${b.category}] ${flags.join('/') || '•'}`;
    }).join('\n') + (e.books.length > 3 ? `\n  ...+${e.books.length - 3}本` : '') || '  (无)';
    this.setText('books_list', booksStr);

    const totalClues = e.getTotalClues ? e.getTotalClues() : (e as any).clues?.length ?? '-';
    const gotClues = e.getCluesCollected ? e.getCluesCollected() : (e as any).clues?.filter((c: any) => c.collected).length ?? 0;
    const totalCards = e.getTotalCards ? e.getTotalCards() : (e as any).cards?.length ?? '-';
    const gotCards = e.getCardsRepaired ? e.getCardsRepaired() : (e as any).cards?.filter((c: any) => c.repaired).length ?? 0;
    this.setText('clues_val', `  ✉ 线索:  ${gotClues} / ${totalClues}    (按 E / Space 拾取)`);
    this.setText('cards_val', `  📇 索引卡:  ${gotCards} / ${totalCards}    (需站在卡槽 tile 上触发)`);

    const wp = e.getWinProgress ? e.getWinProgress() : null;
    if (wp) {
      this.setWinRow('shelves', wp.shelvesReady ? '✓' : '✗', wp.shelvesReady);
      this.setWinRow('clues', wp.cluesReady ? '✓' : '✗', wp.cluesReady);
      this.setWinRow('cards', wp.cardsReady ? '✓' : '✗', wp.cardsReady);
      this.setWinRow('books', wp.booksReady ? '✓' : '✗', wp.booksReady);
      this.setWinRow('exit', wp.atExit ? '✓' : '✗', wp.atExit);
    } else {
      this.setWinRow('shelves', '?', false);
      this.setWinRow('clues', '?', false);
      this.setWinRow('cards', '?', false);
      this.setWinRow('books', '?', false);
      this.setWinRow('exit', '?', false);
    }
  }

  private setWinRow(key: 'shelves' | 'clues' | 'cards' | 'books' | 'exit', mark: string, ok: boolean): void {
    const labelMap: Record<string, string> = {
      shelves: '书架在目标区',
      clues: '线索全收集',
      cards: '索引卡全修复',
      books: '错放书全归位',
      exit: '玩家到达出口',
    };
    const t = this.texts.get(`win_${key}`);
    if (!t) return;
    t.setText(`  ${mark} ${labelMap[key]}`);
    t.setColor(ok ? '#6bff9a' : '#ff6b6b');
  }

  private dirToArrow(d: Direction): string {
    switch (d) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'left': return '←';
      case 'right': return '→';
      default: return '-';
    }
  }

  destroy(): void {
    if (this.unbindEngine) this.unbindEngine();
    this.container.destroy();
  }
}
