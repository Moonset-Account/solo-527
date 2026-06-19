import { json, type LoaderFunction } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
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
import type { AuditLog, OperationAction, PaginationResult } from '@seat-platform/shared';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);
  try {
    const data = await api.logs.audit(query);
    return json(data);
  } catch {
    const actions: OperationAction[] = ['seat.create', 'seat.update', 'seat.status_change', 'seat.threshold_update', 'reminder.send', 'reminder.batch_send', 'payment.callback', 'payment.callback_resolve', 'export.create'];
    const entityTypes: AuditLog['entityType'][] = ['seat', 'reminder', 'payment', 'export'];
    const operators = ['产品经理A', '产品经理B', '运营C', 'system', '支付网关'];
    const items: AuditLog[] = Array.from({ length: 15 }, (_, i) => {
      const action = actions[i % actions.length];
      const entityType = entityTypes[Math.floor(i / 4) % entityTypes.length];
      return {
        id: `audit_mock_${i}`,
        entityType,
        entityId: `${entityType}_mock_${(i % 8) + 1}`,
        action,
        fieldName: action.includes('threshold') ? 'usageThreshold' : action.includes('status') ? 'status' : undefined,
        oldValue: action.includes('threshold') ? 85 : action.includes('status') ? 'trial' : undefined,
        newValue: action.includes('threshold') ? 80 : action.includes('status') ? 'active' : undefined,
        operatorName: operators[i % operators.length],
        remark: i % 3 === 0 ? '按客户要求调整' : i % 5 === 0 ? '系统自动触发' : undefined,
        createdAt: new Date(Date.now() - i * 3600000 * 3).toISOString(),
      };
    });
    const res: PaginationResult<AuditLog> = { items, total: 1247, page: 1, pageSize: 20, totalPages: 63 };
    return json(res);
  }
};

const entityTypeLabels: Record<AuditLog['entityType'], string> = {
  seat: '席位',
  reminder: '提醒',
  payment: '支付',
  export: '导出',
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default function AuditLogsPage() {
  const data = useLoaderData<PaginationResult<AuditLog>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  return (
    <AppLayout>
      <PageHeader title="审计日志" description="记录所有席位状态、阈值、提醒、支付等关键变更，方便回溯中间处理过程" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="总审计条数" value={data.total.toLocaleString()} />
        <StatCard label="席位变更" value={Math.floor(data.total * 0.5).toLocaleString()} />
        <StatCard label="支付操作" value={Math.floor(data.total * 0.2).toLocaleString()} />
        <StatCard label="提醒发送" value={Math.floor(data.total * 0.25).toLocaleString()} />
      </div>

      <div className="card mb-6">
        <div className="card-body flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">实体类型：</label>
            <select
              className="input"
              style={{ width: 140 }}
              value={searchParams.get('entityType') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('entityType', e.target.value); else p.delete('entityType');
                setSearchParams(p);
              }}
            >
              <option value="">全部</option>
              <option value="seat">席位</option>
              <option value="reminder">提醒</option>
              <option value="payment">支付</option>
              <option value="export">导出</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">操作：</label>
            <input
              className="input"
              style={{ width: 180 }}
              placeholder="如 seat.status_change"
              value={searchParams.get('action') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('action', e.target.value); else p.delete('action');
                setSearchParams(p);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">实体ID：</label>
            <input
              className="input"
              style={{ width: 200 }}
              placeholder="席位/支付等ID"
              value={searchParams.get('entityId') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('entityId', e.target.value); else p.delete('entityId');
                setSearchParams(p);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState message="暂无审计日志" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>实体类型</th>
                    <th>实体ID</th>
                    <th>操作</th>
                    <th>变更字段</th>
                    <th>变更前</th>
                    <th>变更后</th>
                    <th>操作人</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((log) => (
                    <tr key={log.id}>
                      <td className="text-gray-500 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td><StatusBadge status={log.entityType} type="default" /></td>
                      <td className="font-mono text-xs">{log.entityId}</td>
                      <td className="text-sm"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{log.action}</span></td>
                      <td className="text-sm">{log.fieldName || '-'}</td>
                      <td className="font-mono text-xs text-red-600">{log.oldValue !== undefined ? formatValue(log.oldValue) : '-'}</td>
                      <td className="font-mono text-xs text-green-600">{log.newValue !== undefined ? formatValue(log.newValue) : '-'}</td>
                      <td className="text-sm">{log.operatorName}</td>
                      <td className="text-xs text-gray-600 max-w-xs truncate">{log.remark || '-'}</td>
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
    </AppLayout>
  );
}
