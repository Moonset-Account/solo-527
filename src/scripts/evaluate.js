require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { getDb, closeDb } = require('../utils/database');
const { inferTicketAssignment } = require('../services/inferenceEngine');
const config = require('../config');

async function evaluateSample(sample) {
  const start = Date.now();
  let result = null;
  let error = null;

  try {
    result = await inferTicketAssignment({
      content: sample.content,
      district: '',
      block: '',
      originalCategory: '',
      id: 'eval_' + uuidv4(),
    });
  } catch (e) {
    error = e.message;
  }

  const catOk = !sample.expected_category || (result?.category === sample.expected_category);
  const urgOk = !sample.expected_urgency || (result?.urgency === sample.expected_urgency);
  const deptOk = !sample.expected_department || (result?.department_code === sample.expected_department);
  const riskOk = sample.expected_high_risk ? (result?.is_high_risk === true) : true;
  const reviewOk = sample.expected_needs_review ? (result?.needs_review === true) : true;

  const allChecks = [catOk, urgOk, deptOk, riskOk, reviewOk];
  const passed = allChecks.every(Boolean);
  const failReasons = [];
  if (!catOk) failReasons.push(`分类:期望${sample.expected_category}/实际${result?.category}`);
  if (!urgOk) failReasons.push(`紧急:期望${sample.expected_urgency}/实际${result?.urgency}`);
  if (!deptOk) failReasons.push(`科室:期望${sample.expected_department}/实际${result?.department_code}`);
  if (!riskOk) failReasons.push(`高风险识别不符(期望${sample.expected_high_risk}/实际${result?.is_high_risk})`);
  if (!reviewOk) failReasons.push(`复核判断不符(期望${sample.expected_needs_review}/实际${result?.needs_review})`);
  if (error) failReasons.push(`ERROR:${error}`);

  return {
    sample,
    result,
    passed,
    failReasons,
    latencyMs: Date.now() - start,
    confidence: result ? Math.min(result.category_confidence, result.department_confidence) : 0,
    error,
  };
}

function printTable(results) {
  console.log('\n' + '='.repeat(110));
  console.log('类型'.padEnd(18) + '结果'.padEnd(6) + '分类'.padEnd(14) + '紧急'.padEnd(8) + '科室'.padEnd(8) + '置信度'.padEnd(8) + '耗时'.padEnd(8) + '备注');
  console.log('-'.repeat(110));

  for (const r of results) {
    const s = r.sample;
    const typeMap = { correct: 'correct 正确', low_confidence: 'low_conf低置信', manual_correction: 'manual 改标', unanswerable: 'unansw无法答' };
    const typeStr = (typeMap[s.sample_type] || s.sample_type).padEnd(18);
    const resStr = (r.passed ? '✅PASS' : '❌FAIL').padEnd(6);
    const catStr = ((r.result?.category || '-') + (s.expected_category && r.result?.category !== s.expected_category ? `→${s.expected_category}` : '')).padEnd(14);
    const urgStr = ((r.result?.urgency || '-') + (s.expected_urgency && r.result?.urgency !== s.expected_urgency ? `→${s.expected_urgency}` : '')).padEnd(8);
    const deptStr = ((r.result?.department_code || '-') + (s.expected_department && r.result?.department_code !== s.expected_department ? `→${s.expected_department}` : '')).padEnd(8);
    const confStr = ((r.confidence * 100).toFixed(1) + '%').padEnd(8);
    const latStr = (r.latencyMs + 'ms').padEnd(8);
    const remarkStr = r.passed ? (s.remarks ? s.remarks.slice(0, 25) : '') : r.failReasons.join('; ').slice(0, 35);

    console.log(typeStr + resStr + catStr + urgStr + deptStr + confStr + latStr + remarkStr);
  }
  console.log('='.repeat(110) + '\n');
}

function printSummary(results) {
  const byType = {};
  for (const r of results) {
    if (!byType[r.sample.sample_type]) byType[r.sample.sample_type] = { total: 0, passed: 0 };
    byType[r.sample.sample_type].total++;
    if (r.passed) byType[r.sample.sample_type].passed++;
  }

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const rate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
  const avgLat = Math.round(results.reduce((a, r) => a + r.latencyMs, 0) / total);
  const avgConf = (results.reduce((a, r) => a + r.confidence, 0) / total * 100).toFixed(1);

  console.log('=========== 验收评估报告 ===========');
  console.log(`总样本数: ${total}`);
  console.log(`通过数: ${passed}`);
  console.log(`通过率: ${rate}%`);
  console.log(`平均耗时: ${avgLat}ms`);
  console.log(`平均置信度: ${avgConf}%`);
  console.log('');

  const typeNames = { correct: '✅ 正确判断', low_confidence: '⚠️ 低置信度', manual_correction: '✏️ 人工改标', unanswerable: '🚫 模型无法回答' };
  for (const [t, s] of Object.entries(byType)) {
    const r = s.total > 0 ? (s.passed / s.total * 100).toFixed(1) : '-';
    console.log(`  ${typeNames[t] || t}: ${s.passed}/${s.total} (${r}%)`);
  }

  const failed = results.filter(r => !r.passed);
  if (failed.length) {
    console.log('\n失败详情:');
    for (const f of failed) {
      console.log(`  - [${f.sample.sample_type}] ${f.sample.content.slice(0, 40)}...`);
      console.log(`    原因: ${f.failReasons.join('; ')}`);
    }
  }
  console.log('====================================\n');

  const passThreshold = 70;
  const acceptancePassed = parseFloat(rate) >= passThreshold;
  console.log(acceptancePassed ? `🎉 验收通过！(通过率 ${rate}% ≥ 阈值 ${passThreshold}%)` : `❌ 验收未通过 (通过率 ${rate}% < 阈值 ${passThreshold}%)`);

  return acceptancePassed;
}

async function saveResults(results) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE evaluation_samples SET
      test_result = ?, test_passed = ?, tested_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      stmt.run(
        JSON.stringify({
          result: r.result,
          passed: r.passed,
          reasons: r.failReasons,
          latencyMs: r.latencyMs,
          confidence: r.confidence,
          error: r.error,
        }),
        r.passed ? 1 : 0,
        r.sample._id
      );
    }
    return rows.length;
  });
  try { return tx(results); } catch (e) { logger.warn('保存测试结果失败', e.message); return 0; }
}

async function main() {
  const db = getDb();
  const samples = db.prepare('SELECT * FROM evaluation_samples ORDER BY sample_type, created_at').all();

  if (!samples.length) {
    console.error('验收样本库为空！请先运行: npm run seed-data');
    closeDb();
    process.exit(1);
  }

  logger.info(`开始验收评估，共 ${samples.length} 条样本...`);
  const results = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    process.stdout.write(`\r进度: ${i + 1}/${samples.length}  ${(s.content || '').slice(0, 30)}...         `);
    const r = await evaluateSample(s);
    r.sample._id = s.id;
    results.push(r);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  process.stdout.write('\n');

  const updated = saveResults(results);
  logger.info(`结果已写入数据库: ${updated} 条`);

  printTable(results);
  const ok = printSummary(results);

  closeDb();
  process.exit(ok ? 0 : 2);
}

if (require.main === module) {
  main().catch(e => {
    logger.error('评估失败', { error: e.message, stack: e.stack });
    closeDb();
    process.exit(1);
  });
}

module.exports = { evaluateSample };
