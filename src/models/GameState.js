import { GAME_CONFIG } from '../config/GameConfig.js';

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.status = 'idle';
    this.gameTime = 0;
    this.gameTimeMs = 0;
    this.gameSpeed = GAME_CONFIG.gameSpeed.normal;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    this.levelId = null;
    this.levelData = null;

    this.trains = [];
    this.nodes = {};
    this.signals = [];
    this.segments = [];

    this.completedTrains = [];
    this.failedTrains = [];
    this.currentConflicts = [];

    this.score = 0;
    this.baseScore = 0;
    this.bonusScore = 0;
    this.penaltyScore = 0;

    this.starsEarned = 0;

    this.actions = [];
    this.playerDecisions = [];

    this.tutorialStep = 0;
    this.tutorialCompleted = false;

    this.uiState = {
      selectedTrainId: null,
      selectedNodeId: null,
      selectedSignalId: null,
      showSchedulePanel: true,
      showConflictPanel: true,
      toastMessages: [],
      dialogVisible: false,
      dialogData: null
    };
  }

  startLevel(levelData) {
    this.reset();
    this.levelData = levelData;
    this.levelId = levelData.id;
    this.status = 'ready';
  }

  startGame() {
    if (this.status === 'ready') {
      this.status = 'running';
    }
  }

  pause() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.isPaused = true;
    }
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.isPaused = false;
    }
  }

  setGameSpeed(speed) {
    this.gameSpeed = speed;
    window.EventBus?.emit('game:speedChange', speed);
  }

  update(deltaMs) {
    if (this.status !== 'running') return;

    const deltaGame = deltaMs * this.gameSpeed;
    this.gameTimeMs += deltaGame;
    this.gameTime = this.gameTimeMs / 1000;
  }

  addScore(points, reason = '') {
    this.score += points;
    if (points > 0) {
      this.bonusScore += points;
    } else {
      this.penaltyScore += Math.abs(points);
    }
  }

  getElapsedTimeMs() {
    return this.gameTimeMs;
  }

  getElapsedTime() {
    return this.gameTime;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getGameTimeFormatted() {
    return this.formatTime(this.gameTime);
  }

  getRemainingParTime() {
    if (!this.levelData?.parTime) return 0;
    return Math.max(0, this.levelData.parTime - this.gameTime);
  }

  isRunning() {
    return this.status === 'running';
  }

  isReady() {
    return this.status === 'ready';
  }

  getTrainById(id) {
    return this.trains.find(t => t.id === id) || null;
  }

  getNodeById(id) {
    return this.nodes[id] || null;
  }

  getSignalById(id) {
    return this.signals.find(s => s.id === id) || null;
  }

  getSignalByNodeId(nodeId) {
    return this.signals.find(s => s.nodeId === nodeId) || null;
  }

  getTrainsByState(state) {
    return this.trains.filter(t => t.state === state);
  }

  getActiveTrains() {
    return this.trains.filter(t =>
      t.state === 'moving' ||
      t.state === 'stopped' ||
      t.state === 'at_platform' ||
      t.state === 'spawned'
    );
  }

  getCompletedTrains() {
    return this.trains.filter(t => t.state === 'completed');
  }

  getTrainCompletionCount() {
    return this.trains.filter(t => t.state === 'completed').length;
  }

  getOnTimeRate() {
    const completed = this.getCompletedTrains();
    if (completed.length === 0) return 100;
    const onTime = completed.filter(t => {
      if (!t.actualArrival) return false;
      return (t.actualArrival - t.scheduledArrival) <= 10;
    }).length;
    return Math.round((onTime / completed.length) * 100);
  }

  areAllTrainsCompleted() {
    return this.trains.length > 0 &&
      this.trains.every(t => t.state === 'completed' || t.state === 'derailed');
  }

  canVictory() {
    if (!this.areAllTrainsCompleted()) return false;
    return true;
  }

  recordAction(type, details) {
    this.actions.push({
      time: this.gameTime,
      type,
      details
    });
    window.EventBus?.emit('record:action', {
      time: this.gameTime,
      type,
      details
    });
  }

  selectTrain(trainId) {
    this.uiState.selectedTrainId = trainId;
    this.uiState.selectedNodeId = null;
    this.uiState.selectedSignalId = null;
  }

  selectNode(nodeId) {
    this.uiState.selectedNodeId = nodeId;
    this.uiState.selectedTrainId = null;
    this.uiState.selectedSignalId = null;
  }

  selectSignal(signalId) {
    this.uiState.selectedSignalId = signalId;
    this.uiState.selectedTrainId = null;
    this.uiState.selectedNodeId = null;
  }

  clearSelection() {
    this.uiState.selectedTrainId = null;
    this.uiState.selectedNodeId = null;
    this.uiState.selectedSignalId = null;
  }

  toJSON() {
    return {
      status: this.status,
      gameTime: this.gameTime,
      levelId: this.levelId,
      trains: this.trains.map(t => t.toJSON()),
      score: this.score,
      starsEarned: this.starsEarned,
      actions: [...this.actions]
    };
  }

  getReplaySnapshot() {
    return {
      timestamp: this.gameTime,
      trains: this.trains.map(t => ({
        id: t.id,
        state: t.state,
        x: t.x,
        y: t.y,
        angle: t.angle,
        currentNodeId: t.currentNodeId,
        nextNodeId: t.nextNodeId,
        progressOnSegment: t.progressOnSegment,
        currentSpeed: t.currentSpeed,
        delayTime: t.delayTime
      })),
      signals: this.signals.map(s => ({
        id: s.id,
        state: s.state,
        nodeId: s.nodeId
      })),
      switches: Object.values(this.nodes)
        .filter(n => n.isSwitch)
        .map(n => ({
          id: n.id,
          switchState: n.switchState
        })),
      score: this.score,
      conflicts: this.currentConflicts.map(c => c.toJSON())
    };
  }
}
