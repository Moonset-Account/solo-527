import { useState, useEffect } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function Donations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadDonations();
  }, [filters]);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      
      const data = await apiRequest(`/donations?${params.toString()}`);
      setDonations(data.donations);
      setStats(data.stats || {});
      setPagination(data.pagination);
    } catch (error) {
      console.error('加载捐赠明细失败:', error);
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
      money: '现金',
      material: '物资',
      service: '服务'
    };
    return map[type] || type;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleReceive = async (id) => {
    if (!confirm('确认接收该捐赠？')) return;
    try {
      await apiRequest(`/donations/${id}/receive`, {
        method: 'PUT'
      });
      loadDonations();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePublic = async (id, isPublic) => {
    try {
      await apiRequest(`/donations/${id}/public`, {
        method: 'PUT',
        body: JSON.stringify({ isPublic })
      });
      loadDonations();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>累计捐赠金额</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
            ¥{stats.totalAmount?.toLocaleString() || 0}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>现金捐赠</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
            {stats.moneyCount || 0} 笔
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>待确认</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
            {stats.pending?.count || 0} 笔
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label className="filter-label">状态</label>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="received">已接收</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
        <div className="filter-item">
          <label className="filter-label">类型</label>
          <select 
            className="form-select"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">全部类型</option>
            <option value="money">现金</option>
            <option value="material">物资</option>
            <option value="service">服务</option>
          </select>
        </div>
        <div className="filter-item" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            + 登记捐赠
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : donations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💝</div>
            <p>暂无捐赠记录</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>捐赠方</th>
                    <th>类型</th>
                    <th>金额/物资</th>
                    <th>关联活动</th>
                    <th>状态</th>
                    <th className="hide-mobile">公开</th>
                    <th className="hide-mobile">时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map(donation => (
                    <tr key={donation._id}>
                      <td>
                        <Link to={`/donations/${donation._id}`}>
                          {donation.donorName}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {getTypeText(donation.type)}
                        </span>
                      </td>
                      <td>
                        {donation.type === 'money' 
                          ? `¥${donation.amount?.toLocaleString()}`
                          : donation.items?.length > 0
                            ? `${donation.items.length} 项物资`
                            : donation.description?.slice(0, 20)
                        }
                      </td>
                      <td className="hide-mobile">
                        {donation.activityId?.title || '-'}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(donation.status).class}`}>
                          {getStatusBadge(donation.status).text}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        <span className={`badge ${donation.isPublic ? 'badge-success' : 'badge-gray'}`}>
                          {donation.isPublic ? '公开' : '未公开'}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {format(new Date(donation.createdAt), 'MM-dd')}
                      </td>
                      <td>
                        {donation.status === 'pending' && (
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleReceive(donation._id)}
                            style={{ marginRight: '0.25rem' }}
                          >
                            接收
                          </button>
                        )}
                        {donation.status === 'received' && (
                          <button 
                            className={`btn btn-sm ${donation.isPublic ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handlePublic(donation._id, !donation.isPublic)}
                          >
                            {donation.isPublic ? '取消公开' : '公开'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={filters.page <= 1}
                >
                  上一页
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, filters.page - 3), Math.min(pagination.totalPages, filters.page + 2))
                  .map(page => (
                    <button
                      key={page}
                      className={page === filters.page ? 'active' : ''}
                      onClick={() => handleFilterChange('page', page)}
                    >
                      {page}
                    </button>
                  ))}
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={filters.page >= pagination.totalPages}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
