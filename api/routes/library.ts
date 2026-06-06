import { Router, type Request, type Response } from 'express';
import { etlService } from '../services/etlService.js';
import { dataRepository } from '../services/dataRepository.js';
import type { FilterParams, SavedFilter } from '../../shared/types.js';

const router = Router();

let savedFilters: SavedFilter[] = [
  {
    id: '1',
    name: '本月数据概览',
    params: {
      collections: [],
      readerGroups: [],
      subjects: [],
      branches: [],
      months: [],
      timeWindow: '30d',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '少儿阅读分析',
    params: {
      collections: [],
      readerGroups: ['儿童', '青少年'],
      subjects: ['儿童读物'],
      branches: [],
      months: [],
      timeWindow: '90d',
    },
    createdAt: new Date().toISOString(),
  },
];

function parseFilterParams(req: Request): FilterParams {
  const body = req.body as Partial<FilterParams>;
  return {
    collections: body.collections || [],
    readerGroups: body.readerGroups || [],
    subjects: body.subjects || [],
    branches: body.branches || [],
    months: body.months || [],
    timeWindow: (body.timeWindow as FilterParams['timeWindow']) || 'all',
  };
}

router.get('/filter-options', async (req: Request, res: Response): Promise<void> => {
  try {
    const options = dataRepository.getFilterOptions();
    res.json({ success: true, data: options });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get filter options' });
  }
});

router.post('/kpi', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getKPIData(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get KPI data' });
  }
});

router.post('/trends/subject', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getSubjectTrends(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get subject trends' });
  }
});

router.post('/comparison/branch', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getBranchComparison(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get branch comparison' });
  }
});

router.post('/overdue/heatmap', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getOverdueHeatmap(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get overdue heatmap' });
  }
});

router.post('/reservations/analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getReservationAnalysis(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get reservation analysis' });
  }
});

router.post('/readers/age-groups', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getAgeGroupAnalysis(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get age group analysis' });
  }
});

router.get('/data-quality/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await etlService.getDataQualityStatus();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get data quality status' });
  }
});

router.post('/records/raw', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const limit = req.body.limit as number || 100;
    const data = await etlService.getRawRecords(filters, limit);
    const validatedData = data.map(record => dataRepository.validateRecord(record));
    res.json({ success: true, data: validatedData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get raw records' });
  }
});

router.post('/etl/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    etlService.refreshETL();
    res.json({ success: true, message: 'ETL refreshed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to refresh ETL' });
  }
});

router.get('/filters/saved', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, data: savedFilters });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get saved filters' });
  }
});

router.post('/filters/saved', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, params } = req.body as { name: string; params: FilterParams };
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      params,
      createdAt: new Date().toISOString(),
    };
    savedFilters.push(newFilter);
    res.json({ success: true, data: newFilter });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save filter' });
  }
});

router.post('/renews/trends', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getRenewTrends(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get renew trends' });
  }
});

router.post('/renews/by-branch', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getRenewByBranch(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get renew by branch' });
  }
});

router.post('/activities/trends', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getActivityTrends(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get activity trends' });
  }
});

router.post('/activities/by-type', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = parseFilterParams(req);
    const data = await etlService.getActivityByType(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get activity by type' });
  }
});

router.delete('/filters/saved/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    savedFilters = savedFilters.filter(f => f.id !== id);
    res.json({ success: true, message: 'Filter deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete filter' });
  }
});

export default router;
