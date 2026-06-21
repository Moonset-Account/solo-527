import { useState, useEffect } from 'react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function PublicHome() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, activitiesData, donationsData] = await Promise.all([
        apiRequest('/stats/public'),
        apiRequest('/activities/public?limit=6'),
        apiRequest('/donations/public?limit=10')
      ]);
      setStats(statsData.stats);
      setActivities(activitiesData.activities);
      setDonations(donationsData.donations);
    } catch (error) {
      console.error('加载公开数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type) => {
    const map = {
      community: '社区服务',
      education: '教育支持',
      environment: '环境保护',
      medical: '医疗健康',
      elderly: '敬老服务',
      other: '其他'
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '3rem 1.5rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>志愿服务中心</h1>
        <p style={{ opacity: 0.9, margin: 0 }}>传递爱心，共建美好社区</p>
      </header>

      <div style={{ maxWidth: '1200px', margin: '-2rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1rem',
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>
              {stats?.totalActivities || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              志愿服务活动
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              {stats?.totalVolunteers || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              注册志愿者
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
              {stats?.totalVolunteerHours?.toLocaleString() || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              服务时长(h)
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
              ¥{stats?.totalDonationAmount?.toLocaleString() || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              捐赠金额
            </div>
          </div>
        </div>

        <section style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>近期活动</h2>
            <a href="/login" style={{ fontSize: '0.875rem', color: '#2563eb' }}>登录报名 →</a>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {activities.map(activity => (
              <div key={activity._id} style={{ 
                background: 'white', 
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              }}>
                {activity.coverImage ? (
                  <img 
                    src={activity.coverImage} 
                    alt={activity.title}
                    style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '160px', 
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem'
                  }}>
                    🎯
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    marginBottom: '0.5rem'
                  }}>
                    {getTypeText(activity.type)}
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                    {activity.title}
                  </h3>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    margin: '0 0 0.75rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {activity.description}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    📅 {format(new Date(activity.startDate), 'MM月dd日')} - {format(new Date(activity.endDate), 'MM月dd日')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>爱心捐赠榜</h2>
          </div>
          
          <div style={{ 
            background: 'white', 
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          }}>
            {donations.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                暂无公开捐赠记录
              </div>
            ) : (
              donations.map((donation, idx) => (
                <div key={donation._id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem',
                  borderBottom: idx < donations.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%',
                    background: '#fef3c7',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    marginRight: '1rem'
                  }}>
                    {donation.donorName?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{donation.donorName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {donation.publicNote || donation.description || '爱心捐赠'}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', color: '#10b981' }}>
                    {donation.type === 'money' 
                      ? `¥${donation.amount?.toLocaleString()}`
                      : donation.type === 'material' 
                        ? '物资捐赠' 
                        : '服务捐赠'
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <footer style={{ 
        background: '#1f2937', 
        color: 'rgba(255,255,255,0.6)', 
        textAlign: 'center',
        padding: '2rem 1rem',
        fontSize: '0.875rem'
      }}>
        <p>志愿服务中心 © {new Date().getFullYear()}</p>
        <p style={{ marginTop: '0.5rem' }}>传递爱心 · 服务社会</p>
      </footer>
    </div>
  );
}
