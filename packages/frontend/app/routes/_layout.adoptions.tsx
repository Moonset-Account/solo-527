import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import { api } from '~/utils/api';
import { formatDate, adoptionStatusLabels, adoptionStatusColors } from '~/utils/formatters';

export default function Adoptions() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    trainerId: '',
    startDate: '',
    endDate: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadTrainers();
    loadApplications();
  }, [page]);

  const loadTrainers = async () => {
    try {
      const result: any = await api.get('/users/trainers');
      setTrainers(result.data || []);
    } catch (error) {
      console.error('Load trainers error:', error);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const result: any = await api.get('/adoptions', {
        params: { page, pageSize: 10, ...filters },
      });
      setApplications(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Load applications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadApplications();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExport = async () => {
    try {
      await api.download('/export/applications', `领养申请_${Date.now()}.xlsx`, filters);
    } catch (error: any) {
      alert(error.message || '导出失败');
    }
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-item" style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            className="form-control"
            placeholder="搜索申请编号、申请人..."
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ flex: 1 }}
          />
        </div>
        <div className="filter-item">
          <label>状态：</label>
          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="">全部</option>
            <option value="draft">草稿</option>
            <option value="submitted">已提交</option>
            <option value="under_review">审核中</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div className="filter-item">
          <label>训练师：</label>
          <select value={filters.trainerId} onChange={(e) => handleFilterChange('trainerId', e.target.value)}>
            <option value="">全部</option>
            {trainers.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>开始日期：</label>
          <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
        </div>
        <div className="filter-item">
          <label>结束日期：</label>
          <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        <button className="btn btn-secondary" onClick={() => { setFilters({ keyword: '', status: '', trainerId: '', startDate: '', endDate: '' }); setPage(1); setTimeout(loadApplications, 0); }}>重置</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={handleExport}>导出</button>
        <button className="btn btn-primary" onClick={() => navigate('/adoptions/new')}>+ 新建申请</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">暂无领养申请</div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>申请编号</th>
                      <th>申请人</th>
                      <th>联系电话</th>
                      <th>宠物</th>
                      <th>训练师</th>
                      <th>缺失资料</th>
                      <th>状态</th>
                      <th>申请时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id}>
                        <td className="text-sm text-muted">{app.applicationNo}</td>
                        <td className="font-medium">{app.applicantName}</td>
                        <td className="text-sm">{app.applicantPhone}</td>
                        <td className="text-sm">{app.petName}</td>
                        <td className="text-sm text-muted">{app.trainerName || '-'}</td>
                        <td>
                          {(app.missingFields || []).length > 0 ? (
                            <span className="badge badge-danger">{(app.missingFields || []).length}项缺失</span>
                          ) : (
                            <span className="badge badge-success">资料完整</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${adoptionStatusColors[app.status]}`}>
                            {adoptionStatusLabels[app.status]}
                          </span>
                        </td>
                        <td className="text-sm text-muted">{formatDate(app.createdAt)}</td>
                        <td>
                          <Link to={`/adoptions/${app._id}`} className="text-primary text-sm">详情</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <div className="pagination-info">
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </div>
                <div className="pagination-buttons">
                  <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    上一页
                  </button>
                  <button className="pagination-btn active">{page}</button>
                  <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    下一页
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
