const clickhouse = require('../database/clickhouse');
const cache = require('../database/redis');

const { CACHE_KEYS, TTL } = cache;

class DataService {
  async getLoadCurve(params) {
    const { athleteId, sport, startDate, endDate, exercise } = params;
    const cacheKey = cache.buildKey(
      CACHE_KEYS.LOAD_CURVE,
      athleteId || 'all',
      sport || 'all',
      exercise || 'all',
      startDate || 'none',
      endDate || 'none'
    );

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM LOAD_CURVE WHERE 1=1',
        { athleteId, sport, startDate, endDate, exercise }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.MEDIUM);
  }

  async getRecoveryTrend(params) {
    const { athleteId, startDate, endDate } = params;
    const cacheKey = cache.buildKey(
      CACHE_KEYS.RECOVERY_TREND,
      athleteId || 'all',
      startDate || 'none',
      endDate || 'none'
    );

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM RECOVERY_TREND WHERE 1=1',
        { athleteId, startDate, endDate }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.MEDIUM);
  }

  async getTrainingComparison(params) {
    const { athleteIds, metric, startDate, endDate } = params;
    const idsKey = Array.isArray(athleteIds) ? athleteIds.join('_') : athleteIds;
    const cacheKey = cache.buildKey(
      CACHE_KEYS.COMPARISON,
      idsKey,
      metric || 'load',
      startDate || 'none',
      endDate || 'none'
    );

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM TRAINING_COMPARISON WHERE 1=1',
        { athleteIds, metric, startDate, endDate }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.SHORT);
  }

  async getDayTrainings(date, athleteId) {
    const cacheKey = cache.buildKey(
      CACHE_KEYS.DAY_TRAININGS,
      date,
      athleteId || 'all'
    );

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM DAY_TRAININGS WHERE date = :date',
        { date, athleteId }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.SHORT);
  }

  async getTrainingDetail(id) {
    const cacheKey = cache.buildKey(CACHE_KEYS.TRAINING_DETAIL, id);

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM TRAINING_DETAIL WHERE id = :id',
        { id }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.LONG);
  }

  async getAthletes() {
    const cacheKey = cache.buildKey(CACHE_KEYS.ATHLETES, 'list');

    return cache.getOrSet(cacheKey, async () => {
      const mockData = require('../data/mockData');
      return {
        rows: mockData.athletes.map(a => ({
          id: a.id,
          name: a.name,
          sport: a.sport,
          position: a.position
        })),
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.DAY);
  }

  async getTrainingPlans(params) {
    const { athleteId, date, adjustedOnly } = params;
    const cacheKey = cache.buildKey(
      CACHE_KEYS.TRAINING_PLANS,
      athleteId || 'all',
      date || 'all',
      adjustedOnly ? 'adjusted' : 'all'
    );

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM TRAINING_PLANS WHERE 1=1',
        { athleteId, date, adjustedOnly }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.MEDIUM);
  }

  async getRadarMetrics(athleteId) {
    const cacheKey = cache.buildKey(CACHE_KEYS.RADAR_METRICS, athleteId);

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM RADAR_METRICS WHERE athleteId = :athleteId',
        { athleteId }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.MEDIUM);
  }

  async getInjuryRecords(athleteId) {
    const cacheKey = cache.buildKey(CACHE_KEYS.INJURIES, athleteId || 'all');

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM INJURY_RECORDS WHERE 1=1',
        { athleteId }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.MEDIUM);
  }

  async getACWR(athleteId, date) {
    const cacheKey = cache.buildKey(CACHE_KEYS.ACWR, athleteId, date || 'latest');

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM ACWR WHERE athleteId = :athleteId',
        { athleteId, date }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.SHORT);
  }

  async getSummary(params) {
    const { athleteId, sport, startDate, endDate, exercise } = params;
    const cacheKey = cache.buildKey(
      CACHE_KEYS.SUMMARY,
      athleteId || 'all',
      sport || 'all',
      exercise || 'all',
      startDate || 'none',
      endDate || 'none'
    );

    return cache.getOrSet(cacheKey, async () => {
      const result = await clickhouse.query(
        'SELECT * FROM TRAINING_SUMMARY WHERE 1=1',
        { athleteId, sport, startDate, endDate, exercise }
      );
      return {
        ...result,
        cached: false,
        cacheKey: cacheKey
      };
    }, TTL.MEDIUM);
  }

  async invalidateAthleteCache(athleteId) {
    const patterns = [
      `${CACHE_KEYS.LOAD_CURVE}:${athleteId}:*`,
      `${CACHE_KEYS.RECOVERY_TREND}:${athleteId}:*`,
      `${CACHE_KEYS.RADAR_METRICS}:${athleteId}:*`,
      `${CACHE_KEYS.INJURIES}:${athleteId}:*`,
      `${CACHE_KEYS.ACWR}:${athleteId}:*`,
      `${CACHE_KEYS.TRAINING_PLANS}:${athleteId}:*`,
      `${CACHE_KEYS.DAY_TRAININGS}:*:${athleteId}`,
      `${CACHE_KEYS.TRAINING_DETAIL}:*`
    ];

    let total = 0;
    for (const pattern of patterns) {
      total += await cache.invalidatePattern(pattern);
    }
    return total;
  }

  async getSystemStats() {
    return {
      clickhouse: clickhouse.getQueryStats(),
      redis: cache.getStats(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new DataService();
