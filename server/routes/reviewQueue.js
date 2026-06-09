const express = require('express');
const router = express.Router();
const { authenticate, canApproveRisk } = require('../middleware/auth');
const ReviewQueueService = require('../services/reviewQueueService');

router.get('/', authenticate, canApproveRisk, async (req, res) => {
  try {
    const options = {
      status: req.query.status,
      assigned_to: req.query.assigned_to === 'me' ? req.userId : req.query.assigned_to,
      queue_reason: req.query.queue_reason,
      contract_id: req.query.contract_id,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await ReviewQueueService.getQueue(options);
    res.json({ total: result.count, items: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/assign-me', authenticate, canApproveRisk, async (req, res) => {
  try {
    const item = await ReviewQueueService.assignToMe(
      req.params.id,
      req.userId,
      req.userIp
    );
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/complete', authenticate, canApproveRisk, async (req, res) => {
  try {
    const { action, risk_type, risk_level, reason, notes } = req.body;

    if (!['approve', 'reject', 'modify', 'escalate'].includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }

    const result = await ReviewQueueService.completeReview(
      req.params.id,
      req.userId,
      req.userIp,
      { action, risk_type, risk_level, reason, notes }
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/add', authenticate, canApproveRisk, async (req, res) => {
  try {
    const { risk_annotation_id, contract_id, clause_id, reason, priority, assigned_to } = req.body;

    if (!risk_annotation_id || !contract_id || !reason) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const item = await ReviewQueueService.addToQueue(
      risk_annotation_id,
      contract_id,
      clause_id,
      reason,
      priority || 50,
      req.userId,
      { assignedTo: assigned_to, ip: req.userIp }
    );

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/stats', authenticate, canApproveRisk, async (req, res) => {
  try {
    const userId = req.query.user_id === 'me' ? req.userId : req.query.user_id;
    const stats = await ReviewQueueService.getReviewerStats(userId || req.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/overdue', authenticate, canApproveRisk, async (req, res) => {
  try {
    const userId = req.userRole === 'admin' ? null : req.userId;
    const items = await ReviewQueueService.getSlaOverdueItems(userId);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const summary = await ReviewQueueService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
