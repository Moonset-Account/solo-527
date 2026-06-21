import { useState, useEffect } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function Absences() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    impactLevel: searchParams.get('impactLevel') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadAbsences();
  }, [filters]);

  const loadAbsences = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.impactLevel) params.set('impactLevel', filters.impactLevel);
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      
      const data = await apiRequest(`/absences?${params.toString()}`);
      setAbsences(data.absences);
      setPagination(data.pagination);
    } catch (error) {
      console.error('加载缺席记录失败:', error);
    } finally {
      setLoading(false);
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
          <label className="filter-label">状态</label>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="reported">已上报</option>
            <option value="handling">处理中</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <div className="filter-item">
          <label className="filter-label">影响程度</label>
          <select 
            className="form-select"
            value={filters.impactLevel}
            onChange={(e) => handleFilterChange('impactLevel', e.target.value)}
          >
            <option value="">全部</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">严重</option>
          </select>
        </div>
        <div className="filter-item" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            + 上报缺席
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : absences.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <p>暂无缺席记录</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>志愿者</th>
                    <th>类型</th>
                    <th className="hide-mobile">班次</th>
                    <th>影响</th>
                    <th>责任人</th>
                    <th>状态</th>
                    <th className="hide-mobile">上报时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.map(absence => (
                    <tr key={absence._id}>
                      <td>
                        <Link to={`/absences/${absence._id}`}>
                          {absence.volunteerId?.name || '-'}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {getTypeText(absence.type)}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {absence.scheduleId?.shiftName || '-'}
                      </td>
                      <td>
                        <span className={`badge ${getImpactBadge(absence.impactLevel).class}`}>
                          {getImpactBadge(absence.impactLevel).text}
                        </span>
                      </td>
                      <td>{absence.responsiblePersonName || absence.responsiblePerson?.name || '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(absence.status).class}`}>
                          {getStatusBadge(absence.status).text}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {format(new Date(absence.createdAt), 'MM-dd HH:mm')}
                      </td>
                      <td>
                        <Link 
                          to={`/absences/${absence._id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          详情
                        </Link>
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
