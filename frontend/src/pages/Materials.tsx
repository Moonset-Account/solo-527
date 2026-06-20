import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import { MaterialStatusText, formatMoney, formatDate, UserRole } from '../utils/constants';

export default function Materials() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: '', category: '', keyword: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({
    title: '', description: '', coverImageUrl: '', category: 'other',
    pricePersonal: 0, priceCommercial: 0, priceExclusive: undefined,
    tags: [], licenseDescription: '',
  });

  useEffect(() => { loadList(); }, [page, filter]);

  const loadList = async () => {
    const res: any = await api.get('/materials', { params: { ...filter, page, pageSize: 12 } });
    setList(res.list || []);
    setTotal(res.total || 0);
  };

  const handleCreate = async () => {
    try {
      await api.post('/materials', form);
      setShowCreate(false);
      setForm({ title: '', description: '', coverImageUrl: '', category: 'other',
        pricePersonal: 0, priceCommercial: 0, priceExclusive: undefined, tags: [], licenseDescription: '' });
      loadList();
    } catch (e: any) { alert(e.message); }
  };

  const toggleShelf = async (item: any) => {
    try {
      if (item.status === 'on_shelf') {
        await api.put(`/materials/${item.id}/off-shelf`);
      } else {
        await api.put(`/materials/${item.id}/on-shelf`);
      }
      loadList();
    } catch (e: any) { alert(e.message); }
  };

  const statusColor: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    on_shelf: 'bg-green-100 text-green-700',
    off_shelf: 'bg-orange-100 text-orange-700',
    archived: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={filter.keyword}
            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
            placeholder="搜索素材名称..."
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-60 focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="on_shelf">上架中</option>
            <option value="off_shelf">已下架</option>
          </select>
          <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
            <option value="">全部分类</option>
            <option value="portrait">人像</option>
            <option value="landscape">风光</option>
            <option value="street">街拍</option>
            <option value="architecture">建筑</option>
            <option value="food">美食</option>
            <option value="product">产品</option>
            <option value="wedding">婚礼</option>
            <option value="other">其他</option>
          </select>
        </div>

        {(user?.role === UserRole.ADMIN || user?.role === UserRole.PHOTOGRAPHER) && (
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
            + 上架新素材
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {list.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400">暂无素材数据</div>
        )}
        {list.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition">
            <Link to={`/materials/${m.id}`}>
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                <img src={m.coverImageUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20photography&image_size=square'}
                  alt={m.title} className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  onError={(e: any) => { e.target.style.display = 'none'; }} />
                <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-xs ${statusColor[m.status] || ''}`}>
                  {MaterialStatusText[m.status] || m.status}
                </span>
              </div>
            </Link>
            <div className="p-4">
              <Link to={`/materials/${m.id}`}>
                <h4 className="font-medium text-slate-800 truncate mb-2">{m.title}</h4>
              </Link>
              <div className="text-xs text-slate-500 mb-3">
                <span>{m.photographer?.name}</span>
                <span className="mx-2">·</span>
                <span>浏览 {m.viewCount}</span>
                <span className="mx-2">·</span>
                <span>销量 {m.saleCount}</span>
              </div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-400">个人授权</div>
                  <div className="text-lg font-bold text-amber-600">¥{formatMoney(m.pricePersonal)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">商业授权</div>
                  <div className="text-base font-semibold text-primary-600">¥{formatMoney(m.priceCommercial)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleShelf(m)}
                  className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50 transition">
                  {m.status === 'on_shelf' ? '下架' : '上架'}
                </button>
                <Link to={`/materials/${m.id}`}
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-900 transition text-center">
                  管理
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {total > 12 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">上一页</button>
          <span className="text-sm text-slate-500">第 {page} 页 / 共 {Math.ceil(total / 12)} 页</span>
          <button onClick={() => setPage(page + 1)} disabled={page * 12 >= total}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">下一页</button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-lg">上架新素材</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">素材标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">分类</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-none">
                    <option value="portrait">人像</option>
                    <option value="landscape">风光</option>
                    <option value="street">街拍</option>
                    <option value="architecture">建筑</option>
                    <option value="food">美食</option>
                    <option value="product">产品</option>
                    <option value="wedding">婚礼</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">封面图片URL</label>
                  <input value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">个人授权价 ¥</label>
                  <input type="number" value={form.pricePersonal}
                    onChange={(e) => setForm({ ...form, pricePersonal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">商业授权价 ¥</label>
                  <input type="number" value={form.priceCommercial}
                    onChange={(e) => setForm({ ...form, priceCommercial: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">独家授权价 ¥</label>
                  <input type="number" value={form.priceExclusive ?? ''}
                    onChange={(e) => setForm({ ...form, priceExclusive: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">素材描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 border rounded-lg outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">授权说明</label>
                <textarea value={form.licenseDescription} onChange={(e) => setForm({ ...form, licenseDescription: e.target.value })}
                  rows={3} placeholder="详细说明授权范围、使用限制等"
                  className="w-full px-3 py-2 border rounded-lg outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
                <input placeholder="例如: 人像, 写真, 夜景"
                  onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border rounded-lg outline-none" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setShowCreate(false)}
                className="px-5 py-2 border rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={handleCreate}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">确认上架</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
