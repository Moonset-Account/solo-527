import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function DonationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [formData, setFormData] = useState({
    publicNote: ''
  });

  useEffect(() => {
    loadDonation();
  }, [id]);

  const loadDonation = async () => {
    try {
      const data = await apiRequest(`/donations/${id}`);
      setDonation(data.donation);
    } catch (error) {
      console.error('加载捐赠详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { text: '待确认', class: 'badge-warning' },
      confirmed: { text: '已确认', class: 'badge-primary' },
      received: { text: '已接收', class: 'badge-success' },
      rejected: { text: '已驳回', class: 'badge-danger' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
  };

  const getTypeText = (type) => {
    const map = {
      money: '现金捐赠',
      material: '物资捐赠',
      service: '服务捐赠'
    };
    return map[type] || type;
  };

  const getDonorTypeText = (type) => {
    const map = {
      individual: '个人',
      organization: '组织机构',
      enterprise: '企业'
    };
    return map[type] || type;
  };

  const handleReceive = async () => {
    if (!confirm('确认接收该捐赠？')) return;
    try {
      await apiRequest(`/donations/${id}/receive`, {
        method: 'PUT'
      });
      loadDonation();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePublicToggle = async (isPublic) => {
    if (isPublic && !donation.isPublic) {
      setFormData({ publicNote: '' });
      setShowPublicModal(true);
    } else {
      try {
        await apiRequest(`/donations/${id}/public`, {
          method: 'PUT',
          body: JSON.stringify({ isPublic })
        });
        loadDonation();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleConfirmPublic = async () => {
    try {
      await apiRequest(`/donations/${id}/public`, {
        method: 'PUT',
        body: JSON.stringify({ 
          isPublic: true,
          publicNote: formData.publicNote 
        })
      });
      setShowPublicModal(false);
      loadDonation();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  if (!donation) {
    return <div className="empty-state">捐赠记录不存在</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/donations" className="btn btn-sm btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">{donation.donorName} - {getTypeText(donation.type)}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge ${donation.isPublic ? 'badge-success' : 'badge-gray'}`}>
              {donation.isPublic ? '已公开' : '未公开'}
            </span>
            <span className={`badge ${getStatusBadge(donation.status).class}`}>
              {getStatusBadge(donation.status).text}
            </span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">捐赠方类型</div>
            <div className="detail-value">{getDonorTypeText(donation.donorType)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">联系电话</div>
            <div className="detail-value">{donation.donorPhone || '-'}</div>
          </div>
          {donation.type === 'money' && (
            <div className="detail-item">
              <div className="detail-label">捐赠金额</div>
              <div className="detail-value" style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '700' }}>
                ¥{donation.amount?.toLocaleString()}
              </div>
            </div>
          )}
          <div className="detail-item">
            <div className="detail-label">关联活动</div>
            <div className="detail-value">{donation.activityId?.title || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">捐赠时间</div>
            <div className="detail-value">
              {format(new Date(donation.createdAt), 'yyyy-MM-dd HH:mm')}
            </div>
          </div>
          {donation.receiptNumber && (
            <div className="detail-item">
              <div className="detail-label">收据编号</div>
              <div className="detail-value">{donation.receiptNumber}</div>
            </div>
          )}
          {donation.receivedBy && (
            <div className="detail-item">
              <div className="detail-label">接收人</div>
              <div className="detail-value">{donation.receivedBy?.name || '-'}</div>
            </div>
          )}
        </div>

        {donation.description && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">捐赠说明</div>
            <p style={{ marginTop: '0.5rem' }}>{donation.description}</p>
          </div>
        )}

        {donation.type === 'material' && donation.items?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">物资清单</div>
            <div className="table-container" style={{ marginTop: '0.5rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>物品名称</th>
                    <th>数量</th>
                    <th>单位</th>
                    <th>估值</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {donation.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td>¥{item.value?.toLocaleString() || 0}</td>
                      <td>{item.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {donation.publicNote && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">公开说明</div>
            <p style={{ marginTop: '0.5rem' }}>{donation.publicNote}</p>
          </div>
        )}

        {donation.remark && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">内部备注</div>
            <p style={{ marginTop: '0.5rem' }}>{donation.remark}</p>
          </div>
        )}

        {donation.attachments?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">附件凭证</div>
            <div className="attachment-list" style={{ marginTop: '0.5rem' }}>
              {donation.attachments.map((att, idx) => (
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

        {donation.sourceOrderId && (
          <div style={{ marginTop: '1rem' }}>
            <div className="detail-label">关联原单</div>
            <Link to={`/${donation.sourceOrderType || 'activities'}/${donation.sourceOrderId}`}>
              查看原单记录 →
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {donation.status === 'pending' && (
          <button className="btn btn-success" onClick={handleReceive}>
            确认接收
          </button>
        )}
        {donation.status === 'received' && (
          <button 
            className={`btn ${donation.isPublic ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => handlePublicToggle(!donation.isPublic)}
          >
            {donation.isPublic ? '取消公开' : '设为公开'}
          </button>
        )}
      </div>

      {showPublicModal && (
        <div className="modal-overlay" onClick={() => setShowPublicModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">公开捐赠</h3>
              <button className="modal-close" onClick={() => setShowPublicModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">公开说明（可选）</label>
              <textarea 
                className="form-textarea"
                value={formData.publicNote}
                onChange={(e) => setFormData(prev => ({ ...prev, publicNote: e.target.value }))}
                placeholder="感谢语或公开说明"
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPublicModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleConfirmPublic}>
                确认公开
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
