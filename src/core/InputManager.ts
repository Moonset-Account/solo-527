import { EventBus } from './EventBus';

export type LogicalInputEvent =
  | 'pointer_move'
  | 'pointer_down'
  | 'pointer_up'
  | 'pointer_drag_start'
  | 'pointer_drag'
  | 'pointer_drag_end'
  | 'key_down'
  | 'key_up'
  | 'select'
  | 'cancel'
  | 'wire'
  | 'tool_prev'
  | 'tool_next';

export interface PointerPos {
  x: number;
  y: number;
}

export interface PointerEvent {
  pos: PointerPos;
  button: number;
  dragging: boolean;
}

export interface KeyInputEvent {
  key: string;
  code: string;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  preventDefault: () => void;
}

export interface GamepadAxisEvent {
  x: number;
  y: number;
}

export interface InputEvents {
  pointer_move: PointerEvent;
  pointer_down: PointerEvent;
  pointer_up: PointerEvent;
  pointer_drag_start: PointerEvent;
  pointer_drag: PointerEvent;
  pointer_drag_end: PointerEvent;
  key_down: KeyInputEvent;
  key_up: KeyInputEvent;
  select: void;
  cancel: void;
  wire: void;
  tool_prev: void;
  tool_next: void;
  gamepad_axis: GamepadAxisEvent;
}

export class InputManager {
  private bus: EventBus<InputEvents>;
  private pointer: PointerPos = { x: 0, y: 0 };
  private isPointerDown = false;
  private isDragging = false;
  private dragStartThreshold = 4;
  private downPos: PointerPos = { x: 0, y: 0 };
  private keys: Set<string> = new Set();
  private pressedKeys: Set<string> = new Set();
  private target: HTMLElement | Window;
  private attached = false;
  private gamepadPrevButtons: Array<boolean[]> = [];
  private gamepadAxisThreshold = 0.25;

  private listeners: Array<{ remove: () => void }> = [];

  constructor(target: HTMLElement | Window = window) {
    this.bus = new EventBus<InputEvents>();
    this.target = target;
  }

  attach(): void {
    if (this.attached) return;
    this.attached = true;

    const el = this.target as HTMLElement;

    const onMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
    const onMouseDown = (e: MouseEvent) => this.handleMouseDown(e);
    const onMouseUp = (e: MouseEvent) => this.handleMouseUp(e);
    const onTouchStart = (e: TouchEvent) => this.handleTouchStart(e);
    const onTouchMove = (e: TouchEvent) => this.handleTouchMove(e);
    const onTouchEnd = (e: TouchEvent) => this.handleTouchEnd(e);
    const onKeyDown = (e: globalThis.KeyboardEvent) => this.handleKeyDown(e);
    const onKeyUp = (e: globalThis.KeyboardEvent) => this.handleKeyUp(e);
    const onBlur = () => this.handleBlur();

    el.addEventListener('mousemove', onMouseMove as any);
    el.addEventListener('mousedown', onMouseDown as any);
    window.addEventListener('mouseup', onMouseUp as any);
    el.addEventListener('touchstart', onTouchStart as any, { passive: false });
    el.addEventListener('touchmove', onTouchMove as any, { passive: false });
    window.addEventListener('touchend', onTouchEnd as any);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    this.listeners.push(
      { remove: () => el.removeEventListener('mousemove', onMouseMove as any) },
      { remove: () => el.removeEventListener('mousedown', onMouseDown as any) },
      { remove: () => window.removeEventListener('mouseup', onMouseUp as any) },
      { remove: () => el.removeEventListener('touchstart', onTouchStart as any) },
      { remove: () => el.removeEventListener('touchmove', onTouchMove as any) },
      { remove: () => window.removeEventListener('touchend', onTouchEnd as any) },
      { remove: () => window.removeEventListener('keydown', onKeyDown) },
      { remove: () => window.removeEventListener('keyup', onKeyUp) },
      { remove: () => window.removeEventListener('blur', onBlur) }
    );
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    for (const l of this.listeners) l.remove();
    this.listeners = [];
    this.isPointerDown = false;
    this.isDragging = false;
    this.keys.clear();
    this.pressedKeys.clear();
  }

  subscribe<K extends keyof InputEvents>(
    event: K,
    cb: (payload: InputEvents[K]) => void
  ): () => void {
    return this.bus.on(event, cb);
  }

  update(_dt: number): void {
    this.updateGamepad();
    this.pressedKeys.clear();
  }

  getPointerPos(): PointerPos {
    return { ...this.pointer };
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  wasKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  private getCanvasPos(clientX: number, clientY: number): PointerPos {
    if (this.target === window) {
      return { x: clientX, y: clientY };
    }
    const rect = (this.target as HTMLElement).getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  private handleMouseMove(e: MouseEvent): void {
    this.pointer = this.getCanvasPos(e.clientX, e.clientY);
    const evt: PointerEvent = {
      pos: this.pointer,
      button: e.button,
      dragging: this.isDragging,
    };
    this.bus.emit('pointer_move', evt);
    if (this.isPointerDown) {
      if (!this.isDragging) {
        const dx = this.pointer.x - this.downPos.x;
        const dy = this.pointer.y - this.downPos.y;
        if (dx * dx + dy * dy >= this.dragStartThreshold * this.dragStartThreshold) {
          this.isDragging = true;
          this.bus.emit('pointer_drag_start', { ...evt, dragging: true });
        }
      }
      if (this.isDragging) {
        this.bus.emit('pointer_drag', { ...evt, dragging: true });
      }
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isPointerDown = true;
    this.downPos = this.getCanvasPos(e.clientX, e.clientY);
    this.pointer = this.downPos;
    this.bus.emit('pointer_down', {
      pos: this.pointer,
      button: e.button,
      dragging: false,
    });
  }

  private handleMouseUp(e: MouseEvent): void {
    const wasDragging = this.isDragging;
    const pos = this.getCanvasPos(e.clientX, e.clientY);
    if (wasDragging) {
      this.bus.emit('pointer_drag_end', {
        pos,
        button: e.button,
        dragging: true,
      });
    }
    this.isPointerDown = false;
    this.isDragging = false;
    this.bus.emit('pointer_up', {
      pos,
      button: e.button,
      dragging: wasDragging,
    });
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      e.preventDefault();
      const t = e.touches[0];
      this.isPointerDown = true;
      this.downPos = this.getCanvasPos(t.clientX, t.clientY);
      this.pointer = this.downPos;
      this.bus.emit('pointer_down', {
        pos: this.pointer,
        button: 0,
        dragging: false,
      });
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length > 0) {
      e.preventDefault();
      const t = e.touches[0];
      this.pointer = this.getCanvasPos(t.clientX, t.clientY);
      const evt: PointerEvent = {
        pos: this.pointer,
        button: 0,
        dragging: this.isDragging,
      };
      this.bus.emit('pointer_move', evt);
      if (this.isPointerDown) {
        if (!this.isDragging) {
          const dx = this.pointer.x - this.downPos.x;
          const dy = this.pointer.y - this.downPos.y;
          if (dx * dx + dy * dy >= this.dragStartThreshold * this.dragStartThreshold) {
            this.isDragging = true;
            this.bus.emit('pointer_drag_start', { ...evt, dragging: true });
          }
        }
        if (this.isDragging) {
          this.bus.emit('pointer_drag', { ...evt, dragging: true });
        }
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    const wasDragging = this.isDragging;
    const pos = this.pointer;
    if (wasDragging) {
      this.bus.emit('pointer_drag_end', {
        pos,
        button: 0,
        dragging: true,
      });
    }
    this.isPointerDown = false;
    this.isDragging = false;
    this.bus.emit('pointer_up', {
      pos,
      button: 0,
      dragging: wasDragging,
    });
    if (e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      this.pointer = this.getCanvasPos(t.clientX, t.clientY);
    }
  }

  private handleKeyDown(e: globalThis.KeyboardEvent): void {
    const key = e.key.toLowerCase();
    const code = e.code;
    const alreadyDown = this.keys.has(key);
    this.keys.add(key);
    if (!alreadyDown) {
      this.pressedKeys.add(key);
      const evt: KeyInputEvent = {
        key,
        code,
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        preventDefault: () => e.preventDefault(),
      };
      this.bus.emit('key_down', evt);
      this.handleLogicalKeyDown(key, code);
    }
  }

  private handleKeyUp(e: globalThis.KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    this.bus.emit('key_up', {
      key,
      code: e.code,
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      preventDefault: () => e.preventDefault(),
    });
  }

  private handleBlur(): void {
    this.keys.clear();
    this.pressedKeys.clear();
    this.isPointerDown = false;
    this.isDragging = false;
  }

  private handleLogicalKeyDown(key: string, code: string): void {
    if (code === 'Enter' || code === 'Space') this.bus.emit('select', undefined as any);
    if (code === 'Escape') this.bus.emit('cancel', undefined as any);
    if (key === 'e' || key === 'w') this.bus.emit('wire', undefined as any);
    if (code === 'BracketLeft' || key === 'q') this.bus.emit('tool_prev', undefined as any);
    if (code === 'BracketRight' || key === 'r') this.bus.emit('tool_next', undefined as any);
  }

  private updateGamepad(): void {
    const gamepads = navigator.getGamepads
      ? navigator.getGamepads()
      : (navigator as any).webkitGetGamepads
      ? (navigator as any).webkitGetGamepads()
      : [];

    for (const gp of gamepads) {
      if (!gp) continue;

      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      if (Math.abs(ax) > this.gamepadAxisThreshold || Math.abs(ay) > this.gamepadAxisThreshold) {
        this.bus.emit('gamepad_axis', { x: ax, y: ay });
      }

      const prev = this.gamepadPrevButtons[gp.index] ?? [];
      const buttons: { [k: number]: keyof InputEvents } = {
        0: 'select',
        1: 'cancel',
        2: 'wire',
        4: 'tool_prev',
        5: 'tool_next',
      };

      for (const [idx, eventName] of Object.entries(buttons)) {
        const i = Number(idx);
        const pressed = gp.buttons[i]?.pressed ?? false;
        const was = prev[i] ?? false;
        if (pressed && !was) {
          this.bus.emit(eventName, undefined as any);
        }
      }
      this.gamepadPrevButtons[gp.index] = gp.buttons.map((b: GamepadButton) => b.pressed);
    }
  }
}
