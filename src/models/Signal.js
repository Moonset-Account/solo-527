import { GAME_CONFIG } from '../config/GameConfig.js';

export const SIGNAL_STATES = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green'
};

export const SIGNAL_MODES = {
  AUTO: 'auto',
  MANUAL: 'manual'
};

export class Signal {
  constructor(config) {
    this.id = config.id;
    this.nodeId = config.nodeId;
    this.direction = config.direction || null;

    this.state = config.state || SIGNAL_STATES.RED;
    this.mode = config.mode || SIGNAL_MODES.AUTO;
    this.locked = config.locked || false;

    this.trackNodeRef = null;
    this.graphics = null;
    this.glowGraphics = null;

    this.blinkTimer = 0;
    this.isBlinking = false;

    this.label = config.label || '';
  }

  setState(state) {
    if (this.locked) return false;
    this.state = state;
    return true;
  }

  toggle() {
    if (this.locked || this.mode !== SIGNAL_MODES.MANUAL) return false;
    if (this.state === SIGNAL_STATES.RED) {
      this.state = SIGNAL_STATES.GREEN;
    } else if (this.state === SIGNAL_STATES.GREEN) {
      this.state = SIGNAL_STATES.YELLOW;
    } else {
      this.state = SIGNAL_STATES.RED;
    }
    return true;
  }

  setGreen() {
    return this.setState(SIGNAL_STATES.GREEN);
  }

  setRed() {
    return this.setState(SIGNAL_STATES.RED);
  }

  setYellow() {
    return this.setState(SIGNAL_STATES.YELLOW);
  }

  isGreen() {
    return this.state === SIGNAL_STATES.GREEN;
  }

  isRed() {
    return this.state === SIGNAL_STATES.RED;
  }

  isYellow() {
    return this.state === SIGNAL_STATES.YELLOW;
  }

  canPass() {
    return this.state === SIGNAL_STATES.GREEN;
  }

  getColor() {
    switch (this.state) {
      case SIGNAL_STATES.GREEN:
        return GAME_CONFIG.colors.signalGreen;
      case SIGNAL_STATES.YELLOW:
        return GAME_CONFIG.colors.signalYellow;
      case SIGNAL_STATES.RED:
      default:
        return GAME_CONFIG.colors.signalRed;
    }
  }

  getHexColor() {
    const hex = this.getColor().replace('#', '');
    return parseInt(hex, 16);
  }

  update(delta) {
    if (this.isBlinking) {
      this.blinkTimer += delta;
    }
  }

  toJSON() {
    return {
      id: this.id,
      nodeId: this.nodeId,
      direction: this.direction,
      state: this.state,
      mode: this.mode,
      locked: this.locked,
      label: this.label
    };
  }
}
