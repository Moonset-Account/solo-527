/* =================== Dashboard =================== */
async function renderDashboard() {
  const [stats, wbStats, queueStats] = await Promise.all([
    api('/action-items/stats').then(r => r.data || {}),
    api('/action-items/workbench/stats').then(r => r.data || {}),
    api('/mlops/queue/stats').then(r => r.data || {}),
  ]);
  const pendingCount = (stats.reviewTasks && stats.reviewTasks.pending) || 0;
  const pe = document.getElementById('pendingCount');
  if (pe) { pe.textContent = pendingCount; pe.style.display = pendingCount > 0 ? '' : 'none'; }
  const mTotal = (stats.meetings && stats.meetings.total) || 0;
  const mEx = (stats.meetings && stats.meetings.extracted) || 0;
  const mIm = (stats.meetings && stats.meetings.imported) || 0;
  const aTotal = (stats.actionItems && stats.actionItems.total) || 0;
  const aMs = (stats.actionItems && stats.actionItems.milestones) || 0;
  const aNr = (stats.actionItems && stats.actionItems.needsReview) || 0;
  const aPA = (stats.actionItems && stats.actionItems.pendingAssignee) || 0;
  const aPD = (stats.actionItems && stats.actionItems.pendingDeadline) || 0;
  const rRs = (stats.reviewTasks && stats.reviewTasks.resolved) || 0;
  const wPr = wbStats.pending_review || 0;
  let qHtml = '';
  if (queueStats && Object.keys(queueStats).length) {
    qHtml = Object.entries(queueStats).map(([name, s]) =>
      '<div class="queue-stat"><div class="queue-name">' + name + '</div>' +
      '<div class="queue-counts">' +
      '<div class="queue-count"><span class="lbl">等</span><span class="num" style="color:#F59E0B">' + s.waiting + '</span></div>' +
      '<div class="queue-count"><span class="lbl">跑</span><span class="num" style="color:#3B82F6">' + s.active + '</span></div>' +
      '<div class="queue-count"><span class="lbl">成</span><span class="num" style="color:#10B981">' + s.completed + '</span></div>' +
      '<div class="queue-count"><span class="lbl">败</span><span class="num" style="color:#EF4444">' + s.failed + '</span></div>' +
      '</div></div>'
    ).join('');
  } else {
    qHtml = '<div style="color:#64748B;text-align:center;padding:20px">暂无队列数据（需Redis）</div>';
  }

  document.getElementById('content').innerHTML =
    '<div class="stats-grid">' +
      '<div class="stat-card info"><div class="stat-label">会议总数</div><div class="stat-value">' + mTotal + '</div>' +
      '<div class="stat-meta"><span class="stat-badge" style="background:#D1FAE5;color:#065F46">已抽取 ' + mEx + '</span>' +
      '<span class="text-muted">待处理 ' + mIm + '</span></div></div>' +
      '<div class="stat-card"><div class="stat-label">行动项总数</div><div class="stat-value">' + aTotal + '</div>' +
      '<div class="stat-meta"><span class="stat-badge" style="background:#DBEAFE;color:#1E40AF">里程碑 ' + aMs + '</span>' +
      '<span class="text-muted">需复核 ' + aNr + '</span></div></div>' +
      '<div class="stat-card warning"><div class="stat-label">待确认负责人</div><div class="stat-value">' + aPA + '</div>' +
      '<div class="stat-meta"><span class="text-muted">待确认截止 ' + aPD + '</span></div></div>' +
      '<div class="stat-card success"><div class="stat-label">已解决复核项</div><div class="stat-value">' + rRs + '</div>' +
      '<div class="stat-meta"><span class="stat-badge" style="background:#FEF3C7;color:#92400E">待处理 ' + pendingCount + '</span></div></div>' +
    '</div>' +
    '<div class="grid-2 mb-6">' +
      '<div class="card"><div class="card-header"><div class="card-title">快速入口</div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">' +
      '<button class="btn btn-lg btn-primary" style="justify-content:flex-start;padding:14px 18px" onclick="showImportModal()">导入新转写</button>' +
      '<button class="btn btn-lg" style="justify-content:flex-start;padding:14px 18px" onclick="goTo(\'workbench\')">处理待确认项 <span class="badge badge-pending" style="margin-left:auto">' + wPr + '</span></button>' +
      '<button class="btn btn-lg" style="justify-content:flex-start;padding:14px 18px" onclick="goTo(\'actions\')">查看全部行动项</button>' +
      '<button class="btn btn-lg" style="justify-content:flex-start;padding:14px 18px" onclick="goTo(\'meetings\')">会议列表</button>' +
      '<button class="btn btn-lg" style="justify-content:flex-start;padding:14px 18px" onclick="goTo(\'samples\')">样本验证</button>' +
      '<button class="btn btn-lg" style="justify-content:flex-start;padding:14px 18px" onclick="goTo(\'models\')">模型管理</button>' +
      '</div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title">任务队列状态</div>' +
      '<button class="btn btn-sm btn-ghost" onclick="renderDashboard()">刷新</button></div>' +
      '<div class="monitor-panel">' + qHtml + '</div></div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-header"><div class="card-title">需要复核的行动项</div>' +
      '<button class="btn btn-sm" onclick="goTo(\'workbench\')">全部查看</button></div><div id="dashReview"></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title">里程碑 / 高优任务</div>' +
      '<button class="btn btn-sm" onclick="goTo(\'actions\')">全部查看</button></div><div id="dashMilestones"></div></div>' +
    '</div>';

  const qResp = await api('/action-items/workbench/queue?limit=5');
  const items = (qResp.data && qResp.data.items) || [];
  document.getElementById('dashReview').innerHTML = items.length
    ? items.slice(0, 5).map(it => renderActionCard(it, true)).join('')
    : emptyState('success', '太棒了', '所有项都已处理完毕');

  const msResp = await api('/action-items?is_milestone=true&limit=6');
  const msItems = (msResp.data && msResp.data.items) || [];
  document.getElementById('dashMilestones').innerHTML = msItems.length
    ? msItems.map(it => renderActionCard(it, true)).join('')
    : emptyState('info', '暂无里程碑', '导入会议转写后将自动识别');
}

/* =================== Import Modal =================== */
function showImportModal() {
  const today = new Date().toISOString().slice(0, 10);
  modal('<div class="modal wide">' +
    '<div class="modal-header"><div class="modal-title">导入会议转写</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
      '<div class="tabs">' +
      '<div class="tab active" data-it="text" onclick="swIt(\'text\')">粘贴文本</div>' +
      '<div class="tab" data-it="file" onclick="swIt(\'file\')">上传文件</div>' +
      '</div>' +
      '<div id="it-text">' +
        '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">会议标题 *</label><input id="i-title" placeholder="如：产品研发周会"></div>' +
        '<div class="form-group"><label class="form-label">项目名称</label><input id="i-proj" placeholder="如：电商平台 v2.0"></div>' +
        '<div class="form-group"><label class="form-label">会议日期</label><input type="date" id="i-date" value="' + today + '"></div>' +
        '</div>' +
        '<div class="form-group mb-3"><label class="form-label">转写格式</label>' +
        '<select id="i-fmt">' +
        '<option value="auto">自动识别</option>' +
        '<option value="speaker-tagged">发言人标注 (发言人：内容)</option>' +
        '<option value="plain">纯文本</option>' +
        '<option value="vtt">VTT字幕</option>' +
        '<option value="srt">SRT字幕</option>' +
        '</select></div>' +
        '<div class="form-group"><label class="form-label">转写内容 *</label>' +
        '<textarea id="i-body" style="min-height:240px" placeholder="[发言人1] 内容\n[发言人2] 内容"></textarea></div>' +
      '</div>' +
      '<div id="it-file" style="display:none">' +
        '<div class="upload-zone" id="uz">' +
        '<div class="upload-zone-icon">F</div>' +
        '<div class="upload-zone-title">点击选择或拖拽文件</div>' +
        '<div class="upload-zone-sub">支持 .txt .vtt .srt，最大 50MB</div>' +
        '<input type="file" id="fi" style="display:none" accept=".txt,.vtt,.srt">' +
        '</div>' +
        '<div id="fi-info" style="margin-top:16px;display:none">' +
        '<div class="card" style="padding:14px"><strong id="fi-name"></strong><div class="text-sm text-secondary mt-1" id="fi-size"></div></div>' +
        '<div class="form-row mt-3">' +
        '<div class="form-group"><label class="form-label">标题</label><input id="if-title"></div>' +
        '<div class="form-group"><label class="form-label">项目</label><input id="if-proj"></div>' +
        '<div class="form-group"><label class="form-label">日期</label><input type="date" id="if-date" value="' + today + '"></div>' +
        '</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button>' +
    '<button class="btn btn-primary" onclick="submitImport()">开始导入</button></div></div>');
  setTimeout(bindUpload, 80);
}
function swIt(t) {
  document.querySelectorAll('[data-it]').forEach(e => e.classList.toggle('active', e.dataset.it === t));
  document.getElementById('it-text').style.display = t === 'text' ? '' : 'none';
  document.getElementById('it-file').style.display = t === 'file' ? '' : 'none';
}
let _file = null;
function bindUpload() {
  const uz = document.getElementById('uz'); if (!uz) return;
  const fi = document.getElementById('fi');
  uz.onclick = () => fi.click();
  uz.ondragover = e => { e.preventDefault(); uz.classList.add('dragover'); };
  uz.ondragleave = () => uz.classList.remove('dragover');
  uz.ondrop = e => { e.preventDefault(); uz.classList.remove('dragover'); if (e.dataTransfer.files[0]) doFile(e.dataTransfer.files[0]); };
  fi.onchange = e => { if (e.target.files[0]) doFile(e.target.files[0]); };
}
function doFile(f) {
  _file = f;
  document.getElementById('fi-info').style.display = '';
  document.getElementById('fi-name').textContent = f.name;
  document.getElementById('fi-size').textContent = (f.size / 1024).toFixed(1) + ' KB';
  document.getElementById('if-title').value = f.name.replace(/\.[^.]+$/, '');
}
async function submitImport() {
  const useFile = document.getElementById('it-file').style.display !== 'none';
  if (useFile) {
    if (!_file) { toast('请选择文件', 'warning'); return; }
    const fd = new FormData();
    fd.append('file', _file);
    fd.append('title', document.getElementById('if-title').value || _file.name);
    fd.append('project_name', document.getElementById('if-proj').value || '');
    fd.append('meeting_date', document.getElementById('if-date').value);
    fd.append('operator', 'web');
    const res = await fetch(API + '/meetings/import', { method: 'POST', body: fd });
    const r = await res.json();
    if (r.code === 0) { toast('导入成功'); closeModal(); _file = null; goTo('meetings'); }
    else toast(r.message || '失败', 'error');
  } else {
    const title = document.getElementById('i-title').value.trim();
    const body = document.getElementById('i-body').value.trim();
    if (!title || !body) { toast('请填写标题和内容', 'warning'); return; }
    const r = await api('/meetings/import', { method: 'POST', body: {
      title: title, project_name: document.getElementById('i-proj').value || null,
      meeting_date: document.getElementById('i-date').value,
      format: document.getElementById('i-fmt').value, content: body, operator: 'web',
    }});
    if (r.code === 0) { toast('导入成功'); closeModal(); goTo('meetings'); }
    else toast(r.message || '失败', 'error');
  }
}

/* =================== Meetings =================== */
async function renderMeetings() {
  document.getElementById('content').innerHTML =
    '<div class="mb-4 flex gap-2 items-center flex-wrap justify-between">' +
    '<div class="flex gap-2 items-center flex-wrap">' +
    '<input type="text" id="mk" placeholder="搜索标题或内容..." style="width:280px" onkeydown="if(event.key===\'Enter\')doSearchM()">' +
    '<select id="ms" onchange="doSearchM()">' +
    '<option value="">全部状态</option><option value="imported">已导入</option>' +
    '<option value="parsed">已解析</option><option value="extracted">已抽取</option>' +
    '<option value="extract_failed">抽取失败</option>' +
    '</select>' +
    '<button class="btn btn-primary" onclick="showImportModal()">导入转写</button>' +
    '<button class="btn" onclick="doSearchM()">刷新</button>' +
    '</div></div>' +
    '<div class="card"><div id="m-table"></div></div>';
  doSearchM();
}
async function doSearchM() {
  const kw = document.getElementById('mk') && document.getElementById('mk').value || '';
  const st = document.getElementById('ms') && document.getElementById('ms').value || '';
  let url = '/meetings?limit=50';
  if (kw) url += '&keyword=' + encodeURIComponent(kw);
  if (st) url += '&status=' + st;
  const r = await api(url);
  const items = (r.data && r.data.items) || [];
  let rows = '';
  if (items.length === 0) {
    rows = '<tr><td colspan="6" style="text-align:center;padding:60px;color:var(--text-muted)">暂无会议<br><button class="btn btn-primary mt-3" onclick="showImportModal()">立即导入</button></td></tr>';
  } else {
    rows = items.map(m => '<tr>' +
      '<td><strong>' + escapeHtml(m.title) + '</strong></td>' +
      '<td>' + escapeHtml(m.project_name || '-') + '</td>' +
      '<td>' + fmtDateShort(m.meeting_date) + '</td>' +
      '<td>' + statusBadge(m.status) + '</td>' +
      '<td class="text-muted text-sm">' + fmtDate(m.created_at) + '</td>' +
      '<td>' +
      '<button class="btn btn-sm" onclick="openM(\'' + m.id + '\')">详情</button> ' +
      '<button class="btn btn-sm" onclick="reExtract(\'' + m.id + '\')">重抽</button> ' +
      '<button class="btn btn-sm btn-danger" onclick="delM(\'' + m.id + '\')">删除</button>' +
      '</td></tr>').join('');
  }
  document.getElementById('m-table').innerHTML =
    '<div class="table-wrap"><table><thead><tr>' +
    '<th>标题</th><th>项目</th><th>日期</th><th>状态</th><th>导入时间</th><th>操作</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}
async function openM(id) {
  const r = await api('/meetings/' + id);
  if (r.code !== 0) return;
  const m = r.data;
  const segs = m.segments || [];
  const acts = m.actionItems || [];
  const tops = m.topics || [];
  const spks = m.speakers || [];
  const actsHtml = acts.length ? acts.map(a => renderActionCard(a)).join('') : emptyState('warn','无行动项','等待抽取任务完成');
  const topsHtml = tops.length ? tops.map(t =>
    '<div class="card mb-3" style="padding:14px"><div style="font-weight:600;margin-bottom:4px">' + escapeHtml(t.title) + '</div>' +
    (t.description ? '<div class="text-sm text-secondary">' + escapeHtml(t.description) + '</div>' : '') +
    '<div class="text-sm text-muted mt-2">段落: ' + (t.start_segment_index ?? '-') + ' ~ ' + (t.end_segment_index ?? '-') + '</div></div>'
  ).join('') : emptyState('empty','无议题','等待解析');
  const segsHtml = '<div class="segments-list">' + segs.map(s =>
    '<div class="segment ' + (s.speaker_name ? 'speaker' : '') + '">' +
    '<div class="segment-meta"><span>#' + s.segment_index + '</span>' +
    (s.speaker_name ? '<span style="color:var(--primary);font-weight:500">' + escapeHtml(s.speaker_name) + '</span>' : '') +
    (s.start_time !== null ? '<span>' + fmtT(s.start_time) + ' - ' + fmtT(s.end_time) + '</span>' : '') +
    '</div><div class="segment-content">' + escapeHtml(s.content) + '</div></div>'
  ).join('') + '</div>';
  const spksHtml = '<div class="table-wrap"><table><thead><tr><th>原始别名</th><th>当前名称</th><th>角色</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
    spks.map(s => '<tr>' +
      '<td>' + escapeHtml(s.raw_alias || '-') + '</td>' +
      '<td><input id="spn-' + s.id + '" value="' + escapeHtml(s.speaker_name || '') + '" style="padding:4px 8px"></td>' +
      '<td><input id="spr-' + s.id + '" value="' + escapeHtml(s.speaker_role || '') + '" style="padding:4px 8px"></td>' +
      '<td>' + (s.confirmed ? '<span class="badge badge-success">已确认</span>' : '<span class="badge badge-warning">待确认</span>') + '</td>' +
      '<td><button class="btn btn-sm btn-success" onclick="confirmSpk(\'' + s.id + '\')">确认</button></td>' +
      '</tr>').join('') + '</tbody></table></div>';
  modal('<div class="modal wide">' +
    '<div class="modal-header"><div>' +
    '<div class="modal-title">' + escapeHtml(m.title) + '</div>' +
    '<div class="text-sm text-secondary mt-1">' + fmtDateShort(m.meeting_date) +
    (m.project_name ? ' | ' + escapeHtml(m.project_name) : '') +
    (m.duration ? ' | ' + m.duration + 'min' : '') + ' ' + statusBadge(m.status) +
    '</div></div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="grid-4 mb-4">' +
    '<div class="stat-card info" style="padding:14px"><div class="stat-label">行动项</div><div class="stat-value" style="font-size:22px">' + acts.length + '</div></div>' +
    '<div class="stat-card warning" style="padding:14px"><div class="stat-label">待复核</div><div class="stat-value" style="font-size:22px">' + acts.filter(a => a.needs_review).length + '</div></div>' +
    '<div class="stat-card success" style="padding:14px"><div class="stat-label">议题</div><div class="stat-value" style="font-size:22px">' + tops.length + '</div></div>' +
    '<div class="stat-card" style="padding:14px"><div class="stat-label">发言人</div><div class="stat-value" style="font-size:22px">' + spks.length + '</div></div>' +
    '</div>' +
    '<div class="tabs">' +
    '<div class="tab active" onclick="swMt(this,\'m-acts\')">行动项 (' + acts.length + ')</div>' +
    '<div class="tab" onclick="swMt(this,\'m-tops\')">议题 (' + tops.length + ')</div>' +
    '<div class="tab" onclick="swMt(this,\'m-segs\')">转写 (' + segs.length + ')</div>' +
    '<div class="tab" onclick="swMt(this,\'m-spks\')">发言人 (' + spks.length + ')</div>' +
    '</div>' +
    '<div id="m-acts">' + actsHtml + '</div>' +
    '<div id="m-tops" style="display:none">' + topsHtml + '</div>' +
    '<div id="m-segs" style="display:none">' + segsHtml + '</div>' +
    '<div id="m-spks" style="display:none">' + spksHtml + '</div>' +
    '</div>' +
    '<div class="modal-footer"><button class="btn" onclick="closeModal()">关闭</button>' +
    '<button class="btn btn-primary" onclick="reExtract(\'' + id + '\');closeModal();toast(\'已重新提交抽取\')">重新抽取</button></div></div>');
}
function swMt(el, id) {
  el.parentNode.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['m-acts','m-tops','m-segs','m-spks'].forEach(x => {
    const e = document.getElementById(x); if (e) e.style.display = x === id ? '' : 'none';
  });
}
async function confirmSpk(id) {
  const n = document.getElementById('spn-' + id).value.trim();
  const rl = document.getElementById('spr-' + id).value.trim();
  if (!n) { toast('名称不能为空', 'warning'); return; }
  const r = await api('/meetings/speakers/' + id + '/confirm', { method: 'POST', body: { name: n, role: rl, operator: 'web' } });
  if (r.code === 0) toast('发言人已确认'); else toast(r.message || '失败', 'error');
}
async function reExtract(id) {
  const r = await api('/meetings/' + id + '/re-extract', { method: 'POST' });
  if (r.code === 0) toast('已重新抽取'); else toast(r.message || '失败', 'error');
  refreshCurrent();
}
async function delM(id) {
  if (!confirm('确定删除该会议及其所有行动项吗？')) return;
  const r = await api('/meetings/' + id + '?operator=web', { method: 'DELETE' });
  if (r.code === 0) { toast('已删除'); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}

/* =================== Actions =================== */
async function renderActions() {
  document.getElementById('content').innerHTML =
    '<div class="mb-4 flex gap-2 flex-wrap justify-between items-center">' +
    '<div class="flex gap-2 flex-wrap items-center">' +
    '<select id="a-nr" onchange="doSearchA()"><option value="">全部复核</option><option value="1">仅待复核</option><option value="0">仅已确认</option></select>' +
    '<select id="a-ms" onchange="doSearchA()"><option value="">全部类型</option><option value="1">仅里程碑</option></select>' +
    '<select id="a-st" onchange="doSearchA()"><option value="">全部状态</option><option value="extracted">已抽取</option><option value="confirmed">已确认</option><option value="synced">已同步</option><option value="completed">已完成</option></select>' +
    '<input id="a-asg" placeholder="负责人" style="width:140px" onkeydown="if(event.key===\'Enter\')doSearchA()">' +
    '<input id="a-pj" placeholder="项目" style="width:140px" onkeydown="if(event.key===\'Enter\')doSearchA()">' +
    '<button class="btn" onclick="doSearchA()">查询</button>' +
    '</div></div><div id="a-list"></div>';
  doSearchA();
}
async function doSearchA() {
  let url = '/action-items?limit=200';
  const nr = document.getElementById('a-nr') && document.getElementById('a-nr').value;
  const ms = document.getElementById('a-ms') && document.getElementById('a-ms').value;
  const st = document.getElementById('a-st') && document.getElementById('a-st').value;
  const asg = document.getElementById('a-asg') && document.getElementById('a-asg').value.trim();
  const pj = document.getElementById('a-pj') && document.getElementById('a-pj').value.trim();
  if (nr) url += '&needs_review=' + nr;
  if (ms) url += '&is_milestone=' + ms;
  if (st) url += '&status=' + st;
  if (asg) url += '&assignee=' + encodeURIComponent(asg);
  if (pj) url += '&project=' + encodeURIComponent(pj);
  const r = await api(url);
  const items = (r.data && r.data.items) || [];
  document.getElementById('a-list').innerHTML = items.length
    ? '<div class="mb-2 text-sm text-secondary">共 ' + items.length + ' 条</div>' + items.map(a => renderActionCard(a)).join('')
    : emptyState('empty', '无匹配项', '调整筛选条件或导入会议');
}

/* =================== Workbench =================== */
let _batchQueue = [];
async function renderWorkbench() {
  const stats = await api('/action-items/workbench/stats').then(r => r.data || {});
  const pe = document.getElementById('pendingCount');
  if (pe) {
    pe.textContent = stats.pending_review || 0;
    pe.style.display = (stats.pending_review || 0) > 0 ? '' : 'none';
  }
  document.getElementById('content').innerHTML =
    '<div class="stats-grid mb-6">' +
    '<div class="stat-card warning"><div class="stat-label">待审核总数</div><div class="stat-value">' + (stats.pending_review || 0) + '</div></div>' +
    '<div class="stat-card"><div class="stat-label">待确认负责人</div><div class="stat-value">' + (stats.pending_assignee || 0) + '</div></div>' +
    '<div class="stat-card info"><div class="stat-label">待确认截止日期</div><div class="stat-value">' + (stats.pending_deadline || 0) + '</div></div>' +
    '<div class="stat-card success"><div class="stat-label">今日处理</div><div class="stat-value">' + (stats.today_confirmed || 0) + '</div></div>' +
    '</div>' +
    '<div class="grid-2">' +
    '<div class="card"><div class="card-header"><div class="card-title">待处理队列 <span class="badge badge-warning">' + (stats.pending_review || 0) + '</span></div>' +
    '<select id="w-ft" onchange="doSearchW()"><option value="">全部字段</option><option value="assignee">负责人</option><option value="deadline">截止日期</option><option value="milestone">里程碑</option></select>' +
    '</div><div id="w-q"></div></div>' +
    '<div class="card"><div class="card-header"><div class="card-title">一致性检查</div>' +
    '<button class="btn btn-sm" onclick="runConsistency()">运行检查</button></div>' +
    '<div id="w-cons">' + emptyState('info', '点击运行', '检测重复负责人、优先级不一致等问题') + '</div></div>' +
    '</div>' +
    '<div class="card mt-4"><div class="card-header"><div class="card-title">批量处理</div>' +
    '<button class="btn btn-success" onclick="batchSubmit()">批量确认选中项</button></div>' +
    '<div id="w-batch-info" class="text-sm text-secondary mb-2">点击上方复选框选择要批量确认的项</div></div>';
  doSearchW();
}
async function doSearchW() {
  const ft = (document.getElementById('w-ft') && document.getElementById('w-ft').value) || '';
  const r = await api('/action-items/workbench/queue?limit=50' + (ft ? '&field_type=' + ft : ''));
  const items = (r.data && r.data.items) || [];
  _batchQueue = [];
  document.getElementById('w-q').innerHTML = items.length
    ? items.map(it => renderWbItem(it)).join('')
    : emptyState('success', '太棒了！', '没有待处理的项');
  updateBatchCount();
}
function renderWbItem(it) {
  const pending = [];
  const pfs = it.pending_fields || [];
  if (it.assignee_pending || pfs.indexOf('assignee') >= 0) pending.push('assignee');
  if (it.deadline_pending || pfs.indexOf('deadline') >= 0) pending.push('deadline');
  if (pfs.indexOf('milestone') >= 0) pending.push('milestone');
  return '<div class="action-item needs-review"><div style="display:flex;gap:10px;align-items:flex-start">' +
    '<input type="checkbox" id="chk-' + it.id + '" style="margin-top:6px" onchange="toggleBatch(\'' + it.id + '\')">' +
    '<div style="flex:1">' +
    '<div class="action-title">' + priorityBadge(it.priority) + ' ' +
    (Number(it.is_milestone) ? '<span class="badge badge-primary">里程碑</span> ' : '') +
    escapeHtml(it.title) + '</div>' +
    '<div class="pending-fields-list">' +
    (pending.indexOf('assignee') >= 0 ? '<span class="chip selected">负责人待确认</span>' : '') +
    (pending.indexOf('deadline') >= 0 ? '<span class="chip selected">截止待确认</span>' : '') +
    (pending.indexOf('milestone') >= 0 ? '<span class="chip selected">里程碑待确认</span>' : '') +
    '</div>' +
    (it.review_reason ? '<div class="review-note"><strong>原因:</strong> ' + escapeHtml(it.review_reason) + '</div>' : '') +
    '<div class="action-meta mb-2">' +
    '<div class="text-muted">会议: ' + escapeHtml(it.meeting_title || '-') + '</div>' +
    '<div class="text-muted">项目: ' + escapeHtml(it.project_name || '-') + '</div>' +
    '</div>' +
    '<div class="action-actions">' +
    (pending.indexOf('assignee') >= 0 ? '<div class="inline-edit"><input type="text" placeholder="输入负责人" id="wasgn-' + it.id + '" style="width:140px"><button class="btn btn-sm btn-success" onclick="confirmAssignee(\'' + it.id + '\')">确认</button></div>' : '') +
    (pending.indexOf('deadline') >= 0 ? '<div class="inline-edit"><input type="date" id="wddl-' + it.id + '"><button class="btn btn-sm btn-success" onclick="confirmDeadline(\'' + it.id + '\')">确认</button></div>' : '') +
    (pending.indexOf('milestone') >= 0 ? '<div class="inline-edit"><button class="btn btn-sm" onclick="setMs(\'' + it.id + '\',1)">标为里程碑</button><button class="btn btn-sm" onclick="setMs(\'' + it.id + '\',0)">标为普通</button></div>' : '') +
    '<button class="btn btn-sm" onclick="editAction(\'' + it.id + '\')">完整编辑</button>' +
    '</div></div></div></div>';
}
function toggleBatch(id) {
  const el = document.getElementById('chk-' + id);
  if (el.checked) { if (_batchQueue.indexOf(id) < 0) _batchQueue.push(id); }
  else _batchQueue = _batchQueue.filter(x => x !== id);
  updateBatchCount();
}
function updateBatchCount() {
  const el = document.getElementById('w-batch-info');
  if (el) el.textContent = '已选择 ' + _batchQueue.length + ' 项';
}
async function setMs(id, v) {
  const r = await api('/action-items/' + id, { method: 'PATCH', body: { is_milestone: v, operator: 'web' } });
  if (r.code === 0) { toast('已更新'); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
async function batchSubmit() {
  if (_batchQueue.length === 0) { toast('请先选择项', 'warning'); return; }
  const updates = [];
  for (const id of _batchQueue) {
    const w = document.getElementById('wasgn-' + id);
    const d = document.getElementById('wddl-' + id);
    if (w && w.value.trim()) updates.push({ action_item_id: id, field_type: 'assignee', value: w.value.trim() });
    if (d && d.value) updates.push({ action_item_id: id, field_type: 'deadline', value: d.value });
  }
  if (updates.length === 0) { toast('请填写要确认的字段值', 'warning'); return; }
  const r = await api('/action-items/workbench/batch-review', { method: 'POST', body: { updates: updates, operator: 'web' } });
  if (r.code === 0) {
    toast('完成 ' + r.data.success_count + '/' + r.data.total);
    _batchQueue = []; refreshCurrent();
  } else toast(r.message || '失败', 'error');
}
async function runConsistency() {
  const r = await api('/action-items/workbench/consistency');
  const data = r.data || {};
  const issues = data.issues || [];
  let html = '<div class="text-sm text-secondary mb-3">检查 ' + data.total_checked + ' 条，发现 ' + (data.issue_count || 0) + ' 个潜在问题</div>';
  if (issues.length === 0) {
    html += emptyState('success', '一致性良好', '未发现明显不一致');
  } else {
    html += issues.map((iss, i) => {
      const sev = iss.severity === 'high' ? '<span class="badge badge-danger">严重</span>' :
        iss.severity === 'medium' ? '<span class="badge badge-warning">中等</span>' : '<span class="badge badge-info">低</span>';
      return '<div class="accordion ' + (i === 0 ? 'open' : '') + '">' +
        '<div class="accordion-header" onclick="this.parentNode.classList.toggle(\'open\')">' +
        '<span>' + sev + ' ' + escapeHtml(iss.type) + ': ' + escapeHtml(iss.description) + '</span>' +
        '<span class="arrow">v</span></div>' +
        '<div class="accordion-body"><pre style="white-space:pre-wrap;color:var(--text-secondary);font-size:12px">' +
        escapeHtml(JSON.stringify(iss, null, 2)) + '</pre></div></div>';
    }).join('');
  }
  document.getElementById('w-cons').innerHTML = html;
}
