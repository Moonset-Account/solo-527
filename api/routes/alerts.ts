import { Router } from 'express';
import { getAlerts, getAlertById, updateAlertStatus, createAlertFromWebhook } from '../services/alerts';
import type { AlertStatus, AlertLevel } from '../../shared/types';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      status: req.query.status as AlertStatus | undefined,
      level: req.query.level as AlertLevel | undefined,
      deviceId: req.query.deviceId as string | undefined,
      keyword: req.query.keyword as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const result = await getAlerts(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const alert = await getAlertById(req.params.id);
    if (!alert) {
      res.status(404).json({ error: '告警不存在' });
      return;
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, remark, operatorId } = req.body;
    if (!status || !operatorId) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    const alert = await updateAlertStatus(req.params.id, status, remark || '', operatorId);
    if (!alert) {
      res.status(404).json({ error: '告警不存在' });
      return;
    }
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const { deviceId, deviceName, alertLevel, alertType, title, description } = req.body;
    if (!deviceId || !alertLevel || !title) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    const alert = await createAlertFromWebhook({
      deviceId,
      deviceName: deviceName || deviceId,
      alertLevel,
      alertType: alertType || 'UNKNOWN',
      title,
      description: description || '',
    });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
