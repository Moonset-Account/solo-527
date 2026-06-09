export class UIManager {
    constructor(game) {
        this.game = game;
        this.container = document.getElementById('ui-layer');
        this.currentView = null;
        this.views = {};
        this._init();
    }

    _init() {
        this._buildViews();
    }

    _buildViews() {
        this.views.menu = this._createView('menu-view');
        this.views.levelSelect = this._createView('level-select-view');
        this.views.gameHUD = this._createView('game-hud-view');
        this.views.settings = this._createView('settings-view');
        this.views.pause = this._createView('pause-view');
        this.views.result = this._createView('result-view');
        this.views.achievements = this._createView('achievements-view');
        this.views.leaderboard = this._createView('leaderboard-view');
        this.views.dailyChallenge = this._createView('daily-view');
        this.views.loading = this._createView('loading-view');
    }

    _createView(className) {
        const div = document.createElement('div');
        div.className = `view ${className}`;
        div.style.display = 'none';
        this.container.appendChild(div);
        return div;
    }

    showView(name) {
        for (const [k, v] of Object.entries(this.views)) {
            v.style.display = (k === name) ? 'flex' : 'none';
        }
        this.currentView = name;
    }

    hideAll() {
        for (const v of Object.values(this.views)) {
            v.style.display = 'none';
        }
        this.currentView = null;
    }

    showMainMenu() {
        const v = this.views.menu;
        v.innerHTML = '';
        const stats = this.game.save.getStats();
        const progress = this.game.save.getProgress();
        const achCount = this.game.save.getAchievements().length;
        const daily = this.game.save.getDailyChallenge();

        v.innerHTML = `
            <div class="menu-content">
                <div class="game-logo">
                    <div class="logo-icon">🏙️</div>
                    <h1 class="game-title">迷你城市应急调度</h1>
                    <p class="game-subtitle">在危机中做出抉择，守护这座城市</p>
                </div>
                <div class="menu-stats">
                    <div class="stat-item"><span class="stat-label">已通关</span><span class="stat-value">${progress.levelsCompleted.length}/5</span></div>
                    <div class="stat-item"><span class="stat-label">处理事件</span><span class="stat-value">${stats.totalEventsHandled}</span></div>
                    <div class="stat-item"><span class="stat-label">成就</span><span class="stat-value">${achCount}/8</span></div>
                </div>
                <div class="menu-buttons">
                    <button class="btn btn-primary btn-lg" id="btn-start">▶ 开始游戏</button>
                    <button class="btn btn-secondary btn-lg" id="btn-daily">🎯 每日挑战${daily ? ' ✓' : ''}</button>
                    <button class="btn btn-secondary" id="btn-levels">📋 关卡选择</button>
                    <div class="btn-row">
                        <button class="btn btn-tertiary" id="btn-achievements">🏆 成就</button>
                        <button class="btn btn-tertiary" id="btn-leaderboard">📊 排行榜</button>
                        <button class="btn btn-tertiary" id="btn-settings">⚙️ 设置</button>
                    </div>
                </div>
                <div class="menu-tips">
                    <p class="tip">💡 提示：使用 WASD 或方向键移动视角，滚轮缩放，点击事件派遣维修队</p>
                </div>
            </div>
        `;

        this._bind(v, 'btn-start', () => {
            this.game.audio.playSfx('click');
            this.game.audio.ensureInit();
            this.showLevelSelect();
        });
        this._bind(v, 'btn-daily', () => {
            this.game.audio.playSfx('click');
            this.game.audio.ensureInit();
            this.showDailyChallenge();
        });
        this._bind(v, 'btn-levels', () => {
            this.game.audio.playSfx('click');
            this.showLevelSelect();
        });
        this._bind(v, 'btn-achievements', () => {
            this.game.audio.playSfx('click');
            this.showAchievements();
        });
        this._bind(v, 'btn-leaderboard', () => {
            this.game.audio.playSfx('click');
            this.showLeaderboard();
        });
        this._bind(v, 'btn-settings', () => {
            this.game.audio.playSfx('click');
            this.showSettings({ fromMenu: true });
        });

        this.showView('menu');
    }

    _bind(el, id, handler) {
        const btn = el.querySelector(`#${id}`);
        if (btn) {
            btn.addEventListener('click', handler);
        }
    }

    showLevelSelect() {
        const v = this.views.levelSelect;
        v.innerHTML = '';
        const { LEVELS } = this.game;
        const progress = this.game.save.getProgress();
        const cards = LEVELS.map((lv, idx) => {
            const stars = progress.levelStars[lv.id] || 0;
            const best = progress.levelBestScore[lv.id] || 0;
            const unlocked = idx === 0 || (progress.levelStars[LEVELS[idx - 1].id] || 0) >= 1;
            const starStr = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
            const difficultyColors = { '简单': 'diff-easy', '普通': 'diff-normal', '困难': 'diff-hard', '地狱': 'diff-hell' };
            return `
                <div class="level-card ${unlocked ? '' : 'locked'} ${difficultyColors[lv.difficulty] || ''}" data-level="${lv.id}">
                    <div class="level-header">
                        <h3>第${lv.id}关：${lv.name}</h3>
                        <span class="level-difficulty">${lv.difficulty}</span>
                    </div>
                    <p class="level-desc">${lv.description}</p>
                    <div class="level-info">
                        <div class="info-row"><span>🌤️ 天气</span><span>${lv.weather}</span></div>
                        <div class="info-row"><span>⏱️ 时长</span><span>${lv.duration}秒</span></div>
                        <div class="info-row"><span>💰 初始预算</span><span>${lv.initialBudget}</span></div>
                        <div class="info-row"><span>👷 维修队</span><span>${lv.initialTeams}支</span></div>
                        <div class="info-row"><span>🎯 目标满意度</span><span>${lv.satisfactionTarget}%</span></div>
                    </div>
                    <div class="level-stars">${starStr}</div>
                    ${best > 0 ? `<div class="level-best">最佳：${best}分</div>` : ''}
                    ${!unlocked ? '<div class="level-locked-overlay">🔒 通关前一关解锁</div>' : ''}
                </div>
            `;
        }).join('');

        v.innerHTML = `
            <div class="level-select-container">
                <div class="ls-header">
                    <button class="btn btn-back" id="btn-ls-back">← 返回</button>
                    <h2>选择关卡</h2>
                    <div style="width:100px;"></div>
                </div>
                <div class="level-grid">${cards}</div>
            </div>
        `;

        this._bind(v, 'btn-ls-back', () => {
            this.game.audio.playSfx('click');
            this.showMainMenu();
        });

        v.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('locked')) return;
                const id = parseInt(card.dataset.level);
                const lv = LEVELS.find(l => l.id === id);
                this.game.audio.playSfx('success');
                this.hideAll();
                this.game.scenes.switchTo('game', { levelConfig: lv });
            });
        });

        this.showView('levelSelect');
    }

    showGameHUD() {
        this.hideAll();
        this.views.gameHUD.style.display = 'block';
        this.currentView = 'gameHUD';
    }

    renderHUD({ game: gameScene }) {
        const v = this.views.gameHUD;
        const r = gameScene.resourceSystem.getSnapshot();
        const events = gameScene.eventSystem.getActiveEvents();
        const tasks = gameScene.taskSystem.getTasks();
        const teams = gameScene.teamSystem.teams;
        const level = gameScene.levelConfig;
        const time = Math.max(0, Math.ceil(gameScene.remainingTime));
        const timeColor = time <= 30 ? 'red' : time <= 60 ? 'yellow' : 'white';
        const satColor = r.satisfaction >= 70 ? 'good' : r.satisfaction >= 40 ? 'warn' : 'bad';

        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const sortedTasks = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        const tasksHTML = sortedTasks.slice(0, 6).map(t => {
            const timeLeft = Math.max(0, Math.ceil((t.deadline - Date.now()) / 1000));
            const pData = t.priorityData;
            const eventInfo = gameScene.eventSystem.events.find(e => e.id === t.eventId);
            const timeRatio = eventInfo ? 1 - (eventInfo.timeActive / eventInfo.timeLimit) : 1;
            const progressColor = timeRatio > 0.6 ? 'good' : timeRatio > 0.3 ? 'warn' : 'bad';
            const statusBadge = t.status === 'pending' ? '待处理' : t.status === 'assigned' ? '已派出' : t.status === 'in_progress' ? '处理中' : t.status;
            return `
                <div class="task-item priority-${t.priority.toLowerCase()}" data-task="${t.id}" data-event="${t.eventId}">
                    <div class="task-priority" style="background:${pData.color}">${pData.label}</div>
                    <div class="task-info">
                        <div class="task-title">${t.buildingName}</div>
                        <div class="task-meta">
                            <span>${eventInfo ? this.game.eventIcons[t.eventType] || '⚠️' : '⚠️'}</span>
                            <span>⏱️ ${timeLeft}s</span>
                            <span class="status-badge status-${t.status}">${statusBadge}</span>
                        </div>
                        <div class="task-progress-bar"><div class="task-progress-fill ${progressColor}" style="width:${Math.max(0, timeRatio * 100)}%"></div></div>
                    </div>
                </div>
            `;
        }).join('') || '<div class="task-empty">暂无任务，一切正常 ✓</div>';

        const teamsHTML = teams.map(t => {
            const isIdle = t.status === 'idle';
            return `
                <div class="team-item ${isIdle ? 'idle' : 'busy'}" data-team="${t.id}">
                    <div class="team-icon">🚒</div>
                    <div class="team-info">
                        <div class="team-name">${t.name}</div>
                        <div class="team-status">${isIdle ? '待命中' : t.status === 'moving' ? '🚗 前往任务' : t.status === 'working' ? '🔧 处理中' : '🔄 返回'}</div>
                    </div>
                    ${isIdle ? '<div class="team-ready">✓</div>' : '<div class="team-busy">…</div>'}
                </div>
            `;
        }).join('');

        v.innerHTML = `
            <div class="hud-top">
                <div class="hud-panel hud-stats">
                    <div class="stat-budget">
                        <span class="stat-icon">💰</span>
                        <span class="stat-value budget">${r.budget.toLocaleString()}</span>
                    </div>
                    <div class="stat-supplies">
                        <span class="stat-icon">📦</span>
                        <span class="stat-value supplies">${r.supplies}</span>
                    </div>
                    <div class="stat-satisfaction">
                        <span class="stat-icon">😊</span>
                        <div class="satisfaction-bar"><div class="satisfaction-fill ${satColor}" style="width:${r.satisfaction}%"></div></div>
                        <span class="stat-value sat-value">${r.satisfaction.toFixed(0)}%</span>
                    </div>
                </div>
                <div class="hud-panel hud-level">
                    <div class="level-name">${level.name}</div>
                    <div class="level-weather">🌤️ ${level.weather}</div>
                </div>
                <div class="hud-panel hud-timer">
                    <div class="timer-label">剩余时间</div>
                    <div class="timer-value" style="color:${timeColor}">${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}</div>
                    <button class="btn btn-mini" id="btn-pause">⏸</button>
                </div>
            </div>
            <div class="hud-left">
                <div class="hud-panel hud-panel-tasks">
                    <div class="panel-title">📋 任务列表 <span class="panel-badge">${tasks.length}</span></div>
                    <div class="task-list">${tasksHTML}</div>
                </div>
            </div>
            <div class="hud-right">
                <div class="hud-panel hud-panel-teams">
                    <div class="panel-title">👷 维修队伍 <span class="panel-badge">${teams.length}</span></div>
                    <div class="team-list">${teamsHTML}</div>
                </div>
                <div class="hud-panel hud-panel-events">
                    <div class="panel-title">🔥 活跃事件 <span class="panel-badge event-badge">${events.length}/${gameScene.eventSystem.maxActive}</span></div>
                    <div class="event-list">
                        ${events.map(e => {
                            const info = this.game.eventConfig[e.type];
                            const timeLeft = Math.max(0, (e.timeLimit - e.timeActive).toFixed(1));
                            const timeRatio = 1 - (e.timeActive / e.timeLimit);
                            const progressColor = timeRatio > 0.6 ? 'good' : timeRatio > 0.3 ? 'warn' : 'bad';
                            return `
                                <div class="event-mini event-type-${e.type}">
                                    <span class="event-icon">${info ? info.icon : '⚠️'}</span>
                                    <div class="event-meta">
                                        <div class="event-loc">${e.buildingName}</div>
                                        <div class="event-progress"><div class="event-pbar-fill ${progressColor}" style="width:${Math.max(0, timeRatio * 100)}%"></div></div>
                                    </div>
                                    <span class="event-time">${timeLeft}s</span>
                                </div>
                            `;
                        }).join('') || '<div class="task-empty">无活跃事件 🌈</div>'}
                    </div>
                </div>
            </div>
            <div class="hud-bottom">
                <div class="hud-tips">
                    <span class="tip-item"><kbd>WASD</kbd> 移动视角</span>
                    <span class="tip-item"><kbd>滚轮</kbd> 缩放</span>
                    <span class="tip-item"><kbd>点击</kbd> 建筑/事件 派遣队伍</span>
                    <span class="tip-item"><kbd>ESC</kbd> 暂停</span>
                </div>
            </div>
        `;

        const pauseBtn = v.querySelector('#btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.game.audio.playSfx('click');
                gameScene.pause();
            });
        }

        v.querySelectorAll('.task-item').forEach(el => {
            el.addEventListener('click', () => {
                const taskId = parseInt(el.dataset.task);
                const eventId = parseInt(el.dataset.event);
                const idleTeam = teams.find(t => t.status === 'idle');
                if (idleTeam) {
                    const ok = gameScene.dispatchSelectedTeamToEvent(idleTeam.id, eventId);
                } else {
                    this.game.audio.playSfx('warning');
                }
            });
        });
    }

    showSettings({ fromMenu = false } = {}) {
        const v = this.views.settings;
        const s = this.game.save.getSettings();
        v.innerHTML = `
            <div class="settings-container">
                <div class="settings-panel">
                    <h2>⚙️ 设置</h2>
                    <div class="settings-section">
                        <h3>🔊 音频</h3>
                        <div class="setting-row">
                            <label>总开关</label>
                            <div class="toggle-switch ${s.audioEnabled ? 'on' : 'off'}" id="set-audio">
                                <div class="toggle-knob"></div>
                            </div>
                        </div>
                        <div class="setting-row">
                            <label>音乐音量</label>
                            <input type="range" min="0" max="100" value="${Math.round(s.musicVolume * 100)}" id="set-music">
                            <span class="range-val">${Math.round(s.musicVolume * 100)}%</span>
                        </div>
                        <div class="setting-row">
                            <label>音效音量</label>
                            <input type="range" min="0" max="100" value="${Math.round(s.sfxVolume * 100)}" id="set-sfx">
                            <span class="range-val">${Math.round(s.sfxVolume * 100)}%</span>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>🎮 游戏</h3>
                        <div class="setting-row">
                            <label>显示网格</label>
                            <div class="toggle-switch ${s.showGrid ? 'on' : 'off'}" id="set-grid">
                                <div class="toggle-knob"></div>
                            </div>
                        </div>
                        <div class="setting-row">
                            <label>视角速度</label>
                            <input type="range" min="50" max="200" value="${Math.round(s.cameraSpeed * 100)}" id="set-cam">
                            <span class="range-val">${Math.round(s.cameraSpeed * 100)}%</span>
                        </div>
                    </div>
                    <div class="settings-section danger-zone">
                        <h3>⚠️ 危险操作</h3>
                        <button class="btn btn-danger btn-sm" id="btn-reset">重置所有数据</button>
                    </div>
                    <div class="settings-actions">
                        <button class="btn btn-primary" id="btn-save-close">保存并返回</button>
                    </div>
                </div>
            </div>
        `;

        const audioToggle = v.querySelector('#set-audio');
        audioToggle.addEventListener('click', () => {
            s.audioEnabled = !s.audioEnabled;
            audioToggle.className = `toggle-switch ${s.audioEnabled ? 'on' : 'off'}`;
            this.game.audio.setEnabled(s.audioEnabled);
        });

        const musicRange = v.querySelector('#set-music');
        const sfxRange = v.querySelector('#set-sfx');
        const camRange = v.querySelector('#set-cam');
        musicRange.addEventListener('input', () => {
            s.musicVolume = musicRange.value / 100;
            v.querySelector('#set-music + .range-val').textContent = musicRange.value + '%';
            this.game.audio.setMusicVolume(s.musicVolume);
        });
        sfxRange.addEventListener('input', () => {
            s.sfxVolume = sfxRange.value / 100;
            v.querySelector('#set-sfx + .range-val').textContent = sfxRange.value + '%';
            this.game.audio.setSfxVolume(s.sfxVolume);
            this.game.audio.playSfx('click');
        });
        camRange.addEventListener('input', () => {
            s.cameraSpeed = camRange.value / 100;
            v.querySelector('#set-cam + .range-val').textContent = camRange.value + '%';
        });

        const gridToggle = v.querySelector('#set-grid');
        gridToggle.addEventListener('click', () => {
            s.showGrid = !s.showGrid;
            gridToggle.className = `toggle-switch ${s.showGrid ? 'on' : 'off'}`;
            const gs = this.game.scenes.getCurrentScene();
            if (gs && gs.cityMap) gs.cityMap.showGrid(s.showGrid);
        });

        v.querySelector('#btn-reset').addEventListener('click', () => {
            if (confirm('确定要重置所有游戏数据吗？此操作不可恢复！')) {
                this.game.save.resetAll();
                this.game.audio.playSfx('warning');
                alert('数据已重置');
            }
        });

        v.querySelector('#btn-save-close').addEventListener('click', () => {
            this.game.save.updateSettings(s);
            this.game.audio.playSfx('success');
            if (fromMenu) this.showMainMenu();
            else {
                this.hideView('settings');
                const gs = this.game.scenes.getCurrentScene();
                if (gs && gs.resume) gs.resume();
            }
        });

        this.showView('settings');
    }

    showPauseMenu({ onResume, onRestart, onQuit }) {
        const v = this.views.pause;
        v.innerHTML = `
            <div class="pause-overlay">
                <div class="pause-panel">
                    <h2>⏸ 游戏暂停</h2>
                    <div class="pause-buttons">
                        <button class="btn btn-primary btn-lg" id="btn-resume">▶ 继续游戏</button>
                        <button class="btn btn-secondary" id="btn-restart">🔄 重新开始</button>
                        <button class="btn btn-tertiary" id="btn-settings-pause">⚙️ 设置</button>
                        <button class="btn btn-danger" id="btn-quit">🚪 返回主菜单</button>
                    </div>
                </div>
            </div>
        `;
        this._bind(v, 'btn-resume', () => { this.game.audio.playSfx('click'); onResume && onResume(); this.hidePauseMenu(); });
        this._bind(v, 'btn-restart', () => { this.game.audio.playSfx('click'); onRestart && onRestart(); });
        this._bind(v, 'btn-settings-pause', () => { this.game.audio.playSfx('click'); this.showSettings({ fromMenu: false }); });
        this._bind(v, 'btn-quit', () => {
            if (confirm('确定要退出当前关卡吗？进度将不会保存。')) {
                this.game.audio.playSfx('click');
                onQuit && onQuit();
            }
        });
        v.style.display = 'flex';
    }

    hidePauseMenu() {
        this.views.pause.style.display = 'none';
    }

    hideView(name) {
        if (this.views[name]) this.views[name].style.display = 'none';
    }

    showResultScreen({ summary, levelConfig, stats, onRetry, onNext, onMenu, onSubmitScore }) {
        const v = this.views.result;
        const passed = summary.passed;
        const breakdown = summary.breakdown;
        const s = summary.stats;
        const grade = summary.grade;

        const starsStr = '⭐'.repeat(summary.stars) + '☆'.repeat(5 - summary.stars);
        const eventStatsHtml = Object.entries(s.eventsByType).map(([type, count]) => {
            const info = this.game.eventConfig[type];
            return `<div class="result-stat-row"><span>${info ? info.icon : '📌'} ${info ? info.name : type}</span><span>${count}次</span></div>`;
        }).join('');

        v.innerHTML = `
            <div class="result-overlay ${passed ? 'passed' : 'failed'}">
                <div class="result-panel">
                    <div class="result-header ${passed ? 'ok' : 'fail'}">
                        <div class="result-grade" style="background:${grade.color}">${grade.letter}</div>
                        <div class="result-info">
                            <h2>${passed ? '🎉 关卡完成！' : '😢 关卡失败'}</h2>
                            <div class="result-level">${levelConfig.name}</div>
                            <div class="result-stars">${starsStr}</div>
                            <div class="result-grade-desc" style="color:${grade.color}">${grade.desc}</div>
                        </div>
                    </div>
                    <div class="result-score">
                        <span class="score-label">最终得分</span>
                        <span class="score-value">${summary.score.toLocaleString()}</span>
                    </div>
                    <div class="result-body">
                        <div class="result-section">
                            <h3>📊 得分明细</h3>
                            <div class="result-stat-row positive"><span>处理事件奖励</span><span>+${breakdown.eventPoints}</span></div>
                            <div class="result-stat-row positive"><span>满意度奖励</span><span>+${breakdown.satBonus}</span></div>
                            <div class="result-stat-row positive"><span>响应速度奖励</span><span>+${breakdown.speedBonus}</span></div>
                            <div class="result-stat-row positive"><span>预算剩余奖励</span><span>+${breakdown.budgetBonus}</span></div>
                            ${breakdown.perfectBonus > 0 ? `<div class="result-stat-row positive special"><span>🏆 零失误奖励</span><span>+${breakdown.perfectBonus}</span></div>` : ''}
                            <div class="result-stat-row negative"><span>事件失败惩罚</span><span>-${breakdown.failPenalty}</span></div>
                            <div class="result-stat-row negative"><span>延误惩罚</span><span>-${breakdown.delayPenalty}</span></div>
                        </div>
                        <div class="result-section">
                            <h3>📋 统计数据</h3>
                            <div class="result-stat-row"><span>游戏时长</span><span>${Math.floor(s.duration)}秒</span></div>
                            <div class="result-stat-row"><span>产生事件</span><span>${s.eventsCreated}</span></div>
                            <div class="result-stat-row ${s.eventsFailed > 0 ? 'negative' : ''}"><span>成功/失败</span><span>${s.eventsResolved}/${s.eventsFailed}</span></div>
                            <div class="result-stat-row"><span>成功率</span><span>${s.successRate}</span></div>
                            <div class="result-stat-row"><span>平均响应</span><span>${s.avgResponseTime}</span></div>
                            <div class="result-stat-row"><span>峰值事件</span><span>${s.peakActiveEvents}个</span></div>
                            ${s.fastestBatch5 ? `<div class="result-stat-row special"><span>⚡ 最快连续处理5个</span><span>${s.fastestBatch5}</span></div>` : ''}
                        </div>
                        <div class="result-section">
                            <h3>💰 经济与资源</h3>
                            <div class="result-stat-row positive"><span>总收入</span><span>+${s.totalBudgetEarned}</span></div>
                            <div class="result-stat-row negative"><span>总支出</span><span>-${s.totalBudgetSpent}</span></div>
                            <div class="result-stat-row ${s.netBudget >= 0 ? 'positive' : 'negative'}"><span>净收益</span><span>${s.netBudget >= 0 ? '+' : ''}${s.netBudget}</span></div>
                            <div class="result-stat-row"><span>消耗物资</span><span>${s.totalSuppliesUsed}单位</span></div>
                        </div>
                        <div class="result-section">
                            <h3>😊 市民满意度</h3>
                            <div class="result-stat-row"><span>起始</span><span>${s.satisfactionStart}%</span></div>
                            <div class="result-stat-row"><span>最低</span><span>${s.satisfactionLowest}%</span></div>
                            <div class="result-stat-row ${s.satisfactionChange >= 0 ? 'positive' : 'negative'}"><span>最终/变化</span><span>${s.satisfactionEnd}% (${s.satisfactionChange >= 0 ? '+' : ''}${s.satisfactionChange})</span></div>
                        </div>
                        ${eventStatsHtml ? `<div class="result-section"><h3>🎯 事件分布</h3>${eventStatsHtml}</div>` : ''}
                    </div>
                    <div class="result-section leaderboard-section">
                        <h3>🏅 提交成绩</h3>
                        <div class="submit-row">
                            <input type="text" id="lb-name" placeholder="输入你的名字（最多10字）" maxlength="10">
                            <button class="btn btn-secondary" id="btn-submit-lb">提交到排行榜</button>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-danger" id="btn-result-menu">🏠 主菜单</button>
                        <button class="btn btn-secondary" id="btn-result-retry">🔄 再玩一次</button>
                        ${passed && summary.stars >= 2 ? `<button class="btn btn-primary" id="btn-result-next">➡️ 下一关</button>` : ''}
                    </div>
                </div>
            </div>
        `;

        this._bind(v, 'btn-result-menu', () => { this.game.audio.playSfx('click'); onMenu && onMenu(); });
        this._bind(v, 'btn-result-retry', () => { this.game.audio.playSfx('click'); onRetry && onRetry(); });
        const nextBtn = v.querySelector('#btn-result-next');
        if (nextBtn) nextBtn.addEventListener('click', () => { this.game.audio.playSfx('success'); onNext && onNext(); });

        const submitBtn = v.querySelector('#btn-submit-lb');
        submitBtn.addEventListener('click', () => {
            const name = v.querySelector('#lb-name').value.trim() || '匿名市长';
            const result = onSubmitScore && onSubmitScore(name);
            if (result) {
                submitBtn.textContent = '✓ 已提交';
                submitBtn.disabled = true;
                this.game.audio.playSfx('achievement');
                setTimeout(() => this.showLeaderboard(), 800);
            }
        });

        v.style.display = 'flex';
        this.currentView = 'result';
    }

    showAchievements() {
        const v = this.views.achievements;
        const unlocked = this.game.save.getAchievements();
        const achs = this.game.ACHIEVEMENTS || [];
        const cards = achs.map(a => {
            const got = unlocked.includes(a.id);
            return `
                <div class="ach-card ${got ? 'unlocked' : 'locked'}">
                    <div class="ach-icon">${got ? a.icon : '🔒'}</div>
                    <div class="ach-info">
                        <h4>${a.name}</h4>
                        <p>${a.description}</p>
                        ${got ? `<div class="ach-reward">+${a.reward.points} 成就点</div>` : '<div class="ach-locked">未解锁</div>'}
                    </div>
                </div>
            `;
        }).join('');
        v.innerHTML = `
            <div class="ach-container">
                <div class="ach-header">
                    <button class="btn btn-back" id="btn-ach-back">← 返回</button>
                    <h2>🏆 成就系统</h2>
                    <div class="ach-progress">${unlocked.length}/${achs.length}</div>
                </div>
                <div class="ach-grid">${cards}</div>
            </div>
        `;
        this._bind(v, 'btn-ach-back', () => { this.game.audio.playSfx('click'); this.showMainMenu(); });
        this.showView('achievements');
    }

    showLeaderboard() {
        const v = this.views.leaderboard;
        const board = this.game.save.getLeaderboard();
        const rows = board.map((r, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            return `
                <div class="lb-row ${i < 3 ? 'top' : ''}">
                    <span class="lb-rank">${medal}</span>
                    <span class="lb-name">${r.name}</span>
                    <span class="lb-level">第${r.levelId}关</span>
                    <span class="lb-score">${r.score.toLocaleString()}</span>
                    <span class="lb-date">${new Date(r.date).toLocaleDateString('zh-CN')}</span>
                </div>
            `;
        }).join('') || '<div class="lb-empty">暂无数据，快去创造纪录吧！</div>';
        v.innerHTML = `
            <div class="lb-container">
                <div class="lb-header">
                    <button class="btn btn-back" id="btn-lb-back">← 返回</button>
                    <h2>📊 排行榜</h2>
                    <div style="width:100px;"></div>
                </div>
                <div class="lb-table">
                    <div class="lb-row lb-head">
                        <span class="lb-rank">排名</span>
                        <span class="lb-name">玩家</span>
                        <span class="lb-level">关卡</span>
                        <span class="lb-score">得分</span>
                        <span class="lb-date">日期</span>
                    </div>
                    ${rows}
                </div>
            </div>
        `;
        this._bind(v, 'btn-lb-back', () => { this.game.audio.playSfx('click'); this.showMainMenu(); });
        this.showView('leaderboard');
    }

    showDailyChallenge() {
        const v = this.views.dailyChallenge;
        const today = this.game.save.getDailyChallenge();
        const { LEVELS } = this.game;
        const seed = new Date().getDate() + new Date().getMonth() * 31;
        const dailyLevel = {
            ...LEVELS[Math.min(seed % LEVELS.length, LEVELS.length - 1)],
            id: 999,
            name: `每日挑战 · ${LEVELS[seed % LEVELS.length].name}`,
            description: today ? '今日挑战已完成，明天再来吧！' : '今日专属挑战关卡，完成可获得额外奖励',
            difficulty: '每日',
            initialBudget: Math.max(600, 1000 - seed * 10),
            eventSpawnRate: Math.min(0.1, 0.04 + seed * 0.002),
            maxActiveEvents: 7,
            satisfactionTarget: 70
        };

        v.innerHTML = `
            <div class="daily-container">
                <div class="daily-header">
                    <button class="btn btn-back" id="btn-daily-back">← 返回</button>
                    <h2>🎯 每日挑战</h2>
                    <div style="width:100px;"></div>
                </div>
                <div class="daily-panel">
                    <div class="daily-info">
                        <h3>${dailyLevel.name}</h3>
                        <p>${dailyLevel.description}</p>
                        <div class="daily-stats">
                            <div class="info-row"><span>🌤️ 天气</span><span>${dailyLevel.weather}</span></div>
                            <div class="info-row"><span>⏱️ 时长</span><span>${dailyLevel.duration}秒</span></div>
                            <div class="info-row"><span>💰 初始预算</span><span>${dailyLevel.initialBudget}</span></div>
                            <div class="info-row"><span>🎯 目标满意度</span><span>${dailyLevel.satisfactionTarget}%</span></div>
                        </div>
                    </div>
                    ${today ? `
                        <div class="daily-complete">
                            <div class="complete-icon">✅</div>
                            <h4>今日挑战已完成！</h4>
                            <p>获得 ${today.stars}⭐ · ${today.score} 分</p>
                            <p class="hint">明日挑战将于 00:00 刷新</p>
                        </div>
                    ` : `
                        <button class="btn btn-primary btn-lg" id="btn-daily-start">🎮 开始今日挑战</button>
                    `}
                </div>
            </div>
        `;
        this._bind(v, 'btn-daily-back', () => { this.game.audio.playSfx('click'); this.showMainMenu(); });
        const startBtn = v.querySelector('#btn-daily-start');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.game.audio.playSfx('success');
                this.hideAll();
                this.game.scenes.switchTo('game', { levelConfig: dailyLevel });
            });
        }
        this.showView('dailyChallenge');
    }
}
