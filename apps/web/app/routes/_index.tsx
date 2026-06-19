import { json, type LoaderFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AppLayout from '~/components/AppLayout';
import {
  PageHeader,
  StatCard,
  StatusBadge,
  formatNumber,
  formatDate,
  calcUsagePercent,
} from '~/components/ui';
import { api } from '~/api.client';

interface OverviewData {
  totalSeats: number;
  activeSeats: number;
  trialSeats: number;
  expiredSeats: number;
  totalReminders: number;
  pendingReminders: number;
  totalUsageCalls: number;
  totalUsageErrors: number;
  highUsageSeats: Array<{
    seatCode: string;
    customerName: string;
    status: string;
    quota: number;
    usedQuota: number;
    usagePercent: number;
    daysUntilExpiry: number | null;
  }>;
  recentPayments: Array<{
    seatCode: string;
    customerName: string;
    transactionId: string;
    amount: number;
    callbackStatus: string;
    riskLevel: string;
    createdAt: string;
  }>;
}

function mockOverview(): OverviewData {
  return {
    totalSeats: 128,
    activeSeats: 102,
    trialSeats: 15,
    expiredSeats: 8,
    totalReminders: 342,
    pendingReminders: 23,
    totalUsageCalls: 12847503,
    totalUsageErrors: 2847,
    highUsageSeats: [
      { seatCode: 'VIP-001', customerName: '某大型电商', status: 'active', quota: 1000000, usedQuota: 945230, usagePercent: 95, daysUntilExpiry: 12 },
      { seatCode: 'VIP-002', customerName: '金融科技A', status: 'active', quota: 500000, usedQuota: 423891, usagePercent: 85, daysUntilExpiry: 45 },
      { seatCode: 'TR-015', customerName: '新注册客户B', status: 'trial', quota: 10000, usedQuota: 8721, usagePercent: 87, daysUntilExpiry: 3 },
      { seatCode: 'VIP-005', customerName: '物流平台C', status: 'active', quota: 2000000, usedQuota: 1523000, usagePercent: 76, daysUntilExpiry: 90 },
      { seatCode: 'VIP-008', customerName: 'SaaS服务商D', status: 'active', quota: 800000, usedQuota: 523680, usagePercent: 65, daysUntilExpiry: 30 },
    ],
    recentPayments: [
      { seatCode: 'VIP-001', customerName: '某大型电商', transactionId: 'TX20250618001', amount: 9800, callbackStatus: 'failed', riskLevel: 'high', createdAt: '2025-06-18T14:32:00Z' },
      { seatCode: 'VIP-002', customerName: '金融科技A', transactionId: 'TX20250618002', amount: 4500, callbackStatus: 'success', riskLevel: 'low', createdAt: '2025-06-18T11:20:00Z' },
      { seatCode: 'VIP-003', customerName: '在线教育E', transactionId: 'TX20250617003', amount: 12000, callbackStatus: 'retrying', riskLevel: 'medium', createdAt: '2025-06-17T18:45:00Z' },
      { seatCode: 'VIP-004', customerName: '医疗科技F', transactionId: 'TX20250617004', amount: 6700, callbackStatus: 'resolved', riskLevel: 'low', createdAt: '2025-06-17T09:15:00Z' },
      { seatCode: 'TR-015', customerName: '新注册客户B', transactionId: 'TX20250616005', amount: 0, callbackStatus: 'pending', riskLevel: 'medium', createdAt: '2025-06-16T16:00:00Z' },
    ],
  };
}

export const loader: LoaderFunction = async () => {
  try {
    const data = await api.stats.overview();
    return json(data as OverviewData);
  } catch {
    return json(mockOverview());
  }
};

export default function Index() {
  const data = useLoaderData<OverviewData>();
  const [trend, setTrend] = useState<Array<{ date: string; apiCalls: number; errorCount: number }>>([]);

  useEffect(() => {
    const mockTrend = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        apiCalls: 800000 + Math.floor(Math.random() * 400000),
        errorCount: 100 + Math.floor(Math.random() * 300),
      };
    });
    setTrend(mockTrend);
  }, []);

  return (
    <AppLayout>
      <PageHeader title="总览" description="席位配置台关键指标一览" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="总席位数" value={formatNumber(data.totalSeats)} delta={`活跃 ${data.activeSeats} / 试用 ${data.trialSeats}`} />
        <StatCard label="今日 API 调用" value={formatNumber(data.totalUsageCalls)} deltaType="up" delta="+12.3% 较昨日" />
        <StatCard label="调用错误数" value={formatNumber(data.totalUsageErrors)} deltaType="down" delta="-5.2% 较昨日" />
        <StatCard label="待处理提醒" value={data.pendingReminders} delta={`累计 ${data.totalReminders} 条`} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-base font-semibold">API 调用趋势（近 14 天）</h3>
            <Link to="/usage" className="text-sm text-brand-600 hover:underline">查看详情 →</Link>
          </div>
          <div className="card-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="apiCalls" stroke="#2563eb" strokeWidth={2} name="调用量" dot={false} />
                <Line type="monotone" dataKey="errorCount" stroke="#ef4444" strokeWidth={2} name="错误数" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-base font-semibold">高用量席位 TOP 5</h3>
            <Link to="/seats" className="text-sm text-brand-600 hover:underline">全部席位 →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.highUsageSeats.map((s) => (
              <div key={s.seatCode} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.customerName}</div>
                    <div className="text-xs text-gray-500">{s.seatCode}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.usagePercent >= 90 ? 'bg-red-500' : s.usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(s.usagePercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-12 text-right">{s.usagePercent}%</span>
                </div>
                {s.daysUntilExpiry !== null && s.daysUntilExpiry <= 30 && (
                  <div className={`mt-1 text-xs ${s.daysUntilExpiry <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {s.daysUntilExpiry <= 0 ? '已过期' : `还有 ${s.daysUntilExpiry} 天到期`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-base font-semibold">最近支付回调记录</h3>
          <Link to="/payments" className="text-sm text-brand-600 hover:underline">全部记录 →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>席位</th>
                <th>客户</th>
                <th>交易号</th>
                <th>金额</th>
                <th>状态</th>
                <th>风险等级</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayments.map((p) => (
                <tr key={p.transactionId}>
                  <td className="font-mono text-xs">{p.seatCode}</td>
                  <td>{p.customerName}</td>
                  <td className="font-mono text-xs text-gray-600">{p.transactionId}</td>
                  <td>¥{p.amount.toLocaleString()}</td>
                  <td><StatusBadge status={p.callbackStatus} type="payment" /></td>
                  <td><StatusBadge status={p.riskLevel} type="risk" /></td>
                  <td className="text-gray-500">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
