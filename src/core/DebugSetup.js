import { DebugPanel } from './UIHelpers.js';
import { globalEventBus, EVENTS } from './EventBus.js';

export function setupDebugPanel(panelEl, game, engine, renderer, input, resources, tasks) {
  const debug = new DebugPanel(panelEl);

  debug.registerSection('perf', '⚙️ 性能');
  debug.addRow('perf', 'FPS', () => engine.fps.toFixed(0));
  debug.addRow('perf', '时间缩放', () => engine.timeScale.toFixed(2) + 'x');
  debug.addRow('perf', '帧号', () => engine.frameCount.toString());
  debug.addRow('perf', '运行时间', () => engine.elapsedTime.toFixed(1) + 's');
  debug.addRow('perf', 'DPR', () => renderer.dpr.toFixed(2));
  debug.addRow('perf', '缩放', () => renderer.camera.zoom.toFixed(2));

  debug.registerSection('game', '🏙️ 游戏状态');
  debug.addRow('game', '阶段', () => game.state || '—');
  debug.addRow('game', '关卡', () => game.levelId ? `L${game.levelId} ${game.levelCfg?.name || ''}` : '主菜单');
  debug.addRow('game', '剩余时间', () => game.timeRemaining != null ? `${(game.timeRemaining).toFixed(0)}s` : '—');
  debug.addRow('game', '得分', () => game.score?.toString() || '0');
  debug.addRow('game', '满意度', () => game.satisfaction?.toFixed(1) + '%' || '—');
  debug.addRow('game', '预算', () => `¥${game.budget?.toFixed(0) || 0}`);
  debug.addRow('game', '累计成本', () => `¥${game.cost?.toFixed(0) || 0}`);
  debug.addRow('game', '失误', () => (game.mistakes || 0).toString());

  debug.registerSection('map', '🗺️ 地图数据');
  debug.addRow('map', '建筑数', () => game.map?.buildings.length || 0);
  debug.addRow('map', '道路节点', () => game.map?.roadGraph.size() || 0);
  debug.addRow('map', '道路段', () => game.map?.roads.length || 0);
  debug.addRow('map', '区域数', () => game.map?.regions.length || 0);
  debug.addRow('map', '灾害区', () => game.map?.hazardAreas.length || 0);
  debug.addRow('map', '相机X', () => renderer.camera.x.toFixed(0));
  debug.addRow('map', '相机Y', () => renderer.camera.y.toFixed(0));

  debug.registerSection('tasks', '📋 任务系统');
  debug.addRow('tasks', '总计', () => tasks?.tasks.length || 0);
  debug.addRow('tasks', '活动中', () => tasks?.getActive().length || 0);
  debug.addRow('tasks', '已完成', () => game.completedCount || 0);
  debug.addRow('tasks', '已失败', () => game.failedCount || 0);
  debug.addRow('tasks', '待派发', () => tasks?.countByStatus().pending || 0);
  debug.addRow('tasks', '灾害数', () => tasks?.disasters.filter(d => d.active).length || 0);
  debug.addRow('tasks', '生成间隔', () => tasks?._taskTimer ? tasks._taskTimer.toFixed(1) + 's' : '—');

  debug.registerSection('resources', '🚚 资源系统');
  debug.addRow('resources', '总数', () => resources?.resources.length || 0);
  debug.addRow('resources', '空闲', () => resources?.getAvailable().length || 0);
  debug.addRow('resources', '调度中', () => (resources?.resources.length || 0) - (resources?.getAvailable().length || 0));
  debug.addRow('resources', '选中', () => resources?.selectedId?.slice(-8) || '无');

  debug.registerSection('controls', '🎮 快捷指令');
  const body = debug.sections['controls']?.body;
  if (body) {
    const addBtn = (label, fn) => {
      const b = document.createElement('button');
      b.className = 'btn btn-sm';
      b.style.margin = '2px';
      b.textContent = label;
      b.onclick = fn;
      body.appendChild(b);
    };
    addBtn('⏩ 快进 2x', () => engine.setTimeScale(2));
    addBtn('⏩ 5x', () => engine.setTimeScale(5));
    addBtn('⏯ 正常', () => engine.setTimeScale(1));
    addBtn('⏸ 暂停', () => { if (engine.paused) engine.resume(); else engine.pause(); });
    addBtn('🎯 生成任务', () => { tasks?._spawnTask(); globalEventBus.emit(EVENTS.UI_TOAST, { message: '调试：已生成任务', type: 'info' }); });
    addBtn('🌧️ 暴雨', () => triggerDebugDisaster('rainstorm', game, tasks));
    addBtn('⚡ 停电', () => triggerDebugDisaster('blackout', game, tasks));
    addBtn('🚧 拥堵', () => triggerDebugDisaster('traffic_jam', game, tasks));
    addBtn('🌊 洪水', () => triggerDebugDisaster('flood', game, tasks));
    addBtn('🔥 火灾', () => triggerDebugDisaster('fire', game, tasks));
    addBtn('💯 +满意度', () => { game.changeSatisfaction(10); globalEventBus.emit(EVENTS.SATISFACTION_CHANGE, game.satisfaction); });
    addBtn('💥 -满意度', () => { game.changeSatisfaction(-10); globalEventBus.emit(EVENTS.SATISFACTION_CHANGE, game.satisfaction); });
    addBtn('💰 +预算', () => { game.budget += 2000; globalEventBus.emit(EVENTS.UI_TOAST, { message: '调试：预算 +2000', type: 'success' }); });
    addBtn('🏆 直接胜利', () => { if (game.state === 'playing') game.endLevel(true); });
    addBtn('💀 直接失败', () => { if (game.state === 'playing') game.endLevel(false); });
    addBtn('🔄 重启关卡', () => game.retryLevel());
  }

  return debug;
}

function triggerDebugDisaster(type, game, tasks) {
  if (!game.map) return;
  const region = game.map.regions[Math.floor(Math.random() * game.map.regions.length)];
  const x = region.cx + (Math.random() - 0.5) * region.radius;
  const y = region.cy + (Math.random() - 0.5) * region.radius;
  const DisasterClass = Object.getPrototypeOf(tasks).constructor;
  const dis = new (Function.prototype.constructor)();
  // Use direct API
  const { DisasterEvent } = window.__debug_refs || {};
  if (DisasterEvent) {
    const d = new DisasterEvent(type, x, y);
    d.activate(game.map);
    tasks.disasters.push(d);
    for (let i = 0; i < 3; i++) tasks._spawnTask(null, d);
    globalEventBus.emit(EVENTS.UI_TOAST, { message: `调试：触发 ${d.def.name}`, type: 'warning' });
  } else {
    globalEventBus.emit(EVENTS.UI_TOAST, { message: `模拟触发灾害`, type: 'warning' });
  }
}
