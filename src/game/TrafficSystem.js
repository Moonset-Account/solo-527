import { Vehicle } from './Vehicle.js';
import { eventBus } from '../core/EventBus.js';

export class TrafficSystem {
  constructor(scene, roadNetwork, trafficLights, levelData) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.trafficLights = trafficLights;
    this.levelData = levelData;
    this.vehicles = [];
    this.spawnTimers = new Map();
    this.time = 0;
    this.vehiclesSpawned = 0;
    this.vehiclesArrived = 0;
    this.cumulativeWaitTime = 0;
    this.metricsHistory = [];
    this.isPaused = false;
    this.isRecording = false;
    this.recordingFrames = [];

    eventBus.on('game:paused', () => { this.isPaused = true; });
    eventBus.on('game:resumed', () => { this.isPaused = false; });
  }

  getSpawnRate() {
    const cfg = this.levelData.trafficConfig;
    let rate = cfg.baseSpawnRate;
    const { morningPeak, eveningPeak } = cfg;
    if (this.time >= morningPeak.start && this.time < morningPeak.end) {
      const t = (this.time - morningPeak.start) / (morningPeak.end - morningPeak.start);
      const peakT = Math.sin(t * Math.PI);
      rate *= 1 + (morningPeak.multiplier - 1) * peakT;
    }
    if (this.time >= eveningPeak.start && this.time < eveningPeak.end) {
      const t = (this.time - eveningPeak.start) / (eveningPeak.end - eveningPeak.start);
      const peakT = Math.sin(t * Math.PI);
      rate *= 1 + (eveningPeak.multiplier - 1) * peakT;
    }
    return rate;
  }

  getPeakStatus() {
    const cfg = this.levelData.trafficConfig;
    if (this.time >= cfg.morningPeak.start - 5 && this.time < cfg.morningPeak.end + 5) {
      const inPeak = this.time >= cfg.morningPeak.start && this.time < cfg.morningPeak.end;
      return { type: 'morning', active: inPeak, intensity: inPeak ? this._peakIntensity(cfg.morningPeak) : 0 };
    }
    if (this.time >= cfg.eveningPeak.start - 5 && this.time < cfg.eveningPeak.end + 5) {
      const inPeak = this.time >= cfg.eveningPeak.start && this.time < cfg.eveningPeak.end;
      return { type: 'evening', active: inPeak, intensity: inPeak ? this._peakIntensity(cfg.eveningPeak) : 0 };
    }
    return { type: 'normal', active: false, intensity: 0 };
  }

  _peakIntensity(peak) {
    const t = (this.time - peak.start) / (peak.end - peak.start);
    return Math.max(0, Math.sin(t * Math.PI));
  }

  start() {
    this.isRecording = true;
  }

  stop() {
    this.isRecording = false;
  }

  update(dt) {
    if (this.isPaused) return;
    this.time += dt;

    this._spawnVehicles(dt);

    for (const v of this.vehicles) {
      if (!v.alive) continue;
      const ctx = this._getVehicleContext(v);
      v.update(dt, ctx);
      this.cumulativeWaitTime += (v.speed < 0.5 ? dt : 0);
    }

    this.vehicles = this.vehicles.filter((v) => {
      if (v.arrived) {
        this.vehiclesArrived++;
        eventBus.emit('traffic:vehicleArrived', v);
      }
      if (!v.alive) {
        v.dispose();
        return false;
      }
      return true;
    });

    if (this.isRecording) {
      this.recordingFrames.push(this._snapshot());
      if (this.recordingFrames.length > 3600) {
        this.recordingFrames.shift();
      }
    }

    if (Math.floor(this.time * 2) !== this._lastMetricsSnapshot) {
      this._lastMetricsSnapshot = Math.floor(this.time * 2);
      this.metricsHistory.push(this.getMetrics());
      if (this.metricsHistory.length > 1200) {
        this.metricsHistory.shift();
      }
    }
  }

  _snapshot() {
    return this.vehicles.map((v) => ({
      id: v.id,
      type: v.type,
      x: v.position.x,
      z: v.position.z,
      heading: v.heading,
      speed: v.speed,
      color: v.color
    }));
  }

  _getVehicleContext(v) {
    const ctx = {
      shouldStop: false,
      stopDistance: 0,
      isIntersectionArea: false,
      carInFront: null,
      carInFrontDist: Infinity
    };

    let nearestIntersection = null;
    let minDist = Infinity;
    for (const light of this.trafficLights) {
      const dx = light.x - v.position.x;
      const dz = light.z - v.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist && dist < 55) {
        minDist = dist;
        nearestIntersection = light;
      }
    }

    if (nearestIntersection && minDist < 38) {
      ctx.isIntersectionArea = true;
      const vDir = this._getVehicleDirection(v);
      const stopDist = 7.0;
      const triggerDist = 32;
      if (minDist < triggerDist && minDist > stopDist) {
        ctx.shouldStop = nearestIntersection.shouldStop(vDir);
        if (v.isBus && ctx.shouldStop) {
          const granted = nearestIntersection.grantBusPriority(vDir);
          if (granted) {
            ctx.shouldStop = false;
          }
        }
        ctx.stopDistance = minDist - stopDist;
      } else if (minDist <= stopDist) {
        ctx.shouldStop = false;
      }
    }

    for (const other of this.vehicles) {
      if (other.id === v.id || !other.alive) continue;
      const dx = other.position.x - v.position.x;
      const dz = other.position.z - v.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 30) continue;
      const headingDiff = Math.abs(this._angleDiff(other.heading, v.heading));
      if (headingDiff < 0.6 && dist < ctx.carInFrontDist) {
        const fwdX = Math.sin(v.heading);
        const fwdZ = Math.cos(v.heading);
        const fwdDot = dx * fwdX + dz * fwdZ;
        if (fwdDot > -1.0 && dist < ctx.carInFrontDist) {
          ctx.carInFront = other;
          ctx.carInFrontDist = dist;
        }
      }
    }

    return ctx;
  }

  _getVehicleDirection(v) {
    const h = ((v.heading % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (h < Math.PI / 4 || h >= 7 * Math.PI / 4) return 'n';
    if (h >= Math.PI / 4 && h < 3 * Math.PI / 4) return 'e';
    if (h >= 3 * Math.PI / 4 && h < 5 * Math.PI / 4) return 's';
    return 'w';
  }

  _angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }

  _spawnVehicles(dt) {
    const rate = this.getSpawnRate();
    const spawns = this.roadNetwork.getSpawnNodes();
    if (spawns.length === 0) return;

    for (const spawn of spawns) {
      const key = spawn.id;
      if (!this.spawnTimers.has(key)) {
        this.spawnTimers.set(key, Math.random() * 1.5);
      }
      let t = this.spawnTimers.get(key) - dt * rate / spawns.length;
      while (t <= 0) {
        t += 1 / Math.max(0.1, rate / spawns.length);
        this._spawnVehicleFrom(spawn);
      }
      this.spawnTimers.set(key, t);
    }
  }

  _spawnVehicleFrom(spawn) {
    const destinations = Array.from(this.roadNetwork.getSpawnNodes()).filter(
      (s) => s.id !== spawn.id
    );
    if (destinations.length === 0) return;

    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    const path = this._findPath(spawn.id, destination.id);
    if (!path || path.length < 2) return;

    const waypoints = this._pathToWaypoints(path);
    if (waypoints.length < 2) return;

    const cfg = this.levelData.trafficConfig;
    const r = Math.random();
    const isBusChance = r < cfg.busRatio * 0.3;

    const opts = {
      startPos: waypoints[0],
      heading: Math.atan2(
        (waypoints[1].x - waypoints[0].x),
        (waypoints[1].z - waypoints[0].z)
      ),
      waypoints: waypoints.slice(1)
    };

    let vehicle;
    if (isBusChance && this.levelData.busRoutes?.length) {
      const route = this.levelData.busRoutes[0];
      opts.type = 'bus';
      opts.color = route.color;
      opts.busRouteId = route.id;
      vehicle = new Vehicle(this.scene, opts);
    } else {
      const r2 = Math.random();
      if (r2 < 0.08) opts.type = 'truck';
      else if (r2 < 0.18) opts.type = 'suv';
      else if (r2 < 0.26) opts.type = 'taxi';
      vehicle = new Vehicle(this.scene, opts);
    }

    this.vehicles.push(vehicle);
    this.vehiclesSpawned++;
    eventBus.emit('traffic:vehicleSpawned', vehicle);
  }

  _findPath(startId, endId) {
    if (startId === endId) return null;
    const visited = new Set([startId]);
    const queue = [[startId, [startId]]];
    const maxDepth = 12;

    while (queue.length > 0) {
      const [nodeId, path] = queue.shift();
      if (path.length > maxDepth) continue;
      const node = this.roadNetwork.getNode(nodeId);
      if (!node) continue;
      for (const seg of node.outgoing) {
        const nextId = seg.to;
        if (visited.has(nextId)) continue;
        const newPath = [...path, nextId];
        if (nextId === endId) return newPath;
        visited.add(nextId);
        queue.push([nextId, newPath]);
      }
    }

    const allNodes = Array.from(this.roadNetwork.getIntersections()).map((n) => n.id);
    allNodes.push(...Array.from(this.roadNetwork.getSpawnNodes()).map((n) => n.id));
    const altEnd = allNodes[Math.floor(Math.random() * allNodes.length)];
    if (altEnd !== startId) return this._findPath(startId, altEnd);
    return null;
  }

  _pathToWaypoints(path) {
    const waypoints = [];
    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i];
      const node = this.roadNetwork.getNode(nodeId);
      if (!node) continue;

      if (i === 0 || i === path.length - 1) {
        waypoints.push({ x: node.x, z: node.z });
        continue;
      }

      const prevId = path[i - 1];
      const nextId = path[i + 1];
      const prev = this.roadNetwork.getNode(prevId);
      const next = this.roadNetwork.getNode(nextId);
      if (!prev || !next) continue;

      waypoints.push({ x: node.x, z: node.z });
    }

    if (waypoints.length > 1) {
      const wps = [waypoints[0]];
      for (let i = 1; i < waypoints.length; i++) {
        const last = wps[wps.length - 1];
        const cur = waypoints[i];
        const dx = cur.x - last.x;
        const dz = cur.z - last.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 8) {
          const steps = Math.ceil(dist / 8);
          for (let s = 1; s < steps; s++) {
            const t = s / steps;
            wps.push({ x: last.x + dx * t, z: last.z + dz * t });
          }
        }
        wps.push(cur);
      }
      return wps;
    }
    return waypoints;
  }

  getMetrics() {
    const total = this.vehicles.length;
    let stoppedCount = 0;
    let avgSpeed = 0;
    let busCount = 0;
    let busAvgSpeed = 0;
    let slowVehicles = 0;
    let queuedBackPressure = 0;
    for (const v of this.vehicles) {
      const s = v.getAverageSpeed() * 3.6;
      avgSpeed += s;
      if (v.isStopped()) stoppedCount++;
      if (s < 10) slowVehicles++;
      if (v.isBus) {
        busCount++;
        busAvgSpeed += s;
      }
    }
    avgSpeed = total > 0 ? avgSpeed / total : 0;
    busAvgSpeed = busCount > 0 ? busAvgSpeed / busCount : 0;
    queuedBackPressure = total > 0
      ? (stoppedCount * 1.0 + slowVehicles * 0.5) / total
      : 0;

    const congestion = total > 0
      ? Math.min(100,
          queuedBackPressure * 130
          + Math.max(0, 50 - avgSpeed) * 0.8
          + (1 - Math.min(1, avgSpeed / 30)) * 35
        )
      : 0;

    return {
      time: this.time,
      totalVehicles: total,
      activeVehicles: this.vehicles.filter(v => v.alive).length,
      vehiclesSpawned: this.vehiclesSpawned,
      vehiclesArrived: this.vehiclesArrived,
      stoppedCount,
      slowVehicles,
      averageSpeedKmh: avgSpeed,
      busAverageSpeedKmh: busAvgSpeed,
      busCount,
      congestionIndex: congestion,
      cumulativeWaitTime: this.cumulativeWaitTime,
      throughput: this.vehiclesArrived / Math.max(1, this.time) * 60,
      spawnRate: this.getSpawnRate(),
      peakStatus: this.getPeakStatus()
    };
  }

  getRecording() {
    return this.recordingFrames;
  }

  clear() {
    this.vehicles.forEach((v) => v.dispose());
    this.vehicles = [];
    this.spawnTimers.clear();
    this.time = 0;
    this.vehiclesSpawned = 0;
    this.vehiclesArrived = 0;
    this.cumulativeWaitTime = 0;
    this.metricsHistory = [];
    this.recordingFrames = [];
  }

  dispose() {
    this.clear();
  }
}
