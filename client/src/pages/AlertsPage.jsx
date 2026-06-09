import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alertAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Badge, statusLabel, alertTypeLabel, alertTypeIcon, EmptyState, Pagination } from '../components/UI';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  const { showToast } = useToast();
  const { hasRole } = useAuth();

  useEffect(() => {
    loadData();
  }, [offset, filterType, filterSeverity, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, sum] = await Promise.all([
        alertAPI.list({
          alert_type: filterType || undefined,
          severity: filterSeverity || undefined,
          status: filterStatus || undefined,
          limit, offset,
        }),
        alertAPI.summary(),
      ]);
      setAlerts(res.alerts || []);
      setTotal(res.total || 0);
      setSummary(sum);
    } catch (err) {
      showToast('加载告警失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAck = async (id) => {
    try {
      await alertAPI.acknowledge(id);
      showToast('告警已确认', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const handleResolve = async (alert) => {
    const notes = prompt('请填写解决说明：');
    if (notes === null) return;
    try {
      await alertAPI.resolve(alert.id, notes);
      showToast('告警已解决', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const severityVariant = (s) => {
    const map = { critical: 'critical', error: 'danger', warning: 'warning', info: 'info' };
    return map[s] || 'default';
  };

  const alertSeverityClass = (s) => {
    const map = { critical: 'alert-critical', error: 'alert-error', warning: 'alert-warning', info: 'alert-info' };
    return map[s] || 'alert-info';
  };

  return (
    <div>
      {(summary.total_active > 0) && (
        <div className="grid grid-3 mb-4">
          <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
            <div className="stat-label">未处理告警</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{summary.total_active || 0}</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--critical)' }}>
            <div className="stat-label">严重/错误</div>
            <div className="stat-value" style={{ color: 'var(--critical)' }}>
              {(summary.by_severity?.critical || 0) + (summary.by_severity?.error || 0)}
            </div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--warning)' }}>
            <div className="stat-label">服务调用失败</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>
              {summary.by_type?.service_failure || 0}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">🚨 告警中心</div>
          <div className="text-sm text-muted">共 {total} 条</div>
        </div>

        <div className="filter-bar">
          <div className="form-group" style={{ minWidth: 160 }}>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setOffset(0); }}>
              <option value="">全部状态</option>
              <option value="active">未处理</option>
              <option value="acknowledged">已确认</option>
              <option value="resolved">已解决</option>
              <option value="ignored">已忽略</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 160 }}>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setOffset(0); }}>
              <option value="">全部类型</option>
              <option value="data_missing">数据缺失</option>
              <option value="model_drift">模型漂移</option>
              <option value="service_failure">服务调用失败</option>
              <option value="processing_timeout">处理超时</option>
              <option value="validation_error">验证错误</option>
              <option value="system_warning">系统警告</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 140 }}>
            <select value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setOffset(0); }}>
              <option value="">全部级别</option>
              <option value="info">提示</option>
              <option value="warning">警告</option>
              <option value="error">错误</option>
              <option value="critical">严重</option>
            </select>
          </div>
        </div>

        {loading ? (
          <EmptyState icon="⏳" text="加载中..." />
        ) : alerts.length === 0 ? (
          <EmptyState icon="🎉" text="暂无告警" hint="系统运行良好，暂未发现异常" />
        ) : (
          <>
            {alerts.map(a => (
              <div key={a.id} className={`alert-card ${alertSeverityClass(a.severity)}`}>
                <div className="alert-icon">{alertTypeIcon(a.alert_type)}</div>
                <div className="alert-content">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="alert-title">
                      <span className="mr-2">{a.title}</span>
                      <Badge variant={severityVariant(a.severity)}>{a.severity}</Badge>
                      <Badge variant="default" className="ml-2">{alertTypeLabel(a.alert_type)}</Badge>
                      <Badge variant={a.status === 'active' ? 'warning' : a.status === 'resolved' ? 'success' : 'info'} className="ml-2">
                        {statusLabel(a.status)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted">
                      {new Date(a.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  {a.message && <div className="alert-message">{a.message}</div>}

                  {(a.missing_fields && a.missing_fields.length > 0) && (
                    <div className="mt-2">
                      <span className="text-xs text-muted">缺失字段：</span>
                      {a.missing_fields.map(f => (
                        <span key={f} className="tag mr-1" style={{ background: '#fef2f2', color: 'var(--danger)' }}>{f}</span>
                      ))}
                    </div>
                  )}

                  {a.service_name && (
                    <div className="text-xs text-muted mt-2">服务: {a.service_name}
                      {a.error_code && ` · 错误码: ${a.error_code}`}
                    </div>
                  )}

                  {a.drift_metric && (
                    <div className="text-xs text-muted mt-2">
                      漂移率: {(a.drift_metric.drift_percentage * 100).toFixed(2)}% ·
                      基线: {a.drift_metric.baseline_avg_confidence?.toFixed(3)} ·
                      当前: {a.drift_metric.current_avg_confidence?.toFixed(3)} ·
                      样本数: {a.drift_metric.sample_size}
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
                    <div className="flex gap-2">
                      {a.contract_id && (
                        <Link
                          to={`/contract/${a.contract_id}`}
                          className="btn btn-sm btn-secondary"
                        >📁 查看关联合同</Link>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {a.status === 'active' && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleAck(a.id)}
                        >✓ 确认</button>
                      )}
                      {hasRole('admin') && a.status !== 'resolved' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleResolve(a)}
                        >✓ 解决</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Pagination total={total} limit={limit} offset={offset} onPageChange={setOffset} />
          </>
        )}
      </div>

      <div className="disclaimer">
        ℹ️ 告警类型说明：
        <ul className="list-disc pl-5 mt-2 text-sm">
          <li><strong>数据缺失</strong>：必要字段为空或缺失，可能影响风险检测准确性</li>
          <li><strong>模型漂移</strong>：模型置信度分布显著变化，建议检查模型或数据分布</li>
          <li><strong>服务调用失败</strong>：OpenAI API、数据库、向量库等服务异常</li>
          <li><strong>处理超时</strong>：任务超过预期执行时间</li>
        </ul>
      </div>
    </div>
  );
};

export default AlertsPage;
