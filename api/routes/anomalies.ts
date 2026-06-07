import express, { type Response } from 'express';
import { getMeasurements, getAnomalyNotes, addAnomalyNote } from '../db/index.js';
import { authMiddleware, getOrganizationFilter, type AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const result = getMeasurements({
      organizations: orgFilter ? [orgFilter] : undefined,
      onlyAnomalies: true,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error('[Anomalies] Get error:', error);
    res.status(500).json({
      success: false,
      error: '获取异常数据失败',
    });
  }
});

router.get('/:measurementId/notes', (req: AuthenticatedRequest, res: Response) => {
  try {
    const notes = getAnomalyNotes(req.params.measurementId);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('[Anomalies] Get notes error:', error);
    res.status(500).json({
      success: false,
      error: '获取异常备注失败',
    });
  }
});

router.post('/:measurementId/notes', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    const user = req.user!;

    const newNote = addAnomalyNote({
      measurementId: req.params.measurementId,
      userId: user.id,
      userName: user.username,
      content,
    });

    res.json({
      success: true,
      data: newNote,
      message: '备注添加成功',
    });
  } catch (error) {
    console.error('[Anomalies] Add note error:', error);
    res.status(500).json({
      success: false,
      error: '添加备注失败',
    });
  }
});

export default router;
