import { useState, useEffect } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function Volunteers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    team: searchParams.get('team') || '',
    keyword: searchParams.get('keyword') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadVolunteers();
  }, [filters]);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.team) params.set('team', filters.team);
      if (filters.keyword) params.set('keyword', filters.keyword);
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      
      const data = await apiRequest(`/volunteers?${params.toString()}`);
      setVolunteers(data.volunteers);
      setPagination(data.pagination);
    } catch (error) {
      console.error('加载志愿者失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { text: '活跃', class: 'badge-success' },
      inactive: { text: '非活跃', class: 'badge-gray' },
      suspended: { text: '暂停', class: 'badge-danger' }
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

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-item">
          <label className="filter-label">搜索</label>
          <input 
            type="text"
            className="form-input"
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            placeholder="姓名/手机号"
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">状态</label>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
            <option value="suspended">暂停</option>
          </select>
        </div>
        <div className="filter-item" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            + 添加志愿者
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : volunteers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>暂无志愿者数据</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th className="hide-mobile">电话</th>
                    <th>团队</th>
                    <th className="hide-mobile">技能</th>
                    <th>服务时长</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map(volunteer => (
                    <tr key={volunteer._id}>
                      <td>{volunteer.name}</td>
                      <td className="hide-mobile">{volunteer.phone}</td>
                      <td>{volunteer.team || '-'}</td>
                      <td className="hide-mobile">
                        {volunteer.skills?.slice(0, 2).map((skill, idx) => (
                          <span key={idx} className="badge badge-info" style={{ marginRight: '0.25rem' }}>
                            {skill}
                          </span>
                        ))}
                        {volunteer.skills?.length > 2 && (
                          <span className="badge badge-gray">+{volunteer.skills.length - 2}</span>
                        )}
                      </td>
                      <td>{volunteer.totalHours || 0}h</td>
                      <td>
                        <span className={`badge ${getStatusBadge(volunteer.status).class}`}>
                          {getStatusBadge(volunteer.status).text}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary">
                          详情
                        </button>
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
