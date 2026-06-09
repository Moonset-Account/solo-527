const API = '/api/v1';
let currentPage = 'dashboard';

async function api(path, opts = {}) {
  const body = opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined;
  const hasBody = body !== undefined;
  try {
    const res = await fetch(API + path, {
      headers: hasBody ? { 'Content-Type': 'application/json' } : {},
      ...opts, body,
    });
    return await res.json();
  } catch (e) {
    return { code: -1, message: '网络错误: ' + e.message };
  }
}
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toastRoot').appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
function modal(html) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = html;
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.getElementById('modalRoot').appendChild(backdrop);
  return backdrop;
}
function closeModal() { document.querySelectorAll('.modal-backdrop').forEach(m => m.remove()); }
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtDate(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return String(d); }
}
function fmtDateShort(d) {
  if (!d) return '-';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d); }
}
function pct(n, d = 0) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return (n * 100).toFixed(d) + '%';
}
function fmtT(sec) {
  if (sec === null || sec === undefined) return '';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function statusBadge(s) {
  const map = {
    extracted: ['badge-gray', '已抽取'], confirmed: ['badge-info', '已确认'],
    synced: ['badge-success', '已同步'], pending: ['badge-warning', '待处理'],
    completed: ['badge-success', '已完成'], failed: ['badge-danger', '失败'],
    running: ['badge-info', '处理中'], promoted: ['badge-primary', '已发布'],
    queued: ['badge-warning', '排队中'], imported: ['badge-gray', '已导入'],
    parsed: ['badge-info', '已解析'], extract_failed: ['badge-danger', '抽取失败'],
    active: ['badge-primary', '当前使用'],
  };
  const [c, t] = map[s] || ['badge-gray', s || '未知'];
  return '<span class="badge ' + c + '">' + t + '</span>';
}
function priorityBadge(p) {
  if (p === 'high') return '<span class="badge badge-danger">高</span>';
  if (p === 'low') return '<span class="badge badge-gray">低</span>';
  return '<span class="badge badge-info">中</span>';
}
function goTo(page) { document.querySelector('.nav-item[data-page="' + page + '"]').click(); }
function emptyState(icon, title, sub) {
  const sym = { success: '\u2714', info: '\uD83C\uDFAF', warn: '\u26A0', empty: '\uD83D\uDCE6' }[icon] || '';
  return '<div class="empty-state"><div class="empty-state-icon">' + sym +
    '</div><div class="empty-state-title">' + title +
    '</div><div class="empty-state-sub">' + sub + '</div></div>';
}
function refreshCurrent() { PAGES[currentPage].render(); }

const PAGES = {
  dashboard: { title: '仪表盘', sub: '全局概览与快速入口', render: renderDashboard },
  meetings: { title: '会议管理', sub: '转写导入、解析与抽取状态', render: renderMeetings },
  actions: { title: '行动项', sub: '所有行动项列表与筛选', render: renderActions },
  workbench: { title: '标注工作台', sub: '待确认项批量审核与确认', render: renderWorkbench },
  models: { title: '模型注册', sub: '模型版本、训练、验证指标', render: renderModels },
  samples: { title: '样本验证', sub: '样本集管理、验证与解释', render: renderSamples },
  rollback: { title: '回滚与审计', sub: '变更历史、快照与回滚', render: renderRollback },
  monitor: { title: '监控面板', sub: '任务队列、指标与运行状态', render: renderMonitor },
  'api-docs': { title: 'API 接口文档', sub: '可调用接口与示例', render: renderApiDocs },
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    currentPage = item.dataset.page;
    document.getElementById('pageTitle').textContent = PAGES[currentPage].title;
    document.getElementById('pageSub').textContent = PAGES[currentPage].sub;
    PAGES[currentPage].render();
  });
});

function renderActionCard(item, compact) {
  const isWarn = Number(item.needs_review) === 1;
  const isMs = Number(item.is_milestone) === 1;
  let html = '<div class="action-item ' + (isWarn ? 'needs-review ' : '') + (isMs ? 'milestone' : '') + '">';
  html += '<div class="action-title">';
  if (isMs) html += '<span class="badge badge-primary">里程碑</span> ';
  html += priorityBadge(item.priority) + ' <span>' + escapeHtml(item.title || '(无标题)') + '</span></div>';
  html += '<div class="action-meta">';
  html += '<div class="action-meta-item ' + (item.assignee_pending ? 'pending' : '') + '">';
  html += '<strong>负责人:</strong> ' + (item.assignee ? escapeHtml(item.assignee) : '<em>未指定</em>');
  if (item.assignee_confidence !== undefined && item.assignee) html += ' <span class="text-muted">(' + pct(item.assignee_confidence, 0) + ')</span>';
  if (item.assignee_pending) html += ' 待确认';
  html += '</div>';
  html += '<div class="action-meta-item ' + (item.deadline_pending ? 'pending' : '') + '">';
  html += '<strong>截止:</strong> ' + (item.deadline || '<em>未指定</em>');
  if (item.deadline_confidence !== undefined && item.deadline) html += ' <span class="text-muted">(' + pct(item.deadline_confidence, 0) + ')</span>';
  if (item.deadline_pending) html += ' 待确认';
  html += '</div>';
  html += statusBadge(item.status);
  if (item.project_name) html += ' <div class="action-meta-item text-muted">' + escapeHtml(item.project_name) + '</div>';
  if (item.meeting_title) html += ' <div class="action-meta-item text-muted">' + escapeHtml(item.meeting_title) + '</div>';
  html += '</div>';
  if (item.review_reason) html += '<div class="review-note"><strong>需复核:</strong> ' + escapeHtml(item.review_reason) + '</div>';
  if (!compact && item.description) html += '<div class="action-description">' + escapeHtml(item.description) + '</div>';
  if (!compact) {
    html += '<div class="action-actions">';
    if (item.assignee_pending) html += '<div class="inline-edit"><input type="text" placeholder="输入负责人" id="asgn-' + item.id + '" style="width:130px"><button class="btn btn-sm btn-success" onclick="confirmAssignee(\'' + item.id + '\')">确认</button></div>';
    if (item.deadline_pending) html += '<div class="inline-edit"><input type="date" id="ddl-' + item.id + '"><button class="btn btn-sm btn-success" onclick="confirmDeadline(\'' + item.id + '\')">确认</button></div>';
    html += '<button class="btn btn-sm" onclick="editAction(\'' + item.id + '\')">编辑</button>';
    if (!item.needs_review && item.status !== 'synced') html += '<button class="btn btn-sm btn-primary" onclick="syncAction(\'' + item.id + '\')">同步</button>';
    html += '</div>';
  } else {
    html += '<div class="action-actions" style="margin-top:6px"><button class="btn btn-ghost btn-sm text-secondary" onclick="goTo(\'workbench\')">详情</button></div>';
  }
  return html + '</div>';
}

async function confirmAssignee(id) {
  const v = document.getElementById('asgn-' + id).value.trim();
  if (!v) { toast('请输入负责人', 'warning'); return; }
  const r = await api('/action-items/' + id + '/confirm-assignee', { method: 'POST', body: { assignee: v, operator: 'web' } });
  if (r.code === 0) { toast('负责人已确认'); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
async function confirmDeadline(id) {
  const v = document.getElementById('ddl-' + id).value;
  if (!v) { toast('请选择日期', 'warning'); return; }
  const r = await api('/action-items/' + id + '/confirm-deadline', { method: 'POST', body: { deadline: v, operator: 'web' } });
  if (r.code === 0) { toast('截止日期已确认'); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
async function editAction(id) {
  const r = await api('/action-items/' + id);
  if (r.code !== 0) return;
  const it = r.data;
  const stOpts = ['extracted', 'confirmed', 'synced', 'completed'].map(p =>
    '<option value="' + p + '" ' + (it.status === p ? 'selected' : '') + '>' +
    statusBadge(p).replace(/<[^>]+>/g, '').trim() + '</option>').join('');
  const priOpts = ['high', 'medium', 'low'].map(p =>
    '<option value="' + p + '" ' + (it.priority === p ? 'selected' : '') + '>' +
    (p === 'high' ? '高' : p === 'low' ? '低' : '中') + '</option>').join('');
  modal('<div class="modal"><div class="modal-header"><div class="modal-title">编辑行动项</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div><div class="modal-body">' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">标题</label><input id="e-title" value="' + escapeHtml(it.title || '') + '" style="width:100%"></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">描述</label><textarea id="e-desc" style="width:100%;min-height:80px">' + escapeHtml(it.description || '') + '</textarea></div></div>' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">负责人</label><input id="e-asgn" value="' + escapeHtml(it.assignee || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">截止日期</label><input type="date" id="e-ddl" value="' + (it.deadline || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">优先级</label><select id="e-pri">' + priOpts + '</select></div>' +
    '<div class="form-group"><label class="form-label">状态</label><select id="e-st">' + stOpts + '</select></div>' +
    '</div><div class="form-row">' +
    '<div class="form-group"><label class="form-label">里程碑</label><select id="e-ms"><option value="1" ' + (it.is_milestone == 1 ? 'selected' : '') + '>是</option><option value="0" ' + (it.is_milestone != 1 ? 'selected' : '') + '>否</option></select></div>' +
    '<div class="form-group"><label class="form-label">项目</label><input id="e-pj" value="' + escapeHtml(it.project_name || '') + '"></div>' +
    '</div></div><div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitEdit(\'' + id + '\')">保存</button></div></div>');
}
async function submitEdit(id) {
  const r = await api('/action-items/' + id, { method: 'PATCH', body: {
    title: document.getElementById('e-title').value,
    description: document.getElementById('e-desc').value,
    assignee: document.getElementById('e-asgn').value || null,
    deadline: document.getElementById('e-ddl').value || null,
    priority: document.getElementById('e-pri').value,
    status: document.getElementById('e-st').value,
    is_milestone: parseInt(document.getElementById('e-ms').value),
    project_name: document.getElementById('e-pj').value || null,
    operator: 'web',
  }});
  if (r.code === 0) { toast('已保存'); closeModal(); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
async function syncAction(id) {
  const r = await api('/mlops/sync/action/' + id, { method: 'POST', body: { target_system: 'mock' } });
  if (r.code === 0 && r.data.status === 'success') toast('同步成功: ' + r.data.externalId);
  else toast((r.data && r.data.status) || r.message || '失败', 'error');
}

renderDashboard();
