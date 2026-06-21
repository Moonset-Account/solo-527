import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    reviewComment: '',
    handlePlan: '',
    closeNote: ''
  });

  useEffect(() => {
    loadFeedback();
  }, [id]);

  const loadFeedback = async () => {
    try {
      const data = await apiRequest(`/feedbacks/${id}`);
      setFeedback(data.feedback);
    } catch (error) {
      console.error('加载反馈详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      await apiRequest(`/feedbacks/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          status: formData.status,
          reviewComment: formData.reviewComment
        })
      });
      setShowReviewModal(false);
      loadFeedback();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleHandle = async () => {
    try {
      await apiRequest(`/feedbacks/${id}/handle`, {
        method: 'PUT',
        body: JSON.stringify({
          handlePlan: formData.handlePlan,
          status: 'handling'
        })
      });
      setShowHandleModal(false);
      loadFeedback();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleClose = async () => {
    try {
      await apiRequest(`/feedbacks/${id}/close`, {
        method: 'PUT',
        body: JSON.stringify({
          closeNote: formData.closeNote
        })
      });
      setShowCloseModal(false);
      loadFeedback();
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { text: '待审核', class: 'badge-warning' },
      reviewing: { text: '审核中', class: 'badge-primary' },
      resolved: { text: '已解决', class: 'badge-success' },
      rejected: { text: '已驳回', class: 'badge-danger' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
  };

  const getPriorityBadge = (priority) => {
    const map = {
      low: { text: '低', class: 'badge-gray' },
      medium: { text: '中', class: 'badge-primary' },
      high: { text: '高', class: 'badge-warning' },
      urgent: { text: '紧急', class: 'badge-danger' }
    };
    return map[priority] || { text: priority, class: 'badge-gray' };
  };

  const getTypeText = (type) => {
    const map = {
      suggestion: '建议',
      complaint: '投诉',
      praise: '表扬',
      other: '其他'
    };
    return map[type] || type;
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  if (!feedback) {
    return <div className="empty-state">反馈不存在</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/feedbacks" className="btn btn-sm btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">{feedback.title}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge ${getPriorityBadge(feedback.priority).class}`}>
              {getPriorityBadge(feedback.priority).text}优先级
            </span>
            <span className={`badge ${getStatusBadge(feedback.status).class}`}>
              {getStatusBadge(feedback.status).text}
            </span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">类型</div>
            <div className="detail-value">{getTypeText(feedback.type)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">提交人</div>
            <div className="detail-value">{feedback.volunteerId?.name || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">关联活动</div>
            <div className="detail-value">{feedback.activityId?.title || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">提交时间</div>
            <div className="detail-value">
              {format(new Date(feedback.createdAt), 'yyyy-MM-dd HH:mm')}
            </div>
          </div>
          {feedback.rating && (
            <div className="detail-item">
              <div className="detail-label">评分</div>
              <div className="detail-value">{'⭐'.repeat(feedback.rating)}</div>
            </div>
          )}
          {feedback.sourceOrderId && (
            <div className="detail-item">
              <div className="detail-label">关联原单</div>
              <div className="detail-value">
                <Link to={`/${feedback.sourceOrderType || 'schedules'}/${feedback.sourceOrderId}`}>
                  查看原单 →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="detail-label">反馈内容</div>
          <p style={{ marginTop: '0.5rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {feedback.content}
          </p>
        </div>

        {feedback.attachments?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">附件</div>
            <div className="attachment-list" style={{ marginTop: '0.5rem' }}>
              {feedback.attachments.map((att, idx) => (
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

      {feedback.reviewComment && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">审核意见</h3>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{feedback.reviewComment}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            审核人：{feedback.reviewer?.name || '-'} | 
            审核时间：{feedback.reviewedAt ? format(new Date(feedback.reviewedAt), 'yyyy-MM-dd HH:mm') : '-'}
          </div>
        </div>
      )}

      {feedback.handlePlan && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">处理方案</h3>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{feedback.handlePlan}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            处理人：{feedback.handler?.name || '-'} | 
            处理时间：{feedback.handledAt ? format(new Date(feedback.handledAt), 'yyyy-MM-dd HH:mm') : '-'}
          </div>
        </div>
      )}

      {feedback.closeNote && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">关闭说明</h3>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{feedback.closeNote}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            关闭人：{feedback.closedBy?.name || '-'} | 
            关闭时间：{feedback.closedAt ? format(new Date(feedback.closedAt), 'yyyy-MM-dd HH:mm') : '-'}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {feedback.status === 'pending' && (
          <button 
            className="btn btn-primary"
            onClick={() => {
              setFormData(prev => ({ ...prev, status: 'reviewing', reviewComment: '' }));
              setShowReviewModal(true);
            }}
          >
            开始审核
          </button>
        )}
        {(feedback.status === 'reviewing' || feedback.status === 'handling') && (
          <button 
            className="btn btn-success"
            onClick={() => {
              setFormData(prev => ({ ...prev, handlePlan: '' }));
              setShowHandleModal(true);
            }}
          >
            填写处理方案
          </button>
        )}
        {(feedback.status === 'reviewing' || feedback.status === 'handling') && (
          <button 
            className="btn btn-warning"
            onClick={() => {
              setFormData(prev => ({ ...prev, closeNote: '' }));
              setShowCloseModal(true);
            }}
          >
            关闭反馈
          </button>
        )}
      </div>

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">审核反馈</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">审核状态</label>
              <select 
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="reviewing">审核中</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">审核意见</label>
              <textarea 
                className="form-textarea"
                value={formData.reviewComment}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewComment: e.target.value }))}
                placeholder="请输入审核意见"
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleReview}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showHandleModal && (
        <div className="modal-overlay" onClick={() => setShowHandleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">处理方案</h3>
              <button className="modal-close" onClick={() => setShowHandleModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">处理方案</label>
              <textarea 
                className="form-textarea"
                value={formData.handlePlan}
                onChange={(e) => setFormData(prev => ({ ...prev, handlePlan: e.target.value }))}
                placeholder="请详细描述处理方案"
              />
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
              <h3 className="modal-title">关闭反馈</h3>
              <button className="modal-close" onClick={() => setShowCloseModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">处理说明</label>
              <textarea 
                className="form-textarea"
                value={formData.closeNote}
                onChange={(e) => setFormData(prev => ({ ...prev, closeNote: e.target.value }))}
                placeholder="请输入处理结果说明（关闭前请补充）"
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
