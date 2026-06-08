import type { ScoreResult, Vehicle, StarRating } from '@/engine/types';
import { SCORING_CONFIG, calculateStarRating, smoothScore } from '@/config/scoring';

export class ScoreCalculator {
  private smoothedScore = 0;
  private initialized = false;

  calculate(vehicles: Vehicle[], time: number, targetScore: number): ScoreResult {
    if (vehicles.length === 0) {
      return {
        congestionScore: 0,
        throughput: 0,
        avgWaitTime: 0,
        busAvgWaitTime: 0,
        starRating: 3,
      };
    }

    const cars = vehicles.filter(v => v.type === 'car');
    const buses = vehicles.filter(v => v.type === 'bus');

    let totalWeightedWait = 0;
    let totalWeight = 0;

    for (const car of cars) {
      totalWeightedWait += car.waitingTime;
      totalWeight += 1;
    }

    for (const bus of buses) {
      totalWeightedWait += bus.waitingTime * SCORING_CONFIG.busWaitWeight;
      totalWeight += SCORING_CONFIG.busWaitWeight;
    }

    const avgWaitTime = cars.length > 0
      ? cars.reduce((sum, v) => sum + v.waitingTime, 0) / cars.length
      : 0;
    const busAvgWaitTime = buses.length > 0
      ? buses.reduce((sum, v) => sum + v.waitingTime, 0) / buses.length
      : 0;

    const maxWait = 30;
    const rawScore = Math.min(100, (totalWeightedWait / totalWeight / maxWait) * 100);

    if (!this.initialized) {
      this.smoothedScore = rawScore;
      this.initialized = true;
    } else {
      this.smoothedScore = smoothScore(this.smoothedScore, rawScore);
    }

    const congestionScore = Math.round(this.smoothedScore * 10) / 10;
    const throughput = Math.max(0, Math.round((100 - congestionScore) * vehicles.length / 10));
    const starRating = calculateStarRating(congestionScore, targetScore);

    return {
      congestionScore,
      throughput,
      avgWaitTime: Math.round(avgWaitTime * 10) / 10,
      busAvgWaitTime: Math.round(busAvgWaitTime * 10) / 10,
      starRating: starRating as StarRating,
    };
  }

  compareSnapshots(before: ScoreResult, after: ScoreResult): ScoreComparison {
    return {
      congestionDelta: before.congestionScore - after.congestionScore,
      throughputDelta: after.throughput - before.throughput,
      avgWaitDelta: before.avgWaitTime - after.avgWaitTime,
      busWaitDelta: before.busAvgWaitTime - after.busAvgWaitTime,
      starImprovement: after.starRating > before.starRating,
    };
  }

  reset(): void {
    this.smoothedScore = 0;
    this.initialized = false;
  }
}

export interface ScoreComparison {
  congestionDelta: number;
  throughputDelta: number;
  avgWaitDelta: number;
  busWaitDelta: number;
  starImprovement: boolean;
}
