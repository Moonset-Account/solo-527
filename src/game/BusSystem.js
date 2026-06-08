import { Vehicle } from './Vehicle.js';
import { eventBus } from '../core/EventBus.js';

export class BusSystem {
  constructor(scene, roadNetwork, trafficLights, levelData) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.trafficLights = trafficLights;
    this.levelData = levelData;
    this.routes = [];
    this.buses = [];
    this.scheduledArrivals = new Map();
    this.onTimeCount = 0;
    this.totalArrivals = 0;
    this.time = 0;
    this._initRoutes();
  }

  _initRoutes() {
    const routes = this.levelData.busRoutes || [];
    routes.forEach((route) => {
      const waypoints = this._buildRouteWaypoints(route.stops);
      const schedule = this._buildSchedule(route.interval);
      this.routes.push({
        id: route.id,
        color: route.color || 0xff4444,
        stops: route.stops,
        interval: route.interval,
        waypoints,
        schedule,
        spawnCount: 0
      });
    });
    console.log('[BusSystem] 初始化 ' + this.routes.length + ' 条线路');
    this.routes.forEach((r) => {
      console.log('  线路 ' + r.id + ': ' + r.stops.join(' → ') + ' 班次=' + r.schedule.length);
    });
  }

  _buildRouteWaypoints(stopIds) {
    const waypoints = [];
    for (let i = 0; i < stopIds.length - 1; i++) {
      const fromId = stopIds[i];
      const toId = stopIds[i + 1];
      const path = this._findPath(fromId, toId);
      if (!path) {
        console.warn('[BusSystem] 路径查找失败: ' + fromId + ' -> ' + toId);
        continue;
      }
      for (let j = 0; j < path.length; j++) {
        const nodeId = path[j];
        const node = this.roadNetwork.getNode(nodeId);
        if (!node) continue;
        const isRouteEnd = (i === stopIds.length - 2 && j === path.length - 1);
        waypoints.push({
          x: node.x,
          z: node.z,
          isStop: j === path.length - 1,
          stopId: j === path.length - 1 ? toId : null,
          isRouteEnd
        });
      }
    }
    const wps = [waypoints[0]];
    for (let i = 1; i < waypoints.length; i++) {
      const last = wps[wps.length - 1];
      const cur = waypoints[i];
      const dx = cur.x - last.x;
      const dz = cur.z - last.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 6) {
        const steps = Math.ceil(dist / 6);
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          wps.push({
            x: last.x + dx * t,
            z: last.z + dz * t,
            isStop: false,
            stopId: null,
            isRouteEnd: false
          });
        }
      }
      wps.push(cur);
    }
    return wps;
  }

  _buildSchedule(interval) {
    const schedule = [];
    const duration = this.levelData.duration || 120;
    const startOffset = 8;
    for (let t = startOffset; t < duration - 20; t += interval) {
      schedule.push(t);
    }
    return schedule;
  }

  _findPath(startId, endId) {
    if (startId === endId) return null;
    const visited = new Set([startId]);
    const queue = [[startId, [startId]]];
    const maxDepth = 20;
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
    console.warn('[BusSystem] 找不到路径 ' + startId + ' -> ' + endId);
    return null;
  }

  update(dt) {
    this.time += dt;

    for (const route of this.routes) {
      for (let i = 0; i < route.schedule.length; i++) {
        const schedTime = route.schedule[i];
        const key = route.id + '_' + schedTime;
        if (this.scheduledArrivals.has(key)) continue;
        if (this.time >= schedTime && this.time < schedTime + 8) {
          this.scheduledArrivals.set(key, { time: schedTime, spawned: true });
          this._spawnBus(route, schedTime);
        }
      }
    }

    for (const bus of this.buses) {
      if (!bus.alive) continue;
      this._updateBus(bus, dt);
    }

    this.buses = this.buses.filter((b) => {
      if (!b.alive) {
        b.dispose();
        return false;
      }
      return true;
    });
  }

  _spawnBus(route, scheduledTime) {
    const startNode = this.roadNetwork.getNode(route.stops[0]);
    if (!startNode || !route.waypoints.length) return;

    const waypoints = route.waypoints.slice();
    const startWp = waypoints[0];
    const nextWp = waypoints[1] || startWp;

    const opts = {
      type: 'bus',
      color: route.color,
      busRouteId: route.id,
      startPos: { x: startWp.x, z: startWp.z },
      heading: Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z),
      waypoints: waypoints.slice(1)
    };

    const bus = new Vehicle(this.scene, opts);
    bus.userData = bus.userData || {};
    bus.userData.route = route.id;
    bus.userData.scheduledTime = scheduledTime;
    bus.userData.expectedArrival = scheduledTime + this._estimateTravelTime(route);
    bus.userData.stopIndex = 0;
    bus.userData.stopsVisited = new Set();
    this.buses.push(bus);
    route.spawnCount++;
    eventBus.emit('bus:spawned', { route: route.id, scheduledTime });
  }

  _estimateTravelTime(route) {
    if (!route.waypoints || route.waypoints.length < 2) return 25;
    let totalDist = 0;
    for (let i = 1; i < route.waypoints.length; i++) {
      const dx = route.waypoints[i].x - route.waypoints[i - 1].x;
      const dz = route.waypoints[i].z - route.waypoints[i - 1].z;
      totalDist += Math.sqrt(dx * dx + dz * dz);
    }
    const stopCount = route.waypoints.filter((w) => w.isStop).length;
    return totalDist / 9 + stopCount * 5;
  }

  _updateBus(bus, dt) {
    if (!bus.waypoints || bus.waypointIndex >= bus.waypoints.length) {
      this._onBusArrived(bus);
      return;
    }

    const idx = bus.waypointIndex;
    const wp = bus.waypoints[idx];
    const dx = wp.x - bus.position.x;
    const dz = wp.z - bus.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 2.0 && wp.isStop && !bus.userData.stopsVisited.has(idx)) {
      bus.userData.stopsVisited.add(idx);
      bus.waitAtBusStop(4);
      eventBus.emit('bus:stopReached', {
        route: bus.userData.route,
        stop: wp.stopId
      });
    }

    const ctx = this._getBusContext(bus);
    bus.update(dt, ctx);
  }

  _getBusContext(bus) {
    const ctx = {
      shouldStop: false,
      stopDistance: 0,
      isIntersectionArea: false,
      carInFront: null,
      carInFrontDist: Infinity
    };

    let nearestLight = null;
    let minDist = Infinity;
    for (const light of this.trafficLights) {
      const dx = light.x - bus.position.x;
      const dz = light.z - bus.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 55 && dist < minDist) {
        minDist = dist;
        nearestLight = light;
      }
    }

    if (nearestLight && minDist < 36) {
      ctx.isIntersectionArea = true;
      const vDir = this._getBusDirection(bus);
      const stopDist = 7.5;
      if (minDist < 32 && minDist > stopDist) {
        ctx.shouldStop = nearestLight.shouldStop(vDir);
        if (ctx.shouldStop) {
          const granted = nearestLight.grantBusPriority(vDir);
          if (granted) ctx.shouldStop = false;
        }
        ctx.stopDistance = minDist - stopDist;
      }
    }

    const allVehicles = [];
    const seen = new Set();
    for (const b of this.buses) {
      if (b.alive && !seen.has(b.id)) { allVehicles.push(b); seen.add(b.id); }
    }
    if (this.trafficSystem && this.trafficSystem.vehicles) {
      for (const v of this.trafficSystem.vehicles) {
        if (v.alive && !seen.has(v.id) && !v.isBus) { allVehicles.push(v); seen.add(v.id); }
      }
    }
    for (const other of allVehicles) {
      if (other.id === bus.id || !other.alive) continue;
      const dx = other.position.x - bus.position.x;
      const dz = other.position.z - bus.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 28) continue;
      const headingDiff = Math.abs(this._angleDiff(other.heading, bus.heading));
      if (headingDiff < 0.65) {
        const fwdX = Math.sin(bus.heading);
        const fwdZ = Math.cos(bus.heading);
        const fwdDot = dx * fwdX + dz * fwdZ;
        if (fwdDot > -1.2 && dist < ctx.carInFrontDist) {
          ctx.carInFront = other;
          ctx.carInFrontDist = dist;
        }
      }
    }
    return ctx;
  }

  _getBusDirection(bus) {
    const h = ((bus.heading % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
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

  _onBusArrived(bus) {
    if (bus.userData.arrivedRecorded) return;
    bus.userData.arrivedRecorded = true;
    this.totalArrivals++;
    const delay = this.time - bus.userData.expectedArrival;
    const onTime = delay <= 90;
    if (onTime) this.onTimeCount++;
    bus.alive = false;
    eventBus.emit('bus:arrived', {
      route: bus.userData.route, delay, onTime
    });
  }

  getMetrics() {
    const activeAlive = this.buses.filter((b) => b.alive).length;
    const totalEver = this.totalArrivals + activeAlive;
    const onTimeRate = this.totalArrivals > 0
      ? (this.onTimeCount / this.totalArrivals) * 100
      : 100;
    return {
      activeBuses: activeAlive,
      totalBuses: totalEver,
      arrivals: this.totalArrivals,
      onTimeCount: this.onTimeCount,
      onTimeRate,
      routes: this.routes.map((r) => ({
        id: r.id, color: r.color, stops: r.stops.length, interval: r.interval,
        spawned: r.spawnCount
      }))
    };
  }

  clear() {
    this.buses.forEach((b) => b.dispose());
    this.buses = [];
    this.scheduledArrivals.clear();
    this.onTimeCount = 0;
    this.totalArrivals = 0;
    this.time = 0;
  }

  dispose() { this.clear(); }
}
