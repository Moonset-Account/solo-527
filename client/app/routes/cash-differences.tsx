import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { cashDiffApi, storeApi } from '~/utils/api';
import { formatDate, formatMoney, getStatusTag, getTypeName } from '~/utils/format';

export default function CashDifferences() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [storeId, setStoreId] = useState('');
  const [shift, setShift] = useState('');
  const [handlingResult, setHandlingResult] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [handleModalOpen, setHandleModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [handleForm, setHandleForm] = useState({ handlingResult: 'adjusted', handlingNote: '', impactOnProfit: 0 });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    store: '',
    date: '',
    shift: 'all_day',
    expectedCash: 0,
    actualCash: 0,
    reason: 'other',
    note: ''
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
    if (user) {
      loadData();
      loadStats();
    }
  }, [page, storeId, shift, handlingResult, startDate, endDate, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (storeId) params.storeId = storeId;
      if (shift) params.shift = shift;
      if (handlingResult) params.handlingResult = handlingResult;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await cashDiffApi.getList(params);
      if (res.success) {
        setList(res.data?.list || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const params: any = {};
      if (storeId) params.storeId = storeId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await cashDiffApi.getStats(params);
      if (res.success) setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAdd = () => {
    setEditingItem(null);
    const defaultStore = user?.store?._id || user?.store || stores[0]?._id;
    setFormData({
      store: defaultStore || '',
      date: new Date().toISOString().split('T')[0],
      shift: 'all_day',
      expectedCash: 0,
      actualCash: 0,
      reason: 'other',
      note: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      store: item.store?._id || item.store,
      date: formatDate(item.date, 'YYYY-MM-DD'),
      shift: item.shift,
      expectedCash: item.expectedCash,
      actualCash: item.actualCash,
      reason: item.reason,
      note: item.note || ''
    });
    setModalOpen(true);
  };

  const handleProcess = (item: any) => {
    setCurrentItem(item);
    setHandleForm({
      handlingResult: item.handlingResult || 'adjusted',
      handlingNote: item.handlingNote || '',
      impactOnProfit: item.impactOnProfit || 0
    });
    setHandleModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await cashDiffApi.update(editingItem._id, formData);
      } else {
        res = await cashDiffApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadData();
        loadStats();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await cashDiffApi.handle(currentItem._id, handleForm);
      if (res.success) {
        setHandleModalOpen(false);
        loadData();
        loadStats();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      const res = await cashDiffApi.delete(id);
      if (res.success) { loadData(); loadStats(); }
      else alert(res.message);
    } catch (err) { alert('删除失败'); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>现金差异</h2>
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'store_manager') && (
          <button className="btn btn-primary" onClick={handleAdd}>+ 录入差异</button>
        )}
      </div>

      {stats && (
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-title">应收总额</div>
            <div className="stat-card-value" style={{ color: '#1890ff' }}>{formatMoney(stats.totalExpected)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">实收总额</div>
            <div className="stat-card-value" style={{ color: '#52c41a' }}>{formatMoney(stats.totalActual)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">差异总额</div>
            <div className="stat-card-value" style={{ color: stats.totalDiff >= 0 ? '#52c41a' : '#f56c6c' }}>
              {formatMoney(stats.totalDiff)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">待处理</div>
            <div className="stat-card-value" style={{ color: '#faad14' }}>{stats.pendingCount} 条</div>
          </div>
        </div>
      )}

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
            <select className="form-select" value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="">全部班次</option>
              <option value="morning">早班</option>
              <option value="afternoon">中班</option>
              <option value="evening">晚班</option>
              <option value="all_day">全天</option>
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={handlingResult} onChange={(e) => setHandlingResult(e.target.value)}>
              <option value="">全部处理状态</option>
              <option value="pending">待处理</option>
              <option value="adjusted">已调整</option>
              <option value="investigated">已调查</option>
              <option value="written_off">已核销</option>
              <option value="recovered">已追回</option>
            </select>
          </div>
          <div className="form-group">
            <input type="date" className="form-input" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <input type="date" className="form-input" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setPage(1); loadData(); loadStats(); }}>查询</button>
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
                  <th>班次</th>
                  <th>应收</th>
                  <th>实收</th>
                  <th>差异</th>
                  <th>差异类型</th>
                  <th>原因</th>
                  <th>处理结果</th>
                  <th>利润影响</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>暂无数据</td>
                  </tr>
                ) : (
                  list.map((item: any) => {
                    const statusTag = getStatusTag(item.handlingResult);
                    const diffTypeTag = getStatusTag(item.differenceType);
                    return (
                      <tr key={item._id}>
                        <td>{formatDate(item.date, 'YYYY-MM-DD')}</td>
                        <td>{item.store?.name || '-'}</td>
                        <td>{getTypeName(item.shift, 'shift')}</td>
                        <td>{formatMoney(item.expectedCash)}</td>
                        <td>{formatMoney(item.actualCash)}</td>
                        <td style={{ color: item.difference >= 0 ? '#52c41a' : '#f56c6c' }}>
                          {formatMoney(item.difference)}
                        </td>
                        <td><span className={`tag ${diffTypeTag.type}`}>{diffTypeTag.text}</span></td>
                        <td>{getTypeName(item.reason, 'cashReason')}</td>
                        <td><span className={`tag ${statusTag.type}`}>{statusTag.text}</span></td>
                        <td style={{ color: item.impactOnProfit >= 0 ? '#52c41a' : '#f56c6c' }}>
                          {formatMoney(item.impactOnProfit)}
                        </td>
                        <td>
                          {item.handlingResult === 'pending' && (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'store_manager') && (
                            <button className="btn btn-success btn-sm" onClick={() => handleProcess(item)}>处理</button>
                          )}
                          {(user?.role === 'admin' || user?.role === 'manager') && (
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingItem ? '编辑差异' : '录入现金差异'}</span>
              <span className="modal-close" onClick={() => setModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">门店 *</label>
                    <select className="form-select" value={formData.store}
                      onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                      required disabled={user?.role === 'store_manager'}>
                      <option value="">请选择门店</option>
                      {stores.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">日期 *</label>
                    <input type="date" className="form-input" value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">班次</label>
                  <select className="form-select" value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}>
                    <option value="morning">早班</option>
                    <option value="afternoon">中班</option>
                    <option value="evening">晚班</option>
                    <option value="all_day">全天</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">应收金额 (元)</label>
                    <input type="number" className="form-input" value={formData.expectedCash}
                      onChange={(e) => setFormData({ ...formData, expectedCash: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">实收金额 (元)</label>
                    <input type="number" className="form-input" value={formData.actualCash}
                      onChange={(e) => setFormData({ ...formData, actualCash: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">差异原因</label>
                  <select className="form-select" value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}>
                    <option value="change_error">找零错误</option>
                    <option value="register_error">收银机故障</option>
                    <option value="theft">偷盗</option>
                    <option value="discount">折扣</option>
                    <option value="refund">退款</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea className="form-textarea" value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3} placeholder="请输入备注说明" />
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

      {handleModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setHandleModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">处理现金差异</span>
              <span className="modal-close" onClick={() => setHandleModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleProcessSubmit}>
              <div className="modal-body">
                <div className="detail-item">
                  <div className="detail-label">日期</div>
                  <div className="detail-value">{formatDate(currentItem.date, 'YYYY-MM-DD')}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">差异金额</div>
                  <div className="detail-value" style={{ color: currentItem.difference >= 0 ? '#52c41a' : '#f56c6c' }}>
                    {formatMoney(currentItem.difference)}
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">处理结果</label>
                  <select className="form-select" value={handleForm.handlingResult}
                    onChange={(e) => setHandleForm({ ...handleForm, handlingResult: e.target.value })}>
                    <option value="adjusted">已调整</option>
                    <option value="investigated">已调查</option>
                    <option value="written_off">已核销</option>
                    <option value="recovered">已追回</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">处理说明 *</label>
                  <textarea className="form-textarea" value={handleForm.handlingNote}
                    onChange={(e) => setHandleForm({ ...handleForm, handlingNote: e.target.value })}
                    rows={3} required placeholder="请输入处理说明" />
                </div>
                <div className="form-group">
                  <label className="form-label">对利润的影响 (元)</label>
                  <input type="number" className="form-input" value={handleForm.impactOnProfit}
                    onChange={(e) => setHandleForm({ ...handleForm, impactOnProfit: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setHandleModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">确认</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
