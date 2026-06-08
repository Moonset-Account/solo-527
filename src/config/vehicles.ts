export const VEHICLE_CONFIG = {
  car: {
    speed: 8,
    length: 4,
    width: 2,
  },
  bus: {
    speed: 6,
    length: 10,
    width: 2.5,
  },
  safeDistance: 2,
  maxVehiclesPerLane: 20,
  spawnRateMultipliers: {
    veryLow: 0.3,
    low: 0.5,
    medium: 1.0,
    high: 1.5,
    veryHigh: 2.0,
  },
} as const;

export type VehicleConfigKey = keyof typeof VEHICLE_CONFIG.spawnRateMultipliers;
