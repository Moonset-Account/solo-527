import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { api } from '~/utils/api';
import { formatDate, visitTypeLabels, visitMethodLabels } from '~/utils/formatters';

export default function Visits() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    visitType: '',
    overallStatus: '',
    startDate: '',
    endDate: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadRecords();
  }, [page]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const result: any = await api.get('/visits', {
        params: { page, pageSize: 10, ...filters },
      });
      setRecords(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Load visit records error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadRecords();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const statusColors: Record<string, string> = {
    excellent: 'success',
    good: 'success',
    average: 'warning',
    poor: 'danger',
    needs_attention: 'danger',
  };

  const statusLabels: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    average: '一般',
    poor: '较差',
    needs_attention: '需关注',
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-item">
          <label>回访类型：</label>
          <select value={filters.visitType} onChange={(e) => handleFilterChange('visitType', e.target.value)}>
            <option value="">全部</option>
            <option value="first_week">首周回访</option>
            <option value="first_month">首月回访</option>
            <option value="quarterly">季度回访</option>
            <option value="random">随机回访</option>
            <option value="complaint">投诉回访</option>
          </select>
        </div>
        <div className="filter-item">
          <label>状态：</label>
          <select value={filters.overallStatus} onChange={(e) => handleFilterChange('overallStatus', e.target.value)}>
            <option value="">全部</option>
            <option value="excellent">优秀</option>
            <option value="good">良好</option>
            <option value="average">一般</option>
            <option value="poor">较差</option>
            <option value="needs_attention">需关注</option>
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
        <button className="btn btn-secondary" onClick={() => { setFilters({ visitType: '', overallStatus: '', startDate: '', endDate: '' }); setPage(1); setTimeout(loadRecords, 0); }}>重置</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => navigate('/visits/new')}>+ 新增回访</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏠</div>
              <div className="empty-state-text">暂无回访记录</div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>记录编号</th>
                      <th>申请人</th>
                      <th>宠物</th>
                      <th>回访类型</th>
                      <th>回访方式</th>
                      <th>回访日期</th>
                      <th>回访人</th>
                      <th>整体状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record._id}>
                        <td className="text-sm text-muted">{record.recordNo}</td>
                        <td className="font-medium">{record.applicantName}</td>
                        <td className="text-sm">{record.petName}</td>
                        <td className="text-sm">{visitTypeLabels[record.visitType] || record.visitType}</td>
                        <td className="text-sm">{visitMethodLabels[record.visitMethod] || record.visitMethod}</td>
                        <td className="text-sm">{formatDate(record.visitDate)}</td>
                        <td className="text-sm text-muted">{record.visitorName || '-'}</td>
                        <td>
                          <span className={`badge badge-${statusColors[record.overallStatus] || ''}`}>
                            {statusLabels[record.overallStatus] || record.overallStatus}
                          </span>
                          {record.followUpRequired && (
                            <span className="badge badge-warning ml-1">需跟进</span>
                          )}
                        </td>
                        <td>
                          <button className="text-primary text-sm" onClick={() => navigate(`/adoptions/${record.applicationId}`)}>
                            查看
                          </button>
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
