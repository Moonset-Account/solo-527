const express = require('express');
const router = express.Router();
const { authenticate, canApproveRisk } = require('../middleware/auth');
const RiskDetectionService = require('../services/riskDetectionService');

router.get('/contract/:contractId', authenticate, async (req, res) => {
  try {
    const risks = await RiskDetectionService.getAllRisksForContract(
      req.params.contractId,
      {
        risk_type: req.query.risk_type,
        risk_level: req.query.risk_level,
        status: req.query.status,
      }
    );
    res.json({ risks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/override', authenticate, canApproveRisk, async (req, res) => {
  try {
    const updateData = {
      human_risk_type: req.body.risk_type,
      human_risk_level: req.body.risk_level,
      human_notes: req.body.notes,
      approve: req.body.approve === true,
      remove_risk: req.body.remove === true,
    };

    const result = await RiskDetectionService.humanOverride(
      req.params.id,
      updateData,
      req.userId,
      req.userIp
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/contract/:contractId/approve-all', authenticate, canApproveRisk, async (req, res) => {
  try {
    const result = await RiskDetectionService.approveAllRisks(
      req.params.contractId,
      req.userId,
      req.userIp
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/rerun/:contractId', authenticate, async (req, res) => {
  try {
    const contractVersionId = req.body.contract_version_id;
    if (!contractVersionId) {
      return res.status(400).json({ error: '缺少 contract_version_id' });
    }

    const result = await RiskDetectionService.detectRisksForContract(
      req.params.contractId,
      contractVersionId,
      { userId: req.userId, ip: req.userIp }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
