const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, requirePermission } = require('../services/authService');
const { cleanHistoricalRecords, cleanTicketRecord } = require('../services/dataCleaner');
const { importHistoricalTickets, listHistoricalTickets } = require('../services/ticketService');
const { buildIndexFromDatabase, getIndexStats } = require('../services/vectorStore');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');
const config = require('../config');
const logger = require('../utils/logger');

const uploadDir = path.resolve('./temp/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/clean', authMiddleware, (req, res) => {
  const { records, content } = req.body;
  if (content) {
    const result = cleanTicketRecord({ content, ...req.body });
    return res.json({ code: 0, data: result });
  }
  if (!Array.isArray(records)) {
    return res.status(400).json({ code: 400, message: 'records 必须是数组' });
  }
  const result = cleanHistoricalRecords(records);
  res.json({ code: 0, data: { cleaned: result, total: result.length } });
});

router.post('/import', authMiddleware, requirePermission('data:import'), upload.single('file'), async (req, res) => {
  try {
    let records = [];
    if (req.file) {
      const raw = fs.readFileSync(req.file.path, 'utf-8');
      records = JSON.parse(raw);
      fs.unlinkSync(req.file.path);
    } else if (Array.isArray(req.body.records)) {
      records = req.body.records;
    }
    if (!records.length) {
      return res.status(400).json({ code: 400, message: '未提供数据' });
    }
    const cleaned = cleanHistoricalRecords(records);
    const result = importHistoricalTickets(cleaned);
    if (req.body.build_index === 'true' || req.body.build_index === true) {
      buildIndexFromDatabase().then(idx => logger.info('Index built after import', idx));
    }
    res.json({ code: 0, message: '导入成功', data: result });
  } catch (e) {
    logger.error('Import error', { error: e.message });
    res.status(500).json({ code: 500, message: e.message });
  }
});

router.get('/historical', authMiddleware, (req, res) => {
  const result = listHistoricalTickets(req.query);
  res.json({ code: 0, data: result });
});

router.post('/build-index', authMiddleware, requirePermission('model:configure'), async (req, res) => {
  try {
    const { batch_size = 50 } = req.body;
    const result = await buildIndexFromDatabase(batch_size);
    res.json({ code: 0, message: '索引构建完成', data: result });
  } catch (e) {
    logger.error('Build index error', { error: e.message });
    res.status(500).json({ code: 500, message: e.message });
  }
});

router.get('/index-stats', authMiddleware, (req, res) => {
  res.json({ code: 0, data: getIndexStats() });
});

router.get('/meta', authMiddleware, (req, res) => {
  res.json({
    code: 0,
    data: {
      categories: config.categories,
      urgency_levels: config.urgencyLevels,
      departments: config.departments,
      high_risk_categories: config.thresholds.highRiskCategories,
      thresholds: {
        low_confidence: config.thresholds.lowConfidence,
        confidence_high: config.thresholds.confidenceHigh,
        confidence_medium: config.thresholds.confidenceMedium,
      },
    },
  });
});

router.post('/evaluation/samples', authMiddleware, requirePermission('model:evaluate'), (req, res) => {
  const db = getDb();
  const { sample_type, content, expected_category, expected_urgency, expected_department,
    expected_high_risk, expected_needs_review, remarks } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO evaluation_samples (id, sample_type, content, expected_category, expected_urgency, expected_department, expected_high_risk, expected_needs_review, remarks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(id, sample_type, content, expected_category, expected_urgency, expected_department,
    expected_high_risk ? 1 : 0, expected_needs_review ? 1 : 0, remarks || null);
  res.json({ code: 0, data: { id } });
});

router.get('/evaluation/samples', authMiddleware, requirePermission('model:evaluate'), (req, res) => {
  const db = getDb();
  const { sample_type } = req.query;
  const sql = sample_type
    ? 'SELECT * FROM evaluation_samples WHERE sample_type = ? ORDER BY created_at DESC'
    : 'SELECT * FROM evaluation_samples ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...(sample_type ? [sample_type] : []));
  res.json({ code: 0, data: rows });
});

router.get('/evaluation/summary', authMiddleware, requirePermission('model:evaluate'), (req, res) => {
  const db = getDb();
  const byType = db.prepare(`
    SELECT sample_type, COUNT(*) as total,
           SUM(CASE WHEN test_passed = 1 THEN 1 ELSE 0 END) as passed,
           AVG(CASE WHEN test_passed IS NOT NULL THEN test_passed END) as pass_rate
    FROM evaluation_samples GROUP BY sample_type
  `).all();
  const overall = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN test_passed = 1 THEN 1 ELSE 0 END) as passed,
           SUM(CASE WHEN test_passed IS NOT NULL THEN 1 ELSE 0 END) as tested,
           AVG(CASE WHEN test_passed IS NOT NULL THEN test_passed END) as pass_rate
    FROM evaluation_samples
  `).get();
  res.json({ code: 0, data: { by_type: byType, overall } });
});

module.exports = router;
