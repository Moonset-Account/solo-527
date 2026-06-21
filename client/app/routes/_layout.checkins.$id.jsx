import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@remix-run/react';
import { apiRequest, uploadFile } from '~/utils/api';
import { format } from 'date-fns';

export default function CheckInDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCheckIn();
  }, [id]);

  const loadCheckIn = async () => {
    try {
      const data = await apiRequest(`/checkins/${id}`);
      setCheckIn(data.checkIn);
    } catch (error) {
      console.error('加载签到详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      checked_in: { text: '已签到', class: 'badge-primary' },
      checked_out: { text: '已签退', class: 'badge-success' },
      absent: { text: '缺席', class: 'badge-danger' },
      leave_early: { text: '早退', class: 'badge-warning' },
      late: { text: '迟到', class: 'badge-warning' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
  };

  const handleCheckOut = async () => {
    if (!confirm('确认签退？')) return;
    try {
      await apiRequest(`/checkins/${id}/checkout`, {
        method: 'PUT'
      });
      loadCheckIn();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile(file);
      alert('上传成功');
      loadCheckIn();
    } catch (error) {
      alert('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  if (!checkIn) {
    return <div className="empty-state">签到记录不存在</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/checkins" className="btn btn-sm btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            {checkIn.volunteerId?.name} - 签到详情
          </h2>
          <span className={`badge ${getStatusBadge(checkIn.status).class}`}>
            {getStatusBadge(checkIn.status).text}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">志愿者</div>
            <div className="detail-value">{checkIn.volunteerId?.name || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">联系电话</div>
            <div className="detail-value">{checkIn.volunteerId?.phone || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">所属团队</div>
            <div className="detail-value">{checkIn.volunteerId?.team || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">所属活动</div>
            <div className="detail-value">{checkIn.activityId?.title || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">班次</div>
            <div className="detail-value">{checkIn.scheduleId?.shiftName || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">服务时长</div>
            <div className="detail-value">{checkIn.hours ? `${checkIn.hours} 小时` : '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">签到时间</div>
            <div className="detail-value">
              {checkIn.checkInTime ? format(new Date(checkIn.checkInTime), 'yyyy-MM-dd HH:mm') : '-'}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">签退时间</div>
            <div className="detail-value">
              {checkIn.checkOutTime ? format(new Date(checkIn.checkOutTime), 'yyyy-MM-dd HH:mm') : '-'}
            </div>
          </div>
        </div>

        {checkIn.checkInLocation?.address && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">签到地点</div>
            <p style={{ marginTop: '0.5rem' }}>{checkIn.checkInLocation.address}</p>
          </div>
        )}

        {checkIn.checkOutLocation?.address && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">签退地点</div>
            <p style={{ marginTop: '0.5rem' }}>{checkIn.checkOutLocation.address}</p>
          </div>
        )}

        {checkIn.remark && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">备注</div>
            <p style={{ marginTop: '0.5rem' }}>{checkIn.remark}</p>
          </div>
        )}

        {checkIn.photos?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">现场照片</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
              {checkIn.photos.map((photo, idx) => (
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
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {checkIn.status === 'checked_in' && (
          <button className="btn btn-success" onClick={handleCheckOut}>
            签退
          </button>
        )}
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          {uploading ? '上传中...' : '上传照片'}
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
