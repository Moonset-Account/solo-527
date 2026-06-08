import { GAME_CONFIG } from '../config/GameConfig.js';
import { Train, TRAIN_STATES } from './Train.js';
import { TrackNode } from './TrackNode.js';
import { Signal, SIGNAL_STATES } from './Signal.js';

export class ConflictInfo {
  constructor(config) {
    this.id = config.id || `conflict_${Date.now()}`;
    this.type = config.type;
    this.severity = config.severity || 'warning';
    this.trainIds = config.trainIds || [];
    this.nodeIds = config.nodeIds || [];
    this.segmentId = config.segmentId || null;
    this.message = config.message || '';
    this.resolved = false;
    this.resolutionMethod = null;
    this.timestamp = config.timestamp || Date.now();
    this.graphics = [];
  }

  getTypeConfig() {
    return GAME_CONFIG.conflictTypes[this.type] || {
      id: this.type,
      name: '未知冲突',
      description: '发生了无法识别的冲突',
      severity: 'warning'
    };
  }

  getDisplayName() {
    return this.getTypeConfig().name;
  }

  getDescription() {
    return this.getTypeConfig().description;
  }

  isCritical() {
    return this.severity === 'critical';
  }

  resolve(method) {
    this.resolved = true;
    this.resolutionMethod = method;
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      trainIds: [...this.trainIds],
      nodeIds: [...this.nodeIds],
      segmentId: this.segmentId,
      message: this.message,
      resolved: this.resolved,
      resolutionMethod: this.resolutionMethod,
      timestamp: this.timestamp
    };
  }
}

export class ConflictDetector {
  constructor() {
    this.activeConflicts = [];
    this.conflictHistory = [];
    this.criticalFailureDetected = false;
  }

  reset() {
    this.activeConflicts = [];
    this.conflictHistory = [];
    this.criticalFailureDetected = false;
  }

  detectAll(nodes, signals, trains) {
    this.activeConflicts = [];
    this.criticalFailureDetected = false;

    this.checkSameTrackConflicts(trains, nodes);
    this.checkPlatformOccupied(trains, nodes);
    this.checkDelayChain(trains);
    this.checkSignalViolations(trains, signals, nodes);
    this.checkSwitchErrors(trains, nodes);

    this.activeConflicts.forEach(c => {
      if (c.isCritical()) {
        this.criticalFailureDetected = true;
      }
    });

    return this.activeConflicts;
  }

  checkSameTrackConflicts(trains, nodes) {
    const activeTrains = trains.filter(t =>
      t.state === TRAIN_STATES.MOVING ||
      t.state === TRAIN_STATES.STOPPED
    );

    for (let i = 0; i < activeTrains.length; i++) {
      for (let j = i + 1; j < activeTrains.length; j++) {
        const t1 = activeTrains[i];
        const t2 = activeTrains[j];

        if (t1.currentNodeId === t2.currentNodeId) {
          this.addConflict(new ConflictInfo({
            type: 'sameTrack',
            severity: 'critical',
            trainIds: [t1.id, t2.id],
            nodeIds: [t1.currentNodeId],
            message: `${t1.displayName} 与 ${t2.displayName} 在同一节点`
          }));
        }

        if (t1.nextNodeId && t2.nextNodeId) {
          const t1Seg = [t1.currentNodeId, t1.nextNodeId].sort().join('_');
          const t2Seg = [t2.currentNodeId, t2.nextNodeId].sort().join('_');

          if (t1Seg === t2Seg) {
            const facingEachOther = (
              (t1.currentNodeId === t2.nextNodeId && t1.nextNodeId === t2.currentNodeId) ||
              (Math.abs(t1.progressOnSegment - t2.progressOnSegment) < 0.2 &&
                (t1.currentNodeId !== t2.currentNodeId))
            );

            this.addConflict(new ConflictInfo({
              type: 'sameTrack',
              severity: 'critical',
              trainIds: [t1.id, t2.id],
              segmentId: t1Seg,
              message: facingEachOther
                ? `${t1.displayName} 与 ${t2.displayName} 在同一轨道对向行驶`
                : `${t1.displayName} 与 ${t2.displayName} 在同一轨道段`
            }));
          }
        }
      }
    }
  }

  checkPlatformOccupied(trains, nodes) {
    const platformMap = new Map();

    trains.forEach(t => {
      const node = nodes[t.currentNodeId];
      if (node && node.platformId &&
        (t.state === TRAIN_STATES.AT_PLATFORM ||
          t.state === TRAIN_STATES.STOPPED ||
          t.state === TRAIN_STATES.MOVING)) {
        if (!platformMap.has(node.platformId)) {
          platformMap.set(node.platformId, []);
        }
        platformMap.get(node.platformId).push(t);
      }
    });

    platformMap.forEach((trainsAtPlatform, platformId) => {
      if (trainsAtPlatform.length > 1) {
        const node = Object.values(nodes).find(n => n.platformId === platformId);
        this.addConflict(new ConflictInfo({
          type: 'platformOccupied',
          severity: 'warning',
          trainIds: trainsAtPlatform.map(t => t.id),
          nodeIds: node ? [node.id] : [],
          message: `站台 ${node?.platformName || platformId} 被 ${trainsAtPlatform.map(t => t.displayName).join('、')} 同时占用`
        }));
      }
    });

    trains.forEach(t => {
      if (t.state === TRAIN_STATES.MOVING && t.targetPlatformId) {
        const targetNode = Object.values(nodes).find(
          n => n.platformId === t.targetPlatformId && n.type === 'platform'
        );
        if (targetNode && targetNode.occupied && targetNode.occupantTrainId !== t.id) {
          const occupant = trains.find(tr => tr.id === targetNode.occupantTrainId);
          this.addConflict(new ConflictInfo({
            type: 'platformOccupied',
            severity: 'warning',
            trainIds: [t.id, occupant?.id].filter(Boolean),
            nodeIds: [targetNode.id],
            message: `目标站台 ${targetNode.platformName} 被 ${occupant?.displayName || '其他列车'} 占用`
          }));
        }
      }
    });
  }

  checkDelayChain(trains) {
    const completedTrains = trains.filter(t => t.actualArrival !== null);
    const delayedTrains = completedTrains.filter(t => {
      const diff = t.actualArrival - t.scheduledArrival;
      return diff > 10;
    });

    const activeDelayed = trains.filter(t => t.isDelayed() && t.state !== TRAIN_STATES.COMPLETED);

    if (delayedTrains.length >= 2 || activeDelayed.length >= 2) {
      const allDelayed = [...delayedTrains, ...activeDelayed];
      const ids = allDelayed.map(t => t.id).filter(
        (id, i, arr) => arr.indexOf(id) === i
      );

      if (ids.length >= 2) {
        this.addConflict(new ConflictInfo({
          type: 'delayChain',
          severity: 'warning',
          trainIds: ids,
          message: `存在连锁晚点：${allDelayed.slice(0, 3).map(t => `${t.displayName}(+${t.delayTime})`).join(' → ')}`
        }));
      }
    }
  }

  checkSignalViolations(trains, signals, nodes) {
    const signalByNode = new Map();
    signals.forEach(s => {
      signalByNode.set(s.nodeId, s);
    });

    trains.forEach(t => {
      if (t.state === TRAIN_STATES.MOVING && t.currentSpeed > 0.1) {
        const signal = signalByNode.get(t.currentNodeId);
        if (signal && signal.state === SIGNAL_STATES.RED && !signal.locked) {
          this.addConflict(new ConflictInfo({
            type: 'signalViolation',
            severity: 'critical',
            trainIds: [t.id],
            nodeIds: [t.currentNodeId],
            message: `${t.displayName} 在红灯信号 ${signal.label || signal.id} 下通过`
          }));
        }
      }
    });
  }

  checkSwitchErrors(trains, nodes) {
    trains.forEach(t => {
      if (!t.nextNodeId) return;
      const currentNode = nodes[t.currentNodeId];
      if (currentNode && currentNode.isSwitch) {
        const activeConnections = currentNode.getActiveConnections();
        if (!activeConnections.includes(t.nextNodeId)) {
          this.addConflict(new ConflictInfo({
            type: 'switchError',
            severity: 'critical',
            trainIds: [t.id],
            nodeIds: [t.currentNodeId],
            message: `${t.displayName} 通过时道岔 ${currentNode.label || currentNode.id} 位置错误`
          }));
        }
      }

      if (t.prevNodeId) {
        const prevNode = nodes[t.prevNodeId];
        if (prevNode && prevNode.isSwitch && t.progressOnSegment > 0.8) {
          const activeConnections = prevNode.getActiveConnections();
          if (!activeConnections.includes(t.currentNodeId)) {
            this.addConflict(new ConflictInfo({
              type: 'switchError',
              severity: 'critical',
              trainIds: [t.id],
              nodeIds: [prevNode.id],
              message: `${t.displayName} 通过时道岔 ${prevNode.label || prevNode.id} 位置错误`
            }));
          }
        }
      }
    });
  }

  addConflict(conflict) {
    const isDuplicate = this.activeConflicts.some(c => {
      if (c.type !== conflict.type) return false;
      if (c.segmentId && conflict.segmentId) {
        return c.segmentId === conflict.segmentId;
      }
      const cIds = [...c.trainIds].sort().join(',');
      const dIds = [...conflict.trainIds].sort().join(',');
      const cNodes = [...c.nodeIds].sort().join(',');
      const dNodes = [...conflict.nodeIds].sort().join(',');
      return cIds === dIds && cNodes === dNodes;
    });

    if (!isDuplicate) {
      this.activeConflicts.push(conflict);
      this.conflictHistory.push(conflict);
      window.EventBus?.emit('conflict:detected', conflict);
    }
  }

  resolveConflict(conflictId, method) {
    const conflict = this.activeConflicts.find(c => c.id === conflictId);
    if (conflict) {
      conflict.resolve(method);
      window.EventBus?.emit('conflict:resolved', conflict);
      return true;
    }
    return false;
  }

  getActiveConflicts() {
    return [...this.activeConflicts];
  }

  getCriticalConflicts() {
    return this.activeConflicts.filter(c => c.isCritical());
  }

  getWarningConflicts() {
    return this.activeConflicts.filter(c => c.severity === 'warning');
  }

  hasCriticalConflicts() {
    return this.criticalFailureDetected;
  }

  getConflictHistory() {
    return [...this.conflictHistory];
  }

  getConflictCount(type = null) {
    if (type) {
      return this.conflictHistory.filter(c => c.type === type).length;
    }
    return this.conflictHistory.length;
  }

  getSummary() {
    const byType = {};
    this.conflictHistory.forEach(c => {
      if (!byType[c.type]) {
        byType[c.type] = 0;
      }
      byType[c.type]++;
    });

    return {
      total: this.conflictHistory.length,
      critical: this.conflictHistory.filter(c => c.severity === 'critical').length,
      warning: this.conflictHistory.filter(c => c.severity === 'warning').length,
      resolved: this.conflictHistory.filter(c => c.resolved).length,
      byType
    };
  }
}
