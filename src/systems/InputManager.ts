import { InputAction, InputMapping, GameSettings } from '@core/types';
import { DEFAULT_SETTINGS } from '@config/defaults';
import { eventBus, GameEvents } from '@core/EventBus';

type InputState = Record<InputAction, boolean>;

export class InputManager {
  private static instance: InputManager;
  private scene: Phaser.Scene | null = null;
  private mapping: InputMapping;
  private currentState: InputState;
  private previousState: InputState;
  private pressedEvents: Set<InputAction> = new Set();
  private gamepadIndex: number = 0;
  private keyboardListeners: Phaser.Input.Keyboard.Key[] = [];

  private constructor() {
    this.mapping = DEFAULT_SETTINGS.inputRemap;
    this.currentState = this.createEmptyState();
    this.previousState = this.createEmptyState();
  }

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private createEmptyState(): InputState {
    return {
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false,
      interact: false,
      undo: false,
      restart: false,
      pause: false,
      menu: false,
      editorToggle: false
    };
  }

  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupKeyboard();
    this.setupGamepad();
  }

  private setupKeyboard(): void {
    if (!this.scene) return;
    
    this.keyboardListeners.forEach(k => k.removeAllListeners());
    this.keyboardListeners = [];

    const allKeys = new Set<string>();
    Object.values(this.mapping.keyboard).forEach(keys => {
      keys.forEach(k => allKeys.add(k));
    });

    allKeys.forEach(keyCode => {
      const key = this.scene!.input.keyboard!.addKey(keyCode);
      this.keyboardListeners.push(key);
    });
  }

  private setupGamepad(): void {
    if (!this.scene) return;
    this.scene.input.gamepad?.on('connected', () => {
      eventBus.emit(GameEvents.NOTIFICATION, {
        message: '手柄已连接',
        type: 'info'
      });
    });
  }

  update(): void {
    this.previousState = { ...this.currentState };
    this.pressedEvents.clear();
    
    Object.keys(this.currentState).forEach(key => {
      this.currentState[key as InputAction] = false;
    });

    this.updateKeyboard();
    this.updateGamepad();

    (Object.keys(this.currentState) as InputAction[]).forEach(action => {
      if (this.currentState[action] && !this.previousState[action]) {
        this.pressedEvents.add(action);
      }
    });
  }

  private updateKeyboard(): void {
    if (!this.scene || !this.scene.input.keyboard) return;

    const kb = this.scene.input.keyboard;
    
    (Object.entries(this.mapping.keyboard) as [InputAction, string[]][]).forEach(([action, keys]) => {
      for (const key of keys) {
        const keyObj = kb.addKey(key);
        if (keyObj.isDown) {
          this.currentState[action] = true;
          break;
        }
      }
    });
  }

  private updateGamepad(): void {
    if (!this.scene || !this.scene.input.gamepad) return;

    const gamepadManager = this.scene.input.gamepad;
    const gamepad = gamepadManager.getPad(this.gamepadIndex);
    if (!gamepad) return;

    const axes = {
      h: gamepad.axes[0]?.getValue() || 0,
      v: gamepad.axes[1]?.getValue() || 0
    };

    const deadzone = 0.5;

    if (axes.v < -deadzone || gamepad.up) this.currentState.moveUp = true;
    if (axes.v > deadzone || gamepad.down) this.currentState.moveDown = true;
    if (axes.h < -deadzone || gamepad.left) this.currentState.moveLeft = true;
    if (axes.h > deadzone || gamepad.right) this.currentState.moveRight = true;

    (Object.entries(this.mapping.gamepad) as [InputAction, number[]][]).forEach(([action, buttons]) => {
      for (const btn of buttons) {
        if (gamepad.buttons[btn]?.pressed) {
          this.currentState[action] = true;
          break;
        }
      }
    });
  }

  isDown(action: InputAction): boolean {
    return this.currentState[action];
  }

  isPressed(action: InputAction): boolean {
    return this.pressedEvents.has(action);
  }

  isReleased(action: InputAction): boolean {
    return !this.currentState[action] && this.previousState[action];
  }

  getMoveVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.isDown('moveUp')) y -= 1;
    if (this.isDown('moveDown')) y += 1;
    if (this.isDown('moveLeft')) x -= 1;
    if (this.isDown('moveRight')) x += 1;

    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(2);
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  getMoveDirection(): { x: number; y: number } | null {
    if (this.isPressed('moveUp')) return { x: 0, y: -1 };
    if (this.isPressed('moveDown')) return { x: 0, y: 1 };
    if (this.isPressed('moveLeft')) return { x: -1, y: 0 };
    if (this.isPressed('moveRight')) return { x: 1, y: 0 };

    if (this.pressedEvents.size === 0) {
      if (this.isDown('moveUp')) return { x: 0, y: -1 };
      if (this.isDown('moveDown')) return { x: 0, y: 1 };
      if (this.isDown('moveLeft')) return { x: -1, y: 0 };
      if (this.isDown('moveRight')) return { x: 1, y: 0 };
    }

    return null;
  }

  setInputMapping(mapping: InputMapping): void {
    this.mapping = JSON.parse(JSON.stringify(mapping));
    eventBus.emit(GameEvents.INPUT_REMAPPED, this.mapping);
  }

  getInputMapping(): InputMapping {
    return JSON.parse(JSON.stringify(this.mapping));
  }

  remapKey(action: InputAction, oldKey: string, newKey: string, device: 'keyboard' | 'gamepad'): void {
    if (device === 'keyboard') {
      const keys = this.mapping.keyboard[action];
      const idx = keys.indexOf(oldKey);
      if (idx >= 0) {
        keys[idx] = newKey;
      } else {
        keys.push(newKey);
      }
    } else {
      const keys = this.mapping.gamepad[action];
      const oldKeyNum = Number(oldKey);
      const newKeyNum = Number(newKey);
      const idx = keys.indexOf(oldKeyNum);
      if (idx >= 0) {
        keys[idx] = newKeyNum;
      } else {
        keys.push(newKeyNum);
      }
    }
    eventBus.emit(GameEvents.INPUT_REMAPPED, this.mapping);
  }

  updateSettings(settings: GameSettings): void {
    this.mapping = JSON.parse(JSON.stringify(settings.inputRemap));
  }

  destroy(): void {
    this.keyboardListeners.forEach(k => k.removeAllListeners());
    this.keyboardListeners = [];
  }
}

export const inputManager = InputManager.getInstance();
