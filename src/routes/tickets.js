const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../services/authService');
const { processTicketAndSave, inferTicketAssignment } = require('../services/inferenceEngine');
const {
  getTickets, getTicketById, getReviewQueue, reviewTicket,
  closeTicket, escalateTicket, getDashboardStats,
} = require('../services/ticketService');
const { searchSimilar } = require('../services/vectorStore');
const logger = require('../utils/logger');

router.post('/infer', authMiddleware, requirePermission('ticket:assign'), async (req, res) => {
  try {
    const {
      ticket_no, caller_name, caller_phone, caller_address,
      district, block, community,
      content, original_category,
    } = req.body;

    if (!content || content.length < 5) {
      return res.status(400).json({ code: 400, message: '诉求内容不能为空' });
    }

    const params = {
      ticketNo: ticket_no,
      callerName: caller_name,
      callerPhone: caller_phone,
      callerAddress: caller_address,
      district, block, community,
      content, originalCategory: original_category,
    };

    const dryRun = req.query.dry === '1';
    let result;
    if (dryRun) {
      result = await inferTicketAssignment(params);
    } else {
      result = await processTicketAndSave(params);
    }
    res.json({ code: 0, data: result });
  } catch (e) {
    logger.error('Inference error', { error: e.message, stack: e.stack });
    res.status(500).json({ code: 500, message: '推理失败: ' + e.message });
  }
});

router.post('/similar', authMiddleware, async (req, res) => {
  try {
    const { content, top_k, min_score, category_filter } = req.body;
    if (!content) return res.status(400).json({ code: 400, message: '缺少内容' });
    const result = await searchSimilar(content, {
      topK: top_k || 5,
      minScore: min_score || 0.5,
      categoryFilter: category_filter,
    });
    res.json({ code: 0, data: result });
  } catch (e) {
    logger.error('Similar search error', { error: e.message });
    res.status(500).json({ code: 500, message: e.message });
  }
});

router.get('/tickets', authMiddleware, requirePermission('ticket:view_all'), (req, res) => {
  const result = getTickets(req.query);
  res.json({ code: 0, data: result });
});

router.get('/tickets/:id', authMiddleware, requirePermission('ticket:view_all'), (req, res) => {
  const result = getTicketById(req.params.id);
  if (!result) return res.status(404).json({ code: 404, message: '工单不存在' });
  res.json({ code: 0, data: result });
});

router.get('/review-queue', authMiddleware, requirePermission('ticket:review'), (req, res) => {
  const result = getReviewQueue(req.query);
  res.json({ code: 0, data: result });
});

router.post('/tickets/:id/review', authMiddleware, requirePermission('ticket:review'), (req, res) => {
  try {
    const { action, category, urgency, department_code, department_name, comment } = req.body;
    if (!['approved', 'rejected', 'modified'].includes(action)) {
      return res.status(400).json({ code: 400, message: 'action 必须是 approved/rejected/modified' });
    }
    const result = reviewTicket(req.params.id, req.user.sub, action, {
      category, urgency, department_code, department_name, comment,
    });
    res.json({ code: 0, message: '复核完成', data: result });
  } catch (e) {
    res.status(400).json({ code: 400, message: e.message });
  }
});

router.post('/tickets/:id/close', authMiddleware, requirePermission('ticket:close'), (req, res) => {
  try {
    const result = closeTicket(req.params.id, req.body);
    res.json({ code: 0, message: '工单已关闭', data: result });
  } catch (e) {
    res.status(400).json({ code: 400, message: e.message });
  }
});

router.post('/tickets/:id/escalate', authMiddleware, requirePermission('ticket:escalate'), (req, res) => {
  try {
    const { reason } = req.body;
    const result = escalateTicket(req.params.id, reason, req.user.sub);
    res.json({ code: 0, message: '工单已升级', data: result });
  } catch (e) {
    res.status(400).json({ code: 400, message: e.message });
  }
});

router.get('/dashboard/stats', authMiddleware, (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json({ code: 0, data: stats });
  } catch (e) {
    logger.error('Dashboard stats error', { error: e.message });
    res.status(500).json({ code: 500, message: e.message });
  }
});

module.exports = router;
