import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { anomalyApi } from '~/utils/api';
import { storeApi } from '~/utils/api';
import { formatDate, getStatusTag, getPriorityTag, formatMoney, getTypeName } from '~/utils/format';

export default function Anomalies() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [storeId, setStoreId] = useState('');
  const [type, setType] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveForm, setResolveForm] = useState({ resolution: '', impactOnProfit: 0 });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    store: '',
    type: 'other',
    level: 'moderate',
    title: '',
    description: '',
    location: '',
    impactOnProfit: 0
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
      if (res.success) {
        setStores(res.data?.list || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [page, storeId, type, level, status, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (storeId) params.storeId = storeId;
      if (type) params.type = type;
      if (level) params.level = level;
      if (status) params.status = status;
      
      const res = await anomalyApi.getList(params);
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

  const handleAdd = () => {
    setEditingItem(null);
    const defaultStore = user?.store?._id || user?.store || stores[0]?._id;
    setFormData({
      store: defaultStore || '',
      type: 'other',
      level: 'moderate',
      title: '',
      description: '',
      location: '',
      impactOnProfit: 0
    });
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      store: item.store?._id || item.store,
      type: item.type,
      level: item.level,
      title: item.title,
      description: item.description,
      location: item.location,
      impactOnProfit: item.impactOnProfit || 0
    });
    setModalOpen(true);
  };

  const handleViewDetail = (item: any) => {
    setCurrentItem(item);
    setDetailOpen(true);
  };

  const handleResolve = (item: any) => {
    setCurrentItem(item);
    setResolveForm({ resolution: '', impactOnProfit: item.impactOnProfit || 0 });
    setResolveModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await anomalyApi.update(editingItem._id, formData);
      } else {
        res = await anomalyApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await anomalyApi.resolve(currentItem._id, resolveForm);
      if (res.success) {
        setResolveModalOpen(false);
        loadData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条异常记录吗？')) return;
    try {
      const res = await anomalyApi.delete(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('删除失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const typeOptions = [
    { value: 'service', label: '服务' },
    { value: 'hygiene', label: '卫生' },
    { value: 'equipment', label: '设备' },
    { value: 'inventory', label: '库存' },
    { value: 'cash', label: '现金' },
    { value: 'other', label: '其他' },
  ];

  const levelOptions = [
    { value: 'minor', label: '轻微' },
    { value: 'moderate', label: '一般' },
    { value: 'major', label: '严重' },
    { value: 'critical', label: '重大' },
  ];

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>异常记录</h2>
        <button className="btn btn-primary" onClick={handleAdd}>+ 上报异常</button>
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
            <select className="form-select" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">全部级别</option>
              {levelOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="reported">已上报</option>
              <option value="in_progress">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
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
                  <th>标题</th>
                  <th>类型</th>
                  <th>级别</th>
                  <th>位置</th>
                  <th>利润影响</th>
                  <th>状态</th>
                  <th>上报人</th>
                  <th>上报时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  list.map((item: any) => {
                    const statusTag = getStatusTag(item.status);
                    const priorityTag = getPriorityTag(item.level === 'minor' ? 'low' : item.level === 'moderate' ? 'medium' : item.level === 'major' ? 'high' : 'urgent');
                    return (
                      <tr key={item._id}>
                        <td>{item.store?.name || '-'}</td>
                        <td onClick={() => handleViewDetail(item)} style={{ cursor: 'pointer', color: '#1890ff' }}>
                          {item.title}
                        </td>
                        <td>{getTypeName(item.type, 'anomaly')}</td>
                        <td><span className={`tag ${priorityTag.type}`}>{priorityTag.text}</span></td>
                        <td>{item.location || '-'}</td>
                        <td style={{ color: item.impactOnProfit >= 0 ? '#52c41a' : '#f56c6c' }}>
                          {formatMoney(item.impactOnProfit)}
                        </td>
                        <td><span className={`tag ${statusTag.type}`}>{statusTag.text}</span></td>
                        <td>{item.reportedBy?.name || '-'}</td>
                        <td>{formatDate(item.reportedAt)}</td>
                        <td>
                          <button className="btn btn-default btn-sm" onClick={() => handleViewDetail(item)}>详情</button>
                          {(item.status === 'reported' || item.status === 'in_progress') && (
                            <button className="btn btn-success btn-sm ml-8" onClick={() => handleResolve(item)}>处理</button>
                          )}
                          <button className="btn btn-default btn-sm ml-8" onClick={() => handleEdit(item)}>编辑</button>
                          <button className="btn btn-danger btn-sm ml-8" onClick={() => handleDelete(item._id)}>删除</button>
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingItem ? '编辑异常' : '上报异常'}</span>
              <span className="modal-close" onClick={() => setModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                    {stores.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">类型</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      {typeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">级别</label>
                    <select
                      className="form-select"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    >
                      {levelOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">标题 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">位置</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">描述</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">对利润的影响 (元)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.impactOnProfit}
                    onChange={(e) => setFormData({ ...formData, impactOnProfit: parseFloat(e.target.value) || 0 })}
                  />
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

      {detailOpen && currentItem && (
        <div className="modal-mask" onClick={() => setDetailOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">异常详情</span>
              <span className="modal-close" onClick={() => setDetailOpen(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-item"><div className="detail-label">门店</div><div className="detail-value">{currentItem.store?.name}</div></div>
              <div className="detail-item"><div className="detail-label">标题</div><div className="detail-value">{currentItem.title}</div></div>
              <div className="detail-item"><div className="detail-label">类型</div><div className="detail-value">{getTypeName(currentItem.type, 'anomaly')}</div></div>
              <div className="detail-item"><div className="detail-label">级别</div><div className="detail-value">{getTypeName(currentItem.level, 'anomaly') || currentItem.level}</div></div>
              <div className="detail-item"><div className="detail-label">位置</div><div className="detail-value">{currentItem.location || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">描述</div><div className="detail-value">{currentItem.description || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">利润影响</div><div className="detail-value">{formatMoney(currentItem.impactOnProfit)}</div></div>
              <div className="detail-item"><div className="detail-label">状态</div><div className="detail-value">{getStatusTag(currentItem.status).text}</div></div>
              <div className="detail-item"><div className="detail-label">上报人</div><div className="detail-value">{currentItem.reportedBy?.name || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">上报时间</div><div className="detail-value">{formatDate(currentItem.reportedAt)}</div></div>
              {currentItem.resolvedAt && (
                <>
                  <div className="detail-item"><div className="detail-label">处理人</div><div className="detail-value">{currentItem.resolvedBy?.name || '-'}</div></div>
                  <div className="detail-item"><div className="detail-label">处理时间</div><div className="detail-value">{formatDate(currentItem.resolvedAt)}</div></div>
                  <div className="detail-item"><div className="detail-label">处理结果</div><div className="detail-value">{currentItem.resolution || '-'}</div></div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setDetailOpen(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {resolveModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setResolveModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">处理异常</span>
              <span className="modal-close" onClick={() => setResolveModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleResolveSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">处理方案 *</label>
                  <textarea
                    className="form-textarea"
                    value={resolveForm.resolution}
                    onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                    rows={4}
                    required
                    placeholder="请描述处理方案和结果"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">对利润的最终影响 (元)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={resolveForm.impactOnProfit}
                    onChange={(e) => setResolveForm({ ...resolveForm, impactOnProfit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setResolveModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">确认处理</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
