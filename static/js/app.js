const API_BASE = '/api';

async function apiRequest(url, options = {}) {
  const defaults = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
  };
  const config = { ...defaults, ...options };
  if (config.body && typeof config.body !== 'string' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }
  try {
    const res = await fetch(url.startsWith('/api') ? url : API_BASE + url, config);
    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      const msg = data.message || data.detail || `请求失败 (${res.status})`;
      showToast(msg, 'error');
      throw new Error(msg);
    }
    return data.data;
  } catch (err) {
    if (err.name === 'Error' && !err.message.includes('请求失败')) {
      showToast(err.message, 'error');
    }
    throw err;
  }
}

function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function formatCurrency(num) {
  return '¥' + Number(num || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function getStatusBadgeClass(status) {
  const s = String(status).toLowerCase();
  if (['paid','completed','approved','enabled','active','available','success'].includes(s)) return 'badge-success';
  if (['pending','locked','processing','warning','sold_out'].includes(s)) return 'badge-warning';
  if (['cancelled','rejected','refunded','refund_rejected','disabled','failed','closed'].includes(s)) return 'badge-gray';
  if (['refund_pending','sold','vip'].includes(s)) return 'badge-info';
  if (['danger','error','blocked','banned'].includes(s)) return 'badge-danger';
  if (['draft'].includes(s)) return 'badge-warning';
  return 'badge-primary';
}

function getStatusText(status) {
  const map = {
    'available': '可售', 'locked': '锁定中', 'sold': '已售', 'refunded': '已退',
    'reserved': '预留', 'blocked': '屏蔽', 'pending': '待处理',
    'confirmed': '已确认', 'paid': '已支付', 'completed': '已完成',
    'cancelled': '已取消', 'refund_pending': '退款中', 'refund_rejected': '退款驳回',
    'approved': '已通过', 'rejected': '已驳回',
    'draft': '草稿', 'active': '进行中', 'sold_out': '售罄',
    'enabled': '启用', 'disabled': '停用',
    'vip': 'VIP区', 'front': '前区', 'middle': '中区', 'back': '后区', 'standing': '站区',
  };
  return map[status] || status;
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'flex';
}
function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'none';
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
  if (e.target.closest('[data-close-modal]')) {
    const id = e.target.closest('[data-close-modal]').dataset.closeModal;
    closeModal(id);
  }
});

function goToPage(url) { window.location.href = url; }

function confirmDialog(message, onConfirm) {
  if (confirm(message)) {
    onConfirm();
  }
}

function buildPaginationHtml(total, page, pageSize, onPageFunc) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return '';
  let html = `<div class="pagination">
    <div class="pagination-info">共 ${total} 条，第 ${page}/${totalPages} 页</div>
    <div class="pagination-nav">`;
  html += `<button class="page-btn" onclick="${onPageFunc}(1)" ${page === 1 ? 'disabled' : ''}>«</button>`;
  html += `<button class="page-btn" onclick="${onPageFunc}(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹</button>`;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="${onPageFunc}(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="${onPageFunc}(${page + 1})" ${page === totalPages ? 'disabled' : ''}>›</button>`;
  html += `<button class="page-btn" onclick="${onPageFunc}(${totalPages})" ${page === totalPages ? 'disabled' : ''}>»</button>`;
  html += '</div></div>';
  return html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

document.addEventListener('htmx:beforeRequest', (e) => {
  const target = e.detail.elt;
  if (target.tagName === 'FORM' || target.tagName === 'BUTTON') {
    const original = target.innerHTML;
    target.dataset.origHtml = original;
    if (target.tagName === 'BUTTON') {
      target.disabled = true;
      target.innerHTML = '<span class="spinner" style="width:14px;height:14px"></span> 处理中...';
    }
  }
});

document.addEventListener('htmx:afterRequest', (e) => {
  const target = e.detail.elt;
  if (target.dataset.origHtml) {
    if (target.tagName === 'BUTTON') {
      target.disabled = false;
      target.innerHTML = target.dataset.origHtml;
    }
    delete target.dataset.origHtml;
  }
});
