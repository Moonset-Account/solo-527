import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useAssetStore } from '@/store/asset.store';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';

export default function AssetListPage() {
  const { assets, total, loading, fetchAssets, createAsset, updateAsset, deleteAsset } = useAssetStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ assetCode: '', name: '', type: 'server', status: 'running', location: '', description: '' });

  useEffect(() => {
    fetchAssets({ page, limit: 10, type: typeFilter || undefined, status: statusFilter || undefined, keyword: keyword || undefined });
  }, [page, typeFilter, statusFilter, fetchAssets]);

  const openCreate = () => {
    setEditId(null);
    setForm({ assetCode: '', name: '', type: 'server', status: 'running', location: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (asset: Record<string, unknown>) => {
    setEditId(asset.id as number);
    setForm({
      assetCode: asset.assetCode as string,
      name: asset.name as string,
      type: asset.type as string,
      status: asset.status as string,
      location: (asset.location as string) || '',
      description: (asset.description as string) || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (editId) {
      await updateAsset(editId, form);
    } else {
      await createAsset(form);
    }
    setShowModal(false);
    fetchAssets({ page, limit: 10, type: typeFilter || undefined, status: statusFilter || undefined });
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定删除该资产吗？')) {
      await deleteAsset(id);
      fetchAssets({ page, limit: 10, type: typeFilter || undefined, status: statusFilter || undefined });
    }
  };

  const typeLabels: Record<string, string> = { server: '服务器', network: '网络', software: '软件', account: '账号' };

  const columns = [
    { key: 'assetCode', title: '资产编码' },
    { key: 'name', title: '名称', render: (row: Record<string, unknown>) => (
      <span className="cursor-pointer hover:text-[var(--color-primary)]" onClick={() => navigate(`/assets/${row.id}`)}>
        {row.name as string}
      </span>
    )},
    { key: 'type', title: '类型', render: (row: Record<string, unknown>) => typeLabels[row.type as string] || row.type },
    { key: 'status', title: '状态', render: (row: Record<string, unknown>) => <StatusBadge status={row.status as string} /> },
    { key: 'location', title: '位置', render: (row: Record<string, unknown>) => (row.location as string) || '-' },
    { key: 'updatedAt', title: '更新时间', render: (row: Record<string, unknown>) => new Date(row.updatedAt as string).toLocaleString('zh-CN') },
    { key: 'actions', title: '操作', render: (row: Record<string, unknown>) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(row)} className="text-[var(--color-primary)] hover:underline text-sm">
          <Pencil className="w-4 h-4 inline" />
        </button>
        <button onClick={() => handleDelete(row.id as number)} className="text-[var(--color-danger)] hover:underline text-sm">
          <Trash2 className="w-4 h-4 inline" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>资产管理</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增资产
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4 flex items-center gap-4 flex-wrap">
        <select className="select-field w-32" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">全部类型</option>
          <option value="server">服务器</option>
          <option value="network">网络</option>
          <option value="software">软件</option>
          <option value="account">账号</option>
        </select>
        <select className="select-field w-32" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">全部状态</option>
          <option value="running">运行中</option>
          <option value="stopped">停用</option>
          <option value="maintenance">维护中</option>
        </select>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            className="input-field"
            placeholder="搜索资产名称或编码..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAssets({ page: 1, limit: 10, keyword: keyword || undefined })}
          />
          <button onClick={() => { setPage(1); fetchAssets({ page: 1, limit: 10, keyword: keyword || undefined }); }} className="btn-primary px-3 py-2">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={assets as unknown as Record<string, unknown>[]}
        total={total}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        loading={loading}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl card-shadow-md w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              {editId ? '编辑资产' : '新增资产'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">资产编码</label>
                <input className="input-field" value={form.assetCode} onChange={(e) => setForm({ ...form, assetCode: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">名称</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <select className="select-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="server">服务器</option>
                    <option value="network">网络</option>
                    <option value="software">软件</option>
                    <option value="account">账号</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">状态</label>
                  <select className="select-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="running">运行中</option>
                    <option value="stopped">停用</option>
                    <option value="maintenance">维护中</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">位置</label>
                <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea className="input-field min-h-[80px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSubmit} className="btn-primary">确定</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
