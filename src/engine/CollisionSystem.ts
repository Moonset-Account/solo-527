import type { Vehicle } from '@/engine/types';

export class CollisionSystem {
  private spatialGrid: Map<string, Vehicle[]> = new Map();
  private cellSize = 10;

  rebuildGrid(vehicles: Vehicle[]): void {
    this.spatialGrid.clear();
    for (const v of vehicles) {
      const key = this.getCellKey(v.position.x, v.position.z);
      const cell = this.spatialGrid.get(key) ?? [];
      cell.push(v);
      this.spatialGrid.set(key, cell);
    }
  }

  getVehiclesNearPoint(x: number, z: number, radius: number): Vehicle[] {
    const results: Vehicle[] = [];
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCZ = Math.floor((z - radius) / this.cellSize);
    const maxCZ = Math.floor((z + radius) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const key = `${cx},${cz}`;
        const cell = this.spatialGrid.get(key);
        if (cell) {
          for (const v of cell) {
            const dist = Math.hypot(v.position.x - x, v.position.z - z);
            if (dist <= radius) {
              results.push(v);
            }
          }
        }
      }
    }
    return results;
  }

  private getCellKey(x: number, z: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(z / this.cellSize)}`;
  }
}
