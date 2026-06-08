import { eventBus } from './EventBus.js';

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };
    this.boundMethods = {};
    this.target = null;
  }

  init(target = document) {
    this.target = target;
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onClick = this.onClick.bind(this);
    this._onWheel = this.onWheel.bind(this);
    this._onContextMenu = this.onContextMenu.bind(this);
    this._onResize = this.onResize.bind(this);

    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
    target.addEventListener('mousemove', this._onMouseMove);
    target.addEventListener('mousedown', this._onMouseDown);
    target.addEventListener('mouseup', this._onMouseUp);
    target.addEventListener('click', this._onClick);
    target.addEventListener('wheel', this._onWheel, { passive: false });
    target.addEventListener('contextmenu', this._onContextMenu);
    window.addEventListener('resize', this._onResize);
  }

  destroy() {
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);
    this.target.removeEventListener('mousemove', this._onMouseMove);
    this.target.removeEventListener('mousedown', this._onMouseDown);
    this.target.removeEventListener('mouseup', this._onMouseUp);
    this.target.removeEventListener('click', this._onClick);
    this.target.removeEventListener('wheel', this._onWheel);
    this.target.removeEventListener('contextmenu', this._onContextMenu);
    window.removeEventListener('resize', this._onResize);
  }

  onKeyDown(e) {
    this.keys.add(e.code);
    eventBus.emit('input:keydown', e);
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        eventBus.emit('input:action:pause');
        break;
      case 'KeyR':
        eventBus.emit('input:action:replay');
        break;
      case 'Escape':
        eventBus.emit('input:action:escape');
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
        eventBus.emit('input:speed', parseInt(e.code.replace('Digit', '')));
        break;
    }
  }

  onKeyUp(e) {
    this.keys.delete(e.code);
    eventBus.emit('input:keyup', e);
  }

  onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    eventBus.emit('input:mousemove', { ...this.mouse, event: e });
  }

  onMouseDown(e) {
    this.mouse.down = true;
    eventBus.emit('input:mousedown', { ...this.mouse, button: e.button, event: e });
  }

  onMouseUp(e) {
    this.mouse.down = false;
    eventBus.emit('input:mouseup', { ...this.mouse, button: e.button, event: e });
  }

  onClick(e) {
    eventBus.emit('input:click', { ...this.mouse, button: e.button, event: e });
  }

  onWheel(e) {
    e.preventDefault();
    eventBus.emit('input:wheel', { delta: e.deltaY, event: e });
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  onResize(e) {
    eventBus.emit('input:resize', {
      width: window.innerWidth, height: window.innerHeight });
  }

  isKeyPressed(code) {
    return this.keys.has(code);
  }
}

export const inputManager = new InputManager();
