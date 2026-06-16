import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { reminderApi, storeApi } from '~/utils/api';
import { formatDate, getStatusTag, getPriorityTag } from '~/utils/format';

export default function Reminders() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [processForm, setProcessForm] = useState({ processNote: '', status: 'processed' });
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const navigate = useNavigate();

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
  }, [page, type, status, priority, storeId, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (type) params.type = type;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (storeId) params.storeId = storeId;
      
      const res = await reminderApi.getList(params);
      if (res.success) {
        setList(res.data?.list || []);
        setTotal(res.data?.total || 0);
        setUnreadCount(res.data?.unreadCount || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleViewDetail = (item: any) => {
    setCurrentItem(item);
    setDetailOpen(true);
    if (item.status === 'pending') {
      reminderApi.markAsRead(item._id);
    }
  };

  const handleProcess = (item: any) => {
    setCurrentItem(item);
    setProcessForm({ processNote: '', status: 'processed' });
    setProcessModalOpen(true);
  };

  const handleDismiss = async (id: string) => {
    if (!confirm('确定忽略此提醒？')) return;
    try {
      const res = await reminderApi.dismiss(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('操作失败'); }
  };

  const handleMarkAllRead = async () => {
    try {
      const params: any = {};
      if (storeId) params.storeId = storeId;
      const res = await reminderApi.markAllAsRead(params);
      if (res.success) loadData();
    } catch (err) { alert('操作失败'); }
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await reminderApi.process(currentItem._id, processForm);
      if (res.success) {
        setProcessModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const totalPages = Math.ceil(total / pageSize);

  const typeOptions = [
    { value: 'inventory', label: '库存' },
    { value: 'rectification', label: '整改任务' },
    { value: 'member_coupon', label: '会员券包' },
    { value: 'profit', label: '利润' },
    { value: 'cash_difference', label: '现金差异' },
    { value: 'business', label: '营业/巡店' },
  ];

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      inventory: '📦',
      rectification: '📋',
      member_coupon: '🎫',
      profit: '💰',
      cash_difference: '💵',
      business: '📊',
    };
    return icons[type] || '🔔';
  };

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>
          催办提醒
          {unreadCount > 0 && <span className="tag tag-danger" style={{ marginLeft: '10px' }}>{unreadCount} 条未读</span>}
        </h2>
        <button className="btn btn-default" onClick={handleMarkAllRead}>全部已读</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="form-group">
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">全部类型</option>
              {typeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">全部优先级</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="read">已读</option>
              <option value="processed">已处理</option>
              <option value="dismissed">已忽略</option>
            </select>
          </div>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="form-group">
              <select className="form-select" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                <option value="">全部门店</option>
                {stores.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
              </select>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => { setPage(1); loadData(); }}>查询</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>类型</th>
                  <th>门店</th>
                  <th>标题</th>
                  <th>内容</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>到期时间</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>暂无提醒</td>
                  </tr>
                ) : (
                  list.map((item: any) => {
                    const statusTag = getStatusTag(item.status);
                    const priorityTag = getPriorityTag(item.priority);
                    return (
                      <tr key={item._id} style={{ background: item.status === 'pending' ? '#fffbe6' : 'inherit' }}>
                        <td>
                          <span style={{ fontSize: '20px' }}>{getTypeIcon(item.type)}</span>
                        </td>
                        <td>{item.store?.name || '-'}</td>
                        <td onClick={() => handleViewDetail(item)} style={{ cursor: 'pointer', color: '#1890ff', fontWeight: item.status === 'pending' ? '600' : 'normal' }}>
                          {item.title}
                        </td>
                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.content}
                        </td>
                        <td><span className={`tag ${priorityTag.type}`}>{priorityTag.text}</span></td>
                        <td><span className={`tag ${statusTag.type}`}>{statusTag.text}</span></td>
                        <td>{item.dueDate ? formatDate(item.dueDate, 'YYYY-MM-DD') : '-'}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          {(item.status === 'pending' || item.status === 'read') && (
                            <button className="btn btn-success btn-sm" onClick={() => handleProcess(item)}>处理</button>
                          )}
                          <button className="btn btn-default btn-sm ml-8" onClick={() => handleDismiss(item._id)}>忽略</button>
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

      {detailOpen && currentItem && (
        <div className="modal-mask" onClick={() => setDetailOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">提醒详情</span>
              <span className="modal-close" onClick={() => setDetailOpen(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-item"><div className="detail-label">类型</div><div className="detail-value">{typeOptions.find(t => t.value === currentItem.type)?.label || currentItem.type}</div></div>
              <div className="detail-item"><div className="detail-label">门店</div><div className="detail-value">{currentItem.store?.name || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">标题</div><div className="detail-value">{currentItem.title}</div></div>
              <div className="detail-item"><div className="detail-label">优先级</div><div className="detail-value">{getPriorityTag(currentItem.priority).text}</div></div>
              <div className="detail-item"><div className="detail-label">状态</div><div className="detail-value">{getStatusTag(currentItem.status).text}</div></div>
              <div className="detail-item"><div className="detail-label">内容</div><div className="detail-value">{currentItem.content}</div></div>
              <div className="detail-item"><div className="detail-label">规则名称</div><div className="detail-value">{currentItem.ruleName || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">到期时间</div><div className="detail-value">{currentItem.dueDate ? formatDate(currentItem.dueDate) : '-'}</div></div>
              <div className="detail-item"><div className="detail-label">创建时间</div><div className="detail-value">{formatDate(currentItem.createdAt)}</div></div>
              {currentItem.processNote && (
                <>
                  <div className="detail-item"><div className="detail-label">处理说明</div><div className="detail-value">{currentItem.processNote}</div></div>
                  <div className="detail-item"><div className="detail-label">处理人</div><div className="detail-value">{currentItem.processedBy?.name || '-'}</div></div>
                  <div className="detail-item"><div className="detail-label">处理时间</div><div className="detail-value">{formatDate(currentItem.processedAt)}</div></div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setDetailOpen(false)}>关闭</button>
              {(currentItem.status === 'pending' || currentItem.status === 'read') && (
                <button className="btn btn-primary ml-8" onClick={() => { setDetailOpen(false); handleProcess(currentItem); }}>处理</button>
              )}
            </div>
          </div>
        </div>
      )}

      {processModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setProcessModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">处理提醒</span>
              <span className="modal-close" onClick={() => setProcessModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleProcessSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">处理结果</label>
                  <select className="form-select" value={processForm.status}
                    onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}>
                    <option value="processed">已处理</option>
                    <option value="dismissed">已忽略</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">处理说明 *</label>
                  <textarea className="form-textarea" value={processForm.processNote}
                    onChange={(e) => setProcessForm({ ...processForm, processNote: e.target.value })}
                    rows={4} required placeholder="请输入处理说明" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setProcessModalOpen(false)}>取消</button>
                <button type="submit" className="btn btn-primary ml-8">确认</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
