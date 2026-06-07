const { heartRateData, actualTrainings, recoveryScores } = require('../data/mockData');

class ETLService {
  cleanHeartRateData(rawData) {
    return rawData
      .filter(hr => hr.heartRate >= 40 && hr.heartRate <= 220)
      .map(hr => ({
        ...hr,
        heartRate: Math.round(hr.heartRate),
        timestamp: new Date(hr.timestamp).getTime()
      }));
  }

  calculateLoad(training) {
    return training.actualSets * training.actualReps * training.actualIntensity;
  }

  aggregateDailyLoad(athleteId, date) {
    const dayTrainings = actualTrainings.filter(
      t => t.athleteId === athleteId && t.date === date
    );
    return dayTrainings.reduce((sum, t) => sum + this.calculateLoad(t), 0);
  }

  calculateAcuteChronicWorkloadRatio(athleteId, endDate) {
    const end = new Date(endDate);
    const acuteStart = new Date(end);
    acuteStart.setDate(acuteStart.getDate() - 7);
    const chronicStart = new Date(end);
    chronicStart.setDate(chronicStart.getDate() - 28);

    let acuteLoad = 0;
    let chronicLoad = 0;
    const dates = new Set();

    actualTrainings
      .filter(t => t.athleteId === athleteId)
      .forEach(t => {
        const d = new Date(t.date);
        if (d >= acuteStart && d <= end) {
          acuteLoad += this.calculateLoad(t);
        }
        if (d >= chronicStart && d <= end) {
          chronicLoad += this.calculateLoad(t);
          dates.add(t.date);
        }
      });

    const chronicAvg = dates.size > 0 ? chronicLoad / dates.size * 7 : 0;

    return {
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicLoad),
      acwr: chronicAvg > 0 ? Math.round((acuteLoad / chronicAvg) * 100) / 100 : 0,
      risk: chronicAvg === 0 ? 'unknown' :
        acuteLoad / chronicAvg > 1.5 ? 'high' :
        acuteLoad / chronicAvg < 0.8 ? 'low' : 'optimal'
    };
  }

  detectAnomalies(data, metricKey, threshold = 2) {
    if (data.length < 5) return [];

    const values = data.map(d => d[metricKey]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    return data.filter(d => {
      const zScore = Math.abs((d[metricKey] - mean) / std);
      return zScore > threshold;
    }).map(d => ({
      ...d,
      anomalyScore: Math.round(Math.abs((d[metricKey] - mean) / std) * 100) / 100,
      expected: Math.round(mean),
      deviation: Math.round(d[metricKey] - mean)
    }));
  }

  transformTrainingForChart(trainings, dimension = 'date') {
    const grouped = {};
    trainings.forEach(t => {
      const key = t[dimension];
      if (!grouped[key]) {
        grouped[key] = { key, load: 0, intensity: 0, volume: 0, count: 0, completionRate: 0 };
      }
      grouped[key].load += this.calculateLoad(t);
      grouped[key].intensity += t.actualIntensity;
      grouped[key].count++;
      grouped[key].completionRate += t.completionRate || 0;
    });

    return Object.values(grouped).map(g => ({
      ...g,
      intensity: Math.round(g.intensity / g.count),
      completionRate: Math.round(g.completionRate / g.count)
    }));
  }
}

module.exports = new ETLService();
