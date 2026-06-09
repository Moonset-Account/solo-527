import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>{children}</span>
);

export const riskLevelVariant = (level) => {
  const map = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
  return map[level] || 'default';
};

export const statusVariant = (status) => {
  const map = {
    draft: 'default',
    processing: 'info',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger',
    archived: 'default',
    pending_review: 'warning',
    review_queue: 'warning',
    human_reviewed: 'info',
    modified: 'primary',
    queued: 'warning',
    assigned: 'info',
    in_progress: 'primary',
    completed: 'success',
    escalated: 'danger',
    active: 'warning',
    acknowledged: 'info',
    resolved: 'success',
    ignored: 'default',
    finalized: 'success',
  };
  return map[status] || 'default';
};

export const riskTypeLabel = (type) => {
  const map = {
    payment: '付款风险',
    breach: '违约风险',
    confidentiality: '保密风险',
    auto_renewal: '自动续约风险',
  };
  return map[type] || type || '未知';
};

export const riskLevelLabel = (level) => {
  const map = { critical: '严重', high: '高', medium: '中', low: '低' };
  return map[level] || level || '-';
};

export const clauseTypeLabel = (type) => {
  const map = {
    payment: '付款条款',
    breach: '违约条款',
    confidentiality: '保密条款',
    auto_renewal: '自动续约条款',
    definition: '定义条款',
    obligation: '义务条款',
    termination: '终止条款',
    liability: '责任条款',
    ip: '知识产权条款',
    dispute: '争议解决条款',
    force_majeure: '不可抗力条款',
    other: '其他条款',
  };
  return map[type] || type || '其他';
};

export const statusLabel = (status) => {
  const map = {
    draft: '草稿',
    processing: '处理中',
    reviewing: '待复核',
    approved: '已通过',
    rejected: '已拒绝',
    archived: '已归档',
    pending_review: '待复核',
    review_queue: '二审队列',
    human_reviewed: '人工已复核',
    approved: '已通过',
    rejected: '已拒绝',
    modified: '人工改标',
    queued: '待领取',
    assigned: '已分配',
    in_progress: '处理中',
    completed: '已完成',
    escalated: '已升级',
    active: '未处理',
    acknowledged: '已确认',
    resolved: '已解决',
    ignored: '已忽略',
    finalized: '已生成',
    building: '构建中',
    ready: '就绪',
    failed: '失败',
  };
  return map[status] || status || '-';
};

export const alertTypeLabel = (type) => {
  const map = {
    data_missing: '数据缺失',
    model_drift: '模型漂移',
    service_failure: '服务调用失败',
    processing_timeout: '处理超时',
    validation_error: '验证错误',
    system_warning: '系统警告',
  };
  return map[type] || type;
};

export const alertTypeIcon = (type) => {
  const map = {
    data_missing: '📋',
    model_drift: '📊',
    service_failure: '🔧',
    processing_timeout: '⏱️',
    validation_error: '❌',
    system_warning: '⚠️',
  };
  return map[type] || '⚠️';
};

export const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const EmptyState = ({ icon = '📭', text = '暂无数据', hint = '' }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <div className="empty-text">{text}</div>
    {hint && <div className="empty-hint">{hint}</div>}
  </div>
);

export const ConfidenceMeter = ({ score, threshold = 0.7 }) => {
  const percentage = Math.round(parseFloat(score) * 100);
  const color = percentage >= threshold * 100 ? 'var(--success)'
    : percentage >= (threshold * 100 - 15) ? 'var(--warning)'
    : 'var(--danger)';
  return (
    <div className="confidence-meter">
      <div style={{ flex: 1 }}>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${percentage}%`, background: color }}
          />
        </div>
      </div>
      <span style={{ color, fontWeight: 600, minWidth: 42, textAlign: 'right' }}>
        {percentage}%
      </span>
    </div>
  );
};

export const Pagination = ({ total, limit, offset, onPageChange }) => {
  if (total <= limit) return null;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      <div className="page-info">共 {total} 条，第 {currentPage}/{totalPages} 页</div>
      <div className="page-buttons">
        <button
          className="page-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange((currentPage - 2) * limit)}
        >上一页</button>
        {pages.map(p => (
          <button
            key={p}
            className={`page-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange((p - 1) * limit)}
          >{p}</button>
        ))}
        <button
          className="page-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage * limit)}
        >下一页</button>
      </div>
    </div>
  );
};
