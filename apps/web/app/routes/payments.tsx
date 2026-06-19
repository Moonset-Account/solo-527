import { json, type LoaderFunction, type ActionFunction, redirect } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { useState } from 'react';
import AppLayout from '~/components/AppLayout';
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Pagination,
  EmptyState,
  formatDate,
} from '~/components/ui';
import { api } from '~/api.client';
import type { PaymentCallback, PaginationResult, RiskStatistics } from '@seat-platform/shared';

interface LoaderData {
  list: PaginationResult<PaymentCallback>;
  risk: RiskStatistics;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);
  let list: PaginationResult<PaymentCallback>;
  let risk: RiskStatistics;

  try {
    [list, risk] = await Promise.all([api.payments.list(query), api.payments.riskStats()]);
  } catch {
    const statuses: PaymentCallback['callbackStatus'][] = ['failed', 'retrying', 'pending', 'resolved', 'success'];
    const risks: PaymentCallback['riskLevel'][] = ['high', 'medium', 'low', 'critical', 'medium'];
    const customers = ['某大型电商', '金融科技A', '在线教育E', '物流平台C', 'SaaS服务商D', '医疗科技F'];
    const items: PaymentCallback[] = Array.from({ length: 10 }, (_, i) => ({
      id: `pay_mock_${i}`,
      seatId: `seat_mock_${(i % 5) + 1}`,
      seatCode: ['VIP-001', 'VIP-002', 'VIP-003', 'VIP-005', 'VIP-007'][i % 5],
      customerName: customers[i % customers.length],
      transactionId: `TX202506${String(18 - i).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
      amount: [9800, 4500, 12000, 6700, 3200, 15000][i % 6],
      currency: 'CNY',
      callbackStatus: statuses[i % statuses.length],
      rawPayload: {},
      errorMessage: i % 3 === 0 ? '第三方支付网关超时，签名校验失败' : undefined,
      retryCount: i % 3,
      lastRetryAt: i % 3 > 0 ? new Date(Date.now() - i * 3600000).toISOString() : undefined,
      remark: i === 0 ? '客户称已线下转账，财务核对中' : i === 1 ? '已电话联系客户，等待重付' : undefined,
      resolution: i >= 7 ? '客户完成二次支付，已人工标记为已处理' : undefined,
      riskLevel: risks[i % risks.length],
      resolvedAt: i >= 7 ? new Date(Date.now() - i * 3600000 * 2).toISOString() : undefined,
      resolvedBy: i >= 7 ? '产品经理A' : undefined,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - i * 3600000 * 2).toISOString(),
    }));
    list = { items, total: 87, page: 1, pageSize: 20, totalPages: 5 };
    risk = {
      totalFailedCallbacks: 23,
      highRiskCount: 5,
      mediumRiskCount: 12,
      lowRiskCount: 6,
      unresolvedCount: 15,
      avgResolutionTimeHours: 4.2,
    };
  }

  return json({ list, risk });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id') as string;
  const _action = formData.get('_action') as string;

  try {
    if (_action === 'retry' && id) {
      await api.payments.retry(id, { remark: formData.get('remark') as string | undefined });
    } else if (_action === 'resolve' && id) {
      await api.payments.update(id, {
        callbackStatus: 'resolved',
        remark: formData.get('remark') as string | undefined,
        resolution: formData.get('resolution') as string | undefined,
        resolvedBy: '产品经理A',
      });
    }
  } catch {
    // ignore
  }
  return redirect('/payments');
};

export default function PaymentsPage() {
  const { list: data, risk } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resolveId, setResolveId] = useState<string | null>(null);
  const page = parseInt(searchParams.get('page') || '1', 10);

  return (
    <AppLayout>
      <PageHeader
        title="支付回调"
        description="跟踪支付回调处理状态，记录备注与处理结果，统计续费风险"
        actions={
          <Link to="/exports" className="btn-secondary btn-sm">导出全部记录</Link>
        }
      />

      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="回调记录总数" value={data.total} />
        <StatCard label="未处理" value={risk.unresolvedCount} delta="需要跟进" deltaType="neutral" />
        <StatCard label="高风险" value={risk.highRiskCount} deltaType="down" delta="紧急处理" />
        <StatCard label="中风险" value={risk.mediumRiskCount} />
        <StatCard label="平均处理时长" value={risk.avgResolutionTimeHours ? `${risk.avgResolutionTimeHours}h` : '-'} deltaType="neutral" delta="较昨日 -0.5h" />
      </div>

      <div className="card mb-6">
        <div className="card-body flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">回调状态：</label>
            <select
              className="input"
              style={{ width: 140 }}
              value={searchParams.get('callbackStatus') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('callbackStatus', e.target.value); else p.delete('callbackStatus');
                setSearchParams(p);
              }}
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
              <option value="retrying">重试中</option>
              <option value="resolved">已处理</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">风险等级：</label>
            <select
              className="input"
              style={{ width: 140 }}
              value={searchParams.get('riskLevel') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('riskLevel', e.target.value); else p.delete('riskLevel');
                setSearchParams(p);
              }}
            >
              <option value="">全部</option>
              <option value="low">低风险</option>
              <option value="medium">中风险</option>
              <option value="high">高风险</option>
              <option value="critical">紧急</option>
            </select>
          </div>
          <div className="flex-1" />
          <input
            className="input"
            style={{ width: 260 }}
            placeholder="搜索交易号 / 席位 / 客户..."
            value={searchParams.get('keyword') || ''}
            onChange={(e) => {
              const p = new URLSearchParams(searchParams);
              if (e.target.value) p.set('keyword', e.target.value); else p.delete('keyword');
              setSearchParams(p);
            }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState message="暂无支付回调记录" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>交易号</th>
                    <th>席位</th>
                    <th>客户</th>
                    <th>金额</th>
                    <th>回调状态</th>
                    <th>风险等级</th>
                    <th>重试</th>
                    <th>备注 / 处理结果</th>
                    <th>创建时间</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-gray-600">{p.transactionId}</td>
                      <td className="font-mono text-xs font-medium">{p.seatCode}</td>
                      <td>{p.customerName}</td>
                      <td className="font-semibold">¥{p.amount.toLocaleString()}</td>
                      <td><StatusBadge status={p.callbackStatus} type="payment" /></td>
                      <td><StatusBadge status={p.riskLevel} type="risk" /></td>
                      <td className="text-sm">
                        {p.retryCount > 0 ? (
                          <span className={p.retryCount >= 3 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {p.retryCount} 次
                          </span>
                        ) : <span className="text-gray-400">0</span>}
                      </td>
                      <td className="max-w-xs">
                        {p.remark && <div className="text-xs text-gray-700 mb-1">📝 {p.remark}</div>}
                        {p.resolution && <div className="text-xs text-green-700">✅ {p.resolution}</div>}
                        {p.errorMessage && !p.resolution && (
                          <div className="text-xs text-red-600">❌ {p.errorMessage}</div>
                        )}
                        {!p.remark && !p.resolution && !p.errorMessage && <span className="text-gray-400 text-xs">-</span>}
                      </td>
                      <td className="text-gray-500 text-xs">{formatDate(p.createdAt)}</td>
                      <td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {p.callbackStatus !== 'success' && p.callbackStatus !== 'resolved' && (
                            <form method="post" className="inline">
                              <input type="hidden" name="id" value={p.id} />
                              <button type="submit" name="_action" value="retry" className="text-xs text-brand-600 hover:underline">重试</button>
                            </form>
                          )}
                          {p.callbackStatus !== 'resolved' && (
                            <button className="text-xs text-green-600 hover:underline" onClick={() => setResolveId(p.id)}>
                              标记已处理
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {resolveId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[520px]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">标记支付回调为已处理</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setResolveId(null)}>✕</button>
            </div>
            <form method="post" className="p-6 space-y-4">
              <input type="hidden" name="id" value={resolveId} />
              <input type="hidden" name="_action" value="resolve" />
              <div>
                <label className="label">处理备注（内部记录）</label>
                <textarea name="remark" rows={2} className="input" placeholder="如：客户线下完成转账，财务已确认到账" />
              </div>
              <div>
                <label className="label">处理结果 *</label>
                <textarea name="resolution" rows={3} className="input" required placeholder="请详细描述处理过程和最终结果，方便后续审计" />
              </div>
              <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                ⚠️ 标记为已处理后，该条记录将从「未处理」统计中移除，并记录操作人「产品经理A」
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setResolveId(null)}>取消</button>
                <button type="submit" className="btn-primary">确认已处理</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
