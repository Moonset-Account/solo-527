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
  private initialized: boolean = false;

  setMode(mode: InputMode): void {
    this.mode = mode;
    eventEmitter.emit('input:modeChanged', mode);
  }

  getMode(): InputMode { return this.mode; }

  init(canvas: HTMLCanvasElement): void {
    if (this.initialized && this.canvas === canvas) return;
    this.initialized = true;
    this.canvas = canvas;
    this.setupMouse(canvas);
    this.setupKeyboard();
    this.setupTouch(canvas);
  }

  private setupMouse(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      eventEmitter.emit('input:move', { x: this.mouseX, y: this.mouseY });
    });
    canvas.addEventListener('click', (e) => {
      if (this.mode !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      eventEmitter.emit('input:click', { x, y });
    });
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
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
        'Escape': { type: 'pause' },
        'Backspace': { type: 'cancel' },
      };
      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        eventEmitter.emit('input:action', action);
      }
    });
  }

  private setupTouch(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('touchstart', (e) => {
      if (this.mode !== 'touch') return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
      const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
      eventEmitter.emit('input:touch', { x, y });
    }, { passive: false });
  }

  getMousePosition(): { x: number; y: number } { return { x: this.mouseX, y: this.mouseY }; }
  setHoveredObject(id: string | null): void { this.hoveredObject = id; }
  getHoveredObject(): string | null { return this.hoveredObject; }

  getKeyHint(action: string): string {
    const hints: Record<InputMode, Record<string, string>> = {
      keyboard: { select: '1-6', add: '7-9', temperature: '↑↓', confirm: 'Enter/Space', hint: 'H', pause: 'Esc' },
      mouse: { select: '点击', add: '拖拽', temperature: '滑块', confirm: '点击', hint: '点击', pause: '点击' },
      touch: { select: '点选', add: '点选目标', temperature: '旋钮', confirm: '点按', hint: '点按', pause: '点按' },
    };
    return hints[this.mode]?.[action] || '';
  }
}

export const inputManager = new InputManager();
