import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { rectificationApi, storeApi, userApi } from '~/utils/api';
import { formatDate, getStatusTag, getPriorityTag, formatMoney, getTypeName } from '~/utils/format';

export default function Rectifications() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [storeId, setStoreId] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [submitForm, setSubmitForm] = useState({ submissionNote: '', submissionImages: [] as string[] });
  const [reviewForm, setReviewForm] = useState({ approved: true, reviewNote: '', impactOnProfit: 0, profitNote: '' });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    store: '',
    title: '',
    description: '',
    type: 'other',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    impactOnProfit: 0,
    profitNote: ''
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
  }, [page, storeId, type, priority, status, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (storeId) params.storeId = storeId;
      if (type) params.type = type;
      if (priority) params.priority = priority;
      if (status) params.status = status;
      
      const res = await rectificationApi.getList(params);
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
      title: '',
      description: '',
      type: 'other',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      impactOnProfit: 0,
      profitNote: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      store: item.store?._id || item.store,
      title: item.title,
      description: item.description,
      type: item.type,
      priority: item.priority,
      assignedTo: item.assignedTo?._id || item.assignedTo || '',
      dueDate: item.dueDate ? formatDate(item.dueDate, 'YYYY-MM-DD') : '',
      impactOnProfit: item.impactOnProfit || 0,
      profitNote: item.profitNote || ''
    });
    setModalOpen(true);
  };

  const handleViewDetail = (item: any) => {
    setCurrentItem(item);
    setDetailOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await rectificationApi.update(editingItem._id, formData);
      } else {
        res = await rectificationApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadData();
      } else {
        alert(res.message);
      }
    } catch (err) { alert('操作失败'); }
  };

  const handleSubmitTask = (item: any) => {
    setCurrentItem(item);
    setSubmitForm({ submissionNote: '', submissionImages: [] });
    setSubmitModalOpen(true);
  };

  const handleSubmitConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await rectificationApi.submit(currentItem._id, submitForm);
      if (res.success) {
        setSubmitModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('提交失败'); }
  };

  const handleReview = (item: any) => {
    setCurrentItem(item);
    setReviewForm({
      approved: true,
      reviewNote: '',
      impactOnProfit: item.impactOnProfit || 0,
      profitNote: item.profitNote || ''
    });
    setReviewModalOpen(true);
  };

  const handleReviewConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await rectificationApi.review(currentItem._id, reviewForm);
      if (res.success) {
        setReviewModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('审核失败'); }
  };

  const handleClose = async (id: string) => {
    if (!confirm('确定要关闭这个任务吗？')) return;
    try {
      const res = await rectificationApi.close(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个整改任务吗？')) return;
    try {
      const res = await rectificationApi.delete(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('删除失败'); }
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

  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
  ];

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>整改任务</h2>
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'store_manager') && (
          <button className="btn btn-primary" onClick={handleAdd}>+ 下发任务</button>
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
            <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">全部优先级</option>
              {priorityOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="submitted">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
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
                  <th>任务编号</th>
                  <th>门店</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>优先级</th>
                  <th>负责人</th>
                  <th>截止日期</th>
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
                    const priorityTag = getPriorityTag(item.priority);
                    return (
                      <tr key={item._id}>
                        <td>{item.taskNo}</td>
                        <td>{item.store?.name || '-'}</td>
                        <td onClick={() => handleViewDetail(item)} style={{ cursor: 'pointer', color: '#1890ff' }}>
                          {item.title}
                        </td>
                        <td>{getTypeName(item.type, 'anomaly')}</td>
                        <td><span className={`tag ${priorityTag.type}`}>{priorityTag.text}</span></td>
                        <td>{item.assignedTo?.name || '-'}</td>
                        <td>{item.dueDate ? formatDate(item.dueDate, 'YYYY-MM-DD') : '-'}</td>
                        <td style={{ color: item.impactOnProfit >= 0 ? '#52c41a' : '#f56c6c' }}>
                          {formatMoney(item.impactOnProfit)}
                        </td>
                        <td><span className={`tag ${statusTag.type}`}>{statusTag.text}</span></td>
                        <td>
                          <button className="btn btn-default btn-sm" onClick={() => handleViewDetail(item)}>详情</button>
                          {(item.status === 'pending' || item.status === 'in_progress' || item.status === 'rejected') && (
                            <button className="btn btn-success btn-sm ml-8" onClick={() => handleSubmitTask(item)}>提交</button>
                          )}
                          {item.status === 'submitted' && (user?.role === 'admin' || user?.role === 'manager') && (
                            <button className="btn btn-warning btn-sm ml-8" onClick={() => handleReview(item)}>审核</button>
                          )}
                          {(item.status === 'pending' || item.status === 'in_progress') && (
                            <button className="btn btn-default btn-sm ml-8" onClick={() => handleEdit(item)}>编辑</button>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '550px' }}>
            <div className="modal-header">
              <span className="modal-title">{editingItem ? '编辑整改任务' : '下发整改任务'}</span>
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
                <div className="form-group">
                  <label className="form-label">任务标题 *</label>
                  <input type="text" className="form-input" value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">类型</label>
                    <select className="form-select" value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                      {typeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">优先级</label>
                    <select className="form-select" value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                      {priorityOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
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
                    <label className="form-label">截止日期</label>
                    <input type="date" className="form-input" value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">任务描述</label>
                  <textarea className="form-textarea" value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3} />
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '550px' }}>
            <div className="modal-header">
              <span className="modal-title">整改任务详情</span>
              <span className="modal-close" onClick={() => setDetailOpen(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-item"><div className="detail-label">任务编号</div><div className="detail-value">{currentItem.taskNo}</div></div>
              <div className="detail-item"><div className="detail-label">门店</div><div className="detail-value">{currentItem.store?.name}</div></div>
              <div className="detail-item"><div className="detail-label">标题</div><div className="detail-value">{currentItem.title}</div></div>
              <div className="detail-item"><div className="detail-label">类型</div><div className="detail-value">{getTypeName(currentItem.type, 'anomaly')}</div></div>
              <div className="detail-item"><div className="detail-label">优先级</div><div className="detail-value">{getPriorityTag(currentItem.priority).text}</div></div>
              <div className="detail-item"><div className="detail-label">状态</div><div className="detail-value">{getStatusTag(currentItem.status).text}</div></div>
              <div className="detail-item"><div className="detail-label">负责人</div><div className="detail-value">{currentItem.assignedTo?.name || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">下发人</div><div className="detail-value">{currentItem.assignedBy?.name || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">截止日期</div><div className="detail-value">{currentItem.dueDate ? formatDate(currentItem.dueDate, 'YYYY-MM-DD') : '-'}</div></div>
              <div className="detail-item"><div className="detail-label">利润影响</div><div className="detail-value">{formatMoney(currentItem.impactOnProfit)}</div></div>
              <div className="detail-item"><div className="detail-label">利润说明</div><div className="detail-value">{currentItem.profitNote || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">任务描述</div><div className="detail-value">{currentItem.description || '-'}</div></div>
              {currentItem.submittedAt && (
                <>
                  <div className="detail-item"><div className="detail-label">提交时间</div><div className="detail-value">{formatDate(currentItem.submittedAt)}</div></div>
                  <div className="detail-item"><div className="detail-label">提交说明</div><div className="detail-value">{currentItem.submissionNote || '-'}</div></div>
                </>
              )}
              {currentItem.reviewedAt && (
                <>
                  <div className="detail-item"><div className="detail-label">审核人</div><div className="detail-value">{currentItem.reviewedBy?.name || '-'}</div></div>
                  <div className="detail-item"><div className="detail-label">审核时间</div><div className="detail-value">{formatDate(currentItem.reviewedAt)}</div></div>
                  <div className="detail-item"><div className="detail-label">审核意见</div><div className="detail-value">{currentItem.reviewNote || '-'}</div></div>
                </>
              )}
              <div className="detail-item"><div className="detail-label">创建时间</div><div className="detail-value">{formatDate(currentItem.createdAt)}</div></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setDetailOpen(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {submitModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setSubmitModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">提交整改</span>
              <span className="modal-close" onClick={() => setSubmitModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleSubmitConfirm}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">整改说明 *</label>
                  <textarea className="form-textarea" value={submitForm.submissionNote}
                    onChange={(e) => setSubmitForm({ ...submitForm, submissionNote: e.target.value })}
                    rows={4} required placeholder="请描述整改完成情况" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setSubmitModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setReviewModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">审核整改</span>
              <span className="modal-close" onClick={() => setReviewModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleReviewConfirm}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">审核结果</label>
                  <select className="form-select" value={reviewForm.approved ? 'true' : 'false'}
                    onChange={(e) => setReviewForm({ ...reviewForm, approved: e.target.value === 'true' })}>
                    <option value="true">通过</option>
                    <option value="false">驳回</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">审核意见</label>
                  <textarea className="form-textarea" value={reviewForm.reviewNote}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewNote: e.target.value })}
                    rows={3} placeholder="请输入审核意见" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">最终利润影响 (元)</label>
                    <input type="number" className="form-input" value={reviewForm.impactOnProfit}
                      onChange={(e) => setReviewForm({ ...reviewForm, impactOnProfit: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">利润说明</label>
                    <input type="text" className="form-input" value={reviewForm.profitNote}
                      onChange={(e) => setReviewForm({ ...reviewForm, profitNote: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setReviewModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">确认</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
