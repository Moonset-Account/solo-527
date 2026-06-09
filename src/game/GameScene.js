import { BaseScene } from '../core/SceneManager.js';
import * as THREE from 'three';
import { CityMap } from './CityMap.js';
import { EventSystem } from './EventSystem.js';
import { TaskSystem } from './TaskSystem.js';
import { TeamSystem } from './TeamSystem.js';
import { ResourceSystem } from './ResourceSystem.js';
import { SettlementReport } from './SettlementReport.js';
import { GAME_CONFIG } from '../data/config.js';
import { LEVELS } from '../data/levels.js';
import { checkAchievements } from '../data/achievements.js';

export class GameScene extends BaseScene {
    constructor(game) {
        super();
        this.game = game;
        this.cityMap = null;
        this.eventSystem = null;
        this.taskSystem = null;
        this.teamSystem = null;
        this.resourceSystem = null;
        this.settlement = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedEvent = null;
        this.selectedTeam = null;
        this.time = 0;
        this.remainingTime = 0;
        this.paused = false;
        this.levelConfig = null;
        this.workingEvents = new Map();
        this.cameraTarget = new THREE.Vector3();
        this.cameraOffset = new THREE.Vector3(0, 18, 14);
        this.cameraInfo = { zoom: 0, gridX: 0, gridY: 0 };
        this.lastFeedbackTime = 0;
        this.hoverHighlight = null;
    }

    getZoomLevel() {
        const y = this.cameraOffset.y;
        const z = (y - 8) / (30 - 8);
        return Math.round((1 - z) * 100);
    }

    async init(data = {}) {
        this.levelConfig = data.levelConfig;
        this._setupCamera();
        this._buildCity();
        this._setupSystems();
        this._configureLevel();
        this._spawnInitialTeams();
    }

    _setupCamera() {
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        const center = this.levelConfig ? this.levelConfig.cityLayout.size * GAME_CONFIG.TILE_SIZE / 2 : 10;
        this.cameraTarget.set(center, 0, center);
        this._updateCamera();
    }

    _updateCamera() {
        this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);
        this.camera.lookAt(this.cameraTarget);
    }

    _buildCity() {
        this.cityMap = new CityMap(this.levelConfig.cityLayout);
        this.threeScene.add(this.cityMap.group);
        this.cityMap.setWeather(this.levelConfig.weather);
    }

    _setupSystems() {
        this.eventSystem = new EventSystem(this.cityMap, this.game.eventBus);
        this.taskSystem = new TaskSystem(this.game.eventBus);
        this.teamSystem = new TeamSystem(this.cityMap, this.game.eventBus);
        this.resourceSystem = new ResourceSystem({
            budget: this.levelConfig.initialBudget,
            supplies: this.levelConfig.initialSupplies
        }, this.game.eventBus);
        this.settlement = new SettlementReport();

        this.threeScene.add(this.eventSystem.group);
        this.threeScene.add(this.teamSystem.group);

        this._wireEvents();
    }

    _wireEvents() {
        this.game.eventBus.on('event:created', (ev) => {
            this.taskSystem.createTask(ev);
            this.settlement.onEventCreated(ev);
            this.game.audio.playSfx('event_start');
            this._showToast(`${GAME_CONFIG.EVENT_TYPES[ev.type].icon} ${ev.buildingName}发生${GAME_CONFIG.EVENT_TYPES[ev.type].name}！`, 'warning');
            this.game.ui.renderHUD({ game: this });
        });

        this.game.eventBus.on('event:resolved', (ev) => {
            const workData = this.workingEvents.get(ev.id);
            const responseTime = workData ? (Date.now() - workData.startedAt) / 1000 : ev.timeActive;
            const timeRatio = 1 - (ev.timeActive / ev.timeLimit);
            const reward = this.resourceSystem.handleEventResolved(ev, timeRatio);
            this.settlement.onEventResolved(ev, responseTime);
            this.settlement.onBudgetChange(reward.reward);
            this.workingEvents.delete(ev.id);
            this.game.audio.playSfx('event_done');
            this._showToast(`✅ ${GAME_CONFIG.EVENT_TYPES[ev.type].name}已解决 +${reward.reward}预算`, 'success');
            this._checkAchievements();
            this.game.ui.renderHUD({ game: this });
        });

        this.game.eventBus.on('event:failed', (ev) => {
            const penalty = this.resourceSystem.handleEventFailed(ev);
            this.settlement.onEventFailed(ev);
            const task = this.taskSystem.tasks.find(t => t.eventId === ev.id);
            if (task) {
                this.taskSystem.failTask(task.id);
                this.settlement.onTaskFailed();
                if (task.assignedTeamId) {
                    this.teamSystem.releaseTeam(task.assignedTeamId);
                }
            }
            this.game.audio.playSfx('error');
            this._showToast(`❌ ${GAME_CONFIG.EVENT_TYPES[ev.type].name}超时失败 -${penalty.penalty}预算`, 'error');
            this.game.ui.renderHUD({ game: this });
        });

        this.game.eventBus.on('team:dispatched', ({ team, task }) => {
            this.resourceSystem.handleTeamDispatch(team, task);
            this.settlement.onSuppliesUsed(task.suppliesRequired);
            this.game.ui.renderHUD({ game: this });
        });

        this.game.eventBus.on('team:arrived', ({ team, taskId }) => {
            const task = this.taskSystem.getTaskById(taskId);
            if (!task) return;
            task.status = 'in_progress';
            const ev = this.eventSystem.events.find(e => e.id === task.eventId);
            if (ev) {
                const workData = {
                    startedAt: Date.now(),
                    teamId: team.id,
                    progress: 0,
                    duration: ev.baseRepairTime * 1000
                };
                this.workingEvents.set(ev.id, workData);
                this._startEventWork(ev, team, task);
            }
        });

        this.game.eventBus.on('task:created', () => this.settlement.onTaskCreated());
        this.game.eventBus.on('task:completed', () => this.settlement.onTaskCompleted());
        this.game.eventBus.on('resource:budget_change', ({ delta }) => this.settlement.onBudgetChange(delta));
        this.game.eventBus.on('resource:satisfaction_change', ({ total }) => this.settlement.onSatisfactionChange(total));

        this.game.eventBus.on('resource:insufficient', (type) => {
            this._showToast(`⚠️ ${type === 'budget' ? '预算' : '物资'}不足！`, 'error');
            this.game.audio.playSfx('warning');
        });
    }

    _startEventWork(ev, team, task) {
        const info = GAME_CONFIG.EVENT_TYPES[ev.type];
        const duration = info.repairTime * (1 + (1 - ev.severity) * 0.3) * 1000;
        const work = this.workingEvents.get(ev.id);
        if (work) work.duration = duration;
        setTimeout(() => {
            if (!ev.resolved && !ev.failed) {
                this.eventSystem.resolveEvent(ev.id);
                this.taskSystem.completeTask(task.id);
                this.teamSystem.releaseTeam(team.id);
            }
        }, duration);
    }

    _configureLevel() {
        this.eventSystem.configure(this.levelConfig);
        this.remainingTime = this.levelConfig.duration;
    }

    _spawnInitialTeams() {
        for (let i = 0; i < this.levelConfig.initialTeams; i++) {
            this.teamSystem.createTeam('repair');
        }
    }

    async onEnter(data = {}) {
        this.paused = false;
        this.game.ui.showGameHUD();
        this.game.ui.renderHUD({ game: this });
        this.game.audio.startAmbient(this.levelConfig.weather === '暴雨' ? 'rain' : 'city');
    }

    async onExit() {
        this.game.audio.stopAmbient();
    }

    handleInput() {
        const input = this.game.input;
        if (!input) return;
        const speed = 0.15;
        const mult = input.isDown('speed_up') ? 2 : 1;
        let moved = false;
        const camSpeed = input.wasPressed('speed_up') ? 1 : 0;
        if (input.isDown('forward')) { this.cameraTarget.z -= speed * mult; moved = true; }
        if (input.isDown('backward')) { this.cameraTarget.z += speed * mult; moved = true; }
        if (input.isDown('left')) { this.cameraTarget.x -= speed * mult; moved = true; }
        if (input.isDown('right')) { this.cameraTarget.x += speed * mult; moved = true; }
        if (camSpeed) {
            this._showToast(`🏃 加速模式 ${mult}x`, 'info');
        }

        const size = this.levelConfig.cityLayout.size * GAME_CONFIG.TILE_SIZE;
        this.cameraTarget.x = Math.max(2, Math.min(size - 2, this.cameraTarget.x));
        this.cameraTarget.z = Math.max(2, Math.min(size - 2, this.cameraTarget.z));

        const gridCenter = this.cityMap ? this.cityMap.worldToGrid(this.cameraTarget) : { x: 0, y: 0 };
        this.cameraInfo.gridX = gridCenter.x;
        this.cameraInfo.gridY = gridCenter.y;

        if (input.wasPressed('cancel')) {
            this._showToast('⏸ 游戏已暂停', 'info');
            this.pause();
        }

        const pointer = input.pointer;
        this.mouse.x = pointer.ndcX;
        this.mouse.y = pointer.ndcY;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.cityMap.group.children, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj && obj.userData && obj.userData.gridX === undefined && obj.parent) obj = obj.parent;
            if (obj && obj.userData && obj.userData.gridX !== undefined) {
                if (!this.hoverHighlight || this.hoverHighlight.gx !== obj.userData.gridX || this.hoverHighlight.gy !== obj.userData.gridY) {
                    if (this.hoverHighlight && this.hoverHighlight.mesh) {
                        this.cityMap.group.remove(this.hoverHighlight.mesh);
                    }
                    const hl = this.cityMap.highlightTile(obj.userData.gridX, obj.userData.gridY, 0x00ffff, 0);
                    if (hl) {
                        this.hoverHighlight = { mesh: hl, gx: obj.userData.gridX, gy: obj.userData.gridY };
                    }
                }
            }
        } else if (this.hoverHighlight) {
            this.cityMap.group.remove(this.hoverHighlight.mesh);
            this.hoverHighlight = null;
        }

        if (pointer.clicked) {
            if (intersects.length > 0) {
                this._handleClick(intersects[0]);
            } else {
                this.selectedEvent = null;
                this.selectedTeam = null;
                this.game.ui.renderHUD({ game: this });
            }
        }

        if (pointer.wheel) {
            const oldZoom = this.getZoomLevel();
            this.cameraOffset.y = Math.max(8, Math.min(30, this.cameraOffset.y - pointer.wheel * 0.01));
            this.cameraOffset.z = this.cameraOffset.y * 0.78;
            const newZoom = this.getZoomLevel();
            const now = Date.now();
            if (now - this.lastFeedbackTime > 800 && Math.abs(newZoom - oldZoom) > 3) {
                this.cameraInfo.zoom = newZoom;
                this._showToast(`🔍 缩放级别：${newZoom}%`, 'info');
                this.lastFeedbackTime = now;
            }
        }
        this.cameraInfo.zoom = this.getZoomLevel();

        this._updateCamera();
    }

    _handleClick(hit) {
        let obj = hit.object;
        while (obj && !obj.userData.gridX && !obj.userData.teamId) {
            obj = obj.parent;
        }
        if (!obj) return;

        if (obj.userData.teamId !== undefined) {
            this.selectedTeam = obj.userData.teamId;
            this.selectedEvent = null;
            this.game.ui.renderHUD({ game: this });
            this.game.audio.playSfx('click');
            return;
        }

        const gx = obj.userData.gridX;
        const gy = obj.userData.gridY;
        if (gx === undefined) return;

        const event = this.eventSystem.getEventAt(gx, gy);
        if (event) {
            this.selectedEvent = event;
            const task = this.taskSystem.tasks.find(t => t.eventId === event.id);
            const idleTeams = this.teamSystem.getIdleTeams();
            if (task && !task.assignedTeamId && idleTeams.length > 0) {
                const team = idleTeams[0];
                this._dispatchTeam(team, task);
            } else {
                this.game.audio.playSfx('click');
            }
            this.game.ui.renderHUD({ game: this });
        }
    }

    _dispatchTeam(team, task) {
        if (!this.resourceSystem.spendBudget(GAME_CONFIG.EVENT_TYPES[task.eventType].cost)) {
            this._showToast('预算不足，无法派遣！', 'error');
            this.game.audio.playSfx('error');
            return false;
        }
        if (!this.resourceSystem.useSupplies(task.suppliesRequired)) {
            this.resourceSystem.earnBudget(GAME_CONFIG.EVENT_TYPES[task.eventType].cost);
            this._showToast('物资不足，无法派遣！', 'error');
            this.game.audio.playSfx('error');
            return false;
        }
        this.taskSystem.assignTeam(task.id, team.id);
        this.teamSystem.assignTask(team.id, task);
        this.game.audio.playSfx('success');
        this._showToast(`🚀 ${team.name}已出发前往${task.buildingName}`, 'info');
        return true;
    }

    dispatchSelectedTeamToEvent(teamId, eventId) {
        const team = this.teamSystem.getTeamById(teamId);
        const task = this.taskSystem.tasks.find(t => t.eventId === eventId);
        if (!team || !task) return false;
        if (team.status !== 'idle') return false;
        return this._dispatchTeam(team, task);
    }

    update(dt) {
        if (this.paused) return;
        super.update(dt);
        this.time += dt;
        this.remainingTime -= dt;

        this.handleInput();

        if (this.remainingTime <= 0) {
            this._endLevel(true);
            return;
        }

        if (this.resourceSystem.satisfaction <= 0) {
            this._endLevel(false);
            return;
        }

        this.cityMap && this.teamSystem && this.teamSystem.update(dt);
        this.eventSystem.update(dt, this.time);
        this.taskSystem.update(dt);

        if (Math.random() < dt * 1) {
            this.eventSystem.tickSpawn();
        }

        if (Math.random() < dt * 0.01) {
            this._triggerRandomCongestion();
        }

        if (Math.floor(this.time) !== Math.floor(this.time - dt)) {
            this._onSecondTick();
        }

        this.settlement.onActiveEvents(this.eventSystem.getActiveEvents().length);
    }

    _triggerRandomCongestion() {
        const roads = this.cityMap.layout.roads;
        const r = roads[Math.floor(Math.random() * roads.length)];
        const wasCongested = r.congested;
        const newValue = !wasCongested && Math.random() < 0.3;
        if (newValue !== wasCongested) {
            this.cityMap.setCongested(r.x, r.y, newValue);
            if (newValue) this._showToast('⚠️ 有路段出现交通拥堵', 'warning');
        }
    }

    _onSecondTick() {
        if (Math.floor(this.time) % 10 === 0) {
            this.resourceSystem.tickTaxes();
        }
        this.game.ui.renderHUD({ game: this });

        if (Math.floor(this.remainingTime) === 30 || Math.floor(this.remainingTime) === 10) {
            this._showToast(`⏰ 剩余 ${Math.ceil(this.remainingTime)} 秒`, 'warning');
        }
    }

    pause() {
        this.paused = true;
        this.game.ui.showPauseMenu({
            onResume: () => this.resume(),
            onRestart: () => this._restartLevel(),
            onQuit: () => this._quitToMenu()
        });
    }

    resume() {
        this.paused = false;
        this.game.ui.hidePauseMenu();
    }

    _restartLevel() {
        this.manager.switchTo('game', { levelConfig: this.levelConfig });
    }

    _quitToMenu() {
        this.game.save.clearCurrentGame();
        this.manager.switchTo('menu');
    }

    _endLevel(timeUp) {
        const summary = this.settlement.finalize(this.resourceSystem);
        summary.timeUp = timeUp;
        summary.satisfactionFailed = this.resourceSystem.satisfaction <= 0;
        summary.passed = this.resourceSystem.satisfaction >= (this.levelConfig.satisfactionTarget || 50);
        summary.levelId = this.levelConfig.id;

        this.game.save.completeLevel(
            this.levelConfig.id,
            summary.passed ? summary.stars : 0,
            summary.score
        );
        this.game.save.updateStats({
            levelsCompleted: summary.passed ? 1 : 0,
            totalEventsHandled: this.settlement.eventsResolved,
            totalBudgetEarned: this.settlement.totalBudgetEarned,
            eventStats: this.settlement.eventsByType,
            maxEndBudget: Math.max(0, this.resourceSystem.budget),
            maxSatisfaction: Math.max(0, this.resourceSystem.satisfaction),
            perfectRuns: this.settlement.perfectRun ? 1 : 0,
            totalFailures: this.satisfactionFailed ? 1 : 0
        });
        if (this.settlement.fastestBatchTime) {
            this.game.save.updateStats({ fastestBatch5: this.settlement.fastestBatchTime });
        }

        this.game.audio.playSfx(summary.passed ? 'level_complete' : 'level_fail');
        this.game.ui.showResultScreen({
            summary,
            levelConfig: this.levelConfig,
            stats: this.game.save.getStats(),
            onRetry: () => this._restartLevel(),
            onNext: () => this._nextLevel(),
            onMenu: () => this._quitToMenu(),
            onSubmitScore: (name) => this._submitScore(name, summary)
        });
        this.game.save.clearCurrentGame();
    }

    _nextLevel() {
        const idx = LEVELS.findIndex(l => l.id === this.levelConfig.id);
        const next = LEVELS[idx + 1];
        if (next) {
            this.manager.switchTo('game', { levelConfig: next });
        } else {
            this._quitToMenu();
        }
    }

    _submitScore(name, summary) {
        return this.game.save.addToLeaderboard(name, summary.score, this.levelConfig.id);
    }

    _checkAchievements() {
        const stats = this.game.save.getStats();
        const unlocked = this.game.save.getAchievements();
        const newly = checkAchievements(stats, unlocked);
        for (const ach of newly) {
            if (this.game.save.unlockAchievement(ach.id)) {
                this.game.audio.playSfx('achievement');
                this._showToast(`🏆 解锁成就：${ach.name}！`, 'achievement');
            }
        }
    }

    _showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}
