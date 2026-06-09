import { globalEventBus, EVENTS } from '../core/EventBus.js';
import { clamp } from '../core/Utils.js';

export class InputManager {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.enabled = true;
    this.mouse = {
      x: 0, y: 0, worldX: 0, worldY: 0,
      down: false, button: 0,
      rightDown: false, clicks: 0,
      lastClickTime: 0,
    };
    this.keyboard = new Set();
    this.gamepadState = null;
    this.touch = { active: false, startX: 0, startY: 0, prevX: 0, prevY: 0, pinchDist: 0 };
    this._dragStart = null;
    this._dragging = false;
    this._handlers = {};
    this._bind();
  }

  enable() { this.enabled = true; }
  disable() { this.enabled = false; }

  on(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const list = this._handlers[event];
    if (!list) return;
    const i = list.indexOf(handler);
    if (i >= 0) list.splice(i, 1);
  }

  emit(event, ...args) {
    globalEventBus.emit(event, ...args);
    if (this._handlers[event]) {
      for (const h of this._handlers[event]) h(...args);
    }
  }

  isKey(k) { return this.keyboard.has(k.toLowerCase()); }

  _bind() {
    const c = this.canvas;

    c.addEventListener('mousemove', (e) => this._onMouseMove(e));
    c.addEventListener('mousedown', (e) => this._onMouseDown(e));
    window.addEventListener('mouseup', (e) => this._onMouseUp(e));
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));

    c.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    c.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    c.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadState = { index: e.gamepad.index };
      this.emit('gamepad:connected', e.gamepad);
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadState = null;
      this.emit('gamepad:disconnected');
    });
  }

  _getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top),
    };
  }

  _onMouseMove(e) {
    if (!this.enabled) return;
    const { x, y } = this._getCanvasPos(e);
    this.mouse.x = x; this.mouse.y = y;
    if (this.renderer) {
      const w = this.renderer.screenToWorld(x, y);
      this.mouse.worldX = w.x; this.mouse.worldY = w.y;
      this.renderer.hover.x = x; this.renderer.hover.y = y;
      this.renderer.hover.worldX = w.x; this.renderer.hover.worldY = w.y;
    }

    if (this._dragging && this._dragStart) {
      const dx = x - this._dragStart.sx;
      const dy = y - this._dragStart.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4 || this._dragStart.button === 2) {
        if (!this._dragging.active) {
          this._dragging.active = true;
          this.emit('drag:start', { ...this._dragStart });
        }
        this.renderer?.pan(
          x - this._dragStart.lastX,
          y - this._dragStart.lastY
        );
        this._dragStart.lastX = x; this._dragStart.lastY = y;
      }
    }
    this.emit('mouse:move', { ...this.mouse });
  }

  _onMouseDown(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const { x, y } = this._getCanvasPos(e);
    this.mouse.down = true;
    this.mouse.button = e.button;
    if (e.button === 2) this.mouse.rightDown = true;
    this._dragStart = {
      sx: x, sy: y, lastX: x, lastY: y,
      worldX: this.mouse.worldX, worldY: this.mouse.worldY,
      button: e.button,
    };
    this._dragging = { active: false };
    this.emit('mouse:down', { ...this.mouse });
  }

  _onMouseUp(e) {
    if (!this.enabled) return;
    const { x, y } = this._getCanvasPos(e);
    const wasDragging = this._dragging?.active;
    const now = performance.now();
    const isDouble = now - this.mouse.lastClickTime < 300;
    this.mouse.lastClickTime = now;

    if (!wasDragging) {
      this.emit('click', {
        x, y,
        worldX: this.mouse.worldX, worldY: this.mouse.worldY,
        button: e.button, double: isDouble,
      });
      if (e.button === 0) {
        this.emit('left_click', { worldX: this.mouse.worldX, worldY: this.mouse.worldY });
        globalEventBus.emit(EVENTS.INPUT_CLICK, { worldX: this.mouse.worldX, worldY: this.mouse.worldY });
      } else if (e.button === 2) {
        this.emit('right_click', { worldX: this.mouse.worldX, worldY: this.mouse.worldY });
      }
    } else {
      this.emit('drag:end', { ...this._dragStart, ex: x, ey: y });
    }

    this.mouse.down = false;
    this.mouse.rightDown = false;
    this._dragStart = null;
    this._dragging = false;
  }

  _onWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const { x, y } = this._getCanvasPos(e);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    this.renderer?.zoomAt(x, y, factor);
    this.emit('zoom', { factor, x, y });
  }

  _onKeyDown(e) {
    if (!this.enabled) return;
    const k = e.key.toLowerCase();
    this.keyboard.add(k);
    this.emit('key:down', k, e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  }

  _onKeyUp(e) {
    this.keyboard.delete(e.key.toLowerCase());
    this.emit('key:up', e.key.toLowerCase(), e);
  }

  _onTouchStart(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const t = e.touches;
    this.touch.active = true;
    if (t.length === 1) {
      this.touch.startX = t[0].clientX;
      this.touch.startY = t[0].clientY;
      this.touch.prevX = t[0].clientX;
      this.touch.prevY = t[0].clientY;
      const rect = this.canvas.getBoundingClientRect();
      const sx = t[0].clientX - rect.left, sy = t[0].clientY - rect.top;
      this._dragStart = { sx, sy, lastX: sx, lastY: sy, button: 0 };
      this._dragging = { active: false };
    } else if (t.length === 2) {
      this.touch.pinchDist = Math.hypot(
        t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY
      );
    }
  }

  _onTouchMove(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const t = e.touches;
    const rect = this.canvas.getBoundingClientRect();
    if (t.length === 1 && this._dragStart) {
      const sx = t[0].clientX - rect.left, sy = t[0].clientY - rect.top;
      if (!this._dragging.active) {
        const dx = sx - this._dragStart.sx;
        const dy = sy - this._dragStart.sy;
        if (Math.abs(dx) + Math.abs(dy) > 6) this._dragging.active = true;
      }
      if (this._dragging.active) {
        this.renderer?.pan(sx - this._dragStart.lastX, sy - this._dragStart.lastY);
      }
      this._dragStart.lastX = sx; this._dragStart.lastY = sy;
    } else if (t.length === 2) {
      const d = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      if (this.touch.pinchDist > 0) {
        const ratio = d / this.touch.pinchDist;
        const cx = (t[0].clientX + t[1].clientX) / 2 - rect.left;
        const cy = (t[0].clientY + t[1].clientY) / 2 - rect.top;
        this.renderer?.zoomAt(cx, cy, ratio);
      }
      this.touch.pinchDist = d;
    }
  }

  _onTouchEnd(e) {
    if (!this.enabled) return;
    e.preventDefault();
    if (!this._dragging?.active && this._dragStart) {
      this.emit('click', {
        x: this._dragStart.sx, y: this._dragStart.sy,
        worldX: this.renderer?.screenToWorld(this._dragStart.sx, this._dragStart.sy)?.x ?? 0,
        worldY: this.renderer?.screenToWorld(this._dragStart.sx, this._dragStart.sy)?.y ?? 0,
        button: 0, double: false, touch: true,
      });
      globalEventBus.emit(EVENTS.INPUT_CLICK, {
        worldX: this.renderer?.screenToWorld(this._dragStart.sx, this._dragStart.sy)?.x ?? 0,
        worldY: this.renderer?.screenToWorld(this._dragStart.sx, this._dragStart.sy)?.y ?? 0,
        touch: true,
      });
    } else if (this._dragging?.active) {
      this.emit('drag:end', { ...this._dragStart });
    }
    this.touch.active = false;
    this.touch.pinchDist = 0;
    this._dragStart = null;
    this._dragging = false;
  }

  _pollGamepad() {
    if (!this.gamepadState) return;
    const pads = navigator.getGamepads?.();
    if (!pads) return;
    const gp = pads[this.gamepadState.index];
    if (!gp) return;
    const deadzone = 0.25;
    const ax = (v) => Math.abs(v) < deadzone ? 0 : v;
    const state = {
      axes: {
        lx: ax(gp.axes[0] || 0), ly: ax(gp.axes[1] || 0),
        rx: ax(gp.axes[2] || 0), ry: ax(gp.axes[3] || 0),
      },
      buttons: gp.buttons.map((b, i) => ({
        pressed: b.pressed, value: b.value, index: i,
      })),
      prev: this.gamepadState.prev || { buttons: Array(gp.buttons.length).fill(false) },
    };

    if (state.axes.lx || state.axes.ly) {
      this.renderer?.pan(
        -state.axes.lx * 400 * (1 / 60),
        -state.axes.ly * 400 * (1 / 60)
      );
    }
    if (state.axes.ry) {
      const f = state.axes.ry < 0 ? 1.02 : 1 / 1.02;
      if (Math.abs(state.axes.ry) > 0.3) {
        this.renderer?.zoomAt(this.renderer.viewW / 2, this.renderer.viewH / 2, f);
      }
    }

    const btn = state.buttons;
    if (btn[0].pressed && !state.prev.buttons[0]) {
      const cx = this.renderer.viewW / 2, cy = this.renderer.viewH / 2;
      const w = this.renderer.screenToWorld(cx, cy);
      this.emit('click', { x: cx, y: cy, worldX: w.x, worldY: w.y, button: 0, gamepad: true });
      globalEventBus.emit(EVENTS.INPUT_CLICK, { worldX: w.x, worldY: w.y, gamepad: true });
    }
    if (btn[1].pressed && !state.prev.buttons[1]) {
      this.emit('right_click', { gamepad: true });
    }
    if ((btn[4]?.pressed && !state.prev.buttons[4]) || (btn[5]?.pressed && !state.prev.buttons[5])) {
      const f = btn[4]?.pressed ? 1 / 1.08 : 1.08;
      this.renderer?.zoomAt(this.renderer.viewW / 2, this.renderer.viewH / 2, f);
    }

    this.gamepadState.prev = { buttons: btn.map(b => b.pressed) };
  }

  update(dt) {
    this._pollGamepad();
    const panSpeed = 500 * dt;
    if (this.isKey('arrowleft') || this.isKey('a')) this.renderer?.pan(panSpeed, 0);
    if (this.isKey('arrowright') || this.isKey('d')) this.renderer?.pan(-panSpeed, 0);
    if (this.isKey('arrowup') || this.isKey('w')) this.renderer?.pan(0, panSpeed);
    if (this.isKey('arrowdown') || this.isKey('s')) this.renderer?.pan(0, -panSpeed);
    if (this.isKey('-')) this.renderer?.setZoom(this.renderer.camera.zoom * 0.95);
    if (this.isKey('=') || this.isKey('+')) this.renderer?.setZoom(this.renderer.camera.zoom * 1.05);
  }
}
