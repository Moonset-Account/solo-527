import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import { api } from '~/utils/api';
import { formatDate, petStatusLabels, petStatusColors, speciesLabels } from '~/utils/formatters';

export default function Pets() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    species: '',
    trainerId: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadPets();
  }, [page]);

  const loadPets = async () => {
    setLoading(true);
    try {
      const result: any = await api.get('/pets', {
        params: { page, pageSize: 10, ...filters },
      });
      setPets(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Load pets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPets();
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
      await api.download('/export/pets', `宠物档案_${Date.now()}.xlsx`, filters);
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
            placeholder="搜索宠物名称、品种、编号..."
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
            <option value="pending">待寄养</option>
            <option value="fostering">寄养中</option>
            <option value="adopted">已领养</option>
            <option value="returned">已退回</option>
          </select>
        </div>
        <div className="filter-item">
          <label>物种：</label>
          <select value={filters.species} onChange={(e) => handleFilterChange('species', e.target.value)}>
            <option value="">全部</option>
            <option value="dog">狗</option>
            <option value="cat">猫</option>
            <option value="other">其他</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        <button className="btn btn-secondary" onClick={() => { setFilters({ keyword: '', status: '', species: '', trainerId: '' }); setPage(1); setTimeout(loadPets, 0); }}>重置</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={handleExport}>导出</button>
        <button className="btn btn-primary" onClick={() => navigate('/pets/new')}>+ 新增宠物</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : pets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🐾</div>
              <div className="empty-state-text">暂无宠物档案</div>
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>名字</th>
                    <th>物种</th>
                    <th>品种</th>
                    <th>性别</th>
                    <th>健康状态</th>
                    <th>状态</th>
                    <th>训练师</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.map((pet) => (
                    <tr key={pet._id}>
                      <td className="text-sm text-muted">{pet.petNo}</td>
                      <td className="font-medium">{pet.name}</td>
                      <td className="text-sm">{speciesLabels[pet.species] || pet.species}</td>
                      <td className="text-sm text-muted">{pet.breed || '-'}</td>
                      <td className="text-sm">{pet.gender === 'male' ? '公' : pet.gender === 'female' ? '母' : '未知'}</td>
                      <td className="text-sm">
                        <span className={`badge badge-${pet.healthStatus === 'healthy' ? 'success' : pet.healthStatus === 'sick' ? 'danger' : 'warning'}`}>
                          {pet.healthStatus === 'healthy' ? '健康' : pet.healthStatus === 'sick' ? '生病' : '康复中'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${petStatusColors[pet.status]}`}>
                          {petStatusLabels[pet.status]}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{pet.trainerId?.name || '-'}</td>
                      <td className="text-sm text-muted">{formatDate(pet.createdAt)}</td>
                      <td>
                        <Link to={`/pets/${pet._id}`} className="text-primary text-sm">详情</Link>
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
