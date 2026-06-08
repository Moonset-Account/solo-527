import * as THREE from 'three';
import { eventBus } from '../core/EventBus.js';
import { audioManager } from '../core/AudioManager.js';

const PHASE_DURATIONS = {
  NS_GREEN: 0,
  NS_YELLOW: 1,
  NS_RED: 2,
  EW_GREEN: 3,
  EW_YELLOW: 4,
  EW_RED: 5
};

const LIGHT_STATES = { RED: 'red', YELLOW: 'yellow', GREEN: 'green' };

export class TrafficLight {
  constructor(scene, intersection, config = {}) {
    this.scene = scene;
    this.intersection = intersection;
    this.id = intersection.id;
    this.x = intersection.x;
    this.z = intersection.z;

    this.cycleTime = config.cycleTime || 60;
    this.nsGreenRatio = config.nsGreenRatio || 0.45;
    this.yellowDuration = config.yellowDuration || 3;
    this.allRedDuration = config.allRedDuration || 1;

    this.busPriorityEnabled = config.busPriorityEnabled || false;
    this.busPriorityBonus = config.busPriorityBonus || 5;
    this.rightTurnOnRed = config.rightTurnOnRed !== false;

    this.phaseTime = 0;
    this.phase = PHASE_DURATIONS.NS_GREEN;
    this.nsState = LIGHT_STATES.GREEN;
    this.ewState = LIGHT_STATES.RED;
    this.group = new THREE.Group();
    this.group.position.set(this.x, 0, this.z);
    this.meshes = {};
    this.phaseCallback = null;
    this._buildMeshes();
    this.scene.add(this.group);
    this._updateLightsVisual();
  }

  _buildMeshes() {
    const poleGeom = new THREE.CylinderGeometry(0.12, 0.15, 4.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6, metalness: 0.5 });
    const armGeom = new THREE.BoxGeometry(0.15, 0.15, 3.5);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6, metalness: 0.5 });
    const boxGeom = new THREE.BoxGeometry(1.2, 0.5, 0.6);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.2 });

    const positions = [
      { x: -5, z: -5, ry: Math.PI / 4, dir: 'nw' },
      { x: 5, z: -5, ry: -Math.PI / 4, dir: 'ne' },
      { x: -5, z: 5, ry: 3 * Math.PI / 4, dir: 'sw' },
      { x: 5, z: 5, ry: -3 * Math.PI / 4, dir: 'se' }
    ];

    const lightGeom = new THREE.SphereGeometry(0.18, 12, 12);

    positions.forEach((pos) => {
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(pos.x, 2.25, pos.z);
      pole.castShadow = true;
      this.group.add(pole);

      const arm = new THREE.Mesh(armGeom, armMat);
      arm.position.set(pos.x, 3.8, pos.z + 1.4);
      arm.rotation.x = -Math.PI / 2;
      this.group.add(arm);

      const box1 = new THREE.Mesh(boxGeom, boxMat);
      box1.position.set(pos.x, 4.0, pos.z + 2.8);
      box1.rotation.y = pos.ry;
      this.group.add(box1);

      const box2 = new THREE.Mesh(boxGeom, boxMat);
      box2.position.set(pos.x, 4.0, pos.z + 2.8);
      box2.rotation.y = pos.ry + Math.PI / 2;
      this.group.add(box2);

      ['red', 'yellow', 'green'].forEach((color, idx) => {
        const xOff = 0.35;
        const yOff = -0.4 + idx * 0.4;
        const mat = new THREE.MeshStandardMaterial({
          color: 0x331111,
          emissive: 0x110000,
          emissiveIntensity: 0.1
        });
        const m1 = new THREE.Mesh(lightGeom, mat);
        m1.position.set(pos.x + xOff, 4.0 + yOff, pos.z + 2.8 + 0.35);
        this.group.add(m1);
        this.meshes[`${pos.dir}_ns_${color}`] = m1;

        const mat2 = new THREE.MeshStandardMaterial({
          color: 0x331111,
          emissive: 0x110000,
          emissiveIntensity: 0.1
        });
        const m2 = new THREE.Mesh(lightGeom, mat2);
        m2.position.set(pos.x - 0.35, 4.0 + yOff, pos.z + 2.8 + 0.35);
        this.group.add(m2);
        this.meshes[`${pos.dir}_ew_${color}`] = m2;
      });
    });

    const indicatorGeom = new THREE.RingGeometry(4.3, 4.6, 4);
    const indicatorMat = new THREE.MeshBasicMaterial({
      color: 0x49c77e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    this.groundIndicator = new THREE.Mesh(indicatorGeom, indicatorMat);
    this.groundIndicator.rotation.x = -Math.PI / 2;
    this.groundIndicator.position.y = 0.06;
    this.group.add(this.groundIndicator);
  }

  setConfig(config) {
    const changed = [];
    if (config.cycleTime !== undefined && config.cycleTime !== this.cycleTime) {
      this.cycleTime = Math.max(30, Math.min(120, config.cycleTime));
      changed.push('cycleTime');
    }
    if (config.nsGreenRatio !== undefined && config.nsGreenRatio !== this.nsGreenRatio) {
      this.nsGreenRatio = Math.max(0.2, Math.min(0.75, config.nsGreenRatio));
      changed.push('nsGreenRatio');
    }
    if (config.yellowDuration !== undefined) {
      this.yellowDuration = Math.max(2, Math.min(6, config.yellowDuration));
    }
    if (config.busPriorityEnabled !== undefined) {
      this.busPriorityEnabled = config.busPriorityEnabled;
    }
    if (config.rightTurnOnRed !== undefined) {
      this.rightTurnOnRed = config.rightTurnOnRed;
    }
    if (changed.length > 0) {
      audioManager.playClick();
      eventBus.emit('trafficLight:changed', { id: this.id, config, changes: changed });
      this._showIndicatorFlash();
    }
  }

  getConfig() {
    return {
      cycleTime: this.cycleTime,
      nsGreenRatio: this.nsGreenRatio,
      yellowDuration: this.yellowDuration,
      busPriorityEnabled: this.busPriorityEnabled,
      rightTurnOnRed: this.rightTurnOnRed
    };
  }

  _showIndicatorFlash() {
    const mat = this.groundIndicator.material;
    mat.color.setHex(0x4f8cff);
    mat.opacity = 0.5;
    clearTimeout(this._flashT);
    this._flashT = setTimeout(() => { mat.opacity = 0.0; }, 600);
  }

  update(dt) {
    const nsGreenTime = (this.cycleTime - (this.yellowDuration + this.allRedDuration) * 2) * this.nsGreenRatio;
    const ewGreenTime = (this.cycleTime - (this.yellowDuration + this.allRedDuration) * 2) * (1 - this.nsGreenRatio);

    const phaseSchedule = [
      { id: PHASE_DURATIONS.NS_GREEN, dur: nsGreenTime, ns: 'green', ew: 'red' },
      { id: PHASE_DURATIONS.NS_YELLOW, dur: this.yellowDuration, ns: 'yellow', ew: 'red' },
      { id: PHASE_DURATIONS.NS_RED, dur: this.allRedDuration, ns: 'red', ew: 'red' },
      { id: PHASE_DURATIONS.EW_GREEN, dur: ewGreenTime, ns: 'red', ew: 'green' },
      { id: PHASE_DURATIONS.EW_YELLOW, dur: this.yellowDuration, ns: 'red', ew: 'yellow' },
      { id: PHASE_DURATIONS.EW_RED, dur: this.allRedDuration, ns: 'red', ew: 'red' }
    ];

    this.phaseTime += dt;
    let accumulated = 0;
    let currentPhase = phaseSchedule[0];
    for (const p of phaseSchedule) {
      if (this.phaseTime < accumulated + p.dur) {
        currentPhase = p;
        break;
      }
      accumulated += p.dur;
    }

    if (this.phaseTime >= this.cycleTime) {
      this.phaseTime = 0;
      accumulated = 0;
      currentPhase = phaseSchedule[0];
    }

    if (this.phase !== currentPhase.id) {
      this.phase = currentPhase.id;
      const prevNs = this.nsState;
      const prevEw = this.ewState;
      this.nsState = currentPhase.ns;
      this.ewState = currentPhase.ew;
      this._updateLightsVisual();

      if ((this.nsState === 'green' && prevNs !== 'green') ||
          (this.ewState === 'green' && prevEw !== 'green')) {
        audioManager.play('trafficLight', 0.15);
      }
      if (this.phaseCallback) {
        this.phaseCallback(this.nsState, this.ewState);
      }
      eventBus.emit('trafficLight:phaseChanged', {
        id: this.id,
        nsState: this.nsState,
        ewState: this.ewState
      });
    }

    const mat = this.groundIndicator.material;
    if (this.nsState === 'green') {
      mat.color.setHex(0x49c77e);
      mat.opacity = 0.15;
      this.groundIndicator.rotation.z = 0;
    } else if (this.ewState === 'green') {
      mat.color.setHex(0x49c77e);
      mat.opacity = 0.15;
      this.groundIndicator.rotation.z = Math.PI / 4;
    } else if (this.nsState === 'yellow' || this.ewState === 'yellow') {
      mat.color.setHex(0xffd93d);
      mat.opacity = 0.25;
    } else {
      mat.opacity = 0.0;
    }
  }

  _updateLightsVisual() {
    const setLight = (keys, color, active) => {
      keys.forEach((k) => {
        const m = this.meshes[k];
        if (!m) return;
        const hexMap = {
          red: active ? 0xff3333 : 0x331111,
          yellow: active ? 0xffdd33 : 0x333311,
          green: active ? 0x33ff66 : 0x113311
        };
        m.material.color.setHex(hexMap[color]);
        m.material.emissive.setHex(hexMap[color]);
        m.material.emissiveIntensity = active ? 1.5 : 0.1;
      });
    };

    const dirs = ['nw', 'ne', 'sw', 'se'];
    const colors = ['red', 'yellow', 'green'];
    dirs.forEach((d) => {
      colors.forEach((c) => {
        setLight([`${d}_ns_${c}`], c, this.nsState === c);
        setLight([`${d}_ew_${c}`], c, this.ewState === c);
      });
    });
  }

  canPass(direction) {
    if (direction === 'n' || direction === 's') {
      return this.nsState === LIGHT_STATES.GREEN || this.nsState === LIGHT_STATES.YELLOW;
    }
    return this.ewState === LIGHT_STATES.GREEN || this.ewState === LIGHT_STATES.YELLOW;
  }

  shouldStop(direction, isRightTurn = false) {
    if (direction === 'n' || direction === 's') {
      if (this.nsState === LIGHT_STATES.GREEN) return false;
      if (this.nsState === LIGHT_STATES.YELLOW) return false;
      if (isRightTurn && this.rightTurnOnRed) return false;
      return true;
    } else {
      if (this.ewState === LIGHT_STATES.GREEN) return false;
      if (this.ewState === LIGHT_STATES.YELLOW) return false;
      if (isRightTurn && this.rightTurnOnRed) return false;
      return true;
    }
  }

  grantBusPriority(direction) {
    if (!this.busPriorityEnabled) return false;
    const isNs = direction === 'n' || direction === 's';
    const alreadyGreen = isNs ? this.nsState === LIGHT_STATES.GREEN : this.ewState === LIGHT_STATES.GREEN;
    if (alreadyGreen) return false;

    const inYellow = (isNs ? this.nsState : this.ewState) === LIGHT_STATES.YELLOW;
    if (inYellow) return false;

    const nsGreenTotal = (this.cycleTime - (this.yellowDuration + this.allRedDuration) * 2) * this.nsGreenRatio;
    let targetPhaseTime;
    if (isNs) {
      targetPhaseTime = 0;
    } else {
      targetPhaseTime = nsGreenTotal + this.yellowDuration + this.allRedDuration;
    }
    this.phaseTime = targetPhaseTime;
    audioManager.play('bus', 0.2);
    eventBus.emit('trafficLight:busPriority', { id: this.id, direction });
    return true;
  }

  setPhaseCallback(cb) {
    this.phaseCallback = cb;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
