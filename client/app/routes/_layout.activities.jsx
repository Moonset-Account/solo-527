import { useState, useEffect } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function Activities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadActivities();
  }, [filters]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      
      const data = await apiRequest(`/activities?${params.toString()}`);
      setActivities(data.activities);
      setPagination(data.pagination);
    } catch (error) {
      console.error('加载活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: { text: '草稿', class: 'badge-gray' },
      published: { text: '已发布', class: 'badge-primary' },
      ongoing: { text: '进行中', class: 'badge-success' },
      completed: { text: '已完成', class: 'badge-success' },
      cancelled: { text: '已取消', class: 'badge-danger' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
  };

  const getTypeText = (type) => {
    const map = {
      community: '社区服务',
      education: '教育支持',
      environment: '环境保护',
      medical: '医疗健康',
      elderly: '敬老服务',
      other: '其他'
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
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="ongoing">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
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
            <option value="community">社区服务</option>
            <option value="education">教育支持</option>
            <option value="environment">环境保护</option>
            <option value="medical">医疗健康</option>
            <option value="elderly">敬老服务</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div className="filter-item" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            + 新建活动
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <p>暂无活动数据</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>活动名称</th>
                    <th>类型</th>
                    <th className="hide-mobile">地点</th>
                    <th>时间</th>
                    <th>人数</th>
                    <th>状态</th>
                    <th>公开</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(activity => (
                    <tr key={activity._id}>
                      <td>
                        <Link to={`/activities/${activity._id}`}>
                          {activity.title}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {getTypeText(activity.type)}
                        </span>
                      </td>
                      <td className="hide-mobile">{activity.location || '-'}</td>
                      <td>
                        {format(new Date(activity.startDate), 'MM-dd')} ~ {format(new Date(activity.endDate), 'MM-dd')}
                      </td>
                      <td>{activity.maxVolunteers}人</td>
                      <td>
                        <span className={`badge ${getStatusBadge(activity.status).class}`}>
                          {getStatusBadge(activity.status).text}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${activity.isPublic ? 'badge-success' : 'badge-gray'}`}>
                          {activity.isPublic ? '是' : '否'}
                        </span>
                      </td>
                      <td>
                        <Link 
                          to={`/activities/${activity._id}`}
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
