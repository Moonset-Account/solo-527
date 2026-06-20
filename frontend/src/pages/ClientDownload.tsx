import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import {
  formatMoney, formatDate, OrderStatusText, OrderStatusColor, UserRole,
} from '../utils/constants';

export default function ClientDownload() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const o: any = await api.get(`/orders/${id}`);
      setData(o);
      const dlIds = new Set<string>();
      (o.items || []).forEach((x: any) => { if (x.downloaded) dlIds.add(x.id); });
      setDownloadedIds(dlIds);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const selectedItems = (data?.items || []).filter((x: any) => x.isSelected);
  const allDownloaded = selectedItems.length > 0 && selectedItems.every((x: any) => downloadedIds.has(x.id));

  const handleDownloadAll = async () => {
    const ids = selectedItems.filter((x: any) => !downloadedIds.has(x.id)).map((x: any) => x.id);
    if (ids.length === 0) { alert('所有照片已下载'); return; }
    setDownloading(true);
    try {
      await api.put(`/orders/${id}/download`, { itemIds: ids });
      const newDownloaded = new Set(downloadedIds);
      ids.forEach((iid: string) => newDownloaded.add(iid));
      setDownloadedIds(newDownloaded);
      selectedItems.forEach((x: any) => {
        if (ids.includes(x.id) && x.material?.fileUrl) window.open(x.material.fileUrl, '_blank');
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadOne = async (item: any) => {
    try {
      await api.put(`/orders/${id}/download`, { itemIds: [item.id] });
      const newDownloaded = new Set(downloadedIds);
      newDownloaded.add(item.id);
      setDownloadedIds(newDownloaded);
      if (item.material?.fileUrl) window.open(item.material.fileUrl, '_blank');
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!data) return <div className="py-20 text-center text-slate-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-primary-600">← 返回</button>
          <h2 className="text-xl font-semibold">下载成片</h2>
          <span className={`px-3 py-1 rounded-lg text-xs ${OrderStatusColor[data.status] || ''}`}>
            {OrderStatusText[data.status]}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between">
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
          <div>
            <h3 className="font-semibold text-slate-700">已选照片</h3>
            <p className="text-xs text-slate-400 mt-1">
              共 {selectedItems.length} 张 · 已下载 {selectedItems.filter((x: any) => downloadedIds.has(x.id)).length} 张
            </p>
          </div>
          <button onClick={handleDownloadAll}
            disabled={downloading || allDownloaded}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition ${
              allDownloaded
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
            }`}>
            {allDownloaded ? '✓ 全部已下载' : downloading ? '下载中...' : '下载全部'}
          </button>
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400">暂无可下载的照片</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedItems.map((item: any) => {
              const isDownloaded = downloadedIds.has(item.id);
              return (
                <div key={item.id}
                  className={`relative rounded-xl border p-3 transition ${
                    isDownloaded ? 'border-green-300 bg-green-50/50' : 'border-slate-200'
                  }`}>
                  <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden mb-3 relative">
                    <img src={item.materialCoverUrl || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(item.materialTitle || 'photo')}&image_size=square`}
                      alt={item.materialTitle} className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.style.opacity = 0.2; }} />
                    {isDownloaded && (
                      <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg font-bold">✓</div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium truncate">{item.materialTitle}</div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                    <span>{item.licenseType}</span>
                    <span className="font-semibold text-slate-700">¥{formatMoney(item.subtotal)}</span>
                  </div>
                  <button onClick={() => handleDownloadOne(item)}
                    disabled={isDownloaded}
                    className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition ${
                      isDownloaded
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}>
                    {isDownloaded ? '已下载' : '下载'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
