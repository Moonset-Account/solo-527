import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { MenuScene } from '@scenes/MenuScene';
import { GameScene } from '@scenes/GameScene';
import { EditorScene } from '@scenes/EditorScene';
import { DEFAULT_SETTINGS } from '@config/defaults';
import { COLORS } from '@config/constants';

class GameApp {
  private game: Phaser.Game;
  private config: Phaser.Types.Core.GameConfig;

  constructor() {
    const container = document.getElementById('game-container') || document.body;
    const targetFPS = DEFAULT_SETTINGS.targetFPS;

    this.config = {
      type: Phaser.AUTO,
      parent: container,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: `#${COLORS.bg.toString(16).padStart(6, '0')}`,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
      },
      fps: {
        target: targetFPS,
        forceSetTimeOut: false
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance',
        batchSize: 2048,
        maxLights: 10
      },
      physics: undefined,
      input: {
        activePointers: 3,
        gamepad: true,
        keyboard: {
          capture: [
            Phaser.Input.Keyboard.KeyCodes.SPACE,
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.W,
            Phaser.Input.Keyboard.KeyCodes.A,
            Phaser.Input.Keyboard.KeyCodes.S,
            Phaser.Input.Keyboard.KeyCodes.D,
            Phaser.Input.Keyboard.KeyCodes.E,
            Phaser.Input.Keyboard.KeyCodes.Z,
            Phaser.Input.Keyboard.KeyCodes.R,
            Phaser.Input.Keyboard.KeyCodes.ESC,
            Phaser.Input.Keyboard.KeyCodes.P,
            Phaser.Input.Keyboard.KeyCodes.F1,
            Phaser.Input.Keyboard.KeyCodes.F2
          ]
        }
      },
      dom: {
        createContainer: false
      },
      scene: [
        BootScene,
        MenuScene,
        GameScene,
        EditorScene
      ],
      callbacks: {
        postBoot: this.onPostBoot.bind(this)
      }
    };

    this.game = new Phaser.Game(this.config);

    window.addEventListener('resize', this.handleResize.bind(this));
    document.addEventListener('contextmenu', (e) => {
      if ((e.target as HTMLElement)?.closest('#game-container')) {
        e.preventDefault();
      }
    });

    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  private onPostBoot(game: Phaser.Game): void {
    console.log('[GameApp] Phaser initialized successfully');
    console.log('[GameApp] Renderer:', game.renderer.type === Phaser.CANVAS ? 'Canvas' : 'WebGL');
    console.log('[GameApp] Scenes registered:', game.scene.scenes.length);

    const perf = game.renderer.config;
    console.log('[GameApp] Config:', {
      width: game.scale.width,
      height: game.scale.height,
      targetFPS: this.config.fps?.target || 60,
      batchSize: this.config.render?.batchSize
    });
  }

  private handleResize(): void {
    if (this.game && this.game.scale) {
      this.game.scale.resize(window.innerWidth, window.innerHeight);
    }
  }

  private handleError(event: ErrorEvent): void {
    console.error('[GameApp] Unhandled error:', event.error || event.message);
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    console.error('[GameApp] Unhandled promise rejection:', event.reason);
  }

  public getGame(): Phaser.Game {
    return this.game;
  }

  public destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.game.destroy(true);
  }
}

function bootstrap(): GameApp {
  if (document.readyState === 'loading') {
    let app: GameApp;
    document.addEventListener('DOMContentLoaded', () => {
      app = new GameApp();
    });
    return app!;
  } else {
    return new GameApp();
  }
}

declare global {
  interface Window {
    __NIGHT_BOOKSTORE__: GameApp;
  }
}

const app = bootstrap();
window.__NIGHT_BOOKSTORE__ = app;

export default app;
