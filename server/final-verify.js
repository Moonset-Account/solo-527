/**
 * 步骤 1：查看当前 data/app.db 的真实会议状态
 * 步骤 2：启动服务器 + HTTP 导入新产品研发周会
 * 步骤 3：等待队列完成，查 DB 确认 4 张表都有数据
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { initDb, getDb, closeDb } = require('./db');
const { startServer } = require('./index');
const workbench = require('./services/annotationWorkbench');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== Step 1: 查看当前磁盘 DB 的会议状态 ===');
  await initDb();
  const db = getDb();
  const meetings = db.prepare(`SELECT id, title, status, meeting_date, created_at FROM meetings ORDER BY created_at DESC LIMIT 20`).all();
  console.log(`当前共有 ${meetings.length} 个会议：`);
  meetings.forEach(m => {
    const sid = m.id.slice(0, 8);
    const segs = db.prepare('SELECT COUNT(*) AS c FROM transcript_segments WHERE meeting_id = ?').get(m.id).c;
    const spks = db.prepare('SELECT COUNT(*) AS c FROM speakers WHERE meeting_id = ?').get(m.id).c;
    const acts = db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE meeting_id = ?').get(m.id).c;
    const revs = db.prepare(`SELECT COUNT(*) AS c FROM review_tasks rt INNER JOIN action_items ai ON rt.action_item_id = ai.id WHERE ai.meeting_id = ? AND rt.status = 'pending'`).get(m.id).c;
    console.log(`  id=${sid}  status=${m.status.padEnd(14)}  segments=${segs}  speakers=${spks}  actions=${acts}  reviews=${revs}  title=${m.title}`);
  });

  // 如果有 imported 状态的会议，查一下它的 segments/speakers 具体情况
  const imported = meetings.filter(m => m.status === 'imported');
  if (imported.length > 0) {
    console.log(`\n⚠️  有 ${imported.length} 个 imported 会议需要处理：`);
    imported.forEach(m => {
      const raw = db.prepare('SELECT raw_source FROM meetings WHERE id = ?').get(m.id).raw_source;
      console.log(`\n  会议: ${m.title} (${m.id.slice(0, 8)}...)`);
      console.log(`  raw_content 开头: ${(raw || '').slice(0, 80)}...`);
      const segs = db.prepare('SELECT id FROM transcript_segments WHERE meeting_id = ?').all(m.id);
      console.log(`  segments 实际行数: ${segs.length}`);
      const spks = db.prepare('SELECT speaker_name FROM speakers WHERE meeting_id = ?').all(m.id);
      console.log(`  speakers 实际行数: ${spks.length}  ${spks.map(s=>s.speaker_name).join(', ')}`);
    });
  }
  closeDb();

  console.log('\n=== Step 2: 启动常驻服务器，发真实 HTTP 请求导入新产品研发周会 ===');
  await new Promise(r => setTimeout(r, 500));
  const DEMO = `[项目经理 李明] 各位早上好，今天是6月9号，我们开本周的产品研发周会。
【后端工程师 张伟】我这边的登录模块重构预计明天6月10号完成，测试需要李娜配合一下。
（QA 李娜）好的，我来安排测试。上一版的5个bug我这两天处理完关闭。
前端 陈静：支付页面UI今天下午提PR，支付接口文档好像没更新？
产品经理-刘洋：接口文档我今天下班前更新，优惠券抵扣放到7月1号的版本。
设计师 赵雪：优惠券UI等7月版本再做，新版banner今天出稿。
[项目经理 李明] 再总结一下：张伟6月10号完成登录模块重构，李娜这两天关bug，陈静下午提PR，刘洋今天更文档，赵雪今天出banner。重要的是：6月18号的v2.0验收是里程碑！
[产品经理 刘洋] 补充一下，6月30号v2.0正式上线也是里程碑节点，大家一定要重视。
相关同事把会后总结文档尽快出一下，散会！`;

  const { server } = await startServer();
  const port = server.address().port;
  console.log(`服务器启动 OK: http://127.0.0.1:${port}`);
  await sleep(1500);

  // 真实 HTTP POST
  console.log('\nPOST /api/v1/meetings/import ...');
  const impRes = await fetch(`http://127.0.0.1:${port}/api/v1/meetings/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '【全新导入】产品研发周会 ' + new Date().toLocaleTimeString(),
      project_name: '产品研发项目',
      meeting_date: '2026-06-09',
      duration: 45,
      location: '线上',
      content: DEMO,
      format: 'auto',
      operator: 'final-verify',
    })
  });
  const imp = await impRes.json();
  console.log('HTTP 响应:', JSON.stringify(imp).slice(0, 300));
  const meetingId = imp.data && imp.data.meetingId;
  if (!meetingId) { console.error('导入失败'); process.exit(1); }

  // 等队列
  await initDb();
  const db2 = getDb();
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    const row = db2.prepare('SELECT status FROM meetings WHERE id = ?').get(meetingId);
    console.log(`  [${i+1}s] status=${row && row.status}`);
    if (row && (row.status === 'extracted' || row.status === 'extract_failed')) break;
  }
  const st = db2.prepare('SELECT status FROM meetings WHERE id = ?').get(meetingId).status;

  console.log('\n=== Step 3: 最终 DB 数据快照 ===');
  const stats = workbench.getWorkbenchStats();
  console.log('workbench stats:', JSON.stringify(stats, null, 2));
  const acts = db2.prepare(`SELECT id, title, is_milestone, assignee, assignee_pending, deadline, deadline_pending, needs_review FROM action_items WHERE meeting_id = ? ORDER BY is_milestone DESC`).all(meetingId);
  console.log(`\naction_items (${acts.length}):`);
  acts.forEach((a, i) => {
    console.log(`  [${i}] ${a.is_milestone ? '⭐' : ' '} ${a.title.slice(0, 30)}  👤${a.assignee || '待确认'}${a.assignee_pending?'(PEND)':''}  📅${a.deadline || '待确认'}${a.deadline_pending?'(PEND)':''}`);
  });
  const revs = db2.prepare(`SELECT COUNT(*) AS c FROM review_tasks rt INNER JOIN action_items ai ON rt.action_item_id = ai.id WHERE ai.meeting_id = ?`).get(meetingId).c;
  const spks = db2.prepare('SELECT COUNT(*) AS c FROM speakers WHERE meeting_id = ?').get(meetingId).c;
  const segs = db2.prepare('SELECT COUNT(*) AS c FROM transcript_segments WHERE meeting_id = ?').get(meetingId).c;
  console.log(`\n最终验证：status=${st}  speakers=${spks}  segments=${segs}  action_items=${acts.length}  review_tasks=${revs}`);
  const allOk = (st === 'extracted' && spks >= 5 && segs >= 8 && acts.length >= 5 && revs >= 3 && stats.pending_review > 0);
  console.log('\n' + (allOk ? '🎉 全部符合预期！' : '⚠️ 部分不符合，需要排查'));

  closeDb();
  await new Promise(r => server.close(r));
  process.exit(allOk ? 0 : 1);
})();
