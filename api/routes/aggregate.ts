import { Router } from 'express';
import type { Request, Response } from 'express';
import { cacheService, CACHE_TTL } from '../services/cacheService.js';
import {
  queryOverview,
  queryHeatmap,
  queryRank,
  queryExceptions,
  queryTrend,
  updateRemark,
} from '../services/clickhouse.js';
import type { FilterParams } from '../services/clickhouse.js';
import metricsConfig from '../data/metrics.json' assert { type: 'json' };

const router = Router();

function parseFilterParams(req: Request): FilterParams {
  const params: FilterParams = {};
  if (req.query.startDate) params.startDate = req.query.startDate as string;
  if (req.query.endDate) params.endDate = req.query.endDate as string;
  if (req.query.enterpriseIds) {
    params.enterpriseIds = (req.query.enterpriseIds as string).split(',');
  }
  if (req.query.gateIds) {
    params.gateIds = (req.query.gateIds as string).split(',');
  }
  if (req.query.visitorTypes) {
    params.visitorTypes = (req.query.visitorTypes as string).split(',');
  }
  if (req.query.laneIds) {
    params.laneIds = (req.query.laneIds as string).split(',');
  }
  return params;
}

router.get('/overview', async (req: Request, res: Response) => {
  try {
    const params = parseFilterParams(req);
    const cacheKey = cacheService.generateKey('overview', params);
    
    const data = await cacheService.getOrSet(
      'aggregate',
      cacheKey,
      () => queryOverview(params),
      CACHE_TTL.OVERVIEW
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/heatmap', async (req: Request, res: Response) => {
  try {
    const params = parseFilterParams(req);
    const cacheKey = cacheService.generateKey('heatmap', params);
    
    const data = await cacheService.getOrSet(
      'aggregate',
      cacheKey,
      () => queryHeatmap(params),
      CACHE_TTL.HEATMAP
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rank', async (req: Request, res: Response) => {
  try {
    const params = parseFilterParams(req);
    const sortBy = (req.query.sortBy as 'total' | 'abnormal') || 'total';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const cacheKey = cacheService.generateKey('rank', { ...params, sortBy, limit });
    
    const data = await cacheService.getOrSet(
      'aggregate',
      cacheKey,
      () => queryRank(params, sortBy, limit),
      CACHE_TTL.RANK
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/exceptions', async (req: Request, res: Response) => {
  try {
    const params = parseFilterParams(req);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const cacheKey = cacheService.generateKey('exceptions', { ...params, page, pageSize });
    
    const data = await cacheService.getOrSet(
      'aggregate',
      cacheKey,
      () => queryExceptions(params, page, pageSize),
      CACHE_TTL.EXCEPTIONS
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trend', async (req: Request, res: Response) => {
  try {
    const params = parseFilterParams(req);
    const granularity = (req.query.granularity as 'hour' | 'day') || 'hour';
    
    const cacheKey = cacheService.generateKey('trend', { ...params, granularity });
    
    const data = await cacheService.getOrSet(
      'aggregate',
      cacheKey,
      () => queryTrend(params, granularity),
      CACHE_TTL.TREND
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dimensions', (req: Request, res: Response) => {
  res.json({
    enterprises: metricsConfig.enterprises,
    gates: metricsConfig.gates,
    lanes: metricsConfig.lanes,
    visitorTypes: metricsConfig.visitorTypes,
  });
});

router.post('/exceptions/:id/remark', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    const success = await updateRemark(id, remark);
    
    cacheService.invalidate('aggregate', 'exceptions');
    cacheService.invalidate('aggregate', 'overview');
    
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
