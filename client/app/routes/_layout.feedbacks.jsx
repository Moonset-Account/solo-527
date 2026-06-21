import { useState, useEffect } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function Feedbacks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadFeedbacks();
  }, [filters]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      
      const data = await apiRequest(`/feedbacks?${params.toString()}`);
      setFeedbacks(data.feedbacks);
      setPagination(data.pagination);
    } catch (error) {
      console.error('加载反馈失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { text: '待审核', class: 'badge-warning' },
      reviewing: { text: '审核中', class: 'badge-primary' },
      handling: { text: '处理中', class: 'badge-info' },
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
            <option value="pending">待审核</option>
            <option value="reviewing">审核中</option>
            <option value="handling">处理中</option>
            <option value="resolved">已解决</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
        <div className="filter-item">
          <label className="filter-label">优先级</label>
          <select 
            className="form-select"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">全部优先级</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </div>
        <div className="filter-item" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            + 提交反馈
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : feedbacks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <p>暂无反馈记录</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>类型</th>
                    <th className="hide-mobile">志愿者</th>
                    <th>优先级</th>
                    <th>状态</th>
                    <th className="hide-mobile">提交时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map(feedback => (
                    <tr key={feedback._id}>
                      <td>
                        <Link to={`/feedbacks/${feedback._id}`}>
                          {feedback.title}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {getTypeText(feedback.type)}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {feedback.volunteerId?.name || '-'}
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadge(feedback.priority).class}`}>
                          {getPriorityBadge(feedback.priority).text}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(feedback.status).class}`}>
                          {getStatusBadge(feedback.status).text}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {format(new Date(feedback.createdAt), 'MM-dd HH:mm')}
                      </td>
                      <td>
                        <Link 
                          to={`/feedbacks/${feedback._id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          {feedback.status === 'pending' ? '审核' : '查看'}
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
