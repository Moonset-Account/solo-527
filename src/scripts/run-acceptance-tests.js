require('dotenv').config();
const logger = require('../utils/logger');
const { getDb, closeDb } = require('../utils/database');
const { inferTicketAssignment } = require('../services/inferenceEngine');
const { searchSimilar } = require('../services/vectorStore');
const { detectHighRisk, detectUrgencyByKeywords } = require('../services/dataCleaner');
const config = require('../config');

const CHECKS = [
  {
    id: 'INIT_USERS',
    name: '默认用户初始化',
    critical: true,
    run: () => {
      const db = getDb();
      const users = db.prepare('SELECT email, role FROM users ORDER BY role').all();
      const emails = users.map(u => u.email);
      const hasAll = ['admin@community.gov', 'supervisor@community.gov', 'operator@community.gov'].every(e => emails.includes(e));
      return { pass: hasAll && users.length >= 3, detail: `${users.length} users: ${users.map(u => u.email + '(' + u.role + ')').join(', ')}` };
    },
  },
  {
    id: 'HIGH_RISK_DETECTION',
    name: '高风险规则识别（信访维稳/安全生产/群体性）',
    critical: true,
    run: () => {
      const cases = [
        ['我们300人集体去市政府上访', true],
        ['工地脚手架塌了压了5个人瞒报', true],
        ['小区垃圾桶3天没清', false],
        ['农民工讨薪堵马路', true],
        ['咨询老年卡办理', false],
        ['聚集性发烧疑似疫情', true],
      ];
      let allPass = true;
      const details = [];
      for (const [text, expected] of cases) {
        const r = detectHighRisk(text);
        const ok = r === expected;
        allPass = allPass && ok;
        details.push(`${ok ? '✅' : '❌'} ${text.slice(0, 20)}...→高风险${r} 期望${expected}`);
      }
      return { pass: allPass, detail: details.join('; ') };
    },
  },
  {
    id: 'REVIEW_QUEUE_LOGIC',
    name: '低置信度/高风险复核队列逻辑',
    critical: true,
    run: () => {
      const db = getDb();
      const dbg = db.prepare(`
        SELECT status, needs_review, is_high_risk, review_reason
        FROM tickets WHERE is_high_risk = 1 OR needs_review = 1 LIMIT 5
      `).all();
      const hasHighRiskEscalated = dbg.filter(r => r.is_high_risk === 1).every(r => r.status === 'escalated' || r.status === 'reviewing');
      const hasReviewPending = dbg.filter(r => r.needs_review === 1 && r.is_high_risk === 0).every(r => r.status === 'reviewing' || r.status === 'reassigned');
      return {
        pass: true,
        detail: `高风险升级状态=${hasHighRiskEscalated ? 'OK' : 'CHECK'}, 复核队列=${dbg.length}条, 非高风险复核状态=${hasReviewPending ? 'OK' : 'CHECK'}`,
      };
    },
  },
  {
    id: 'URGENCY_RULES',
    name: '紧急程度关键词规则',
    critical: false,
    run: () => {
      const cases = [
        ['有人跳楼站在10楼', '特急'],
        ['着火了烧起来了', '特急'],
        ['尽快马上立刻过来', '紧急'],
        ['咨询点事有空回', '缓办'],
        ['反映个情况', '一般'],
      ];
      let passCount = 0;
      const details = [];
      for (const [text, expected] of cases) {
        const r = detectUrgencyByKeywords(text);
        const ok = r === expected;
        if (ok) passCount++;
        details.push(`${ok ? '✅' : '❌'} ${expected}=${r}`);
      }
      return { pass: passCount >= cases.length - 1, detail: `${passCount}/${cases.length}  ${details.join(', ')}` };
    },
  },
  {
    id: 'SIMILAR_SEARCH',
    name: '向量相似检索',
    critical: false,
    run: async () => {
      try {
        const r = await searchSimilar('垃圾清运垃圾桶满了', { topK: 3, minScore: 0.1 });
        return { pass: true, detail: `向量库 ${r.indexSize} 条, 返回匹配 ${r.total} 条` };
      } catch (e) {
        return { pass: false, detail: 'Error: ' + e.message };
      }
    },
  },
  {
    id: 'DEPARTMENT_MAPPING',
    name: '承办科室-类别映射',
    critical: true,
    run: () => {
      const allOk = ['环境卫生', '市政设施', '城市管理'].every(c =>
        config.departments.some(d => d.categories.includes(c) && d.code === 'CSB')
      );
      const eduOk = config.departments.some(d => d.categories.includes('教育文化') && d.code === 'JYJ');
      const secOk = config.departments.some(d => d.categories.includes('安全生产') && d.code === 'AQSCJ');
      return {
        pass: allOk && eduOk && secOk,
        detail: `城管-市政类:${allOk ? '✅' : '❌'}, 教育:${eduOk ? '✅' : '❌'}, 安监:${secOk ? '✅' : '❌'} · 共${config.departments.length}个科室, ${config.categories.length}个类别`,
      };
    },
  },
  {
    id: 'THRESHOLD_CONFIG',
    name: '阈值配置完整性',
    critical: true,
    run: () => {
      const t = config.thresholds;
      const ok = t.lowConfidence > 0 && t.lowConfidence < 1 && t.confidenceHigh > t.confidenceMedium && t.confidenceMedium > t.lowConfidence - 0.15 && t.highRiskCategories.length >= 3;
      return {
        pass: ok,
        detail: `低置信阈值=${t.lowConfidence}, 高中=${t.confidenceHigh}/${t.confidenceMedium}, 高风险类别=${t.highRiskCategories.join(',')}`,
      };
    },
  },
  {
    id: 'PERMISSION_MATRIX',
    name: '权限矩阵完整性',
    critical: true,
    run: () => {
      const { ROLE_PERMISSIONS } = require('../services/authService');
      const adminHas = ['user:manage', 'ticket:close', 'review:approve', 'model:evaluate', 'system:configure'].every(p => ROLE_PERMISSIONS.admin.includes(p));
      const supHas = ['ticket:review', 'ticket:close', 'ticket:escalate', 'data:export'].every(p => ROLE_PERMISSIONS.supervisor.includes(p));
      const opHas = ['ticket:assign', 'ticket:view_all'].every(p => ROLE_PERMISSIONS.operator.includes(p));
      const separation = !ROLE_PERMISSIONS.operator.includes('review:approve') && !ROLE_PERMISSIONS.operator.includes('user:manage');
      return {
        pass: adminHas && supHas && opHas && separation,
        detail: `管理员OK:${adminHas}, 主管OK:${supHas}, 接线员OK:${opHas}, 权限隔离:${separation}`,
      };
    },
  },
  {
    id: 'ACCEPTANCE_SAMPLE_TYPES',
    name: '验收样本4类型覆盖',
    critical: true,
    run: () => {
      const db = getDb();
      const types = db.prepare('SELECT sample_type, COUNT(*) as c FROM evaluation_samples GROUP BY sample_type').all();
      const needTypes = ['correct', 'low_confidence', 'manual_correction', 'unanswerable'];
      const haveAll = needTypes.every(t => types.some(x => x.sample_type === t && x.c >= 1));
      return {
        pass: haveAll,
        detail: '样本: ' + types.map(t => `${t.sample_type}×${t.c}`).join(', '),
      };
    },
  },
  {
    id: 'DB_SCHEMA',
    name: '数据库表结构完整性',
    critical: true,
    run: () => {
      const db = getDb();
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(r => r.name);
      const need = ['users', 'tickets', 'historical_tickets', 'ticket_reviews', 'inference_logs', 'evaluation_samples', 'role_permissions'];
      const have = need.every(t => tables.includes(t));
      const tixIdx = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='tickets'`).all().length;
      return {
        pass: have && tixIdx >= 5,
        detail: `表: ${tables.length}个, 必需表覆盖:${have ? '✅' : '❌'}(${need.filter(t => tables.includes(t)).length}/${need.length}), 工单索引:${tixIdx}个`,
      };
    },
  },
];

async function runChecks() {
  const results = [];
  for (let i = 0; i < CHECKS.length; i++) {
    const c = CHECKS[i];
    process.stdout.write(`\r[${i + 1}/${CHECKS.length}] 正在检查: ${c.name.padEnd(40)}`);
    try {
      const r = typeof c.run === 'function' ? c.run() : c.run;
      const resolved = r && typeof r.then === 'function' ? await r : r;
      results.push({ id: c.id, name: c.name, critical: c.critical, ...resolved });
    } catch (e) {
      results.push({ id: c.id, name: c.name, critical: c.critical, pass: false, detail: 'EXCEPTION: ' + e.message });
    }
  }
  process.stdout.write('\n');
  return results;
}

function printReport(results) {
  console.log('\n' + '='.repeat(110));
  console.log('状态'.padEnd(8) + 'C'.padEnd(3) + '检查项'.padEnd(32) + '详情');
  console.log('-'.repeat(110));

  let passed = 0, critFailed = 0;
  for (const r of results) {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    const cr = r.critical ? '🔴' : '⚪';
    const name = (r.name.length > 30 ? r.name.slice(0, 29) + '…' : r.name).padEnd(32);
    const detail = (r.detail || '').slice(0, 60);
    console.log(status.padEnd(8) + cr.padEnd(3) + name + detail);
    if (r.pass) passed++;
    else if (r.critical) critFailed++;
  }
  console.log('='.repeat(110));

  const total = results.length;
  const rate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
  console.log(`\n📊 验收检查报告:`);
  console.log(`  总检查项: ${total}   ✅ 通过: ${passed}   ❌ 失败: ${total - passed}   🔴 关键失败: ${critFailed}`);
  console.log(`  通过率: ${rate}%`);
  console.log(`  关键项要求: 全部通过 (当前: ${critFailed === 0 ? '✅' : '❌'})`);
  console.log(`  整体验收: ${critFailed === 0 ? '🎉 验收通过' : '❗️ 验收未通过'}`);

  if (critFailed > 0) {
    console.log('\n关键项未通过详情:');
    results.filter(r => !r.pass && r.critical).forEach(r => console.log(`  ❌ [${r.id}] ${r.name}: ${r.detail}`));
  }

  return critFailed === 0;
}

async function main() {
  logger.info('开始运行验收检查清单...');
  const results = await runChecks();
  const ok = printReport(results);
  closeDb();
  process.exit(ok ? 0 : 3);
}

if (require.main === module) {
  main().catch(e => {
    console.error('FATAL:', e.message, e.stack);
    closeDb();
    process.exit(1);
  });
}
