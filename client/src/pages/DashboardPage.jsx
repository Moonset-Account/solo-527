import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractAPI, reviewQueueAPI, alertAPI, riskAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Badge, statusLabel, statusVariant } from '../components/UI';

const DashboardPage = () => {
  const [stats, setStats] = useState({});
  const [reviewStats, setReviewStats] = useState({});
  const [alertSummary, setAlertSummary] = useState({});
  const [recentContracts, setRecentContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contracts, reviewRes, alertRes] = await Promise.all([
        contractAPI.list({ limit: 10 }),
        hasRole('admin', 'reviewer') ? reviewQueueAPI.stats('me').catch(() => ({})) : Promise.resolve({}),
        hasRole('admin', 'reviewer') ? alertAPI.summary().catch(() => ({})) : Promise.resolve({}),
      ]);
      setStats({
        total: contracts.total,
        reviewing: contracts.rows.filter(c => c.status === 'reviewing').length,
        approved: contracts.rows.filter(c => c.status === 'approved').length,
        processing: contracts.rows.filter(c => c.status === 'processing').length,
      });
      setRecentContracts(contracts.rows);
      setReviewStats(reviewRes);
      setAlertSummary(alertRes);
    } catch (err) {
      showToast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '合同总数', value: stats.total || 0, icon: '📁', color: 'var(--primary)', link: '/contracts' },
    { label: '待复核', value: stats.reviewing || 0, icon: '⏳', color: 'var(--warning)', link: '/contracts?status=reviewing' },
    { label: '已通过', value: stats.approved || 0, icon: '✅', color: 'var(--success)', link: '/contracts?status=approved' },
    { label: '处理中', value: stats.processing || 0, icon: '⚙️', color: 'var(--info)', link: '/contracts?status=processing' },
  ];

  const reviewCards = hasRole('admin', 'reviewer') && [
    { label: '我的待处理', value: reviewStats.in_progress || 0, icon: '📝', color: 'var(--primary)' },
    { label: '我的已完成', value: reviewStats.completed || 0, icon: '✅', color: 'var(--success)' },
    { label: '待领取', value: reviewStats.total_pending || 0, icon: '📥', color: 'var(--warning)' },
    { label: '逾期', value: reviewStats.overdue || 0, icon: '🚨', color: 'var(--danger)' },
  ];

  return (
    <div>
      <div className="grid grid-4 mb-4">
        {statCards.map((s, i) => (
          <div
            key={i}
            className="stat-card"
            onClick={() => navigate(s.link)}
            style={{ cursor: 'pointer', borderTop: `3px solid ${s.color}` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
              <div style={{ fontSize: 36 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {hasRole('admin', 'reviewer') && (
        <div className="grid grid-4 mb-4">
          {reviewCards.map((s, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ borderTop: `3px solid ${s.color}`, background: s.value > 0 && s.label === '逾期' ? '#fef2f2' : '' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                </div>
                <div style={{ fontSize: 36 }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasRole('admin', 'reviewer') && alertSummary.total_active > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚨 告警汇总</div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/alerts')}>查看全部</button>
          </div>
          <div className="grid grid-3">
            <div className="text-sm">
              <div className="text-muted mb-1">按类型</div>
              {Object.entries(alertSummary.by_type || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1">
                  <span>{k}</span><Badge variant="warning">{v}</Badge>
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="text-muted mb-1">按严重程度</div>
              {Object.entries(alertSummary.by_severity || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1">
                  <span>{k}</span><Badge variant={k}>{v}</Badge>
                </div>
              ))}
            </div>
            <div>
              <div className="text-muted mb-1">未处理告警</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--danger)' }}>
                {alertSummary.total_active}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">最近合同</div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/contracts')}>查看全部</button>
        </div>

        {recentContracts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="empty-text">还没有上传合同</div>
            <div className="empty-hint">前往合同管理页面上传第一份合同</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>合同标题</th>
                <th>合同类型</th>
                <th>甲/乙方</th>
                <th>状态</th>
                <th>版本</th>
                <th>上传时间</th>
              </tr>
            </thead>
            <tbody>
              {recentContracts.map(c => (
                <tr
                  key={c.id}
                  className="clickable"
                  onClick={() => navigate(`/contract/${c.id}`)}
                >
                  <td className="font-medium">{c.title}</td>
                  <td>{c.contract_type || '-'}</td>
                  <td className="text-sm text-secondary">
                    {c.party_a || '-'} / {c.party_b || '-'}
                  </td>
                  <td>
                    <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                  </td>
                  <td>v{c.current_version}</td>
                  <td className="text-sm text-muted">
                    {new Date(c.created_at).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="disclaimer" style={{ marginTop: 20 }}>
        ⚠️ 提示：本系统所有AI风险提示仅供参考，不构成法律意见。请务必咨询专业法律顾问进行最终确认。
      </div>
    </div>
  );
};

export default DashboardPage;
