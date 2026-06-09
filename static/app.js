const API_BASE = window.location.origin;

async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
  };
  const mergedOptions = { ...defaultOptions, ...options };
  if (options.body && typeof options.body !== 'string') {
    mergedOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  } catch (err) {
    showToast('error', '请求错误', err.message);
    throw err;
  }
}

function showToast(type, title, message) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || '📢'}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message || ''}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('show');
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
  if (e.target.classList.contains('modal-close')) {
    e.target.closest('.modal-overlay').classList.remove('show');
  }
});

function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return isoString;
  }
}

function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return isoString;
  }
}

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return Number(num).toFixed(decimals);
}

function formatPercent(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return (Number(num) * 100).toFixed(1) + '%';
}

function getBadgeClassForAlertType(type) {
  switch (type) {
    case '轴承磨损': return 'badge-fault';
    case '传感器漂移': return 'badge-drift';
    default: return 'badge-default';
  }
}

function getBadgeClassForStatus(status) {
  switch (status) {
    case 'pending': return 'badge-pending';
    case 'confirmed': return 'badge-confirmed';
    case 'resolved': return 'badge-resolved';
    default: return 'badge-default';
  }
}

function getBadgeClassForFeedback(type) {
  switch (type) {
    case 'REAL_FAULT': return 'badge-fault';
    case 'SENSOR_DRIFT': return 'badge-drift';
    case 'FALSE_ALARM': return 'badge-false';
    default: return 'badge-default';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'pending': return '待处理';
    case 'confirmed': return '已确认';
    case 'resolved': return '已解决';
    default: return status || '-';
  }
}

function getFeedbackText(type) {
  switch (type) {
    case 'REAL_FAULT': return '真实故障';
    case 'SENSOR_DRIFT': return '传感器漂移';
    case 'FALSE_ALARM': return '误报';
    default: return type || '-';
  }
}

function getAlertTypeText(type) {
  return type || '-';
}

function renderEmptyState(container, icon, title, message) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
}

function renderPagination(container, currentPage, totalPages, totalItems, pageSize, onChange) {
  if (totalItems === 0) {
    container.innerHTML = '';
    return;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  let html = `
    <div class="pagination">
      <span class="pagination-info">显示 ${startItem}-${endItem} / ${totalItems} 条</span>
      <button class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''} data-page="prev">上一页</button>
  `;

  const maxVisible = 7;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button class="pagination-btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span>...</span>`;
  }

  for (let p = startPage; p <= endPage; p++) {
    html += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span>...</span>`;
    html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `
      <button class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="next">下一页</button>
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      let newPage = currentPage;
      if (page === 'prev') newPage = Math.max(1, currentPage - 1);
      else if (page === 'next') newPage = Math.min(totalPages, currentPage + 1);
      else newPage = parseInt(page);
      if (newPage !== currentPage) onChange(newPage);
    });
  });
}

const COLORS = {
  primary: '#2563eb',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
  info: '#0891b2',
  purple: '#7c3aed',
  pink: '#db2777',
  gray: '#64748b'
};

const CHART_COLORS = {
  bearingWear: {
    fill: 'rgba(220, 38, 38, 0.2)',
    stroke: '#dc2626'
  },
  sensorDrift: {
    fill: 'rgba(217, 119, 6, 0.2)',
    stroke: '#d97706'
  },
  falseAlarm: {
    fill: 'rgba(55, 48, 163, 0.2)',
    stroke: '#3730a3'
  },
  pending: {
    fill: 'rgba(234, 179, 8, 0.2)',
    stroke: '#ca8a04'
  },
  confirmed: {
    fill: 'rgba(22, 163, 74, 0.2)',
    stroke: '#16a34a'
  }
};
