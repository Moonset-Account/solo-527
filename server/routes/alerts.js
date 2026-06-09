const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const AlertService = require('../services/alertService');

router.get('/', authenticate, async (req, res) => {
  try {
    const options = {
      status: req.query.status || 'active',
      severity: req.query.severity,
      alert_type: req.query.alert_type,
      contract_id: req.query.contract_id,
      limit: parseInt(req.query.limit, 10) || 100,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await AlertService.list(options);
    res.json({
      total: result.count,
      alerts: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/acknowledge', authenticate, requireRole('admin', 'reviewer'), async (req, res) => {
  try {
    await AlertService.acknowledge(req.params.id, req.userId);
    res.json({ message: '告警已确认' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/resolve', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    await AlertService.resolve(req.params.id, req.userId, notes || '');
    res.json({ message: '告警已解决' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/types', authenticate, (req, res) => {
  const types = [
    {
      type: 'data_missing',
      label: '数据缺失',
      description: '必要字段数据为空或缺失',
      icon: '📋',
    },
    {
      type: 'model_drift',
      label: '模型漂移',
      description: '模型输出分布发生显著变化',
      icon: '📊',
    },
    {
      type: 'service_failure',
      label: '服务调用失败',
      description: '外部API或内部服务调用异常',
      icon: '🔧',
    },
    {
      type: 'processing_timeout',
      label: '处理超时',
      description: '任务执行超过预期时间',
      icon: '⏱️',
    },
    {
      type: 'validation_error',
      label: '验证错误',
      description: '数据验证不通过',
      icon: '❌',
    },
    {
      type: 'system_warning',
      label: '系统警告',
      description: '一般性系统提示',
      icon: '⚠️',
    },
  ];
  res.json({ types });
});

router.get('/summary', authenticate, async (req, res) => {
  try {
    const all = await AlertService.list({ status: 'active', limit: 1000 });

    const byType = {};
    const bySeverity = { info: 0, warning: 0, error: 0, critical: 0 };

    for (const alert of all.rows) {
      byType[alert.alert_type] = (byType[alert.alert_type] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    }

    res.json({
      total_active: all.count,
      by_type: byType,
      by_severity: bySeverity,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
