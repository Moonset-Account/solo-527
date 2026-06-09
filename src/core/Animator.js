import { clamp, lerp, easeInOutCubic } from './Utils.js';

export class Tween {
  constructor(target, props, duration, opts = {}) {
    this.target = target;
    this.props = props;
    this.duration = duration;
    this.timeElapsed = 0;
    this.ease = opts.ease || easeInOutCubic;
    this.onUpdate = opts.onUpdate || null;
    this.onComplete = opts.onComplete || null;
    this.startValues = {};
    this.endValues = {};
    for (const key in props) {
      this.startValues[key] = target[key] ?? 0;
      this.endValues[key] = props[key];
    }
    this.finished = false;
    this.delay = opts.delay || 0;
    this._delaying = this.delay > 0;
  }

  update(dt) {
    if (this.finished) return;
    if (this._delaying) {
      this.delay -= dt;
      if (this.delay <= 0) this._delaying = false;
      return;
    }
    this.timeElapsed += dt;
    const t = clamp(this.timeElapsed / this.duration, 0, 1);
    const eased = this.ease(t);
    for (const key in this.props) {
      this.target[key] = lerp(this.startValues[key], this.endValues[key], eased);
    }
    if (this.onUpdate) this.onUpdate(this.target, t);
    if (t >= 1) {
      this.finished = true;
      if (this.onComplete) this.onComplete(this.target);
    }
  }
}

export class Animator {
  constructor() {
    this.tweens = [];
    this.fx = [];
    this.timeScale = 1.0;
  }

  tween(target, props, duration, opts = {}) {
    const t = new Tween(target, props, duration, opts);
    this.tweens.push(t);
    return t;
  }

  cancelTarget(target) {
    this.tweens = this.tweens.filter(t => t.target !== target);
  }

  cancelAll() { this.tweens.length = 0; this.fx.length = 0; }

  addFx(factory) {
    const fx = factory();
    if (fx) this.fx.push(fx);
    return fx;
  }

  update(dt) {
    const scaled = dt * this.timeScale;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      this.tweens[i].update(scaled);
      if (this.tweens[i].finished) this.tweens.splice(i, 1);
    }
    for (let i = this.fx.length - 1; i >= 0; i--) {
      this.fx[i].update(scaled);
      if (this.fx[i].dead) this.fx.splice(i, 1);
    }
  }
}

export class AnimState {
  constructor(name, def = {}) {
    this.name = name;
    this.duration = def.duration || 0.3;
    this.loop = def.loop || false;
    this.onEnter = def.onEnter || (() => {});
    this.onUpdate = def.onUpdate || (() => {});
    this.onExit = def.onExit || (() => {});
    this.timeInState = 0;
    this.progress = 0;
  }
}

export class AnimStateMachine {
  constructor(target, states, initial) {
    this.target = target;
    this.states = {};
    for (const k in states) this.states[k] = new AnimState(k, states[k]);
    this.current = this.states[initial];
    this.prev = null;
    this.transitionT = 0;
    this.current.onEnter(target);
  }

  set(name) {
    if (!this.states[name]) return;
    if (this.current.name === name) return;
    this.current.onExit(this.target);
    this.prev = this.current;
    this.current = this.states[name];
    this.current.timeInState = 0;
    this.current.progress = 0;
    this.transitionT = 0;
    this.current.onEnter(this.target);
  }

  update(dt) {
    this.current.timeInState += dt;
    if (this.current.duration > 0) {
      this.current.progress = clamp(this.current.timeInState / this.current.duration, 0, 1);
      if (this.current.progress >= 1 && this.current.loop) {
        this.current.timeInState = 0;
        this.current.progress = 0;
      }
    }
    this.transitionT = Math.min(1, this.transitionT + dt * 4);
    this.current.onUpdate(this.target, this.current.progress, dt);
  }

  is(name) { return this.current.name === name; }
}

export function createParticle(ctx, opts) {
  return {
    x: opts.x, y: opts.y,
    vx: opts.vx ?? 0, vy: opts.vy ?? 0,
    life: opts.life ?? 1.0,
    maxLife: opts.life ?? 1.0,
    size: opts.size ?? 4,
    color: opts.color ?? '#fff',
    gravity: opts.gravity ?? 0,
    dead: false,
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += this.gravity * dt;
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    },
    render() {
      const alpha = clamp(this.life / this.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  };
}

export function createShake(duration = 0.4, magnitude = 8) {
  return {
    time: 0, duration, magnitude, dead: false,
    offsetX: 0, offsetY: 0,
    update(dt) {
      this.time += dt;
      if (this.time >= this.duration) {
        this.dead = true; this.offsetX = 0; this.offsetY = 0;
        return;
      }
      const s = 1 - this.time / this.duration;
      this.offsetX = (Math.random() - 0.5) * 2 * this.magnitude * s;
      this.offsetY = (Math.random() - 0.5) * 2 * this.magnitude * s;
    },
  };
}
