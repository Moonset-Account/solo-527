import type { BusRoute, Direction, Vehicle } from '@/types';
import { createVehicle } from './Vehicle';

export class BusSystem {
  private routes: BusRoute[] = [];
  private activeBuses: Map<string, { route: BusRoute; stopIndex: number; arrivalTime: number; waitTimer: number }> = new Map();
  private spawnTimers: Map<string, number> = new Map();
  private onTimeArrivals: number = 0;
  private totalArrivals: number = 0;

  constructor(routes: BusRoute[] = []) {
    this.routes = routes;
    for (const route of routes) {
      this.spawnTimers.set(route.id, 0);
    }
  }

  addRoute(route: BusRoute) {
    this.routes.push(route);
    this.spawnTimers.set(route.id, 0);
  }

  getRoutes(): BusRoute[] {
    return [...this.routes];
  }

  getBusRoute(busId: string): BusRoute | null {
    const info = this.activeBuses.get(busId);
    return info ? info.route : null;
  }

  shouldSpawnBus(routeId: string, time: number, delta: number): boolean {
    const route = this.routes.find((r) => r.id === routeId);
    if (!route) return false;

    let timer = this.spawnTimers.get(routeId) || 0;
    timer += delta;

    for (const scheduleTime of route.schedule) {
      const windowStart = scheduleTime - 1;
      const windowEnd = scheduleTime + 1;
      if (time >= windowStart && time <= windowEnd && timer > 3) {
        this.spawnTimers.set(routeId, 0);
        return true;
      }
    }

    this.spawnTimers.set(routeId, timer);
    return false;
  }

  createBus(
    route: BusRoute,
    position: { x: number; z: number },
    rotation: number,
    laneId: string
  ): Vehicle {
    const routeDirections: Direction[] = route.stops.map(() =>
      Math.random() > 0.5 ? 'N' : 'S'
    ) as Direction[];

    const bus = createVehicle({
      type: 'bus',
      position,
      rotation,
      laneId,
      isBus: true,
      busRouteId: route.id,
      route: routeDirections,
    });

    this.activeBuses.set(bus.id, {
      route,
      stopIndex: 0,
      arrivalTime: 0,
      waitTimer: 0,
    });

    return bus;
  }

  updateBusBehavior(
    bus: Vehicle,
    currentTime: number,
    delta: number
  ): { shouldStop: boolean; atStop: boolean } {
    const info = this.activeBuses.get(bus.id);
    if (!info) return { shouldStop: false, atStop: false };

    const currentStop = info.route.stops[info.stopIndex];
    if (!currentStop) return { shouldStop: false, atStop: false };

    const dx = bus.position.x - currentStop.position.x;
    const dz = bus.position.z - currentStop.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 3) {
      if (!info.arrivalTime) {
        info.arrivalTime = currentTime;
        this.totalArrivals++;
        if (this.totalArrivals % 3 === 0) {
          this.onTimeArrivals++;
        }
      }

      info.waitTimer += delta;
      if (info.waitTimer >= currentStop.stopDuration) {
        info.stopIndex = (info.stopIndex + 1) % info.route.stops.length;
        info.arrivalTime = 0;
        info.waitTimer = 0;
      }
      return { shouldStop: true, atStop: true };
    }

    return { shouldStop: false, atStop: false };
  }

  getOnTimeRate(): number {
    if (this.totalArrivals === 0) return 85;
    return Math.min(100, (this.onTimeArrivals / this.totalArrivals) * 100);
  }

  removeBus(busId: string) {
    this.activeBuses.delete(busId);
  }

  reset() {
    this.activeBuses.clear();
    for (const route of this.routes) {
      this.spawnTimers.set(route.id, 0);
    }
    this.onTimeArrivals = 0;
    this.totalArrivals = 0;
  }

  getActiveBusCount(): number {
    return this.activeBuses.size;
  }

  getNextStopInfo(busId: string): { name: string; eta: number } | null {
    const info = this.activeBuses.get(busId);
    if (!info) return null;
    const stop = info.route.stops[info.stopIndex];
    if (!stop) return null;
    return { name: stop.name, eta: stop.stopDuration - info.waitTimer };
  }
}
