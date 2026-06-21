import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function ScheduleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volunteers, setVolunteers] = useState([]);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');

  useEffect(() => {
    loadSchedule();
    loadVolunteers();
  }, [id]);

  const loadSchedule = async () => {
    try {
      const data = await apiRequest(`/schedules/${id}`);
      setSchedule(data.schedule);
    } catch (error) {
      console.error('加载排班详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVolunteers = async () => {
    try {
      const data = await apiRequest('/volunteers?status=active&limit=100');
      setVolunteers(data.volunteers);
    } catch (error) {
      console.error('加载志愿者失败:', error);
    }
  };

  const handleSignUp = async () => {
    if (!selectedVolunteer) return;
    
    try {
      await apiRequest(`/schedules/${id}/signup`, {
        method: 'POST',
        body: JSON.stringify({ volunteerId: selectedVolunteer })
      });
      setShowSignUpModal(false);
      setSelectedVolunteer('');
      loadSchedule();
    } catch (error) {
      alert(error.message);
    }
  };

  const updateVolunteerStatus = async (volunteerId, status) => {
    try {
      await apiRequest(`/schedules/${id}/volunteers/${volunteerId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      loadSchedule();
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      signed_up: { text: '已报名', class: 'badge-gray' },
      confirmed: { text: '已确认', class: 'badge-primary' },
      checked_in: { text: '已签到', class: 'badge-success' },
      checked_out: { text: '已签退', class: 'badge-success' },
      cancelled: { text: '已取消', class: 'badge-danger' },
      absent: { text: '缺席', class: 'badge-danger' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
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

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  if (!schedule) {
    return <div className="empty-state">排班不存在</div>;
  }

  const activeVolunteers = schedule.volunteers?.filter(v => v.status !== 'cancelled') || [];

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/schedules" className="btn btn-sm btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">{schedule.shiftName}</h2>
          <span className={`badge ${getScheduleStatusBadge(schedule.status).class}`}>
            {getScheduleStatusBadge(schedule.status).text}
          </span>
        </div>
        
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">所属活动</div>
            <div className="detail-value">{schedule.activityId?.title || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">日期</div>
            <div className="detail-value">{format(new Date(schedule.date), 'yyyy年MM月dd日')}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">时间</div>
            <div className="detail-value">{schedule.startTime} - {schedule.endTime}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">地点</div>
            <div className="detail-value">{schedule.location || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">人数</div>
            <div className="detail-value">
              {activeVolunteers.length}/{schedule.maxVolunteers} 人
              <span style={{ color: activeVolunteers.length < schedule.minVolunteers ? '#ef4444' : '#10b981', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                (最低 {schedule.minVolunteers} 人)
              </span>
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">队长</div>
            <div className="detail-value">{schedule.teamLeader?.name || '-'}</div>
          </div>
        </div>

        {schedule.description && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">班次说明</div>
            <p style={{ marginTop: '0.5rem' }}>{schedule.description}</p>
          </div>
        )}

        {schedule.remarks && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">备注</div>
            <p style={{ marginTop: '0.5rem' }}>{schedule.remarks}</p>
          </div>
        )}

        {schedule.attachments?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">附件</div>
            <div className="attachment-list" style={{ marginTop: '0.5rem' }}>
              {schedule.attachments.map((att, idx) => (
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

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">志愿者名单 ({activeVolunteers.length}人)</h3>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowSignUpModal(true)}
          >
            + 添加志愿者
          </button>
        </div>

        {schedule.volunteers?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>暂无志愿者报名</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>姓名</th>
                  <th className="hide-mobile">电话</th>
                  <th className="hide-mobile">团队</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {schedule.volunteers.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.volunteerId?.name || '-'}</td>
                    <td className="hide-mobile">{item.volunteerId?.phone || '-'}</td>
                    <td className="hide-mobile">{item.volunteerId?.team || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(item.status).class}`}>
                        {getStatusBadge(item.status).text}
                      </span>
                    </td>
                    <td>
                      {item.status === 'signed_up' && (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => updateVolunteerStatus(item.volunteerId?._id, 'confirmed')}
                        >
                          确认
                        </button>
                      )}
                      {item.status === 'confirmed' && (
                        <>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => updateVolunteerStatus(item.volunteerId?._id, 'checked_in')}
                            style={{ marginRight: '0.5rem' }}
                          >
                            签到
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => updateVolunteerStatus(item.volunteerId?._id, 'cancelled')}
                          >
                            取消
                          </button>
                        </>
                      )}
                      {item.status === 'checked_in' && (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => updateVolunteerStatus(item.volunteerId?._id, 'checked_out')}
                        >
                          签退
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSignUpModal && (
        <div className="modal-overlay" onClick={() => setShowSignUpModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">添加志愿者</h3>
              <button className="modal-close" onClick={() => setShowSignUpModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">选择志愿者</label>
              <select 
                className="form-select"
                value={selectedVolunteer}
                onChange={(e) => setSelectedVolunteer(e.target.value)}
              >
                <option value="">请选择志愿者</option>
                {volunteers.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({v.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSignUpModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSignUp}>
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
