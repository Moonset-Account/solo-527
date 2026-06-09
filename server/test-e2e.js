/**
 * 完整端到端测试：
 * 1) speaker-tagged 格式解析（[项目经理 李明]、【产品-刘洋】、李明：等格式）
 * 2) sql.js 循环插入（多条 statement 复用）
 * 3) actionSvc.saveExtractionResult
 * 4) review_tasks 创建 + workbench stats
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { initDb, getDb } = require('./db');
const cleaner = require('./services/dataCleaning');
const meetingSvc = require('./services/meetingService');
const extraction = require('./services/extractionService');
const actionSvc = require('./services/actionItemService');
const workbench = require('./services/annotationWorkbench');

const DEMO = `[项目经理 李明] 各位早上好，今天是6月9号，我们开本周的周会。
【后端工程师 张伟】 我这边的登录模块重构预计明天6月10号完成，测试需要李娜配合一下。
（QA 李娜） 好的，我来安排测试。上一版的5个bug我这两天处理完关闭。
前端 陈静：支付页面UI今天下午提PR，支付接口文档好像没更新？
产品经理-刘洋：接口文档我今天下班前更新，优惠券抵扣放到7月1号的版本。
设计师 赵雪：优惠券UI等7月版本再做，新版banner今天出稿。
[项目经理 李明] 再总结一下：张伟6月10号完成登录，李娜这两天关bug，陈静下午提PR，刘洋今天更文档，赵雪今天出banner。重要的是，6月18号的v2.0验收是里程碑！
[产品经理 刘洋] 补充一下，6月30号v2.0正式上线也是里程碑节点，大家一定要重视。
相关同事把会后总结文档尽快出一下，散会！`;

(async () => {
  try {
    console.log('=== Step 1: DB Init ===');
    await initDb();
    console.log('OK: DB init');

    // ======== 测试1：speaker-tagged 解析 ========
    console.log('\n=== Step 2: Parse Transcript (speaker-tagged) ===');
    const parsed = cleaner.parseTranscript(DEMO, 'speaker-tagged');
    console.log(`Format detected: ${parsed.format}`);
    console.log(`Segments count: ${parsed.segments.length}`);
    parsed.segments.forEach((s, i) => {
      console.log(`  [${i}] speaker=${JSON.stringify(s.speaker)} role=${JSON.stringify(s.speaker_role)} content=${s.content.slice(0, 20)}...`);
    });
    if (parsed.segments.length < 5) {
      console.error('FAIL: Too few segments parsed');
      process.exit(1);
    }
    const hasLiMing = parsed.segments.some(s => s.speaker === '李明');
    const hasZhangWei = parsed.segments.some(s => s.speaker === '张伟');
    const hasLiuYang = parsed.segments.some(s => s.speaker === '刘洋');
    if (!hasLiMing || !hasZhangWei || !hasLiuYang) {
      console.error(`FAIL: Names not correctly extracted: 李明=${hasLiMing} 张伟=${hasZhangWei} 刘洋=${hasLiuYang}`);
      console.error('All speakers:', Array.from(new Set(parsed.segments.map(s => s.speaker))));
      process.exit(1);
    }
    console.log('OK: Speaker parsing correct');

    // ======== 测试2：会议导入（含 speakers + segments 循环插入） ========
    console.log('\n=== Step 3: Import Meeting ===');
    const before = Date.now();
    const result = await meetingSvc.importTranscript({
      title: '端到端测试会议 ' + new Date().toISOString().slice(11, 19),
      projectName: '测试项目',
      meetingDate: '2026-06-09',
      duration: 45,
      location: '线上',
      rawContent: DEMO,
      sourceFormat: 'speaker-tagged',
      source: 'auto-test',
      operatorName: 'test-script',
    });
    const meetingId = result.meetingId;
    console.log(`OK: Imported meeting ${meetingId.slice(0, 8)}..., segments=${result.segmentsCount} in ${Date.now()-before}ms`);

    // 验证数据库里有 segments 和 speakers
    const db = getDb();
    const speakers = db.prepare('SELECT * FROM speakers WHERE meeting_id = ?').all(meetingId);
    const segs = db.prepare('SELECT COUNT(*) AS c FROM transcript_segments WHERE meeting_id = ?').get(meetingId).c;
    console.log(`DB Speakers: ${speakers.length}, DB Segments: ${segs}`);
    speakers.forEach(s => console.log(`  - ${s.speaker_name} (confirmed=${s.confirmed}, role=${s.speaker_role})`));
    if (speakers.length < 5) { console.error('FAIL: Too few speakers inserted'); process.exit(1); }
    if (segs !== parsed.segments.length) { console.error(`FAIL: Segments count mismatch (${segs} vs ${parsed.segments.length})`); process.exit(1); }

    // ======== 测试3：启发式抽取 + saveExtractionResult ========
    console.log('\n=== Step 4: Extract & Save Action Items ===');
    const detail = meetingSvc.getMeetingDetail(meetingId);
    const segForExtract = detail.segments.map(s => ({
      speaker: s.speaker_name || '',
      content: s.content,
      start_time: s.start_time,
      end_time: s.end_time,
    }));
    const before2 = Date.now();
    const extractResult = await extraction.extractActionItems({
      meetingTitle: detail.title,
      projectName: detail.project_name,
      meetingDate: detail.meeting_date,
      segments: segForExtract,
    }, { forceMock: true });
    console.log(`Model used: ${extractResult._meta.model}`);
    console.log(`Action items: ${extractResult.action_items.length}`);
    console.log(`Topics: ${extractResult.topics.length}`);
    console.log(`Warnings: ${extractResult.warnings}`);
    console.log(`Extract time: ${Date.now()-before2}ms`);
    extractResult.action_items.forEach((a, i) => {
      console.log(`  [${i}] ${a.title.slice(0, 30)} | assign=${a.assignee || '?'}(c=${a.assignee_confidence?.toFixed(2)},p=${a.assignee_pending}) | ddl=${a.deadline || '?'}(p=${a.deadline_pending}) | ms=${a.is_milestone} needsReview=${a.needs_review}`);
      if (a.needs_review) console.log(`       reason: ${a.review_reason}`);
    });
    if (extractResult.action_items.length < 3) { console.error('FAIL: Too few action items'); process.exit(1); }

    // 保存
    const before3 = Date.now();
    const meta = extractResult._meta;
    delete extractResult._meta;
    actionSvc.saveExtractionResult(meetingId, extractResult, meta);
    console.log(`Saved in ${Date.now()-before3}ms`);

    // 检查 DB 中有多少条 action_items
    const actionCount = db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE meeting_id = ?').get(meetingId).c;
    const reviewCount = db.prepare(`
      SELECT COUNT(*) AS c FROM review_tasks rt
      INNER JOIN action_items ai ON rt.action_item_id = ai.id
      WHERE ai.meeting_id = ? AND rt.status = 'pending'
    `).get(meetingId).c;
    const milestoneCount = db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE meeting_id = ? AND is_milestone = 1').get(meetingId).c;
    const pendingAssignee = db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE meeting_id = ? AND assignee_pending = 1 AND needs_review = 1').get(meetingId).c;
    const pendingDeadline = db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE meeting_id = ? AND deadline_pending = 1 AND needs_review = 1').get(meetingId).c;
    console.log(`DB: actions=${actionCount}, reviews=${reviewCount}, milestones=${milestoneCount}, pendingAssignee=${pendingAssignee}, pendingDeadline=${pendingDeadline}`);
    if (actionCount !== extractResult.action_items.length) { console.error('FAIL: actions not saved correctly'); process.exit(1); }

    // ======== 测试4：Workbench stats ========
    console.log('\n=== Step 5: Workbench Stats ===');
    try {
      const stats = workbench.getWorkbenchStats();
      console.log(JSON.stringify(stats, null, 2));
      if (typeof stats.pending_review !== 'number') {
        console.error('FAIL: workbench stats returns invalid result');
        process.exit(1);
      }
      console.log(`OK: workbench stats, pending_review=${stats.pending_review}, pending_assignee=${stats.pending_assignee}, pending_deadline=${stats.pending_deadline}, pending_milestone=${stats.pending_milestone}, today_extracted=${stats.today_extracted}, today_confirmed=${stats.today_confirmed}`);
    } catch (e) {
      console.error('FAIL: workbench stats error:', e.message, e.stack.split('\n')[1]);
      process.exit(1);
    }

    // ======== 测试5：Review queue ========
    console.log('\n=== Step 6: Review Queue ===');
    const queue = workbench.getReviewQueue({ limit: 10 });
    console.log(`Pending queue items: ${queue.length}`);
    queue.slice(0, 3).forEach(q => console.log(`  - ${q.title.slice(0, 20)} | assignee=${q.assignee || '待确认'} | deadline=${q.deadline || '待确认'} | pending_fields=${q.pending_fields}`));

    // ======== 测试6：Import API 模拟（完整的无队列模式） ========
    console.log('\n=== Step 7: API Mode - simulate full import (no queue) ===');
    const beforeFinal = Date.now();
    const r2 = await meetingSvc.importTranscript({
      title: 'API 测试会 ' + new Date().toISOString().slice(11, 19),
      projectName: 'Demo Project',
      meetingDate: '2026-06-09',
      rawContent: '[张经理] 今天的任务：王二完成需求文档，周五前。\n[王二] 好的我来写，下周一前提交。\n[李三] 测试的事情相关同事跟进一下，尽快。',
      sourceFormat: 'auto',
      operatorName: 'api',
    });
    const det2 = meetingSvc.getMeetingDetail(r2.meetingId);
    const segs2 = det2.segments.map(s => ({ speaker: s.speaker_name || '', content: s.content }));
    const ex2 = await extraction.extractActionItems({ meetingTitle: det2.title, meetingDate: '2026-06-09', segments: segs2 }, { forceMock: true });
    const ex2meta = ex2._meta; delete ex2._meta;
    actionSvc.saveExtractionResult(r2.meetingId, ex2, ex2meta);
    const finalStats = workbench.getWorkbenchStats();
    console.log(`Second import took ${Date.now()-beforeFinal}ms`);
    console.log(`Global stats: pending=${finalStats.pending_review}, extracted_today=${finalStats.today_extracted}`);
    const actions_second = db.prepare('SELECT id, title, assignee, assignee_pending, deadline, deadline_pending FROM action_items WHERE meeting_id = ?').all(r2.meetingId);
    console.log('Second import actions:');
    actions_second.forEach(a => console.log(`  - ${a.title.slice(0, 30)} -> ${a.assignee || '待确认'}(${a.assignee_pending ? 'PENDING' : 'ok'}), ddl=${a.deadline || '待确认'}(${a.deadline_pending ? 'PENDING' : 'ok'})`));

    console.log('\n\n====== ✅  ALL TESTS PASSED!  ======\n');
    require('./db').closeDb();
    process.exit(0);
  } catch (e) {
    console.error('\n❌ TEST FAILED:', e.message);
    console.error(e.stack);
    try { require('./db').closeDb(); } catch {}
    process.exit(1);
  }
})();
