// ========================================================
// 输入管理器
// ========================================================

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, locked: false };
    this.mouseDown = new Set();
    this.examineDrag = { active: false, lastX: 0, lastY: 0, rotX: 0, rotY: 0 };
    this.callbacks = {};
    this.mode = 'menu'; // menu | game | ui | puzzle | examine

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      // 忽略输入框
      if (e.target.tagName === 'INPUT') return;
      this.keys.add(e.code);
      this._fire('keydown', e);
      // 数字键
      if (/^Digit[0-9]$/.test(e.code)) {
        this._fire('digit', parseInt(e.code.slice(5)));
      }
      // 特殊按键
      if (e.code === 'Escape') this._fire('esc');
      if (e.code === 'KeyE') this._fire('interact');
      if (e.code === 'KeyN') this._fire('notebook');
      if (e.code === 'KeyI') this._fire('inventory');
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this._fire('keyup', e);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.dx = e.movementX || (e.screenX - this.mouse.x);
      this.mouse.dy = e.movementY || (e.screenY - this.mouse.y);
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this._fire('mousemove', this.mouse);
    });

    window.addEventListener('mousedown', (e) => {
      this.mouseDown.add(e.button);
      if (e.button === 0) this._fire('leftclick', e);
      if (e.button === 2) this._fire('rightclick', e);
    });
    window.addEventListener('mouseup', (e) => {
      this.mouseDown.delete(e.button);
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // 鼠标指针锁
    document.addEventListener('pointerlockchange', () => {
      this.mouse.locked = !!document.pointerLockElement;
    });
  }

  on(event, cb) {
    (this.callbacks[event] = this.callbacks[event] || []).push(cb);
  }

  off(event, cb) {
    if (!this.callbacks[event]) return;
    this.callbacks[event] = this.callbacks[event].filter(x => x !== cb);
  }

  _fire(event, data) {
    (this.callbacks[event] || []).forEach(cb => {
      try { cb(data); } catch (e) { console.error(e); }
    });
  }

  isDown(code) { return this.keys.has(code); }

  // 移动向量 (WASD)
  getMoveVector() {
    let x = 0, y = 0;
    if (this.isDown('KeyW')) y -= 1;
    if (this.isDown('KeyS')) y += 1;
    if (this.isDown('KeyA')) x -= 1;
    if (this.isDown('KeyD')) x += 1;
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    return { x, y };
  }

  requestPointerLock(element) {
    if (this.mode === 'game' && element.requestPointerLock) {
      element.requestPointerLock();
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) document.exitPointerLock();
  }
}
