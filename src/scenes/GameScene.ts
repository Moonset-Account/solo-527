import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '@/config/GameConfig';
import { LevelData, EntityData, Direction, ResultData } from '@/types';
import { GridSystem } from '@/systems/GridSystem';
import { PushSystem } from '@/systems/PushSystem';
import { ClueSystem } from '@/systems/ClueSystem';
import { StepSystem } from '@/systems/StepSystem';
import { IndexCardSystem } from '@/systems/IndexCardSystem';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { SaveSystem } from '@/systems/SaveSystem';

import tutorialLevel from '@/data/levels/tutorial_01.json';
import level01 from '@/data/levels/level_01.json';
import level02 from '@/data/levels/level_02.json';
import level03 from '@/data/levels/level_03.json';

const LEVEL_MAP: Record<string, LevelData> = {
  tutorial_01: tutorialLevel as LevelData,
  level_01: level01 as LevelData,
  level_02: level02 as LevelData,
  level_03: level03 as LevelData,
};

export class GameScene extends Phaser.Scene {
  private grid!: GridSystem;
  private pushSystem!: PushSystem;
  private clueSystem!: ClueSystem;
  private stepSystem!: StepSystem;
  private indexCardSystem!: IndexCardSystem;
  private inputSystem!: InputSystem;
  private audioSystem!: AudioSystem;
  private saveSystem!: SaveSystem;

  private levelData!: LevelData;
  private player!: Phaser.GameObjects.Container;
  private playerGridX: number = 0;
  private playerGridY: number = 0;
  private bookSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private isMoving: boolean = false;
  private isPaused: boolean = false;

  private hudSteps!: Phaser.GameObjects.Text;
  private hudClues!: Phaser.GameObjects.Text;
  private pauseBtn!: Phaser.GameObjects.Text;
  private cluePanel!: Phaser.GameObjects.Container;
  private cluePanelVisible: boolean = false;

  private collectedClues: Array<{ id: string; text: string; bookId: string }> = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const levelId = this.game.registry.get('currentLevelId') || 'level_01';
    this.loadLevel(levelId);

    this.saveSystem = this.game.registry.get('saveSystem');
    this.audioSystem = new AudioSystem(this, this.saveSystem);
    this.inputSystem = new InputSystem(this);

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
      this.input.keyboard.on('keydown-TAB', () => this.toggleCluePanel());
    }
  }

  private loadLevel(levelId: string): void {
    const data = LEVEL_MAP[levelId];
    if (!data) {
      console.error('Level not found:', levelId);
      this.scene.start('MainMenuScene');
      return;
    }
    this.levelData = data;
    this.collectedClues = [];
    this.isMoving = false;
    this.isPaused = false;

    this.grid = new GridSystem(this);
    this.grid.loadLevel(this.levelData);

    this.pushSystem = new PushSystem(this, this.grid);
    this.clueSystem = new ClueSystem(this);
    this.stepSystem = new StepSystem(this.levelData.maxSteps);
    this.indexCardSystem = new IndexCardSystem(this);

    this.createEntities();
    this.createPlayer();
    this.createHUD();
    this.createCluePanel();

    this.stepSystem.onStep((steps, max) => {
      this.hudSteps.setText(`步数: ${steps}/${max}`);
    });
    this.stepSystem.onExceed(() => {
      this.time.delayedCall(300, () => this.showResult('failure'));
    });

    this.log('info', `Level loaded: ${levelId} - ${this.levelData.name}`);
  }

  private createEntities(): void {
    for (const entity of this.levelData.entities) {
      const worldPos = this.grid.gridToWorld(entity.x, entity.y);

      switch (entity.type) {
        case 'bookshelf': {
          const container = this.add.container(worldPos.x, worldPos.y);
          const sprite = this.add.sprite(0, 0, 'bookshelf');
          container.add(sprite);
          this.pushSystem.addPushable(entity.bookId || `shelf_${entity.x}_${entity.y}`, entity, container);
          break;
        }
        case 'book': {
          const container = this.add.container(worldPos.x, worldPos.y);
          const sprite = this.add.sprite(0, 0, 'book');
          if (entity.isMisplaced) {
            const marker = this.add.circle(0, -16, 4, COLORS.failure);
            container.add([sprite, marker]);
          } else {
            container.add(sprite);
          }
          this.bookSprites.set(entity.bookId || `book_${entity.x}_${entity.y}`, container);
          break;
        }
        case 'clue_item': {
          this.clueSystem.addClue(
            this.levelData.clues.find(c => c.bookId === entity.bookId) || { id: `clue_${entity.x}_${entity.y}`, text: '线索', bookId: entity.bookId || '', x: entity.x, y: entity.y },
            worldPos.x,
            worldPos.y
          );
          break;
        }
        case 'index_card': {
          this.indexCardSystem.addCard(
            `card_${entity.x}_${entity.y}`,
            entity.x, entity.y,
            worldPos.x, worldPos.y,
            entity.bookId || ''
          );
          break;
        }
      }
    }
  }

  private createPlayer(): void {
    const startPos = this.grid.gridToWorld(this.levelData.playerStart.x, this.levelData.playerStart.y);
    this.playerGridX = this.levelData.playerStart.x;
    this.playerGridY = this.levelData.playerStart.y;

    this.player = this.add.container(startPos.x, startPos.y);
    const sprite = this.add.sprite(0, 0, 'player');
    const lamp = this.add.circle(0, -2, 30, 0xe6a817, 0.06);
    this.player.add([lamp, sprite]);
    this.player.setDepth(10);
  }

  private createHUD(): void {
    const hudBg = this.add.rectangle(GAME_WIDTH / 2, 18, GAME_WIDTH, 36, 0x0a0a1a, 0.85);
    hudBg.setDepth(20);

    this.hudSteps = this.add.text(20, 18, `步数: 0/${this.levelData.maxSteps}`, {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0, 0.5).setDepth(20);

    this.hudClues = this.add.text(GAME_WIDTH / 2, 18, '线索: 0', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#60a5fa',
    }).setOrigin(0.5).setDepth(20);

    this.pauseBtn = this.add.text(GAME_WIDTH - 20, 18, '暂停 [ESC]', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(1, 0.5).setDepth(20).setInteractive({ useHandCursor: true });
    this.pauseBtn.on('pointerdown', () => this.togglePause());

    const clueBtn = this.add.text(GAME_WIDTH - 120, 18, '线索[TAB]', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#60a5fa',
    }).setOrigin(1, 0.5).setDepth(20).setInteractive({ useHandCursor: true });
    clueBtn.on('pointerdown', () => this.toggleCluePanel());
  }

  private createCluePanel(): void {
    this.cluePanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.cluePanel.setDepth(30);

    const bg = this.add.rectangle(0, 0, 400, 300, 0x0f3460, 0.95);
    bg.setStrokeStyle(2, COLORS.accent, 0.5);
    this.cluePanel.add(bg);

    const title = this.add.text(0, -120, '已收集线索', {
      fontSize: '20px', fontFamily: 'serif', color: '#e6a817',
    }).setOrigin(0.5);
    this.cluePanel.add(title);

    this.cluePanel.setVisible(false);
  }

  private toggleCluePanel(): void {
    this.cluePanelVisible = !this.cluePanelVisible;
    if (this.cluePanelVisible) {
      this.updateCluePanel();
      this.cluePanel.setVisible(true);
    } else {
      this.cluePanel.setVisible(false);
    }
  }

  private updateCluePanel(): void {
    while (this.cluePanel.length > 2) {
      const child = this.cluePanel.getAt(this.cluePanel.length - 1);
      this.cluePanel.remove(child as Phaser.GameObjects.GameObject, true);
    }

    if (this.collectedClues.length === 0) {
      const noClue = this.add.text(0, 0, '尚未收集到线索', {
        fontSize: '14px', fontFamily: 'sans-serif', color: '#9ca3af',
      }).setOrigin(0.5);
      this.cluePanel.add(noClue);
    } else {
      for (let i = 0; i < this.collectedClues.length; i++) {
        const clue = this.collectedClues[i];
        const text = this.add.text(0, -80 + i * 40, clue.text, {
          fontSize: '14px', fontFamily: 'sans-serif', color: '#f0e6d3', align: 'center',
          wordWrap: { width: 350 },
        }).setOrigin(0.5);
        this.cluePanel.add(text);
      }
    }

    const closeHint = this.add.text(0, 130, '按 TAB 关闭', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#6b7280',
    }).setOrigin(0.5);
    this.cluePanel.add(closeHint);
  }

  private togglePause(): void {
    if (this.isPaused) {
      this.scene.resume('GameScene');
      this.scene.stop('PauseScene');
      this.isPaused = false;
    } else {
      this.isPaused = true;
      this.scene.launch('PauseScene');
      this.scene.pause('GameScene');
    }
  }

  private movePlayer(direction: Direction): void {
    if (this.isMoving || this.isPaused || this.cluePanelVisible) return;

    const { newX, newY } = this.getNewPos(this.playerGridX, this.playerGridY, direction);

    if (!this.grid.isWalkable(newX, newY)) return;

    const pushableKey = this.pushSystem.getEntityAt(newX, newY);
    if (pushableKey) {
      if (!this.pushSystem.canPush(pushableKey, direction)) return;
      this.pushSystem.push(pushableKey, direction);
    }

    this.playerGridX = newX;
    this.playerGridY = newY;
    this.isMoving = true;

    const worldPos = this.grid.gridToWorld(newX, newY);
    this.tweens.add({
      targets: this.player,
      x: worldPos.x,
      y: worldPos.y,
      duration: 120,
      ease: 'Power1',
      onComplete: () => {
        this.isMoving = false;
        this.checkTileInteractions();
      },
    });

    const canContinue = this.stepSystem.step();
    this.audioSystem.playSfx('step');

    this.checkBookPlacement();
  }

  private checkTileInteractions(): void {
    const clue = this.clueSystem.tryCollect(this.playerGridX, this.playerGridY);
    if (clue) {
      this.collectedClues.push({ id: clue.id, text: clue.text, bookId: clue.bookId });
      this.hudClues.setText(`线索: ${this.clueSystem.getCollectedCount()}`);
      this.audioSystem.playSfx('collect');
    }
  }

  private checkBookPlacement(): void {
    for (const entity of this.levelData.entities) {
      if (entity.type === 'book' && entity.isMisplaced && entity.targetX !== undefined && entity.targetY !== undefined) {
        const bookKey = entity.bookId || `book_${entity.x}_${entity.y}`;
        const sprite = this.bookSprites.get(bookKey);
        if (sprite) {
          const bookWorldPos = this.grid.worldToGrid(sprite.x, sprite.y);
          if (bookWorldPos.x === entity.targetX && bookWorldPos.y === entity.targetY) {
            entity.isMisplaced = false;
            const marker = sprite.getAt(1) as Phaser.GameObjects.GameObject;
            if (marker) {
              this.tweens.add({ targets: marker, alpha: 0, duration: 300 });
            }
            this.indexCardSystem.tryFix(entity.targetX, entity.targetY, entity.bookId || '');
            this.audioSystem.playSfx('place');
            this.log('info', `Book ${entity.bookId} placed correctly at (${entity.targetX},${entity.targetY})`);
          }
        }
      }
    }

    if (this.indexCardSystem.isAllFixed()) {
      this.time.delayedCall(500, () => this.showResult('success'));
    }
  }

  private showResult(result: 'success' | 'failure'): void {
    const steps = this.stepSystem.getSteps();
    const maxSteps = this.stepSystem.getMaxSteps();
    let stars = 0;
    if (result === 'success') {
      const ratio = steps / maxSteps;
      if (ratio <= 0.5) stars = 3;
      else if (ratio <= 0.75) stars = 2;
      else stars = 1;
    }

    const resultData: ResultData = {
      result,
      levelId: this.levelData.id,
      steps,
      maxSteps,
      stars,
      collectedClues: this.clueSystem.getCollectedCount(),
      totalClues: this.clueSystem.getTotalCount(),
    };

    this.game.registry.set('lastResult', resultData);

    if (result === 'success') {
      this.saveSystem.saveLevelResult(this.levelData.id, true, steps, stars);
    }

    this.scene.start('ResultScene');
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) return;
    this.inputSystem.update(delta);

    const dir = this.inputSystem.getDirection();
    if (dir) this.movePlayer(dir);
  }

  private getNewPos(x: number, y: number, dir: Direction): { newX: number; newY: number } {
    switch (dir) {
      case 'up': return { newX: x, newY: y - 1 };
      case 'down': return { newX: x, newY: y + 1 };
      case 'left': return { newX: x - 1, newY: y };
      case 'right': return { newX: x + 1, newY: y };
    }
  }

  private log(level: string, message: string, data?: unknown): void {
    const logs = this.game.registry.get('debugLogs') as Array<{ timestamp: number; level: string; message: string; data?: unknown }>;
    if (logs) logs.push({ timestamp: Date.now(), level, message, data });
  }
}
