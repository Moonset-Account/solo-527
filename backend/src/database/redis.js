const EventEmitter = require('events');

class RedisCache extends EventEmitter {
  constructor(options = {}) {
    super();
    this.store = new Map();
    this.expiryMap = new Map();
    this.hits = 0;
    this.misses = 0;
    this.defaultTTL = options.defaultTTL || 300000;
    this.maxKeys = options.maxKeys || 10000;
  }

  async get(key) {
    if (!this.expiryMap.has(key)) {
      this.misses++;
      this.emit('miss', key);
      return null;
    }

    const expiry = this.expiryMap.get(key);
    if (Date.now() > expiry) {
      this.delete(key);
      this.misses++;
      this.emit('expired', key);
      return null;
    }

    this.hits++;
    this.emit('hit', key);
    return this.store.get(key);
  }

  async set(key, value, ttl = this.defaultTTL) {
    this._checkEviction();

    this.store.set(key, value);
    this.expiryMap.set(key, Date.now() + ttl);
    this.emit('set', key, ttl);
    return true;
  }

  async setEx(key, ttl, value) {
    return this.set(key, value, ttl);
  }

  async del(key) {
    return this.delete(key);
  }

  delete(key) {
    const hadKey = this.store.has(key);
    this.store.delete(key);
    this.expiryMap.delete(key);
    return hadKey ? 1 : 0;
  }

  async exists(key) {
    if (!this.expiryMap.has(key)) return 0;
    if (Date.now() > this.expiryMap.get(key)) {
      this.delete(key);
      return 0;
    }
    return 1;
  }

  async expire(key, ttl) {
    if (!this.expiryMap.has(key)) return 0;
    this.expiryMap.set(key, Date.now() + ttl);
    return 1;
  }

  async ttl(key) {
    if (!this.expiryMap.has(key)) return -2;
    const remaining = this.expiryMap.get(key) - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : -1;
  }

  async keys(pattern = '*') {
    const regex = this._patternToRegex(pattern);
    const now = Date.now();
    const result = [];

    for (const [key, expiry] of this.expiryMap.entries()) {
      if (now > expiry) {
        this.delete(key);
        continue;
      }
      if (regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }

  async flushAll() {
    this.store.clear();
    this.expiryMap.clear();
    this.hits = 0;
    this.misses = 0;
    return true;
  }

  async mget(keys) {
    return Promise.all(keys.map(k => this.get(k)));
  }

  async mset(keyValuePairs) {
    for (const [key, value] of keyValuePairs) {
      this.set(key, value);
    }
    return true;
  }

  async incr(key) {
    const current = await this.get(key) || 0;
    const next = (typeof current === 'number' ? current : 0) + 1;
    await this.set(key, next);
    return next;
  }

  async decr(key) {
    const current = await this.get(key) || 0;
    const next = (typeof current === 'number' ? current : 0) - 1;
    await this.set(key, next);
    return next;
  }

  async hget(key, field) {
    const hash = await this.get(key) || {};
    return hash[field] !== undefined ? hash[field] : null;
  }

  async hset(key, field, value) {
    const hash = await this.get(key) || {};
    const isNew = hash[field] === undefined;
    hash[field] = value;
    await this.set(key, hash);
    return isNew ? 1 : 0;
  }

  async hgetAll(key) {
    return await this.get(key) || {};
  }

  async hdel(key, ...fields) {
    const hash = await this.get(key) || {};
    let count = 0;
    for (const field of fields) {
      if (hash[field] !== undefined) {
        delete hash[field];
        count++;
      }
    }
    if (count > 0) {
      await this.set(key, hash);
    }
    return count;
  }

  async lpush(key, ...values) {
    const list = await this.get(key) || [];
    list.unshift(...values);
    await this.set(key, list);
    return list.length;
  }

  async rpush(key, ...values) {
    const list = await this.get(key) || [];
    list.push(...values);
    await this.set(key, list);
    return list.length;
  }

  async lpop(key) {
    const list = await this.get(key) || [];
    if (list.length === 0) return null;
    const val = list.shift();
    await this.set(key, list);
    return val;
  }

  async rpop(key) {
    const list = await this.get(key) || [];
    if (list.length === 0) return null;
    const val = list.pop();
    await this.set(key, list);
    return val;
  }

  async lrange(key, start, stop) {
    const list = await this.get(key) || [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async llen(key) {
    const list = await this.get(key) || [];
    return list.length;
  }

  async sadd(key, ...members) {
    const set = new Set(await this.get(key) || []);
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    if (added > 0) {
      await this.set(key, Array.from(set));
    }
    return added;
  }

  async sismember(key, member) {
    const set = new Set(await this.get(key) || []);
    return set.has(member) ? 1 : 0;
  }

  async smembers(key) {
    return await this.get(key) || [];
  }

  _patternToRegex(pattern) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }

  _checkEviction() {
    if (this.store.size >= this.maxKeys) {
      const now = Date.now();
      let oldestKey = null;
      let oldestExpiry = Infinity;

      for (const [key, expiry] of this.expiryMap.entries()) {
        if (expiry < now) {
          this.delete(key);
          continue;
        }
        if (expiry < oldestExpiry) {
          oldestExpiry = expiry;
          oldestKey = key;
        }
      }

      if (oldestKey && this.store.size >= this.maxKeys) {
        this.delete(oldestKey);
      }
    }
  }

  buildKey(...parts) {
    return parts.filter(Boolean).join(':');
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      keys: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hit_rate: total > 0 ? ((this.hits / total) * 100).toFixed(2) + '%' : '0%',
      total_requests: total,
      memory_usage_mb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    };
  }

  async getOrSet(key, fn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      if (typeof cached === 'object' && !Array.isArray(cached)) {
        return { ...cached, cached: true };
      }
      return cached;
    }
    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  async invalidatePattern(pattern) {
    const keys = await this.keys(pattern);
    for (const key of keys) {
      this.delete(key);
    }
    return keys.length;
  }
}

const CACHE_KEYS = {
  LOAD_CURVE: 'training:load_curve',
  RECOVERY_TREND: 'training:recovery_trend',
  COMPARISON: 'training:comparison',
  DAY_TRAININGS: 'training:day',
  TRAINING_DETAIL: 'training:detail',
  ATHLETES: 'athletes:list',
  TRAINING_PLANS: 'training:plans',
  RADAR_METRICS: 'athlete:radar',
  INJURIES: 'athlete:injuries',
  SUMMARY: 'training:summary',
  ACWR: 'athlete:acwr'
};

const TTL = {
  SHORT: 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 30 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};

const cacheInstance = new RedisCache({
  defaultTTL: TTL.MEDIUM,
  maxKeys: 20000
});

cacheInstance.CACHE_KEYS = CACHE_KEYS;
cacheInstance.TTL = TTL;

module.exports = cacheInstance;
