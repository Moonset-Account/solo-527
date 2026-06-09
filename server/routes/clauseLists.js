const express = require('express');
const router = express.Router();
const { authenticate, canApproveRisk } = require('../middleware/auth');
const ClauseListService = require('../services/clauseListService');

router.post('/generate/:contractId', authenticate, canApproveRisk, async (req, res) => {
  try {
    const { notes } = req.body;
    const clauseList = await ClauseListService.generateClauseList(
      req.params.contractId,
      req.userId,
      req.userIp,
      { notes }
    );
    res.status(201).json(clauseList);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/contract/:contractId/validate', authenticate, async (req, res) => {
  try {
    const status = await ClauseListService.validateAllRisksReviewed(req.params.contractId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const clauseList = await ClauseListService.getClauseList(req.params.id);
    if (!clauseList) {
      return res.status(404).json({ error: '条款清单不存在' });
    }
    res.json(clauseList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const lists = await ClauseListService.listClauseLists(req.query.contract_id, {
      status: req.query.status,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0,
    });
    res.json({ clause_lists: lists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/export/:format', authenticate, async (req, res) => {
  try {
    const { format } = req.params;
    const result = await ClauseListService.exportClauseList(req.params.id, format);

    res.setHeader('Content-Type', result.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
