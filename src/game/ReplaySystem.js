import { Vehicle } from './Vehicle.js';

export class ReplaySystem {
  constructor(scene) {
    this.scene = scene;
    this.recording = null;
    this.ghostVehicles = new Map();
    this.frameIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackSpeed = 1;
    this.frameTime = 0;
    this.frameDuration = 1 / 60;
    this.onUpdate = null;
    this.onComplete = null;
    this._timer = null;
  }

  loadRecording(frames) {
    this.recording = frames;
    this._cleanupGhosts();
    this.frameIndex = 0;
    this.frameTime = 0;
  }

  play(options = {}) {
    if (!this.recording && this.recording.length === 0) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.playbackSpeed = options.speed || 1;
    this.onUpdate = options.onUpdate || null;
    this.onComplete = options.onComplete || null;
    this._startLoop();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  stop() {
    this.isPlaying = false;
    this._stopLoop();
    this._cleanupGhosts();
    this.frameIndex = 0;
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
  }

  seekToFrame(frameIdx) {
    if (!this.recording) return;
    this.frameIndex = Math.max(0, Math.min(this.recording.length - 1, Math.floor(frameIdx)));
    this._applyFrame(this.frameIndex);
  }

  getProgress() {
    if (!this.recording || this.recording.length === 0) return 0;
    return this.frameIndex / this.recording.length;
  }

  getDuration() {
    return this.recording ? this.recording.length * this.frameDuration : 0;
  }

  _startLoop() {
    this._stopLoop();
    this._timer = setInterval(() => {
      this._tick();
    }, 1000 / 60);
  }

  _stopLoop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _tick() {
    if (!this.isPlaying || this.isPaused || !this.recording) return;
    this.frameTime += this.playbackSpeed / 60;
    while (this.frameTime >= this.frameDuration) {
      this.frameTime -= this.frameDuration;
      this.frameIndex++;
      if (this.frameIndex >= this.recording.length) {
        this.isPlaying = false;
        this._stopLoop();
        if (this.onComplete) {
          this.onComplete(this);
        }
        return;
      }
    }
    this._applyFrame(this.frameIndex);
    if (this.onUpdate) {
      this.onUpdate({
        frameIndex: this.frameIndex,
        progress: this.getProgress(),
        time: this.frameIndex * this.frameDuration
      });
    }
  }

  _applyFrame(idx) {
    const frame = this.recording[idx];
    if (!frame) return;
    const currentIds = new Set(frame.map(v => v.id));
    this.ghostVehicles.forEach((veh, id) => {
      if (!currentIds.has(id)) {
        veh.dispose();
        this.ghostVehicles.delete(id);
      }
    });
    frame.forEach((vData) => {
      let ghost = this.ghostVehicles.get(vData.id);
      if (!ghost) {
        ghost = new Vehicle(this.scene, {
          type: vData.type,
          color: vData.color,
          startPos: { x: vData.x, z: vData.z }
        });
        ghost.group.traverse(obj => {
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => {
                m.transparent = true;
                m.opacity = 0.6;
              });
            } else {
              obj.material.transparent = true;
              obj.material.opacity = 0.6;
            }
          }
        });
        this.ghostVehicles.set(vData.id, ghost);
      }
      ghost.setPosition(vData.x, vData.z);
      ghost.setHeading(vData.heading);
    });
  }

  _cleanupGhosts() {
    this.ghostVehicles.forEach((v) => v.dispose());
    this.ghostVehicles.clear();
  }

  dispose() {
    this._stopLoop();
    this._cleanupGhosts();
    this.recording = null;
  }
}
