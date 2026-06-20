import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import {
  formatDate, ExceptionStatusText, ExceptionTypeText, RefundStatusText, UserRole, userRoleText,
} from '../utils/constants';

export default function ExceptionList() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<any>({});
  const [filter, setFilter] = useState({
    type: '', status: '', refundStatus: '', priority: '', keyword: '',
  });
  const [showAssign, setShowAssign] = useState(false);
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [bloggers, setBloggers] = useState<any[]>([]);
  const [assignHandlerId, setAssignHandlerId] = useState('');

  useEffect(() => { load(); }, [page, filter]);

  const load = async () => {
    const [res, s]: any = await Promise.all([
      api.get('/exceptions', { params: { ...filter, page, pageSize: 15 } }),
      api.get('/exceptions/statistics'),
    ]);
    setList(res.list || []);
    setTotal(res.total || 0);
    setStats(s);
    if (user?.role === UserRole.ADMIN) {
      const bs: any = await api.get('/users', { params: { role: 'blogger', pageSize: 100 } });
      setBloggers(bs.list || []);
    }
  };

  const handleAssign = async () => {
    if (!assignHandlerId) { alert('请选择处理人'); return; }
    try {
      await api.put(`/exceptions/${assignTarget.id}/assign`, { handlerId: assignHandlerId });
      setShowAssign(false);
      setAssignTarget(null);
      setAssignHandlerId('');
      load();
    } catch (e: any) { alert(e.message); }
  };

  const priorityColor: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  const statusColor: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    assigned: 'bg-indigo-100 text-indigo-700',
    processing: 'bg-blue-100 text-blue-700',
    pending_review: 'bg-purple-100 text-purple-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="异常总数" value={stats.total || 0} icon="⚠️" color="text-red-600" />
        <StatCard label="待处理" value={stats.byStatus?.open || 0} icon="📋" color="text-yellow-600" />
        <StatCard label="处理中" value={(stats.byStatus?.assigned || 0) + (stats.byStatus?.processing || 0)} icon="🔧" color="text-blue-600" />
        <StatCard label="退款异常" value={stats.refundTotal || 0} icon="💰" color="text-orange-600" />
        <StatCard label="退款待审" value={stats.refundPending || 0} icon="⏳" color="text-purple-600" />
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none">
          <option value="">全部类型</option>
          {Object.entries(ExceptionTypeText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none">
          <option value="">全部状态</option>
          {Object.entries(ExceptionStatusText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.refundStatus} onChange={(e) => setFilter({ ...filter, refundStatus: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none">
          <option value="">全部退款状态</option>
          {Object.entries(RefundStatusText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none">
          <option value="">全部优先级</option>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">紧急</option>
        </select>
        <input value={filter.keyword} onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
          placeholder="搜索异常编号/标题..."
          className="px-3 py-2 border rounded-lg text-sm w-56 outline-none focus:ring-2 focus:ring-primary-500" />
        <button onClick={() => setFilter({ type: '', status: '', refundStatus: '', priority: '', keyword: '' })}
          className="px-3 py-2 text-sm text-slate-500 hover:text-primary-600">重置</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">异常编号</th>
                <th className="px-5 py-3 text-left font-medium">类型</th>
                <th className="px-5 py-3 text-left font-medium">标题</th>
                <th className="px-5 py-3 text-center font-medium">优先级</th>
                <th className="px-5 py-3 text-center font-medium">状态</th>
                <th className="px-5 py-3 text-left font-medium">退款状态</th>
                <th className="px-5 py-3 text-left font-medium">处理人</th>
                <th className="px-5 py-3 text-left font-medium">创建时间</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={9} className="text-center py-16 text-slate-400">暂无异常记录</td></tr>}
              {list.map((e) => (
                <tr key={e.id} className="border-t hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono text-xs">{e.exceptionNo}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      e.type === 'refund' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ExceptionTypeText[e.type] || e.type}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/exceptions/${e.id}`} className="text-slate-800 hover:text-primary-600 font-medium">
                      {e.title}
                    </Link>
                    {e.type === 'refund' && e.refundRequestedAmount > 0 && (
                      <div className="text-xs text-red-500 mt-0.5">退款申请: ¥{e.refundRequestedAmount}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${priorityColor[e.priority]}`}>
                      {({ low: '低', medium: '中', high: '高', critical: '紧急' } as Record<string, string>)[e.priority]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${statusColor[e.status]}`}>
                      {ExceptionStatusText[e.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {e.type === 'refund' ? (
                      <span className="text-xs text-orange-600">{RefundStatusText[e.refundStatus]}</span>
                    ) : <span className="text-xs text-slate-400">-</span>}
                  </td>
                  <td className="px-5 py-4">
                    {e.handler ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">
                          {e.handler.name?.charAt(0)}
                        </div>
                        <span className="text-sm">{e.handler.name}</span>
                      </div>
                    ) : <span className="text-xs text-slate-400">未分配</span>}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{formatDate(e.createdAt, 'MM-DD HH:mm')}</td>
                  <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                    <Link to={`/exceptions/${e.id}`} className="text-primary-600 hover:underline text-xs">详情</Link>
                    {e.status === 'open' && user?.role === UserRole.ADMIN && (
                      <button onClick={() => { setAssignTarget(e); setShowAssign(true); }}
                        className="text-blue-600 hover:underline text-xs">分配</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 15 && (
          <div className="px-5 py-4 border-t flex items-center justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">上一页</button>
            <span className="text-sm text-slate-500">第 {page} 页 / 共 {Math.ceil(total / 15)} 页</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 15 >= total}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">下一页</button>
          </div>
        )}
      </div>

      {showAssign && assignTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">分配处理人</h3>
              <button onClick={() => { setShowAssign(false); setAssignTarget(null); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <div className="font-medium">{assignTarget.title}</div>
                <div className="text-xs text-slate-400 mt-1">{assignTarget.exceptionNo} · {ExceptionTypeText[assignTarget.type]}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">选择知识博主 *</label>
                <select value={assignHandlerId}
                  onChange={(e) => setAssignHandlerId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none">
                  <option value="">请选择处理人</option>
                  {bloggers.map((b) => <option key={b.id} value={b.id}>{b.name} ({userRoleText(b.role)})</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => { setShowAssign(false); setAssignTarget(null); }}
                className="px-5 py-2 border rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={handleAssign}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">确认分配</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500 mb-1">{label}</div>
          <div className={`text-xl font-bold ${color}`}>{value}</div>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
