import { StateMachine, GAME_STATES } from './StateMachine.js';
import { globalEventBus, EVENTS } from './EventBus.js';
import { Animator } from './Animator.js';
import { audioManager } from './AudioManager.js';
import { clamp } from './Utils.js';

export class Engine {
  constructor() {
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDt = 1 / 60;
    this.timeScale = 1.0;
    this.elapsedTime = 0;
    this.frameCount = 0;
    this.fps = 60;
    this._fpsAccum = 0;
    this._fpsFrames = 0;
    this.systems = [];
    this.renderers = [];
    this.animator = new Animator();
    this.stateMachine = null;
    this._rafId = null;
    this.beforeTick = null;
    this.afterTick = null;
  }

  setStateMachine(defs, initial) {
    this.stateMachine = new StateMachine(defs, initial, { engine: this });
    return this.stateMachine;
  }

  addSystem(system) {
    this.systems.push(system);
    if (system.setEngine) system.setEngine(this);
    return system;
  }

  addRenderer(renderer) {
    this.renderers.push(renderer);
    if (renderer.setEngine) renderer.setEngine(this);
    return renderer;
  }

  removeSystem(system) {
    const i = this.systems.indexOf(system);
    if (i >= 0) this.systems.splice(i, 1);
  }

  setTimeScale(s) { this.timeScale = clamp(s, 0, 5); }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    audioManager.init();
    audioManager.resume();
    globalEventBus.emit(EVENTS.GAME_START);
    this._loop();
  }

  stop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    globalEventBus.emit(EVENTS.GAME_END);
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    globalEventBus.emit(EVENTS.GAME_PAUSE);
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    audioManager.resume();
    globalEventBus.emit(EVENTS.GAME_RESUME);
  }

  _loop = () => {
    if (!this.running) return;
    this._rafId = requestAnimationFrame(this._loop);
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.25) dt = 0.25;

    this._fpsAccum += dt;
    this._fpsFrames++;
    if (this._fpsAccum >= 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsAccum);
      this._fpsAccum = 0;
      this._fpsFrames = 0;
    }

    if (this.paused) return;

    const scaled = dt * this.timeScale;
    this.elapsedTime += scaled;
    this.frameCount++;
    this.accumulator += scaled;

    this.beforeTick?.(scaled);

    while (this.accumulator >= this.fixedDt) {
      this._fixedUpdate(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    this._update(scaled);
    this._render(scaled);

    this.afterTick?.(scaled);
  };

  _fixedUpdate(dt) {
    this.stateMachine?.update(dt);
    for (const s of this.systems) if (s.fixedUpdate) s.fixedUpdate(dt);
  }

  _update(dt) {
    this.animator.update(dt);
    for (const s of this.systems) if (s.update) s.update(dt);
  }

  _render(dt) {
    const alpha = this.accumulator / this.fixedDt;
    for (const r of this.renderers) if (r.render) r.render(dt, alpha);
  }
}

export const engine = new Engine();
