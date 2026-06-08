import type { InputDevice, InputAction, GameSettings } from '../types/config';
import { DEFAULT_INPUT_BINDINGS } from '../utils/save';

export type InputCallback = (payload?: { x?: number; y?: number; value?: number }) => void;

const ACTION_ORDER: InputAction[] = [
  'select', 'cancel', 'drag', 'heat_up', 'cool_down',
  'stir', 'pour', 'menu', 'pause', 'help',
];

const DEVICE_NAMES: Record<InputDevice, string> = {
  keyboard: '键盘',
  mouse: '鼠标',
  gamepad: '手柄',
  touch: '触摸',
};

const KEY_DISPLAY: Record<string, string> = {
  Enter: 'Enter', Space: '空格', Escape: 'Esc',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  LMB: '左键', RMB: '右键', MMB: '中键',
  ScrollUp: '滚轮↑', ScrollDown: '滚轮↓',
  'LMB+dbl': '双击左键',
  A: 'A', B: 'B', X: 'X', Y: 'Y', Cross: '✕', Circle: '◯',
  Square: '□', Triangle: '△', RB: 'RB', LB: 'LB', RT: 'RT', LT: 'LT',
  Start: 'Start', Menu: 'Menu', Options: 'Options', Back: 'Back', Select: 'Select',
  DpadUp: '↑', DpadDown: '↓', DpadLeft: '←', DpadRight: '→',
  Tap: '点击', LongPress: '长按', SwipeDrag: '拖拽',
  SwipeUp: '上滑', SwipeDown: '下滑', SwipeRight: '右滑',
  Circular: '画圈', DoubleTap: '双击', TwoFinger: '双指', TripleTap: '三击',
};

export class InputManager {
  private target: HTMLElement | null = null;
  private currentDevice: InputDevice = 'keyboard';
  private bindings: Record<InputDevice, Record<InputAction, string[]>>;
  private actionCallbacks: Partial<Record<InputAction, Set<InputCallback>>> = {};
  private deviceListeners: Set<(d: InputDevice) => void> = new Set();
  private pressedKeys = new Set<string>();
  private mousePressed = new Set<string>();
  private lastTapTime = 0;
  private gamepadIndex: number | null = null;
  private _pendingRebind: { action: InputAction; device: InputDevice } | null = null;

  constructor(settings: GameSettings) {
    this.bindings = {
      keyboard: { ...settings.inputs.keyboard.bindings },
      mouse: { ...settings.inputs.mouse.bindings },
      gamepad: { ...settings.inputs.gamepad.bindings },
      touch: { ...settings.inputs.touch.bindings },
    };
    this.currentDevice = settings.currentInputDevice;
  }

  attach(target: HTMLElement): void {
    this.target = target;
    this.addDomListeners();
    this.startGamepadPoll();
  }

  detach(): void {
    this.removeDomListeners();
    this.target = null;
  }

  onDeviceChange(cb: (d: InputDevice) => void): () => void {
    this.deviceListeners.add(cb);
    return () => this.deviceListeners.delete(cb);
  }

  on(action: InputAction, cb: InputCallback): () => void {
    if (!this.actionCallbacks[action]) this.actionCallbacks[action] = new Set();
    this.actionCallbacks[action]!.add(cb);
    return () => this.actionCallbacks[action]!.delete(cb);
  }

  trigger(action: InputAction, payload?: { x?: number; y?: number; value?: number }): void {
    this.actionCallbacks[action]?.forEach(cb => cb(payload));
  }

  getCurrentDevice(): InputDevice { return this.currentDevice; }

  setDevice(device: InputDevice): void {
    if (this.currentDevice === device) return;
    this.currentDevice = device;
    this.deviceListeners.forEach(l => l(device));
  }

  getDeviceName(d: InputDevice = this.currentDevice): string { return DEVICE_NAMES[d]; }

  getKeyHint(action: InputAction, device: InputDevice = this.currentDevice): string {
    const keys = this.bindings[device][action] || [];
    const primary = keys.find(k => k && k.length > 0);
    if (!primary) return '—';
    return KEY_DISPLAY[primary] || primary;
  }

  getAllBindings(device: InputDevice = this.currentDevice): Record<InputAction, string[]> {
    return structuredClone(this.bindings[device]);
  }

  rebind(action: InputAction, device: InputDevice, key: string, index = 0): void {
    const arr = this.bindings[device][action];
    if (arr.length <= index) {
      arr.push(key);
    } else {
      arr[index] = key;
    }
  }

  beginRebind(action: InputAction, device: InputDevice): void {
    this._pendingRebind = { action, device };
  }

  cancelRebind(): void { this._pendingRebind = null; }
  isRebinding(): boolean { return this._pendingRebind !== null; }

  resetDefaults(): void {
    ACTION_ORDER.forEach(a => {
      (['keyboard', 'mouse', 'gamepad', 'touch'] as InputDevice[]).forEach(d => {
        this.bindings[d][a] = [...DEFAULT_INPUT_BINDINGS[d][a]];
      });
    });
  }

  exportSettings(): Record<InputDevice, Record<InputAction, string[]>> {
    return structuredClone(this.bindings);
  }

  getActions(): InputAction[] { return [...ACTION_ORDER]; }
  getActionName(action: InputAction): string {
    const names: Record<InputAction, string> = {
      select: '选择/确认', cancel: '取消', drag: '拖拽',
      heat_up: '升温', cool_down: '降温', stir: '搅拌',
      pour: '倒取', menu: '菜单', pause: '暂停', help: '帮助',
    };
    return names[action];
  }

  private addDomListeners(): void {
    if (!this.target) return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.target.addEventListener('mousedown', this.handleMouseDown);
    this.target.addEventListener('mouseup', this.handleMouseUp);
    this.target.addEventListener('mousemove', this.handleMouseMove);
    this.target.addEventListener('wheel', this.handleWheel, { passive: true });
    this.target.addEventListener('dblclick', this.handleDblClick);
    this.target.addEventListener('contextmenu', this.handleContext);
    this.target.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.target.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.target.addEventListener('touchend', this.handleTouchEnd);
  }

  private removeDomListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (!this.target) return;
    this.target.removeEventListener('mousedown', this.handleMouseDown);
    this.target.removeEventListener('mouseup', this.handleMouseUp);
    this.target.removeEventListener('mousemove', this.handleMouseMove);
    this.target.removeEventListener('wheel', this.handleWheel);
    this.target.removeEventListener('dblclick', this.handleDblClick);
    this.target.removeEventListener('contextmenu', this.handleContext);
    this.target.removeEventListener('touchstart', this.handleTouchStart);
    this.target.removeEventListener('touchmove', this.handleTouchMove);
    this.target.removeEventListener('touchend', this.handleTouchEnd);
  }

  private checkAndFire(device: InputDevice, key: string, payload?: { x?: number; y?: number; value?: number }): void {
    if (this._pendingRebind && this._pendingRebind.device === device) {
      const { action } = this._pendingRebind;
      this.rebind(action, device, key);
      this._pendingRebind = null;
      return;
    }
    this.setDevice(device);
    ACTION_ORDER.forEach(a => {
      if (this.bindings[device][a].includes(key)) {
        this.actionCallbacks[a]?.forEach(cb => cb(payload));
      }
    });
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    this.pressedKeys.add(e.code || e.key);
    this.checkAndFire('keyboard', e.code || e.key);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.pressedKeys.delete(e.code || e.key);
  };

  private handleMouseDown = (e: MouseEvent): void => {
    const pos = { x: e.offsetX, y: e.offsetY };
    const btn = e.button === 0 ? 'LMB' : e.button === 1 ? 'MMB' : 'RMB';
    this.mousePressed.add(btn);
    this.checkAndFire('mouse', btn, pos);
    this.checkAndFire('mouse', 'drag', pos);
  };
  private handleMouseUp = (e: MouseEvent): void => {
    const btn = e.button === 0 ? 'LMB' : e.button === 1 ? 'MMB' : 'RMB';
    this.mousePressed.delete(btn);
  };
  private handleMouseMove = (e: MouseEvent): void => {
    if (this.mousePressed.has('LMB')) {
      this.checkAndFire('mouse', 'drag', { x: e.offsetX, y: e.offsetY });
    }
  };
  private handleWheel = (e: WheelEvent): void => {
    this.checkAndFire('mouse', e.deltaY < 0 ? 'ScrollUp' : 'ScrollDown', { value: Math.abs(e.deltaY) });
  };
  private handleDblClick = (e: MouseEvent): void => {
    this.checkAndFire('mouse', 'LMB+dbl', { x: e.offsetX, y: e.offsetY });
  };
  private handleContext = (e: Event): void => {
    e.preventDefault();
    this.checkAndFire('mouse', 'RMB');
  };

  private touchStartPos: { x: number; y: number; time: number; fingers: number } | null = null;
  private lastTouchCircle = { x: 0, y: 0, angle: 0, accumulated: 0 };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    const now = performance.now();
    this.touchStartPos = { x: pos.x, y: pos.y, time: now, fingers: e.touches.length };
    if (now - this.lastTapTime < 300) {
      this.checkAndFire('touch', 'DoubleTap', pos);
      this.lastTapTime = 0;
    } else if (e.touches.length === 2) {
      this.checkAndFire('touch', 'TwoFinger', pos);
    } else if (e.touches.length === 3) {
      this.checkAndFire('touch', 'TripleTap', pos);
    } else {
      this.lastTapTime = now;
    }
    if (e.touches.length === 1) {
      this.lastTouchCircle = { x: pos.x, y: pos.y, angle: 0, accumulated: 0 };
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.touchStartPos) return;
    e.preventDefault();
    const t = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    const dx = pos.x - this.touchStartPos.x;
    const dy = pos.y - this.touchStartPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) return;
    this.checkAndFire('touch', 'SwipeDrag', pos);
    const angle = Math.atan2(pos.y - this.lastTouchCircle.y, pos.x - this.lastTouchCircle.x);
    this.lastTouchCircle.accumulated += Math.abs(angle - this.lastTouchCircle.angle);
    if (this.lastTouchCircle.accumulated > Math.PI * 1.5) {
      this.checkAndFire('touch', 'Circular', pos);
      this.lastTouchCircle.accumulated = 0;
    }
    this.lastTouchCircle.x = pos.x;
    this.lastTouchCircle.y = pos.y;
    this.lastTouchCircle.angle = angle;
    if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx) * 2) {
      this.checkAndFire('touch', dy < 0 ? 'SwipeUp' : 'SwipeDown', pos);
      this.touchStartPos = { ...this.touchStartPos, x: pos.x, y: pos.y };
    } else if (dx > 80 && Math.abs(dy) < 40) {
      this.checkAndFire('touch', 'SwipeRight', pos);
      this.touchStartPos = null;
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.touchStartPos) return;
    const now = performance.now();
    const dur = now - this.touchStartPos.time;
    const t = e.changedTouches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    const dx = pos.x - this.touchStartPos.x;
    const dy = pos.y - this.touchStartPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dur > 600 && dist < 15) {
      this.checkAndFire('touch', 'LongPress', pos);
    } else if (dist < 10 && dur < 300) {
      this.checkAndFire('touch', 'Tap', pos);
    }
    this.touchStartPos = null;
  };

  private startGamepadPoll(): void {
    const tick = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find(g => g && g.connected);
      if (gp) {
        this.gamepadIndex = gp.index;
        this.pollGamepad(gp);
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  private prevGamepadButtons = new Set<string>();
  private pollGamepad(gp: Gamepad): void {
    const btnMap: Record<number, string> = {
      0: 'A', 1: 'B', 2: 'X', 3: 'Y',
      4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
      8: 'Back', 9: 'Start', 10: 'Select', 11: 'Options',
      12: 'DpadUp', 13: 'DpadDown', 14: 'DpadLeft', 15: 'DpadRight',
    };
    const crossMap: Record<number, string> = { 0: 'Cross', 1: 'Circle', 2: 'Square', 3: 'Triangle' };
    const current = new Set<string>();
    gp.buttons.forEach((b, i) => {
      if (b.pressed || b.value > 0.5) {
        const name = btnMap[i];
        if (name) {
          current.add(name);
          if (crossMap[i]) current.add(crossMap[i]);
        }
      }
    });
    current.forEach(name => {
      if (!this.prevGamepadButtons.has(name)) {
        this.checkAndFire('gamepad', name);
      }
    });
    this.prevGamepadButtons = current;
  }
}
