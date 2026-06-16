import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import AppLayout from '~/components/Layout';
import { userApi, storeApi } from '~/utils/api';
import { formatDate, getRoleName, getStatusTag } from '~/utils/format';

export default function Users() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'store_manager',
    store: '',
    email: '',
    phone: '',
    status: 'active',
    permissions: [] as string[]
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadStores();
    loadData();
  }, [navigate]);

  const loadStores = async () => {
    try {
      const res = await storeApi.getList({ pageSize: 100 });
      if (res.success) setStores(res.data?.list || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [page, role, status, keyword, storeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (role) params.role = role;
      if (status) params.status = status;
      if (keyword) params.keyword = keyword;
      if (storeId) params.storeId = storeId;
      
      const res = await userApi.getList(params);
      if (res.success) {
        setList(res.data?.list || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'store_manager',
      store: '',
      email: '',
      phone: '',
      status: 'active',
      permissions: []
    });
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      username: item.username,
      password: '',
      name: item.name,
      role: item.role,
      store: item.store?._id || item.store || '',
      email: item.email || '',
      phone: item.phone || '',
      status: item.status,
      permissions: item.permissions || []
    });
    setModalOpen(true);
  };

  const handlePermissions = (item: any) => {
    setCurrentItem(item);
    setPermissions(item.permissions || []);
    setPermissionModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        const { password, ...updateData } = formData;
        if (password) {
          (updateData as any).password = password;
        }
        res = await userApi.update(editingItem._id, updateData);
      } else {
        res = await userApi.create(formData);
      }
      
      if (res.success) {
        setModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handlePermissionSubmit = async () => {
    try {
      const res = await userApi.updatePermissions(currentItem._id, permissions);
      if (res.success) {
        setPermissionModalOpen(false);
        loadData();
      } else { alert(res.message); }
    } catch (err) { alert('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此用户？')) return;
    try {
      const res = await userApi.delete(id);
      if (res.success) loadData();
      else alert(res.message);
    } catch (err) { alert('删除失败'); }
  };

  const togglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter(p => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const roleOptions = [
    { value: 'admin', label: '系统管理员' },
    { value: 'manager', label: '区域经理' },
    { value: 'store_manager', label: '门店店长' },
    { value: 'staff', label: '普通员工' },
  ];

  const allPermissions = [
    { key: 'store:read', label: '门店查看' },
    { key: 'store:write', label: '门店编辑' },
    { key: 'user:read', label: '用户查看' },
    { key: 'user:write', label: '用户编辑' },
    { key: 'business:read', label: '营业数据查看' },
    { key: 'business:write', label: '营业数据编辑' },
    { key: 'anomaly:read', label: '异常查看' },
    { key: 'anomaly:write', label: '异常编辑' },
    { key: 'rectification:read', label: '整改任务查看' },
    { key: 'rectification:write', label: '整改任务编辑' },
    { key: 'inventory:read', label: '库存查看' },
    { key: 'inventory:write', label: '库存编辑' },
    { key: 'log:read', label: '日志查看' },
  ];

  return (
    <AppLayout>
      <div className="flex-between mb-20">
        <h2 className="page-title" style={{ margin: 0 }}>用户管理</h2>
        <button className="btn btn-primary" onClick={handleAdd}>+ 新增用户</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="form-group">
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">全部角色</option>
              {roleOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="active">启用</option>
              <option value="inactive">禁用</option>
            </select>
          </div>
          <div className="form-group">
            <select className="form-select" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="">全部门店</option>
              {stores.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <input type="text" className="form-input" placeholder="搜索用户名/姓名"
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
                  <th>用户名</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>门店</th>
                  <th>手机号</th>
                  <th>状态</th>
                  <th>最后登录</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#909399', padding: '40px' }}>暂无数据</td>
                  </tr>
                ) : (
                  list.map((item: any) => {
                    const statusTag = getStatusTag(item.status);
                    return (
                      <tr key={item._id}>
                        <td>{item.username}</td>
                        <td>{item.name}</td>
                        <td>{getRoleName(item.role)}</td>
                        <td>{item.store?.name || '-'}</td>
                        <td>{item.phone || '-'}</td>
                        <td><span className={`tag ${statusTag.type}`}>{statusTag.text}</span></td>
                        <td>{item.lastLoginAt ? formatDate(item.lastLoginAt) : '-'}</td>
                        <td>
                          <button className="btn btn-default btn-sm" onClick={() => handleEdit(item)}>编辑</button>
                          <button className="btn btn-warning btn-sm ml-8" onClick={() => handlePermissions(item)}>权限</button>
                          {item.role !== 'admin' && (
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
              <span className="modal-title">{editingItem ? '编辑用户' : '新增用户'}</span>
              <span className="modal-close" onClick={() => setModalOpen(false)}>×</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">用户名 *</label>
                    <input type="text" className="form-input" value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required disabled={!!editingItem} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{editingItem ? '新密码 (留空不修改)' : '密码 *'}</label>
                    <input type="password" className="form-input" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingItem} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">姓名 *</label>
                    <input type="text" className="form-input" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">角色</label>
                    <select className="form-select" value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      {roleOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">所属门店</label>
                    <select className="form-select" value={formData.store}
                      onChange={(e) => setFormData({ ...formData, store: e.target.value })}>
                      <option value="">请选择门店</option>
                      {stores.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">手机号</label>
                    <input type="text" className="form-input" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">邮箱</label>
                  <input type="email" className="form-input" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">状态</label>
                  <select className="form-select" value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                  </select>
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

      {permissionModalOpen && currentItem && (
        <div className="modal-mask" onClick={() => setPermissionModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">用户权限 - {currentItem.name}</span>
              <span className="modal-close" onClick={() => setPermissionModalOpen(false)}>×</span>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {allPermissions.map(perm => (
                  <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={() => setPermissionModalOpen(false)}>取消</button>
              <button className="btn btn-primary ml-8" onClick={handlePermissionSubmit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
