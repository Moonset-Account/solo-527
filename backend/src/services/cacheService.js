class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000;
  }

  generateKey(prefix, params) {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key, data, ttl = this.ttl) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }

  invalidate(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = new CacheService();
