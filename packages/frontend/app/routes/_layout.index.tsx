import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { api } from '~/utils/api';
import { formatDate } from '~/utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentPets, setRecentPets] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, petsRes, appsRes, remindersRes] = await Promise.all([
        api.get('/stats/overview'),
        api.get('/pets', { params: { pageSize: 5, sortBy: 'createdAt', sortOrder: -1 } }),
        api.get('/adoptions', { params: { pageSize: 5, sortBy: 'createdAt', sortOrder: -1 } }),
        api.get('/safety', { params: { isActive: 'true' }, requireAuth: false }),
      ]);
      
      setStats((statsRes as any).data);
      setRecentPets((petsRes as any).data || []);
      setRecentApplications((appsRes as any).data || []);
      setReminders((remindersRes as any).data?.filter((r: any) => r.isPinned)?.slice(0, 3) || []);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card card-body">加载中...</div>;
  }

  const statCards = [
    { label: '宠物总数', value: stats?.totalPets || 0, icon: '🐕', color: 'primary' },
    { label: '寄养中', value: stats?.fosteringPets || 0, icon: '🏠', color: 'info' },
    { label: '已领养', value: stats?.adoptedPets || 0, icon: '🏆', color: 'success' },
    { label: '待审核', value: stats?.pendingApplications || 0, icon: '📋', color: 'warning' },
  ];

  return (
    <div>
      <div className="stat-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }} className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">最近宠物档案</span>
            <Link to="/pets" className="text-sm text-primary">查看全部</Link>
          </div>
          <div className="card-body">
            {recentPets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🐾</div>
                <div className="empty-state-text">暂无宠物档案</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>名字</th>
                    <th>品种</th>
                    <th>状态</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPets.map((pet) => (
                    <tr key={pet._id}>
                      <td className="text-sm">{pet.petNo}</td>
                      <td className="font-medium">{pet.name}</td>
                      <td className="text-sm text-muted">{pet.breed || '-'}</td>
                      <td>
                        <span className={`badge badge-${getStatusColor(pet.status)}`}>
                          {getStatusLabel(pet.status)}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{formatDate(pet.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">安全提醒</span>
          </div>
          <div className="card-body">
            {reminders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <div className="empty-state-text">暂无安全提醒</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reminders.map((reminder) => (
                  <div
                    key={reminder._id}
                    className={`alert alert-${reminder.level}`}
                    style={{ marginBottom: 0 }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                      {reminder.title}
                    </div>
                    <div className="text-sm" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {reminder.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/safety" className="btn btn-secondary btn-sm btn-block" style={{ marginTop: '1rem' }}>
              查看全部提醒
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">最近领养申请</span>
          <Link to="/adoptions" className="text-sm text-primary">查看全部</Link>
        </div>
        <div className="card-body">
          {recentApplications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">暂无领养申请</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>申请编号</th>
                  <th>申请人</th>
                  <th>宠物</th>
                  <th>训练师</th>
                  <th>状态</th>
                  <th>申请时间</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app._id}>
                    <td className="text-sm">{app.applicationNo}</td>
                    <td className="font-medium">{app.applicantName}</td>
                    <td className="text-sm">{app.petName}</td>
                    <td className="text-sm text-muted">{app.trainerName || '-'}</td>
                    <td>
                      <span className={`badge badge-${getAdoptionStatusColor(app.status)}`}>
                        {getAdoptionStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{formatDate(app.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: '待寄养',
    fostering: '寄养中',
    adopted: '已领养',
    returned: '已退回',
    deceased: '已故',
  };
  return labels[status] || status;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'warning',
    fostering: 'info',
    adopted: 'success',
    returned: 'danger',
    deceased: '',
  };
  return colors[status] || '';
}

function getAdoptionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    under_review: '审核中',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labels[status] || status;
}

function getAdoptionStatusColor(status: string) {
  const colors: Record<string, string> = {
    draft: '',
    submitted: 'warning',
    under_review: 'primary',
    approved: 'success',
    rejected: 'danger',
    completed: 'success',
    cancelled: '',
  };
  return colors[status] || '';
}
