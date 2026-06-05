import { useEffect, useState } from 'react';
import { Package, Plus, AlertTriangle, CheckCircle, Search, XCircle, Boxes } from 'lucide-react';
import { teachingAidsApi } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import type { TeachingAid } from '@/types';

export default function TeachingAids() {
  const [aids, setAids] = useState<TeachingAid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [allocateId, setAllocateId] = useState<number | null>(null);
  const [allocateQty, setAllocateQty] = useState(1);
  const [allocateSession, setAllocateSession] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAids();
  }, []);

  const loadAids = async () => {
    try {
      const data = await teachingAidsApi.list();
      setAids(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!allocateId || !allocateSession) return;
    try {
      await teachingAidsApi.allocate(allocateId, Number(allocateSession), allocateQty);
      setShowModal(false);
      setAllocateId(null);
      setAllocateQty(1);
      setAllocateSession('');
      loadAids();
    } catch {}
  };

  const getStatusIndicator = (aid: TeachingAid) => {
    if (aid.available_quantity === 0) return { label: '已耗尽', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
    if (aid.available_quantity <= aid.total_quantity * 0.2) return { label: '库存低', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' };
    return { label: '充足', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
  };

  const getStockPercent = (aid: TeachingAid) =>
    aid.total_quantity > 0 ? Math.round((aid.available_quantity / aid.total_quantity) * 100) : 0;

  const getStockBarColor = (aid: TeachingAid) => {
    if (aid.available_quantity === 0) return 'bg-red-500';
    if (aid.available_quantity <= aid.total_quantity * 0.2) return 'bg-orange-400';
    return 'bg-green-500';
  };

  const totalAids = aids.length;
  const availableAids = aids.filter((a) => a.available_quantity > a.total_quantity * 0.2).length;
  const lowStockAids = aids.filter((a) => a.available_quantity > 0 && a.available_quantity <= a.total_quantity * 0.2).length;
  const depletedAids = aids.filter((a) => a.available_quantity === 0).length;

  const filtered = aids.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">教具管理</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card slide-up stagger-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-museum/10 flex items-center justify-center">
              <Boxes size={16} className="text-museum" />
            </div>
            <span className="text-xs text-slate-400">总教具</span>
          </div>
          <span className="text-2xl font-bold text-museum">{totalAids}</span>
        </div>
        <div className="stat-card slide-up stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <span className="text-xs text-slate-400">充足</span>
          </div>
          <span className="text-2xl font-bold text-green-600">{availableAids}</span>
        </div>
        <div className="stat-card slide-up stagger-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-orange-500" />
            </div>
            <span className="text-xs text-slate-400">库存低</span>
          </div>
          <span className="text-2xl font-bold text-orange-500">{lowStockAids}</span>
        </div>
        <div className="stat-card slide-up stagger-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle size={16} className="text-red-500" />
            </div>
            <span className="text-xs text-slate-400">已耗尽</span>
          </div>
          <span className="text-2xl font-bold text-red-500">{depletedAids}</span>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索教具名称..."
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="暂无教具" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>教具名称</th>
                <th>库存进度</th>
                <th>总数量</th>
                <th>可用数量</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((aid) => {
                const status = getStatusIndicator(aid);
                const percent = getStockPercent(aid);
                const barColor = getStockBarColor(aid);
                return (
                  <tr key={aid.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-museum/5 flex items-center justify-center flex-shrink-0">
                          <Package size={15} className="text-museum" />
                        </div>
                        <span className="font-medium text-slate-700">{aid.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                          <div
                            className={`h-full rounded-full progress-bar-animated ${barColor}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{percent}%</span>
                      </div>
                    </td>
                    <td className="text-slate-700">{aid.total_quantity}</td>
                    <td>
                      <span className={`font-semibold ${
                        aid.available_quantity === 0
                          ? 'text-red-600'
                          : aid.available_quantity <= aid.total_quantity * 0.2
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}>
                        {aid.available_quantity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setAllocateId(aid.id);
                          setAllocateQty(1);
                          setAllocateSession('');
                          setShowModal(true);
                        }}
                        disabled={aid.available_quantity === 0}
                        className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                      >
                        <Plus size={12} className="inline mr-1" />
                        分配
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">分配教具</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">分配数量</label>
                <input
                  type="number"
                  value={allocateQty}
                  onChange={(e) => setAllocateQty(Number(e.target.value))}
                  min={1}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">场次ID</label>
                <input
                  type="number"
                  value={allocateSession}
                  onChange={(e) => setAllocateSession(e.target.value)}
                  className="input-field"
                  placeholder="请输入场次ID"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleAllocate}
                disabled={!allocateSession || allocateQty < 1}
                className="btn-primary"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
