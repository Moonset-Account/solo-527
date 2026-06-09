const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const AuditService = require('../services/auditService');

router.get('/', authenticate, requireRole('admin', 'reviewer'), async (req, res) => {
  try {
    const options = {
      userId: req.query.user_id,
      action: req.query.action,
      entityType: req.query.entity_type,
      entityId: req.query.entity_id,
      contractId: req.query.contract_id,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      limit: parseInt(req.query.limit, 10) || 100,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await AuditService.query(options);
    res.json({
      total: result.count,
      logs: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/contract/:contractId', authenticate, async (req, res) => {
  try {
    const history = await AuditService.getContractHistory(req.params.contractId);
    res.json({
      total: history.count,
      logs: history.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/actions', authenticate, (req, res) => {
  const actions = [
    { action: 'contract_upload', label: '上传合同', type: 'contract' },
    { action: 'contract_update', label: '更新合同', type: 'contract' },
    { action: 'contract_rollback', label: '回滚合同版本', type: 'contract' },
    { action: 'contract_approve', label: '通过合同', type: 'contract' },
    { action: 'contract_reject', label: '拒绝合同', type: 'contract' },
    { action: 'risk_create', label: 'AI创建风险标注', type: 'risk' },
    { action: 'risk_modify', label: '人工修改风险标注', type: 'risk' },
    { action: 'risk_approve', label: '通过风险标注', type: 'risk' },
    { action: 'risk_reject', label: '拒绝风险标注', type: 'risk' },
    { action: 'risk_to_review_queue', label: '加入二审队列', type: 'review' },
    { action: 'review_start', label: '开始复核', type: 'review' },
    { action: 'review_complete', label: '完成复核', type: 'review' },
    { action: 'vector_index_build', label: '构建向量索引', type: 'system' },
    { action: 'vector_index_rollback', label: '回滚向量索引', type: 'system' },
    { action: 'export_clause_list', label: '导出条款清单', type: 'export' },
  ];
  res.json({ actions });
});

module.exports = router;
