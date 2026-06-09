import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reviewQueueAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Badge, Modal, statusLabel, statusVariant, riskLevelLabel, riskTypeLabel,
  clauseTypeLabel, riskLevelVariant, ConfidenceMeter, EmptyState,
} from '../components/UI';

const ReviewQueuePage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('me');

  const [completeItem, setCompleteItem] = useState(null);
  const [result, setResult] = useState({
    action: 'approve', risk_type: '', risk_level: '', reason: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadQueue();
  }, [filterStatus, filterAssigned]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await reviewQueueAPI.list({
        status: filterStatus || undefined,
        assigned_to: filterAssigned === 'me' ? 'me' : filterAssigned === 'unassigned' ? '' : undefined,
        limit: 50,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      showToast('加载队列失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (item) => {
    try {
      await reviewQueueAPI.assignMe(item.id);
      showToast('已领取任务', 'success');
      loadQueue();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const handleComplete = async () => {
    if (!completeItem) return;
    setSubmitting(true);
    try {
      await reviewQueueAPI.complete(completeItem.id, result);
      showToast('提交成功', 'success');
      setCompleteItem(null);
      setResult({ action: 'approve', risk_type: '', risk_level: '', reason: '', notes: '' });
      loadQueue();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openComplete = (item) => {
    setCompleteItem(item);
    setResult({
      action: 'approve',
      risk_type: item.original_risk_type,
      risk_level: item.original_risk_level,
      reason: '',
      notes: '',
    });
  };

  const statusFilters = [
    { val: '', label: '全部' },
    { val: 'queued', label: '待领取' },
    { val: 'in_progress', label: '处理中' },
    { val: 'assigned', label: '已分配' },
    { val: 'completed', label: '已完成' },
    { val: 'escalated', label: '已升级' },
  ];

  const assignedFilters = [
    { val: 'me', label: '分配给我' },
    { val: 'unassigned', label: '待领取' },
    { val: 'all', label: '全部' },
  ];

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">🔍 二审复核队列</div>
          <div className="text-sm text-muted">共 {total} 条任务</div>
        </div>

        <div className="filter-bar">
          <div className="form-group" style={{ minWidth: 140 }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {statusFilters.map(f => (
                <option key={f.val} value={f.val}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 140 }}>
            <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
              {assignedFilters.map(f => (
                <option key={f.val} value={f.val}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <EmptyState icon="⏳" text="加载中..." />
        ) : items.length === 0 ? (
          <EmptyState icon="🎉" text="暂无复核任务" hint="干得漂亮！所有任务已处理完毕" />
        ) : (
          items.map(item => (
            <div key={item.id} className="clause-card" style={{ marginBottom: 16 }}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div style={{ flex: 1, minWidth: 300 }}>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant={riskLevelVariant(item.original_risk_level)}>
                      {riskLevelLabel(item.original_risk_level)}
                    </Badge>
                    <Badge variant="primary">{riskTypeLabel(item.original_risk_type)}</Badge>
                    <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
                    {item.queue_reason === 'low_confidence' ? (
                      <Badge variant="warning">⚠️ 低置信度入队</Badge>
                    ) : (
                      <Badge variant="danger">🚨 高风险入队</Badge>
                    )}
                    {item.escalation_count > 0 && (
                      <Badge variant="critical">⚡ 升级x{item.escalation_count}</Badge>
                    )}
                  </div>

                  <div className="mb-2">
                    <Link to={`/contract/${item.contract_id}`} className="font-medium">
                      📁 {item.Contract?.title || '未知合同'}
                    </Link>
                  </div>

                  <div className="text-sm mb-2">
                    <Badge variant="default" className="mr-2">
                      {clauseTypeLabel(item.RiskAnnotation?.Clause?.clause_type)}
                    </Badge>
                    {item.RiskAnnotation?.Clause?.clause_number && `[${item.RiskAnnotation.Clause.clause_number}] `}
                    <span>{item.RiskAnnotation?.Clause?.clause_title || ''}</span>
                  </div>

                  <div
                    className="text-sm text-secondary p-2"
                    style={{ background: '#fafafa', borderRadius: 4, whiteSpace: 'pre-wrap' }}
                  >
                    {item.RiskAnnotation?.Clause?.content?.substring(0, 200)}
                    {item.RiskAnnotation?.Clause?.content?.length > 200 && '...'}
                  </div>

                  {item.RiskAnnotation?.ai_summary && (
                    <div className="mt-2 p-2" style={{ background: '#fffbeb', borderRadius: 4 }}>
                      <div className="text-xs text-muted mb-1">🤖 AI提示：</div>
                      <div className="text-sm">{item.RiskAnnotation.ai_summary}</div>
                    </div>
                  )}

                  {item.RiskAnnotation?.ai_quoted_text && (
                    <div className="risk-quoted">「{item.RiskAnnotation.ai_quoted_text}」</div>
                  )}
                </div>

                <div style={{ minWidth: 220 }}>
                  <div className="text-xs text-muted mb-1">AI置信度</div>
                  <ConfidenceMeter score={item.confidence_score} />

                  <div className="text-xs text-muted mt-3 mb-1">优先级</div>
                  <div className="font-semibold">{item.priority}</div>

                  <div className="text-xs text-muted mt-3 mb-1">
                    {item.assigned_to === user?.id ? '处理人' : item.assignee ? '分配给' : '待领取'}
                  </div>
                  <div className="text-sm">{item.assignee?.full_name || '未分配'}</div>

                  <div className="text-xs text-muted mt-3">
                    SLA: {item.sla_due_at ? new Date(item.sla_due_at).toLocaleString('zh-CN') : '-'}
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {item.status === 'queued' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAssign(item)}
                      >🙋 领取任务</button>
                    )}
                    {['in_progress', 'assigned'].includes(item.status) && item.assigned_to === user?.id && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => openComplete(item)}
                      >✅ 完成复核</button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/contract/${item.contract_id}`)}
                    >查看合同</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={!!completeItem}
        onClose={() => !submitting && setCompleteItem(null)}
        title="完成复核"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" disabled={submitting} onClick={() => setCompleteItem(null)}>取消</button>
            <button
              className="btn btn-primary"
              disabled={submitting}
              onClick={handleComplete}
            >
              {submitting ? '提交中...' : '提交复核结果'}
            </button>
          </>
        }
      >
        {completeItem && (
          <div>
            <div className="disclaimer mb-4">
              ⚠️ 复核结果将作为最终判定，审计日志永久记录此操作。
            </div>

            <div className="form-group">
              <label className="form-label">复核结果 *</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { val: 'approve', label: '✅ 通过（维持AI）' },
                  { val: 'modify', label: '✏️ 修改（人工调整）' },
                  { val: 'reject', label: '✗ 拒绝（标注不成立）' },
                  { val: 'escalate', label: '⚡ 升级复核' },
                ].map(o => (
                  <button
                    key={o.val}
                    onClick={() => setResult(p => ({ ...p, action: o.val }))}
                    className={`btn ${result.action === o.val ? 'btn-primary' : 'btn-secondary'}`}
                  >{o.label}</button>
                ))}
              </div>
            </div>

            {result.action === 'modify' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">调整风险类型</label>
                  <select value={result.risk_type} onChange={e => setResult(p => ({ ...p, risk_type: e.target.value }))}>
                    <option value="">（请选择）</option>
                    <option value="payment">付款风险</option>
                    <option value="breach">违约风险</option>
                    <option value="confidentiality">保密风险</option>
                    <option value="auto_renewal">自动续约风险</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">调整风险等级</label>
                  <select value={result.risk_level} onChange={e => setResult(p => ({ ...p, risk_level: e.target.value }))}>
                    <option value="">（请选择）</option>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="critical">严重</option>
                  </select>
                </div>
              </div>
            )}

            {(result.action === 'reject' || result.action === 'escalate') && (
              <div className="form-group">
                <label className="form-label">说明原因 *</label>
                <textarea
                  placeholder={`请填写${result.action === 'reject' ? '拒绝' : '升级'}原因`}
                  value={result.reason}
                  onChange={e => setResult(p => ({ ...p, reason: e.target.value }))}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">复核备注 *</label>
              <textarea
                placeholder="请填写详细的复核说明，作为审计记录"
                value={result.notes}
                onChange={e => setResult(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewQueuePage;
