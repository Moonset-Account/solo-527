import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, weeklyData, alertsData] = await Promise.all([
        apiRequest('/stats/dashboard'),
        apiRequest('/stats/weekly'),
        apiRequest('/alerts?status=active&limit=5')
      ]);
      setStats(statsData.stats);
      setWeeklyStats(weeklyData.dailyStats);
      setRecentAlerts(alertsData.alerts);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'badge-info',
      warning: 'badge-warning',
      danger: 'badge-danger',
      critical: 'badge-danger'
    };
    return colors[severity] || 'badge-gray';
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue">📋</div>
          <div className="stat-card-title">活动总数</div>
          <div className="stat-card-value">{stats?.overview?.totalActivities || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            进行中: {stats?.overview?.activeActivities || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon green">👥</div>
          <div className="stat-card-title">志愿者总数</div>
          <div className="stat-card-value">{stats?.overview?.totalVolunteers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            活跃: {stats?.overview?.activeVolunteers || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon yellow">⏰</div>
          <div className="stat-card-title">累计服务时长</div>
          <div className="stat-card-value">{stats?.overview?.totalHours || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            本月: {stats?.overview?.monthHours || 0} 小时
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon red">🔔</div>
          <div className="stat-card-title">活跃预警</div>
          <div className="stat-card-value">{stats?.alerts?.active || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>
            紧急: {stats?.alerts?.critical || 0}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">本周数据概览</h3>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                {weeklyStats.reduce((sum, d) => sum + d.checkIns, 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>本周签到</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                {weeklyStats.reduce((sum, d) => sum + d.hours, 0).toFixed(1)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>服务时长(h)</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                {weeklyStats.reduce((sum, d) => sum + d.schedules, 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>排班组数</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
                {weeklyStats.reduce((sum, d) => sum + d.newFeedbacks, 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>新增反馈</div>
            </div>
          </div>
          
          <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            {weeklyStats.map((day, idx) => {
              const maxCheckIns = Math.max(...weeklyStats.map(d => d.checkIns), 1);
              const height = (day.checkIns / maxCheckIns) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: '100%', 
                      height: `${height}%`, 
                      minHeight: day.checkIns > 0 ? '8px' : '2px',
                      background: 'linear-gradient(to top, #2563eb, #3b82f6)',
                      borderRadius: '4px 4px 0 0'
                    }} 
                  />
                  <div style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                    {format(new Date(day.date), 'MM/dd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">待处理预警</h3>
            <Link to="/alerts" className="btn btn-sm btn-secondary">
              全部
            </Link>
          </div>
          
          {recentAlerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <p>暂无预警</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentAlerts.map(alert => (
                <Link 
                  key={alert._id} 
                  to={`/alerts/${alert._id}`}
                  style={{ 
                    padding: '0.75rem', 
                    background: '#f9fafb', 
                    borderRadius: '0.5rem',
                    borderLeft: `4px solid ${alert.severity === 'critical' || alert.severity === 'danger' ? '#ef4444' : '#f59e0b'}`,
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{alert.title}</span>
                    <span className={`badge ${getSeverityColor(alert.severity)}`}>
                      {alert.severity === 'critical' ? '紧急' : 
                       alert.severity === 'danger' ? '严重' : 
                       alert.severity === 'warning' ? '警告' : '提示'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                    {alert.message?.slice(0, 50)}...
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">待处理反馈</h3>
            <Link to="/feedbacks?status=pending" className="btn btn-sm btn-secondary">
              查看
            </Link>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: '#f59e0b' }}>
              {stats?.feedbacks?.pending || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>条待处理</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">待处理缺席</h3>
            <Link to="/absences?status=reported" className="btn btn-sm btn-secondary">
              查看
            </Link>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: '#ef4444' }}>
              {stats?.absences?.open || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>条处理中</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">捐赠统计</h3>
            <Link to="/donations" className="btn btn-sm btn-secondary">
              明细
            </Link>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              ¥{stats?.donations?.totalAmount?.toLocaleString() || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>累计金额</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f59e0b' }}>
              {stats?.donations?.pending || 0} 笔待确认
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
