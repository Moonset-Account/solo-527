import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { dashboardApi } from '~/utils/api';
import { formatMoney, formatDate } from '~/utils/format';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getActivities({ limit: 10 })
      ]);
      
      if (statsRes.success) setStats(statsRes.data?.stats);
      if (activitiesRes.success) setActivities(activitiesRes.data?.activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { title: '今日销售额', value: formatMoney(stats.business?.todaySales), icon: '💰', color: '#1890ff', bg: '#e6f7ff', link: '/business' },
    { title: '今日利润', value: formatMoney(stats.business?.todayProfit), icon: '📈', color: '#52c41a', bg: '#f6ffed', link: '/business' },
    { title: '本月销售额', value: formatMoney(stats.business?.monthSales), icon: '📊', color: '#722ed1', bg: '#f9f0ff', link: '/business' },
    { title: '待处理异常', value: stats.anomaly?.pending || 0, icon: '⚠️', color: '#faad14', bg: '#fffbe6', link: '/anomalies' },
    { title: '待整改任务', value: stats.rectification?.pending || 0, icon: '📋', color: '#eb2f96', bg: '#fff0f6', link: '/rectifications' },
    { title: '低库存预警', value: stats.inventory?.lowStock || 0, icon: '📦', color: '#fa8c16', bg: '#fff7e6', link: '/inventory' },
    { title: '待处理现金差异', value: stats.cashDifference?.pending || 0, icon: '💵', color: '#13c2c2', bg: '#e6fffb', link: '/cash-differences' },
    { title: '未读催办', value: stats.reminders?.unread || 0, icon: '🔔', color: '#f5222d', bg: '#fff1f0', link: '/reminders' },
  ] : [];

  if (loading) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>加载中...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h2 className="page-title">仪表盘</h2>
      
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {statCards.map((card, index) => (
          <div key={index} className="stat-card" onClick={() => navigate(card.link || '#')}>
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-card-title">{card.title}</div>
            <div className="stat-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="card">
          <div className="flex-between mb-20">
            <h3 style={{ fontSize: '16px', fontWeight: '500' }}>最近操作</h3>
            <button className="btn btn-default btn-sm" onClick={() => navigate('/logs')}>查看全部</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>操作人</th>
                <th>模块</th>
                <th>动作</th>
                <th>描述</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>
                    暂无数据
                  </td>
                </tr>
              ) : (
                activities.map((activity: any) => (
                  <tr key={activity._id}>
                    <td>{activity.user?.name || activity.username}</td>
                    <td>{activity.module}</td>
                    <td>{activity.action}</td>
                    <td>{activity.description}</td>
                    <td>{formatDate(activity.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="flex-between mb-20">
            <h3 style={{ fontSize: '16px', fontWeight: '500' }}>快捷操作</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/business')}>
              💰 录入营业数据
            </button>
            <button className="btn btn-warning" onClick={() => navigate('/anomalies')}>
              ⚠️ 上报异常
            </button>
            <button className="btn btn-success" onClick={() => navigate('/rectifications')}>
              📋 整改任务管理
            </button>
            <button className="btn btn-default" onClick={() => navigate('/inventory')}>
              📦 库存管理
            </button>
            <button className="btn btn-default" onClick={async () => {
              const res = await dashboardApi.runRules();
              if (res.success) {
                alert(`催办规则执行完成，生成 ${res.data?.count || 0} 条提醒`);
                loadData();
              }
            }}>
              🔔 执行催办规则
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
