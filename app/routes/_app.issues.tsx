import { useEffect, useState } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { apiFetch } from '~/utils/api';
import { useAuth } from '~/utils/auth';

const statusLabels: Record<string, string> = {
  pending_confirm: '待确认',
  pending_rectify: '待整改',
  reviewed: '已复查',
  closed: '已关闭',
  false_positive: '误报'
};

const categoryLabels: Record<string, string> = {
  shelf: '货架',
  price_tag: '价签',
  fire_exit: '消防通道',
  freezer_temp: '冷柜温度',
  cleanliness: '卫生',
  other: '其他'
};

export default function Issues() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    store_id: searchParams.get('store_id') || '',
    is_overdue: searchParams.get('is_overdue') || ''
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadIssues();
  }, [searchParams]);

  async function loadStores() {
    try {
      const data = await apiFetch('/api/stores');
      setStores(data);
    } catch (error) {
      console.error('Load stores error:', error);
    }
  }

  async function loadIssues() {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const data = await apiFetch(`/api/issues?${params.toString()}`);
      setIssues(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Load issues error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(key: string, value: string) {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  }

  return (
    <div>
      <div className="flex-between mb-6">
        <h2>问题列表</h2>
        {user?.role === 'supervisor' && (
          <Link to="/issues/new" className="btn btn-primary">
            + 提交问题
          </Link>
        )}
      </div>

      <div className="filter-bar">
        {user?.role !== 'store_manager' && (
          <div className="filter-item">
            <select
              className="form-select"
              value={filters.store_id}
              onChange={e => handleFilterChange('store_id', e.target.value)}
            >
              <option value="">全部门店</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="filter-item">
          <select
            className="form-select"
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <select
            className="form-select"
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
          >
            <option value="">全部类型</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <select
            className="form-select"
            value={filters.is_overdue}
            onChange={e => handleFilterChange('is_overdue', e.target.value)}
          >
            <option value="">全部逾期</option>
            <option value="true">已逾期</option>
            <option value="false">未逾期</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : issues.length === 0 ? (
          <div className="text-muted text-center" style={{ padding: '40px' }}>
            暂无问题记录
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>类型</th>
                  <th>门店</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>照片</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue.id}>
                    <td>
                      {issue.title}
                      {issue.is_overdue && <span className="overdue" style={{ marginLeft: '8px' }}>⚠️</span>}
                    </td>
                    <td>{categoryLabels[issue.category] || issue.category}</td>
                    <td>{issue.store_name}</td>
                    <td>
                      <span className={`status-badge status-${issue.status}`}>
                        {statusLabels[issue.status]}
                      </span>
                    </td>
                    <td>{issue.assignee_name || '-'}</td>
                    <td>{issue.photo_count || 0} 张</td>
                    <td className="text-sm text-muted">
                      {new Date(issue.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td>
                      <Link to={`/issues/${issue.id}`} className="btn btn-default btn-sm">
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className="flex" style={{ justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                <button
                  className="btn btn-default btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  上一页
                </button>
                <span className="text-sm" style={{ padding: '4px 12px' }}>
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  className="btn btn-default btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
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
