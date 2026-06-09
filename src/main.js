import './styles/main.css';
import './styles/ui.css';

import { engine } from './core/Engine.js';
import { globalEventBus, EVENTS } from './core/EventBus.js';
import { configManager, GAME_STATES } from './config/GameConfig.js';
import { MapRenderer } from './game/MapRenderer.js';
import { InputManager } from './core/InputManager.js';
import { ToastManager } from './core/UIHelpers.js';
import { audioManager } from './core/AudioManager.js';
import { saveManager } from './core/SaveManager.js';
import { setupDebugPanel } from './core/DebugSetup.js';

import { Game } from './game/Game.js';
import { UIManager } from './game/UIManager.js';
import { DisasterEvent } from './game/TaskManager.js';

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');
const debugEl = document.getElementById('debug-panel');
const toastContainer = document.getElementById('toast-container');

const renderer = new MapRenderer(canvas, engine);
const input = new InputManager(canvas, renderer);
const toast = new ToastManager(toastContainer);

const game = new Game();

window.__debug_refs = { DisasterEvent };

const ui = new UIManager(uiRoot, game, renderer, engine);

const debug = setupDebugPanel(debugEl, game, engine, renderer, input, game.resources, game.tasks);

renderer.setTaskProvider(() => {
  const r = game.forRenderer();
  return r.tasks;
});
renderer.setResourceProvider(() => {
  const r = game.forRenderer();
  return r.resources;
});

engine.addSystem({
  update(dt) {
    if (game.state === GAME_STATES.PLAYING) {
      game.update(dt);
    }
    input.update(dt);
    renderer.update(dt);
    debug.tick();
  },
  setEngine() {},
});

engine.addRenderer({
  render(dt) {
    renderer.render(dt);
  },
  setEngine() {},
});

input.on('left_click', ({ worldX, worldY }) => {
  audioManager.resume();
  if (game.state !== GAME_STATES.PLAYING) return;

  let handled = false;

  for (const t of game.tasks.getActive()) {
    const dx = t.x - worldX, dy = t.y - worldY;
    if (dx * dx + dy * dy < 30 * 30) {
      ui._onTaskClick(t);
      handled = true;
      break;
    }
  }
  if (handled) return;

  for (const r of game.resources.resources) {
    const dx = r.x - worldX, dy = r.y - worldY;
    if (dx * dx + dy * dy < 22 * 22) {
      ui._onResourceClick(r);
      handled = true;
      break;
    }
  }
  if (handled) return;

  const selectedTask = game.tasks.getSelected();
  const selectedRes = game.resources.getSelected();
  if (selectedTask && selectedRes && selectedRes.isAvailable()) {
    ui.assignResourceToTask(selectedRes, selectedTask);
    return;
  }

  if (selectedRes && selectedRes.isAvailable()) {
    const t = game.tasks.getActive().find(t => {
      const dx = t.x - worldX, dy = t.y - worldY;
      return dx * dx + dy * dy < 50 * 50;
    });
    if (t) ui.assignResourceToTask(selectedRes, t);
  }
});

input.on('right_click', () => {
  if (game.state !== GAME_STATES.PLAYING) return;
  ui.cancelSelection();
  globalEventBus.emit(EVENTS.UI_TOAST, { message: '已取消选择', type: 'info' });
});

input.on('key:down', (k) => {
  audioManager.resume();
  if (k === 'escape') {
    if (game.state === GAME_STATES.PLAYING) ui._confirmMenu();
    else if (game.state === GAME_STATES.PAUSED) engine.resume();
    return;
  }
  if (k === ' ') {
    if (game.state === GAME_STATES.PLAYING || game.state === GAME_STATES.PAUSED) ui._togglePause();
    return;
  }
  if (k === 'r' && (game.state === GAME_STATES.PLAYING || game.state === GAME_STATES.PAUSED)) {
    ui._confirmRestart();
    return;
  }
  if (k === 'q' && game.state === GAME_STATES.PLAYING) {
    ui._autoAssign();
    return;
  }
  if (k === '`' || k === '~') {
    globalEventBus.emit(EVENTS.UI_DEBUG_TOGGLE);
    return;
  }
  if (['1', '2', '3', '4', '5'].includes(k) && game.state === GAME_STATES.PLAYING) {
    ui.selectByShortcut(parseInt(k) - 1);
    return;
  }
  if (k === 'f1') {
    ui.showHelp();
    return;
  }
});

globalEventBus.on(EVENTS.TASK_FAIL, ({ task }) => {
  globalEventBus.emit(EVENTS.UI_TOAST, {
    message: `❌ ${task.title} 失败！`,
    type: 'error',
    duration: 3500,
  });
  renderer.shake(0.3, 6);
  renderer.emitParticles(task.x, task.y, '#ef4444', 16, { speedMax: 120, lifeMax: 0.8 });
});

globalEventBus.on(EVENTS.TASK_COMPLETE, (task) => {
  const timing = task.timeRemaining / task.timeLimit;
  const tag = timing > 0.66 ? '完美！' : timing > 0.33 ? '完成' : '惊险';
  globalEventBus.emit(EVENTS.UI_TOAST, {
    message: `✅ ${task.title} ${tag} +${task.score}分`,
    type: 'success',
    duration: 2800,
  });
  renderer.emitParticles(task.x, task.y, '#4ade80', 24, { speedMax: 140, lifeMax: 1.0 });
  renderer.setSelection(task.x, task.y, '#4ade80');
});

globalEventBus.on(EVENTS.SATISFACTION_CHANGE, (v) => {
  if (v <= 30 && v > 25 && game.state === GAME_STATES.PLAYING) {
    globalEventBus.emit(EVENTS.UI_TOAST, { message: '⚠️ 满意度告急！', type: 'warning', duration: 4000 });
  }
});

ui.showMainMenu();

engine.beforeTick = () => {
  if (ui.state === GAME_STATES.MAIN_MENU) {
    renderer.renderer?.(1 / 60);
  }
};

engine.start();

window.addEventListener('resize', () => {
  setTimeout(() => renderer._resize(), 50);
});

window.__game = game;
window.__ui = ui;
window.__engine = engine;
window.__renderer = renderer;
window.__save = saveManager;
window.__config = configManager;

console.log('%c迷你城市应急调度 · Beta v0.1', 'color:#38bdf8;font-size:16px;font-weight:700;padding:4px 8px;background:rgba(56,189,248,0.1);border-radius:4px');
console.log('%c调试快捷键：', 'color:#facc15;font-weight:700', '` 打开调试面板 · F1 帮助 · Q 自动分配 · 1-5 快捷资源 · Space 暂停 · R 重玩');
