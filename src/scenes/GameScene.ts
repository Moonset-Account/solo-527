import Phaser from 'phaser';
import { GameConfig, Direction, LevelData } from '@/config/GameConfig';
import { LEVELS, getLevelById } from '@/config/levels';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { SaveSystem } from '@/systems/SaveSystem';
import { AchievementSystem } from '@/systems/AchievementSystem';
import { DailySystem } from '@/systems/DailySystem';
import { HUD } from '@/ui/HUD';

interface ShelfState {
  id: string;
  pos: { x: number; y: number };
  prevPos?: { x: number; y: number };
  targetZoneId?: string;
  onTarget: boolean;
}

interface BookState {
  id: string;
  pos: { x: number; y: number };
  category: string;
  title: string;
  isWrongPlace: boolean;
  sorted: boolean;
}

interface ClueState {
  id: string;
  pos: { x: number; y: number };
  text: string;
  collected: boolean;
}

interface CardState {
  id: string;
  pos: { x: number; y: number };
  category: string;
  repaired: boolean;
}

interface TargetZoneState {
  id: string;
  pos: { x: number; y: number };
  category?: string;
}

interface GameStateSnapshot {
  playerPos: { x: number; y: number };
  shelves: ShelfState[];
  books: BookState[];
  clues: ClueState[];
  cards: CardState[];
  steps: number;
}

class GameEngine {
  private level: LevelData;
  private player: { x: number; y: number };
  private shelves: ShelfState[] = [];
  private books: BookState[] = [];
  private clues: ClueState[] = [];
  private cards: CardState[] = [];
  private targetZones: TargetZoneState[] = [];
  private history: GameStateSnapshot[] = [];
  private steps: number = 0;
  private grid: number[][];
  private cols: number;
  private rows: number;

  constructor(level: LevelData) {
    this.level = level;
    this.player = { ...level.playerStart };
    this.grid = level.grid.map((r) => [...r]);
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this.shelves = level.shelves.map((s) => ({
      id: s.id,
      pos: { ...s.pos },
      targetZoneId: s.targetZoneId,
      onTarget: false,
    }));
    this.books = level.books.map((b) => ({
      id: b.id,
      pos: { ...b.pos },
      category: b.category,
      title: b.title,
      isWrongPlace: b.isWrongPlace ?? false,
      sorted: false,
    }));
    this.clues = level.clues.map((c) => ({
      id: c.id,
      pos: { ...c.pos },
      text: c.text,
      collected: false,
    }));
    this.cards = level.indexCards.map((c) => ({
      id: c.id,
      pos: { ...c.pos },
      category: c.category,
      repaired: false,
    }));
    this.targetZones = level.targetZones.map((t) => ({
      id: t.id,
      pos: { ...t.pos },
      category: t.category,
    }));
    this.updateTargets();
  }

  private snapshot(): GameStateSnapshot {
    return {
      playerPos: { ...this.player },
      shelves: this.shelves.map((s) => ({ ...s, pos: { ...s.pos }, prevPos: s.prevPos ? { ...s.prevPos } : undefined })),
      books: this.books.map((b) => ({ ...b, pos: { ...b.pos } })),
      clues: this.clues.map((c) => ({ ...c, pos: { ...c.pos } })),
      cards: this.cards.map((c) => ({ ...c, pos: { ...c.pos } })),
      steps: this.steps,
    };
  }

  private restore(snap: GameStateSnapshot): void {
    this.player = { ...snap.playerPos };
    this.shelves = snap.shelves.map((s) => ({ ...s, pos: { ...s.pos }, prevPos: s.prevPos ? { ...s.prevPos } : undefined }));
    this.books = snap.books.map((b) => ({ ...b, pos: { ...b.pos } }));
    this.clues = snap.clues.map((c) => ({ ...c, pos: { ...c.pos } }));
    this.cards = snap.cards.map((c) => ({ ...c, pos: { ...c.pos } }));
    this.steps = snap.steps;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  private isWall(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return true;
    return this.grid[y][x] === 2;
  }

  private shelfAt(x: number, y: number): ShelfState | undefined {
    return this.shelves.find((s) => s.pos.x === x && s.pos.y === y);
  }

  private bookAt(x: number, y: number): BookState | undefined {
    return this.books.find((b) => b.pos.x === x && b.pos.y === y);
  }

  private cardAt(x: number, y: number): CardState | undefined {
    return this.cards.find((c) => c.pos.x === x && c.pos.y === y);
  }

  private clueAt(x: number, y: number): ClueState | undefined {
    return this.clues.find((c) => c.pos.x === x && c.pos.y === y);
  }

  private isCardSlot(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    return this.grid[y][x] === 4;
  }

  private updateTargets(): void {
    for (const s of this.shelves) {
      s.onTarget = this.targetZones.some((t) =>
        t.id === s.targetZoneId && t.pos.x === s.pos.x && t.pos.y === s.pos.y
      );
    }
  }

  move(dir: Direction): {
    result: 'moved' | 'pushed' | 'blocked';
    shelfId?: string;
    bookId?: string;
  } {
    const vec = {
      up: { dx: 0, dy: -1 },
      down: { dx: 0, dy: 1 },
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 },
    }[dir];

    const nx = this.player.x + vec.dx;
    const ny = this.player.y + vec.dy;

    if (this.isWall(nx, ny)) return { result: 'blocked' };

    const snap = this.snapshot();

    const shelf = this.shelfAt(nx, ny);
    const book = this.bookAt(nx, ny);

    if (shelf) {
      const sx = nx + vec.dx;
      const sy = ny + vec.dy;
      if (this.isWall(sx, sy) || this.shelfAt(sx, sy) || this.bookAt(sx, sy) || this.cardAt(sx, sy)) {
        return { result: 'blocked' };
      }
      this.history.push(snap);
      shelf.prevPos = { ...shelf.pos };
      shelf.pos.x = sx;
      shelf.pos.y = sy;
      this.player.x = nx;
      this.player.y = ny;
      this.steps++;
      this.updateTargets();
      return { result: 'pushed', shelfId: shelf.id };
    }

    if (book) {
      const bx = nx + vec.dx;
      const by = ny + vec.dy;
      if (this.isWall(bx, by) || this.shelfAt(bx, by) || this.bookAt(bx, by) || this.cardAt(bx, by)) {
        return { result: 'blocked' };
      }
      this.history.push(snap);
      book.pos.x = bx;
      this.player.x = nx;
      this.player.y = ny;
      this.steps++;
      return { result: 'pushed', bookId: book.id };
    }

    this.history.push(snap);
    this.player.x = nx;
    this.player.y = ny;
    this.steps++;
    return { result: 'moved' };
  }

  undo(): boolean {
    const snap = this.history.pop();
    if (!snap) return false;
    this.restore(snap);
    this.updateTargets();
    return true;
  }

  tryInteract(): {
    clue?: ClueState;
    card?: CardState;
    book?: BookState;
  } | null {
    const p = this.player;
    const dirs = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    for (const d of dirs) {
      const x = p.x + d.x;
      const y = p.y + d.y;
      const clue = this.clueAt(x, y);
      if (clue && !clue.collected) {
        clue.collected = true;
        return { clue };
      }
    }
    for (const d of dirs) {
      const x = p.x + d.x;
      const y = p.y + d.y;
      const card = this.cardAt(x, y);
      if (card && !card.repaired && this.isCardSlot(x, y)) {
        card.repaired = true;
        return { card };
      }
    }
    for (const d of dirs) {
      const x = p.x + d.x;
      const y = p.y + d.y;
      const book = this.bookAt(x, y);
      if (book && book.isWrongPlace && !book.sorted) {
        book.sorted = true;
        return { book };
      }
    }
    return null;
  }

  getPlayer() {
    return { ...this.player };
  }

  getShelves() {
    return this.shelves.map((s) => ({ ...s, pos: { ...s.pos } }));
  }

  getBooks() {
    return this.books.map((b) => ({ ...b, pos: { ...b.pos } }));
  }

  getClues() {
    return this.clues.map((c) => ({ ...c, pos: { ...c.pos } }));
  }

  getCards() {
    return this.cards.map((c) => ({ ...c, pos: { ...c.pos } }));
  }

  getTargetZones() {
    return this.targetZones.map((t) => ({ ...t, pos: { ...t.pos } }));
  }

  getSteps(): number {
    return this.steps;
  }

  getMaxSteps(): number {
    return this.level.maxSteps;
  }

  isWin(): boolean {
    const allShelvesOnTarget = this.shelves
      .filter((s) => s.targetZoneId)
      .every((s) => s.onTarget);
    return allShelvesOnTarget && this.shelves.filter((s) => s.targetZoneId).length > 0
      ? allShelvesOnTarget
      : false;
  }

  isStepsExhausted(): boolean {
    return this.steps >= this.level.maxSteps;
  }

  getLevel(): LevelData {
    return this.level;
  }

  getStarThresholds(): [number, number, number] {
    return this.level.starThresholds;
  }

  getCluesCollected(): number {
    return this.clues.filter((c) => c.collected).length;
  }

  getTotalClues(): number {
    return this.clues.length;
  }

  getCardsRepaired(): number {
    return this.cards.filter((c) => c.repaired).length;
  }

  getTotalCards(): number {
    return this.cards.length;
  }

  getWrongBooksRemaining(): number {
    return this.books.filter((b) => b.isWrongPlace && !b.sorted).length;
  }

  getStars(): number {
    const s = this.steps;
    const [t1, t2, t3] = this.level.starThresholds;
    if (s <= t3) return 3;
    if (s <= t2) return 2;
    if (s <= t1) return 1;
    return 0;
  }

  getSortedBooks(): number {
    return this.books.filter((b) => b.sorted).length;
  }
}

class Renderer {
  private scene: Phaser.Scene;
  private tileSize: number;
  private gridGraphics: Phaser.GameObjects.Graphics;
  private playerSprite: Phaser.GameObjects.Graphics;
  private playerTween: Phaser.Tweens.Tween | null = null;
  private shelfSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private bookSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private clueSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private cardSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private targetGraphics: Phaser.GameObjects.Graphics;
  private showGrid: boolean;
  private smoothing: boolean;
  private container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    tileSize: number,
    offsetX: number,
    offsetY: number,
    showGrid: boolean,
    smoothing: boolean
  ) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.showGrid = showGrid;
    this.smoothing = smoothing;
    this.container = scene.add.container(offsetX, offsetY);
    this.gridGraphics = scene.add.graphics();
    this.targetGraphics = scene.add.graphics();
    this.container.add([this.gridGraphics, this.targetGraphics]);
    this.playerSprite = scene.add.graphics();
    this.container.add(this.playerSprite);
  }

  worldToScreen(gx: number, gy: number): { x: number; y: number } {
    return {
      x: gx * this.tileSize + this.tileSize / 2,
      y: gy * this.tileSize + this.tileSize / 2,
    };
  }

  drawGrid(grid: number[][]): void {
    this.gridGraphics.clear();
    const rows = grid.length;
    const cols = grid[0].length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * this.tileSize;
        const y = r * this.tileSize;
        const tile = grid[r][c];
        if (tile === 2) {
          this.gridGraphics.fillStyle(GameConfig.Colors.WALL, 1);
          this.gridGraphics.fillRect(x, y, this.tileSize, this.tileSize);
          this.gridGraphics.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
          this.gridGraphics.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
        } else {
          const alt = (r + c) % 2 === 0;
          this.gridGraphics.fillStyle(
            alt ? GameConfig.Colors.BG_FLOOR : GameConfig.Colors.BG_FLOOR_ALT,
            1
          );
          this.gridGraphics.fillRect(x, y, this.tileSize, this.tileSize);
          if (tile === 3) {
            this.gridGraphics.fillStyle(GameConfig.Colors.TARGET, 0.2);
            this.gridGraphics.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
          } else if (tile === 4) {
            this.gridGraphics.fillStyle(GameConfig.Colors.CARD, 0.35);
            this.gridGraphics.fillRect(x + 6, y + 6, this.tileSize - 12, this.tileSize - 12);
            this.gridGraphics.lineStyle(2, GameConfig.Colors.CARD, 0.8);
            this.gridGraphics.strokeRect(x + 8, y + 8, this.tileSize - 16, this.tileSize - 16);
          } else if (tile === 5) {
            this.gridGraphics.fillStyle(GameConfig.Colors.ACCENT, 0.5);
            this.gridGraphics.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
          }
        }
      }
    }
    if (this.showGrid) {
      this.gridGraphics.lineStyle(1, GameConfig.Colors.TEXT_DIM, 0.15);
      for (let r = 0; r <= rows; r++) {
        this.gridGraphics.lineBetween(0, r * this.tileSize, cols * this.tileSize, r * this.tileSize);
      }
      for (let c = 0; c <= cols; c++) {
        this.gridGraphics.lineBetween(c * this.tileSize, 0, c * this.tileSize, rows * this.tileSize);
      }
    }
  }

  drawTargets(zones: TargetZoneState[]): void {
    this.targetGraphics.clear();
    for (const z of zones) {
      const { x, y } = this.worldToScreen(z.pos.x, z.pos.y);
      const sz = this.tileSize * 0.35;
      this.targetGraphics.fillStyle(GameConfig.Colors.TARGET, 0.25);
      this.targetGraphics.fillCircle(x, y, sz);
      this.targetGraphics.lineStyle(2, GameConfig.Colors.TARGET, 0.7);
      this.targetGraphics.strokeCircle(x, y, sz);
    }
  }

  private makeShelfVisual(s: ShelfState): Phaser.GameObjects.Container {
    const { x, y } = this.worldToScreen(s.pos.x, s.pos.y);
    const cont = this.scene.add.container(x, y);
    const g = this.scene.add.graphics();
    const size = this.tileSize * 0.78;
    g.fillStyle(GameConfig.Colors.SHELF, 1);
    g.fillRoundedRect(-size / 2, -size / 2, size, size, 6);
    g.lineStyle(3, GameConfig.Colors.SHELF_EDGE, 1);
    g.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);
    g.fillStyle(GameConfig.Colors.BOOK, 0.8);
    for (let i = 0; i < 3; i++) {
      g.fillRect(-size / 2 + 4 + i * (size - 8) / 3, -size / 2 + 6, (size - 8) / 3 - 2, size - 12);
    }
    cont.add(g);
    if (s.onTarget) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(3, GameConfig.Colors.SUCCESS, 0.9);
      ring.strokeCircle(0, 0, size / 2 + 4);
      cont.add(ring);
      cont.setData('ring', ring);
    }
    this.container.add(cont);
    return cont;
  }

  private makeBookVisual(b: BookState): Phaser.GameObjects.Container {
    const { x, y } = this.worldToScreen(b.pos.x, b.pos.y);
    const cont = this.scene.add.container(x, y);
    const g = this.scene.add.graphics();
    const size = this.tileSize * 0.55;
    g.fillStyle(b.isWrongPlace && !b.sorted ? GameConfig.Colors.DANGER : GameConfig.Colors.BOOK, 1);
    g.fillRoundedRect(-size / 2, -size / 2, size, size * 1.2, 3);
    g.fillStyle(GameConfig.Colors.SHADOW, 0.3);
    g.fillRect(-size / 2 + 2, -size / 2, 2, size * 1.2);
    cont.add(g);
    const text = this.scene.add.text(0, size * 0.6, '', {});
    cont.add(text);
    if (b.sorted) {
      const check = this.scene.add.text(0, 0, '✓', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: `#${GameConfig.Colors.SUCCESS.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      cont.add(check);
    }
    this.container.add(cont);
    return cont;
  }

  private makeClueVisual(c: ClueState): Phaser.GameObjects.Container {
    const { x, y } = this.worldToScreen(c.pos.x, c.pos.y);
    const cont = this.scene.add.container(x, y);
    cont.setAlpha(c.collected ? 0.15 : 1);
    const g = this.scene.add.graphics();
    const size = this.tileSize * 0.5;
    g.fillStyle(GameConfig.Colors.CLUE, 1);
    g.fillCircle(0, 0, size);
    g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
    g.strokeCircle(0, 0, size);
    const text = this.scene.add.text(0, 0, '?', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: `#${GameConfig.Colors.SHADOW.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([g, text]);
    this.container.add(cont);
    return cont;
  }

  private makeCardVisual(c: CardState): Phaser.GameObjects.Container {
    const { x, y } = this.worldToScreen(c.pos.x, c.pos.y);
    const cont = this.scene.add.container(x, y);
    cont.setAlpha(c.repaired ? 0.3 : 1);
    const g = this.scene.add.graphics();
    const size = this.tileSize * 0.5;
    g.fillStyle(GameConfig.Colors.CARD, 1);
    g.fillRoundedRect(-size / 2, -size / 2, size, size, 4);
    g.lineStyle(1, GameConfig.Colors.SHADOW, 0.4);
    g.strokeRoundedRect(-size / 2, -size / 2, size, size, 4);
    if (!c.repaired) {
      g.lineStyle(2, GameConfig.Colors.DANGER, 0.8);
      g.moveTo(-size / 3, -size / 3);
      g.lineTo(size / 3, size / 3);
    } else {
      const check = this.scene.add.text(0, 0, '✓', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: `#${GameConfig.Colors.SUCCESS.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      cont.add(check);
    }
    cont.add(g);
    this.container.add(cont);
    return cont;
  }

  drawPlayer(pos: { x: number; y: number }): void {
    this.playerSprite.clear();
    const { x, y } = this.worldToScreen(pos.x, pos.y);
    const size = this.tileSize * 0.45;
    this.playerSprite.fillStyle(GameConfig.Colors.PLAYER, 1);
    this.playerSprite.fillCircle(x, y, size);
    this.playerSprite.lineStyle(3, GameConfig.Colors.PLAYER_DARK, 1);
    this.playerSprite.strokeCircle(x, y, size);
    this.playerSprite.fillStyle(GameConfig.Colors.SHADOW, 0.4);
    this.playerSprite.fillCircle(x - size * 0.3, y - size * 0.1, size * 0.15);
    this.playerSprite.fillCircle(x + size * 0.3, y - size * 0.1, size * 0.15);
  }

  renderInitial(engine: GameEngine): void {
    this.drawGrid(engine.getLevel().grid);
    this.drawTargets(engine.getTargetZones());
    for (const s of engine.getShelves()) {
      this.shelfSprites.set(s.id, this.makeShelfVisual(s));
    }
    for (const b of engine.getBooks()) {
      this.bookSprites.set(b.id, this.makeBookVisual(b));
    }
    for (const c of engine.getClues()) {
      this.clueSprites.set(c.id, this.makeClueVisual(c));
    }
    for (const c of engine.getCards()) {
      this.cardSprites.set(c.id, this.makeCardVisual(c));
    }
    this.drawPlayer(engine.getPlayer());
  }

  animatePlayer(from: { x: number; y: number }, to: { x: number; y: number }, duration: number, onComplete?: () => void): void {
    this.playerTween?.stop?.();
    const a = this.worldToScreen(from.x, from.y);
    const b = this.worldToScreen(to.x, to.y);
    if (!this.smoothing) {
      this.drawPlayer(to);
      onComplete?.();
      return;
    }
    const tweenTarget = { t: 0 };
    const tween = this.scene.add.tween({
      targets: tweenTarget,
      t: 1,
      duration,
      ease: Phaser.Math.Easing.Sine.InOut,
      onUpdate: () => {
        const v = tweenTarget.t;
        const px = a.x + (b.x - a.x) * v;
        const py = a.y + (b.y - a.y) * v;
        this.playerSprite.clear();
        const size = this.tileSize * 0.45;
        this.playerSprite.fillStyle(GameConfig.Colors.PLAYER, 1);
        this.playerSprite.fillCircle(px, py, size);
        this.playerSprite.lineStyle(3, GameConfig.Colors.PLAYER_DARK, 1);
        this.playerSprite.strokeCircle(px, py, size);
        this.playerSprite.fillStyle(GameConfig.Colors.SHADOW, 0.4);
        this.playerSprite.fillCircle(px - size * 0.3, py - size * 0.1, size * 0.15);
        this.playerSprite.fillCircle(px + size * 0.3, py - size * 0.1, size * 0.15);
      },
      onComplete: () => {
        this.drawPlayer(to);
        onComplete?.();
      },
    });
    this.playerTween = tween;
  }

  animateShelf(id: string, _from: { x: number; y: number }, to: { x: number; y: number }, duration: number, onComplete?: () => void): void {
    const sprite = this.shelfSprites.get(id);
    if (!sprite) return;
    const b = this.worldToScreen(to.x, to.y);
    if (!this.smoothing) {
      sprite.setPosition(b.x, b.y);
      onComplete?.();
      return;
    }
    this.scene.tweens.add({
      targets: sprite,
      x: b.x,
      y: b.y,
      duration,
      ease: 'Cubic.easeInOut',
      onComplete,
    });
  }

  animateBook(id: string, _from: { x: number; y: number }, to: { x: number; y: number }, duration: number, onComplete?: () => void): void {
    const sprite = this.bookSprites.get(id);
    if (!sprite) return;
    const b = this.worldToScreen(to.x, to.y);
    if (!this.smoothing) {
      sprite.setPosition(b.x, b.y);
      onComplete?.();
      return;
    }
    this.scene.tweens.add({
      targets: sprite,
      x: b.x,
      y: b.y,
      duration,
      ease: 'Cubic.easeInOut',
      onComplete,
    });
  }

  updateShelfOnTarget(id: string, onTarget: boolean): void {
    const sprite = this.shelfSprites.get(id);
    if (!sprite) return;
    const ring = sprite.getData('ring') as Phaser.GameObjects.Graphics | undefined;
    if (onTarget && !ring) {
      const r = this.scene.add.graphics();
      const size = this.tileSize * 0.78;
      r.lineStyle(3, GameConfig.Colors.SUCCESS, 0.9);
      r.strokeCircle(0, 0, size / 2 + 4);
      sprite.add(r);
      sprite.setData('ring', r);
      this.scene.tweens.add({
        targets: r,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.5, to: 1 },
        duration: 300,
        ease: 'Back.easeOut',
      });
    } else if (!onTarget && ring) {
      ring.destroy();
      sprite.setData('ring', undefined);
    }
  }

  collectClue(id: string): void {
    const sprite = this.clueSprites.get(id);
    if (!sprite) return;
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0.15,
      scale: 0.5,
      y: sprite.y - 20,
      duration: 400,
      ease: 'Cubic.easeOut',
    });
  }

  repairCard(id: string): void {
    const sprite = this.cardSprites.get(id);
    if (!sprite) return;
    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 1, to: 1.3, duration: 200 },
      yoyo: true,
      duration: 400,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        sprite.setAlpha(0.3);
        const g = this.scene.add.graphics();
        const size = this.tileSize * 0.5;
        g.fillStyle(GameConfig.Colors.CARD, 1);
        g.fillRoundedRect(-size / 2, -size / 2, size, size, 4);
        const check = this.scene.add.text(0, 0, '✓', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: `#${GameConfig.Colors.SUCCESS.toString(16).padStart(6, '0')}`,
          fontStyle: 'bold',
        }).setOrigin(0.5);
        sprite.removeAll(true);
        sprite.add([g, check]);
      },
    });
  }

  sortBook(id: string): void {
    const sprite = this.bookSprites.get(id);
    if (!sprite) return;
    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 1, to: 1.2 },
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  shake(amount: number = 8, duration: number = 200): void {
    const origX = this.container.x;
    const origY = this.container.y;
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Linear',
      onUpdate: (tw) => {
        const v = tw.getValue() as number;
        const s = amount * (1 - v);
        const ox = (Math.random() - 0.5) * 2 * s;
        const oy = (Math.random() - 0.5) * 2 * s;
        this.container.setPosition(origX + ox, origY + oy);
      },
      onComplete: () => {
        this.container.setPosition(origX, origY);
      },
    });
  }

  renderFull(engine: GameEngine): void {
    this.drawTargets(engine.getTargetZones());
    for (const s of engine.getShelves()) {
      const sp = this.shelfSprites.get(s.id);
      if (sp) {
        const p = this.worldToScreen(s.pos.x, s.pos.y);
        sp.setPosition(p.x, p.y);
        this.updateShelfOnTarget(s.id, s.onTarget);
      }
    }
    for (const b of engine.getBooks()) {
      const sp = this.bookSprites.get(b.id);
      if (sp) {
        const p = this.worldToScreen(b.pos.x, b.pos.y);
        sp.setPosition(p.x, p.y);
      }
    }
    for (const c of engine.getClues()) {
      const sp = this.clueSprites.get(c.id);
      if (sp) {
        const p = this.worldToScreen(c.pos.x, c.pos.y);
        sp.setPosition(p.x, p.y);
        sp.setAlpha(c.collected ? 0.15 : 1);
      }
    }
    for (const c of engine.getCards()) {
      const sp = this.cardSprites.get(c.id);
      if (sp) {
        const p = this.worldToScreen(c.pos.x, c.pos.y);
        sp.setPosition(p.x, p.y);
        sp.setAlpha(c.repaired ? 0.3 : 1);
      }
    }
    this.drawPlayer(engine.getPlayer());
  }

  destroy(): void {
    this.playerTween?.stop?.();
    this.container.destroy();
  }
}

interface GameSceneInitData {
  levelId?: number;
  isDaily?: boolean;
}

export class GameScene extends Phaser.Scene {
  _debugGrid: boolean;
  private levelId: number = 1;
  private isDaily: boolean = false;
  private levelData!: LevelData;

  private inputSys!: InputSystem;
  private audioSys!: AudioSystem;
  private engine!: GameEngine;
  private gameRenderer!: Renderer;
  private hud!: HUD;

  private isAnimating: boolean = false;
  private failPopup: Phaser.GameObjects.Container | null = null;
  private cluePopup: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'game' });
    this._debugGrid = false;
  }

  init(data: GameSceneInitData): void {
    this.levelId = data.levelId ?? 1;
    this.isDaily = data.isDaily ?? false;
  }

  create(): void {
    const settings = SaveSystem.loadSettings();
    this._debugGrid = settings.showTileGrid;

    if (this.isDaily) {
      this.levelData = DailySystem.getDailyChallenge().modifiedLevel;
    } else {
      const lv = getLevelById(this.levelId);
      if (!lv) {
        this.levelData = LEVELS[0];
      } else {
        this.levelData = lv;
      }
    }

    this.cameras.main.setBackgroundColor(`#${GameConfig.Colors.BG_NIGHT.toString(16).padStart(6, '0')}`);

    const hudH = 120;

    this.inputSys = new InputSystem(this);
    this.audioSys = new AudioSystem(this);
    this.engine = new GameEngine(this.levelData);
    this.gameRenderer = new Renderer(
      this,
      GameConfig.TILE_SIZE,
      0,
      hudH,
      settings.showTileGrid,
      settings.moveSmoothing
    );
    this.hud = new HUD(this, 0, 0, GameConfig.CANVAS_WIDTH, hudH);

    this.gameRenderer.renderInitial(this.engine);
    this.hud.setLevelName(this.levelData.name, this.levelData.description);
    this.updateHUD();

    this.audioSys.startAmbientMusic();

    this.inputSys.onMove((dir) => this.handleMove(dir));
    this.inputSys.onAction('interact', () => this.handleInteract());
    this.inputSys.onAction('pause', () => this.handlePause());
    this.inputSys.onAction('restart', () => this.handleRestart());
    this.inputSys.onAction('undo', () => this.handleUndo());
    this.inputSys.onAction('cancel', () => this.handleCancel());

    if (settings.showDebug) {
      console.log('[GameScene] debug enabled');
    }
  }

  private handleMove(dir: Direction): void {
    if (this.isAnimating) return;
    if (this.failPopup) return;
    if (this.cluePopup) return;

    const oldPlayer = this.engine.getPlayer();
    const oldShelves = this.engine.getShelves();
    const oldBooks = this.engine.getBooks();

    const result = this.engine.move(dir);

    if (result.result === 'blocked') {
      this.gameRenderer.shake();
      this.audioSys.playSfx('blocked');
      return;
    }

    this.isAnimating = true;
    const newPlayer = this.engine.getPlayer();
    let animCount = 0;
    const onAnimDone = () => {
      animCount++;
      const needed = result.result === 'pushed' ? 2 : 1;
      if (animCount >= needed) {
        this.isAnimating = false;
        this.updateHUD();
        this.checkEndConditions();
      }
    };

    if (result.result === 'pushed') {
      if (result.shelfId) {
        const oldShelf = oldShelves.find((s) => s.id === result.shelfId);
        const newShelf = this.engine.getShelves().find((s) => s.id === result.shelfId);
        if (oldShelf && newShelf) {
          this.gameRenderer.animateShelf(result.shelfId, oldShelf.pos, newShelf.pos, GameConfig.PUSH_DURATION, onAnimDone);
          const sh = this.engine.getShelves().find((s) => s.id === result.shelfId);
          if (sh) this.gameRenderer.updateShelfOnTarget(result.shelfId, sh.onTarget);
        }
        this.audioSys.playSfx('push');
      } else if (result.bookId) {
        const oldBook = oldBooks.find((b) => b.id === result.bookId);
        const newBook = this.engine.getBooks().find((b) => b.id === result.bookId);
        if (oldBook && newBook) {
          this.gameRenderer.animateBook(result.bookId, oldBook.pos, newBook.pos, GameConfig.PUSH_DURATION, onAnimDone);
        }
        this.audioSys.playSfx('book');
      }
    } else {
      this.audioSys.playSfx('move');
    }

    this.gameRenderer.animatePlayer(oldPlayer, newPlayer, result.result === 'pushed' ? GameConfig.PUSH_DURATION : GameConfig.MOVE_DURATION, onAnimDone);
  }

  private handleInteract(): void {
    if (this.isAnimating) return;
    if (this.failPopup) return;
    if (this.cluePopup) return;

    const result = this.engine.tryInteract();
    if (!result) return;

    if (result.clue) {
      this.gameRenderer.collectClue(result.clue.id);
      this.audioSys.playSfx('clue');
      SaveSystem.incrementStats(0, 0, 1);
      this.showCluePopup(result.clue.text);
    }
    if (result.card) {
      this.gameRenderer.repairCard(result.card.id);
      this.audioSys.playSfx('card');
      SaveSystem.incrementStats(0, 1, 0);
      this.hud.showTempMessage('索引卡已修复！');
    }
    if (result.book) {
      this.gameRenderer.sortBook(result.book.id);
      this.audioSys.playSfx('book');
      SaveSystem.incrementStats(1, 0, 0);
      this.hud.showTempMessage('书籍已归位！');
    }
    this.updateHUD();
  }

  private handlePause(): void {
    if (this.failPopup) return;
    if (this.cluePopup) return;
    this.scene.pause();
    this.scene.launch('pause');
  }

  private handleRestart(): void {
    this.cleanup();
    this.scene.restart({ levelId: this.levelId, isDaily: this.isDaily });
  }

  private handleUndo(): void {
    if (this.isAnimating) return;
    if (this.failPopup) return;
    if (this.cluePopup) return;
    const ok = this.engine.undo();
    if (ok) {
      this.audioSys.playSfx('undo');
      this.gameRenderer.renderFull(this.engine);
      this.updateHUD();
    }
  }

  private handleCancel(): void {
    this.cleanup();
    this.scene.start('level_select');
  }

  private updateHUD(): void {
    this.hud.update({
      steps: this.engine.getSteps(),
      maxSteps: this.engine.getMaxSteps(),
      cluesCollected: this.engine.getCluesCollected(),
      totalClues: this.engine.getTotalClues(),
      cardsRepaired: this.engine.getCardsRepaired(),
      totalCards: this.engine.getTotalCards(),
      wrongBooksRemaining: this.engine.getWrongBooksRemaining(),
      starThresholds: this.engine.getStarThresholds(),
    });
  }

  private checkEndConditions(): void {
    if (this.engine.isWin()) {
      this.handleWin();
      return;
    }
    if (this.engine.isStepsExhausted()) {
      this.handleFail();
    }
  }

  private handleWin(): void {
    const steps = this.engine.getSteps();
    const stars = this.engine.getStars();
    const clues = this.engine.getCluesCollected();
    const cards = this.engine.getCardsRepaired();
    const books = this.engine.getWrongBooksRemaining();

    this.audioSys.playSfx('win');

    if (!this.isDaily) {
      SaveSystem.updateSaveLevel(this.levelId, steps, stars);
    } else {
      DailySystem.setTodayProgress(steps, stars);
    }

    const newly = AchievementSystem.checkAndUnlock({
      type: 'level_complete',
      levelId: this.levelId,
      stars,
    });

    this.time.delayedCall(600, () => {
      this.cleanup();
      this.scene.start('complete', {
        levelId: this.levelId,
        steps,
        maxSteps: this.engine.getMaxSteps(),
        stars,
        levelName: this.levelData.name,
        isDaily: this.isDaily,
        clues,
        cards,
        books,
        achievements: newly,
      });
    });
  }

  private handleFail(): void {
    this.audioSys.playSfx('fail');
    this.showFailPopup();
  }

  private showCluePopup(text: string): void {
    const cx = GameConfig.CANVAS_WIDTH / 2;
    const cy = GameConfig.CANVAS_HEIGHT / 2;
    const w = 480;
    const h = 180;
    const cont = this.add.container(cx, cy);
    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.Colors.SHADOW, 0.7);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.fillStyle(GameConfig.Colors.BG_FLOOR, 1);
    bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 10);
    bg.lineStyle(2, GameConfig.Colors.ACCENT, 0.6);
    bg.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 10);
    const title = this.add.text(0, -h / 2 + 28, '发现线索！', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: `#${GameConfig.Colors.CLUE.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const content = this.add.text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      align: 'center',
      wordWrap: { width: w - 60 },
    }).setOrigin(0.5);
    const btn = this.makeButton(0, h / 2 - 36, 140, 40, '继续', () => {
      this.cluePopup?.destroy();
      this.cluePopup = null;
    });
    cont.add([bg, title, content, btn]);
    cont.setAlpha(0);
    this.tweens.add({
      targets: cont,
      alpha: 1,
      duration: 250,
      ease: 'Cubic.easeOut',
    });
    this.cluePopup = cont;
  }

  private showFailPopup(): void {
    const cx = GameConfig.CANVAS_WIDTH / 2;
    const cy = GameConfig.CANVAS_HEIGHT / 2;
    const w = 420;
    const h = 220;
    const cont = this.add.container(cx, cy);
    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.Colors.SHADOW, 0.75);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.fillStyle(GameConfig.Colors.BG_FLOOR, 1);
    bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 10);
    bg.lineStyle(2, GameConfig.Colors.DANGER, 0.5);
    bg.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 10);
    const title = this.add.text(0, -h / 2 + 36, '步数用尽！', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: `#${GameConfig.Colors.DANGER.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const tip = this.add.text(0, 0, '很遗憾，步数已经用完了。\n再来一次吧！', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);
    const btnRetry = this.makeButton(-90, h / 2 - 44, 140, 40, '快速重开', () => {
      this.failPopup?.destroy();
      this.failPopup = null;
      this.handleRestart();
    });
    const btnMenu = this.makeButton(90, h / 2 - 44, 140, 40, '返回菜单', () => {
      this.failPopup?.destroy();
      this.failPopup = null;
      this.cleanup();
      this.scene.start('level_select');
    });
    cont.add([bg, title, tip, btnRetry, btnMenu]);
    cont.setAlpha(0);
    this.tweens.add({
      targets: cont,
      alpha: 1,
      duration: 300,
      ease: 'Cubic.easeOut',
    });
    this.failPopup = cont;
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const cont = this.add.container(x, y);
    const normalColor = GameConfig.Colors.ACCENT;
    const hoverColor = GameConfig.Colors.PLAYER;
    const g = this.add.graphics();
    g.fillStyle(normalColor, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([g, text]);
    cont.setSize(w, h);
    cont.setInteractive({ useHandCursor: true });
    cont.on('pointerover', () => {
      g.clear();
      g.fillStyle(hoverColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.6);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
      cont.setScale(1.05);
    });
    cont.on('pointerout', () => {
      g.clear();
      g.fillStyle(normalColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
      cont.setScale(1);
    });
    cont.on('pointerdown', () => {
      this.audioSys.playSfx('click');
      onClick();
    });
    return cont;
  }

  update(time: number): void {
    this.inputSys.update(time);
  }

  private cleanup(): void {
    this.inputSys?.destroy();
    this.audioSys?.destroy();
    this.gameRenderer?.destroy();
    this.hud?.destroy();
  }

  shutdown(): void {
    this.cleanup();
  }

  destroy(): void {
    this.cleanup();
  }
}

export { GameEngine, Renderer };
