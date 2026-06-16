import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { storeApi } from '~/utils/api';
import { formatMoney, getStatusTag } from '~/utils/format';

export default function Stores() {
  const [stores, setStores] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    manager: '',
    rentCost: 0,
    utilityCost: 0,
    laborCost: 0,
    targetProfit: 0,
    status: 'active'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadStores();
  }, [page, keyword, status]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      
      const res = await storeApi.getList(params);
      if (res.success) {
        setStores(res.data?.list || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStore(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      manager: '',
      rentCost: 0,
      utilityCost: 0,
      laborCost: 0,
      targetProfit: 0,
      status: 'active'
    });
    setModalOpen(true);
  };

  const handleEdit = (store: any) => {
    setEditingStore(store);
    setFormData({ ...store });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingStore) {
        res = await storeApi.update(editingStore._id, formData);
      } else {
        res = await storeApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadStores();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个门店吗？')) return;
    try {
      const res = await storeApi.delete(id);
      if (res.success) {
        loadStores();
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
        <h2 className="page-title" style={{ margin: 0 }}>门店管理</h2>
        <button className="btn btn-primary" onClick={handleAdd}>+ 新增门店</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="搜索门店名称/编号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="active">启用</option>
              <option value="inactive">禁用</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => { setPage(1); loadStores(); }}>
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
                  <th>门店编号</th>
                  <th>门店名称</th>
                  <th>地址</th>
                  <th>店长</th>
                  <th>目标利润</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  stores.map((store: any) => {
                    const statusTag = getStatusTag(store.status);
                    return (
                      <tr key={store._id}>
                        <td>{store.code}</td>
                        <td>{store.name}</td>
                        <td>{store.address}</td>
                        <td>{store.manager}</td>
                        <td>{formatMoney(store.targetProfit)}</td>
                        <td>
                          <span className={`tag ${statusTag.type}`}>{statusTag.text}</span>
                        </td>
                        <td>
                          <button className="btn btn-default btn-sm" onClick={() => handleEdit(store)}>
                            编辑
                          </button>
                          <button className="btn btn-danger btn-sm ml-8" onClick={() => handleDelete(store._id)}>
                            删除
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(p => (
                <button
                  key={p}
                  className={page === p ? 'active' : ''}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </button>
              <span style={{ marginLeft: '10px', color: '#909399' }}>
                共 {total} 条
              </span>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="modal-mask" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingStore ? '编辑门店' : '新增门店'}</span>
              <span className="modal-close" onClick={() => setModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">门店编号 *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">门店名称 *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">地址</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">联系电话</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">店长</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">月租金 (元)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.rentCost}
                      onChange={(e) => setFormData({ ...formData, rentCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">月水电 (元)</label>
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
                    <label className="form-label">月人工 (元)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.laborCost}
                      onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">目标利润 (元)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.targetProfit}
                      onChange={(e) => setFormData({ ...formData, targetProfit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">状态</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                  </select>
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
