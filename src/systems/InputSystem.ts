import Phaser from 'phaser';
import { Direction } from '@/config/GameConfig';

export type GameAction =
  | 'move_up'
  | 'move_down'
  | 'move_left'
  | 'move_right'
  | 'interact'
  | 'cancel'
  | 'pause'
  | 'restart'
  | 'undo'
  | 'confirm';

export interface InputFrame {
  direction: Direction | null;
  actions: Set<GameAction>;
}

interface PressedState {
  keys: Set<string>;
  actions: Set<GameAction>;
  axisUsed: { up: boolean; down: boolean; left: boolean; right: boolean };
}

export class InputSystem {
  private scene: Phaser.Scene;
  private keyMap: Record<string, GameAction>;
  private pressed: PressedState;
  private padDirection: Direction | null = null;
  private lastMoveTime: number = 0;
  private moveCooldown: number = 140;
  private listeners: Map<GameAction, Array<() => void>> = new Map();
  private moveListeners: Array<(dir: Direction) => void> = [];
  private wasPadDirection: Direction | null = null;
  private prevActions: Set<GameAction> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pressed = {
      keys: new Set(),
      actions: new Set(),
      axisUsed: { up: false, down: false, left: false, right: false },
    };
    this.keyMap = {
      UP: 'move_up', W: 'move_up',
      DOWN: 'move_down', S: 'move_down',
      LEFT: 'move_left', A: 'move_left',
      RIGHT: 'move_right', D: 'move_right',
      SPACE: 'interact', ENTER: 'interact', E: 'interact',
      ESCAPE: 'cancel', BACKTICK: 'cancel',
      P: 'pause', TAB: 'pause',
      R: 'restart',
      Z: 'undo', BACKSPACE: 'undo',
      SHIFT: 'confirm',
    };
    this.setupKeyboard();
  }

  private setupKeyboard(): void {
    const input = this.scene.input;
    input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const action = this.keyMap[e.key.length === 1 ? e.key.toUpperCase() : e.code.replace('Key', '').toUpperCase()]
        || this.keyMap[e.code.replace(/^(Arrow|Digit|Numpad)/, '').toUpperCase()]
        || this.keyMap[e.code.toUpperCase()];
      const keyId = e.code || e.key;
      if (this.pressed.keys.has(keyId)) return;
      this.pressed.keys.add(keyId);
      if (action) {
        this.pressed.actions.add(action);
        this.fireAction(action);
      }
    });
    input.keyboard?.on('keyup', (e: KeyboardEvent) => {
      const keyId = e.code || e.key;
      this.pressed.keys.delete(keyId);
      const action = this.keyMap[e.key.length === 1 ? e.key.toUpperCase() : e.code.replace('Key', '').toUpperCase()]
        || this.keyMap[e.code.replace(/^(Arrow|Digit|Numpad)/, '').toUpperCase()]
        || this.keyMap[e.code.toUpperCase()];
      if (action) this.pressed.actions.delete(action);
    });
  }

  onAction(action: GameAction, fn: () => void): void {
    if (!this.listeners.has(action)) this.listeners.set(action, []);
    this.listeners.get(action)!.push(fn);
  }

  onMove(fn: (dir: Direction) => void): void {
    this.moveListeners.push(fn);
  }

  offAction(action: GameAction, fn: () => void): void {
    const arr = this.listeners.get(action);
    if (!arr) return;
    const idx = arr.indexOf(fn);
    if (idx >= 0) arr.splice(idx, 1);
  }

  offMove(fn: (dir: Direction) => void): void {
    const idx = this.moveListeners.indexOf(fn);
    if (idx >= 0) this.moveListeners.splice(idx, 1);
  }

  private fireAction(action: GameAction): void {
    this.listeners.get(action)?.forEach((fn) => {
      try { fn(); } catch (e) { console.error(e); }
    });
  }

  private fireMove(dir: Direction): void {
    this.moveListeners.forEach((fn) => {
      try { fn(dir); } catch (e) { console.error(e); }
    });
  }

  update(timeMs: number): InputFrame {
    this.updateGamepad();

    let dir: Direction | null = null;
    if (this.padDirection) {
      dir = this.padDirection;
    } else {
      if (this.pressed.actions.has('move_up')) dir = 'up';
      else if (this.pressed.actions.has('move_down')) dir = 'down';
      else if (this.pressed.actions.has('move_left')) dir = 'left';
      else if (this.pressed.actions.has('move_right')) dir = 'right';
    }

    if (dir) {
      if (timeMs - this.lastMoveTime >= this.moveCooldown) {
        this.lastMoveTime = timeMs;
        this.fireMove(dir);
      }
    } else {
      this.lastMoveTime = 0;
    }

    const edgeActions = new Set<GameAction>();
    this.pressed.actions.forEach((a) => {
      if (!this.prevActions.has(a)) edgeActions.add(a);
    });
    this.prevActions = new Set(this.pressed.actions);

    return {
      direction: dir,
      actions: edgeActions,
    };
  }

  private updateGamepad(): void {
    const pads = this.scene.input.gamepad?.gamepads || [];
    if (pads.length === 0) {
      this.padDirection = null;
      return;
    }
    const pad = pads[0];
    const AXIS_THRESHOLD = 0.5;
    let newDir: Direction | null = null;

    if (pad.leftStick.y < -AXIS_THRESHOLD || pad.up) newDir = 'up';
    else if (pad.leftStick.y > AXIS_THRESHOLD || pad.down) newDir = 'down';
    else if (pad.leftStick.x < -AXIS_THRESHOLD || pad.left) newDir = 'left';
    else if (pad.leftStick.x > AXIS_THRESHOLD || pad.right) newDir = 'right';

    if (newDir && newDir !== this.wasPadDirection) {
      this.padDirection = newDir;
    } else if (!newDir) {
      this.padDirection = null;
    }
    this.wasPadDirection = newDir;

    if (pad.A && !this.pressed.actions.has('interact')) {
      this.pressed.actions.add('interact');
      this.fireAction('interact');
      setTimeout(() => this.pressed.actions.delete('interact'), 120);
    }
    if (pad.B && !this.pressed.actions.has('cancel')) {
      this.pressed.actions.add('cancel');
      this.fireAction('cancel');
      setTimeout(() => this.pressed.actions.delete('cancel'), 120);
    }
    if ((pad.Y || (pad as any).start || (pad.buttons[9]?.value ?? 0) > 0) && !this.pressed.actions.has('pause')) {
      this.pressed.actions.add('pause');
      this.fireAction('pause');
      setTimeout(() => this.pressed.actions.delete('pause'), 150);
    }
    if (pad.X && !this.pressed.actions.has('restart')) {
      this.pressed.actions.add('restart');
      this.fireAction('restart');
      setTimeout(() => this.pressed.actions.delete('restart'), 200);
    }
    if (pad.L1 && !this.pressed.actions.has('undo')) {
      this.pressed.actions.add('undo');
      this.fireAction('undo');
      setTimeout(() => this.pressed.actions.delete('undo'), 150);
    }
  }

  getDirectionAxis(): { x: number; y: number } {
    const frame = { direction: null as Direction | null, ...{} };
    let dir = frame.direction || this.padDirection;
    if (!dir) {
      if (this.pressed.actions.has('move_up')) dir = 'up';
      else if (this.pressed.actions.has('move_down')) dir = 'down';
      else if (this.pressed.actions.has('move_left')) dir = 'left';
      else if (this.pressed.actions.has('move_right')) dir = 'right';
    }
    switch (dir) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      default: return { x: 0, y: 0 };
    }
  }

  setMoveCooldown(ms: number): void {
    this.moveCooldown = Math.max(40, ms);
  }

  destroy(): void {
    this.listeners.clear();
    this.moveListeners = [];
    this.pressed.keys.clear();
    this.pressed.actions.clear();
  }
}
