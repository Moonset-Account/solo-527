import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
    loadSchedules();
  }, [id]);

  const loadActivity = async () => {
    try {
      const data = await apiRequest(`/activities/${id}`);
      setActivity(data.activity);
    } catch (error) {
      console.error('加载活动详情失败:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const data = await apiRequest(`/schedules?activityId=${id}&limit=50`);
      setSchedules(data.schedules);
    } catch (error) {
      console.error('加载排班失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: { text: '草稿', class: 'badge-gray' },
      published: { text: '已发布', class: 'badge-primary' },
      ongoing: { text: '进行中', class: 'badge-success' },
      completed: { text: '已完成', class: 'badge-success' },
      cancelled: { text: '已取消', class: 'badge-danger' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
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

  const getScheduleStatusBadge = (status) => {
    const map = {
      pending: { text: '待开始', class: 'badge-gray' },
      active: { text: '进行中', class: 'badge-primary' },
      completed: { text: '已完成', class: 'badge-success' },
      cancelled: { text: '已取消', class: 'badge-danger' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
  };

  const togglePublic = async () => {
    try {
      await apiRequest(`/activities/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublic: !activity.isPublic })
      });
      loadActivity();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  if (!activity) {
    return <div className="empty-state">活动不存在</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/activities" className="btn btn-sm btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">{activity.title}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge ${activity.isPublic ? 'badge-success' : 'badge-gray'}`}>
              {activity.isPublic ? '已公开' : '未公开'}
            </span>
            <span className={`badge ${getStatusBadge(activity.status).class}`}>
              {getStatusBadge(activity.status).text}
            </span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">活动类型</div>
            <div className="detail-value">{getTypeText(activity.type)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">地点</div>
            <div className="detail-value">{activity.location || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">开始时间</div>
            <div className="detail-value">
              {format(new Date(activity.startDate), 'yyyy年MM月dd日')}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">结束时间</div>
            <div className="detail-value">
              {format(new Date(activity.endDate), 'yyyy年MM月dd日')}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">招募人数</div>
            <div className="detail-value">{activity.minVolunteers} - {activity.maxVolunteers} 人</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">主办方</div>
            <div className="detail-value">{activity.organizer || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">联系人</div>
            <div className="detail-value">{activity.contactPerson || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">联系电话</div>
            <div className="detail-value">{activity.contactPhone || '-'}</div>
          </div>
        </div>

        {activity.description && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">活动描述</div>
            <p style={{ marginTop: '0.5rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {activity.description}
            </p>
          </div>
        )}

        {activity.remarks && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">备注</div>
            <p style={{ marginTop: '0.5rem' }}>{activity.remarks}</p>
          </div>
        )}

        {activity.photos?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">活动照片</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
              {activity.photos.map((photo, idx) => (
                <div key={idx} style={{ aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', background: '#f3f4f6' }}>
                  <img 
                    src={photo.url} 
                    alt={photo.caption || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activity.attachments?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">附件</div>
            <div className="attachment-list" style={{ marginTop: '0.5rem' }}>
              {activity.attachments.map((att, idx) => (
                <div key={idx} className="attachment-item">
                  <div className="attachment-icon">📎</div>
                  <div className="attachment-info">
                    <div className="attachment-name">{att.name}</div>
                    <div className="attachment-size">{(att.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary">
          编辑活动
        </button>
        <button className="btn btn-secondary" onClick={togglePublic}>
          {activity.isPublic ? '取消公开' : '设为公开'}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">排班列表</h3>
          <Link to={`/schedules?activityId=${id}`} className="btn btn-sm btn-secondary">
            查看全部
          </Link>
        </div>

        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>暂无排班</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>班次</th>
                  <th>时间</th>
                  <th>人数</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {schedules.slice(0, 10).map(schedule => {
                  const activeCount = schedule.volunteers?.filter(v => v.status !== 'cancelled').length || 0;
                  return (
                    <tr key={schedule._id}>
                      <td>{format(new Date(schedule.date), 'MM-dd')}</td>
                      <td>{schedule.shiftName}</td>
                      <td>{schedule.startTime} - {schedule.endTime}</td>
                      <td>{activeCount}/{schedule.maxVolunteers}</td>
                      <td>
                        <span className={`badge ${getScheduleStatusBadge(schedule.status).class}`}>
                          {getScheduleStatusBadge(schedule.status).text}
                        </span>
                      </td>
                      <td>
                        <Link to={`/schedules/${schedule._id}`} className="btn btn-sm btn-secondary">
                          详情
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
