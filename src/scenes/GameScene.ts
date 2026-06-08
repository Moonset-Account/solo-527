import Phaser from 'phaser';
import { LevelConfig, Direction } from '@core/types';
import { configManager } from '@systems/ConfigManager';
import { inputManager } from '@systems/InputManager';
import { audioSystem } from '@systems/AudioSystem';
import { performanceMonitor } from '@systems/PerformanceMonitor';
import { saveSystem } from '@systems/SaveSystem';
import { eventBus, GameEvents } from '@core/EventBus';
import { gameState } from '@core/GameState';
import { GameController } from '@game/GameController';
import { HUD } from '@ui/HUD';
import { NotificationManager } from '@ui/NotificationManager';
import { ResultOverlay } from '@ui/ResultOverlay';
import { COLORS } from '@config/constants';

export class GameScene extends Phaser.Scene {
  private levelId: string = '';
  private level: LevelConfig | null = null;
  private gameController: GameController | null = null;
  private hud: HUD | null = null;
  private notificationManager: NotificationManager | null = null;
  private resultOverlay: ResultOverlay | null = null;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private moveDebounce: number = 0;
  private moveCooldown: number = 0;
  private eventListenerIds: { [key: string]: number } = {};

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelId: string }): void {
    this.levelId = data.levelId || 'level_01';
  }

  preload(): void {}

  create(): void {
    performanceMonitor.reset();

    this.level = configManager.getLevel(this.levelId);
    if (!this.level) {
      this.level = configManager.getFirstLevel();
      if (!this.level) {
        console.error('[GameScene] No level found!');
        this.goToMenu();
        return;
      }
    }

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.gameController = new GameController(this, this.level);
    this.gameController.initialize();

    this.hud = new HUD(this, this.gameController);
    this.notificationManager = new NotificationManager(this);

    inputManager.initialize(this);

    this.setupCamera();

    this.registerEventListeners();

    audioSystem.playAmbient();

    eventBus.emit(GameEvents.LEVEL_START, this.level);
    
    const saved = saveSystem.loadLevelState();
    if (saved && saved.currentLevelId === this.level.id && !saved.isCompleted) {
      this.showResumeOption();
    }

    this.scale.on('resize', () => this.onResize());
  }

  private setupCamera(): void {
    if (!this.level || !this.gameController) return;

    const worldWidth = this.level.width * configManager.getTileSize();
    const worldHeight = this.level.height * configManager.getTileSize();
    
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    
    const viewportW = this.scale.width;
    const viewportH = this.scale.height - 120;
    
    const zoomX = viewportW / worldWidth;
    const zoomY = viewportH / worldHeight;
    const zoom = Math.min(zoomX, zoomY, 1.0);

    this.cameras.main.setZoom(zoom);
    
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2 + 30 / zoom;
    this.cameras.main.centerOn(centerX, centerY);

    performanceMonitor.setEntityCount(
      this.gameController.bookshelves.size +
      this.gameController.clues.size +
      this.gameController.indexCards.size + 1
    );
  }

  private registerEventListeners(): void {
    this.eventListenerIds[GameEvents.GAME_WIN] = eventBus.on(GameEvents.GAME_WIN, (data: any) => this.handleWin(data));
    this.eventListenerIds[GameEvents.GAME_FAIL] = eventBus.on(GameEvents.GAME_FAIL, (data: any) => this.handleFail(data));
    this.eventListenerIds[GameEvents.LEVEL_RESTART] = eventBus.on(GameEvents.LEVEL_RESTART, () => this.handleRestart());
    this.eventListenerIds[GameEvents.BOOKSHELF_MOVED] = eventBus.on(GameEvents.BOOKSHELF_MOVED, (data: any) => this.onBookshelfMoved(data));
  }

  update(time: number, delta: number): void {
    performanceMonitor.startFrame();

    if (!this.gameOver && !this.isPaused) {
      inputManager.update();
      this.handleInput();
      this.gameController?.update(time, delta);
      this.hud?.update(delta);
      gameState.updateTime(delta / 1000);

      if (this.moveCooldown > 0) {
        this.moveCooldown -= delta;
      }
    }

    performanceMonitor.endFrame(delta / 1000);
  }

  private handleInput(): void {
    if (!this.gameController || this.gameOver) return;

    if (inputManager.isPressed('pause') || inputManager.isPressed('menu')) {
      this.goToMenu();
      return;
    }

    if (inputManager.isPressed('restart')) {
      this.handleRestart();
      return;
    }

    if (inputManager.isPressed('undo')) {
      this.gameController.handleUndo();
      return;
    }

    if (inputManager.isPressed('interact')) {
      this.gameController.handleInteract();
      return;
    }

    if (this.moveCooldown > 0) return;

    const moveDir = this.getMoveDirection();
    if (moveDir) {
      const moved = this.gameController.handleMove(moveDir);
      if (moved) {
        this.moveCooldown = 60;
      }
    }
  }

  private getMoveDirection(): Direction | null {
    if (inputManager.isPressed('moveUp')) return 'up';
    if (inputManager.isPressed('moveDown')) return 'down';
    if (inputManager.isPressed('moveLeft')) return 'left';
    if (inputManager.isPressed('moveRight')) return 'right';

    if (this.moveCooldown <= -60) {
      if (inputManager.isDown('moveUp')) return 'up';
      if (inputManager.isDown('moveDown')) return 'down';
      if (inputManager.isDown('moveLeft')) return 'left';
      if (inputManager.isDown('moveRight')) return 'right';
    }

    return null;
  }

  private handleWin(data: { steps: number; time: number }): void {
    if (this.gameOver) return;
    this.gameOver = true;

    audioSystem.play('win');
    this.gameController?.player.winAnimation();

    this.cameras.main.flash(400, 255, 255, 255, false);

    this.time.delayedCall(800, () => {
      this.resultOverlay = new ResultOverlay(this, true, {
        onRestart: () => this.handleRestart(),
        onNextLevel: () => this.handleNextLevel(),
        onMenu: () => this.goToMenu()
      });
    });
  }

  private handleFail(data: { reason: string }): void {
    if (this.gameOver) return;
    this.gameOver = true;

    audioSystem.play('fail');
    this.gameController?.player.failAnimation();

    this.cameras.main.shake(400, 0.004);

    this.time.delayedCall(600, () => {
      this.resultOverlay = new ResultOverlay(this, false, {
        onRestart: () => this.handleRestart(),
        onMenu: () => this.goToMenu()
      }, data.reason);
    });
  }

  private handleRestart(): void {
    this.resultOverlay?.destroy();
    this.resultOverlay = null;
    this.gameOver = false;
    this.isPaused = false;

    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(250, () => {
      this.cleanup();
      this.scene.restart({ levelId: this.levelId });
    });
  }

  private handleNextLevel(): void {
    const next = configManager.getNextLevel(this.levelId);
    if (next) {
      this.resultOverlay?.destroy();
      this.resultOverlay = null;
      this.gameOver = false;

      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.cleanup();
        this.scene.start('GameScene', { levelId: next.id });
      });
    } else {
      eventBus.emit(GameEvents.NOTIFICATION, {
        message: '🎉 恭喜！你完成了所有内置关卡！',
        type: 'success',
        duration: 4000
      });
      this.time.delayedCall(1500, () => this.goToMenu());
    }
  }

  private goToMenu(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.cleanup();
      this.scene.start('MenuScene');
    });
  }

  private onBookshelfMoved(data: { id: string; position: any }): void {
    performanceMonitor.addEntity(0);
  }

  private showResumeOption(): void {
    eventBus.emit(GameEvents.NOTIFICATION, {
      message: '检测到上次未完成的进度，按 R 重置关卡',
      type: 'info',
      duration: 4000
    });
  }

  private onResize(): void {
    if (this.gameController && this.level) {
      const newTileSize = configManager.calculateRequiredTileSize(
        this.level.width,
        this.level.height,
        this.scale.width * 0.92,
        (this.scale.height - 160) * 0.95
      );
      configManager.setTileSize(newTileSize);
      this.gameController.resizeTileSize(newTileSize);
      this.setupCamera();
    }
    this.hud?.resize();
  }

  private cleanup(): void {
    Object.entries(this.eventListenerIds).forEach(([event, id]) => {
      eventBus.off(event, id);
    });
    this.eventListenerIds = {};

    this.gameController?.destroy();
    this.hud?.destroy();
    this.notificationManager?.destroy();
    this.resultOverlay?.destroy();

    this.gameController = null;
    this.hud = null;
    this.notificationManager = null;
    this.resultOverlay = null;
  }

  destroy(): void {
    this.cleanup();
  }
}
