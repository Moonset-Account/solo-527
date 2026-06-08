import { GAME_CONFIG } from '../config/GameConfig.js';

export const TRAIN_STATES = {
  WAITING: 'waiting',
  SPAWNED: 'spawned',
  MOVING: 'moving',
  STOPPED: 'stopped',
  AT_PLATFORM: 'at_platform',
  DEPARTING: 'departing',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
  DERAILED: 'derailed'
};

export class Train {
  constructor(config) {
    this.id = config.id;
    this.name = config.name || `列车-${config.id}`;
    this.type = config.type || 'passenger';
    this.trainNumber = config.trainNumber || '';

    this.state = config.state || TRAIN_STATES.WAITING;

    this.startNodeId = config.startNodeId;
    this.endNodeId = config.endNodeId;
    this.targetPlatformId = config.targetPlatformId || null;
    this.waypoints = config.waypoints || [];
    this.currentPath = [];
    this.currentPathIndex = 0;

    this.currentNodeId = config.currentNodeId || config.startNodeId;
    this.nextNodeId = null;
    this.prevNodeId = null;

    this.progressOnSegment = 0;
    this.segmentLength = 1;

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.angle = 0;
    this.targetAngle = 0;

    this.scheduledDeparture = config.scheduledDeparture || 0;
    this.scheduledArrival = config.scheduledArrival || 100;
    this.platformWaitTime = config.platformWaitTime || 30;
    this.actualDeparture = null;
    this.actualArrival = null;

    this.baseSpeed = config.baseSpeed || (GAME_CONFIG.trainTypes[this.type]?.speed || 1.0);
    this.currentSpeed = 0;
    this.maxSpeed = this.baseSpeed;
    this.acceleration = 0.02;
    this.deceleration = 0.04;

    this.priority = config.priority || (GAME_CONFIG.trainTypes[this.type]?.priority || 1);
    this.priorityManual = null;
    this.finalPriority = this.priority;

    this.color = GAME_CONFIG.trainTypes[this.type]?.color || '#00cec9';
    this.icon = GAME_CONFIG.trainTypes[this.type]?.icon || '🚄';

    this.length = config.length || 3;
    this.cars = [];

    this.isPassenger = this.type === 'passenger' || this.type === 'express';
    this.isFreight = this.type === 'freight';

    this.delayTime = 0;
    this.maxDelay = 60;
    this.delayPenalty = 0;

    this.stopped = false;
    this.stoppedReason = null;

    this.platformProgress = 0;
    this.isAtPlatform = false;

    this.graphics = null;
    this.bodySprite = null;
    this.labelText = null;

    this.conflictFlags = [];
  }

  get typeConfig() {
    return GAME_CONFIG.trainTypes[this.type] || GAME_CONFIG.trainTypes.passenger;
  }

  get displayName() {
    const typeName = this.typeConfig.name;
    return this.trainNumber ? `${typeName} ${this.trainNumber}` : `${typeName} ${this.id}`;
  }

  getFinalPriority() {
    return this.priorityManual !== null ? this.priorityManual : this.priority;
  }

  setManualPriority(priority) {
    this.priorityManual = priority;
    this.finalPriority = priority;
  }

  clearManualPriority() {
    this.priorityManual = null;
    this.finalPriority = this.priority;
  }

  getProgress() {
    const total = this.scheduledArrival - this.scheduledDeparture;
    if (total <= 0) return 0;
    const current = (this.actualDeparture || this.scheduledDeparture) + this.getElapsedTime();
    return Math.min(1, Math.max(0, (current - this.scheduledDeparture) / total));
  }

  getElapsedTime() {
    return 0;
  }

  getScheduleStatus() {
    const elapsed = this.getElapsedTime();
    const scheduledDuration = this.scheduledArrival - this.scheduledDeparture;
    if (elapsed < this.scheduledDeparture) {
      return { status: 'early', text: '未到发车时间', time: this.scheduledDeparture - elapsed };
    }
    if (this.actualArrival !== null) {
      const diff = this.actualArrival - this.scheduledArrival;
      if (diff <= 5) {
        return { status: 'on_time', text: '正点到达', time: 0 };
      } else if (diff <= 20) {
        return { status: 'slight_delay', text: `晚点 ${diff}`, time: diff };
      } else {
        return { status: 'delay', text: `严重晚点 ${diff}`, time: diff };
      }
    }
    const expectedProgress = (elapsed - this.scheduledDeparture) / scheduledDuration;
    if (this.delayTime > 20) {
      return { status: 'delay', text: `已晚点 ${this.delayTime}`, time: this.delayTime };
    } else if (this.delayTime > 5) {
      return { status: 'slight_delay', text: `微晚点 ${this.delayTime}`, time: this.delayTime };
    }
    return { status: 'on_time', text: '正点运行', time: this.delayTime };
  }

  isDelayed() {
    return this.delayTime > 5;
  }

  isSeverelyDelayed() {
    return this.delayTime > this.maxDelay;
  }

  canStart(gameTime) {
    return gameTime >= this.scheduledDeparture;
  }

  start() {
    if (this.state === TRAIN_STATES.WAITING) {
      this.state = TRAIN_STATES.SPAWNED;
      this.actualDeparture = Date.now();
      return true;
    }
    return false;
  }

  arrive() {
    this.state = TRAIN_STATES.COMPLETED;
    this.actualArrival = Date.now();
    return true;
  }

  stop(reason = null) {
    this.stopped = true;
    this.stoppedReason = reason;
    this.currentSpeed = 0;
    if (this.state === TRAIN_STATES.MOVING) {
      this.state = TRAIN_STATES.STOPPED;
    }
  }

  resume() {
    this.stopped = false;
    this.stoppedReason = null;
    if (this.state === TRAIN_STATES.STOPPED) {
      this.state = TRAIN_STATES.MOVING;
    }
  }

  updateSpeed(targetSpeed, deltaTime) {
    const acc = targetSpeed > this.currentSpeed ? this.acceleration : this.deceleration;
    const diff = targetSpeed - this.currentSpeed;
    const change = Math.sign(diff) * Math.min(Math.abs(diff), acc * deltaTime / 16);
    this.currentSpeed = Math.max(0, Math.min(this.maxSpeed, this.currentSpeed + change));
  }

  addDelay(amount) {
    this.delayTime += amount;
    this.delayPenalty += amount * 0.5;
  }

  getScorePenalty() {
    return this.delayPenalty;
  }

  getScoreBonus() {
    const status = this.getScheduleStatus();
    if (status.status === 'on_time') return 100;
    if (status.status === 'slight_delay') return 50;
    return 0;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      trainNumber: this.trainNumber,
      state: this.state,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      targetPlatformId: this.targetPlatformId,
      waypoints: [...this.waypoints],
      currentNodeId: this.currentNodeId,
      nextNodeId: this.nextNodeId,
      progressOnSegment: this.progressOnSegment,
      x: this.x,
      y: this.y,
      angle: this.angle,
      scheduledDeparture: this.scheduledDeparture,
      scheduledArrival: this.scheduledArrival,
      baseSpeed: this.baseSpeed,
      priority: this.priority,
      length: this.length,
      delayTime: this.delayTime,
      actualDeparture: this.actualDeparture,
      actualArrival: this.actualArrival
    };
  }

  clone() {
    return new Train({
      id: this.id,
      name: this.name,
      type: this.type,
      trainNumber: this.trainNumber,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      targetPlatformId: this.targetPlatformId,
      waypoints: [...this.waypoints],
      scheduledDeparture: this.scheduledDeparture,
      scheduledArrival: this.scheduledArrival,
      baseSpeed: this.baseSpeed,
      priority: this.priority,
      length: this.length
    });
  }
}
