export const EVENT_TYPES = {
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_WIN: 'game:win',
  GAME_LOSE: 'game:lose',
  GAME_RESTART: 'game:restart',
  GAME_SPEED_CHANGE: 'game:speedChange',

  TRAIN_SPAWN: 'train:spawn',
  TRAIN_MOVE: 'train:move',
  TRAIN_ARRIVE: 'train:arrive',
  TRAIN_DEPART: 'train:depart',
  TRAIN_STOP: 'train:stop',
  TRAIN_DELAY: 'train:delay',
  TRAIN_DESTROY: 'train:destroy',

  SIGNAL_CHANGE: 'signal:change',
  SWITCH_CHANGE: 'switch:change',
  TRACK_CLICK: 'track:click',

  CONFLICT_DETECTED: 'conflict:detected',
  CONFLICT_RESOLVED: 'conflict:resolved',

  SCHEDULE_UPDATE: 'schedule:update',

  UI_NOTIFY: 'ui:notify',
  UI_TOAST: 'ui:toast',
  UI_DIALOG: 'ui:dialog',

  RECORD_ACTION: 'record:action',
  REPLAY_START: 'replay:start',
  REPLAY_STEP: 'replay:step',
  REPLAY_END: 'replay:end',

  SAVE_COMPLETE: 'save:complete',
  LOAD_COMPLETE: 'load:complete',

  AUDIO_PLAY: 'audio:play',
  AUDIO_STOP: 'audio:stop',
  AUDIO_MUSIC: 'audio:music',

  LEVEL_UNLOCK: 'level:unlock',
  LEVEL_COMPLETE: 'level:complete',

  TUTORIAL_STEP: 'tutorial:step'
};

class EventBusClass {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.eventLog = [];
    this.debug = false;
  }

  on(event, callback, context = null) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push({ callback, context });
    return () => this.off(event, callback, context);
  }

  once(event, callback, context = null) {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, []);
    }
    this.onceListeners.get(event).push({ callback, context });
  }

  off(event, callback, context = null) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.findIndex(
        (l) => l.callback === callback && l.context === context
      );
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
    if (this.onceListeners.has(event)) {
      const listeners = this.onceListeners.get(event);
      const index = listeners.findIndex(
        (l) => l.callback === callback && l.context === context
      );
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, ...args) {
    if (this.debug) {
      console.log(`[EventBus] emit: ${event}`, args);
      this.eventLog.push({ event, args, time: Date.now() });
      if (this.eventLog.length > 500) {
        this.eventLog.shift();
      }
    }

    if (this.listeners.has(event)) {
      const listeners = [...this.listeners.get(event)];
      for (const { callback, context } of listeners) {
        try {
          if (context) {
            callback.call(context, ...args);
          } else {
            callback(...args);
          }
        } catch (e) {
          console.error(`[EventBus] Error in listener for ${event}:`, e);
        }
      }
    }

    if (this.onceListeners.has(event)) {
      const listeners = [...this.onceListeners.get(event)];
      this.onceListeners.delete(event);
      for (const { callback, context } of listeners) {
        try {
          if (context) {
            callback.call(context, ...args);
          } else {
            callback(...args);
          }
        } catch (e) {
          console.error(`[EventBus] Error in once listener for ${event}:`, e);
        }
      }
    }
  }

  clear() {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  clearEvent(event) {
    this.listeners.delete(event);
    this.onceListeners.delete(event);
  }

  getEventLog() {
    return [...this.eventLog];
  }

  setDebug(enabled) {
    this.debug = enabled;
  }
}

export const EventBus = new EventBusClass();
