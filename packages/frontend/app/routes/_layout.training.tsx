import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { api } from '~/utils/api';
import { formatDate, trainingTypeLabels, performanceLabels, speciesLabels } from '~/utils/formatters';

export default function Training() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    petId: '',
    trainerId: '',
    trainingType: '',
    startDate: '',
    endDate: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadTrainers();
    loadRecords();
  }, [page]);

  const loadTrainers = async () => {
    try {
      const result: any = await api.get('/users/trainers');
      setTrainers(result.data || []);
    } catch (error) {
      console.error('Load trainers error:', error);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const result: any = await api.get('/training', {
        params: { page, pageSize: 10, ...filters },
      });
      setRecords(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Load training records error:', error);
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

  const performanceColors: Record<string, string> = {
    excellent: 'success',
    good: 'primary',
    average: 'warning',
    poor: 'danger',
  };

  return (
    <div>
      <div className="filter-bar">
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
          <label>训练类型：</label>
          <select value={filters.trainingType} onChange={(e) => handleFilterChange('trainingType', e.target.value)}>
            <option value="">全部</option>
            <option value="obedience">服从训练</option>
            <option value="socialization">社会化</option>
            <option value="behavior_correction">行为纠正</option>
            <option value="agility">敏捷训练</option>
            <option value="basic_commands">基础指令</option>
            <option value="other">其他</option>
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
        <button className="btn btn-secondary" onClick={() => { setFilters({ petId: '', trainerId: '', trainingType: '', startDate: '', endDate: '' }); setPage(1); setTimeout(loadRecords, 0); }}>重置</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => navigate('/training/new')}>+ 新增记录</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎓</div>
              <div className="empty-state-text">暂无训练记录</div>
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>记录编号</th>
                    <th>宠物</th>
                    <th>训练类型</th>
                    <th>训练师</th>
                    <th>训练日期</th>
                    <th>时长</th>
                    <th>表现</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td className="text-sm text-muted">{record.recordNo}</td>
                      <td className="font-medium">{record.petName}</td>
                      <td className="text-sm">{trainingTypeLabels[record.trainingType] || record.trainingType}</td>
                      <td className="text-sm text-muted">{record.trainerName}</td>
                      <td className="text-sm">{formatDate(record.trainingDate)}</td>
                      <td className="text-sm">{record.duration ? `${record.duration}分钟` : '-'}</td>
                      <td>
                        <span className={`badge badge-${performanceColors[record.performance] || ''}`}>
                          {performanceLabels[record.performance] || record.performance}
                        </span>
                      </td>
                      <td>
                        <button className="text-primary text-sm btn-link" onClick={() => navigate(`/pets/${record.petId}`)}>
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
