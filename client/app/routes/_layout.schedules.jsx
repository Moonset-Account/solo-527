import { useState, useEffect } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function Schedules() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadSchedules();
  }, [filters]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      
      const data = await apiRequest(`/schedules?${params.toString()}`);
      setSchedules(data.schedules);
      setPagination(data.pagination);
    } catch (error) {
      console.error('加载排班失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '待开始', class: 'badge-gray' },
      active: { text: '进行中', class: 'badge-primary' },
      completed: { text: '已完成', class: 'badge-success' },
      cancelled: { text: '已取消', class: 'badge-danger' }
    };
    return statusMap[status] || { text: status, class: 'badge-gray' };
  };

  const getVolunteerStatusBadge = (status) => {
    const map = {
      signed_up: { text: '已报名', class: 'badge-gray' },
      confirmed: { text: '已确认', class: 'badge-primary' },
      checked_in: { text: '已签到', class: 'badge-success' },
      checked_out: { text: '已签退', class: 'badge-success' },
      cancelled: { text: '已取消', class: 'badge-danger' },
      absent: { text: '缺席', class: 'badge-danger' }
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
          <label className="filter-label">状态</label>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="pending">待开始</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div className="filter-item" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            + 新增排班
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>暂无排班数据</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>班次</th>
                    <th>活动</th>
                    <th>时间</th>
                    <th>人数</th>
                    <th>状态</th>
                    <th>队长</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(schedule => {
                    const activeVolunteers = schedule.volunteers?.filter(
                      v => v.status !== 'cancelled'
                    ).length || 0;
                    
                    return (
                      <tr key={schedule._id}>
                        <td>
                          {format(new Date(schedule.date), 'yyyy-MM-dd')}
                        </td>
                        <td>
                          <Link to={`/schedules/${schedule._id}`}>
                            {schedule.shiftName}
                          </Link>
                        </td>
                        <td className="hide-mobile">
                          {schedule.activityId?.title || '-'}
                        </td>
                        <td>
                          {schedule.startTime} - {schedule.endTime}
                        </td>
                        <td>
                          {activeVolunteers}/{schedule.maxVolunteers}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(schedule.status).class}`}>
                            {getStatusBadge(schedule.status).text}
                          </span>
                        </td>
                        <td className="hide-mobile">
                          {schedule.teamLeader?.name || '-'}
                        </td>
                        <td>
                          <Link 
                            to={`/schedules/${schedule._id}`}
                            className="btn btn-sm btn-secondary"
                          >
                            详情
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
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
