import { json, type LoaderFunction } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import AppLayout from '~/components/AppLayout';
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Pagination,
  EmptyState,
  formatNumber,
  formatDate,
} from '~/components/ui';
import { api } from '~/api.client';
import type { UsageRecord, PaginationResult } from '@seat-platform/shared';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
  const seatId = url.searchParams.get('seatId') || undefined;

  try {
    const data = await api.usage.abnormal(page, pageSize, undefined, undefined, seatId);
    return json(data);
  } catch {
    const items: UsageRecord[] = Array.from({ length: 10 }, (_, i) => ({
      id: `abn_${i}`,
      seatId: `seat_mock_${(i % 5) + 1}`,
      seatCode: ['VIP-001', 'VIP-002', 'VIP-003', 'VIP-005', 'VIP-007'][i % 5],
      timestamp: new Date(Date.now() - i * 3600000 * 2).toISOString(),
      apiCalls: 100 + i * 20,
      errorCount: 10 + i * 5,
      avgLatency: 3500 + i * 200,
      endpoint: ['/api/v2/orders/create', '/api/v2/users/auth', '/api/v2/payments/callback'][i % 3],
      statusCode: [500, 429, 503, 504, 403][i % 5],
    }));
    const res: PaginationResult<UsageRecord> = {
      items,
      total: 156,
      page: 1,
      pageSize: 20,
      totalPages: 8,
    };
    return json(res);
  }
};

export default function AbnormalUsagePage() {
  const data = useLoaderData<PaginationResult<UsageRecord>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const totalErrors = data.items.reduce((s, r) => s + r.errorCount, 0);
  const highLatencyCount = data.items.filter((r) => r.avgLatency > 3000).length;

  return (
    <AppLayout>
      <PageHeader title="异常记录" description="调用错误、高延迟、限频等异常调用记录一览" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="异常记录总数" value={formatNumber(data.total)} />
        <StatCard label="当前页错误总数" value={formatNumber(totalErrors)} />
        <StatCard label="高延迟记录" value={highLatencyCount} />
        <StatCard label="受影响席位" value={new Set(data.items.map((i) => i.seatId)).size} />
      </div>

      <div className="card mb-6">
        <div className="card-body flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">席位：</label>
            <select
              className="input"
              style={{ width: 240 }}
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
            </select>
          </div>
          <div className="flex-1" />
          <button className="btn-secondary btn-sm">批量导出异常报告</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState message="暂无异常记录，系统运行良好" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>发生时间</th>
                    <th>席位编码</th>
                    <th>接口路径</th>
                    <th>状态码</th>
                    <th>调用量</th>
                    <th>错误数</th>
                    <th>平均延迟</th>
                    <th>异常类型</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => {
                    const isTimeout = r.avgLatency > 3000;
                    const isError = r.errorCount > 0;
                    return (
                      <tr key={r.id}>
                        <td className="text-gray-500">{formatDate(r.timestamp)}</td>
                        <td className="font-mono text-xs font-medium">{r.seatCode}</td>
                        <td className="font-mono text-xs">{r.endpoint || '-'}</td>
                        <td>
                          {r.statusCode ? (
                            <span className={`badge ${r.statusCode >= 500 ? 'bg-red-100 text-red-800' : r.statusCode >= 400 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                              {r.statusCode}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{formatNumber(r.apiCalls)}</td>
                        <td className="text-red-600 font-semibold">{formatNumber(r.errorCount)}</td>
                        <td className={isTimeout ? 'text-orange-600 font-semibold' : ''}>
                          {r.avgLatency} ms
                          {isTimeout && <StatusBadge status="urgent" />}
                        </td>
                        <td>
                          {isError && <span className="mr-1"><StatusBadge status="failed" /></span>}
                          {isTimeout && <StatusBadge status="critical" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onPageChange={(p) => {
                const np = new URLSearchParams(searchParams);
                np.set('page', String(p));
                setSearchParams(np);
              }}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
