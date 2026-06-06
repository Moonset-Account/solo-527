import { useEffect, useState } from 'react';
import { Link } from '@remix-run/react';
import { apiFetch } from '~/utils/api';
import { useAuth } from '~/utils/auth';

const statusLabels: Record<string, string> = {
  pending_confirm: '待确认',
  pending_rectify: '待整改',
  reviewed: '已复查',
  closed: '已关闭',
  false_positive: '误报'
};

const categoryLabels: Record<string, string> = {
  shelf: '货架',
  price_tag: '价签',
  fire_exit: '消防通道',
  freezer_temp: '冷柜温度',
  cleanliness: '卫生',
  other: '其他'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, issuesData] = await Promise.all([
        apiFetch('/api/issues/stats'),
        apiFetch('/api/issues?limit=5')
      ]);
      setStats(statsData);
      setRecentIssues(issuesData.data || []);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ marginBottom: '4px' }}>工作台</h2>
        <p className="text-muted">欢迎回来，{user?.full_name}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">问题总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1890ff' }}>{stats?.pending_confirm || 0}</div>
          <div className="stat-label">待确认</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#fa8c16' }}>{stats?.pending_rectify || 0}</div>
          <div className="stat-label">待整改</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ff4d4f' }}>{stats?.overdue || 0}</div>
          <div className="stat-label">逾期</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#52c41a' }}>{stats?.reviewed || 0}</div>
          <div className="stat-label">已复查</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#722ed1' }}>{stats?.false_positive || 0}</div>
          <div className="stat-label">误报</div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-4">
          <h3>最近问题</h3>
          <Link to="/issues" className="btn btn-default btn-sm">查看全部</Link>
        </div>
        
        {recentIssues.length === 0 ? (
          <div className="text-muted text-center" style={{ padding: '40px' }}>
            暂无问题记录
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>标题</th>
                <th>类型</th>
                <th>门店</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recentIssues.map(issue => (
                <tr key={issue.id}>
                  <td>
                    {issue.title}
                    {issue.is_overdue && <span className="overdue" style={{ marginLeft: '8px' }}>⚠️ 逾期</span>}
                  </td>
                  <td>{categoryLabels[issue.category] || issue.category}</td>
                  <td>{issue.store_name}</td>
                  <td>
                    <span className={`status-badge status-${issue.status}`}>
                      {statusLabels[issue.status]}
                    </span>
                  </td>
                  <td className="text-sm text-muted">
                    {new Date(issue.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    <Link to={`/issues/${issue.id}`} className="btn btn-default btn-sm">
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
