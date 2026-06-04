import { useEffect, useState } from 'react';
import { Filter, RefreshCw, MessageSquare } from 'lucide-react';
import { renewalApi, packageApi } from '@/utils/api';
import StatusBadge from '@/components/StatusBadge';
import type { RenewalTracking } from '../../shared/types';

export default function RenewalFunnel() {
  const [funnel, setFunnel] = useState<{ expiring: number; expired: number; renewed: number; lost: number } | null>(null);
  const [expiring, setExpiring] = useState<RenewalTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [followUpId, setFollowUpId] = useState<number | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState('');

  useEffect(() => {
    Promise.all([
      renewalApi.getFunnel(),
      renewalApi.getExpiring(),
    ]).then(([f, e]) => {
      setFunnel(f);
      setExpiring(e);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleFollowUp = async (id: number) => {
    if (!followUpNotes.trim()) return;
    await renewalApi.addFollowUp(id, followUpNotes);
    setFollowUpId(null);
    setFollowUpNotes('');
    renewalApi.getExpiring().then(setExpiring);
  };

  const handleQuickRenew = async (memberId: number) => {
    alert(`为会员 #${memberId} 快速续费功能 - 请前往套餐管理操作`);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;

  const funnelItems = funnel ? [
    { label: '即将到期', value: funnel.expiring, color: 'bg-amber-500', textColor: 'text-amber-600' },
    { label: '已到期', value: funnel.expired, color: 'bg-danger', textColor: 'text-danger' },
    { label: '已续费', value: funnel.renewed, color: 'bg-success', textColor: 'text-success' },
    { label: '已流失', value: funnel.lost, color: 'bg-gray-400', textColor: 'text-gray-500' },
  ] : [];

  const maxVal = Math.max(...funnelItems.map((i) => i.value), 1);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-gray-800">续费漏斗</h3>
        </div>
        <div className="flex items-end justify-center gap-8">
          {funnelItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className={`text-2xl font-bold ${item.textColor}`}>{item.value}</div>
              <div className={`w-24 mt-2 ${item.color} rounded-t-btn transition-all`} style={{ height: `${Math.max(20, (item.value / maxVal) * 200)}px` }} />
              <div className="text-sm text-gray-500 mt-2">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">即将到期套餐</h3>
          <button onClick={() => renewalApi.getExpiring().then(setExpiring)} className="text-sm text-accent hover:text-orange-600 flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />刷新
          </button>
        </div>
        {expiring.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无即将到期套餐</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">会员ID</th>
                  <th className="px-4 py-3">套餐ID</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">跟进记录</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expiring.map((rt) => (
                  <tr key={rt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{rt.member_id}</td>
                    <td className="px-4 py-3 text-sm">{rt.member_package_id}</td>
                    <td className="px-4 py-3"><StatusBadge status={rt.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-48 truncate">{rt.follow_up_notes || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setFollowUpId(rt.id); setFollowUpNotes(''); }} className="text-sm text-blue-500 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />跟进
                        </button>
                        <button onClick={() => handleQuickRenew(rt.member_id)} className="text-sm text-success hover:bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />续费
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {followUpId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setFollowUpId(null)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">添加跟进记录</h3>
            <textarea value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} placeholder="跟进内容" className="input-field" rows={3} />
            <div className="flex gap-3 mt-3">
              <button onClick={() => handleFollowUp(followUpId)} className="btn-primary flex-1">提交</button>
              <button onClick={() => setFollowUpId(null)} className="btn-secondary flex-1">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
