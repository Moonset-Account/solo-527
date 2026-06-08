import { GameSettings, InputMapping } from '@core/types';

const DEFAULT_INPUT_MAP: InputMapping = {
  keyboard: {
    moveUp: ['W', 'ArrowUp', 'w'],
    moveDown: ['S', 'ArrowDown', 's'],
    moveLeft: ['A', 'ArrowLeft', 'a'],
    moveRight: ['D', 'ArrowRight', 'D' ],
    interact: ['Space', 'E', 'e'],
    undo: ['Z', 'z'],
    restart: ['R', 'r'],
    pause: ['Escape', 'P', 'p'],
    menu: ['Escape'],
    editorToggle: ['F1', 'F2']
  },
  gamepad: {
    moveUp: [12],
    moveDown: [13],
    moveLeft: [14],
    moveRight: [15],
    interact: [0, 2],
    undo: [3],
    restart: [6],
    pause: [9],
    menu: [9],
    editorToggle: [8]
  }
};

export const DEFAULT_SETTINGS: GameSettings = {
  tileSize: 48,
  moveSpeed: 160,
  pushSpeed: 120,
  animationDuration: 200,
  sfxVolume: 0.7,
  musicVolume: 0.3,
  showFPS: true,
  showGrid: false,
  inputRemap: DEFAULT_INPUT_MAP,
  targetFPS: 60
};

export const STORAGE_KEYS = {
  SAVE_DATA: 'night_bookstore_save',
  SETTINGS: 'night_bookstore_settings',
  CUSTOM_LEVELS: 'night_bookstore_levels'
};

export const SAVE_VERSION = '1.0.0';
