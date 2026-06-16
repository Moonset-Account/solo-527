import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { couponApi, storeApi } from '~/utils/api';
import { formatDate, getStatusTag, formatMoney, getTypeName } from '~/utils/format';

export default function Coupons() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [storeId, setStoreId] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    store: '',
    name: '',
    type: 'discount',
    value: 0,
    minSpend: 0,
    totalCount: 0,
    validFrom: '',
    validTo: '',
    description: '',
    distributionMethod: 'manual',
    reminderDays: 3
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
      if (u.role === 'store_manager') {
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
  }, [page, storeId, type, status, keyword, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (storeId) params.storeId = storeId;
      if (type) params.type = type;
      if (status) params.status = status;
      if (keyword) params.keyword = keyword;
      
      const res = await couponApi.getList(params);
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
      type: 'discount',
      value: 0,
      minSpend: 0,
      totalCount: 0,
      validFrom: '',
      validTo: '',
      description: '',
      distributionMethod: 'manual',
      reminderDays: 3
    });
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      store: item.store?._id || item.store,
      name: item.name,
      type: item.type,
      value: item.value,
      minSpend: item.minSpend,
      totalCount: item.totalCount,
      validFrom: item.validFrom ? formatDate(item.validFrom, 'YYYY-MM-DD') : '',
      validTo: item.validTo ? formatDate(item.validTo, 'YYYY-MM-DD') : '',
      description: item.description || '',
      distributionMethod: item.distributionMethod || 'manual',
      reminderDays: item.reminderDays || 3
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await couponApi.update(editingItem._id, formData);
      } else {
        res = await couponApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleUse = async (id: string) => {
    if (!confirm('确认使用一张券？')) return;
    try {
      const res = await couponApi.use(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个券包吗？')) return;
    try {
      const res = await couponApi.delete(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('删除失败'); }
  };

  const totalPages = Math.ceil(total / pageSize);

  const typeOptions = [
    { value: 'discount', label: '折扣券' },
    { value: 'cash', label: '代金券' },
    { value: 'gift', label: '赠品券' },
    { value: 'points', label: '积分券' },
  ];

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>会员券包</h2>
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'store_manager') && (
          <button className="btn btn-primary" onClick={handleAdd}>+ 新增券包</button>
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
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">全部类型</option>
              {typeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="active">进行中</option>
              <option value="expired">已过期</option>
              <option value="used_up">已用完</option>
              <option value="disabled">已禁用</option>
            </select>
          </div>
          <div className="form-group">
            <input type="text" className="form-input" placeholder="搜索券包名称"
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
                  <th>券包名称</th>
                  <th>类型</th>
                  <th>面值</th>
                  <th>最低消费</th>
                  <th>总量/已用/剩余</th>
                  <th>有效期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>暂无数据</td>
                  </tr>
                ) : (
                  list.map((item: any) => {
                    const statusTag = getStatusTag(item.status);
                    return (
                      <tr key={item._id}>
                        <td>{item.store?.name || '-'}</td>
                        <td>{item.name}</td>
                        <td>{getTypeName(item.type, 'coupon')}</td>
                        <td>{item.type === 'discount' ? `${item.value}%` : formatMoney(item.value)}</td>
                        <td>{formatMoney(item.minSpend)}</td>
                        <td>
                          {item.totalCount} / {item.usedCount} / <span style={{ color: '#52c41a' }}>{item.remainingCount}</span>
                        </td>
                        <td>
                          {item.validFrom ? formatDate(item.validFrom, 'YYYY-MM-DD') : '-'}
                          <br />
                          ~ {item.validTo ? formatDate(item.validTo, 'YYYY-MM-DD') : '-'}
                        </td>
                        <td><span className={`tag ${statusTag.type}`}>{statusTag.text}</span></td>
                        <td>
                          {item.status === 'active' && (
                            <button className="btn btn-success btn-sm" onClick={() => handleUse(item._id)}>使用</button>
                          )}
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
              <span className="modal-title">{editingItem ? '编辑券包' : '新增券包'}</span>
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
                    <label className="form-label">券包名称 *</label>
                    <input type="text" className="form-input" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">类型</label>
                    <select className="form-select" value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                      {typeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">面值</label>
                    <input type="number" className="form-input" value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">最低消费</label>
                    <input type="number" className="form-input" value={formData.minSpend}
                      onChange={(e) => setFormData({ ...formData, minSpend: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">发放总量</label>
                    <input type="number" className="form-input" value={formData.totalCount}
                      onChange={(e) => setFormData({ ...formData, totalCount: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">发放方式</label>
                    <select className="form-select" value={formData.distributionMethod}
                      onChange={(e) => setFormData({ ...formData, distributionMethod: e.target.value })}>
                      <option value="manual">手动发放</option>
                      <option value="auto">自动发放</option>
                      <option value="event">活动发放</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">有效期开始</label>
                    <input type="date" className="form-input" value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">有效期结束</label>
                    <input type="date" className="form-input" value={formData.validTo}
                      onChange={(e) => setFormData({ ...formData, validTo: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">到期提醒天数</label>
                  <input type="number" className="form-input" value={formData.reminderDays}
                    onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) || 3 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">描述</label>
                  <textarea className="form-textarea" value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3} />
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
    </AppLayout>
  );
}
