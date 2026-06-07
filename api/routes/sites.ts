import express, { type Request, type Response } from 'express';
import { MOCK_SITES, MOCK_MEASUREMENTS } from '../../src/utils/mockData.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { riverSection, organization, type } = req.query;
    
    let sites = [...MOCK_SITES];
    
    if (riverSection) {
      sites = sites.filter(s => s.riverSection === riverSection);
    }
    if (organization) {
      sites = sites.filter(s => s.organization === organization);
    }
    if (type) {
      sites = sites.filter(s => s.type === type);
    }
    
    res.json({
      success: true,
      data: sites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取采样点列表失败',
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const site = MOCK_SITES.find(s => s.id === req.params.id);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: '采样点不存在',
      });
    }
    
    const siteMeasurements = MOCK_MEASUREMENTS.filter(m => m.siteId === site.id).slice(0, 50);
    
    res.json({
      success: true,
      data: {
        site,
        recentMeasurements: siteMeasurements,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取采样点详情失败',
    });
  }
});

export default router;
