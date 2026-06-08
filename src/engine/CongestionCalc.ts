import type { VehicleState } from '@/types';

export function calculateCongestion(vehicles: VehicleState[], roadCount: number): number {
  if (roadCount === 0) return 0;
  const totalVehicles = vehicles.length;
  const waitingVehicles = vehicles.filter((v) => v.waiting).length;
  const avgSpeed = totalVehicles > 0
    ? vehicles.reduce((sum, v) => sum + v.speed, 0) / totalVehicles
    : 0.15;

  const densityFactor = Math.min(1, totalVehicles / (roadCount * 8));
  const waitFactor = totalVehicles > 0 ? waitingVehicles / totalVehicles : 0;
  const speedFactor = 1 - (avgSpeed / 0.15);

  const rawScore = (densityFactor * 30 + waitFactor * 40 + speedFactor * 30);
  return Math.round(Math.max(0, Math.min(100, rawScore)));
}

export function calculateAvgWaitTime(vehicles: VehicleState[]): number {
  const waiting = vehicles.filter((v) => v.waiting);
  return waiting.length;
}
