import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { queryCache } from './data/cache';
import {
  getHeatmapData,
  getQueuePrediction,
  getTicketAnalysis,
  getConversionFunnel,
  getKPIData,
  getRawRecords,
  getDataQualityReport,
  type FilterParams
} from './data/aggregate';
import { dataStore } from './data/store';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

function parseFilterParams(req: Request): FilterParams {
  const { startTime, endTime, entrance, areaId, ticketType, activity } = req.query;
  
  const toStringArray = (val: any): string[] | undefined => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.map(v => String(v));
    return [String(val)];
  };
  
  return {
    startTime: startTime ? String(startTime) : undefined,
    endTime: endTime ? String(endTime) : undefined,
    entrance: toStringArray(entrance),
    areaId: toStringArray(areaId),
    ticketType: toStringArray(ticketType),
    activity: toStringArray(activity)
  };
}

function withCache<T>(
  cacheKey: string,
  handler: (filter: FilterParams) => T,
  ttl?: number
) {
  return (req: Request, res: Response) => {
    const filter = parseFilterParams(req);
    const cached = queryCache.get<T>(cacheKey, filter);
    if (cached) {
      res.json({ data: cached, cached: true, updatedAt: dataStore.lastUpdate.toISOString() });
      return;
    }
    const data = handler(filter);
    queryCache.set(cacheKey, filter, data, ttl);
    res.json({ data, cached: false, updatedAt: dataStore.lastUpdate.toISOString() });
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', cacheStats: queryCache.getStats() });
});

app.get('/api/kpi', withCache('kpi', getKPIData, 30000));

app.get('/api/heatmap', withCache('heatmap', getHeatmapData, 30000));

app.get('/api/queue-prediction', withCache('queue', getQueuePrediction, 15000));

app.get('/api/ticket-analysis', withCache('ticket', getTicketAnalysis, 60000));

app.get('/api/conversion-funnel', withCache('conversion', getConversionFunnel, 60000));

app.get('/api/raw-records', (req, res) => {
  const filter = parseFilterParams(req);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const source = req.query.source as string | undefined;
  const result = getRawRecords({ ...filter, page, pageSize, source });
  res.json({ data: result.list, total: result.total, page, pageSize, updatedAt: dataStore.lastUpdate.toISOString() });
});

app.get('/api/data-quality', withCache('quality', getDataQualityReport, 60000));

app.get('/api/meta/areas', (_req, res) => {
  res.json({
    data: dataStore.getAreaList(),
    closedAreaIds: dataStore.getClosedAreaIds(),
    updatedAt: dataStore.lastUpdate.toISOString()
  });
});

app.get('/api/meta/entraces', (_req, res) => {
  res.json({ data: dataStore.getEntranceList(), updatedAt: dataStore.lastUpdate.toISOString() });
});

app.get('/api/meta/ticket-types', (_req, res) => {
  res.json({ data: dataStore.getTicketTypes(), updatedAt: dataStore.lastUpdate.toISOString() });
});

app.post('/api/refresh', (_req, res) => {
  dataStore.refresh();
  queryCache.invalidate();
  res.json({ status: 'refreshed', updatedAt: dataStore.lastUpdate.toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard API endpoints:`);
  console.log(`   GET /api/health`);
  console.log(`   GET /api/kpi`);
  console.log(`   GET /api/heatmap`);
  console.log(`   GET /api/queue-prediction`);
  console.log(`   GET /api/ticket-analysis`);
  console.log(`   GET /api/conversion-funnel`);
  console.log(`   GET /api/raw-records`);
  console.log(`   GET /api/data-quality`);
  console.log(`   POST /api/refresh`);
});

export default app;
