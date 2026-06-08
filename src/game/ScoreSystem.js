export class ScoreSystem {
  constructor(levelData) {
    this.levelData = levelData;
    this.metrics = [];
    this.highCongestionTime = 0;
    this.peakSeverity = 0;
    this.finalStars = 0;
    this.finalScore = 0;
    this.result = null;
  }

  update(metrics, busMetrics, time) {
    this.metrics.push({ time, ...metrics, ...busMetrics });

    if (metrics.congestionIndex >= this.levelData.failCondition.maxCongestion) {
      this.highCongestionTime += 1 / 60;
    } else {
      this.highCongestionTime = Math.max(0, this.highCongestionTime - 0.5 / 60);
    }

    this.peakSeverity = Math.max(this.peakSeverity, metrics.peakStatus?.intensity || 0);
  }

  hasFailed() {
    return this.highCongestionTime >= this.levelData.failCondition.duration;
  }

  getFailReason() {
    return `拥堵指数超过 ${this.levelData.failCondition.maxCongestion} 持续了 ${this.levelData.failCondition.duration} 秒`;
  }

  calculateResult(trafficMetrics, busMetrics) {
    const avgSpeed = trafficMetrics.averageSpeedKmh;
    const congestion = trafficMetrics.congestionIndex;
    const busOnTime = busMetrics.onTimeRate;

    const { threeStar, twoStar, oneStar } = this.levelData.goals;

    let stars = 0;
    const meetThree = avgSpeed >= threeStar.avgSpeed &&
      congestion <= threeStar.congestionIndex &&
      busOnTime >= threeStar.busOnTime;
    const meetTwo = avgSpeed >= twoStar.avgSpeed &&
      congestion <= twoStar.congestionIndex &&
      busOnTime >= twoStar.busOnTime;
    const meetOne = avgSpeed >= oneStar.avgSpeed &&
      congestion <= oneStar.congestionIndex &&
      busOnTime >= oneStar.busOnTime;

    if (meetThree) stars = 3;
    else if (meetTwo) stars = 2;
    else if (meetOne) stars = 1;
    else stars = 0;

    const speedScore = Math.max(0, Math.min(100, (avgSpeed / Math.max(1, threeStar.avgSpeed)) * 100));
    const congestionScore = Math.max(0, Math.min(100, (1 - congestion / 100) * 100));
    const busScore = Math.max(0, Math.min(100, (busOnTime / 100) * 100));
    const overallScore = Math.round(speedScore * 0.4 + congestionScore * 0.35 + busScore * 0.25);

    let success = stars > 0;
    if (this.hasFailed()) {
      success = false;
      stars = 0;
    }

    const reasons = [];
    if (success) {
      if (avgSpeed >= threeStar.avgSpeed) reasons.push(`平均速度 ${avgSpeed.toFixed(1)} km/h 优秀`);
      if (congestion <= threeStar.congestionIndex) reasons.push(`拥堵指数 ${congestion.toFixed(1)} 优秀`);
      if (busOnTime >= threeStar.busOnTime) reasons.push(`公交准点率 ${busOnTime.toFixed(0)}% 优秀`);
    } else {
      if (avgSpeed < oneStar.avgSpeed) reasons.push(`平均速度 ${avgSpeed.toFixed(1)} km/h 低于目标 ${oneStar.avgSpeed}`);
      if (congestion > oneStar.congestionIndex) reasons.push(`拥堵指数 ${congestion.toFixed(1)} 超过目标 ${oneStar.congestionIndex}`);
      if (busOnTime < oneStar.busOnTime) reasons.push(`公交准点率 ${busOnTime.toFixed(0)}% 低于目标 ${oneStar.busOnTime}%`);
      if (this.hasFailed()) reasons.push(this.getFailReason());
    }

    let nextGoal = '';
    if (!success) {
      if (congestion > oneStar.congestionIndex) {
        nextGoal = `降低拥堵指数到 ${oneStar.congestionIndex} 以下：调整信号灯周期或增加绿灯时间，给更拥堵的方向多分配时间。`;
      } else if (avgSpeed < oneStar.avgSpeed) {
        nextGoal = `提升平均速度到 ${oneStar.avgSpeed} km/h：启用公交优先，优化信号灯相位。`;
      } else {
        nextGoal = `提升公交准点率到 ${oneStar.busOnTime}%：启用公交优先规则。`;
      }
    } else if (stars < 3) {
      const nextTarget = stars === 1 ? twoStar : threeStar;
      nextGoal = `挑战下一颗星：平均速度 ${nextTarget.avgSpeed} km/h，拥堵 ${nextTarget.congestionIndex}，公交 ${nextTarget.busOnTime}%`;
    } else {
      nextGoal = '挑战下一关或进入沙盒模式测试更激进的参数！';
    }

    this.result = {
      success,
      stars,
      overallScore,
      breakdown: {
        speed: { value: avgSpeed, target: threeStar.avgSpeed, score: speedScore, label: '平均速度', unit: 'km/h' },
        congestion: { value: congestion, target: threeStar.congestionIndex, score: congestionScore, label: '拥堵指数', unit: '', lowerBetter: true },
        bus: { value: busOnTime, target: threeStar.busOnTime, score: busScore, label: '公交准点率', unit: '%' },
        throughput: { value: trafficMetrics.throughput, label: '车辆吞吐', unit: '辆/分' }
      },
      vehicles: {
        spawned: trafficMetrics.vehiclesSpawned,
        arrived: trafficMetrics.vehiclesArrived,
        totalWait: trafficMetrics.cumulativeWaitTime
      },
      reasons,
      nextGoal,
      peakSeverity: this.peakSeverity,
      history: this.metrics
    };

    this.finalStars = stars;
    this.finalScore = overallScore;
    return this.result;
  }

  getCurrentStatus() {
    const failProgress = this.highCongestionTime / this.levelData.failCondition.duration;
    return {
      highCongestionTime: this.highCongestionTime,
      failProgress,
      peakSeverity: this.peakSeverity,
      isCritical: failProgress > 0.7,
      willFailSoon: failProgress > 0.5
    };
  }

  reset() {
    this.metrics = [];
    this.highCongestionTime = 0;
    this.peakSeverity = 0;
    this.result = null;
    this.finalStars = 0;
    this.finalScore = 0;
  }
}
