import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import { apiFetch, apiFormData } from '~/utils/api';
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

const STATUS_TRANSITIONS: Record<string, { value: string; label: string; role?: string }[]> = {
  pending_confirm: [
    { value: 'pending_rectify', label: '确认问题，安排整改', role: 'supervisor' },
    { value: 'false_positive', label: '标记为误报', role: 'supervisor' },
    { value: 'closed', label: '关闭问题', role: 'supervisor' }
  ],
  pending_rectify: [
    { value: 'reviewed', label: '提交整改，申请复查', role: 'store_manager' },
    { value: 'closed', label: '直接关闭', role: 'supervisor' }
  ],
  reviewed: [
    { value: 'pending_rectify', label: '复查不通过，重新整改', role: 'supervisor' },
    { value: 'closed', label: '复查通过，关闭问题', role: 'supervisor' }
  ],
  false_positive: [
    { value: 'closed', label: '关闭问题', role: 'supervisor' }
  ],
  closed: []
};

export default function IssueDetail() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comment, setComment] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [photoType, setPhotoType] = useState('original');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [issueId]);

  useEffect(() => {
    if (issue?.store_id) {
      loadManagers();
    }
  }, [issue?.store_id]);

  async function loadData() {
    setLoading(true);
    try {
      const [detailData, storesData] = await Promise.all([
        apiFetch(`/api/issues/${issueId}`),
        apiFetch('/api/stores')
      ]);
      setIssue(detailData.issue);
      setPhotos(detailData.photos);
      setLogs(detailData.logs);
      setStores(storesData);
    } catch (error) {
      console.error('Load issue error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadManagers() {
    try {
      const data = await apiFetch(`/api/stores/${issue.store_id}/managers`);
      setManagers(data);
    } catch (error) {
      console.error('Load managers error:', error);
    }
  }

  async function handleStatusChange() {
    if (!selectedStatus) return;
    
    setSubmitting(true);
    try {
      await apiFetch(`/api/issues/${issueId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: selectedStatus,
          comment,
          review_failure_reason: selectedStatus === 'pending_rectify' && issue?.status === 'reviewed' ? reviewReason : undefined,
          assigned_to: selectedStatus === 'pending_rectify' ? assignedTo : undefined
        })
      });
      
      setShowStatusModal(false);
      setSelectedStatus('');
      setComment('');
      setReviewReason('');
      setAssignedTo('');
      loadData();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhotoUpload() {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('photo_type', photoType);
      Array.from(selectedFiles).forEach(file => {
        formData.append('photos', file);
      });
      
      await apiFormData(`/api/photos/${issueId}`, formData);
      
      setShowPhotoModal(false);
      setSelectedFiles(null);
      loadData();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const availableTransitions = STATUS_TRANSITIONS[issue?.status] || [];
  const allowedTransitions = availableTransitions.filter(
    t => !t.role || t.role === user?.role
  );

  const canUploadPhoto = user?.role === 'supervisor' || 
    (user?.role === 'store_manager' && issue?.status === 'pending_rectify');

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!issue) {
    return <div className="text-center" style={{ padding: '40px' }}>问题不存在</div>;
  }

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <button 
            className="btn btn-default btn-sm" 
            onClick={() => navigate(-1)}
            style={{ marginBottom: '12px' }}
          >
            ← 返回
          </button>
          <h2>{issue.title}</h2>
          <div className="flex gap-4 mt-2">
            <span className={`status-badge status-${issue.status}`}>
              {statusLabels[issue.status]}
            </span>
            {issue.is_overdue && (
              <span className="status-badge" style={{ background: '#fff1f0', color: '#ff4d4f' }}>
                ⚠️ 已逾期
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {canUploadPhoto && (
            <button 
              className="btn btn-default"
              onClick={() => setShowPhotoModal(true)}
            >
              📷 上传照片
            </button>
          )}
          {allowedTransitions.length > 0 && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowStatusModal(true)}
            >
              更新状态
            </button>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card mb-4">
            <h3 className="mb-4">基本信息</h3>
            <div style={{ lineHeight: '2' }}>
              <div className="flex">
                <span className="text-muted" style={{ width: '100px' }}>问题类型：</span>
                <span>{categoryLabels[issue.category] || issue.category}</span>
              </div>
              <div className="flex">
                <span className="text-muted" style={{ width: '100px' }}>所属门店：</span>
                <span>{issue.store_name} ({issue.store_code})</span>
              </div>
              <div className="flex">
                <span className="text-muted" style={{ width: '100px' }}>位置：</span>
                <span>{issue.location || '-'}</span>
              </div>
              {issue.freezer_temperature && (
                <div className="flex">
                  <span className="text-muted" style={{ width: '100px' }}>冷柜温度：</span>
                  <span style={{ color: '#ff4d4f' }}>{issue.freezer_temperature}°C</span>
                </div>
              )}
              <div className="flex">
                <span className="text-muted" style={{ width: '100px' }}>创建人：</span>
                <span>{issue.creator_name}</span>
              </div>
              <div className="flex">
                <span className="text-muted" style={{ width: '100px' }}>负责人：</span>
                <span>{issue.assignee_name || '-'}</span>
              </div>
              <div className="flex">
                <span className="text-muted" style={{ width: '100px' }}>创建时间：</span>
                <span>{new Date(issue.created_at).toLocaleString('zh-CN')}</span>
              </div>
              {issue.due_date && (
                <div className="flex">
                  <span className="text-muted" style={{ width: '100px' }}>整改期限：</span>
                  <span className={issue.is_overdue ? 'overdue' : ''}>
                    {new Date(issue.due_date).toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {issue.description && (
            <div className="card">
              <h3 className="mb-4">问题描述</h3>
              <p style={{ lineHeight: '1.8', color: '#555' }}>{issue.description}</p>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h3 className="mb-4">照片记录</h3>
            {photos.length === 0 ? (
              <div className="text-muted text-center" style={{ padding: '20px' }}>
                暂无照片
              </div>
            ) : (
              <div className="photo-grid">
                {photos.map(photo => (
                  <div key={photo.id} className="photo-item" title={photo.file_name}>
                    <img 
                      src={`/api/photos/${photo.id}`} 
                      alt={photo.file_name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="mb-4">操作日志</h3>
        {logs.length === 0 ? (
          <div className="text-muted text-center" style={{ padding: '20px' }}>
            暂无操作记录
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="log-item">
              <div className="log-meta">
                {log.creator_name} · {new Date(log.created_at).toLocaleString('zh-CN')}
              </div>
              <div>
                {log.from_status && (
                  <span className="status-badge status-{log.from_status}" style={{ marginRight: '8px' }}>
                    {statusLabels[log.from_status]}
                  </span>
                )}
                {log.from_status && ' → '}
                {log.to_status && (
                  <span className={`status-badge status-${log.to_status}`}>
                    {statusLabels[log.to_status]}
                  </span>
                )}
                {log.comment && <span style={{ marginLeft: '12px' }}>{log.comment}</span>}
              </div>
              {log.review_failure_reason && (
                <div style={{ marginTop: '8px', color: '#ff4d4f', fontSize: '13px' }}>
                  复查不通过原因：{log.review_failure_reason}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showStatusModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h3 className="mb-4">更新状态</h3>
            
            <div className="form-group">
              <label className="form-label">目标状态</label>
              <select 
                className="form-select"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option value="">请选择</option>
                {allowedTransitions.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {selectedStatus === 'pending_rectify' && issue.status !== 'reviewed' && (
              <div className="form-group">
                <label className="form-label">整改负责人</label>
                <select 
                  className="form-select"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                >
                  <option value="">请选择负责人</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedStatus === 'pending_rectify' && issue.status === 'reviewed' && (
              <div className="form-group">
                <label className="form-label">复查不通过原因</label>
                <textarea 
                  className="form-textarea"
                  value={reviewReason}
                  onChange={e => setReviewReason(e.target.value)}
                  placeholder="请说明复查不通过的原因"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea 
                className="form-textarea"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="请输入备注信息（可选）"
              />
            </div>

            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-default"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus('');
                  setComment('');
                }}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleStatusChange}
                disabled={submitting || !selectedStatus}
              >
                {submitting ? '提交中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h3 className="mb-4">上传照片</h3>
            
            <div className="form-group">
              <label className="form-label">照片类型</label>
              <select 
                className="form-select"
                value={photoType}
                onChange={e => setPhotoType(e.target.value)}
              >
                <option value="original">问题照片</option>
                <option value="rectification">整改照片</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">选择照片</label>
              <input 
                type="file"
                multiple
                accept="image/*"
                className="form-input"
                onChange={e => setSelectedFiles(e.target.files)}
              />
              <p className="text-sm text-muted" style={{ marginTop: '4px' }}>
                支持 JPG、PNG、GIF 格式，单张不超过 10MB
              </p>
            </div>

            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-default"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedFiles(null);
                }}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handlePhotoUpload}
                disabled={submitting || !selectedFiles || selectedFiles.length === 0}
              >
                {submitting ? '上传中...' : '上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
