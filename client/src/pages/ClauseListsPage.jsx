import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { clauseListAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Badge, EmptyState, riskLevelLabel, riskTypeLabel, clauseTypeLabel,
  riskLevelVariant,
} from '../components/UI';

export const ClauseListsPage = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    try {
      const res = await clauseListAPI.list({ limit: 50 });
      setLists(res.clause_lists || []);
    } catch (err) {
      showToast('加载清单失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (id, format) => {
    try {
      const res = await clauseListAPI.export(id, format);
      const blob = new Blob([res.data]);
      const cd = res.headers['content-disposition'];
      const fn = cd ? cd.split('filename="')[1]?.split('"')[0] : `clause-list-${id}.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fn || `clause-list.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('导出成功', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || err.message || '导出失败', 'error');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">📝 条款清单</div>
          {hasRole('admin', 'reviewer') && (
            <button className="btn btn-secondary" onClick={() => navigate('/contracts')}>
              从合同生成
            </button>
          )}
        </div>

        {loading ? (
          <EmptyState icon="⏳" text="加载中..." />
        ) : lists.length === 0 ? (
          <EmptyState
            icon="📄"
            text="暂无条款清单"
            hint={hasRole('admin', 'reviewer') ? '在合同详情页面复核通过后可生成条款清单' : ''}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>清单标题</th>
                <th>版本</th>
                <th>关联合同</th>
                <th>风险汇总</th>
                <th>生成人</th>
                <th>生成时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {lists.map(cl => {
                const rs = cl.risk_summary || {};
                return (
                  <tr key={cl.id} className="clickable" onClick={() => navigate(`/clause-lists/${cl.id}`)}>
                    <td className="font-medium">{cl.title}</td>
                    <td>v{cl.version_number}</td>
                    <td className="text-sm">
                      {cl.Contract ? (
                        <Link to={`/contract/${cl.Contract.id}`}>{cl.Contract.title}</Link>
                      ) : '-'}
                    </td>
                    <td className="text-sm">
                      <div>条款: {rs.total_clauses || 0} · 风险: {rs.total_risks || 0}</div>
                      <div className="flex gap-1 mt-1">
                        {['critical', 'high', 'medium', 'low'].map(l =>
                          (rs.by_level?.[l] || 0) > 0 && (
                            <Badge key={l} variant={riskLevelVariant(l)}>
                              {riskLevelLabel(l)} {rs.by_level[l]}
                            </Badge>
                          )
                        )}
                      </div>
                    </td>
                    <td className="text-sm">{cl.generator?.full_name || '-'}</td>
                    <td className="text-sm text-muted">
                      {new Date(cl.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button className="btn btn-sm btn-secondary" onClick={() => handleExport(cl.id, 'json')}>JSON</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleExport(cl.id, 'markdown')}>MD</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleExport(cl.id, 'csv')}>CSV</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export const ClauseListDetailPage = () => {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await clauseListAPI.get(id);
        setList(data);
      } catch (err) {
        showToast('加载清单失败', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleExport = async (format) => {
    try {
      const res = await clauseListAPI.export(id, format);
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${list?.title || 'clause-list'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('导出成功', 'success');
    } catch (err) {
      showToast(err.message || '导出失败', 'error');
    }
  };

  if (loading) return <div className="card"><EmptyState icon="⏳" text="加载中..." /></div>;
  if (!list) return <div className="card"><EmptyState icon="❓" text="清单不存在" /></div>;

  const rs = list.risk_summary || {};

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/clause-lists">条款清单</Link>
        <span>/</span>
        <span className="font-medium">{list.title}</span>
      </div>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{list.title}</h2>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="info">v{list.version_number}</Badge>
              <Badge variant="success">{list.status === 'finalized' ? '已生成' : list.status}</Badge>
              {list.Contract && (
                <Badge variant="default">
                  合同：
                  <Link to={`/contract/${list.Contract.id}`} className="ml-1">
                    {list.Contract.contract_number || list.Contract.title}
                  </Link>
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => handleExport('json')}>📄 JSON</button>
            <button className="btn btn-secondary" onClick={() => handleExport('markdown')}>📝 Markdown</button>
            <button className="btn btn-secondary" onClick={() => handleExport('csv')}>📊 CSV</button>
          </div>
        </div>

        {list.Contract && (
          <div className="grid grid-3 text-sm mb-4 p-4" style={{ background: '#fafafa', borderRadius: 8 }}>
            <div><span className="text-muted">甲方：</span>{list.Contract.party_a || '-'}</div>
            <div><span className="text-muted">乙方：</span>{list.Contract.party_b || '-'}</div>
            <div><span className="text-muted">生成人：</span>{list.generator?.full_name || '-'}</div>
          </div>
        )}

        <div className="grid grid-4 mb-4">
          <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
            <div className="stat-label">条款总数</div>
            <div className="stat-value">{rs.total_clauses || 0}</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
            <div className="stat-label">含风险条款</div>
            <div className="stat-value">{rs.clauses_with_risks || 0}</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--warning)' }}>
            <div className="stat-label">风险总数</div>
            <div className="stat-value">{rs.total_risks || 0}</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--info)' }}>
            <div className="stat-label">人工调整</div>
            <div className="stat-value">{rs.human_modified || 0}</div>
          </div>
        </div>

        <div className="disclaimer mb-4">
          ⚠️ 免责声明：本条款清单中的风险提示由AI系统辅助生成，仅供参考，不构成法律意见。请咨询专业法律顾问。
        </div>

        <div className="card-title mb-2">📋 条款明细</div>

        {(list.clause_items || []).map((item, idx) => (
          <div key={idx} className="clause-card" style={{ marginBottom: 16 }}>
            <div className="clause-header">
              <div>
                {item.clause_number && (
                  <span className="clause-number mr-2">[{item.clause_number}]</span>
                )}
                <span className="clause-title">{item.clause_title || '条款'}</span>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <Badge variant="default">{clauseTypeLabel(item.clause_type)}</Badge>
                {item.risk_level && (
                  <Badge variant={riskLevelVariant(item.risk_level)}>
                    风险：{riskLevelLabel(item.risk_level)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="clause-content expanded">{item.content}</div>

            {(item.risks || []).length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">🔴 风险标注：</div>
                {item.risks.map(r => (
                  <div key={r.risk_id} className={`risk-card risk-${r.risk_level || 'medium'}`} style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={riskLevelVariant(r.risk_level)}>{riskLevelLabel(r.risk_level)}</Badge>
                      <Badge variant="primary">{riskTypeLabel(r.final_risk_type || r.risk_type)}</Badge>
                      <span className="text-xs text-muted">置信度 {(r.confidence * 100).toFixed(0)}%</span>
                      {r.is_human_modified && <Badge variant="warning">⚠️ 人工调整</Badge>}
                    </div>
                    <div className="text-sm text-secondary">{r.summary}</div>
                    {r.human_notes && (
                      <div className="mt-2 text-xs p-2" style={{ background: 'white', border: '1px dashed var(--primary)', borderRadius: 4 }}>
                        💬 复核备注：{r.human_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClauseListsPage;
