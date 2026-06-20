import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import {
  formatMoney, formatDate, OrderStatusText, OrderStatusColor, UserRole,
} from '../utils/constants';

export default function ClientOrderConfirm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const o: any = await api.get(`/orders/${id}`);
      setData(o);
      setSelectedIds((o.items || []).filter((x: any) => x.isSelected).map((x: any) => x.id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId]
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) { alert('请至少选择一张照片'); return; }
    setSubmitting(true);
    try {
      await api.put(`/orders/${id}/confirm-selection`, { selectedItemIds: selectedIds });
      setConfirmed(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return <div className="py-20 text-center text-slate-400">加载中...</div>;

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
        <h2 className="text-2xl font-bold text-slate-800">选片确认成功</h2>
        <p className="text-slate-500">
          您已选择 <span className="font-semibold text-primary-600">{selectedIds.length}</span> 张照片，
          摄影师将为您进行后续处理。
        </p>
        <Link to={`/orders/${id}`}
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition">
          查看订单详情
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-primary-600">← 返回</button>
          <h2 className="text-xl font-semibold">确认选片</h2>
          <span className={`px-3 py-1 rounded-lg text-xs ${OrderStatusColor[data.status] || ''}`}>
            {OrderStatusText[data.status]}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-sm text-slate-500">订单号 <span className="font-mono">{data.orderNo}</span></div>
            <div className="text-xs text-slate-400 mt-1">
              创建于 {formatDate(data.createdAt)} · 摄影师: {data.photographer?.name || '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">订单金额</div>
            <div className="text-lg font-bold text-amber-600">¥{formatMoney(data.finalAmount)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">选择照片</h3>
          <span className="text-sm text-slate-500">
            已选 <span className="font-bold text-primary-600">{selectedIds.length}</span> / {data.items?.length || 0} 张
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.items?.map((item: any) => {
            const checked = selectedIds.includes(item.id);
            return (
              <label key={item.id}
                className={`relative rounded-xl border-2 p-3 cursor-pointer transition ${
                  checked ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-200 hover:border-primary-300'
                }`}>
                <input type="checkbox" className="sr-only"
                  checked={checked} onChange={() => toggleItem(item.id)} />
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition z-10 ${
                  checked ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {checked && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden mb-3">
                  <img src={item.materialCoverUrl || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(item.materialTitle || 'photo')}&image_size=square`}
                    alt={item.materialTitle} className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.style.opacity = 0.2; }} />
                </div>
                <div className="text-sm font-medium truncate">{item.materialTitle}</div>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                  <span>{item.licenseType}</span>
                  <span className="font-semibold text-slate-700">¥{formatMoney(item.subtotal)}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 flex items-center justify-between sticky bottom-4">
        <div>
          <span className="text-sm text-slate-500">已选择 </span>
          <span className="text-lg font-bold text-primary-600">{selectedIds.length}</span>
          <span className="text-sm text-slate-500"> 张照片</span>
        </div>
        <button onClick={handleConfirm} disabled={submitting || selectedIds.length === 0}
          className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium">
          {submitting ? '提交中...' : '确认选片'}
        </button>
      </div>
    </div>
  );
}
