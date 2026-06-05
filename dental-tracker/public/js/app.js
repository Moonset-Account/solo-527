let authToken = localStorage.getItem('authToken') || '';
let currentUser = null;
let selectedPack = null;

const API = '/api';

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (authToken) opts.headers['Authorization'] = `Bearer ${authToken}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();

  if (res.status === 401) {
    showLogin();
    throw new Error('未认证');
  }

  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

function showLogin() {
  authToken = '';
  localStorage.removeItem('authToken');
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('mainContent').style.display = 'none';
}

function showMain() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  loadKanban();
}

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');

  try {
    const data = await api('POST', '/auth/login', { username, password });
    authToken = data.token;
    localStorage.setItem('authToken', authToken);
    currentUser = data.user;
    document.getElementById('userName').textContent = data.user.name;
    document.getElementById('userRole').textContent = data.user.role;
    errEl.style.display = 'none';
    showMain();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}

function logout() {
  showLogin();
}

function hideDialog(id) {
  document.getElementById(id).style.display = 'none';
}

async function loadKanban() {
  try {
    const columns = await api('GET', '/kanban');
    renderKanban(columns);
  } catch (e) {
    console.error('加载看板失败:', e);
  }
}

function renderKanban(columns) {
  const statusOrder = ['new', 'pending_confirm', 'in_progress', 'exception_review', 'archived'];

  for (const status of statusOrder) {
    const col = columns[status];
    if (!col) continue;

    const countEl = document.getElementById(`count-${status}`);
    const bodyEl = document.getElementById(`col-${status}`);

    if (countEl) countEl.textContent = col.items.length;
    if (bodyEl) {
      bodyEl.innerHTML = col.items.map(pack => renderPackCard(pack)).join('');
    }
  }
}

function renderPackCard(pack) {
  const frozenClass = pack.is_frozen ? 'frozen' : '';
  const frozenBadge = pack.is_frozen ? '<span class="pack-frozen-badge">⚠ 已冻结</span>' : '';
  const deptInfo = pack.department_name ? `<div class="pack-dept">📍 ${pack.department_name}</div>` : '';

  return `
    <div class="pack-card ${frozenClass}" onclick="showPackDetail(${pack.id})">
      <div class="pack-code">${pack.code}</div>
      <div class="pack-name">${pack.name}</div>
      <div class="pack-category">${pack.category || ''}</div>
      ${deptInfo}
      ${frozenBadge}
    </div>
  `;
}

async function showPackDetail(packId) {
  try {
    const pack = await api('GET', `/packs/${packId}`);
    const logs = await api('GET', `/packs/${packId}/logs`);

    selectedPack = pack;

    document.getElementById('detailTitle').textContent = pack.name;
    document.getElementById('detailBody').innerHTML = `
      <div class="detail-field"><div class="label">编码</div><div class="value">${pack.code}</div></div>
      <div class="detail-field"><div class="label">类别</div><div class="value">${pack.category || '-'}</div></div>
      <div class="detail-field"><div class="label">状态</div><div class="value">${statusLabel(pack.status)}</div></div>
      <div class="detail-field"><div class="label">冻结</div><div class="value">${pack.is_frozen ? '⚠ 是' : '否'}</div></div>
      <div class="detail-field"><div class="label">当前科室</div><div class="value">${pack.department_name || '-'}</div></div>
      <div class="detail-field"><div class="label">操作日志</div>
        ${logs.map(l => `
          <div class="log-entry">
            <span class="log-action">${l.action}</span>
            <span class="log-operator"> ${l.operator_name || ''}</span>
            <span class="log-time"> ${formatTime(l.created_at)}</span>
            ${l.remark ? `<br><span style="color:#64748b">${l.remark}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    renderDetailActions(pack);
    document.getElementById('packDetailPanel').style.display = 'flex';
  } catch (e) {
    alert('加载详情失败: ' + e.message);
  }
}

function renderDetailActions(pack) {
  const actions = document.getElementById('detailActions');
  let html = '';

  if (pack.status === 'new' && !pack.is_frozen) {
    html += `<button class="btn btn-accent" onclick="scanPack(${pack.id})">扫码回收</button>`;
  }

  if ((pack.status === 'pending_confirm' || pack.status === 'in_progress') && !pack.is_frozen) {
    html += `<button class="btn btn-success" onclick="cleanPack(${pack.id})">清洗登记</button>`;
  }

  if (pack.status === 'in_progress' && !pack.is_frozen) {
    html += `<button class="btn btn-primary" onclick="showSterilizeDialog(${pack.id})">灭菌放行</button>`;
  }

  if (pack.status === 'sterilized' && !pack.is_frozen) {
    html += `<button class="btn btn-primary" onclick="showDispatchDialog(${pack.id})">科室领用</button>`;
  }

  if (pack.is_frozen) {
    html += `<button class="btn btn-danger" onclick="unfreezePack(${pack.id})">解除冻结</button>`;
  }

  actions.innerHTML = html;
}

async function scanPack(packId) {
  try {
    await api('POST', `/packs/${packId}/scan`);
    await loadKanban();
    showPackDetail(packId);
  } catch (e) {
    alert('扫码回收失败: ' + e.message);
  }
}

async function cleanPack(packId) {
  try {
    await api('POST', `/packs/${packId}/clean`, { cleaning_method: '超声波清洗' });
    await loadKanban();
    showPackDetail(packId);
  } catch (e) {
    alert('清洗登记失败: ' + e.message);
  }
}

async function unfreezePack(packId) {
  try {
    await api('POST', `/recall/unfreeze/${packId}`);
    await loadKanban();
    showPackDetail(packId);
  } catch (e) {
    alert('解冻失败: ' + e.message);
  }
}

function handleScan(event) {
  if (event.key === 'Enter') {
    handleScanAction();
  }
}

async function handleScanAction() {
  const code = document.getElementById('scanInput').value.trim();
  if (!code) return;

  try {
    const packs = await api('GET', `/packs?keyword=${encodeURIComponent(code)}`);
    if (packs.length === 0) {
      alert('未找到该编码的器械包');
      return;
    }
    const pack = packs[0];
    await api('POST', `/packs/${pack.id}/scan`);
    document.getElementById('scanInput').value = '';
    await loadKanban();
    showPackDetail(pack.id);
  } catch (e) {
    alert('扫码失败: ' + e.message);
  }
}

function showNewPackDialog() {
  document.getElementById('newPackDialog').style.display = 'flex';
}

async function createNewPack() {
  const code = document.getElementById('newPackCode').value.trim();
  const name = document.getElementById('newPackName').value.trim();
  const category = document.getElementById('newPackCategory').value;

  try {
    await api('POST', '/packs', { code, name, category });
    hideDialog('newPackDialog');
    document.getElementById('newPackCode').value = '';
    document.getElementById('newPackName').value = '';
    await loadKanban();
  } catch (e) {
    document.getElementById('newPackError').textContent = e.message;
    document.getElementById('newPackError').style.display = 'block';
  }
}

async function showNewBatchDialog() {
  try {
    const autoclaves = await api('GET', '/autoclaves');
    const sel = document.getElementById('batchAutoclave');
    sel.innerHTML = autoclaves.map(a => `<option value="${a.id}">${a.name} (${a.code})</option>`).join('');

    const packs = await api('GET', '/packs?status=in_progress');
    const cbDiv = document.getElementById('batchPackCheckboxes');
    if (packs.length === 0) {
      cbDiv.innerHTML = '<div style="color:var(--text-secondary);font-size:13px;padding:8px;">暂无执行中状态的器械包</div>';
    } else {
      cbDiv.innerHTML = packs.map(p => `
        <label class="checkbox-label">
          <input type="checkbox" value="${p.id}" class="batch-pack-cb"> ${p.code} - ${p.name}
        </label>
      `).join('');
    }

    document.getElementById('newBatchError').style.display = 'none';
    document.getElementById('newBatchDialog').style.display = 'flex';
  } catch (e) {
    alert('加载批次创建数据失败: ' + e.message);
  }
}

async function createNewBatch() {
  const autoclaveId = parseInt(document.getElementById('batchAutoclave').value);
  const temperature = parseFloat(document.getElementById('batchTemp').value);
  const pressure = parseFloat(document.getElementById('batchPressure').value);
  const packIds = Array.from(document.querySelectorAll('.batch-pack-cb:checked')).map(cb => parseInt(cb.value));

  if (packIds.length === 0) {
    document.getElementById('newBatchError').textContent = '请至少选择一个器械包';
    document.getElementById('newBatchError').style.display = 'block';
    return;
  }

  try {
    await api('POST', '/batches', { autoclave_id: autoclaveId, pack_ids: packIds, temperature, pressure });
    hideDialog('newBatchDialog');
    await loadKanban();
  } catch (e) {
    document.getElementById('newBatchError').textContent = e.message;
    document.getElementById('newBatchError').style.display = 'block';
  }
}

async function showSterilizeDialog(packId) {
  try {
    const batches = await api('GET', '/batches?status=pending');
    const sel = document.getElementById('sterilizeBatchSelect');

    if (batches.length === 0) {
      sel.innerHTML = '<option value="">暂无待确认批次，请先创建批次</option>';
    } else {
      sel.innerHTML = batches.map(b => `<option value="${b.id}">${b.batch_code} — ${b.autoclave_name || ''}</option>`).join('');
    }

    document.getElementById('sterilizeCardCode').value = `CARD-${packId}-${Date.now()}`;
    document.getElementById('sterilizeColorChange').value = '由蓝变黑';
    document.querySelector('input[name="cardResult"][value="true"]').checked = true;
    document.getElementById('sterilizeError').style.display = 'none';
    document.getElementById('sterilizeDialog').dataset.packId = packId;
    document.getElementById('sterilizeDialog').style.display = 'flex';
  } catch (e) {
    alert('加载批次数据失败: ' + e.message);
  }
}

async function submitSterilize() {
  const packId = parseInt(document.getElementById('sterilizeDialog').dataset.packId);
  const batchId = parseInt(document.getElementById('sterilizeBatchSelect').value);
  const cardCode = document.getElementById('sterilizeCardCode').value.trim();
  const colorChange = document.getElementById('sterilizeColorChange').value.trim();
  const isPassed = document.querySelector('input[name="cardResult"]:checked').value === 'true';

  if (!batchId) {
    document.getElementById('sterilizeError').textContent = '请选择灭菌批次';
    document.getElementById('sterilizeError').style.display = 'block';
    return;
  }

  if (!cardCode) {
    document.getElementById('sterilizeError').textContent = '请输入灭菌指示卡编码';
    document.getElementById('sterilizeError').style.display = 'block';
    return;
  }

  try {
    await api('POST', `/packs/${packId}/sterilize`, {
      batch_id: batchId,
      card_code: cardCode,
      color_change: colorChange,
      is_passed: isPassed,
    });
    hideDialog('sterilizeDialog');
    await loadKanban();
    showPackDetail(packId);
  } catch (e) {
    document.getElementById('sterilizeError').textContent = e.message;
    document.getElementById('sterilizeError').style.display = 'block';
  }
}

async function showDispatchDialog(packId) {
  try {
    const depts = await api('GET', '/departments');
    const sel = document.getElementById('dispatchDeptSelect');
    sel.innerHTML = depts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');

    document.getElementById('dispatchError').style.display = 'none';
    document.getElementById('dispatchDialog').dataset.packId = packId;
    document.getElementById('dispatchDialog').style.display = 'flex';
  } catch (e) {
    alert('加载科室数据失败: ' + e.message);
  }
}

async function submitDispatch() {
  const packId = parseInt(document.getElementById('dispatchDialog').dataset.packId);
  const deptId = parseInt(document.getElementById('dispatchDeptSelect').value);

  try {
    await api('POST', `/packs/${packId}/dispatch`, { department_id: deptId });
    hideDialog('dispatchDialog');
    await loadKanban();
    closeDetail();
  } catch (e) {
    document.getElementById('dispatchError').textContent = e.message;
    document.getElementById('dispatchError').style.display = 'block';
  }
}

async function showBatchPanel() {
  try {
    const batches = await api('GET', '/batches');
    const body = document.getElementById('batchListBody');

    if (batches.length === 0) {
      body.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">暂无灭菌批次</div>';
    } else {
      body.innerHTML = batches.map(b => `
        <div class="batch-card ${b.is_abnormal ? 'batch-abnormal' : ''}">
          <div class="batch-header-row">
            <span class="batch-code">${b.batch_code}</span>
            <span class="batch-status-badge ${b.status}">${batchStatusLabel(b)}</span>
          </div>
          <div class="batch-info">
            <div>消毒锅: ${b.autoclave_name || '-'}</div>
            <div>操作人: ${b.operator_name || '-'}</div>
            <div>温度: ${b.temperature || '-'}°C | 压力: ${b.pressure || '-'}MPa</div>
            <div>开始: ${formatTime(b.start_time)}</div>
            ${b.is_abnormal ? '<div style="color:#ef4444;font-weight:600;">⚠ 已标记异常</div>' : ''}
          </div>
          <div class="batch-actions">
            ${!b.is_abnormal && b.status !== 'abnormal' ? `<button class="btn btn-danger btn-sm" onclick="showRecallDialog(${b.id}, '${b.batch_code}')">标记异常 & 召回</button>` : ''}
            <button class="btn btn-sm" onclick="showBatchPacks(${b.id})">查看器械包</button>
          </div>
          <div id="batch-packs-${b.id}" class="batch-packs-list" style="display:none;"></div>
        </div>
      `).join('');
    }

    document.getElementById('batchPanel').style.display = 'flex';
  } catch (e) {
    alert('加载批次列表失败: ' + e.message);
  }
}

function closeBatchPanel() {
  document.getElementById('batchPanel').style.display = 'none';
}

function batchStatusLabel(b) {
  if (b.is_abnormal) return '异常';
  const map = { pending: '待确认', confirmed: '已确认', abnormal: '异常' };
  return map[b.status] || b.status;
}

function showRecallDialog(batchId, batchCode) {
  document.getElementById('recallBatchId').value = batchId;
  document.getElementById('recallBatchCode').value = batchCode;
  document.getElementById('recallReason').value = '';
  document.getElementById('recallError').style.display = 'none';
  document.getElementById('recallDialog').style.display = 'flex';
}

async function submitRecall() {
  const batchId = parseInt(document.getElementById('recallBatchId').value);
  const reason = document.getElementById('recallReason').value.trim();

  if (!reason) {
    document.getElementById('recallError').textContent = '请填写异常原因';
    document.getElementById('recallError').style.display = 'block';
    return;
  }

  try {
    const result = await api('POST', `/batches/${batchId}/abnormal`, { reason });
    hideDialog('recallDialog');
    alert(`批次异常标记成功！已冻结 ${result.recalled_packs} 个器械包`);
    showBatchPanel();
    await loadKanban();
  } catch (e) {
    document.getElementById('recallError').textContent = e.message;
    document.getElementById('recallError').style.display = 'block';
  }
}

async function showBatchPacks(batchId) {
  const container = document.getElementById(`batch-packs-${batchId}`);
  if (container.style.display !== 'none') {
    container.style.display = 'none';
    return;
  }

  try {
    const packs = await api('GET', `/batches/${batchId}/packs`);
    container.innerHTML = packs.map(p => `
      <div class="batch-pack-item">
        <span>${p.code}</span>
        <span style="margin-left:8px;color:var(--text-secondary);">${p.name}</span>
        <span class="pack-status-tag ${p.status}">${statusLabel(p.status)}</span>
        ${p.is_frozen ? '<span style="color:#ef4444;font-size:11px;">⚠冻结</span>' : ''}
      </div>
    `).join('');
    container.style.display = 'block';
  } catch (e) {
    container.innerHTML = `<div style="color:#ef4444;padding:8px;">加载失败: ${e.message}</div>`;
    container.style.display = 'block';
  }
}

function closeDetail() {
  document.getElementById('packDetailPanel').style.display = 'none';
  selectedPack = null;
}

function statusLabel(status) {
  const map = {
    new: '新建',
    pending_confirm: '待确认',
    in_progress: '执行中',
    exception_review: '异常复核',
    sterilized: '已灭菌',
    archived: '已归档',
  };
  return map[status] || status;
}

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

(async function init() {
  if (authToken) {
    try {
      const user = await api('GET', '/auth/me');
      currentUser = user;
      document.getElementById('userName').textContent = user.name;
      document.getElementById('userRole').textContent = user.role;
      showMain();
    } catch {
      showLogin();
    }
  } else {
    showLogin();
  }
})();
