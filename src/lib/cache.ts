interface CacheItem<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheItem<T>>;
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    item.accessCount++;
    item.timestamp = Date.now();
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        age: Date.now() - item.timestamp,
        accessCount: item.accessCount,
      })),
    };
  }
}

const supplierMetricsCache = new LRUCache<Supplier & MetricsSummary>(50, 3600000);
const buildingMetricsCache = new LRUCache<(Building & {
  orderCount: number;
  repeatCount: number;
  timeoutCount: number;
  repeatRate: number;
})[]>(10, 1800000);
const workOrderCache = new LRUCache<WorkOrder[]>(20, 300000);

export { supplierMetricsCache, buildingMetricsCache, workOrderCache };

import { WorkOrder, Supplier, Building, MetricsSummary } from "@/types";
