/**
 * 一站式 HTTP + 队列 端到端验证脚本
 * 内嵌启动 Express 服务器 + 发 HTTP 请求 + 轮询状态 + 直接查 DB 打印 4 张表可观察数据
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const DEMO = `[项目经理 李明] 各位早上好，今天是6月9号，我们开本周的产品研发周会。
【后端工程师 张伟】我这边的登录模块重构预计明天6月10号完成，测试需要李娜配合一下。
（QA 李娜）好的，我来安排测试。上一版的5个bug我这两天处理完关闭。
前端 陈静：支付页面UI今天下午提PR，支付接口文档好像没更新？
产品经理-刘洋：接口文档我今天下班前更新，优惠券抵扣放到7月1号的版本。
设计师 赵雪：优惠券UI等7月版本再做，新版banner今天出稿。
[项目经理 李明] 再总结一下：张伟6月10号完成登录模块重构，李娜这两天关bug，陈静下午提PR，刘洋今天更文档，赵雪今天出banner。重要的是：6月18号的v2.0验收是里程碑！
[产品经理 刘洋] 补充一下，6月30号v2.0正式上线也是里程碑节点，大家一定要重视。
相关同事把会后总结文档尽快出一下，散会！`;

const fs = require('fs');
const path = require('path');

// 先清旧 DB
const dbPath = path.resolve(__dirname, '../data/app.db');
try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); } catch(e) {}

const { startServer } = require('./index');
const { getDb } = require('./db');
const workbench = require('./services/annotationWorkbench');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function http(method, path2, body) {
  const base = 'http://127.0.0.1:' + (process.env.PORT || 3002);
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(base + path2, opts);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { _raw: text }; }
  return { status: res.status, data };
}

(async () => {
  try {
    console.log('──────────────────────────────────────────────────');
    console.log('  一站式端到端验证: POST /meetings/import → 4 张表');
    console.log('──────────────────────────────────────────────────\n');

    // 1) 启动服务器
    console.log('[1/8] 启动 Express 服务器...');
    const { server } = await startServer();
    const port = server.address().port;
    console.log('      服务器 OK，端口=' + port);
    await sleep(1000);

    // 2) health
    const h = await http('GET', '/health');
    console.log('[2/8] GET /health =', h.status, h.data && h.data.services && h.data.services.database);

    // 3) 真实 HTTP 路由 POST /api/v1/meetings/import
    console.log('\n[3/8] 真实路由: POST /api/v1/meetings/import');
    const imp = await http('POST', '/api/v1/meetings/import', {
      title: '产品研发周会（真实HTTP导入测试）',
      project_name: 'Demo 产品',
      meeting_date: '2026-06-09',
      duration: 45,
      location: '线上-钉钉',
      content: DEMO,
      format: 'auto',
      operator: 'e2e-test',
    });
    const resp = imp.data || {};
    console.log('      HTTP 状态=' + imp.status);
    console.log('      响应=' + JSON.stringify(resp).slice(0, 200));
    const meetingId = resp.data ? resp.data.meetingId : resp.meetingId;
    if (!meetingId || imp.status !== 200) {
      throw new Error('导入失败：' + JSON.stringify(resp));
    }
    console.log('      meetingId = ' + meetingId.slice(0, 10) + '...');

    // 立即查 DB 确认导入后立即有数据
    const db = getDb();
    const meet1 = db.prepare('SELECT status, title FROM meetings WHERE id = ?').get(meetingId);
    const seg1 = db.prepare('SELECT COUNT(*) AS c FROM transcript_segments WHERE meeting_id = ?').get(meetingId).c;
    const spk1 = db.prepare('SELECT COUNT(*) AS c FROM speakers WHERE meeting_id = ?').get(meetingId).c;
    console.log('      【导入后立即快照】status=' + meet1.status + ' | segments=' + seg1 + ' | speakers=' + spk1);
    if (seg1 === 0 || spk1 === 0) {
      console.error('      ❌ FAIL: 同步事务 segments/speakers 未写入！');
    } else {
      console.log('      ✅ 同步事务写入成功（不依赖队列）');
    }

    // 4) 轮询 meetings 状态 最多 12s
    console.log('\n[4/8] 轮询会议状态（等待 TRANSCRIPT_PARSE + ACTION_EXTRACT 队列执行）...');
    let status = meet1.status;
    let parsedAt = null;
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      const d = db.prepare('SELECT status FROM meetings WHERE id = ?').get(meetingId);
      status = d.status;
      const tag = status === 'parsed' && !parsedAt ? (parsedAt = i, '  ← TRANSCRIPT_PARSE 完成') : '';
      const tag2 = status === 'extracted' ? '  ← ACTION_EXTRACT 完成!' : '';
      console.log('      [' + (i+1) + 's] status=' + status + tag + tag2);
      if (status === 'extracted' || status === 'extract_failed') break;
    }

    // 5) 打印 speakers 表
    console.log('\n[5/8] ===== speakers 表 =====');
    const spks = db.prepare('SELECT speaker_name, speaker_role, raw_alias, confirmed FROM speakers WHERE meeting_id = ?').all(meetingId);
    if (spks.length === 0) { console.log('      (空) ❌'); }
    else spks.forEach(s => console.log('      · ' + s.speaker_name + (s.speaker_role ? '（' + s.speaker_role + '）' : '') + '  | alias=' + s.raw_alias + '  confirmed=' + s.confirmed));

    // 6) 打印 segments 表（摘要，最多前 5 个）
    console.log('\n[6/8] ===== transcript_segments 表（前5个）=====');
    const segs = db.prepare(`
      SELECT ts.segment_index, sp.speaker_name, ts.content
      FROM transcript_segments ts LEFT JOIN speakers sp ON ts.speaker_id = sp.id
      WHERE ts.meeting_id = ? ORDER BY ts.segment_index LIMIT 8
    `).all(meetingId);
    if (segs.length === 0) { console.log('      (空) ❌'); }
    else segs.forEach(s => console.log('      [' + s.segment_index + '] ' + (s.speaker_name || '(无发言人)') + ': ' + (s.content || '').slice(0, 40)));

    // 7) 打印 action_items 表
    console.log('\n[7/8] ===== action_items 表（全部）=====');
    const ais = db.prepare(`
      SELECT id, title, assignee, assignee_pending, assignee_note,
             deadline, deadline_pending, deadline_note, is_milestone,
             milestone_confidence, milestone_note, needs_review, review_reason
      FROM action_items WHERE meeting_id = ? ORDER BY is_milestone DESC, deadline ASC
    `).all(meetingId);
    if (ais.length === 0) { console.log('      (空) ❌'); }
    else {
      console.log('      共 ' + ais.length + ' 条行动项：');
      ais.forEach((a, idx) => {
        const ms = a.is_milestone ? '⭐里程碑 ' : '';
        const pa = a.assignee_pending ? ' 👤待确认(' + (a.assignee || '无') + ')' : ' 👤' + (a.assignee || '无负责人');
        const pd = a.deadline_pending ? ' 📅待确认(' + (a.deadline || '无') + ')' : ' 📅' + (a.deadline || '无DDL');
        const conf = ' ms_conf=' + (a.milestone_confidence || 0).toFixed(2);
        console.log('      [' + idx + '] ' + ms + (a.title || '').slice(0, 28) + pa + pd + (a.is_milestone ? conf : ''));
        if (a.assignee_pending || a.deadline_pending || (a.milestone_note && a.milestone_confidence > 0.5 && !a.is_milestone)) {
          if (a.assignee_note && a.assignee_pending) console.log('           · 待确认原因: ' + a.assignee_note);
          if (a.deadline_note && a.deadline_pending) console.log('           · 待确认原因: ' + a.deadline_note);
          if (a.milestone_note && !a.is_milestone && (a.milestone_confidence || 0) >= 0.5) console.log('           · 里程碑复核: ' + a.milestone_note);
        }
      });
    }

    // 8) 打印 review_tasks + workbench stats
    console.log('\n[8/8] ===== review_tasks（复核队列）+ workbench/stats =====');
    const rts = db.prepare(`
      SELECT rt.field_type, rt.current_value, rt.confidence, rt.status, ai.title
      FROM review_tasks rt INNER JOIN action_items ai ON rt.action_item_id = ai.id
      WHERE ai.meeting_id = ? ORDER BY rt.field_type
    `).all(meetingId);
    if (rts.length === 0) console.log('      review_tasks (空) ❌');
    else {
      console.log('      共 ' + rts.length + ' 条复核任务：');
      rts.forEach(r => console.log('      · [' + r.field_type + '] value=' + JSON.stringify(r.current_value).slice(0,15) + ' conf=' + r.confidence.toFixed(2) + ' status=' + r.status + ' | 标题: ' + (r.title || '').slice(0, 20)));
    }
    const stats = workbench.getWorkbenchStats();
    console.log('\n      工作台统计 getWorkbenchStats():');
    Object.keys(stats).forEach(k => console.log('      · ' + k + ' = ' + stats[k]));

    // ======== 总体检查 ========
    console.log('\n──────────────────────────────────────────────────');
    console.log('  总体检查：');
    const checks = [];
    checks.push(['会议状态最终 = extracted', status === 'extracted', '实际=' + status]);
    checks.push(['speakers 表 ≥ 5 人', spks.length >= 5, '实际=' + spks.length]);
    checks.push(['segments 表 ≥ 8 段', segs.length >= 8, '实际=' + segs.length]);
    checks.push(['action_items 表 ≥ 5 条', ais.length >= 5, '实际=' + ais.length]);
    const milestones = ais.filter(a => a.is_milestone === 1);
    checks.push(['至少 1 条 v2.0 验收/上线里程碑 (is_milestone=1)', milestones.length >= 1, '实际=' + milestones.length + ' 条 ms_conf 分布: ' + ais.map(a => (a.milestone_confidence || 0).toFixed(2) + '(ms=' + a.is_milestone + ')').join(', ')]);
    checks.push(['review_tasks ≥ 3', rts.length >= 3, '实际=' + rts.length]);
    checks.push(['待确认 assignee/deadline 原因字段非空', ais.some(a => (a.assignee_pending && a.assignee_note) || (a.deadline_pending && a.deadline_note)), '抽样=' + JSON.stringify((ais.find(a=>a.assignee_note)||{}).assignee_note)]);
    checks.push(['workbench.pending_review > 0', stats.pending_review > 0, '实际=' + stats.pending_review]);
    checks.push(['workbench.pending_milestone ≥ 1', stats.pending_milestone >= 1, '实际=' + stats.pending_milestone]);

    let allOk = true;
    checks.forEach(([name, ok, detail]) => {
      if (ok) console.log('   ✅ ' + name);
      else { console.log('   ❌ ' + name + '  | ' + (detail || '')); allOk = false; }
    });
    console.log('──────────────────────────────────────────────────\n');

    if (allOk) {
      console.log('🎉 全部通过！真实 HTTP 路由 + 队列 + 4 张表 + 复核队列 + stats 全部符合预期。');
    } else {
      console.log('⚠️  部分失败，请根据上方 ❌ 定位根因。');
    }

    await new Promise(r => server.close(r));
    require('./db').closeDb();
    process.exit(allOk ? 0 : 1);
  } catch (e) {
    console.error('\n❌ EXCEPTION:', e.message);
    console.error(e.stack);
    try { require('./db').closeDb(); } catch {}
    process.exit(1);
  }
})();
