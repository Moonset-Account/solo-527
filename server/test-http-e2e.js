const PORT = process.env.PORT || 3002;
const BASE = `http://localhost:${PORT}`;

const DEMO_CONTENT = `[项目经理 李明] 各位早上好，今天是6月9号，我们开本周的产品研发周会。
【后端工程师 张伟】我这边的登录模块重构预计明天6月10号完成，测试需要李娜配合一下。
（QA 李娜）好的，我来安排测试。上一版的5个bug我这两天处理完关闭。
前端 陈静：支付页面UI今天下午提PR，支付接口文档好像没更新？
产品经理-刘洋：接口文档我今天下班前更新，优惠券抵扣放到7月1号的版本。
设计师 赵雪：优惠券UI等7月版本再做，新版banner今天出稿。
[项目经理 李明] 再总结一下：张伟6月10号完成登录模块重构，李娜这两天关bug，陈静下午提PR，刘洋今天更文档，赵雪今天出banner。重要的是：6月18号的v2.0验收是里程碑！
[产品经理 刘洋] 补充一下，6月30号v2.0正式上线也是里程碑节点，大家一定要重视。
相关同事把会后总结文档尽快出一下，散会！`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _raw: text }; }
  if (!res.ok) console.error('  !! HTTP', res.status, path, ':', JSON.stringify(data).slice(0, 200));
  return { status: res.status, data };
}

(async () => {
  let FAILED = false;
  function check(name, cond, detail) {
    if (cond) console.log('  OK  ' + name);
    else { console.error('  FAIL ' + name + (detail ? ': ' + detail : ''); FAILED = true; }
  }

  try {
    console.log('\n=== Step 1: Health Check ===');
    const h = await api('GET', '/health');
    check('Health OK', h.status === 200);

    console.log('\n=== Step 2: POST /api/v1/meetings/import ===');
    const imp = await api('POST', '/api/v1/meetings/import', {
      title: 'HTTP测试-产品研发周会',
      project_name: 'Demo Project',
      meeting_date: '2026-06-09',
      duration: 45,
      location: '线上',
      content: DEMO_CONTENT,
      format: 'auto',
      operator: 'http-e2e',
    });
    check('Import 返回成功', imp.status === 200, JSON.stringify(imp.data));
    const meetingId = imp.data && (imp.data.data ? imp.data.data.meetingId : imp.data.meetingId);
    console.log('  meetingId =', meetingId ? meetingId.slice(0, 8) + '...';
    check('返回 meetingId', !!meetingId);
    if (!meetingId) throw new Error('No meetingId');

    console.log('\n=== Step 3: 轮询 meetings status ===');
    let status = null;
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      const m = await api('GET', '/api/v1/meetings/' + meetingId);
      const d = m.data && m.data.data ? m.data.data : m.data;
      status = d && d.status;
      console.log('  [' + (i + 1) + '] status = ' + status);
      if (status === 'extracted' || status === 'extract_failed' || status === 'parsed') {
        if (status === 'parsed') continue;
        break;
      }
    }
    check('最终状态=extracted', status === 'extracted', '实际=' + status);

    console.log('\n=== Step 4: 验证 meeting detail ===');
    const det = await api('GET', '/api/v1/meetings/' + meetingId);
    const d2 = det.data && det.data.data ? det.data.data : det.data;
    const segs = (d2 && d2.segments || []).length;
    const spks = (d2 && d2.speakers || []).length;
    const actions = (d2 && d2.actionItems || []).length;
    console.log('  segments=' + segs + ', speakers=' + spks + ', actionItems=' + actions);
    check('segments >= 8', segs >= 8, '实际=' + segs);
    check('speakers >= 5', spks >= 5, '实际=' + spks);

    console.log('\n=== Step 5: 列表 action-items ===');
    const ai = await api('GET', '/api/v1/action-items?meetingId=' + meetingId);
    const items = ai.data && ai.data.data ? ai.data.data.items : (ai.data.items || ai.data || []);
    console.log('  返回' + items.length + '条行动项');
    const milestones = items.filter(x => x.is_milestone === 1 || x.is_milestone === true);
    const pendingA = items.filter(x => x.needs_review && x.assignee_pending);
    const pendingD = items.filter(x => x.needs_review && x.deadline_pending);
    console.log('  里程碑=' + milestones.length + ', 待确认负责人=' + pendingA.length + ', 待确认截止日期=' + pendingD.length);
    check('action_items >= 5', items.length >= 5, '实际=' + items.length);
    check('里程碑≥1（v2.0验收/上线', milestones.length >= 1, '实际=' + milestones.length + JSON.stringify(milestones.map(m => ({ t: (m.title || '').slice(0, 25), is_ms: m.is_milestone, ms_conf: m.milestone_confidence)));
    milestones.forEach(m => console.log('    ⭐ ' + (m.title || '').slice(0, 40) + ' | is_ms=' + m.is_milestone + ' | ms_note=' + (m.milestone_note || '无'));

    console.log('\n=== Step 6: workbench/stats ===');
    const ws = await api('GET', '/api/v1/action-items/workbench/stats');
    const wsd = ws.data && ws.data.data ? ws.data.data : ws.data;
    console.log(' ', JSON.stringify(wsd, null, 4));
    check('pending_review 类型', typeof wsd.pending_review === 'number');
    check('pending_review > 0', wsd.pending_review > 0);
    check('today_extracted >= 0', typeof wsd.today_extracted !== undefined);
    check('pending_milestone >= 1', wsd.pending_milestone >= 1, '实际=' + wsd.pending_milestone);

    console.log('\n=== Step 7: review-queue (/workbench/queue) ===');
    const q = await api('GET', '/api/v1/action-items/workbench/queue?limit=10');
    const qitems = q.data && q.data.data ? (q.data.data.items || q.data.data) : (q.data.items || q.data || []);
    const actualQ = Array.isArray(qitems) ? qitems : [];
    console.log('  待复核队列=' + actualQ.length + '条:');
    actualQ.slice(0, 3).forEach(r => console.log('    - ' + (r.title || '').slice(0, 25) + '... | pending=' + r.pending_fields));
    check('review队列长度>=3', actualQ.length >= 3);

    console.log();
    if (!FAILED) {
      console.log('======  HTTP END-TO-END 全部通过  ======\n');
      process.exit(0);
    } else {
      console.error('====== 部分失败 ======\n');
      process.exit(1);
    }
  } catch (e) {
    console.error('\n EXCEPTION:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
