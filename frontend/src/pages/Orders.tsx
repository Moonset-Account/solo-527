import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import { formatMoney, formatDate, OrderStatusText, OrderStatusColor, UserRole } from '../utils/constants';

export default function Orders() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: '', orderNo: '', startDate: '', endDate: '', satisfactionLevel: '' });

  useEffect(() => { load(); }, [page, filter]);

  const load = async () => {
    const res: any = await api.get('/orders', { params: { ...filter, page, pageSize: 10 } });
    setList(res.list || []);
    setTotal(res.total || 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
        <input value={filter.orderNo} onChange={(e) => setFilter({ ...filter, orderNo: e.target.value })}
          placeholder="搜索订单号..."
          className="px-3 py-2 border rounded-lg text-sm w-48 outline-none focus:ring-2 focus:ring-primary-500" />
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none">
          <option value="">全部状态</option>
          {Object.entries(OrderStatusText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.satisfactionLevel} onChange={(e) => setFilter({ ...filter, satisfactionLevel: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none">
          <option value="">全部满意度</option>
          <option value="5">⭐5 非常满意</option>
          <option value="4">⭐4 满意</option>
          <option value="3">⭐3 一般</option>
          <option value="2">⭐2 不满意</option>
          <option value="1">⭐1 很不满意</option>
        </select>
        <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none" />
        <span className="text-slate-400">至</span>
        <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none" />
        <button onClick={() => setFilter({ status: '', orderNo: '', startDate: '', endDate: '', satisfactionLevel: '' })}
          className="px-3 py-2 text-sm text-slate-500 hover:text-primary-600">重置</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">订单号</th>
                {user?.role !== UserRole.CLIENT && <th className="px-5 py-3 text-left font-medium">客户</th>}
                {user?.role !== UserRole.PHOTOGRAPHER && <th className="px-5 py-3 text-left font-medium">摄影师</th>}
                <th className="px-5 py-3 text-left font-medium">金额</th>
                <th className="px-5 py-3 text-left font-medium">状态</th>
                <th className="px-5 py-3 text-center">满意度</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">暂无订单</td></tr>
              )}
              {list.map((o) => (
                <tr key={o.id} className="border-t hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs">{o.orderNo}</div>
                    <div className="text-xs text-slate-400">{formatDate(o.createdAt, 'MM-DD HH:mm')}</div>
                  </td>
                  {user?.role !== UserRole.CLIENT && <td className="px-5 py-4">{o.client?.name}</td>}
                  {user?.role !== UserRole.PHOTOGRAPHER && <td className="px-5 py-4">{o.photographer?.name}</td>}
                  <td className="px-5 py-4 font-semibold text-amber-600">¥{formatMoney(o.finalAmount)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${OrderStatusColor[o.status] || ''}`}>
                      {OrderStatusText[o.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {o.satisfactionLevel ? (
                      <span className="text-amber-500">{'⭐'.repeat(Number(o.satisfactionLevel))}</span>
                    ) : <span className="text-slate-300">未评</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/orders/${o.id}`} className="text-primary-600 hover:underline">查看</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 10 && (
          <div className="px-5 py-4 border-t flex items-center justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">上一页</button>
            <span className="text-sm text-slate-500">第 {page} 页 / 共 {Math.ceil(total / 10)} 页</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 10 >= total}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}
