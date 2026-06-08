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
    routes.forEach((route, idx) => {
      const waypoints = this._buildRouteWaypoints(route.stops);
      const schedule = this._buildSchedule(route.interval);
      this.routes.push({
        id: route.id,
        color: route.color || 0xff4444,
        stops: route.stops,
        interval: route.interval,
        waypoints,
        schedule
      });
    });
  }

  _buildRouteWaypoints(stopIds) {
    const waypoints = [];
    for (let i = 0; i < stopIds.length - 1; i++) {
      const fromId = stopIds[i];
      const toId = stopIds[i + 1];
      const path = this._findPath(fromId, toId);
      if (path) {
        for (let j = 0; j < path.length; j++) {
          const node = this.roadNetwork.getNode(path[j]);
          if (node) {
            waypoints.push({
              x: node.x,
              z: node.z,
              isStop: j === path.length - 1 && i < stopIds.length - 1,
              stopId: j === path.length - 1 ? toId : null,
              isRouteEnd: i === stopIds.length - 2 && j === path.length - 1
            });
          }
        }
      }
    }
    return waypoints;
  }

  _buildSchedule(interval) {
    const schedule = [];
    const duration = this.levelData.duration || 120;
    for (let t = 0; t < duration; t += interval) {
      schedule.push(t);
    }
    return schedule;
  }

  _findPath(startId, endId) {
    if (startId === endId) return null;
    const visited = new Set([startId]);
    const queue = [[startId, [startId]]];
    const maxDepth = 15;

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
    return null;
  }

  update(dt) {
    this.time += dt;

    for (const route of this.routes) {
      for (let i = route.schedule.length - 1; i >= 0; i--) {
        const schedTime = route.schedule[i];
        const key = `${route.id}_${schedTime}`;
        if (this.scheduledArrivals.has(key)) continue;
        if (this.time >= schedTime && this.time < schedTime + 30) {
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

    const waypoints = [...route.waypoints];
    const opts = {
      type: 'bus',
      color: route.color,
      busRouteId: route.id,
      startPos: { x: startNode.x, z: startNode.z },
      heading: waypoints.length > 1
        ? Math.atan2(waypoints[1].x - startNode.x, waypoints[1].z - startNode.z)
        : 0,
      waypoints: waypoints.slice(1)
    };

    const bus = new Vehicle(this.scene, opts);
    bus.userData = bus.userData || {};
    bus.userData.route = route.id;
    bus.userData.scheduledTime = scheduledTime;
    bus.userData.expectedArrival = scheduledTime + this._estimateTravelTime(route);
    bus.userData.stopIndex = 0;
    bus.userData.stopsVisited = 0;
    this.buses.push(bus);
    eventBus.emit('bus:spawned', { route: route.id, scheduledTime });
  }

  _estimateTravelTime(route) {
    if (!route.waypoints || route.waypoints.length < 2) return 30;
    let totalDist = 0;
    for (let i = 1; i < route.waypoints.length; i++) {
      const dx = route.waypoints[i].x - route.waypoints[i - 1].x;
      const dz = route.waypoints[i].z - route.waypoints[i - 1].z;
      totalDist += Math.sqrt(dx * dx + dz * dz);
    }
    return totalDist / 10 + route.waypoints.filter(w => w.isStop).length * 5;
  }

  _updateBus(bus, dt) {
    if (!bus.waypoints || bus.waypointIndex >= bus.waypoints.length) {
      this._onBusArrived(bus);
      return;
    }

    const idx = bus.waypointIndex;
    const currentWp = bus.waypoints[idx];
    const dx = currentWp.x - bus.position.x;
    const dz = currentWp.z - bus.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.5 && currentWp.isStop && bus.userData.stopsVisited !== idx) {
      bus.userData.stopsVisited = idx;
      bus.waitAtBusStop(4);
      eventBus.emit('bus:stopReached', {
        route: bus.userData.route,
        stop: currentWp.stopId,
        index: bus.userData.stopIndex
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
      if (dist < minDist && dist < 40) {
        minDist = dist;
        nearestLight = light;
      }
    }

    if (nearestLight && minDist < 25) {
      ctx.isIntersectionArea = true;
      const vDir = this._getBusDirection(bus);
      const stopDist = 6;
      if (minDist < 22 && minDist > stopDist) {
        ctx.shouldStop = nearestLight.shouldStop(vDir);
        if (ctx.shouldStop) {
          const granted = nearestLight.grantBusPriority(vDir);
          if (granted) ctx.shouldStop = false;
        }
        ctx.stopDistance = minDist - stopDist;
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

  _onBusArrived(bus) {
    if (bus.userData.arrivedRecorded) return;
    bus.userData.arrivedRecorded = true;
    this.totalArrivals++;
    const delay = this.time - bus.userData.expectedArrival;
    if (delay <= 60) {
      this.onTimeCount++;
    }
    bus.alive = false;
    eventBus.emit('bus:arrived', {
      route: bus.userData.route,
      delay,
      onTime: delay <= 60
    });
  }

  getMetrics() {
    const onTimeRate = this.totalArrivals > 0
      ? (this.onTimeCount / this.totalArrivals) * 100
      : 100;
    return {
      activeBuses: this.buses.filter(b => b.alive).length,
      totalBuses: this.totalArrivals + this.buses.filter(b => b.alive).length,
      arrivals: this.totalArrivals,
      onTimeCount: this.onTimeCount,
      onTimeRate,
      routes: this.routes.map(r => ({
        id: r.id,
        color: r.color,
        stops: r.stops.length,
        interval: r.interval
      }))
    };
  }

  clear() {
    this.buses.forEach(b => b.dispose());
    this.buses = [];
    this.scheduledArrivals.clear();
    this.onTimeCount = 0;
    this.totalArrivals = 0;
    this.time = 0;
  }

  dispose() {
    this.clear();
  }
}
