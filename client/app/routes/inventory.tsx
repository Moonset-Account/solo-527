import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { inventoryApi, storeApi } from '~/utils/api';
import { formatDate, getStatusTag, formatMoney, formatPercent, getTypeName } from '~/utils/format';

export default function Inventory() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [storeId, setStoreId] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [restockForm, setRestockForm] = useState({ quantity: 0, note: '' });
  const [consumeForm, setConsumeForm] = useState({ quantity: 0, note: '' });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    store: '',
    name: '',
    sku: '',
    category: 'other',
    unit: '份',
    quantity: 0,
    unitPrice: 0,
    minStock: 10,
    maxStock: 100,
    expiryDate: '',
    location: '',
    notes: ''
  });

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
      const res = await storeApi.getList({ pageSize: 100 });
      if (res.success) setStores(res.data?.list || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user) loadData();
  }, [page, storeId, category, status, keyword, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (storeId) params.storeId = storeId;
      if (category) params.category = category;
      if (status) params.status = status;
      if (keyword) params.keyword = keyword;
      
      const res = await inventoryApi.getList(params);
      if (res.success) {
        setList(res.data?.list || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = () => {
    setEditingItem(null);
    const defaultStore = user?.store?._id || user?.store || stores[0]?._id;
    setFormData({
      store: defaultStore || '',
      name: '',
      sku: '',
      category: 'other',
      unit: '份',
      quantity: 0,
      unitPrice: 0,
      minStock: 10,
      maxStock: 100,
      expiryDate: '',
      location: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      store: item.store?._id || item.store,
      name: item.name,
      sku: item.sku || '',
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      minStock: item.minStock,
      maxStock: item.maxStock,
      expiryDate: item.expiryDate ? formatDate(item.expiryDate, 'YYYY-MM-DD') : '',
      location: item.location || '',
      notes: item.notes || ''
    });
    setModalOpen(true);
  };

  const handleRestock = (item: any) => {
    setCurrentItem(item);
    setRestockForm({ quantity: 0, note: '' });
    setRestockModalOpen(true);
  };

  const handleConsume = (item: any) => {
    setCurrentItem(item);
    setConsumeForm({ quantity: 0, note: '' });
    setConsumeModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await inventoryApi.update(editingItem._id, formData);
      } else {
        res = await inventoryApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await inventoryApi.restock(currentItem._id, restockForm);
      if (res.success) {
        setRestockModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleConsumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await inventoryApi.consume(currentItem._id, consumeForm);
      if (res.success) {
        setConsumeModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个库存记录吗？')) return;
    try {
      const res = await inventoryApi.delete(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('删除失败'); }
  };

  const totalPages = Math.ceil(total / pageSize);

  const categoryOptions = [
    { value: 'tea_leaf', label: '茶叶' },
    { value: 'milk', label: '奶制品' },
    { value: 'sugar', label: '糖类' },
    { value: 'topping', label: '小料' },
    { value: 'fruit', label: '水果' },
    { value: 'packaging', label: '包材' },
    { value: 'other', label: '其他' },
  ];

  const getStockPercent = (item: any) => {
    if (item.maxStock <= 0) return 0;
    return Math.min(100, (item.quantity / item.maxStock) * 100);
  };

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>食材库存</h2>
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'store_manager') && (
          <button className="btn btn-primary" onClick={handleAdd}>+ 新增库存</button>
        )}
      </div>

      <div className="card">
        <div className="search-bar">
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="form-group">
              <select className="form-select" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                <option value="">全部门店</option>
                {stores.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
              </select>
            </div>
          )}
          <div className="form-group">
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">全部分类</option>
              {categoryOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="normal">正常</option>
              <option value="low">库存低</option>
              <option value="out_of_stock">缺货</option>
              <option value="expired">已过期</option>
            </select>
          </div>
          <div className="form-group">
            <input type="text" className="form-input" placeholder="搜索名称/SKU"
              value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setPage(1); loadData(); }}>查询</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>门店</th>
                  <th>名称</th>
                  <th>分类</th>
                  <th>库存</th>
                  <th>库存状态</th>
                  <th>单价</th>
                  <th>总价值</th>
                  <th>有效期</th>
                  <th>位置</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>暂无数据</td>
                  </tr>
                ) : (
                  list.map((item: any) => {
                    const statusTag = getStatusTag(item.status);
                    return (
                      <tr key={item._id}>
                        <td>{item.store?.name || '-'}</td>
                        <td>{item.name}</td>
                        <td>{getTypeName(item.category, 'inventory')}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#f0f0f0', borderRadius: '3px', minWidth: '60px' }}>
                              <div style={{
                                width: `${getStockPercent(item)}%`,
                                height: '100%',
                                background: item.status === 'normal' ? '#52c41a' : item.status === 'low' ? '#faad14' : '#ff4d4f',
                                borderRadius: '3px'
                              }} />
                            </div>
                            <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {item.quantity}{item.unit}
                            </span>
                          </div>
                        </td>
                        <td><span className={`tag ${statusTag.type}`}>{statusTag.text}</span></td>
                        <td>{formatMoney(item.unitPrice)}</td>
                        <td>{formatMoney(item.totalValue)}</td>
                        <td>{item.expiryDate ? formatDate(item.expiryDate, 'YYYY-MM-DD') : '-'}</td>
                        <td>{item.location || '-'}</td>
                        <td>
                          <button className="btn btn-success btn-sm" onClick={() => handleRestock(item)}>补货</button>
                          <button className="btn btn-warning btn-sm ml-8" onClick={() => handleConsume(item)}>消耗</button>
                          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'store_manager') && (
                            <>
                              <button className="btn btn-default btn-sm ml-8" onClick={() => handleEdit(item)}>编辑</button>
                              <button className="btn btn-danger btn-sm ml-8" onClick={() => handleDelete(item._id)}>删除</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>下一页</button>
              <span style={{ marginLeft: '10px', color: '#909399' }}>共 {total} 条</span>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="modal-mask" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '550px' }}>
            <div className="modal-header">
              <span className="modal-title">{editingItem ? '编辑库存' : '新增库存'}</span>
              <span className="modal-close" onClick={() => setModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">门店 *</label>
                  <select className="form-select" value={formData.store}
                    onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                    required disabled={user?.role === 'store_manager'}>
                    <option value="">请选择门店</option>
                    {stores.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">名称 *</label>
                    <input type="text" className="form-input" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU编码</label>
                    <input type="text" className="form-input" value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">分类</label>
                    <select className="form-select" value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {categoryOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">单位</label>
                    <input type="text" className="form-input" value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">当前库存</label>
                    <input type="number" className="form-input" value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">单价 (元)</label>
                    <input type="number" className="form-input" value={formData.unitPrice} step="0.01"
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">安全库存</label>
                    <input type="number" className="form-input" value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">最大库存</label>
                    <input type="number" className="form-input" value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">有效期</label>
                    <input type="date" className="form-input" value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">存放位置</label>
                    <input type="text" className="form-input" value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea className="form-textarea" value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">确定</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {restockModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setRestockModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">补货 - {currentItem.name}</span>
              <span className="modal-close" onClick={() => setRestockModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">当前库存</label>
                  <div style={{ padding: '8px 0', color: '#606266' }}>
                    {currentItem.quantity} {currentItem.unit}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">补货数量 *</label>
                  <input type="number" className="form-input" value={restockForm.quantity}
                    onChange={(e) => setRestockForm({ ...restockForm, quantity: parseFloat(e.target.value) || 0 })}
                    required min="0.01" step="0.01" />
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <input type="text" className="form-input" value={restockForm.note}
                    onChange={(e) => setRestockForm({ ...restockForm, note: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setRestockModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">确认补货</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {consumeModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setConsumeModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">消耗 - {currentItem.name}</span>
              <span className="modal-close" onClick={() => setConsumeModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleConsumeSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">当前库存</label>
                  <div style={{ padding: '8px 0', color: '#606266' }}>
                    {currentItem.quantity} {currentItem.unit}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">消耗数量 *</label>
                  <input type="number" className="form-input" value={consumeForm.quantity}
                    onChange={(e) => setConsumeForm({ ...consumeForm, quantity: parseFloat(e.target.value) || 0 })}
                    required min="0.01" step="0.01" max={currentItem.quantity} />
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <input type="text" className="form-input" value={consumeForm.note}
                    onChange={(e) => setConsumeForm({ ...consumeForm, note: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setConsumeModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">确认消耗</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
