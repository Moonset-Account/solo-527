import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function AbsenceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [absence, setAbsence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [formData, setFormData] = useState({
    handlePlan: '',
    replacementVolunteer: '',
    closeNote: ''
  });
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    loadAbsence();
    loadVolunteers();
  }, [id]);

  const loadAbsence = async () => {
    try {
      const data = await apiRequest(`/absences/${id}`);
      setAbsence(data.absence);
    } catch (error) {
      console.error('加载缺席详情失败:', error);
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

  const handleHandle = async () => {
    try {
      await apiRequest(`/absences/${id}/handle`, {
        method: 'PUT',
        body: JSON.stringify({
          handlePlan: formData.handlePlan,
          replacementVolunteer: formData.replacementVolunteer || undefined,
          status: 'handling'
        })
      });
      setShowHandleModal(false);
      loadAbsence();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleClose = async () => {
    if (!formData.closeNote) {
      alert('请填写关闭前的处理说明');
      return;
    }
    try {
      await apiRequest(`/absences/${id}/close`, {
        method: 'PUT',
        body: JSON.stringify({
          closeNote: formData.closeNote
        })
      });
      setShowCloseModal(false);
      loadAbsence();
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      reported: { text: '已上报', class: 'badge-danger' },
      handling: { text: '处理中', class: 'badge-warning' },
      resolved: { text: '已解决', class: 'badge-primary' },
      closed: { text: '已关闭', class: 'badge-success' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
  };

  const getImpactBadge = (level) => {
    const map = {
      low: { text: '低', class: 'badge-gray' },
      medium: { text: '中', class: 'badge-warning' },
      high: { text: '高', class: 'badge-danger' },
      critical: { text: '严重', class: 'badge-danger' }
    };
    return map[level] || { text: level, class: 'badge-gray' };
  };

  const getTypeText = (type) => {
    const map = {
      no_show: '未到岗',
      late: '迟到',
      leave_early: '早退',
      cancelled_late: '临时取消'
    };
    return map[type] || type;
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  if (!absence) {
    return <div className="empty-state">缺席记录不存在</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/absences" className="btn btn-sm btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            {absence.volunteerId?.name} - {getTypeText(absence.type)}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge ${getImpactBadge(absence.impactLevel).class}`}>
              影响{getImpactBadge(absence.impactLevel).text}
            </span>
            <span className={`badge ${getStatusBadge(absence.status).class}`}>
              {getStatusBadge(absence.status).text}
            </span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">志愿者</div>
            <div className="detail-value">{absence.volunteerId?.name || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">所属团队</div>
            <div className="detail-value">{absence.volunteerId?.team || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">班次</div>
            <div className="detail-value">
              {absence.scheduleId?.shiftName || '-'}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">日期</div>
            <div className="detail-value">
              {absence.scheduleId?.date ? format(new Date(absence.scheduleId.date), 'yyyy-MM-dd') : '-'}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">活动</div>
            <div className="detail-value">{absence.activityId?.title || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">责任人</div>
            <div className="detail-value">
              {absence.responsiblePersonName || absence.responsiblePerson?.name || '-'}
            </div>
          </div>
          {absence.replacementVolunteer && (
            <div className="detail-item">
              <div className="detail-label">替补志愿者</div>
              <div className="detail-value">{absence.replacementVolunteer?.name || '-'}</div>
            </div>
          )}
          <div className="detail-item">
            <div className="detail-label">上报时间</div>
            <div className="detail-value">
              {format(new Date(absence.createdAt), 'yyyy-MM-dd HH:mm')}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="detail-label">缺席原因</div>
          <p style={{ marginTop: '0.5rem' }}>{absence.reason}</p>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="detail-label">影响范围</div>
          <p style={{ marginTop: '0.5rem' }}>{absence.impactScope}</p>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="detail-label">处理计划</div>
          <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
            {absence.handlePlan || '暂无'}
          </p>
        </div>

        {absence.remarks && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">备注</div>
            <p style={{ marginTop: '0.5rem' }}>{absence.remarks}</p>
          </div>
        )}

        {absence.attachments?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">附件</div>
            <div className="attachment-list" style={{ marginTop: '0.5rem' }}>
              {absence.attachments.map((att, idx) => (
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

        {absence.sourceOrderId && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">关联原单</div>
            <Link to={`/${absence.sourceOrderType || 'schedules'}/${absence.sourceOrderId}`}>
              查看原单记录 →
            </Link>
          </div>
        )}
      </div>

      {absence.closeNote && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">关闭说明</h3>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{absence.closeNote}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            关闭人：{absence.closedBy?.name || '-'} | 
            关闭时间：{absence.closedAt ? format(new Date(absence.closedAt), 'yyyy-MM-dd HH:mm') : '-'}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {(absence.status === 'reported' || absence.status === 'handling') && (
          <button 
            className="btn btn-primary"
            onClick={() => {
              setFormData(prev => ({ 
                ...prev, 
                handlePlan: absence.handlePlan || '',
                replacementVolunteer: absence.replacementVolunteer?._id || ''
              }));
              setShowHandleModal(true);
            }}
          >
            填写处理计划
          </button>
        )}
        {(absence.status === 'reported' || absence.status === 'handling' || absence.status === 'resolved') && (
          <button 
            className="btn btn-success"
            onClick={() => {
              setFormData(prev => ({ ...prev, closeNote: '' }));
              setShowCloseModal(true);
            }}
          >
            关闭记录
          </button>
        )}
      </div>

      {showHandleModal && (
        <div className="modal-overlay" onClick={() => setShowHandleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">处理计划</h3>
              <button className="modal-close" onClick={() => setShowHandleModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">处理计划</label>
              <textarea 
                className="form-textarea"
                value={formData.handlePlan}
                onChange={(e) => setFormData(prev => ({ ...prev, handlePlan: e.target.value }))}
                placeholder="请详细描述处理方案，包括影响范围、责任人等"
              />
            </div>

            <div className="form-group">
              <label className="form-label">替补志愿者（可选）</label>
              <select 
                className="form-select"
                value={formData.replacementVolunteer}
                onChange={(e) => setFormData(prev => ({ ...prev, replacementVolunteer: e.target.value }))}
              >
                <option value="">请选择替补志愿者</option>
                {volunteers.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({v.team})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHandleModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleHandle}>
                提交
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">关闭记录</h3>
              <button className="modal-close" onClick={() => setShowCloseModal(false)}>×</button>
            </div>
            
            <div className="alert alert-warning" style={{ fontSize: '0.875rem' }}>
              关闭前请补充处理说明，以便后续追溯
            </div>

            <div className="form-group">
              <label className="form-label">处理说明 *</label>
              <textarea 
                className="form-textarea"
                value={formData.closeNote}
                onChange={(e) => setFormData(prev => ({ ...prev, closeNote: e.target.value }))}
                placeholder="请填写处理结果和说明"
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleClose}>
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
