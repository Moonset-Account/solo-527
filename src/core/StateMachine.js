export class StateMachine {
  constructor(states, initialState, context = {}) {
    this.states = states;
    this.current = initialState;
    this.context = context;
    this.prevState = null;
    this._enterState(initialState, null);
  }

  transition(newState, payload = null) {
    if (newState === this.current) return false;
    const curDef = this.states[this.current];
    const nextDef = this.states[newState];
    if (!nextDef) {
      console.error(`[StateMachine] Unknown state: ${newState}`);
      return false;
    }
    if (curDef?.canTransition && !curDef.canTransition(newState, this.context, payload)) {
      console.warn(`[StateMachine] Cannot transition from ${this.current} to ${newState}`);
      return false;
    }
    if (curDef?.onExit) curDef.onExit.call(this, this.context, newState, payload);
    this.prevState = this.current;
    this.current = newState;
    this._enterState(newState, payload);
    return true;
  }

  _enterState(state, payload) {
    const def = this.states[state];
    if (def?.onEnter) def.onEnter.call(this, this.context, this.prevState, payload);
  }

  update(dt) {
    const def = this.states[this.current];
    if (def?.onUpdate) def.onUpdate.call(this, dt, this.context);
  }

  is(state) { return this.current === state; }
}

export const GAME_STATES = Object.freeze({
  BOOT: 'boot',
  MAIN_MENU: 'main_menu',
  LEVEL_SELECT: 'level_select',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  REPORT: 'report',
  FAILURE: 'failure',
});
