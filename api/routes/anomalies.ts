import express, { type Request, type Response } from 'express';
import { MOCK_MEASUREMENTS, MOCK_SITES, MOCK_ANOMALY_NOTES } from '../../src/utils/mockData.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const anomalies = MOCK_MEASUREMENTS
      .filter(m => m.isAnomaly)
      .slice(offset, offset + limit)
      .map(m => {
        const site = MOCK_SITES.find(s => s.id === m.siteId);
        const notes = MOCK_ANOMALY_NOTES.filter(n => n.measurementId === m.id);
        return {
          ...m,
          siteName: site?.name,
          siteCode: site?.code,
          riverSection: site?.riverSection,
          notes,
        };
      });

    res.json({
      success: true,
      data: anomalies,
      total: MOCK_MEASUREMENTS.filter(m => m.isAnomaly).length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取异常点失败',
    });
  }
});

router.post('/:id/note', (req: Request, res: Response) => {
  try {
    const { content, userId, userName } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: '备注内容不能为空',
      });
    }

    const note = {
      id: Math.random().toString(36).substring(2, 15),
      measurementId: req.params.id,
      userId: userId || 'user-1',
      userName: userName || 'admin',
      content,
      createdAt: new Date().toISOString(),
    };

    MOCK_ANOMALY_NOTES.push(note);

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '添加备注失败',
    });
  }
});

export default router;
