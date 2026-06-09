import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contractAPI, riskAPI, clauseListAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Badge, Modal, statusLabel, statusVariant, riskLevelLabel, riskTypeLabel,
  clauseTypeLabel, riskLevelVariant, ConfidenceMeter, EmptyState,
} from '../components/UI';

const tabs = ['overview', 'clauses', 'risks', 'versions', 'history'];

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, hasRole } = useAuth();

  const [contract, setContract] = useState(null);
  const [versions, setVersions] = useState([]);
  const [vectorIndexes, setVectorIndexes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [selectedClause, setSelectedClause] = useState(null);

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [newVersionSummary, setNewVersionSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [showImportClausesModal, setShowImportClausesModal] = useState(false);
  const [showImportReviewsModal, setShowImportReviewsModal] = useState(false);
  const [importClausesFile, setImportClausesFile] = useState(null);
  const [importReviewsFile, setImportReviewsFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [overrideRisk, setOverrideRisk] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    risk_type: '', risk_level: '', notes: '', action: 'modify'
  });

  const [validateStatus, setValidateStatus] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, verData, idxData, validData] = await Promise.all([
        contractAPI.get(id),
        contractAPI.getVersions(id),
        contractAPI.getVectorIndexes(id).catch(() => ({ indexes: [] })),
        clauseListAPI.validate(id).catch(() => null),
      ]);
      setContract(detail);
      setVersions(verData.versions || []);
      setVectorIndexes(idxData.indexes || []);
      setValidateStatus(validData);
    } catch (err) {
      showToast('加载合同详情失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApproveContract = async () => {
    if (!window.confirm('确认通过此合同的复核？所有风险标注均已完成复核。')) return;
    try {
      await contractAPI.approve(id);
      showToast('合同已通过', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const handleRejectContract = async () => {
    try {
      await contractAPI.reject(id, rejectReason);
      showToast('合同已拒绝', 'success');
      setShowRejectModal(false);
      setRejectReason('');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const handleUploadNewVersion = async () => {
    if (!newVersionFile) { showToast('请选择文件', 'warning'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', newVersionFile);
      if (newVersionSummary) formData.append('change_summary', newVersionSummary);
      await contractAPI.newVersion(id, formData);
      showToast('新版本已上传，AI正在处理...', 'success');
      setShowVersionModal(false);
      setNewVersionFile(null);
      setNewVersionSummary('');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    setSubmitting(true);
    try {
      await contractAPI.rollback(id, rollbackTarget);
      showToast('回滚成功，已创建新版本', 'success');
      setShowRollbackModal(false);
      setRollbackTarget(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRiskOverride = async () => {
    if (!overrideRisk) return;
    setSubmitting(true);
    try {
      const data = {
        risk_type: overrideForm.action === 'modify' ? overrideForm.risk_type || undefined : undefined,
        risk_level: overrideForm.action === 'modify' ? overrideForm.risk_level || undefined : undefined,
        notes: overrideForm.notes,
        approve: overrideForm.action === 'approve',
        remove: overrideForm.action === 'reject',
      };
      await riskAPI.override(overrideRisk.id, data);
      showToast('操作成功', 'success');
      setOverrideRisk(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openOverride = (risk) => {
    setOverrideRisk(risk);
    setOverrideForm({
      risk_type: risk.risk_type,
      risk_level: risk.risk_level,
      notes: risk.human_notes || '',
      action: 'modify',
    });
  };

  const handleApproveAllRisks = async () => {
    if (!window.confirm('确认通过本合同所有待处理的风险标注？')) return;
    try {
      const res = await riskAPI.approveAll(id);
      showToast(`通过了 ${res.approved} / ${res.total} 条风险`, 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const handleImportClauses = async () => {
    if (!importClausesFile) {
      showToast('请选择条款导入文件', 'warning');
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importClausesFile);
      const res = await contractAPI.importClauses(id, formData);
      showToast(res.message || '条款导入成功', 'success');
      setShowImportClausesModal(false);
      setImportClausesFile(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleImportReviews = async () => {
    if (!importReviewsFile) {
      showToast('请选择复核结果导入文件', 'warning');
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importReviewsFile);
      const res = await contractAPI.importReviews(id, formData);
      showToast(res.message || '复核结果导入成功', 'success');
      setShowImportReviewsModal(false);
      setImportReviewsFile(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleGenerateClauseList = async () => {
    if (validateStatus && !validateStatus.can_generate) {
      showToast(`还有 ${validateStatus.pending} 条风险待复核`, 'warning');
      return;
    }
    try {
      const res = await clauseListAPI.generate(id);
      showToast('条款清单已生成', 'success');
      navigate(`/clause-lists/${res.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  if (loading && !contract) {
    return <div className="card"><EmptyState icon="⏳" text="加载中..." /></div>;
  }

  if (!contract) {
    return <div className="card"><EmptyState icon="❓" text="合同不存在" /></div>;
  }

  const rs = contract.risk_summary || {};
  const totalRisks = (contract.risks || []).length;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/contracts">合同管理</Link>
        <span>/</span>
        <span className="font-medium">{contract.title}</span>
      </div>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{contract.title}</h2>
            <div className="flex flex-wrap gap-3 mb-3">
              <Badge variant={statusVariant(contract.status)}>{statusLabel(contract.status)}</Badge>
              <Badge variant="info">v{contract.current_version}</Badge>
              {contract.contract_number && <span className="text-sm text-secondary">编号：{contract.contract_number}</span>}
              {contract.contract_type && <Badge variant="default">{contract.contract_type}</Badge>}
            </div>
            <div className="grid grid-3 text-sm">
              <div><span className="text-muted">甲方：</span>{contract.party_a || '-'}</div>
              <div><span className="text-muted">乙方：</span>{contract.party_b || '-'}</div>
              <div><span className="text-muted">上传者：</span>{contract.uploader?.full_name || '-'}</div>
              <div><span className="text-muted">生效：</span>{contract.effective_date ? new Date(contract.effective_date).toLocaleDateString() : '-'}</div>
              <div><span className="text-muted">到期：</span>{contract.expiry_date ? new Date(contract.expiry_date).toLocaleDateString() : '-'}</div>
              <div><span className="text-muted">复核人：</span>{contract.reviewer?.full_name || '-'}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasRole('admin', 'assistant') && !['approved', 'archived'].includes(contract.status) && (
              <>
                <button className="btn btn-secondary" onClick={() => setShowImportClausesModal(true)}>
                  📋 批量导入条款
                </button>
              </>
            )}
            {hasRole('admin', 'reviewer') && !['approved', 'archived'].includes(contract.status) && (
              <button className="btn btn-secondary" onClick={() => setShowImportReviewsModal(true)}>
                ✅ 导入人工复核结果
              </button>
            )}
            {hasRole('admin', 'assistant') && (
              <button className="btn btn-secondary" onClick={() => setShowVersionModal(true)}>
                📤 上传新版本
              </button>
            )}
            {hasRole('admin', 'reviewer') && (contract.status === 'reviewing') && (
              <>
                <button className="btn btn-success" onClick={handleApproveContract}>
                  ✅ 通过合同
                </button>
                <button className="btn btn-danger" onClick={() => setShowRejectModal(true)}>
                  ❌ 拒绝合同
                </button>
              </>
            )}
            {hasRole('admin', 'reviewer') && (contract.status === 'approved') && (
              <button className="btn btn-primary" onClick={handleGenerateClauseList}>
                📝 生成条款清单
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {tabs.map(t => (
            <button
              key={t}
              className={`tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'overview' && '概览'}
              {t === 'clauses' && `条款 (${contract.clauses?.length || 0})`}
              {t === 'risks' && `风险标注 (${totalRisks})`}
              {t === 'versions' && `版本 (${versions.length})`}
              {t === 'history' && '操作历史'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-4 mb-4">
              <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
                <div className="stat-label">条款总数</div>
                <div className="stat-value">{contract.clauses?.length || 0}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
                <div className="stat-label">风险标注数</div>
                <div className="stat-value">{totalRisks}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid var(--warning)' }}>
                <div className="stat-label">待复核风险</div>
                <div className="stat-value">{validateStatus?.pending || 0}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
                <div className="stat-label">已通过风险</div>
                <div className="stat-value">{validateStatus?.approved || 0}</div>
              </div>
            </div>

            {totalRisks > 0 && (
              <div className="grid grid-2">
                <div>
                  <div className="card-title mb-2">按风险类型</div>
                  {Object.entries(rs.by_type || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 py-2">
                      <span style={{ minWidth: 100 }}>{riskTypeLabel(k)}</span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${totalRisks ? (v / totalRisks * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                      <span style={{ minWidth: 40, textAlign: 'right', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="card-title mb-2">按风险等级</div>
                  {['critical', 'high', 'medium', 'low'].map(lvl => (
                    <div key={lvl} className="flex items-center gap-3 py-2">
                      <span style={{ minWidth: 60 }}>{riskLevelLabel(lvl)}</span>
                      <Badge variant={riskLevelVariant(lvl)}>{lvl}</Badge>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${totalRisks ? ((rs.by_level?.[lvl] || 0) / totalRisks * 100) : 0}%`,
                              background: lvl === 'critical' ? 'var(--critical)' : lvl === 'high' ? 'var(--high)' : lvl === 'medium' ? 'var(--medium)' : 'var(--low)',
                            }}
                          />
                        </div>
                      </div>
                      <span style={{ minWidth: 40, textAlign: 'right', fontWeight: 600 }}>{rs.by_level?.[lvl] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contract.description && (
              <div className="mt-4">
                <div className="card-title mb-2">备注</div>
                <div className="text-secondary">{contract.description}</div>
              </div>
            )}

            <div className="disclaimer mt-4">
              ⚠️ 所有AI生成的风险提示和引用内容仅供参考，不构成法律意见。
            </div>
          </div>
        )}

        {activeTab === 'clauses' && (
          <div>
            {(contract.clauses || []).length === 0 ? (
              <EmptyState icon="📄" text="暂无条款数据" />
            ) : (
              (contract.clauses || []).map(clause => (
                <div
                  key={clause.id}
                  className="clause-card"
                  onClick={() => setSelectedClause(clause)}
                >
                  <div className="clause-header">
                    <div>
                      {clause.clause_number && (
                        <span className="clause-number mr-2">[{clause.clause_number}]</span>
                      )}
                      <span className="clause-title">{clause.clause_title || '未命名条款'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="default">{clauseTypeLabel(clause.clause_type)}</Badge>
                      {clause.is_amended && <Badge variant="warning">修改条款</Badge>}
                    </div>
                  </div>
                  <div className="clause-content">{clause.content}</div>
                  {clause.historical_notes && (
                    <div className="mt-2 text-sm text-secondary">
                      <span className="font-medium">历史意见：</span>{clause.historical_notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'risks' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                {validateStatus && validateStatus.pending > 0 && (
                  <Badge variant="warning">待复核 {validateStatus.pending} 条</Badge>
                )}
              </div>
              {hasRole('admin', 'reviewer') && (validateStatus?.pending || 0) > 0 && (
                <button className="btn btn-success btn-sm" onClick={handleApproveAllRisks}>
                  ✅ 批量通过全部
                </button>
              )}
            </div>

            {(contract.risks || []).length === 0 ? (
              <EmptyState icon="✅" text="暂未检测到风险标注" />
            ) : (
              (contract.risks || []).map(risk => (
                <div key={risk.id} className={`risk-card risk-${risk.risk_level || 'medium'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={riskLevelVariant(risk.risk_level)}>
                          {riskLevelLabel(risk.risk_level)}
                        </Badge>
                        <Badge variant="primary">{riskTypeLabel(risk.risk_type)}</Badge>
                        <Badge variant={statusVariant(risk.status)}>{statusLabel(risk.status)}</Badge>
                        {risk.is_low_confidence && <Badge variant="warning">⚠️ 低置信度</Badge>}
                        {risk.status === 'modified' && <Badge variant="info">人工改标</Badge>}
                      </div>
                      <div className="text-xs text-muted mb-2">
                        条款：{risk.Clause?.clause_number || ''} {risk.Clause?.clause_title || risk.Clause?.content?.substring(0, 50)}
                      </div>
                    </div>
                    <div style={{ minWidth: 200 }}>
                      <div className="text-xs text-muted mb-1">
                        AI置信度 {risk.is_low_confidence ? '(低于阈值，建议人工复核)' : ''}
                      </div>
                      <ConfidenceMeter score={risk.confidence_score} />
                    </div>
                  </div>

                  <div className="risk-summary">{risk.ai_summary}</div>

                  {risk.ai_quoted_text && (
                    <div className="risk-quoted">「{risk.ai_quoted_text}」</div>
                  )}

                  {risk.human_notes && (
                    <div className="mt-2 p-2" style={{ background: 'white', borderRadius: 4, border: '1px dashed var(--primary)' }}>
                      <div className="text-xs text-primary mb-1">💬 人工复核备注：</div>
                      <div>{risk.human_notes}</div>
                    </div>
                  )}

                  {hasRole('admin', 'reviewer') && (
                    <div className="risk-actions">
                      <button className="btn btn-success btn-sm" onClick={() => {
                        setOverrideRisk(risk);
                        setOverrideForm({ ...overrideForm, action: 'approve', notes: '' });
                      }}>✅ 通过</button>
                      <button className="btn btn-sm" style={{ background: 'var(--warning)', color: 'white' }} onClick={() => openOverride(risk)}>
                        ✏️ 修改
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        setOverrideRisk(risk);
                        setOverrideForm({ ...overrideForm, action: 'reject', notes: '' });
                      }}>✗ 移除</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted">共 {versions.length} 个版本</div>
              {hasRole('admin', 'assistant') && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowVersionModal(true)}>
                  + 上传新版本
                </button>
              )}
            </div>

            <div className="versions-timeline">
              {versions.map(v => (
                <div key={v.id} className={`version-item ${v.is_active ? 'active' : ''}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">版本 {v.version_number}</span>
                        {v.is_active && <Badge variant="success">当前版本</Badge>}
                        {v.rollback_from_version && (
                          <Badge variant="info">↩️ 回滚自 v{v.rollback_from_version}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-secondary mb-1">
                        文件：{v.original_filename} · {(v.file_size / 1024).toFixed(1)} KB
                      </div>
                      {v.change_summary && (
                        <div className="text-sm text-muted mb-1">
                          说明：{v.change_summary}
                        </div>
                      )}
                      <div className="text-xs text-muted">
                        由 {v.creator?.full_name || '系统'} 创建于 {new Date(v.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>

                    {hasRole('admin', 'assistant') && !v.is_active && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setRollbackTarget(v.version_number); setShowRollbackModal(true); }}
                      >
                        ↩️ 回滚到此版本
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {vectorIndexes.length > 0 && (
              <div className="mt-4">
                <div className="card-title mb-2">🔍 向量索引版本</div>
                <table>
                  <thead>
                    <tr>
                      <th>索引版本</th>
                      <th>嵌入模型</th>
                      <th>向量数</th>
                      <th>状态</th>
                      <th>构建耗时</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vectorIndexes.map(idx => (
                      <tr key={idx.id}>
                        <td>
                          v{idx.index_version}
                          {idx.is_active && <Badge variant="success ml-2">活跃</Badge>}
                        </td>
                        <td className="text-sm">{idx.embedding_model}</td>
                        <td>{idx.total_vectors}</td>
                        <td><Badge variant={statusVariant(idx.status)}>{statusLabel(idx.status)}</Badge></td>
                        <td className="text-sm">{idx.build_duration_ms ? `${idx.build_duration_ms}ms` : '-'}</td>
                        <td>
                          {hasRole('admin', 'reviewer') && !idx.is_active && idx.status === 'ready' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={async () => {
                                try {
                                  await contractAPI.rollbackIndex(id, idx.index_version);
                                  showToast('向量索引已切换', 'success');
                                  loadData();
                                } catch (err) { showToast(err.message, 'error'); }
                              }}
                            >切换</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && <AuditHistory contractId={id} />}
      </div>

      <Modal
        open={!!overrideRisk}
        onClose={() => !submitting && setOverrideRisk(null)}
        title="风险标注复核"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" disabled={submitting} onClick={() => setOverrideRisk(null)}>取消</button>
            <button
              className="btn btn-primary"
              disabled={submitting}
              onClick={handleRiskOverride}
            >
              {submitting ? '提交中...' : '确认提交'}
            </button>
          </>
        }
      >
        {overrideRisk && (
          <div>
            <div className="disclaimer mb-4">
              ⚠️ 人工复核将覆盖AI判断，所有修改将记录审计日志。
            </div>

            <div className="form-group">
              <label className="form-label">操作类型</label>
              <div className="flex gap-2">
                {[
                  { val: 'approve', label: '✅ 通过（维持AI）', v: 'primary' },
                  { val: 'modify', label: '✏️ 修改（人工调整）', v: 'warning' },
                  { val: 'reject', label: '✗ 拒绝（移除标注）', v: 'danger' },
                ].map(o => (
                  <button
                    key={o.val}
                    onClick={() => setOverrideForm(p => ({ ...p, action: o.val }))}
                    className={`btn ${overrideForm.action === o.val ? `btn-${o.v === 'warning' ? '' : o.v}` : 'btn-secondary'}`}
                    style={o.v === 'warning' ? {
                      background: overrideForm.action === o.val ? 'var(--warning)' : '',
                      color: overrideForm.action === o.val ? 'white' : '',
                      border: overrideForm.action === o.val ? '1px solid var(--warning)' : '',
                    } : {}}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {overrideForm.action === 'modify' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">调整风险类型</label>
                  <select value={overrideForm.risk_type} onChange={e => setOverrideForm(p => ({ ...p, risk_type: e.target.value }))}>
                    <option value="">（请选择）</option>
                    <option value="payment">付款风险</option>
                    <option value="breach">违约风险</option>
                    <option value="confidentiality">保密风险</option>
                    <option value="auto_renewal">自动续约风险</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">调整风险等级</label>
                  <select value={overrideForm.risk_level} onChange={e => setOverrideForm(p => ({ ...p, risk_level: e.target.value }))}>
                    <option value="">（请选择）</option>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="critical">严重</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">复核备注 *</label>
              <textarea
                placeholder="请填写复核说明，这将记录到审计日志中"
                value={overrideForm.notes}
                onChange={e => setOverrideForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showVersionModal}
        onClose={() => !submitting && setShowVersionModal(false)}
        title="上传合同新版本"
        footer={
          <>
            <button className="btn btn-secondary" disabled={submitting} onClick={() => setShowVersionModal(false)}>取消</button>
            <button className="btn btn-primary" disabled={submitting || !newVersionFile} onClick={handleUploadNewVersion}>
              {submitting ? '上传中...' : '上传'}
            </button>
          </>
        }
      >
        <div
          className="upload-zone mb-4"
          onClick={() => document.getElementById('newVerFile')?.click()}
        >
          <input id="newVerFile" type="file" style={{ display: 'none' }} accept=".txt,.md,.pdf,.docx" onChange={e => setNewVersionFile(e.target.files?.[0])} />
          <span className="upload-icon">{newVersionFile ? '📄' : '⬆️'}</span>
          {newVersionFile ? (
            <div>
              <div className="font-medium">{newVersionFile.name}</div>
              <div className="text-sm text-muted">{(newVersionFile.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          ) : (
            <div>
              <div className="font-medium mb-1">点击选择新版合同文件</div>
              <div className="text-sm text-muted">上传后将自动进行风险检测</div>
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">变更说明</label>
          <textarea
            placeholder="请描述本次版本的变更内容"
            value={newVersionSummary}
            onChange={e => setNewVersionSummary(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={showRollbackModal}
        onClose={() => !submitting && setShowRollbackModal(false)}
        title="回滚合同版本"
        footer={
          <>
            <button className="btn btn-secondary" disabled={submitting} onClick={() => setShowRollbackModal(false)}>取消</button>
            <button className="btn btn-warning" disabled={submitting} onClick={handleRollback}>
              {submitting ? '处理中...' : '确认回滚'}
            </button>
          </>
        }
      >
        <div className="alert-card alert-warning">
          <div>
            <div className="alert-title">⚠️ 版本回滚说明</div>
            <div className="alert-message">
              回滚到版本 <strong>v{rollbackTarget}</strong> 将创建一个新版本，内容与目标版本一致。
              原有版本不会被删除，完整保留历史记录。
              向量索引也会切换到目标版本的索引。
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="拒绝合同"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>取消</button>
            <button className="btn btn-danger" onClick={handleRejectContract}>确认拒绝</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">拒绝原因</label>
          <textarea
            placeholder="请填写拒绝原因，这将通知上传者"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={showImportClausesModal}
        onClose={() => !importing && setShowImportClausesModal(false)}
        title="📋 批量导入条款与历史意见"
        footer={
          <>
            <button className="btn btn-secondary" disabled={importing} onClick={() => setShowImportClausesModal(false)}>取消</button>
            <button className="btn btn-primary" disabled={importing || !importClausesFile} onClick={handleImportClauses}>
              {importing ? '导入中...' : '开始导入'}
            </button>
          </>
        }
      >
        <div className="mb-4">
          <div className="text-sm text-secondary mb-3">
            支持字段：<code>clause_number</code>, <code>clause_title</code>, <code>clause_type</code>,
            <code>content</code>, <strong><code>historical_notes</code>（历史修改意见）</strong>,
            <strong><code>manual_risk_type</code></strong>, <strong><code>manual_risk_level</code></strong> 等
          </div>
          <div
            className="upload-zone"
            onClick={() => document.getElementById('importClausesFile')?.click()}
          >
            <input
              id="importClausesFile"
              type="file"
              style={{ display: 'none' }}
              accept=".json,.csv,.xlsx,.xls"
              onChange={e => setImportClausesFile(e.target.files?.[0])}
            />
            <span className="upload-icon">{importClausesFile ? '📑' : '⬆️'}</span>
            {importClausesFile ? (
              <div>
                <div className="font-medium">{importClausesFile.name}</div>
                <div className="text-sm text-muted">
                  {(importClausesFile.size / 1024 / 1024).toFixed(2)} MB · 点击更换
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium mb-1">选择或拖拽导入文件</div>
                <div className="text-sm text-muted">支持 JSON / CSV / XLSX 格式</div>
              </div>
            )}
          </div>
        </div>
        <div className="alert-card alert-info">
          <div className="alert-title">📌 导入说明</div>
          <div className="alert-message text-sm">
            导入后将覆盖当前版本已有条款，<strong>historical_notes（历史修改意见）</strong>将直接作为 AI 风险检测的上下文输入。
            已通过（approved）或归档（archived）的合同不可再导入条款。
          </div>
        </div>
      </Modal>

      <Modal
        open={showImportReviewsModal}
        onClose={() => !importing && setShowImportReviewsModal(false)}
        title="✅ 批量导入人工复核结果"
        footer={
          <>
            <button className="btn btn-secondary" disabled={importing} onClick={() => setShowImportReviewsModal(false)}>取消</button>
            <button className="btn btn-primary" disabled={importing || !importReviewsFile} onClick={handleImportReviews}>
              {importing ? '导入中...' : '开始导入'}
            </button>
          </>
        }
      >
        <div className="mb-4">
          <div className="text-sm text-secondary mb-3">
            支持字段：<code>clause_number / clause_title</code>（匹配条款），<code>risk_id</code>（直接指定），
            <code>action</code>（approve/reject/modify），<code>final_risk_type</code>,
            <code>final_risk_level</code>, <strong><code>notes</code>（复核备注）</strong>
          </div>
          <div
            className="upload-zone"
            onClick={() => document.getElementById('importReviewsFile')?.click()}
          >
            <input
              id="importReviewsFile"
              type="file"
              style={{ display: 'none' }}
              accept=".json,.csv,.xlsx,.xls"
              onChange={e => setImportReviewsFile(e.target.files?.[0])}
            />
            <span className="upload-icon">{importReviewsFile ? '✅' : '⬆️'}</span>
            {importReviewsFile ? (
              <div>
                <div className="font-medium">{importReviewsFile.name}</div>
                <div className="text-sm text-muted">
                  {(importReviewsFile.size / 1024 / 1024).toFixed(2)} MB · 点击更换
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium mb-1">选择或拖拽复核结果文件</div>
                <div className="text-sm text-muted">支持 JSON / CSV / XLSX 格式</div>
              </div>
            )}
          </div>
        </div>
        <div className="alert-card alert-info">
          <div className="alert-title">📌 导入说明</div>
          <div className="alert-message text-sm">
            导入的复核结果将覆盖已有风险标注的状态和备注（人工改标），
            所有操作将记录到审计日志。已通过（approved）的合同不可再导入复核结果。
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selectedClause}
        onClose={() => setSelectedClause(null)}
        title={`条款详情 - ${selectedClause?.clause_number || ''} ${selectedClause?.clause_title || ''}`}
        size="lg"
      >
        {selectedClause && (
          <div>
            <div className="flex gap-2 mb-3">
              <Badge variant="primary">{clauseTypeLabel(selectedClause.clause_type)}</Badge>
              {selectedClause.is_amended && <Badge variant="warning">修改条款</Badge>}
              {selectedClause.page_number && <Badge variant="default">第{selectedClause.page_number}页</Badge>}
            </div>
            <div className="card" style={{ background: '#fafafa' }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{selectedClause.content}</div>
            </div>
            {selectedClause.historical_notes && (
              <div className="mt-3">
                <div className="form-label">历史修改意见</div>
                <div>{selectedClause.historical_notes}</div>
              </div>
            )}
            <div className="disclaimer mt-4">
              ⚠️ 条款内容来自合同原文，AI仅做结构化拆分。
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const AuditHistory = ({ contractId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await import('../api').then(m => m.auditAPI.contractHistory(contractId));
        setLogs(res.logs || []);
      } catch (e) {
        showToast('加载操作历史失败', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId]);

  if (loading) return <EmptyState icon="⏳" text="加载中..." />;
  if (logs.length === 0) return <EmptyState icon="📜" text="暂无操作记录" />;

  return (
    <div>
      {logs.map(log => (
        <div key={log.id} className="card" style={{ marginBottom: 10, padding: '12px 16px' }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="info">{log.action}</Badge>
              <span className="text-sm">{log.change_summary || log.action}</span>
            </div>
            <div className="text-xs text-muted">
              {log.User?.full_name || '系统'} · {new Date(log.created_at).toLocaleString('zh-CN')}
            </div>
          </div>
          {log.ip_address && <div className="text-xs text-muted mt-1">IP: {log.ip_address}</div>}
        </div>
      ))}
    </div>
  );
};

export default ContractDetailPage;
