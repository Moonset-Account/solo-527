import { useState, useEffect } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function CheckIns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadCheckIns();
  }, [filters]);

  const loadCheckIns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      
      const data = await apiRequest(`/checkins?${params.toString()}`);
      setCheckIns(data.checkIns);
      setPagination(data.pagination);
    } catch (error) {
      console.error('加载签到记录失败:', error);
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

  const handleCheckOut = async (id) => {
    if (!confirm('确认签退？')) return;
    try {
      await apiRequest(`/checkins/${id}/checkout`, {
        method: 'PUT'
      });
      loadCheckIns();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-item">
          <label className="filter-label">状态</label>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="checked_in">已签到</option>
            <option value="checked_out">已签退</option>
            <option value="absent">缺席</option>
            <option value="late">迟到</option>
            <option value="leave_early">早退</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : checkIns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p>暂无签到记录</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>志愿者</th>
                    <th>班次</th>
                    <th className="hide-mobile">活动</th>
                    <th>签到时间</th>
                    <th className="hide-mobile">签退时间</th>
                    <th>时长</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {checkIns.map(checkIn => (
                    <tr key={checkIn._id}>
                      <td>
                        <Link to={`/checkins/${checkIn._id}`}>
                          {checkIn.volunteerId?.name || '-'}
                        </Link>
                      </td>
                      <td>{checkIn.scheduleId?.shiftName || '-'}</td>
                      <td className="hide-mobile">{checkIn.activityId?.title || '-'}</td>
                      <td>
                        {checkIn.checkInTime 
                          ? format(new Date(checkIn.checkInTime), 'MM-dd HH:mm')
                          : '-'
                        }
                      </td>
                      <td className="hide-mobile">
                        {checkIn.checkOutTime 
                          ? format(new Date(checkIn.checkOutTime), 'MM-dd HH:mm')
                          : '-'
                        }
                      </td>
                      <td>{checkIn.hours ? `${checkIn.hours}h` : '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(checkIn.status).class}`}>
                          {getStatusBadge(checkIn.status).text}
                        </span>
                      </td>
                      <td>
                        {checkIn.status === 'checked_in' && (
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleCheckOut(checkIn._id)}
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
