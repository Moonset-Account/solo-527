import { json, type LoaderFunction, type ActionFunction, redirect } from '@remix-run/node';
import { useLoaderData, useSearchParams, useState } from '@remix-run/react';
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
import type { Reminder, PaginationResult } from '@seat-platform/shared';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);
  try {
    const data = await api.reminders.list(query);
    return json(data);
  } catch {
    const types: Reminder['type'][] = ['quota', 'trial_expire', 'payment_failed', 'abnormal_usage'];
    const levels: Reminder['level'][] = ['info', 'warning', 'critical', 'urgent'];
    const statuses: Reminder['status'][] = ['pending', 'sent', 'read', 'dismissed'];
    const customers = ['某大型电商', '金融科技A', '在线教育E', '物流平台C', 'SaaS服务商D', '新注册客户B'];
    const items: Reminder[] = Array.from({ length: 10 }, (_, i) => ({
      id: `rem_mock_${i}`,
      seatId: `seat_mock_${(i % 5) + 1}`,
      seatCode: ['VIP-001', 'VIP-002', 'VIP-003', 'TR-015', 'VIP-005', 'VIP-007'][i % 6],
      customerName: customers[i % customers.length],
      level: levels[i % levels.length],
      status: statuses[i % statuses.length],
      type: types[i % types.length],
      title: [
        '用量已达 95%，请及时续费',
        '试用期将在 3 天后结束',
        '续费支付回调失败，请人工跟进',
        '检测到异常调用波动',
      ][i % 4],
      content: '客户席位用量已达到临界阈值，建议尽快联系客户确认续费意向，避免服务中断。',
      threshold: 80 + (i % 3) * 5,
      currentUsage: 85 + i * 2,
      recipientEmails: ['admin@company.com'],
      sentAt: new Date(Date.now() - i * 3600000 * 5).toISOString(),
      createdAt: new Date(Date.now() - i * 3600000 * 5).toISOString(),
    }));
    const res: PaginationResult<Reminder> = {
      items,
      total: 342,
      page: 1,
      pageSize: 20,
      totalPages: 18,
    };
    return json(res);
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id') as string;
  if (id) {
    try { await api.reminders.dismiss(id); } catch { /* ignore */ }
  }
  return redirect('/reminders');
};

const typeLabels: Record<Reminder['type'], string> = {
  quota: '用量告警',
  trial_expire: '试用到期',
  payment_failed: '支付异常',
  abnormal_usage: '异常波动',
};

export default function RemindersPage() {
  const data = useLoaderData<PaginationResult<Reminder>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showBatch, setShowBatch] = useState(false);
  const page = parseInt(searchParams.get('page') || '1', 10);

  const pendingCount = data.items.filter((r) => r.status === 'pending' || r.status === 'sent').length;
  const urgentCount = data.items.filter((r) => r.level === 'critical' || r.level === 'urgent').length;

  return (
    <AppLayout>
      <PageHeader
        title="续费提醒"
        description="管理席位续费、用量、试用到期与支付异常提醒，支持批量发送给负责人"
        actions={
          <>
            <button className="btn-secondary btn-sm">查看发送批次</button>
            <button className="btn-primary btn-sm" onClick={() => setShowBatch(true)}>批量发送提醒</button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="提醒总数" value={data.total} />
        <StatCard label="待处理" value={pendingCount} delta="需人工跟进" deltaType="neutral" />
        <StatCard label="紧急/严重" value={urgentCount} delta="需要优先处理" deltaType="neutral" />
        <StatCard label="今日已发送" value="23" delta="+8 较昨日" deltaType="up" />
      </div>

      <div className="card mb-6">
        <div className="card-body flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">状态：</label>
            <select
              className="input"
              style={{ width: 140 }}
              value={searchParams.get('status') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('status', e.target.value); else p.delete('status');
                setSearchParams(p);
              }}
            >
              <option value="">全部</option>
              <option value="pending">待发送</option>
              <option value="sent">已发送</option>
              <option value="read">已读</option>
              <option value="dismissed">已忽略</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">级别：</label>
            <select
              className="input"
              style={{ width: 140 }}
              value={searchParams.get('level') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('level', e.target.value); else p.delete('level');
                setSearchParams(p);
              }}
            >
              <option value="">全部</option>
              <option value="info">通知</option>
              <option value="warning">警告</option>
              <option value="critical">严重</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">类型：</label>
            <select
              className="input"
              style={{ width: 160 }}
              value={searchParams.get('type') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('type', e.target.value); else p.delete('type');
                setSearchParams(p);
              }}
            >
              <option value="">全部</option>
              <option value="quota">用量告警</option>
              <option value="trial_expire">试用到期</option>
              <option value="payment_failed">支付异常</option>
              <option value="abnormal_usage">异常波动</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState message="暂无提醒" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>级别</th>
                    <th>类型</th>
                    <th>席位</th>
                    <th>客户</th>
                    <th>标题</th>
                    <th>用量情况</th>
                    <th>状态</th>
                    <th>发送时间</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.id}>
                      <td><StatusBadge status={r.level} /></td>
                      <td>{typeLabels[r.type]}</td>
                      <td className="font-mono text-xs">{r.seatCode}</td>
                      <td>{r.customerName}</td>
                      <td>
                        <div className="max-w-sm truncate font-medium">{r.title}</div>
                        <div className="text-xs text-gray-500 max-w-sm truncate">{r.content}</div>
                      </td>
                      <td>
                        {r.currentUsage !== undefined && r.threshold !== undefined ? (
                          <div className="text-xs">
                            当前 <span className={r.currentUsage >= r.threshold ? 'text-red-600 font-semibold' : 'text-gray-700'}>{r.currentUsage}%</span>
                            <span className="text-gray-400"> / 阈值 {r.threshold}%</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td><StatusBadge status={r.status} type="reminder" /></td>
                      <td className="text-gray-500 text-xs">{r.sentAt ? formatDate(r.sentAt) : '-'}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-xs text-brand-600 hover:underline">查看</button>
                          {r.status !== 'dismissed' && (
                            <form method="post">
                              <input type="hidden" name="id" value={r.id} />
                              <button type="submit" className="text-xs text-gray-600 hover:underline">忽略</button>
                            </form>
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

      {showBatch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[560px] max-h-[85vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">批量发送续费提醒</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowBatch(false)}>✕</button>
            </div>
            <form method="post" className="p-6 space-y-4" onSubmit={() => setShowBatch(false)}>
              <div>
                <label className="label">批次名称 *</label>
                <input name="name" className="input" placeholder="如 2025年6月高用量客户续费提醒" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">提醒级别 *</label>
                  <select name="level" className="input">
                    <option value="info">通知</option>
                    <option value="warning" selected>警告</option>
                    <option value="critical">严重</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
                <div>
                  <label className="label">提醒类型 *</label>
                  <select name="type" className="input">
                    <option value="quota" selected>用量告警</option>
                    <option value="trial_expire">试用到期</option>
                    <option value="payment_failed">支付异常</option>
                    <option value="abnormal_usage">异常波动</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">目标席位（按用量阈值或到期日筛选）</label>
                <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-sm text-gray-600">
                  已自动筛选：用量 ≥ 80% 的席位 23 个 · 试用 7 天内到期 8 个 · 支付回调失败 5 个
                </div>
              </div>
              <div>
                <label className="label">邮件标题模板</label>
                <input name="titleTemplate" className="input" defaultValue="【续费提醒】{customerName} API 用量即将耗尽" />
              </div>
              <div>
                <label className="label">邮件内容模板</label>
                <textarea name="contentTemplate" rows={4} className="input" defaultValue={`尊敬的 {customerName}，

您的席位 {seatCode} 当前 API 用量已达 {usedQuota}/{quota} 次，为避免影响业务，请及时联系我们续费。

支持变量：{customerName} {seatCode} {usedQuota} {quota}`} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" className="btn-secondary" onClick={() => setShowBatch(false)}>取消</button>
                <button type="submit" className="btn-primary">发送 {23 + 8 + 5} 条提醒</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
