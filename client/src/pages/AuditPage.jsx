import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auditAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState, Pagination } from '../components/UI';

const actionLabels = {
  contract_upload: { label: '上传合同', icon: '📤', color: 'primary' },
  contract_update: { label: '更新合同', icon: '✏️', color: 'info' },
  contract_rollback: { label: '回滚版本', icon: '↩️', color: 'warning' },
  contract_approve: { label: '通过合同', icon: '✅', color: 'success' },
  contract_reject: { label: '拒绝合同', icon: '❌', color: 'danger' },
  risk_create: { label: 'AI创建风险', icon: '🤖', color: 'info' },
  risk_modify: { label: '人工改标', icon: '✏️', color: 'warning' },
  risk_approve: { label: '通过风险', icon: '✅', color: 'success' },
  risk_reject: { label: '拒绝风险', icon: '❌', color: 'danger' },
  risk_to_review_queue: { label: '加入二审', icon: '🔍', color: 'warning' },
  review_start: { label: '开始复核', icon: '▶️', color: 'info' },
  review_complete: { label: '完成复核', icon: '✅', color: 'success' },
  vector_index_build: { label: '构建索引', icon: '🔍', color: 'info' },
  vector_index_rollback: { label: '回滚索引', icon: '↩️', color: 'warning' },
  export_clause_list: { label: '导出清单', icon: '📝', color: 'primary' },
  user_login: { label: '用户登录', icon: '🔐', color: 'default' },
  user_create: { label: '创建用户', icon: '👤', color: 'info' },
  system_alert: { label: '系统告警', icon: '🚨', color: 'danger' },
  other: { label: '其他操作', icon: '📋', color: 'default' },
};

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const [filterAction, setFilterAction] = useState('');
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [offset, filterAction, filterType, startDate, endDate]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.list({
        action: filterAction || undefined,
        entityType: filterType || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit, offset,
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err) {
      showToast('加载审计日志失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">📜 审计日志</div>
          <div className="text-sm text-muted">共 {total} 条记录</div>
        </div>

        <div className="filter-bar">
          <div className="form-group" style={{ minWidth: 180 }}>
            <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setOffset(0); }}>
              <option value="">全部操作</option>
              {Object.entries(actionLabels).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 160 }}>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setOffset(0); }}>
              <option value="">全部实体</option>
              <option value="contract">合同</option>
              <option value="contract_version">合同版本</option>
              <option value="clause">条款</option>
              <option value="risk_annotation">风险标注</option>
              <option value="vector_index">向量索引</option>
              <option value="user">用户</option>
              <option value="system">系统</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 160 }}>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setOffset(0); }}
              placeholder="开始日期"
            />
          </div>
          <div className="form-group" style={{ minWidth: 160 }}>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setOffset(0); }}
              placeholder="结束日期"
            />
          </div>
          <button className="btn btn-secondary" onClick={() => {
            setFilterAction(''); setFilterType(''); setStartDate(''); setEndDate(''); setOffset(0);
          }}>重置</button>
        </div>

        {loading ? (
          <EmptyState icon="⏳" text="加载中..." />
        ) : logs.length === 0 ? (
          <EmptyState icon="📭" text="暂无审计记录" />
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>操作</th>
                  <th>说明</th>
                  <th>实体</th>
                  <th>关联合同</th>
                  <th>操作人</th>
                  <th>IP</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const act = actionLabels[log.action] || actionLabels.other;
                  return (
                    <tr key={log.id}>
                      <td>
                        <Badge variant={act.color}>
                          {act.icon} {act.label}
                        </Badge>
                      </td>
                      <td className="text-sm">{log.change_summary || '-'}</td>
                      <td className="text-sm text-secondary">
                        {log.entity_type}{log.entity_id ? ` (${log.entity_id.substring(0, 8)}...)` : ''}
                      </td>
                      <td className="text-sm">
                        {log.contract_id ? (
                          <Link to={`/contract/${log.contract_id}`}>查看</Link>
                        ) : '-'}
                      </td>
                      <td className="text-sm">{log.User?.full_name || '系统'}</td>
                      <td className="text-xs text-muted">{log.ip_address || '-'}</td>
                      <td className="text-xs text-muted">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination total={total} limit={limit} offset={offset} onPageChange={setOffset} />
          </>
        )}
      </div>
    </div>
  );
};

export default AuditPage;
