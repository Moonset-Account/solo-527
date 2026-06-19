import { json, type LoaderFunction } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import AppLayout from '~/components/AppLayout';
import {
  PageHeader,
  StatCard,
  Pagination,
  EmptyState,
  formatDate,
} from '~/components/ui';
import { api } from '~/api.client';
import type { OperationLog, PaginationResult } from '@seat-platform/shared';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);
  try {
    const data = await api.logs.operations(query);
    return json(data);
  } catch {
    const actions = ['seat.create', 'seat.update', 'reminder.send', 'reminder.batch_send', 'payment.callback_retry', 'payment.callback_resolve', 'export.create', 'export.download', 'user.login', 'user.logout'];
    const targetTypes = ['seat', 'reminder', 'payment', 'export_task', 'user'];
    const users = [
      { id: 'u1', name: '产品经理A' },
      { id: 'u2', name: '产品经理B' },
      { id: 'u3', name: '运营C' },
      { id: 'u4', name: '销售D' },
    ];
    const details = [
      '创建席位 VIP-009',
      '修改席位配额由 50万 调整为 100万',
      '批量发送续费提醒 36 条',
      '重试支付回调 TX20250618001',
      '导出席位列表 CSV',
      '下载 2025年6月用量报告',
      '登录系统',
      '标记支付回调为已处理',
    ];
    const items: OperationLog[] = Array.from({ length: 15 }, (_, i) => {
      const user = users[i % users.length];
      return {
        id: `op_mock_${i}`,
        userId: user.id,
        userName: user.name,
        action: actions[i % actions.length],
        targetType: targetTypes[i % targetTypes.length],
        targetId: `tgt_${i}`,
        detail: details[i % details.length],
        ip: `192.168.${(i % 50) + 1}.${(i % 200) + 10}`,
        userAgent: 'Chrome 125 / macOS',
        createdAt: new Date(Date.now() - i * 3600000 * 1.5).toISOString(),
      };
    });
    const res: PaginationResult<OperationLog> = { items, total: 3562, page: 1, pageSize: 20, totalPages: 179 };
    return json(res);
  }
};

export default function OperationsPage() {
  const data = useLoaderData<PaginationResult<OperationLog>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  return (
    <AppLayout>
      <PageHeader title="操作记录" description="所有用户在系统中的操作行为记录，用于审计和追溯" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="总操作数" value={data.total.toLocaleString()} />
        <StatCard label="今日操作" value="142" delta="+32 较昨日" deltaType="up" />
        <StatCard label="活跃用户" value="8" />
        <StatCard label="异常操作" value="2" delta="需关注" deltaType="neutral" />
      </div>

      <div className="card mb-6">
        <div className="card-body flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">操作：</label>
            <input
              className="input"
              style={{ width: 200 }}
              placeholder="如 payment.callback_retry"
              value={searchParams.get('action') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('action', e.target.value); else p.delete('action');
                setSearchParams(p);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">目标类型：</label>
            <input
              className="input"
              style={{ width: 160 }}
              placeholder="seat / reminder / payment"
              value={searchParams.get('targetType') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('targetType', e.target.value); else p.delete('targetType');
                setSearchParams(p);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">用户：</label>
            <input
              className="input"
              style={{ width: 160 }}
              placeholder="用户ID"
              value={searchParams.get('userId') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('userId', e.target.value); else p.delete('userId');
                setSearchParams(p);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState message="暂无操作记录" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>操作人</th>
                    <th>操作类型</th>
                    <th>目标</th>
                    <th>目标ID</th>
                    <th>操作详情</th>
                    <th>IP 地址</th>
                    <th>客户端</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((log) => (
                    <tr key={log.id}>
                      <td className="text-gray-500 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {log.userName.slice(0, 1)}
                          </div>
                          <span className="text-sm">{log.userName}</span>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{log.action}</span></td>
                      <td className="text-sm">{log.targetType}</td>
                      <td className="font-mono text-xs text-gray-600">{log.targetId || '-'}</td>
                      <td className="text-sm max-w-xs truncate">{log.detail}</td>
                      <td className="font-mono text-xs text-gray-600">{log.ip || '-'}</td>
                      <td className="text-xs text-gray-500">{log.userAgent || '-'}</td>
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
