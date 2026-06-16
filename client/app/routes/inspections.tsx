import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { inspectionApi, storeApi, userApi } from '~/utils/api';
import { formatDate, getStatusTag, getTypeName, formatMoney } from '~/utils/format';

export default function Inspections() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [storeId, setStoreId] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [completeForm, setCompleteForm] = useState({
    checklist: [] as any[],
    score: 0,
    notes: '',
    impactOnProfit: 0,
    profitNote: ''
  });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    store: '',
    title: '',
    type: 'daily',
    scheduledDate: '',
    dueDate: '',
    assignedTo: '',
    reminderDays: 1,
    impactOnProfit: 0,
    profitNote: '',
    checklist: [] as any[]
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
    loadUsers();
  }, [navigate]);

  const loadStores = async () => {
    try {
      const res = await storeApi.getList({ pageSize: 100 });
      if (res.success) setStores(res.data?.list || []);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const res = await userApi.getList({ pageSize: 100 });
      if (res.success) setUsers(res.data?.list || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user) loadData();
  }, [page, storeId, type, status, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (storeId) params.storeId = storeId;
      if (type) params.type = type;
      if (status) params.status = status;
      
      const res = await inspectionApi.getList(params);
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
    const defaultChecklist = [
      { item: '环境卫生检查', category: '卫生', status: 'n/a', note: '', image: '' },
      { item: '设备运行检查', category: '设备', status: 'n/a', note: '', image: '' },
      { item: '服务质量检查', category: '服务', status: 'n/a', note: '', image: '' },
      { item: '库存管理检查', category: '库存', status: 'n/a', note: '', image: '' },
      { item: '食品安全检查', category: '卫生', status: 'n/a', note: '', image: '' },
    ];
    setFormData({
      store: defaultStore || '',
      title: '',
      type: 'daily',
      scheduledDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      assignedTo: '',
      reminderDays: 1,
      impactOnProfit: 0,
      profitNote: '',
      checklist: defaultChecklist
    });
    setModalOpen(true);
  };

  const handleViewDetail = (item: any) => {
    setCurrentItem(item);
    setDetailOpen(true);
  };

  const handleStart = async (id: string) => {
    try {
      const res = await inspectionApi.start(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('操作失败'); }
  };

  const handleComplete = (item: any) => {
    setCurrentItem(item);
    setCompleteForm({
      checklist: item.checklist?.map((c: any) => ({ ...c })) || [],
      score: item.score || 0,
      notes: item.notes || '',
      impactOnProfit: item.impactOnProfit || 0,
      profitNote: item.profitNote || ''
    });
    setCompleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await inspectionApi.update(editingItem._id, formData);
      } else {
        res = await inspectionApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await inspectionApi.complete(currentItem._id, completeForm);
      if (res.success) {
        setCompleteModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此巡店任务？')) return;
    try {
      const res = await inspectionApi.delete(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('删除失败'); }
  };

  const totalPages = Math.ceil(total / pageSize);

  const typeOptions = [
    { value: 'daily', label: '日常巡检' },
    { value: 'weekly', label: '周度检查' },
    { value: 'monthly', label: '月度检查' },
    { value: 'special', label: '专项检查' },
    { value: 'random', label: '随机抽查' },
  ];

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>巡店任务</h2>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button className="btn btn-primary" onClick={handleAdd}>+ 创建巡店</button>
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
              <option value="scheduled">已排期</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="overdue">已逾期</option>
              <option value="cancelled">已取消</option>
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
                  <th>任务编号</th>
                  <th>门店</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>负责人</th>
                  <th>计划日期</th>
                  <th>分数</th>
                  <th>利润影响</th>
                  <th>状态</th>
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
                        <td>{item.taskNo}</td>
                        <td>{item.store?.name || '-'}</td>
                        <td onClick={() => handleViewDetail(item)} style={{ cursor: 'pointer', color: '#1890ff' }}>
                          {item.title}
                        </td>
                        <td>{getTypeName(item.type, 'inspection')}</td>
                        <td>{item.assignedTo?.name || '-'}</td>
                        <td>{item.scheduledDate ? formatDate(item.scheduledDate, 'YYYY-MM-DD') : '-'}</td>
                        <td>{item.score || '-'}/{item.totalScore || 100}</td>
                        <td style={{ color: item.impactOnProfit >= 0 ? '#52c41a' : '#f56c6c' }}>
                          {formatMoney(item.impactOnProfit)}
                        </td>
                        <td><span className={`tag ${statusTag.type}`}>{statusTag.text}</span></td>
                        <td>
                          <button className="btn btn-default btn-sm" onClick={() => handleViewDetail(item)}>详情</button>
                          {item.status === 'scheduled' && (
                            <button className="btn btn-success btn-sm ml-8" onClick={() => handleStart(item._id)}>开始</button>
                          )}
                          {item.status === 'in_progress' && (
                            <button className="btn btn-primary btn-sm ml-8" onClick={() => handleComplete(item)}>完成</button>
                          )}
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button className="btn btn-danger btn-sm ml-8" onClick={() => handleDelete(item._id)}>删除</button>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '550px', maxHeight: '85vh' }}>
            <div className="modal-header">
              <span className="modal-title">{editingItem ? '编辑巡店任务' : '创建巡店任务'}</span>
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
                    <label className="form-label">任务标题 *</label>
                    <input type="text" className="form-input" value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
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
                    <label className="form-label">计划日期 *</label>
                    <input type="date" className="form-input" value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">截止日期</label>
                    <input type="date" className="form-input" value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">负责人</label>
                    <select className="form-select" value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}>
                      <option value="">请选择</option>
                      {users.filter(u => u.store?._id === formData.store || u.store === formData.store).map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">提前提醒天数</label>
                    <input type="number" className="form-input" value={formData.reminderDays}
                      onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">利润影响 (元)</label>
                    <input type="number" className="form-input" value={formData.impactOnProfit}
                      onChange={(e) => setFormData({ ...formData, impactOnProfit: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">利润说明</label>
                    <input type="text" className="form-input" value={formData.profitNote}
                      onChange={(e) => setFormData({ ...formData, profitNote: e.target.value })} />
                  </div>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '550px', maxHeight: '85vh' }}>
            <div className="modal-header">
              <span className="modal-title">巡店任务详情</span>
              <span className="modal-close" onClick={() => setDetailOpen(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-item"><div className="detail-label">任务编号</div><div className="detail-value">{currentItem.taskNo}</div></div>
              <div className="detail-item"><div className="detail-label">门店</div><div className="detail-value">{currentItem.store?.name}</div></div>
              <div className="detail-item"><div className="detail-label">标题</div><div className="detail-value">{currentItem.title}</div></div>
              <div className="detail-item"><div className="detail-label">类型</div><div className="detail-value">{getTypeName(currentItem.type, 'inspection')}</div></div>
              <div className="detail-item"><div className="detail-label">状态</div><div className="detail-value">{getStatusTag(currentItem.status).text}</div></div>
              <div className="detail-item"><div className="detail-label">负责人</div><div className="detail-value">{currentItem.assignedTo?.name || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">计划日期</div><div className="detail-value">{formatDate(currentItem.scheduledDate, 'YYYY-MM-DD')}</div></div>
              <div className="detail-item"><div className="detail-label">得分</div><div className="detail-value">{currentItem.score || 0} / {currentItem.totalScore || 100}</div></div>
              <div className="detail-item"><div className="detail-label">利润影响</div><div className="detail-value">{formatMoney(currentItem.impactOnProfit)}</div></div>
              {currentItem.notes && (
                <div className="detail-item"><div className="detail-label">备注</div><div className="detail-value">{currentItem.notes}</div></div>
              )}
              {currentItem.checklist && currentItem.checklist.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '8px' }}>检查项:</div>
                  <table>
                    <thead>
                      <tr><th>分类</th><th>检查项</th><th>结果</th><th>备注</th></tr>
                    </thead>
                    <tbody>
                      {currentItem.checklist.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td>{item.category}</td>
                          <td>{item.item}</td>
                          <td>
                            <span className={`tag ${item.status === 'pass' ? 'tag-success' : item.status === 'fail' ? 'tag-danger' : 'tag-default'}`}>
                              {item.status === 'pass' ? '通过' : item.status === 'fail' ? '不通过' : '未检查'}
                            </span>
                          </td>
                          <td>{item.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setDetailOpen(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {completeModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setCompleteModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '600px', maxHeight: '85vh' }}>
            <div className="modal-header">
              <span className="modal-title">完成巡店</span>
              <span className="modal-close" onClick={() => setCompleteModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleCompleteSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '12px', fontWeight: '500' }}>检查项评分:</div>
                {completeForm.checklist.map((item, index) => (
                  <div key={index} style={{ padding: '8px', background: '#f5f7fa', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>{item.category} - {item.item}</span>
                      <select
                        value={item.status}
                        onChange={(e) => {
                          const newChecklist = [...completeForm.checklist];
                          newChecklist[index].status = e.target.value;
                          setCompleteForm({ ...completeForm, checklist: newChecklist });
                        }}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #dcdfe6' }}
                      >
                        <option value="n/a">未检查</option>
                        <option value="pass">通过</option>
                        <option value="fail">不通过</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="备注"
                      value={item.note || ''}
                      onChange={(e) => {
                        const newChecklist = [...completeForm.checklist];
                        newChecklist[index].note = e.target.value;
                        setCompleteForm({ ...completeForm, checklist: newChecklist });
                      }}
                      style={{ width: '100%', padding: '4px 8px', border: '1px solid #dcdfe6', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                ))}
                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">总得分</label>
                    <input type="number" className="form-input" value={completeForm.score}
                      onChange={(e) => setCompleteForm({ ...completeForm, score: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">利润影响 (元)</label>
                    <input type="number" className="form-input" value={completeForm.impactOnProfit}
                      onChange={(e) => setCompleteForm({ ...completeForm, impactOnProfit: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">利润说明</label>
                  <input type="text" className="form-input" value={completeForm.profitNote}
                    onChange={(e) => setCompleteForm({ ...completeForm, profitNote: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">巡店备注</label>
                  <textarea className="form-textarea" value={completeForm.notes}
                    onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                    rows={3} placeholder="请输入巡店总结" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setCompleteModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
