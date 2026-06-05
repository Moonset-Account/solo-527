let authToken = localStorage.getItem('authToken') || '';
let currentUser = null;
let selectedPack = null;

const API = '/api';

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
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

async function sterilizePack(packId, batchId, cardCode, colorChange, isPassed) {
  try {
    await api('POST', `/packs/${packId}/sterilize`, {
      batch_id: batchId,
      card_code: cardCode,
      color_change: colorChange,
      is_passed: isPassed,
    });
    await loadKanban();
    showPackDetail(packId);
  } catch (e) {
    alert('灭菌放行失败: ' + e.message);
  }
}

async function dispatchPack(packId, deptId) {
  try {
    await api('POST', `/packs/${packId}/dispatch`, { department_id: deptId });
    await loadKanban();
    closeDetail();
  } catch (e) {
    alert('科室领用失败: ' + e.message);
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

function hideNewPackDialog() {
  document.getElementById('newPackDialog').style.display = 'none';
}

async function createNewPack() {
  const code = document.getElementById('newPackCode').value.trim();
  const name = document.getElementById('newPackName').value.trim();
  const category = document.getElementById('newPackCategory').value;

  try {
    await api('POST', '/packs', { code, name, category });
    hideNewPackDialog();
    await loadKanban();
  } catch (e) {
    document.getElementById('newPackError').textContent = e.message;
    document.getElementById('newPackError').style.display = 'block';
  }
}

function showSterilizeDialog(packId) {
  const batchId = prompt('请输入灭菌批次ID (需先创建批次):');
  if (!batchId) return;
  const cardCode = prompt('灭菌指示卡编码:');
  if (!cardCode) return;
  const colorChange = prompt('变色情况 (如: 由蓝变黑):');
  const isPassed = confirm('灭菌指示卡是否合格？\n确定=合格，取消=不合格');
  sterilizePack(packId, parseInt(batchId), cardCode, colorChange, isPassed);
}

function showDispatchDialog(packId) {
  const deptId = prompt('请输入领用科室ID:\n1=口腔内科\n2=口腔外科\n3=正畸科\n4=修复科\n5=儿童口腔科');
  if (!deptId) return;
  dispatchPack(packId, parseInt(deptId));
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
  if (!ts) return '';
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
