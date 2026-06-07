import { Router, type Request, type Response } from 'express';
import type { FilterParams, ApiResponse, AnomalyAnnotation } from '../../shared/types.js';
import {
  getFunnelData,
  getStageDuration,
  getChannelMetrics,
  getInterviewerLoad,
  getFilterOptions,
  getAnnotations,
  createAnnotation,
  getMetricDefinitions,
  getCandidateExperience,
} from '../services/aggregation.js';
import { cache, generateCacheKey } from '../middleware/cache.js';
import { desensitizeMiddleware } from '../middleware/desensitize.js';

const router = Router();

function parseFilterParams(query: Record<string, unknown>): FilterParams {
  const parseArray = (val: unknown): string[] | undefined => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return undefined;
  };

  return {
    positions: parseArray(query.positions),
    departments: parseArray(query.departments),
    recruiters: parseArray(query.recruiters),
    channels: parseArray(query.channels),
    stages: parseArray(query.stages),
    dateRange: {
      start: (query.startDate as string) || '2025-01-01',
      end: (query.endDate as string) || '2025-12-31',
    },
  };
}

function applyRoleFilter(filters: FilterParams, req: Request): FilterParams {
  const f = { ...filters, dateRange: { ...filters.dateRange } };

  if (req.userRole === 'recruiting_manager' && req.userDepartment) {
    f.departments = [req.userDepartment];
  }

  if (req.userRole === 'interviewer' && req.userId) {
    f.interviewerScope = req.userId;
  }

  return f;
}

function buildApiResponse<T>(data: T, filters: FilterParams, cacheHit: boolean): ApiResponse<T> {
  return {
    data,
    meta: {
      filters,
      generatedAt: new Date().toISOString(),
      cacheHit,
    },
  };
}

router.get('/funnel', desensitizeMiddleware, (req: Request, res: Response) => {
  const rawFilters = parseFilterParams(req.query as Record<string, unknown>);
  const filters = applyRoleFilter(rawFilters, req);
  const cacheKey = generateCacheKey('/funnel', filters);

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(buildApiResponse(cached, filters, true));
    return;
  }

  const data = getFunnelData(filters);
  cache.set(cacheKey, data);
  res.json(buildApiResponse(data, filters, false));
});

router.get('/stage-duration', desensitizeMiddleware, (req: Request, res: Response) => {
  const rawFilters = parseFilterParams(req.query as Record<string, unknown>);
  const filters = applyRoleFilter(rawFilters, req);
  const cacheKey = generateCacheKey('/stage-duration', filters);

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(buildApiResponse(cached, filters, true));
    return;
  }

  const data = getStageDuration(filters);
  cache.set(cacheKey, data);
  res.json(buildApiResponse(data, filters, false));
});

router.get('/channels', desensitizeMiddleware, (req: Request, res: Response) => {
  const rawFilters = parseFilterParams(req.query as Record<string, unknown>);
  const filters = applyRoleFilter(rawFilters, req);
  const cacheKey = generateCacheKey('/channels', filters);

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(buildApiResponse(cached, filters, true));
    return;
  }

  const data = getChannelMetrics(filters);
  cache.set(cacheKey, data);
  res.json(buildApiResponse(data, filters, false));
});

router.get('/workload', desensitizeMiddleware, (req: Request, res: Response) => {
  const rawFilters = parseFilterParams(req.query as Record<string, unknown>);
  const filters = applyRoleFilter(rawFilters, req);

  const cacheKey = generateCacheKey('/workload', filters);

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(buildApiResponse(cached, filters, true));
    return;
  }

  const data = getInterviewerLoad(filters);

  if (req.userRole === 'interviewer' && req.userId) {
    const filtered = data.filter(d => d.interviewerId === req.userId);
    res.json(buildApiResponse(filtered, filters, false));
    return;
  }

  cache.set(cacheKey, data);
  res.json(buildApiResponse(data, filters, false));
});

router.get('/filters/options', (req: Request, res: Response) => {
  const cacheKey = generateCacheKey('/filters/options', {});

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(buildApiResponse(cached, { dateRange: { start: '', end: '' } }, true));
    return;
  }

  const data = getFilterOptions();
  cache.set(cacheKey, data);
  res.json(buildApiResponse(data, { dateRange: { start: '', end: '' } }, false));
});

router.get('/metrics/definitions', (req: Request, res: Response) => {
  const cacheKey = generateCacheKey('/metrics/definitions', {});

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(buildApiResponse(cached, { dateRange: { start: '', end: '' } }, true));
    return;
  }

  const data = getMetricDefinitions();
  cache.set(cacheKey, data);
  res.json(buildApiResponse(data, { dateRange: { start: '', end: '' } }, false));
});

router.get('/candidate-experience', desensitizeMiddleware, (req: Request, res: Response) => {
  const rawFilters = parseFilterParams(req.query as Record<string, unknown>);
  const filters = applyRoleFilter(rawFilters, req);
  const cacheKey = generateCacheKey('/candidate-experience', filters);

  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(buildApiResponse(cached, filters, true));
    return;
  }

  const data = getCandidateExperience(filters);
  cache.set(cacheKey, data);
  res.json(buildApiResponse(data, filters, false));
});

router.get('/annotations', desensitizeMiddleware, (req: Request, res: Response) => {
  const stage = req.query.stage as string | undefined;
  const metric = req.query.metric as string | undefined;

  const data = getAnnotations(stage, metric);
  res.json(buildApiResponse(data, { dateRange: { start: '', end: '' } }, false));
});

router.post('/annotations', (req: Request, res: Response) => {
  const { date, stage, metric, value, comment, createdBy } = req.body;

  if (!date || !stage || !metric || value === undefined || !comment || !createdBy) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const annotation = createAnnotation({
    date,
    stage,
    metric,
    value,
    comment,
    createdBy,
  });

  cache.clear();
  res.status(201).json(buildApiResponse(annotation, { dateRange: { start: '', end: '' } }, false));
});

export default router;
