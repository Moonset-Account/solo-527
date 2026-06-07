import express, { type Request, type Response } from 'express';
import { DATA_DICTIONARY } from '../../src/utils/constants.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: DATA_DICTIONARY,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取数据字典失败',
    });
  }
});

export default router;
