/* =================== Models =================== */
async function renderModels() {
  const [models, tasks, datasets, activeM, runs] = await Promise.all([
    api('/mlops/models').then(r => (r.data && r.data.items) || []),
    api('/mlops/training-tasks').then(r => (r.data && r.data.items) || []),
    api('/mlops/datasets').then(r => (r.data && r.data.items) || []),
    api('/mlops/models/active/current').then(r => r.data),
    api('/mlops/validation-runs').then(r => (r.data && r.data.items) || []),
  ]);

  let modelsHtml = models.map(m => {
    const ms = m.metrics_summary && typeof m.metrics_summary === 'object' ? m.metrics_summary : {};
    const p = ms.precision || 0, rc = ms.recall || 0, f = ms.f1 || 0;
    const pCls = p >= 0.85 ? 'good' : p >= 0.7 ? 'warn' : 'bad';
    const rCls = rc >= 0.8 ? 'good' : rc >= 0.7 ? 'warn' : 'bad';
    const fCls = f >= 0.8 ? 'good' : f >= 0.7 ? 'warn' : 'bad';
    return '<div class="card">' +
      '<div class="card-header" style="margin-bottom:14px;padding-bottom:10px">' +
      '<div><div class="card-title">' + escapeHtml(m.name) + ' ' +
      (m.is_active ? '<span class="badge badge-primary" style="margin-left:6px">ACTIVE</span>' : '') +
      '</div><div class="text-sm text-muted">v' + escapeHtml(m.version) + ' | ' + escapeHtml(m.provider) + '</div></div></div>' +
      (m.description ? '<div class="text-sm text-secondary mb-3">' + escapeHtml(m.description) + '</div>' : '') +
      (Object.keys(ms).length ? (
        '<div class="metric-row"><div class="metric-name">Precision</div><div class="metric-val ' + pCls + '">' + (p * 100).toFixed(1) + '%</div></div>' +
        '<div class="metric-row"><div class="metric-name">Recall</div><div class="metric-val ' + rCls + '">' + (rc * 100).toFixed(1) + '%</div></div>' +
        '<div class="metric-row"><div class="metric-name">F1</div><div class="metric-val ' + fCls + '">' + (f * 100).toFixed(1) + '%</div></div>'
      ) : '') +
      '<div class="text-sm text-muted mt-2">注册: ' + fmtDate(m.registered_at) +
      (m.promoted_at ? ' | 提升: ' + fmtDate(m.promoted_at) : '') + '</div>' +
      '<div class="mt-3 flex gap-2">' +
      (!m.is_active ? '<button class="btn btn-sm btn-success" onclick="promoteModel(\'' + m.id + '\')">提升为当前</button>' : '') +
      '<button class="btn btn-sm btn-danger" onclick="delModel(\'' + m.id + '\')">删除</button>' +
      '</div></div>';
  }).join('');
  if (!modelsHtml) modelsHtml = emptyState('empty', '无模型', '点击上方按钮注册');

  let tasksHtml = tasks.length === 0 ?
    '<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--text-muted)">无训练任务</td></tr>' :
    tasks.map(t => '<tr>' +
      '<td><strong>' + escapeHtml(t.model_name) + '</strong></td>' +
      '<td>' + statusBadge(t.status) + '</td>' +
      '<td style="width:220px"><div class="progress"><div class="progress-bar" style="width:' + (t.progress || 0) + '%"></div></div>' +
      '<div class="text-sm text-muted mt-1">' + (t.progress || 0) + '%</div></td>' +
      '<td>' + escapeHtml(t.dataset_id || '-') + '</td>' +
      '<td class="text-sm text-muted">' + fmtDate(t.created_at) + '</td>' +
      '<td>' + (t.error_message ? '<span class="text-danger">' + escapeHtml(t.error_message.slice(0, 30)) + '</span>' :
        (t.started_at ? '开始: ' + fmtDate(t.started_at) : '<span class="text-muted">-</span>')) + '</td>' +
      '</tr>').join('');

  let dsHtml = datasets.map(d =>
    '<div class="card"><div class="card-title mb-2">' + escapeHtml(d.name) + '</div>' +
    '<div class="text-sm text-secondary mb-3">' + escapeHtml(d.description || '-') + '</div>' +
    '<div class="metric-row"><div class="metric-name">类型</div><div class="metric-val">' + escapeHtml(d.type) + '</div></div>' +
    '<div class="metric-row"><div class="metric-name">样本数</div><div class="metric-val">' + (d.sample_count || 0) + '</div></div>' +
    '<div class="metric-row"><div class="metric-name">版本</div><div class="metric-val">' + escapeHtml(d.version || '-') + '</div></div>' +
    '<div class="text-sm text-muted mt-2">' + fmtDate(d.created_at) + '</div></div>'
  ).join('');
  if (!dsHtml) dsHtml = emptyState('empty', '无数据集', '点击上方按钮创建');

  let runsHtml = runs.length === 0 ?
    '<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--text-muted)">无验证运行</td></tr>' :
    runs.map(v => '<tr>' +
      '<td class="text-sm text-muted">' + escapeHtml(v.id.slice(0, 8)) + '...</td>' +
      '<td class="text-sm">' + escapeHtml(v.model_id.slice(0, 8)) + '...</td>' +
      '<td class="text-sm">' + escapeHtml(v.dataset_id.slice(0, 8)) + '...</td>' +
      '<td>' + statusBadge(v.status) + '</td>' +
      '<td>' + (v.metrics && v.metrics.overall ?
        '<div style="font-size:12px">P:' + (v.metrics.overall.precision || 0).toFixed(2) +
        ' R:' + (v.metrics.overall.recall || 0).toFixed(2) +
        ' F1:' + (v.metrics.overall.f1 || 0).toFixed(2) + '</div>' :
        '<span class="text-muted">-</span>') + '</td>' +
      '<td class="text-sm text-muted">' + fmtDate(v.created_at) + '</td></tr>').join('');

  document.getElementById('content').innerHTML =
    '<div class="tabs">' +
    '<div class="tab active" onclick="swMt(this,0)">模型注册 (' + models.length + ')</div>' +
    '<div class="tab" onclick="swMt(this,1)">训练任务 (' + tasks.length + ')</div>' +
    '<div class="tab" onclick="swMt(this,2)">数据集 (' + datasets.length + ')</div>' +
    '<div class="tab" onclick="swMt(this,3)">验证运行 (' + runs.length + ')</div>' +
    '</div>' +
    '<div class="mtab" id="mtab-0">' +
    '<div class="mb-4">' +
    '<button class="btn btn-primary" onclick="showRegModel()">注册新模型</button>' +
    (activeM ? '<span class="text-sm text-secondary ml-3">当前活跃模型: <strong>' + escapeHtml(activeM.name) + '@' + escapeHtml(activeM.version) + '</strong></span>' : '') +
    '</div><div class="grid-3">' + modelsHtml + '</div></div>' +

    '<div class="mtab" id="mtab-1" style="display:none">' +
    '<div class="mb-4"><button class="btn btn-primary" onclick="showNewTrain()">新建训练任务</button></div>' +
    '<div class="card"><div class="table-wrap"><table><thead><tr>' +
    '<th>模型</th><th>状态</th><th>进度</th><th>数据集</th><th>创建</th><th>详情</th>' +
    '</tr></thead><tbody>' + tasksHtml + '</tbody></table></div></div></div>' +

    '<div class="mtab" id="mtab-2" style="display:none">' +
    '<div class="mb-4"><button class="btn btn-primary" onclick="showNewDataset()">新建数据集</button></div>' +
    '<div class="grid-4">' + dsHtml + '</div></div>' +

    '<div class="mtab" id="mtab-3" style="display:none">' +
    '<div class="mb-4"><button class="btn btn-primary" onclick="showNewValidation()">新建验证运行</button></div>' +
    '<div class="card"><div class="table-wrap"><table><thead><tr>' +
    '<th>ID</th><th>模型ID</th><th>数据集ID</th><th>状态</th><th>指标</th><th>创建</th>' +
    '</tr></thead><tbody>' + runsHtml + '</tbody></table></div></div></div>';
}
function swMt(el, i) {
  el.parentNode.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  for (let j = 0; j < 4; j++) {
    const e = document.getElementById('mtab-' + j);
    if (e) e.style.display = j === i ? '' : 'none';
  }
}
function showRegModel() {
  modal('<div class="modal"><div class="modal-header"><div class="modal-title">注册模型</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">名称 *</label><input id="rm-name" placeholder="如 gpt-4o"></div>' +
    '<div class="form-group"><label class="form-label">版本 *</label><input id="rm-ver" value="1.0.0"></div>' +
    '<div class="form-group"><label class="form-label">供应商</label>' +
    '<select id="rm-prov"><option>openai</option><option>custom</option><option>azure</option></select></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">描述</label><input id="rm-desc" style="width:100%"></div></div>' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">Precision (0-1)</label><input type="number" step="0.01" id="rm-p" value="0.85"></div>' +
    '<div class="form-group"><label class="form-label">Recall (0-1)</label><input type="number" step="0.01" id="rm-r" value="0.80"></div>' +
    '<div class="form-group"><label class="form-label">F1 (0-1)</label><input type="number" step="0.01" id="rm-f" value="0.82"></div>' +
    '</div></div>' +
    '<div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitRegModel()">注册</button></div></div>');
}
async function submitRegModel() {
  const body = {
    name: document.getElementById('rm-name').value.trim(),
    version: document.getElementById('rm-ver').value.trim(),
    provider: document.getElementById('rm-prov').value,
    description: document.getElementById('rm-desc').value,
    metrics: {
      precision: parseFloat(document.getElementById('rm-p').value || 0),
      recall: parseFloat(document.getElementById('rm-r').value || 0),
      f1: parseFloat(document.getElementById('rm-f').value || 0),
    }, operator: 'web',
  };
  if (!body.name || !body.version) { toast('名称和版本必填', 'warning'); return; }
  const r = await api('/mlops/models/register', { method: 'POST', body: body });
  if (r.code === 0) { toast('注册成功'); closeModal(); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
async function promoteModel(id) {
  const r = await api('/mlops/models/' + id + '/promote', { method: 'POST', body: { operator: 'web' } });
  if (r.code === 0) toast('已提升为当前模型'); else toast(r.message || '失败', 'error');
  refreshCurrent();
}
async function delModel(id) {
  if (!confirm('确定删除？')) return;
  const r = await api('/mlops/models/' + id + '?operator=web', { method: 'DELETE' });
  if (r.code === 0) toast('已删除'); else toast(r.message || '失败', 'error');
  refreshCurrent();
}
function showNewTrain() {
  modal('<div class="modal"><div class="modal-header"><div class="modal-title">新建训练任务</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">模型名称 *</label><input id="nt-name" placeholder="如 gpt-4o-finetune-v2"></div>' +
    '<div class="form-group"><label class="form-label">数据集ID</label><input id="nt-ds"></div></div>' +
    '<div class="form-group"><label class="form-label">超参数 (JSON)</label>' +
    '<textarea id="nt-hp" style="min-height:100px;font-family:monospace">{"epochs": 3, "lr": 0.0001, "batch_size": 8}</textarea></div>' +
    '</div><div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitTrain()">提交</button></div></div>');
}
async function submitTrain() {
  let hp = {}; try { hp = JSON.parse(document.getElementById('nt-hp').value || '{}'); }
  catch { toast('超参数JSON格式错误', 'error'); return; }
  const r = await api('/mlops/training-tasks', { method: 'POST', body: {
    model_name: document.getElementById('nt-name').value.trim(),
    dataset_id: document.getElementById('nt-ds').value || null,
    hyperparams: hp, operator: 'web',
  }});
  if (r.code === 0) { toast('已加入队列'); closeModal(); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
function showNewDataset() {
  modal('<div class="modal"><div class="modal-header"><div class="modal-title">新建数据集</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">名称 *</label><input id="nd-name"></div>' +
    '<div class="form-group"><label class="form-label">类型 *</label>' +
    '<select id="nd-type"><option>training</option><option>validation</option><option>test</option></select></div>' +
    '<div class="form-group"><label class="form-label">样本数</label><input type="number" id="nd-sc" value="0"></div>' +
    '<div class="form-group"><label class="form-label">版本</label><input id="nd-ver" value="1.0"></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">描述</label><input id="nd-desc" style="width:100%"></div></div>' +
    '</div><div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitDataset()">创建</button></div></div>');
}
async function submitDataset() {
  const r = await api('/mlops/datasets', { method: 'POST', body: {
    name: document.getElementById('nd-name').value.trim(),
    type: document.getElementById('nd-type').value,
    sample_count: parseInt(document.getElementById('nd-sc').value || 0),
    description: document.getElementById('nd-desc').value || null,
    version: document.getElementById('nd-ver').value || '1.0',
  }});
  if (r.code === 0) { toast('已创建'); closeModal(); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
function showNewValidation() {
  modal('<div class="modal"><div class="modal-header"><div class="modal-title">新建验证运行</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">模型ID *</label><input id="nv-mi"></div>' +
    '<div class="form-group"><label class="form-label">数据集ID *</label><input id="nv-di"></div></div>' +
    '<div class="form-group"><label class="form-label">样本ID列表 (JSON数组，可空)</label>' +
    '<textarea id="nv-si" style="min-height:80px;font-family:monospace">[]</textarea></div>' +
    '</div><div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitValidation()">提交</button></div></div>');
}
async function submitValidation() {
  let sids = []; try { sids = JSON.parse(document.getElementById('nv-si').value || '[]'); }
  catch { toast('样本ID JSON格式错误', 'error'); return; }
  const mi = document.getElementById('nv-mi').value.trim();
  const di = document.getElementById('nv-di').value.trim();
  if (!mi || !di) { toast('模型ID和数据集ID必填', 'warning'); return; }
  const r = await api('/mlops/validation-runs', { method: 'POST', body: {
    model_id: mi, dataset_id: di, sample_ids: sids,
  }});
  if (r.code === 0) { toast('已提交'); closeModal(); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}

/* =================== Samples =================== */
async function renderSamples() {
  const r = await api('/mlops/samples?limit=100');
  const items = (r.data && r.data.items) || [];
  let rows = items.length === 0 ?
    '<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-muted)">暂无样本</td></tr>' :
    items.map(s => '<tr>' +
      '<td class="text-sm text-muted">' + escapeHtml(s.id ? s.id.slice(0, 8) + '...' : '-') + '</td>' +
      '<td><strong>' + escapeHtml(s.meeting_title || '-') + '</strong></td>' +
      '<td>' + escapeHtml(s.project_name || '-') + '</td>' +
      '<td>' + (s.action_item_count || 0) + '</td>' +
      '<td>' + ((s.tags || []).map(t => '<span class="chip" style="margin:2px">' + escapeHtml(t) + '</span>').join('') || '<span class="text-muted">-</span>') + '</td>' +
      '<td class="text-sm text-muted">' + fmtDate(s.created_at) + '</td>' +
      '<td>' +
      '<button class="btn btn-sm" onclick="explainSample(\'' + s.id + '\')">解释</button> ' +
      '<button class="btn btn-sm" onclick="editSample(\'' + s.id + '\')">编辑</button> ' +
      '<button class="btn btn-sm btn-danger" onclick="delSample(\'' + s.id + '\')">删除</button>' +
      '</td></tr>').join('');
  document.getElementById('content').innerHTML =
    '<div class="mb-4 flex gap-2 flex-wrap items-center">' +
    '<button class="btn btn-primary" onclick="showNewSample()">新建样本</button>' +
    '<button class="btn" onclick="showBatchImport()">批量导入</button>' +
    '<button class="btn btn-success" onclick="showValidateDialog()">运行验证</button>' +
    '<button class="btn" onclick="refreshCurrent()">刷新</button>' +
    '<span class="text-sm text-secondary ml-3">共 ' + items.length + ' 个样本</span>' +
    '</div>' +
    '<div class="card"><div class="table-wrap"><table><thead><tr>' +
    '<th>ID</th><th>会议标题</th><th>项目</th><th>行动项数</th><th>标签</th><th>创建</th><th>操作</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}
function showNewSample() {
  modal('<div class="modal wide"><div class="modal-header"><div class="modal-title">新建样本</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">会议标题</label><input id="ns-title"></div>' +
    '<div class="form-group"><label class="form-label">项目名称</label><input id="ns-proj"></div>' +
    '<div class="form-group"><label class="form-label">会议日期</label><input type="date" id="ns-date" value="' + new Date().toISOString().slice(0, 10) + '"></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">标签 (逗号分隔)</label><input id="ns-tags" style="width:100%" placeholder="如: seed, basic"></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">转写文本 *</label>' +
    '<textarea id="ns-trans" style="width:100%;min-height:140px" placeholder="输入完整转写内容"></textarea></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">期望行动项 (JSON数组)</label>' +
    '<textarea id="ns-exp" style="width:100%;min-height:140px;font-family:monospace" placeholder=\'[{"title":"任务标题","assignee":"张三","deadline":"2026-06-15","priority":"high","is_milestone":false}]\'></textarea></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">备注</label><textarea id="ns-notes" style="width:100%;min-height:60px"></textarea></div></div>' +
    '</div><div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitNewSample()">创建</button></div></div>');
}
async function submitNewSample() {
  let expItems = [];
  try { expItems = JSON.parse(document.getElementById('ns-exp').value || '[]'); }
  catch { toast('期望行动项JSON格式错误', 'error'); return; }
  const trans = document.getElementById('ns-trans').value.trim();
  if (!trans) { toast('转写文本必填', 'warning'); return; }
  const body = {
    meeting_title: document.getElementById('ns-title').value.trim(),
    project_name: document.getElementById('ns-proj').value.trim() || null,
    meeting_date: document.getElementById('ns-date').value,
    transcript: trans,
    expected_action_items: expItems,
    tags: document.getElementById('ns-tags').value.split(',').map(s => s.trim()).filter(Boolean),
    notes: document.getElementById('ns-notes').value || null,
  };
  const r = await api('/mlops/samples', { method: 'POST', body: body });
  if (r.code === 0) { toast('已创建'); closeModal(); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
async function editSample(id) {
  const r = await api('/mlops/samples/' + id);
  if (r.code !== 0) return;
  const s = r.data;
  modal('<div class="modal wide"><div class="modal-header"><div class="modal-title">编辑样本</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">会议标题</label><input id="es-title" value="' + escapeHtml(s.meeting_title || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">项目</label><input id="es-proj" value="' + escapeHtml(s.project_name || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">日期</label><input type="date" id="es-date" value="' + (s.meeting_date || new Date().toISOString().slice(0, 10)) + '"></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">转写文本</label>' +
    '<textarea id="es-trans" style="width:100%;min-height:140px">' + escapeHtml(s.transcript || '') + '</textarea></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">期望行动项 (JSON数组)</label>' +
    '<textarea id="es-exp" style="width:100%;min-height:160px;font-family:monospace">' +
    escapeHtml(JSON.stringify(s.expected_action_items || [], null, 2)) + '</textarea></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">备注</label><textarea id="es-notes" style="width:100%;min-height:60px">' + escapeHtml(s.notes || '') + '</textarea></div></div>' +
    '</div><div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitEditSample(\'' + id + '\')">保存</button></div></div>');
}
async function submitEditSample(id) {
  let exp = []; try { exp = JSON.parse(document.getElementById('es-exp').value || '[]'); }
  catch { toast('JSON格式错误', 'error'); return; }
  const r = await api('/mlops/samples/' + id, { method: 'PATCH', body: {
    meeting_title: document.getElementById('es-title').value,
    project_name: document.getElementById('es-proj').value,
    meeting_date: document.getElementById('es-date').value,
    transcript: document.getElementById('es-trans').value,
    expected_action_items: exp,
    notes: document.getElementById('es-notes').value,
  }});
  if (r.code === 0) { toast('已保存'); closeModal(); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
async function delSample(id) {
  if (!confirm('确定删除？')) return;
  const r = await api('/mlops/samples/' + id, { method: 'DELETE' });
  if (r.code === 0) toast('已删除'); else toast(r.message || '失败', 'error');
  refreshCurrent();
}
function showBatchImport() {
  modal('<div class="modal"><div class="modal-header"><div class="modal-title">批量导入样本</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="form-group mb-3"><label class="form-label">标签</label><input id="bi-tag" value="batch"></div>' +
    '<div class="form-group"><label class="form-label">样本 JSON 数组</label>' +
    '<textarea id="bi-body" style="min-height:240px;font-family:monospace" placeholder=\'[{"meeting_title":"...","transcript":"...","expected_action_items":[...]},...]\'></textarea></div>' +
    '</div><div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitBatchImport()">导入</button></div></div>');
}
async function submitBatchImport() {
  let samples = []; try { samples = JSON.parse(document.getElementById('bi-body').value || '[]'); }
  catch { toast('JSON格式错误', 'error'); return; }
  if (!Array.isArray(samples)) { toast('必须是JSON数组', 'warning'); return; }
  const r = await api('/mlops/samples/import', { method: 'POST', body: {
    samples: samples, tag: document.getElementById('bi-tag').value || 'imported',
  }});
  if (r.code === 0) {
    const c = (r.data.results || []).filter(x => x.success).length;
    toast('成功导入 ' + c + '/' + r.data.total);
    closeModal(); refreshCurrent();
  } else toast(r.message || '失败', 'error');
}
function showValidateDialog() {
  modal('<div class="modal"><div class="modal-header"><div class="modal-title">运行样本验证</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">模型ID *</label><input id="v-mi"></div>' +
    '<div class="form-group"><label class="form-label">数据集ID *</label><input id="v-di"></div></div>' +
    '<div class="form-group"><label class="form-label">样本ID (逗号分隔，可空)</label><input id="v-sids"></div>' +
    '<div class="text-sm text-secondary mt-2">将使用指定模型对样本进行推理，并与期望结果对比计算 P/R/F1 指标</div>' +
    '</div><div class="modal-footer"><button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitValidate()">运行</button></div></div>');
}
async function submitValidate() {
  const mi = document.getElementById('v-mi').value.trim();
  const di = document.getElementById('v-di').value.trim();
  const sidsRaw = document.getElementById('v-sids').value.trim();
  const sids = sidsRaw ? sidsRaw.split(',').map(s => s.trim()) : [];
  if (!mi || !di) { toast('模型ID和数据集ID必填', 'warning'); return; }
  toast('已提交，请稍候...', 'info');
  const r = await api('/mlops/samples/validate', { method: 'POST', body: {
    model_id: mi, dataset_id: di, sample_ids: sids,
  }});
  if (r.code === 0) {
    const m = (r.data.metrics && r.data.metrics.overall) || {};
    toast('验证完成: P=' + (m.precision || 0).toFixed(2) + ' R=' + (m.recall || 0).toFixed(2) + ' F1=' + (m.f1 || 0).toFixed(2));
    closeModal();
  } else toast(r.message || '失败', 'error');
}
async function explainSample(id) {
  toast('正在生成解释...', 'info');
  const r = await api('/mlops/samples/' + id + '/explain');
  if (r.code !== 0) { toast(r.message || '失败', 'error'); return; }
  const d = r.data;
  const s = d.summary || {};
  let matchedHtml = (d.matched_items || []).map((m, i) => {
    const diffs = (m.field_differences || []).map(df =>
      '<div class="metric-row"><div class="metric-name">' + escapeHtml(df.field) +
      '</div><div class="metric-val ' + (df.correct ? 'good' : 'bad') + '">' +
      escapeHtml(String(df.predicted || '(null)') + ' / ' + String(df.expected || '(null)')) +
      (df.predicted_pending ? ' [PENDING]' : '') + '</div></div>'
    ).join('');
    return '<div class="accordion ' + (i === 0 ? 'open' : '') + '">' +
      '<div class="accordion-header" onclick="this.parentNode.classList.toggle(\'open\')">' +
      '<span>' + (m.all_fields_match ? '<span class="badge badge-success">全匹配</span>' : '<span class="badge badge-warning">部分匹配</span>') +
      ' 相似度 ' + (m.title_similarity || 0).toFixed(2) +
      ': ' + escapeHtml(m.predicted && m.predicted.title || '(无)') + '</span>' +
      '<span class="arrow">v</span></div>' +
      '<div class="accordion-body">' + diffs +
      '<div class="mt-3 text-sm text-muted"><strong>预测:</strong> ' + escapeHtml(JSON.stringify(m.predicted || {})) + '</div>' +
      '<div class="mt-2 text-sm text-muted"><strong>期望:</strong> ' + escapeHtml(JSON.stringify(m.expected || {})) + '</div>' +
      '</div></div>';
  }).join('') || '<div class="text-muted">无匹配项</div>';

  let missedHtml = (d.missed_items || []).map(m =>
    '<div class="card mb-3" style="padding:12px">' +
    '<div class="card-title mb-2">' + escapeHtml((m.expected && m.expected.title) || '(无)') + '</div>' +
    '<div class="text-sm text-secondary">检测建议: ' + escapeHtml((m.detection_hint || []).join('; ') || '-') + '</div></div>'
  ).join('') || '<div class="text-muted">无遗漏</div>';

  let fpHtml = (d.false_positive_items || []).map(p =>
    '<div class="card mb-3" style="padding:12px">' +
    '<div class="card-title mb-2">' + escapeHtml((p.predicted && p.predicted.title) || '(无)') + '</div>' +
    '<div class="text-sm text-secondary">复核建议: ' + escapeHtml((p.review_suggestion || []).join('; ') || '-') + '</div></div>'
  ).join('') || '<div class="text-muted">无误报</div>';

  modal('<div class="modal wide"><div class="modal-header"><div class="modal-title">样本解释 - ' + escapeHtml((d.sample && d.sample.meeting_title) || id) +
    '</div><button class="btn btn-ghost" onclick="closeModal()">X</button></div>' +
    '<div class="modal-body">' +
    '<div class="grid-4 mb-4">' +
    '<div class="stat-card info" style="padding:12px"><div class="stat-label">期望项</div><div class="stat-value" style="font-size:20px">' + (s.expected_count || 0) + '</div></div>' +
    '<div class="stat-card success" style="padding:12px"><div class="stat-label">匹配</div><div class="stat-value" style="font-size:20px">' + (s.matched || 0) + '</div></div>' +
    '<div class="stat-card warning" style="padding:12px"><div class="stat-label">遗漏</div><div class="stat-value" style="font-size:20px">' + (s.missed || 0) + '</div></div>' +
    '<div class="stat-card danger" style="padding:12px"><div class="stat-label">误报</div><div class="stat-value" style="font-size:20px">' + (s.false_positives || 0) + '</div></div>' +
    '</div>' +
    '<div class="text-sm text-secondary mb-4">完美匹配: ' + (s.perfectly_matched || 0) + ' / ' + (s.matched || 0) + '</div>' +

    '<div class="tabs">' +
    '<div class="tab active" onclick="swExp(this,0)">匹配详情</div>' +
    '<div class="tab" onclick="swExp(this,1)">遗漏项 (' + (s.missed || 0) + ')</div>' +
    '<div class="tab" onclick="swExp(this,2)">误报项 (' + (s.false_positives || 0) + ')</div>' +
    '</div>' +
    '<div id="exp-0">' + matchedHtml + '</div>' +
    '<div id="exp-1" style="display:none">' + missedHtml + '</div>' +
    '<div id="exp-2" style="display:none">' + fpHtml + '</div>' +
    '</div><div class="modal-footer"><button class="btn" onclick="closeModal()">关闭</button></div></div>');
}
function swExp(el, i) {
  el.parentNode.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  for (let j = 0; j < 3; j++) {
    const e = document.getElementById('exp-' + j);
    if (e) e.style.display = j === i ? '' : 'none';
  }
}

/* =================== Rollback & Audit =================== */
async function renderRollback() {
  const [rollbacks, logs] = await Promise.all([
    api('/mlops/rollback/list?limit=50').then(r => (r.data && r.data.items) || []),
    api('/mlops/audit-logs?limit=100').then(r => (r.data && r.data.items) || []),
  ]);

  let rbHtml = rollbacks.length === 0 ?
    '<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--text-muted)">暂无快照，编辑行动项时会自动创建</td></tr>' :
    rollbacks.map(rb => '<tr>' +
      '<td class="text-sm text-muted">' + escapeHtml(rb.id ? rb.id.slice(0, 8) + '...' : '-') + '</td>' +
      '<td>' + escapeHtml(rb.entity_type || '-') + '</td>' +
      '<td class="text-sm">' + escapeHtml(rb.entity_id ? rb.entity_id.slice(0, 8) + '...' : '-') + '</td>' +
      '<td>' + escapeHtml(rb.reason || '自动快照') + '</td>' +
      '<td class="text-sm text-muted">' + fmtDate(rb.created_at) + '</td>' +
      '<td><button class="btn btn-sm btn-danger" onclick="doRollback(\'' + rb.id + '\')">回滚到此版本</button></td>' +
      '</tr>').join('');

  let alHtml = logs.length === 0 ?
    '<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-muted)">暂无审计日志</td></tr>' :
    logs.slice(0, 100).map(l => {
      let diff = '';
      try {
        const ov = l.old_value ? JSON.parse(l.old_value) : null;
        const nv = l.new_value ? JSON.parse(l.new_value) : null;
        if (ov && nv) {
          const keys = new Set([...Object.keys(ov), ...Object.keys(nv)]);
          diff = [...keys].filter(k => ov[k] !== nv[k]).map(k =>
            '<span class="chip" style="margin:2px">' + escapeHtml(k) + ': ' +
            escapeHtml(String(ov[k] ?? '(null)')) + ' -> ' + escapeHtml(String(nv[k] ?? '(null)')) + '</span>'
          ).join('');
        }
      } catch {}
      return '<tr>' +
        '<td class="text-sm text-muted">' + fmtDate(l.created_at) + '</td>' +
        '<td>' + escapeHtml(l.entity_type || '-') + '</td>' +
        '<td class="text-sm">' + escapeHtml(l.action || '-') + '</td>' +
        '<td class="text-sm text-muted">' + escapeHtml(l.entity_id ? l.entity_id.slice(0, 8) + '...' : '-') + '</td>' +
        '<td>' + escapeHtml(l.operator_name || '-') + '</td>' +
        '<td style="max-width:400px">' + (diff || '<span class="text-muted">-</span>') + '</td>' +
        '</tr>';
    }).join('');

  document.getElementById('content').innerHTML =
    '<div class="tabs">' +
    '<div class="tab active" onclick="swRb(this,0)">快照与回滚 (' + rollbacks.length + ')</div>' +
    '<div class="tab" onclick="swRb(this,1)">审计日志 (' + logs.length + ')</div>' +
    '<div class="tab" onclick="swRb(this,2)">手动快照</div>' +
    '</div>' +

    '<div class="tab-panel" id="rb-0">' +
    '<div class="card"><div class="table-wrap"><table><thead><tr>' +
    '<th>快照ID</th><th>实体类型</th><th>实体ID</th><th>原因</th><th>创建时间</th><th>操作</th>' +
    '</tr></thead><tbody>' + rbHtml + '</tbody></table></div></div></div>' +

    '<div class="tab-panel" id="rb-1" style="display:none">' +
    '<div class="card"><div class="table-wrap"><table><thead><tr>' +
    '<th>时间</th><th>类型</th><th>动作</th><th>实体ID</th><th>操作者</th><th>变更</th>' +
    '</tr></thead><tbody>' + alHtml + '</tbody></table></div></div></div>' +

    '<div class="tab-panel" id="rb-2" style="display:none">' +
    '<div class="card"><div class="card-title mb-3">创建手动快照</div>' +
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">实体类型</label>' +
    '<select id="snap-type"><option>action_item</option><option>meeting</option><option>speaker</option><option>topic</option></select></div>' +
    '<div class="form-group"><label class="form-label">实体ID *</label><input id="snap-id"></div></div>' +
    '<div class="form-row"><div class="form-group w-full"><label class="form-label">快照原因</label><input id="snap-reason" style="width:100%"></div></div>' +
    '<div class="mt-3"><button class="btn btn-primary" onclick="createSnap()">创建快照</button></div></div></div>';
}
function swRb(el, i) {
  el.parentNode.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  for (let j = 0; j < 3; j++) {
    const e = document.getElementById('rb-' + j);
    if (e) e.style.display = j === i ? '' : 'none';
  }
}
async function doRollback(id) {
  if (!confirm('确定回滚到此快照版本？')) return;
  const r = await api('/mlops/rollback/execute', { method: 'POST', body: { snapshot_id: id, operator: 'web' } });
  if (r.code === 0) { toast('回滚成功'); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}
async function createSnap() {
  const type = document.getElementById('snap-type').value;
  const id = document.getElementById('snap-id').value.trim();
  const reason = document.getElementById('snap-reason').value.trim();
  if (!id) { toast('实体ID必填', 'warning'); return; }
  const r = await api('/mlops/rollback/snapshot', { method: 'POST', body: {
    entity_type: type, entity_id: id, reason: reason || null,
  }});
  if (r.code === 0) { toast('快照已创建: ' + r.data.snapshot_id); refreshCurrent(); }
  else toast(r.message || '失败', 'error');
}

/* =================== Monitor =================== */
let _monitorTimer = null;
async function renderMonitor() {
  if (_monitorTimer) clearInterval(_monitorTimer);
  await refreshMonitor();
  _monitorTimer = setInterval(refreshMonitor, 10000);
}
async function refreshMonitor() {
  const [queueStats, syncLogs, health, actionStats] = await Promise.all([
    api('/mlops/queue/stats').then(r => r.data || {}),
    api('/mlops/sync/logs?limit=20').then(r => (r.data && r.data.items) || []),
    fetch('/health').then(r => r.json()).catch(() => ({ status: 'error' })),
    api('/action-items/stats').then(r => r.data || {}),
  ]).catch(() => [{}, {}, { status: 'error' }, {}]);

  const isHealthy = health && health.status === 'ok';
  const dbOk = health && health.services && health.services.database === 'ok';

  let qHtml = '';
  if (queueStats && Object.keys(queueStats).length) {
    qHtml = Object.entries(queueStats).map(([name, s]) =>
      '<div class="queue-stat"><div class="queue-name">' + name + '</div>' +
      '<div class="queue-counts">' +
      '<div class="queue-count"><span class="lbl">等</span><span class="num" style="color:#F59E0B">' + (s.waiting || 0) + '</span></div>' +
      '<div class="queue-count"><span class="lbl">跑</span><span class="num" style="color:#3B82F6">' + (s.active || 0) + '</span></div>' +
      '<div class="queue-count"><span class="lbl">成</span><span class="num" style="color:#10B981">' + (s.completed || 0) + '</span></div>' +
      '<div class="queue-count"><span class="lbl">败</span><span class="num" style="color:#EF4444">' + (s.failed || 0) + '</span></div>' +
      '<div class="queue-count"><span class="lbl">延</span><span class="num" style="color:#8B5CF6">' + (s.delayed || 0) + '</span></div>' +
      '</div></div>'
    ).join('');
  } else qHtml = '<div style="color:#64748B;text-align:center;padding:20px">暂无队列数据</div>';

  const as = actionStats.actionItems || {};
  const rs = actionStats.reviewTasks || {};

  let slHtml = syncLogs.length === 0 ?
    '<tr><td colspan="5" style="padding:30px;text-align:center;color:var(--text-muted)">无同步日志</td></tr>' :
    syncLogs.map(sl => '<tr>' +
      '<td class="text-sm text-muted">' + escapeHtml(sl.id ? sl.id.slice(0, 8) + '...' : '-') + '</td>' +
      '<td>' + escapeHtml(sl.target_system || '-') + '</td>' +
      '<td>' + statusBadge(sl.status) + '</td>' +
      '<td>' + escapeHtml(sl.external_id || '-') + '</td>' +
      '<td class="text-sm text-muted">' + fmtDate(sl.sync_at) + '</td></tr>').join('');

  document.getElementById('content').innerHTML =
    '<div class="stats-grid">' +
    '<div class="stat-card ' + (isHealthy ? 'success' : 'danger') + '"><div class="stat-label">系统状态</div>' +
    '<div class="stat-value" style="font-size:24px">' + (isHealthy ? '正常' : '异常') + '</div>' +
    '<div class="stat-meta"><span class="text-muted">DB: ' + (dbOk ? '健康' : '异常') + '</span></div></div>' +
    '<div class="stat-card"><div class="stat-label">今日抽取</div><div class="stat-value" style="font-size:24px">' + ((as.today_extracted) || '-') + '</div></div>' +
    '<div class="stat-card warning"><div class="stat-label">待处理复核</div><div class="stat-value" style="font-size:24px">' + ((as.needsReview) || 0) + '</div></div>' +
    '<div class="stat-card info"><div class="stat-label">数据/指标端点</div>' +
    '<div class="stat-value" style="font-size:16px;padding-top:4px">' +
    '<a href="/metrics" target="_blank" style="color:var(--primary)">/metrics (Prometheus)</a>' +
    '</div></div></div>' +

    '<div class="grid-2 mb-6">' +
    '<div class="card"><div class="card-header"><div class="card-title">任务队列 <span class="text-sm text-muted" style="margin-left:6px">10秒自动刷新</span></div>' +
    '<button class="btn btn-sm" onclick="refreshMonitor()">立即刷新</button></div>' +
    '<div class="monitor-panel">' + qHtml + '</div></div>' +
    '<div class="card"><div class="card-header"><div class="card-title">行动项状态分布</div></div>' +
    '<div class="metric-row"><div class="metric-name">行动项总数</div><div class="metric-val">' + (as.total || 0) + '</div></div>' +
    '<div class="metric-row"><div class="metric-name">里程碑</div><div class="metric-val good">' + (as.milestones || 0) + '</div></div>' +
    '<div class="metric-row"><div class="metric-name">待确认负责人</div><div class="metric-val ' + ((as.pendingAssignee || 0) > 0 ? 'warn' : 'good') + '">' + (as.pendingAssignee || 0) + '</div></div>' +
    '<div class="metric-row"><div class="metric-name">待确认截止日期</div><div class="metric-val ' + ((as.pendingDeadline || 0) > 0 ? 'warn' : 'good') + '">' + (as.pendingDeadline || 0) + '</div></div>' +
    '<div class="metric-row"><div class="metric-name">复核任务 - 待处理</div><div class="metric-val warn">' + ((rs && rs.pending) || 0) + '</div></div>' +
    '<div class="metric-row"><div class="metric-name">复核任务 - 已完成</div><div class="metric-val good">' + ((rs && rs.resolved) || 0) + '</div></div>' +
    '</div></div>' +

    '<div class="card"><div class="card-header"><div class="card-title">最近任务同步日志</div>' +
    '<select id="ad-target" onchange="showSync(this.value)" style="margin-left:auto"><option value="mock">Mock系统</option><option value="webhook">Webhook</option><option value="jira">Jira</option></select>' +
    '</div><div class="table-wrap"><table><thead><tr>' +
    '<th>ID</th><th>目标系统</th><th>状态</th><th>外部ID</th><th>时间</th>' +
    '</tr></thead><tbody>' + slHtml + '</tbody></table></div></div>';
}
async function showSync(target) {
  const items = await api('/action-items?limit=10&needs_review=0').then(r => (r.data && r.data.items) || []);
  if (items.length === 0) { toast('没有可同步的行动项', 'warning'); return; }
  const r = await api('/mlops/sync/action/' + items[0].id, { method: 'POST', body: { target_system: target } });
  if (r.code === 0) { toast('同步已提交'); refreshMonitor(); }
  else toast(r.message || '失败', 'error');
}

/* =================== API Docs =================== */
function renderApiDocs() {
  const endpoints = [
    { m: 'POST', p: '/api/v1/inference/extract', d: '直接推理抽取行动项，无需先导入会议',
      req: `{\n  "transcript": "[李明] 张伟完成登录模块开发\\n[王芳] 明天开始测试",\n  "segments": [{"speaker":"李明","content":"张伟完成登录模块开发"}],\n  "meeting_title": "周会",\n  "project_name": "v2.0",\n  "meeting_date": "2026-06-09",\n  "save": false,\n  "use_model": "gpt-4o"\n}`,
      resp: `{\n  "code": 0,\n  "data": {\n    "action_items": [{"title":"完成登录模块开发","assignee":"张伟","assignee_confidence":0.92,"assignee_pending":false,"deadline":null,"deadline_pending":true,"deadline_note":"原文未提及明确截止日期","is_milestone":0,"priority":"medium","needs_review":1,"review_reason":"截止日期待确认"}],\n    "topics": [...],\n    "speakers": [...],\n    "meta": {"model":"gpt-4o","tokens":{"prompt_tokens":128,"completion_tokens":300},"latency_seconds":2.31}\n  }\n}`
    },
    { m: 'POST', p: '/api/v1/meetings/import', d: '导入转写文本或上传文件，自动提交解析和抽取任务',
      req: `{\n  "title": "产品研发周会",\n  "project_name": "电商平台v2.0",\n  "meeting_date": "2026-06-09",\n  "format": "speaker-tagged",\n  "content": "[发言人1] 内容\\n[发言人2] 内容"\n}`,
      resp: `{\n  "code": 0,\n  "message": "导入成功，已提交解析与抽取任务",\n  "data": {"meetingId": "uuid", "segmentsCount": 42}\n}`
    },
    { m: 'GET', p: '/api/v1/action-items', d: '查询行动项列表（支持多维筛选）',
      req: `Query Params:\n  meeting_id, assignee, status, needs_review=1,\n  is_milestone=1, project, deadline_from, deadline_to,\n  limit=100, offset=0`,
      resp: `{\n  "code": 0,\n  "data": {\n    "items": [{"id":"...","title":"...","assignee":"张三","assignee_pending":0,"deadline":"2026-06-15","is_milestone":1,"needs_review":0,"status":"confirmed","review_reason":null}]\n  }\n}`
    },
    { m: 'POST', p: '/api/v1/action-items/:id/confirm-assignee', d: '确认行动项负责人（清除待确认标记）',
      req: `{"assignee": "张三", "operator": "wangjingli"}`,
      resp: `{"code":0,"data":{更新后的行动项对象}}`
    },
    { m: 'POST', p: '/api/v1/action-items/workbench/batch-review', d: '批量确认待确认字段',
      req: `{\n  "updates": [\n    {"action_item_id": "id1", "field_type": "assignee", "value": "张三"},\n    {"action_item_id": "id1", "field_type": "deadline", "value": "2026-06-15"}\n  ],\n  "operator": "admin"\n}`,
      resp: `{\n  "code": 0,\n  "data": {\n    "results": [{action_item_id, field_type, success, error}],\n    "success_count": 2,\n    "total": 2\n  }\n}`
    },
    { m: 'POST', p: '/api/v1/mlops/samples/validate', d: '用指定模型对样本集执行验证推理，计算P/R/F1',
      req: `{\n  "model_id": "uuid-of-model",\n  "dataset_id": "uuid-of-dataset",\n  "sample_ids": ["s1","s2","s3"]\n}`,
      resp: `{\n  "code": 0,\n  "data": {\n    "runId": "uuid",\n    "metrics": {\n      "overall": {"tp":12,"fp":2,"fn":1,"precision":0.857,"recall":0.923,"f1":0.889},\n      "per_field": {\n        "assignee": {"accuracy":0.88,"total":12,"correct":11,"pendingAccuracy":0.95},\n        "deadline": {"accuracy":0.78,"total":9,"correct":7,"pendingAccuracy":0.89},\n        "milestone": {"accuracy":0.95,"total":20,"correct":19}\n      },\n      "sample_count": 15\n    },\n    "samples": 15\n  }\n}`
    },
    { m: 'POST', p: '/api/v1/mlops/rollback/execute', d: '执行回滚到指定快照',
      req: `{"snapshot_id": "uuid", "operator": "admin"}`,
      resp: `{"code":0,"data":{"result":{回滚后的实体对象}}}`
    },
    { m: 'GET', p: '/api/v1/mlops/queue/stats', d: '查询所有Bull任务队列实时状态',
      req: `无`,
      resp: `{\n  "data": {\n    "action-extract": {"waiting":0,"active":1,"completed":42,"failed":0,"delayed":0}\n  }\n}`
    },
    { m: 'GET', p: '/metrics', d: 'Prometheus格式监控指标端点',
      req: `无（浏览器直接访问）`,
      resp: `# HELP action_items_extracted_total Total action items extracted\n# TYPE action_items_extracted_total counter\naction_items_extracted_total{status="success",model="gpt-4o"} 42\n...`
    },
  ];
  const mm = { GET: 'get', POST: 'post', PATCH: 'patch', DELETE: 'delete' };
  document.getElementById('content').innerHTML =
    '<div class="card mb-6">' +
    '<div class="card-title mb-4">接口调用说明</div>' +
    '<div class="text-sm text-secondary" style="line-height:1.9">' +
    '<p><strong>基础URL:</strong> <code style="background:var(--bg);padding:2px 6px;border-radius:4px">' + window.location.origin + '/api/v1</code></p>' +
    '<p><strong>Content-Type:</strong> 除文件上传外，均使用 <code style="background:var(--bg);padding:2px 6px;border-radius:4px">application/json</code></p>' +
    '<p><strong>统一响应结构:</strong> <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{code: 0成功/非0失败, message, data}</code></p>' +
    '<p><strong>谨慎模式说明:</strong> 当负责人/截止日期置信度低于阈值时，模型不会凭空编造，而是将 <code style="background:var(--bg);padding:2px 6px;border-radius:4px">assignee_pending=1 / deadline_pending=1</code>，并在 <code>assignee_note / deadline_note / review_reason</code> 中注明不确定的原因。所有需人工复核的项会自动进入标注工作台队列。</p>' +
    '</div></div>' +
    endpoints.map(ep => {
      const cls = mm[ep.m] || 'get';
      return '<div class="card mb-4">' +
        '<div class="card-header"><div>' +
        '<span class="api-method ' + cls + '">' + ep.m + '</span>' +
        '<code style="font-family:monospace;font-weight:600">' + escapeHtml(ep.p) + '</code>' +
        '</div></div>' +
        '<div class="text-sm text-secondary mb-3">' + escapeHtml(ep.d) + '</div>' +
        '<div class="grid-2"><div>' +
        '<div class="text-sm font-semibold mb-2" style="font-weight:600">请求示例 / 参数</div>' +
        '<div class="api-block"><pre style="margin:0;white-space:pre-wrap">' + escapeHtml(ep.req) + '</pre></div></div><div>' +
        '<div class="text-sm font-semibold mb-2" style="font-weight:600">响应示例</div>' +
        '<div class="api-block"><pre style="margin:0;white-space:pre-wrap">' + escapeHtml(ep.resp) + '</pre></div></div></div>' +
        '</div>';
    }).join('');
}
