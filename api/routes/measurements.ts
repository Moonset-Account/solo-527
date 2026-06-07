import express, { type Request, type Response } from 'express';
import { MOCK_SITES, MOCK_MEASUREMENTS } from '../../src/utils/mockData.js';
import { 
  filterMeasurements, 
  calculateTrendData, 
  measurementsToCSV 
} from '../../src/utils/dataService.js';
import type { MeasurementQuery } from '../../src/types/index.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const query: MeasurementQuery = {};
    
    if (req.query.siteIds) {
      query.siteIds = Array.isArray(req.query.siteIds) 
        ? req.query.siteIds as string[] 
        : [req.query.siteIds as string];
    }
    if (req.query.riverSections) {
      query.riverSections = Array.isArray(req.query.riverSections)
        ? req.query.riverSections as string[]
        : [req.query.riverSections as string];
    }
    if (req.query.organizations) {
      query.organizations = Array.isArray(req.query.organizations)
        ? req.query.organizations as string[]
        : [req.query.organizations as string];
    }
    if (req.query.startDate) {
      query.startDate = req.query.startDate as string;
    }
    if (req.query.endDate) {
      query.endDate = req.query.endDate as string;
    }
    if (req.query.dataSource) {
      query.dataSource = req.query.dataSource as MeasurementQuery['dataSource'];
    }
    if (req.query.onlyAnomalies === 'true') {
      query.onlyAnomalies = true;
    }

    const filtered = filterMeasurements(MOCK_MEASUREMENTS, query, MOCK_SITES);
    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;

    res.json({
      success: true,
      data: filtered.slice(offset, offset + limit),
      total: filtered.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取监测数据失败',
    });
  }
});

router.get('/trend', (req: Request, res: Response) => {
  try {
    const { indicator, dataSource, siteId } = req.query;
    
    let measurements = [...MOCK_MEASUREMENTS];
    if (siteId) {
      measurements = measurements.filter(m => m.siteId === siteId);
    }

    const indicatorCode = indicator as string || 'dissolvedOxygen';
    const source = dataSource as 'manual' | 'automatic' || 'manual';

    const trendData = calculateTrendData(measurements, indicatorCode, source);

    res.json({
      success: true,
      data: trendData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取趋势数据失败',
    });
  }
});

router.post('/import', (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: '数据格式错误',
      });
    }
    
    res.json({
      success: true,
      message: `成功导入 ${data.length} 条记录`,
      imported: data.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '数据导入失败',
    });
  }
});

router.get('/export/csv', (req: Request, res: Response) => {
  try {
    const csv = measurementsToCSV(MOCK_MEASUREMENTS, MOCK_SITES);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=water_quality_data.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '导出CSV失败',
    });
  }
});

export default router;
