import express, { type Response } from 'express';
import { getDB } from '../db/index.js';
import { authMiddleware, getOrganizationFilter, type AuthenticatedRequest } from '../middleware/auth.js';
import { 
  calculateTrendData, 
  measurementsToCSV,
  filterMeasurements 
} from '../../src/utils/dataService.js';
import type { MeasurementQuery, Measurement } from '../../src/types/index.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgFilter = getOrganizationFilter(req);
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
      const orgs = Array.isArray(req.query.organizations)
        ? req.query.organizations as string[]
        : [req.query.organizations as string];
      query.organizations = orgFilter ? [orgFilter] : orgs;
    } else if (orgFilter) {
      query.organizations = [orgFilter];
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

    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;

    const result = await getDB().getMeasurements({
      ...query,
      limit,
      offset,
    });

    const sites = await getDB().getSites(orgFilter || undefined);
    const filtered = filterMeasurements(result.data, query, sites);

    res.json({
      success: true,
      data: filtered.slice(0, limit),
      total: result.total,
    });
  } catch (error) {
    console.error('[Measurements] Get error:', error);
    res.status(500).json({
      success: false,
      error: '获取监测数据失败',
    });
  }
});

router.get('/trend', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const { indicator, dataSource, siteId } = req.query;
    
    const allResult = await getDB().getMeasurements({
      organizations: orgFilter ? [orgFilter] : undefined,
      siteIds: siteId ? [siteId as string] : undefined,
      limit: 10000,
    });

    const indicatorCode = indicator as string || 'dissolvedOxygen';
    const source = dataSource as 'manual' | 'automatic' || 'manual';

    const trendData = calculateTrendData(allResult.data, indicatorCode, source);

    res.json({
      success: true,
      data: trendData,
    });
  } catch (error) {
    console.error('[Measurements] Trend error:', error);
    res.status(500).json({
      success: false,
      error: '获取趋势数据失败',
    });
  }
});

router.post('/import', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      res.status(400).json({
        success: false,
        error: '数据格式错误，需要非空数组',
      });
      return;
    }

    const sites = await getDB().getSites(orgFilter || undefined);
    const siteMap = new Map(sites.map(s => [s.name, s.id]));

    const validMeasurements: Omit<Measurement, 'id'>[] = [];
    let invalidCount = 0;

    for (const row of data) {
      const siteName = row['站点名称'] || row['siteName'];
      const siteId = siteMap.get(siteName);

      if (!siteId) {
        invalidCount++;
        continue;
      }

      const site = sites.find(s => s.id === siteId);
      const sampleTime = row['采样时间'] || row['sampleTime'] || new Date().toISOString();
      const temperature = row['水温'] !== undefined ? Number(row['水温']) : 
                         row['temperature'] !== undefined ? Number(row['temperature']) : null;
      const ph = row['pH'] !== undefined ? Number(row['pH']) : 
                 row['ph'] !== undefined ? Number(row['ph']) : null;
      const dissolvedOxygen = row['溶解氧'] !== undefined ? Number(row['溶解氧']) :
                              row['dissolvedOxygen'] !== undefined ? Number(row['dissolvedOxygen']) : null;
      const ammoniaNitrogen = row['氨氮'] !== undefined ? Number(row['氨氮']) :
                              row['ammoniaNitrogen'] !== undefined ? Number(row['ammoniaNitrogen']) : null;
      const rainfall = row['降雨量'] !== undefined ? Number(row['降雨量']) :
                       row['rainfall'] !== undefined ? Number(row['rainfall']) : null;

      const isAnomaly = row['状态'] === '异常' || row['isAnomaly'] === true;

      validMeasurements.push({
        siteId,
        sampleTime: new Date(sampleTime).toISOString(),
        temperature: isNaN(temperature) ? null : temperature,
        ph: isNaN(ph) ? null : ph,
        dissolvedOxygen: isNaN(dissolvedOxygen) ? null : dissolvedOxygen,
        ammoniaNitrogen: isNaN(ammoniaNitrogen) ? null : ammoniaNitrogen,
        rainfall: isNaN(rainfall) ? null : rainfall,
        dataSource: site?.type || 'manual',
        organization: site?.organization || (orgFilter as string),
        isAnomaly,
        anomalyReason: row['异常原因'] || row['anomalyReason'] || undefined,
        note: row['备注'] || row['note'] || undefined,
        sampledBy: row['采样人'] || row['sampledBy'] || undefined,
      });
    }

    const imported = await getDB().addMeasurements(validMeasurements);

    res.json({
      success: true,
      message: `成功导入 ${imported.length} 条记录${invalidCount > 0 ? `，${invalidCount} 条因站点不存在被跳过` : ''}`,
      imported: imported.length,
      skipped: invalidCount,
    });
  } catch (error) {
    console.error('[Measurements] Import error:', error);
    res.status(500).json({
      success: false,
      error: '数据导入失败',
    });
  }
});

router.get('/export/csv', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const result = await getDB().getMeasurements({
      organizations: orgFilter ? [orgFilter] : undefined,
      limit: 10000,
    });

    const sites = await getDB().getSites(orgFilter || undefined);
    const csv = measurementsToCSV(result.data, sites);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=water_quality_data.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('[Measurements] Export CSV error:', error);
    res.status(500).json({
      success: false,
      error: '导出CSV失败',
    });
  }
});

export default router;
