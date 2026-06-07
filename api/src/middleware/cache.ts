import { LRUCache } from 'lru-cache';
import { Request, Response, NextFunction } from 'express';

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 5 * 60 * 1000,
});

export const cacheMiddleware = (duration: number = 5 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.originalUrl}`;
    
    if (req.method !== 'GET') {
      return next();
    }

    const cached = cache.get(key);
    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      cache.set(key, body, { ttl: duration });
      return originalJson(body);
    };

    next();
  };
};

export const clearCache = () => {
  cache.clear();
};

export default cache;
