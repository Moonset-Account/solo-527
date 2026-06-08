import { InputMode } from '@/types/game';
import { eventEmitter } from '@/engine/events/emitter';

export interface InputAction {
  type: 'select' | 'add' | 'temperature' | 'confirm' | 'hint' | 'pause' | 'cancel';
  target?: string;
  value?: number;
}

class InputManager {
  private mode: InputMode = 'mouse';
  private canvas: HTMLCanvasElement | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private hoveredObject: string | null = null;
  private keyboardSetup: boolean = false;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseClick: ((e: MouseEvent) => void) | null = null;
  private boundTouchStart: ((e: TouchEvent) => void) | null = null;

  setMode(mode: InputMode): void {
    this.mode = mode;
    eventEmitter.emit('input:modeChanged', mode);
  }

  getMode(): InputMode { return this.mode; }

  init(canvas: HTMLCanvasElement): void {
    if (this.canvas !== canvas) {
      this.detachCanvasListeners();
      this.canvas = canvas;
      this.attachCanvasListeners(canvas);
    }
    if (!this.keyboardSetup) {
      this.setupKeyboard();
      this.keyboardSetup = true;
    }
  }

  destroy(): void {
    this.detachCanvasListeners();
    if (this.keyboardSetup && this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
      this.keyboardSetup = false;
    }
  }

  private attachCanvasListeners(canvas: HTMLCanvasElement): void {
    this.boundMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      eventEmitter.emit('input:move', { x: this.mouseX, y: this.mouseY });
    };
    canvas.addEventListener('mousemove', this.boundMouseMove);

    this.boundMouseClick = (e: MouseEvent) => {
      if (this.mode !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      eventEmitter.emit('input:click', { x, y });
    };
    canvas.addEventListener('click', this.boundMouseClick);

    this.boundTouchStart = (e: TouchEvent) => {
      if (this.mode !== 'touch') return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
      const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
      eventEmitter.emit('input:touch', { x, y });
    };
    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
  }

  private detachCanvasListeners(): void {
    if (this.canvas) {
      if (this.boundMouseMove) this.canvas.removeEventListener('mousemove', this.boundMouseMove);
      if (this.boundMouseClick) this.canvas.removeEventListener('click', this.boundMouseClick);
      if (this.boundTouchStart) this.canvas.removeEventListener('touchstart', this.boundTouchStart);
    }
    this.boundMouseMove = null;
    this.boundMouseClick = null;
    this.boundTouchStart = null;
  }

  private setupKeyboard(): void {
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (this.mode !== 'keyboard') return;
      const keyMap: Record<string, InputAction> = {
        '1': { type: 'select', target: 'apparatus_0' },
        '2': { type: 'select', target: 'apparatus_1' },
        '3': { type: 'select', target: 'apparatus_2' },
        '4': { type: 'select', target: 'apparatus_3' },
        '5': { type: 'select', target: 'apparatus_4' },
        '6': { type: 'select', target: 'apparatus_5' },
        '7': { type: 'add', target: 'reagent_0' },
        '8': { type: 'add', target: 'reagent_1' },
        '9': { type: 'add', target: 'reagent_2' },
        'ArrowUp': { type: 'temperature', value: 5 },
        'ArrowDown': { type: 'temperature', value: -5 },
        ' ': { type: 'confirm' },
        'Enter': { type: 'confirm' },
        'h': { type: 'hint' },
        'p': { type: 'pause' },
        'Escape': { type: 'cancel' },
        'Backspace': { type: 'cancel' },
      };
      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        eventEmitter.emit('input:action', action);
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  getMousePosition(): { x: number; y: number } { return { x: this.mouseX, y: this.mouseY }; }
  setHoveredObject(id: string | null): void { this.hoveredObject = id; }
  getHoveredObject(): string | null { return this.hoveredObject; }

  getKeyHint(action: string): string {
    const hints: Record<InputMode, Record<string, string>> = {
      keyboard: { select: '1-6', add: '7-9', temperature: '↑↓', confirm: 'Enter/Space', hint: 'H', pause: 'P', cancel: 'Esc' },
      mouse: { select: '点击', add: '拖拽', temperature: '滑块', confirm: '点击', hint: '点击', pause: '点击', cancel: '点击' },
      touch: { select: '点选', add: '点选目标', temperature: '旋钮', confirm: '点按', hint: '点按', pause: '点按', cancel: '点按' },
    };
    return hints[this.mode]?.[action] || '';
  }
}

export const inputManager = new InputManager();
