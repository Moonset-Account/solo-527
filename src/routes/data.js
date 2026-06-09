const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, requirePermission } = require('../services/authService');
const { cleanHistoricalRecords, cleanTicketRecord } = require('../services/dataCleaner');
const { importHistoricalTickets, listHistoricalTickets } = require('../services/ticketService');
const { buildIndexFromDatabase, getIndexStats } = require('../services/vectorStore');
const { inferTicketAssignment } = require('../services/inferenceEngine');
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
           SUM(CASE WHEN test_passed IS NOT NULL THEN 1 ELSE 0 END) as tested,
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
  const failStats = db.prepare(`
    SELECT sample_type, test_passed, test_result, content, remarks, id
    FROM evaluation_samples
    WHERE test_passed = 0 OR (test_passed IS NOT NULL AND test_passed <> 1)
    ORDER BY sample_type, tested_at DESC
  `).all();
  res.json({ code: 0, data: { by_type: byType, overall, failed: failStats } });
});

router.put('/evaluation/samples/:id', authMiddleware, requirePermission('model:evaluate'), (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const s = db.prepare('SELECT id FROM evaluation_samples WHERE id = ?').get(id);
  if (!s) return res.status(404).json({ code: 404, message: '样本不存在' });
  const { sample_type, content, expected_category, expected_urgency, expected_department,
    expected_high_risk, expected_needs_review, remarks } = req.body;
  db.prepare(`
    UPDATE evaluation_samples SET
      sample_type = COALESCE(?, sample_type),
      content = COALESCE(?, content),
      expected_category = ?,
      expected_urgency = ?,
      expected_department = ?,
      expected_high_risk = ?,
      expected_needs_review = ?,
      remarks = ?,
      test_passed = NULL,
      test_result = NULL,
      tested_at = NULL
    WHERE id = ?
  `).run(sample_type || null, content || null,
    expected_category != null ? expected_category : null,
    expected_urgency != null ? expected_urgency : null,
    expected_department != null ? expected_department : null,
    expected_high_risk != null ? (expected_high_risk ? 1 : 0) : null,
    expected_needs_review != null ? (expected_needs_review ? 1 : 0) : null,
    remarks != null ? remarks : null,
    id);
  res.json({ code: 0, message: '已更新（测试结果已重置）' });
});

router.delete('/evaluation/samples/:id', authMiddleware, requirePermission('model:evaluate'), (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM evaluation_samples WHERE id = ?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ code: 404, message: '样本不存在' });
  res.json({ code: 0, message: '已删除' });
});

function evaluateOneSample(sample) {
  return new Promise(async (resolve) => {
    const t0 = Date.now();
    let inf = null;
    let error = null;
    try {
      inf = await inferTicketAssignment({
        content: sample.content,
        district: '',
        block: '',
        original_category: '',
        id: 'eval_' + sample.id.slice(0, 8),
      });
    } catch (e) {
      error = e.message;
    }
    const latency = Date.now() - t0;
    const catOk = !sample.expected_category || (inf?.category === sample.expected_category);
    const urgOk = !sample.expected_urgency || (inf?.urgency === sample.expected_urgency);
    const deptOk = !sample.expected_department || (inf?.department_code === sample.expected_department);
    const riskOk = sample.expected_high_risk ? (inf?.is_high_risk === true) : true;
    const reviewOk = sample.expected_needs_review ? (inf?.needs_review === true) : true;
    const passed = catOk && urgOk && deptOk && riskOk && reviewOk;
    const failReasons = [];
    if (!catOk) failReasons.push(`分类:期望=${sample.expected_category || '-'}/实际=${inf?.category || '-'}`);
    if (!urgOk) failReasons.push(`紧急:期望=${sample.expected_urgency || '-'}/实际=${inf?.urgency || '-'}`);
    if (!deptOk) failReasons.push(`科室:期望=${sample.expected_department || '-'}/实际=${inf?.department_code || '-'}`);
    if (sample.expected_high_risk && !riskOk) failReasons.push(`高风险:期望=1/实际=${inf?.is_high_risk ? 1 : 0}`);
    if (sample.expected_needs_review && !reviewOk) failReasons.push(`复核:期望=1/实际=${inf?.needs_review ? 1 : 0}`);
    if (error) failReasons.push(`推理错误:${error}`);
    const minConf = inf ? Math.min(inf.category_confidence || 0, inf.department_confidence || 0, inf.urgency_confidence || 0) : 0;
    resolve({
      sample,
      inference: inf,
      passed,
      fail_reasons: failReasons,
      latency_ms: latency,
      min_confidence: minConf,
      error,
    });
  });
}

router.post('/evaluation/samples/:id/test', authMiddleware, requirePermission('model:evaluate'), async (req, res) => {
  try {
    const db = getDb();
    const sample = db.prepare('SELECT * FROM evaluation_samples WHERE id = ?').get(req.params.id);
    if (!sample) return res.status(404).json({ code: 404, message: '样本不存在' });
    const r = await evaluateOneSample(sample);
    db.prepare(`
      UPDATE evaluation_samples SET
        test_passed = ?, test_result = ?, tested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      r.passed ? 1 : 0,
      JSON.stringify({
        inference: r.inference ? {
          category: r.inference.category,
          urgency: r.inference.urgency,
          department_code: r.inference.department_code,
          department_name: r.inference.department_name,
          is_high_risk: r.inference.is_high_risk,
          needs_review: r.inference.needs_review,
          review_reason: r.inference.review_reason,
          category_confidence: r.inference.category_confidence,
          urgency_confidence: r.inference.urgency_confidence,
          department_confidence: r.inference.department_confidence,
          reasoning: r.inference.reasoning,
        } : null,
        passed: r.passed,
        fail_reasons: r.fail_reasons,
        latency_ms: r.latency_ms,
        min_confidence: r.min_confidence,
        error: r.error,
      }),
      sample.id
    );
    res.json({ code: 0, data: { ...r, test_result: JSON.parse(db.prepare('SELECT test_result FROM evaluation_samples WHERE id = ?').pluck().get(sample.id)) } });
  } catch (e) {
    logger.error('单样本评估错误', e.message);
    res.status(500).json({ code: 500, message: e.message });
  }
});

router.post('/evaluation/run-tests', authMiddleware, requirePermission('model:evaluate'), async (req, res) => {
  try {
    const db = getDb();
    const { only_failed = true, only_untested = false, sample_type = null } = req.body || {};
    let sql = 'SELECT * FROM evaluation_samples WHERE 1=1';
    const params = [];
    if (only_untested) { sql += ' AND test_passed IS NULL'; }
    else if (only_failed) { sql += ' AND (test_passed IS NULL OR test_passed = 0)'; }
    if (sample_type) { sql += ' AND sample_type = ?'; params.push(sample_type); }
    sql += ' ORDER BY sample_type, created_at';
    const samples = db.prepare(sql).all(...params);
    if (!samples.length) return res.json({ code: 0, data: { total: 0, passed: 0, results: [] } });
    const results = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const r = await evaluateOneSample(s);
      results.push({
        id: s.id,
        sample_type: s.sample_type,
        passed: r.passed,
        fail_reasons: r.fail_reasons,
        latency_ms: r.latency_ms,
        min_confidence: r.min_confidence,
      });
      db.prepare(`
        UPDATE evaluation_samples SET
          test_passed = ?, test_result = ?, tested_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        r.passed ? 1 : 0,
        JSON.stringify({
          inference: r.inference ? {
            category: r.inference.category,
            urgency: r.inference.urgency,
            department_code: r.inference.department_code,
            department_name: r.inference.department_name,
            is_high_risk: r.inference.is_high_risk,
            needs_review: r.inference.needs_review,
            review_reason: r.inference.review_reason,
            category_confidence: r.inference.category_confidence,
            urgency_confidence: r.inference.urgency_confidence,
            department_confidence: r.inference.department_confidence,
            reasoning: r.inference.reasoning,
          } : null,
          passed: r.passed,
          fail_reasons: r.fail_reasons,
          latency_ms: r.latency_ms,
          min_confidence: r.min_confidence,
          error: r.error,
        }),
        s.id
      );
      if (i % 5 === 4) await new Promise(resolve => setTimeout(resolve, 120));
    }
    const passed = results.filter(r => r.passed).length;
    res.json({
      code: 0,
      data: {
        total: results.length,
        passed,
        pass_rate: results.length ? passed / results.length : 0,
        results,
      },
    });
  } catch (e) {
    logger.error('批量评估错误', { error: e.message, stack: e.stack });
    res.status(500).json({ code: 500, message: e.message });
  }
});

module.exports = router;
