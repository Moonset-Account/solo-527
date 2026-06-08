type WorldTransformFn = (sx: number, sy: number) => { x: number; y: number };

class InputManager {
  private canvas: HTMLCanvasElement | null = null;

  private screenX = 0;
  private screenY = 0;
  private mouseDownButtons = new Set<number>();
  private mouseClickedButtons = new Set<number>();
  private clickConsumed = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragging = false;
  private mouseDownPos = { x: 0, y: 0 };
  private scrollDeltaX = 0;
  private scrollDeltaY = 0;
  private worldTransformFn: WorldTransformFn | null = null;

  private keysDown = new Set<string>();
  private keysJustPressed = new Set<string>();
  private keysJustReleased = new Set<string>();
  private keysConsumed = new Set<string>();

  private actionBindings = new Map<string, string[]>();

  private touchId: number | null = null;

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('dblclick', this.onDblClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd);
    canvas.addEventListener('touchcancel', this.onTouchEnd);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy() {
    if (!this.canvas) return;
    const c = this.canvas;

    c.removeEventListener('mousedown', this.onMouseDown);
    c.removeEventListener('mouseup', this.onMouseUp);
    c.removeEventListener('mousemove', this.onMouseMove);
    c.removeEventListener('wheel', this.onWheel);
    c.removeEventListener('dblclick', this.onDblClick);

    c.removeEventListener('touchstart', this.onTouchStart);
    c.removeEventListener('touchmove', this.onTouchMove);
    c.removeEventListener('touchend', this.onTouchEnd);
    c.removeEventListener('touchcancel', this.onTouchEnd);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    this.canvas = null;
  }

  isKeyDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  isKeyPressed(key: string): boolean {
    return this.keysJustPressed.has(key) && !this.keysConsumed.has(key);
  }

  isKeyReleased(key: string): boolean {
    return this.keysJustReleased.has(key);
  }

  isMouseDown(button = 0): boolean {
    return this.mouseDownButtons.has(button);
  }

  isMouseClicked(button = 0): boolean {
    return this.mouseClickedButtons.has(button) && !this.clickConsumed;
  }

  getMousePos(): { screenX: number; screenY: number } {
    return { screenX: this.screenX, screenY: this.screenY };
  }

  setWorldTransform(fn: WorldTransformFn) {
    this.worldTransformFn = fn;
  }

  getWorldPos(): { x: number; y: number } {
    if (this.worldTransformFn) {
      return this.worldTransformFn(this.screenX, this.screenY);
    }
    return { x: this.screenX, y: this.screenY };
  }

  getDragDelta(): { dx: number; dy: number } {
    return {
      dx: this.screenX - this.dragStartX,
      dy: this.screenY - this.dragStartY,
    };
  }

  isDragging(): boolean {
    return this.dragging;
  }

  getScrollDelta(): { dx: number; dy: number } {
    return { dx: this.scrollDeltaX, dy: this.scrollDeltaY };
  }

  consumeClick() {
    this.clickConsumed = true;
  }

  consumeKey(key: string) {
    this.keysConsumed.add(key);
  }

  bindAction(action: string, keys: string[]) {
    this.actionBindings.set(action, keys);
  }

  isActionDown(action: string): boolean {
    const keys = this.actionBindings.get(action);
    if (!keys) return false;
    return keys.some((k) => this.keysDown.has(k));
  }

  isActionPressed(action: string): boolean {
    const keys = this.actionBindings.get(action);
    if (!keys) return false;
    return keys.some((k) => this.isKeyPressed(k));
  }

  endFrame() {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.keysConsumed.clear();
    this.mouseClickedButtons.clear();
    this.clickConsumed = false;
    this.scrollDeltaX = 0;
    this.scrollDeltaY = 0;
  }

  private getCanvasPos(e: MouseEvent): { x: number; y: number } {
    if (!this.canvas) return { x: e.clientX, y: e.clientY };
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private onMouseDown = (e: MouseEvent) => {
    const pos = this.getCanvasPos(e);
    this.screenX = pos.x;
    this.screenY = pos.y;
    this.mouseDownButtons.add(e.button);
    this.mouseDownPos = { x: pos.x, y: pos.y };
    this.dragStartX = pos.x;
    this.dragStartY = pos.y;
    this.dragging = false;
  };

  private onMouseUp = (e: MouseEvent) => {
    const pos = this.getCanvasPos(e);
    this.screenX = pos.x;
    this.screenY = pos.y;
    this.mouseDownButtons.delete(e.button);

    const dx = pos.x - this.mouseDownPos.x;
    const dy = pos.y - this.mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) {
      this.mouseClickedButtons.add(e.button);
    }
    this.dragging = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    const pos = this.getCanvasPos(e);
    this.screenX = pos.x;
    this.screenY = pos.y;

    if (this.mouseDownButtons.size > 0) {
      const dx = pos.x - this.dragStartX;
      const dy = pos.y - this.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 3) {
        this.dragging = true;
      }
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.scrollDeltaX += e.deltaX;
    this.scrollDeltaY += e.deltaY;
  };

  private onDblClick = (_e: MouseEvent) => {};

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.keysDown.has(e.key)) {
      this.keysJustPressed.add(e.key);
    }
    this.keysDown.add(e.key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.key);
    this.keysJustReleased.add(e.key);
  };

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    this.touchId = touch.identifier;
    const pos = this.touchToCanvas(touch);
    this.screenX = pos.x;
    this.screenY = pos.y;
    this.mouseDownButtons.add(0);
    this.mouseDownPos = { x: pos.x, y: pos.y };
    this.dragStartX = pos.x;
    this.dragStartY = pos.y;
    this.dragging = false;
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (this.touchId === null) return;
    const touch = this.findTouch(e, this.touchId);
    if (!touch) return;
    const pos = this.touchToCanvas(touch);
    this.screenX = pos.x;
    this.screenY = pos.y;

    const dx = pos.x - this.dragStartX;
    const dy = pos.y - this.dragStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 3) {
      this.dragging = true;
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (this.touchId === null) return;
    const touch = this.findTouch(e, this.touchId);
    if (touch) {
      const pos = this.touchToCanvas(touch);
      this.screenX = pos.x;
      this.screenY = pos.y;
    }
    this.mouseDownButtons.delete(0);

    const dx = this.screenX - this.mouseDownPos.x;
    const dy = this.screenY - this.mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) {
      this.mouseClickedButtons.add(0);
    }
    this.dragging = false;
    this.touchId = null;
  };

  private touchToCanvas(touch: Touch): { x: number; y: number } {
    if (!this.canvas) return { x: touch.clientX, y: touch.clientY };
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  private findTouch(e: TouchEvent, id: number): Touch | null {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === id) {
        return e.changedTouches[i];
      }
    }
    return null;
  }
}

export const inputManager = new InputManager();
export { InputManager };
