import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { logApi, storeApi, userApi } from '~/utils/api';
import { formatDate, getRoleName } from '~/utils/format';

export default function Logs() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [storeId, setStoreId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState<any>(null);
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
  }, [page, module, action, storeId, keyword, startDate, endDate, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (module) params.module = module;
      if (action) params.action = action;
      if (storeId) params.storeId = storeId;
      if (keyword) params.keyword = keyword;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await logApi.getList(params);
      if (res.success) {
        setList(res.data?.list || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleViewDetail = (log: any) => {
    setCurrentLog(log);
    setDetailOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  const moduleOptions = [
    'auth', 'store', 'user', 'business', 'anomaly',
    'rectification', 'inventory', 'member_coupon',
    'cash_difference', 'reminder', 'inspection', 'log'
  ];

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>操作日志</h2>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="form-group">
            <select className="form-select" value={module} onChange={(e) => setModule(e.target.value)}>
              <option value="">全部模块</option>
              {moduleOptions.map(m => (<option key={m} value={m}>{m}</option>))}
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
          <div className="form-group">
            <input type="text" className="form-input" placeholder="搜索描述/用户"
              value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div className="form-group">
            <input type="date" className="form-input" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <input type="date" className="form-input" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} />
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
                  <th>时间</th>
                  <th>用户</th>
                  <th>门店</th>
                  <th>模块</th>
                  <th>动作</th>
                  <th>描述</th>
                  <th>状态</th>
                  <th>IP</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>暂无数据</td>
                  </tr>
                ) : (
                  list.map((log: any) => (
                    <tr key={log._id}>
                      <td>{formatDate(log.createdAt)}</td>
                      <td>{log.user?.name || log.username}</td>
                      <td>{log.store?.name || '-'}</td>
                      <td><span className="tag tag-info">{log.module}</span></td>
                      <td>{log.action}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.description}
                      </td>
                      <td>
                        <span className={`tag ${log.status === 'success' ? 'tag-success' : 'tag-danger'}`}>
                          {log.status === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                      <td>{log.ip || '-'}</td>
                      <td>
                        <button className="btn btn-default btn-sm" onClick={() => handleViewDetail(log)}>详情</button>
                      </td>
                    </tr>
                  ))
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

      {detailOpen && currentLog && (
        <div className="modal-mask" onClick={() => setDetailOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '600px' }}>
            <div className="modal-header">
              <span className="modal-title">日志详情</span>
              <span className="modal-close" onClick={() => setDetailOpen(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-item"><div className="detail-label">操作时间</div><div className="detail-value">{formatDate(currentLog.createdAt)}</div></div>
              <div className="detail-item"><div className="detail-label">操作用户</div><div className="detail-value">{currentLog.user?.name || currentLog.username}</div></div>
              <div className="detail-item"><div className="detail-label">所属门店</div><div className="detail-value">{currentLog.store?.name || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">模块</div><div className="detail-value">{currentLog.module}</div></div>
              <div className="detail-item"><div className="detail-label">动作</div><div className="detail-value">{currentLog.action}</div></div>
              <div className="detail-item"><div className="detail-label">目标类型</div><div className="detail-value">{currentLog.targetType || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">目标ID</div><div className="detail-value">{currentLog.targetId || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">描述</div><div className="detail-value">{currentLog.description || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">状态</div><div className="detail-value">{currentLog.status === 'success' ? '成功' : '失败'}</div></div>
              {currentLog.errorMessage && (
                <div className="detail-item"><div className="detail-label">错误信息</div><div className="detail-value" style={{ color: '#f56c6c' }}>{currentLog.errorMessage}</div></div>
              )}
              <div className="detail-item"><div className="detail-label">IP地址</div><div className="detail-value">{currentLog.ip || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">请求方式</div><div className="detail-value">{currentLog.requestMethod || '-'}</div></div>
              <div className="detail-item"><div className="detail-label">请求URL</div><div className="detail-value">{currentLog.requestUrl || '-'}</div></div>
              {currentLog.fieldChanges && currentLog.fieldChanges.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '8px' }}>字段变更:</div>
                  <div style={{ background: '#f5f7fa', padding: '12px', borderRadius: '4px' }}>
                    {currentLog.fieldChanges.map((change: any, index: number) => (
                      <div key={index} style={{ padding: '4px 0', borderBottom: index < currentLog.fieldChanges.length - 1 ? '1px dashed #ebeef5' : 'none' }}>
                        <span style={{ color: '#909399' }}>{change.field}:</span>{' '}
                        <span style={{ color: '#f56c6c' }}>{String(change.oldValue ?? '-')}</span>
                        {' → '}
                        <span style={{ color: '#67c23a' }}>{String(change.newValue ?? '-')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setDetailOpen(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
