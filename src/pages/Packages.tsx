import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { usePackageStore } from '@/stores/packageStore';
import type { PackageType } from '../../shared/types';

export default function Packages() {
  const { packageTypes, loading, fetchPackageTypes, createPackageType, updatePackageType, deletePackageType } = usePackageStore();
  const [showModal, setShowModal] = useState(false);
  const [editPkg, setEditPkg] = useState<PackageType | null>(null);
  const [form, setForm] = useState({ name: '', total_sessions: 10, valid_days: 30, price: 0, description: '', active: true });

  useEffect(() => { fetchPackageTypes(); }, [fetchPackageTypes]);

  const openCreate = () => {
    setEditPkg(null);
    setForm({ name: '', total_sessions: 10, valid_days: 30, price: 0, description: '', active: true });
    setShowModal(true);
  };

  const openEdit = (p: PackageType) => {
    setEditPkg(p);
    setForm({ name: p.name, total_sessions: p.total_sessions, valid_days: p.valid_days, price: p.price, description: p.description || '', active: p.active });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPkg) {
      await updatePackageType(editPkg.id, form);
    } else {
      await createPackageType(form);
    }
    setShowModal(false);
    fetchPackageTypes();
  };

  const handleDelete = async (id: number) => {
    if (confirm('确认删除该套餐类型？')) {
      await deletePackageType(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />添加套餐类型</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packageTypes.map((pt) => (
            <div key={pt.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{pt.name}</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(pt)} className="p-1.5 text-accent hover:bg-orange-50 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(pt.id)} className="p-1.5 text-danger hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">课时数</span><span className="font-medium">{pt.total_sessions} 次</span></div>
                <div className="flex justify-between"><span className="text-gray-500">有效期</span><span className="font-medium">{pt.valid_days} 天</span></div>
                <div className="flex justify-between"><span className="text-gray-500">价格</span><span className="font-bold text-accent text-lg">¥{pt.price}</span></div>
                {pt.description && <p className="text-gray-400 text-xs mt-2">{pt.description}</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={`text-xs px-2 py-1 rounded-full ${pt.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {pt.active ? '在售' : '停售'}
                </span>
              </div>
            </div>
          ))}
          {packageTypes.length === 0 && <p className="text-gray-400 text-center py-12 col-span-3">暂无套餐类型</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editPkg ? '编辑套餐类型' : '添加套餐类型'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="套餐名称" className="input-field" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: Number(e.target.value) })} placeholder="课时数" className="input-field" required />
                <input type="number" value={form.valid_days} onChange={(e) => setForm({ ...form, valid_days: Number(e.target.value) })} placeholder="有效天数" className="input-field" required />
              </div>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="价格" className="input-field" required />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="描述" className="input-field" rows={2} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
                在售
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editPkg ? '保存' : '创建'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
