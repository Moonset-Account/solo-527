import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useConfigItemStore } from '@/store/config-item.store';
import { useAssetStore } from '@/store/asset.store';

export default function ConfigItemPage() {
  const { items, total, loading, fetchConfigItems, createConfigItem, updateConfigItem, deleteConfigItem } = useConfigItemStore();
  const { assets, fetchAssets } = useAssetStore();
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ assetId: 0, key: '', value: '', environment: 'production', description: '' });

  useEffect(() => {
    fetchAssets({ limit: 100 });
  }, [fetchAssets]);

  useEffect(() => {
    fetchConfigItems({ page, limit: 20, assetId: selectedAssetId || undefined, keyword: keyword || undefined });
  }, [page, selectedAssetId, fetchConfigItems]);

  const openCreate = () => {
    setEditId(null);
    setForm({ assetId: selectedAssetId || 0, key: '', value: '', environment: 'production', description: '' });
    setShowModal(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditId(item.id as number);
    setForm({
      assetId: item.assetId as number,
      key: item.key as string,
      value: item.value as string,
      environment: item.environment as string,
      description: (item.description as string) || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (editId) {
      await updateConfigItem(editId, form);
    } else {
      await createConfigItem(form);
    }
    setShowModal(false);
    fetchConfigItems({ page, limit: 20, assetId: selectedAssetId || undefined, keyword: keyword || undefined });
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定删除该配置项吗？')) {
      await deleteConfigItem(id);
      fetchConfigItems({ page, limit: 20, assetId: selectedAssetId || undefined });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>配置项管理</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增配置项
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4">
          <h4 className="text-sm font-semibold mb-3">资产筛选</h4>
          <input
            className="input-field mb-3"
            placeholder="搜索资产..."
            onKeyDown={(e) => e.key === 'Enter' && fetchAssets({ limit: 100, keyword: (e.target as HTMLInputElement).value })}
          />
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            <button
              onClick={() => { setSelectedAssetId(null); setPage(1); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedAssetId === null ? 'bg-blue-50 text-[var(--color-primary)]' : 'hover:bg-gray-50'
              }`}
            >
              全部资产
            </button>
            {assets.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedAssetId(a.id); setPage(1); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedAssetId === a.id ? 'bg-blue-50 text-[var(--color-primary)]' : 'hover:bg-gray-50'
                }`}
              >
                {a.name}
                <span className="text-xs text-[var(--color-text-secondary)] ml-2">{a.assetCode}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-3">
          <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4 mb-4 flex items-center gap-3">
            <input
              className="input-field max-w-xs"
              placeholder="搜索配置键名..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchConfigItems({ page: 1, limit: 20, keyword: keyword || undefined, assetId: selectedAssetId || undefined })}
            />
            <button onClick={() => { setPage(1); fetchConfigItems({ page: 1, limit: 20, keyword: keyword || undefined, assetId: selectedAssetId || undefined }); }} className="btn-primary px-3 py-2">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[var(--color-border)]">
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">键</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">值</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">环境</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">描述</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-[var(--color-text-secondary)]">加载中...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-[var(--color-text-secondary)]">暂无配置项</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[#f8fafc]">
                      <td className="px-4 py-3 font-mono">{item.key}</td>
                      <td className="px-4 py-3 font-mono">{item.value}</td>
                      <td className="px-4 py-3">{item.environment}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{item.description || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(item as unknown as Record<string, unknown>)} className="text-[var(--color-primary)] hover:underline text-sm">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-[var(--color-danger)] hover:underline text-sm">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl card-shadow-md w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              {editId ? '编辑配置项' : '新增配置项'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">关联资产</label>
                <select
                  className="select-field"
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: Number(e.target.value) })}
                >
                  <option value={0}>请选择资产</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetCode})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">键</label>
                  <input className="input-field" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">值</label>
                  <input className="input-field" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">环境</label>
                <select className="select-field" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
                  <option value="production">生产环境</option>
                  <option value="staging">预发布</option>
                  <option value="development">开发环境</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea className="input-field min-h-[60px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
