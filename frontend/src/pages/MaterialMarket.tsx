import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import { formatMoney } from '../utils/constants';

const categories = [
  { value: '', label: '全部分类' },
  { value: 'portrait', label: '人像' },
  { value: 'landscape', label: '风光' },
  { value: 'street', label: '街拍' },
  { value: 'architecture', label: '建筑' },
  { value: 'food', label: '美食' },
  { value: 'product', label: '产品' },
  { value: 'wedding', label: '婚礼' },
  { value: 'other', label: '其他' },
];

export default function MaterialMarket() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showOrder, setShowOrder] = useState(false);
  const [orderMaterial, setOrderMaterial] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({ licenseType: 'personal', quantity: 1, remark: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadList(); }, [page, keyword, category]);

  const loadList = async () => {
    const res: any = await api.get('/materials/public', {
      params: { status: 'on_shelf', category, keyword, page, pageSize: 12 },
    });
    setList(res.list || []);
    setTotal(res.total || 0);
  };

  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
  };

  const openOrderModal = (m: any) => {
    setOrderMaterial(m);
    setOrderForm({ licenseType: 'personal', quantity: 1, remark: '' });
    setShowOrder(true);
  };

  const handleCreateOrder = async () => {
    if (!orderMaterial) return;
    if (!user) { alert('请先登录'); return; }
    setSubmitting(true);
    try {
      await api.post('/orders', {
        photographerId: orderMaterial.photographer?.id || orderMaterial.photographerId,
        items: [{
          materialId: orderMaterial.id,
          licenseType: orderForm.licenseType,
          quantity: orderForm.quantity,
          remark: orderForm.remark,
        }],
        maxRevisionRounds: 2,
        remark: '',
      });
      alert('订单创建成功');
      setShowOrder(false);
      setOrderMaterial(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getPrice = (m: any, type: string) => {
    if (type === 'personal') return m.pricePersonal;
    if (type === 'commercial') return m.priceCommercial;
    return m.priceExclusive || 0;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索素材关键词..."
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-60 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <button onClick={handleSearch}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
              搜索
            </button>
          </div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
            {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {(keyword || category) && (
            <button onClick={() => { setKeyword(''); setCategory(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-primary-600">重置</button>
          )}
        </div>
        <span className="text-sm text-slate-500">共 {total} 个素材</span>
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
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                  上架中
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
              <button onClick={() => openOrderModal(m)}
                className="w-full px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
                购买授权
              </button>
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

      {showOrder && orderMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">创建订单</h3>
              <button onClick={() => { setShowOrder(false); setOrderMaterial(null); }}
                className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <img src={orderMaterial.coverImageUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20photography&image_size=square'}
                  alt={orderMaterial.title} className="w-16 h-12 object-cover rounded"
                  onError={(e: any) => { e.target.style.display = 'none'; }} />
                <div>
                  <div className="font-medium text-sm text-slate-800">{orderMaterial.title}</div>
                  <div className="text-xs text-slate-500">{orderMaterial.photographer?.name}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">授权类型 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'personal', label: '个人授权', price: orderMaterial.pricePersonal },
                    { value: 'commercial', label: '商业授权', price: orderMaterial.priceCommercial },
                    { value: 'exclusive', label: '独家授权', price: orderMaterial.priceExclusive },
                  ].map((opt) => (
                    <button key={opt.value}
                      onClick={() => setOrderForm({ ...orderForm, licenseType: opt.value })}
                      className={`p-2 border rounded-lg text-center text-sm transition ${
                        orderForm.licenseType === opt.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs mt-0.5">¥{formatMoney(opt.price)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">购买数量 *</label>
                <input type="number" min={1} value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">备注</label>
                <textarea value={orderForm.remark}
                  onChange={(e) => setOrderForm({ ...orderForm, remark: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border rounded-lg outline-none resize-none" />
              </div>

              <div className="bg-amber-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-slate-600">订单总额</span>
                <span className="text-xl font-bold text-amber-600">
                  ¥{formatMoney((getPrice(orderMaterial, orderForm.licenseType) || 0) * orderForm.quantity)}
                </span>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => { setShowOrder(false); setOrderMaterial(null); }}
                className="px-5 py-2 border rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={handleCreateOrder} disabled={submitting}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {submitting ? '提交中...' : '提交订单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
