import { useState, useEffect } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiRequest } from '~/utils/api';
import { format } from 'date-fns';

export default function Alerts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'active',
    severity: searchParams.get('severity') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadAlerts();
  }, [filters]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.severity) params.set('severity', filters.severity);
      params.set('page', filters.page);
      params.set('limit', filters.limit);
      
      const data = await apiRequest(`/alerts?${params.toString()}`);
      setAlerts(data.alerts);
      setStats(data.stats || {});
      setPagination(data.pagination);
    } catch (error) {
      console.error('加载预警失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const map = {
      info: { text: '提示', class: 'badge-info' },
      warning: { text: '警告', class: 'badge-warning' },
      danger: { text: '严重', class: 'badge-danger' },
      critical: { text: '紧急', class: 'badge-danger' }
    };
    return map[severity] || { text: severity, class: 'badge-gray' };
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { text: '活跃', class: 'badge-danger' },
      acknowledged: { text: '已确认', class: 'badge-warning' },
      resolved: { text: '已解决', class: 'badge-success' },
      dismissed: { text: '已忽略', class: 'badge-gray' }
    };
    return map[status] || { text: status, class: 'badge-gray' };
  };

  const getTypeText = (type) => {
    const map = {
      low_volunteers: '人数不足',
      absence_high: '缺席预警',
      no_show: '未到岗',
      schedule_conflict: '排班冲突',
      feedback_urgent: '紧急反馈',
      donation_pending: '捐赠待处理',
      activity_starting: '活动提醒',
      custom: '自定义'
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

  const handleAcknowledge = async (id) => {
    try {
      await apiRequest(`/alerts/${id}/acknowledge`, {
        method: 'PUT'
      });
      loadAlerts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleResolve = async (id) => {
    try {
      await apiRequest(`/alerts/${id}/resolve`, {
        method: 'PUT'
      });
      loadAlerts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDismiss = async (id) => {
    if (!confirm('确认忽略该预警？')) return;
    try {
      await apiRequest(`/alerts/${id}/dismiss`, {
        method: 'PUT'
      });
      loadAlerts();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>活跃预警</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
            {stats.active || 0}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>警告</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
            {stats.warning || 0}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>严重</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
            {stats.danger || 0}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #991b1b' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>紧急</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#991b1b' }}>
            {stats.critical || 0}
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
            <option value="active">活跃</option>
            <option value="acknowledged">已确认</option>
            <option value="resolved">已解决</option>
            <option value="dismissed">已忽略</option>
          </select>
        </div>
        <div className="filter-item">
          <label className="filter-label">严重程度</label>
          <select 
            className="form-select"
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            <option value="">全部</option>
            <option value="info">提示</option>
            <option value="warning">警告</option>
            <option value="danger">严重</option>
            <option value="critical">紧急</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <p>暂无预警</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>类型</th>
                    <th className="hide-mobile">消息</th>
                    <th>严重度</th>
                    <th>状态</th>
                    <th className="hide-mobile">时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(alert => (
                    <tr key={alert._id}>
                      <td>
                        <Link to={`/alerts/${alert._id}`}>
                          {alert.title}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {getTypeText(alert.type)}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {alert.message?.slice(0, 40)}...
                      </td>
                      <td>
                        <span className={`badge ${getSeverityBadge(alert.severity).class}`}>
                          {getSeverityBadge(alert.severity).text}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(alert.status).class}`}>
                          {getStatusBadge(alert.status).text}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {format(new Date(alert.createdAt), 'MM-dd HH:mm')}
                      </td>
                      <td>
                        {alert.status === 'active' && (
                          <>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleAcknowledge(alert._id)}
                              style={{ marginRight: '0.25rem' }}
                            >
                              确认
                            </button>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => handleResolve(alert._id)}
                              style={{ marginRight: '0.25rem' }}
                            >
                              解决
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleDismiss(alert._id)}
                            >
                              忽略
                            </button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleResolve(alert._id)}
                          >
                            标记解决
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
