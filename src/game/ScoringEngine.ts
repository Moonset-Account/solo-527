import type {
  LevelConfig,
  MetricsSnapshot,
  ScoreResult,
  TargetCondition,
  Vehicle,
} from '@/types';

export class ScoringEngine {
  private readonly WEIGHTS = {
    congestion: 0.3,
    waiting: 0.25,
    speed: 0.15,
    bus: 0.15,
    throughput: 0.15,
  };

  private readonly QUEUE_PENALTY_THRESHOLD = 10;
  private readonly MAX_QUEUE_PENALTY = 30;

  calculateFinalScore(
    metricsHistory: MetricsSnapshot[],
    vehicles: Vehicle[],
    levelConfig: LevelConfig
  ): ScoreResult {
    const avgMetrics = this.averageMetrics(metricsHistory);
    const finalMetrics =
      metricsHistory.length > 0
        ? metricsHistory[metricsHistory.length - 1]
        : this.emptyMetrics();

    const congestionScore = this.calculateCongestionScore(
      avgMetrics.congestionIndex
    );
    const waitingScore = this.calculateWaitingScore(avgMetrics.avgWaitingTime);
    const speedScore = this.calculateSpeedScore(avgMetrics.avgSpeed);
    const busScore = this.calculateBusScore(avgMetrics.busOnTimeRate);
    const throughputScore = this.calculateThroughputScore(
      finalMetrics.throughput,
      levelConfig
    );

    let bonus = 0;
    if (
      avgMetrics.congestionIndex < 20 &&
      avgMetrics.avgWaitingTime < 15 &&
      levelConfig.targetConditions.every((cond) =>
        this.checkCondition(cond, avgMetrics, finalMetrics)
      )
    ) {
      bonus = 15;
    }

    const total = Math.round(
      (congestionScore * this.WEIGHTS.congestion +
        waitingScore * this.WEIGHTS.waiting +
        speedScore * this.WEIGHTS.speed +
        busScore * this.WEIGHTS.bus +
        throughputScore * this.WEIGHTS.throughput) *
        (1 + bonus / 100)
    );

    const maxQueue = Math.max(...Object.values(finalMetrics.queueLengths), 0);
    let queuePenalty = 0;
    if (maxQueue > this.QUEUE_PENALTY_THRESHOLD) {
      queuePenalty = Math.min(
        ((maxQueue - this.QUEUE_PENALTY_THRESHOLD) / 20) *
          this.MAX_QUEUE_PENALTY,
        this.MAX_QUEUE_PENALTY
      );
    }

    const adjustedTotal = Math.max(0, Math.round(total - queuePenalty));

    const { passed, failedConditions } = this.checkAllConditions(
      levelConfig,
      avgMetrics,
      finalMetrics
    );

    let failureReason: string | null = null;
    if (!passed && failedConditions.length > 0) {
      failureReason = this.generateFailureReason(
        failedConditions,
        avgMetrics,
        finalMetrics,
        vehicles
      );
    } else if (maxQueue > 25) {
      failureReason = '交通拥堵严重，排队过长导致路网瘫痪';
    }

    return {
      total: Math.min(100, adjustedTotal),
      breakdown: {
        congestion: Math.round(congestionScore),
        waiting: Math.round(waitingScore),
        speed: Math.round(speedScore),
        bus: Math.round(busScore),
        throughput: Math.round(throughputScore),
        bonus: Math.round(bonus),
      },
      passed,
      failedConditions,
      failureReason,
    };
  }

  private emptyMetrics(): MetricsSnapshot {
    return {
      timestamp: 0,
      congestionIndex: 0,
      avgWaitingTime: 0,
      avgSpeed: 0,
      busOnTimeRate: 0,
      throughput: 0,
      queueLengths: {},
      vehicleCount: 0,
      busCount: 0,
    };
  }

  private averageMetrics(history: MetricsSnapshot[]): MetricsSnapshot {
    if (history.length === 0) return this.emptyMetrics();

    const sum = history.reduce(
      (acc, m) => {
        acc.congestionIndex += m.congestionIndex;
        acc.avgWaitingTime += m.avgWaitingTime;
        acc.avgSpeed += m.avgSpeed;
        acc.busOnTimeRate += m.busOnTimeRate;
        acc.throughput = Math.max(acc.throughput, m.throughput);
        acc.vehicleCount += m.vehicleCount;
        acc.busCount += m.busCount;
        return acc;
      },
      {
        congestionIndex: 0,
        avgWaitingTime: 0,
        avgSpeed: 0,
        busOnTimeRate: 0,
        throughput: 0,
        vehicleCount: 0,
        busCount: 0,
      }
    );

    const n = history.length;
    return {
      timestamp: history[history.length - 1].timestamp,
      congestionIndex: sum.congestionIndex / n,
      avgWaitingTime: sum.avgWaitingTime / n,
      avgSpeed: sum.avgSpeed / n,
      busOnTimeRate: sum.busOnTimeRate / n,
      throughput: sum.throughput,
      queueLengths: history[history.length - 1].queueLengths,
      vehicleCount: sum.vehicleCount / n,
      busCount: sum.busCount / n,
    };
  }

  private calculateCongestionScore(index: number): number {
    if (index <= 20) return 100;
    if (index >= 80) return 20;
    return 100 - ((index - 20) / 60) * 80;
  }

  private calculateWaitingScore(waitingTime: number): number {
    if (waitingTime <= 10) return 100;
    if (waitingTime >= 60) return 25;
    return 100 - ((waitingTime - 10) / 50) * 75;
  }

  private calculateSpeedScore(avgSpeed: number): number {
    if (avgSpeed >= 5) return 100;
    if (avgSpeed <= 1) return 30;
    return 30 + ((avgSpeed - 1) / 4) * 70;
  }

  private calculateBusScore(onTimeRate: number): number {
    return Math.min(100, onTimeRate);
  }

  private calculateThroughputScore(
    throughput: number,
    levelConfig: LevelConfig
  ): number {
    const target = this.estimateTargetThroughput(levelConfig);
    if (target <= 0) return 80;
    const ratio = throughput / target;
    if (ratio >= 1) return 100;
    return Math.round(40 + ratio * 60);
  }

  private estimateTargetThroughput(levelConfig: LevelConfig): number {
    const avgRate =
      levelConfig.spawnPatterns.reduce((s, p) => s + p.rate * p.duration, 0) /
      Math.max(1, levelConfig.duration);
    return Math.round(avgRate * levelConfig.duration * 0.7);
  }

  checkAllConditions(
    levelConfig: LevelConfig,
    avgMetrics: MetricsSnapshot,
    finalMetrics: MetricsSnapshot
  ): { passed: boolean; failedConditions: TargetCondition[] } {
    const failed: TargetCondition[] = [];

    for (const condition of levelConfig.targetConditions) {
      if (!this.checkCondition(condition, avgMetrics, finalMetrics)) {
        failed.push(condition);
      }
    }

    return { passed: failed.length === 0, failedConditions: failed };
  }

  private checkCondition(
    condition: TargetCondition,
    avgMetrics: MetricsSnapshot,
    finalMetrics: MetricsSnapshot
  ): boolean {
    switch (condition.type) {
      case 'congestion_below':
        return avgMetrics.congestionIndex < condition.value;
      case 'avg_wait_below':
        return avgMetrics.avgWaitingTime < condition.value;
      case 'bus_on_time_above':
        return avgMetrics.busOnTimeRate >= condition.value;
      case 'throughput_above':
        return finalMetrics.throughput >= condition.value;
    }
  }

  private generateFailureReason(
    failedConditions: TargetCondition[],
    avgMetrics: MetricsSnapshot,
    _finalMetrics: MetricsSnapshot,
    _vehicles: Vehicle[]
  ): string {
    const reasons: string[] = [];

    for (const cond of failedConditions) {
      switch (cond.type) {
        case 'congestion_below':
          reasons.push(
            `平均拥堵指数 ${avgMetrics.congestionIndex.toFixed(1)} 超过目标 ${cond.value}`
          );
          break;
        case 'avg_wait_below':
          reasons.push(
            `平均等待时间 ${avgMetrics.avgWaitingTime.toFixed(1)}s 超过目标 ${cond.value}s`
          );
          break;
        case 'bus_on_time_above':
          reasons.push(
            `公交准点率 ${avgMetrics.busOnTimeRate.toFixed(0)}% 低于目标 ${cond.value}%`
          );
          break;
        case 'throughput_above':
          reasons.push(`通过车辆数未达到目标数量`);
          break;
      }
    }

    return reasons.join('；');
  }

  getMetricHistorySummary(history: MetricsSnapshot[]) {
    return {
      peakCongestion: Math.max(
        0,
        ...history.map((m) => m.congestionIndex)
      ),
      peakWaiting: Math.max(0, ...history.map((m) => m.avgWaitingTime)),
      minSpeed: Math.min(
        Infinity,
        ...history.map((m) => (m.avgSpeed > 0 ? m.avgSpeed : Infinity))
      ),
      totalThroughput:
        history.length > 0 ? history[history.length - 1].throughput : 0,
      avgBusRate:
        history.reduce((s, m) => s + m.busOnTimeRate, 0) /
        Math.max(1, history.length),
    };
  }
}
