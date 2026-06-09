export class InputManager {
    constructor(domElement) {
        this.domElement = domElement;
        this.mappings = {};
        this.state = {};
        this.justPressed = {};
        this.justReleased = {};
        this.pointer = { x: 0, y: 0, ndcX: 0, ndcY: 0, down: false, clicked: false };
        this.listeners = {};
        this.enabled = true;
        this._init();
    }

    _init() {
        this._setupDefaultMappings();
        window.addEventListener('keydown', (e) => this._onKeyDown(e));
        window.addEventListener('keyup', (e) => this._onKeyUp(e));
        this.domElement.addEventListener('pointermove', (e) => this._onPointerMove(e));
        this.domElement.addEventListener('pointerdown', (e) => this._onPointerDown(e));
        this.domElement.addEventListener('pointerup', (e) => this._onPointerUp(e));
        this.domElement.addEventListener('pointerleave', (e) => this._onPointerUp(e));
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    }

    _setupDefaultMappings() {
        this.addMapping('forward', ['KeyW', 'ArrowUp']);
        this.addMapping('backward', ['KeyS', 'ArrowDown']);
        this.addMapping('left', ['KeyA', 'ArrowLeft']);
        this.addMapping('right', ['KeyD', 'ArrowRight']);
        this.addMapping('action', ['Space']);
        this.addMapping('cancel', ['Escape']);
        this.addMapping('confirm', ['Enter']);
        this.addMapping('speed_up', ['ShiftLeft']);
    }

    addMapping(action, keys) {
        this.mappings[action] = Array.isArray(keys) ? keys : [keys];
        this.state[action] = false;
        this.justPressed[action] = false;
        this.justReleased[action] = false;
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
        return () => {
            const idx = this.listeners[event].indexOf(callback);
            if (idx >= 0) this.listeners[event].splice(idx, 1);
        };
    }

    emit(event, data) {
        if (this.listeners[event]) {
            for (const cb of this.listeners[event]) {
                cb(data);
            }
        }
    }

    _onKeyDown(e) {
        if (!this.enabled) return;
        for (const [action, keys] of Object.entries(this.mappings)) {
            if (keys.includes(e.code) && !this.state[action]) {
                this.state[action] = true;
                this.justPressed[action] = true;
                this.emit(`action:${action}:press`);
            }
        }
    }

    _onKeyUp(e) {
        for (const [action, keys] of Object.entries(this.mappings)) {
            if (keys.includes(e.code)) {
                this.state[action] = false;
                this.justReleased[action] = true;
                this.emit(`action:${action}:release`);
            }
        }
    }

    _onPointerMove(e) {
        if (!this.enabled) return;
        const rect = this.domElement.getBoundingClientRect();
        this.pointer.x = e.clientX - rect.left;
        this.pointer.y = e.clientY - rect.top;
        this.pointer.ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.emit('pointer:move', { ...this.pointer });
    }

    _onPointerDown(e) {
        if (!this.enabled) return;
        this.pointer.down = true;
        this.pointer.clicked = true;
        this.pointer.button = e.button;
        this.emit('pointer:down', { ...this.pointer });
    }

    _onPointerUp(e) {
        this.pointer.down = false;
        this.emit('pointer:up', { ...this.pointer });
    }

    _onWheel(e) {
        if (!this.enabled) return;
        e.preventDefault();
        this.emit('pointer:wheel', { delta: e.deltaY, ...this.pointer });
    }

    isDown(action) {
        return !!this.state[action];
    }

    wasPressed(action) {
        return !!this.justPressed[action];
    }

    wasReleased(action) {
        return !!this.justReleased[action];
    }

    endFrame() {
        for (const k in this.justPressed) this.justPressed[k] = false;
        for (const k in this.justReleased) this.justReleased[k] = false;
        this.pointer.clicked = false;
    }

    setEnabled(v) {
        this.enabled = v;
        if (!v) {
            for (const k in this.state) this.state[k] = false;
            this.pointer.down = false;
        }
    }
}
