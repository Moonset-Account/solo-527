import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import { formatMoney, OrderStatusText, OrderStatusColor, formatDate } from '../utils/constants';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>({ overview: {}, satisfaction: {}, topMaterials: [], byStatus: {} });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dash, ordersRes]: any = await Promise.all([
        api.get('/statistics/dashboard'),
        api.get('/orders', { params: { pageSize: 5, page: 1 } }),
      ]);
      setData(dash);
      setRecentOrders(ordersRes.list || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, icon, color, link }: any) => (
    <Link to={link || '#'} className="block">
      <div className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-slate-500 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
          <div className="text-3xl opacity-80">{icon}</div>
        </div>
      </div>
    </Link>
  );

  if (loading) return <div className="text-slate-400 text-center py-20">加载中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-1">你好，{user?.name} 👋</h2>
        <p className="text-sm text-slate-500">今天是 {formatDate(new Date(), 'YYYY年MM月DD日')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="订单总数" value={data.overview.totalOrders || 0} icon="📦" color="text-blue-600" link="/orders" />
        <StatCard label="完成订单" value={data.overview.completedOrders || 0} icon="✅" color="text-emerald-600" link="/orders" />
        <StatCard label="总收入 (¥)" value={formatMoney(data.overview.totalRevenue)} icon="💵" color="text-amber-600" link="/settlements" />
        <StatCard label="待结算 (¥)" value={formatMoney(data.overview.pendingSettlement)} icon="⏳" color="text-purple-600" link="/settlements" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">最近订单</h3>
            <Link to="/orders" className="text-sm text-primary-600 hover:underline">查看全部</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-3 font-medium">订单号</th>
                  <th className="pb-3 font-medium">金额</th>
                  <th className="pb-3 font-medium">状态</th>
                  <th className="pb-3 font-medium">创建时间</th>
                  <th className="pb-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">暂无订单</td>
                  </tr>
                ) : (
                  recentOrders.map((o: any) => (
                    <tr key={o.id} className="border-b border-slate-50">
                      <td className="py-3 font-mono text-xs">{o.orderNo}</td>
                      <td className="py-3 font-medium">¥{formatMoney(o.finalAmount)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${OrderStatusColor[o.status] || ''}`}>
                          {OrderStatusText[o.status] || o.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{formatDate(o.createdAt, 'MM-DD HH:mm')}</td>
                      <td className="py-3">
                        <Link to={`/orders/${o.id}`} className="text-primary-600 hover:underline">详情</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">满意度统计</h3>
          <div className="text-center py-4 mb-4">
            <div className="text-4xl font-bold text-amber-500 mb-2">
              {data.satisfaction.average || '-'}
              <span className="text-lg text-slate-400 font-normal">/ 5.00</span>
            </div>
            <div className="text-sm text-slate-500">基于 {data.satisfaction.count || 0} 条评价</div>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.satisfaction.distribution?.[star] || 0;
              const total = data.satisfaction.count || 1;
              const pct = (count / total) * 100;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-10 text-sm text-slate-600">{star}星</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-xs text-slate-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {data.topMaterials?.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">热销素材 TOP 10</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.topMaterials.map((m: any, i: number) => (
              <Link key={m.id} to={`/materials/${m.id}`} className="group">
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-2 relative">
                  <img
                    src={m.cover_image_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=photography%20portfolio%20placeholder&image_size=square'}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    onError={(e: any) => { e.target.style.opacity = 0.2; }}
                  />
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                </div>
                <div className="text-sm text-slate-700 truncate">{m.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">销量: {m.sale_count || 0}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
