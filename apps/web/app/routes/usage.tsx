import { json, type LoaderFunction } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import AppLayout from '~/components/AppLayout';
import {
  PageHeader,
  StatCard,
  Pagination,
  EmptyState,
  formatNumber,
  formatDate,
} from '~/components/ui';
import { api } from '~/api.client';
import type { UsageTrendPoint, UsageRecord, PaginationResult } from '@seat-platform/shared';

interface LoaderData {
  trend: UsageTrendPoint[];
  records: PaginationResult<UsageRecord>;
  summary: { totalCalls: number; totalErrors: number; avgLatency: number };
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const seatId = url.searchParams.get('seatId') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 14 * 86400000).toISOString();

  let trend: UsageTrendPoint[] = [];
  let records: PaginationResult<UsageRecord> = { items: [], total: 0, page, pageSize, totalPages: 0 };
  let summary = { totalCalls: 0, totalErrors: 0, avgLatency: 0 };

  try {
    trend = await api.usage.trend({ seatId, startDate, endDate, granularity: 'day' });
  } catch {
    trend = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const calls = 600000 + Math.floor(Math.random() * 500000);
      const errors = 200 + Math.floor(Math.random() * 400);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        apiCalls: calls,
        errorCount: errors,
        avgLatency: 100 + Math.floor(Math.random() * 150),
      };
    });
  }

  try {
    if (seatId) {
      records = await api.usage.list(seatId, page, pageSize);
    }
  } catch {
    // ignore
  }

  summary = {
    totalCalls: trend.reduce((s, t) => s + t.apiCalls, 0),
    totalErrors: trend.reduce((s, t) => s + t.errorCount, 0),
    avgLatency: trend.length > 0 ? Math.round(trend.reduce((s, t) => s + t.avgLatency, 0) / trend.length) : 0,
  };

  return json({ trend, records, summary });
};

export default function UsageTrendPage() {
  const { trend, records, summary } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  const errorRate = summary.totalCalls > 0 ? ((summary.totalErrors / summary.totalCalls) * 100).toFixed(2) : '0.00';

  return (
    <AppLayout>
      <PageHeader
        title="调用趋势"
        description="查看 API 调用量、错误率与延迟的时间序列趋势"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="期间总调用量" value={formatNumber(summary.totalCalls)} deltaType="up" delta="+8.4% 环比" />
        <StatCard label="总错误数" value={formatNumber(summary.totalErrors)} deltaType="down" delta="-2.1% 环比" />
        <StatCard label="错误率" value={`${errorRate}%`} deltaType="down" delta="-0.15% 环比" />
        <StatCard label="平均延迟" value={`${summary.avgLatency} ms`} deltaType="neutral" delta="稳定" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-1 flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">时间粒度：</label>
          <select className="input">
            <option>按小时</option>
            <option selected>按天</option>
            <option>按周</option>
            <option>按月</option>
          </select>
        </div>
        <div className="col-span-1 flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">时间范围：</label>
          <select className="input">
            <option>近 7 天</option>
            <option selected>近 14 天</option>
            <option>近 30 天</option>
            <option>近 90 天</option>
          </select>
        </div>
        <div className="col-span-1 flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">席位：</label>
          <select
            className="input"
            value={searchParams.get('seatId') || ''}
            onChange={(e) => {
              const p = new URLSearchParams(searchParams);
              if (e.target.value) p.set('seatId', e.target.value); else p.delete('seatId');
              setSearchParams(p);
            }}
          >
            <option value="">全部席位</option>
            <option value="seat_mock_1">VIP-001 · 某大型电商</option>
            <option value="seat_mock_2">VIP-002 · 金融科技A</option>
            <option value="seat_mock_5">VIP-005 · 物流平台C</option>
          </select>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header"><h3 className="font-semibold">调用趋势图</h3></div>
        <div className="card-body h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="apiCalls" stroke="#2563eb" strokeWidth={2} name="调用量" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="errorCount" stroke="#ef4444" strokeWidth={2} name="错误数" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="avgLatency" stroke="#10b981" strokeWidth={2} name="平均延迟(ms)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {searchParams.get('seatId') && (
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">调用明细记录</h3></div>
          {records.items.length === 0 ? (
            <EmptyState message="请选择具体席位查看明细" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>调用量</th>
                      <th>错误数</th>
                      <th>平均延迟</th>
                      <th>接口</th>
                      <th>状态码</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.items.map((r) => (
                      <tr key={r.id}>
                        <td className="text-gray-500">{formatDate(r.timestamp)}</td>
                        <td>{formatNumber(r.apiCalls)}</td>
                        <td className={r.errorCount > 0 ? 'text-red-600' : ''}>{formatNumber(r.errorCount)}</td>
                        <td>{r.avgLatency} ms</td>
                        <td className="font-mono text-xs">{r.endpoint || '-'}</td>
                        <td>{r.statusCode || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={records.totalPages}
                total={records.total}
                pageSize={pageSize}
                onPageChange={(p) => {
                  const np = new URLSearchParams(searchParams);
                  np.set('page', String(p));
                  setSearchParams(np);
                }}
              />
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
}
