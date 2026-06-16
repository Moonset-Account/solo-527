import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { businessApi } from '~/utils/api';
import { formatMoney, formatDate, formatPercent } from '~/utils/format';

export default function Business() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [storeId, setStoreId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [profitStats, setProfitStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    store: '',
    date: '',
    totalSales: 0,
    orderCount: 0,
    memberSales: 0,
    takeoutSales: 0,
    dineInSales: 0,
    costOfGoods: 0,
    laborCost: 0,
    rentCost: 0,
    utilityCost: 0,
    otherCost: 0,
    weather: '',
    notes: ''
  });
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token) {
      navigate('/login');
      return;
    }
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      if (u.role === 'store_manager' || u.role === 'staff') {
        setStoreId(u.store?._id || u.store);
      }
    }
    loadStores();
  }, [navigate]);

  const loadStores = async () => {
    try {
      const { storeApi } = await import('~/utils/api');
      const res = await storeApi.getList({ pageSize: 100 });
      if (res.success) {
        setStores(res.data?.list || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      loadProfitStats();
    }
  }, [page, storeId, startDate, endDate, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (storeId) params.storeId = storeId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await businessApi.getList(params);
      if (res.success) {
        setList(res.data?.list || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfitStats = async () => {
    try {
      const params: any = {};
      if (storeId) params.storeId = storeId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await businessApi.getProfitStats(params);
      if (res.success) {
        setProfitStats(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    const defaultStore = user?.store?._id || user?.store || stores[0]?._id;
    setFormData({
      store: defaultStore || '',
      date: new Date().toISOString().split('T')[0],
      totalSales: 0,
      orderCount: 0,
      memberSales: 0,
      takeoutSales: 0,
      dineInSales: 0,
      costOfGoods: 0,
      laborCost: 0,
      rentCost: 0,
      utilityCost: 0,
      otherCost: 0,
      weather: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      ...item,
      date: formatDate(item.date, 'YYYY-MM-DD'),
      store: item.store?._id || item.store
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await businessApi.update(editingItem._id, formData);
      } else {
        res = await businessApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadData();
        loadProfitStats();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条营业数据吗？')) return;
    try {
      const res = await businessApi.delete(id);
      if (res.success) {
        loadData();
        loadProfitStats();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('删除失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>营业数据</h2>
        <button className="btn btn-primary" onClick={handleAdd}>+ 录入数据</button>
      </div>

      {profitStats && (
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-title">总销售额</div>
            <div className="stat-card-value" style={{ color: '#1890ff' }}>
              {formatMoney(profitStats.totalSales)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">总成本</div>
            <div className="stat-card-value" style={{ color: '#faad14' }}>
              {formatMoney(profitStats.totalCost)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">总利润</div>
            <div className="stat-card-value" style={{ color: '#52c41a' }}>
              {formatMoney(profitStats.totalProfit)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">利润率</div>
            <div className="stat-card-value" style={{ color: '#722ed1' }}>
              {formatPercent(profitStats.avgProfitMargin)}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="search-bar">
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="form-group">
              <select
                className="form-select"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              >
                <option value="">全部门店</option>
                {stores.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="开始日期"
            />
          </div>
          <div className="form-group">
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="结束日期"
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setPage(1); loadData(); loadProfitStats(); }}>
            查询
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>门店</th>
                  <th>销售额</th>
                  <th>订单数</th>
                  <th>成本</th>
                  <th>净利润</th>
                  <th>利润率</th>
                  <th>天气</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  list.map((item: any) => (
                    <tr key={item._id}>
                      <td>{formatDate(item.date, 'YYYY-MM-DD')}</td>
                      <td>{item.store?.name || '-'}</td>
                      <td>{formatMoney(item.totalSales)}</td>
                      <td>{item.orderCount}</td>
                      <td>{formatMoney(item.costOfGoods)}</td>
                      <td style={{ color: item.netProfit >= 0 ? '#52c41a' : '#f56c6c' }}>
                        {formatMoney(item.netProfit)}
                      </td>
                      <td>{formatPercent(item.profitMargin)}</td>
                      <td>{item.weather || '-'}</td>
                      <td>
                        <button className="btn btn-default btn-sm" onClick={() => handleEdit(item)}>
                          编辑
                        </button>
                        <button className="btn btn-danger btn-sm ml-8" onClick={() => handleDelete(item._id)}>
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                上一页
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                下一页
              </button>
              <span style={{ marginLeft: '10px', color: '#909399' }}>共 {total} 条</span>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="modal-mask" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '600px' }}>
            <div className="modal-header">
              <span className="modal-title">{editingItem ? '编辑营业数据' : '录入营业数据'}</span>
              <span className="modal-close" onClick={() => setModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">门店 *</label>
                    <select
                      className="form-select"
                      value={formData.store}
                      onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                      required
                      disabled={user?.role === 'store_manager' || user?.role === 'staff'}
                    >
                      <option value="">请选择门店</option>
                      {stores.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">日期 *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">总销售额 (元) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.totalSales}
                      onChange={(e) => setFormData({ ...formData, totalSales: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">订单数</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.orderCount}
                      onChange={(e) => setFormData({ ...formData, orderCount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">会员销售额</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.memberSales}
                      onChange={(e) => setFormData({ ...formData, memberSales: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">外卖销售额</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.takeoutSales}
                      onChange={(e) => setFormData({ ...formData, takeoutSales: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">食材成本</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.costOfGoods}
                      onChange={(e) => setFormData({ ...formData, costOfGoods: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">人工成本</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.laborCost}
                      onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">租金成本</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.rentCost}
                      onChange={(e) => setFormData({ ...formData, rentCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">水电成本</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.utilityCost}
                      onChange={(e) => setFormData({ ...formData, utilityCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">其他成本</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.otherCost}
                      onChange={(e) => setFormData({ ...formData, otherCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">天气</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.weather}
                      onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                      placeholder="如：晴、阴、雨"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setModalOpen(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary ml-8">
                  确定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
