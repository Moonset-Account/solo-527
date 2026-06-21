import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [formData, setFormData] = useState({
    resolutionNote: ''
  });

  useEffect(() => {
    loadAlert();
  }, [id]);

  const loadAlert = async () => {
    try {
      const data = await apiRequest(`/alerts/${id}`);
      setAlert(data.alert);
    } catch (error) {
      console.error('加载预警详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const map = {
      info: { text: '提示', class: 'badge-info' },
      warning: { text: '警告', class: 'badge-warning' },
      danger: { text: '严重', class: 'badge-danger' },
      critical: { text: '紧急', class: 'badge-danger' }
    };
    return map[severity] || { text: severity, class: 'badge-gray' };
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { text: '活跃', class: 'badge-danger' },
      acknowledged: { text: '已确认', class: 'badge-warning' },
      resolved: { text: '已解决', class: 'badge-success' },
      dismissed: { text: '已忽略', class: 'badge-gray' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
  };

  const getTypeText = (type) => {
    const map = {
      low_volunteers: '人数不足',
      absence_high: '缺席预警',
      no_show: '未到岗',
      schedule_conflict: '排班冲突',
      feedback_urgent: '紧急反馈',
      donation_pending: '捐赠待处理',
      activity_starting: '活动提醒',
      custom: '自定义'
    };
    return map[type] || type;
  };

  const handleAcknowledge = async () => {
    try {
      await apiRequest(`/alerts/${id}/acknowledge`, {
        method: 'PUT'
      });
      loadAlert();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleResolve = async () => {
    try {
      await apiRequest(`/alerts/${id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolutionNote: formData.resolutionNote })
      });
      setShowResolveModal(false);
      loadAlert();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDismiss = async () => {
    if (!confirm('确认忽略该预警？')) return;
    try {
      await apiRequest(`/alerts/${id}/dismiss`, {
        method: 'PUT'
      });
      loadAlert();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  if (!alert) {
    return <div className="empty-state">预警不存在</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/alerts" className="btn btn-sm btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">{alert.title}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge ${getSeverityBadge(alert.severity).class}`}>
              {getSeverityBadge(alert.severity).text}
            </span>
            <span className={`badge ${getStatusBadge(alert.status).class}`}>
              {getStatusBadge(alert.status).text}
            </span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">预警类型</div>
            <div className="detail-value">{getTypeText(alert.type)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">创建时间</div>
            <div className="detail-value">
              {format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm')}
            </div>
          </div>
          {alert.assignedTo && (
            <div className="detail-item">
              <div className="detail-label">指派给</div>
              <div className="detail-value">{alert.assignedTo?.name || '-'}</div>
            </div>
          )}
          {alert.acknowledgedBy && (
            <div className="detail-item">
              <div className="detail-label">确认人</div>
              <div className="detail-value">{alert.acknowledgedBy?.name || '-'}</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="detail-label">预警内容</div>
          <p style={{ marginTop: '0.5rem' }}>{alert.message}</p>
        </div>

        {alert.activityId && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">关联活动</div>
            <Link to={`/activities/${alert.activityId._id}`}>
              {alert.activityId.title} →
            </Link>
          </div>
        )}

        {alert.scheduleId && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">关联班次</div>
            <Link to={`/schedules/${alert.scheduleId._id}`}>
              {alert.scheduleId.shiftName} →
            </Link>
          </div>
        )}

        {alert.resolutionNote && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">处理说明</div>
            <p style={{ marginTop: '0.5rem' }}>{alert.resolutionNote}</p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
              处理人：{alert.resolvedBy?.name || '-'} | 
              处理时间：{alert.resolvedAt ? format(new Date(alert.resolvedAt), 'yyyy-MM-dd HH:mm') : '-'}
            </div>
          </div>
        )}

        {alert.acknowledgedAt && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            确认时间：{format(new Date(alert.acknowledgedAt), 'yyyy-MM-dd HH:mm')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {alert.status === 'active' && (
          <>
            <button className="btn btn-primary" onClick={handleAcknowledge}>
              确认预警
            </button>
            <button 
              className="btn btn-success"
              onClick={() => {
                setFormData({ resolutionNote: '' });
                setShowResolveModal(true);
              }}
            >
              标记解决
            </button>
            <button className="btn btn-secondary" onClick={handleDismiss}>
              忽略
            </button>
          </>
        )}
        {alert.status === 'acknowledged' && (
          <>
            <button 
              className="btn btn-success"
              onClick={() => {
                setFormData({ resolutionNote: '' });
                setShowResolveModal(true);
              }}
            >
              标记解决
            </button>
            <button className="btn btn-secondary" onClick={handleDismiss}>
              忽略
            </button>
          </>
        )}
      </div>

      {showResolveModal && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">解决预警</h3>
              <button className="modal-close" onClick={() => setShowResolveModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">处理说明</label>
              <textarea 
                className="form-textarea"
                value={formData.resolutionNote}
                onChange={(e) => setFormData(prev => ({ ...prev, resolutionNote: e.target.value }))}
                placeholder="请填写处理结果说明"
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleResolve}>
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
