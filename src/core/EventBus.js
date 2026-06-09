export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
  }

  on(event, handler, context = null) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push({ handler, context });
    return () => this.off(event, handler, context);
  }

  once(event, handler, context = null) {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, []);
    }
    this.onceListeners.get(event).push({ handler, context });
  }

  off(event, handler, context = null) {
    const removeFrom = (map) => {
      const list = map.get(event);
      if (!list) return;
      const idx = list.findIndex(
        (l) => l.handler === handler && l.context === context
      );
      if (idx !== -1) list.splice(idx, 1);
    };
    removeFrom(this.listeners);
    removeFrom(this.onceListeners);
  }

  emit(event, ...args) {
    const regular = this.listeners.get(event);
    if (regular) {
      for (const { handler, context } of [...regular]) {
        try {
          context ? handler.call(context, ...args) : handler(...args);
        } catch (e) {
          console.error(`[EventBus] Error in listener for "${event}":`, e);
        }
      }
    }
    const once = this.onceListeners.get(event);
    if (once) {
      const handlers = [...once];
      this.onceListeners.delete(event);
      for (const { handler, context } of handlers) {
        try {
          context ? handler.call(context, ...args) : handler(...args);
        } catch (e) {
          console.error(`[EventBus] Error in once listener for "${event}":`, e);
        }
      }
    }
  }

  clear() {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  getListenerCount(event) {
    return (this.listeners.get(event)?.length || 0) +
           (this.onceListeners.get(event)?.length || 0);
  }
}

export const globalEventBus = new EventBus();

export const EVENTS = Object.freeze({
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_END: 'game:end',
  GAME_RESTART: 'game:restart',
  LEVEL_LOAD: 'level:load',
  LEVEL_COMPLETE: 'level:complete',
  LEVEL_FAIL: 'level:fail',

  TASK_CREATE: 'task:create',
  TASK_ASSIGN: 'task:assign',
  TASK_COMPLETE: 'task:complete',
  TASK_FAIL: 'task:fail',
  TASK_SELECT: 'task:select',
  TASK_CANCEL: 'task:cancel',

  RESOURCE_DISPATCH: 'resource:dispatch',
  RESOURCE_RETURN: 'resource:return',
  RESOURCE_SELECT: 'resource:select',
  RESOURCE_ARRIVE: 'resource:arrive',

  EVENT_TRIGGER: 'event:trigger',
  EVENT_RESOLVE: 'event:resolve',

  SATISFACTION_CHANGE: 'satisfaction:change',
  SCORE_CHANGE: 'score:change',
  COST_CHANGE: 'cost:change',

  UI_TOAST: 'ui:toast',
  UI_PANEL_TOGGLE: 'ui:panel:toggle',
  UI_DEBUG_TOGGLE: 'ui:debug:toggle',

  SFX_PLAY: 'sfx:play',
  BGM_PLAY: 'bgm:play',
  BGM_STOP: 'bgm:stop',

  INPUT_CLICK: 'input:click',
  INPUT_HOVER: 'input:hover',
  INPUT_SELECT: 'input:select',
});
