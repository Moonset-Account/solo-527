import { GAME_CONFIG } from '../config/GameConfig.js';

export const NODE_TYPES = {
  NORMAL: 'normal',
  JUNCTION: 'junction',
  PLATFORM: 'platform',
  SPAWN: 'spawn',
  TERMINAL: 'terminal',
  SIGNAL: 'signal'
};

export class TrackNode {
  constructor(config) {
    this.id = config.id;
    this.type = config.type || NODE_TYPES.NORMAL;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.gridX = config.gridX || 0;
    this.gridY = config.gridY || 0;

    this.connections = config.connections || [];
    this.altConnections = config.altConnections || [];

    this.isSwitch = config.isSwitch || false;
    this.switchState = config.switchState || 0;
    this.switchLocked = config.switchLocked || false;

    this.platformId = config.platformId || null;
    this.platformName = config.platformName || '';
    this.platformDirection = config.platformDirection || null;

    this.signal = null;
    this.occupied = false;
    this.occupantTrainId = null;

    this.graphics = null;
    this.hitArea = null;
    this.isHovered = false;

    this.label = config.label || '';
  }

  addConnection(nodeId, isAlt = false) {
    if (isAlt) {
      if (!this.altConnections.includes(nodeId)) {
        this.altConnections.push(nodeId);
      }
    } else {
      if (!this.connections.includes(nodeId)) {
        this.connections.push(nodeId);
      }
    }
  }

  removeConnection(nodeId, isAlt = false) {
    const arr = isAlt ? this.altConnections : this.connections;
    const idx = arr.indexOf(nodeId);
    if (idx !== -1) arr.splice(idx, 1);
  }

  getActiveConnections() {
    if (this.isSwitch && this.switchState === 1 && this.altConnections.length > 0) {
      return [...this.altConnections];
    }
    return [...this.connections];
  }

  getAllConnections() {
    return [...this.connections, ...this.altConnections];
  }

  toggleSwitch() {
    if (this.isSwitch && !this.switchLocked && this.altConnections.length > 0) {
      this.switchState = this.switchState === 0 ? 1 : 0;
      return true;
    }
    return false;
  }

  setSwitchState(state) {
    if (this.isSwitch && !this.switchLocked) {
      this.switchState = state === 1 ? 1 : 0;
      return true;
    }
    return false;
  }

  setOccupied(occupied, trainId = null) {
    this.occupied = occupied;
    this.occupantTrainId = occupied ? trainId : null;
  }

  hasConnectionTo(nodeId) {
    return this.connections.includes(nodeId) || this.altConnections.includes(nodeId);
  }

  getActiveConnectionTo(nodeId) {
    const active = this.getActiveConnections();
    return active.includes(nodeId);
  }

  clone() {
    return new TrackNode({
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      gridX: this.gridX,
      gridY: this.gridY,
      connections: [...this.connections],
      altConnections: [...this.altConnections],
      isSwitch: this.isSwitch,
      switchState: this.switchState,
      switchLocked: this.switchLocked,
      platformId: this.platformId,
      platformName: this.platformName,
      platformDirection: this.platformDirection,
      label: this.label
    });
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      gridX: this.gridX,
      gridY: this.gridY,
      connections: [...this.connections],
      altConnections: [...this.altConnections],
      isSwitch: this.isSwitch,
      switchState: this.switchState,
      switchLocked: this.switchLocked,
      platformId: this.platformId,
      platformName: this.platformName,
      platformDirection: this.platformDirection,
      label: this.label
    };
  }
}

export class TrackSegment {
  constructor(fromNodeId, toNodeId) {
    this.fromNodeId = fromNodeId;
    this.toNodeId = toNodeId;
    this.id = `${fromNodeId}_${toNodeId}`;
    this.reverseId = `${toNodeId}_${fromNodeId}`;
    this.length = 1;
    this.graphics = null;
    this.trainsOnSegment = [];
  }

  equals(other) {
    return (
      (this.fromNodeId === other.fromNodeId && this.toNodeId === other.toNodeId) ||
      (this.fromNodeId === other.toNodeId && this.toNodeId === other.fromNodeId)
    );
  }

  containsNode(nodeId) {
    return this.fromNodeId === nodeId || this.toNodeId === nodeId;
  }
}
