import { json, type LoaderFunction, type ActionFunction, redirect } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
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
import type { Reminder, ReminderBatch, PaginationResult } from '@seat-platform/shared';

interface LoaderData {
  reminders: PaginationResult<Reminder>;
  batches: PaginationResult<ReminderBatch>;
  seatIds: string[];
}

function mockBatches(): PaginationResult<ReminderBatch> {
  const batchStatuses: ReminderBatch['status'][] = ['completed', 'processing', 'failed', 'completed', 'completed'];
  const levels: ReminderBatch['level'][] = ['warning', 'critical', 'urgent', 'info', 'warning'];
  const types: ReminderBatch['type'][] = ['quota', 'trial_expire', 'payment_failed', 'abnormal_usage', 'quota'];
  const names = ['2025年6月高用量客户续费提醒', '试用期到期提醒', '支付异常紧急跟进', '异常波动通知', '月度用量提醒'];
  const creators = ['产品经理A', '产品经理B', '运营C', 'system', '产品经理A'];

  const items: ReminderBatch[] = Array.from({ length: 5 }, (_, i) => {
    const total = 20 + i * 10;
    const success = batchStatuses[i] === 'processing' ? Math.floor(total * 0.6) : batchStatuses[i] === 'failed' ? 0 : total - (i % 3);
    return {
      id: `batch_mock_${i}`,
      name: names[i],
      level: levels[i],
      type: types[i],
      seatIds: Array.from({ length: total }, (_, j) => `seat_mock_${j + 1}`),
      totalCount: total,
      successCount: success,
      failedCount: total - success,
      createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      createdBy: creators[i],
      status: batchStatuses[i],
    };
  });

  return {
    items,
    total: 28,
    page: 1,
    pageSize: 10,
    totalPages: 3,
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);

  let reminders: PaginationResult<Reminder>;
  let batches: PaginationResult<ReminderBatch>;

  try {
    reminders = await api.reminders.list(query);
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
    reminders = {
      items,
      total: 342,
      page: 1,
      pageSize: 20,
      totalPages: 18,
    };
  }

  try {
    batches = await api.reminders.batches(query);
  } catch {
    batches = mockBatches();
  }

  const seatIds = [...new Set(reminders.items.map((r) => r.seatId))];

  return json({ reminders, batches, seatIds } as LoaderData);
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const _action = formData.get('_action') as string;
  const id = formData.get('id') as string;

  try {
    if (_action === 'batch') {
      const name = formData.get('name') as string;
      const level = formData.get('level') as ReminderBatch['level'];
      const type = formData.get('type') as ReminderBatch['type'];
      const titleTemplate = formData.get('titleTemplate') as string;
      const contentTemplate = formData.get('contentTemplate') as string;
      const seatIds = formData.getAll('seatIds') as string[];

      await api.reminders.batchSend({
        name,
        level,
        type,
        seatIds,
        titleTemplate,
        contentTemplate,
      });
      return redirect('/reminders?tab=batches');
    } else if (id) {
      await api.reminders.dismiss(id);
    }
  } catch {
    /* ignore */
  }
  return redirect('/reminders');
};

const typeLabels: Record<Reminder['type'], string> = {
  quota: '用量告警',
  trial_expire: '试用到期',
  payment_failed: '支付异常',
  abnormal_usage: '异常波动',
};

const batchTypeLabels: Record<ReminderBatch['type'], string> = {
  quota: '用量告警',
  trial_expire: '试用到期',
  payment_failed: '支付异常',
  abnormal_usage: '异常波动',
};

const batchStatusLabels: Record<ReminderBatch['status'], string> = {
  processing: '发送中',
  completed: '已完成',
  failed: '发送失败',
};

export default function RemindersPage() {
  const { reminders, batches, seatIds } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showBatch, setShowBatch] = useState(false);
  const [showBatchList, setShowBatchList] = useState(() => searchParams.get('tab') === 'batches');
  const page = parseInt(searchParams.get('page') || '1', 10);

  const pendingCount = reminders.items.filter((r) => r.status === 'pending' || r.status === 'sent').length;
  const urgentCount = reminders.items.filter((r) => r.level === 'critical' || r.level === 'urgent').length;

  return (
    <AppLayout>
      <PageHeader
        title="续费提醒"
        description="管理席位续费、用量、试用到期与支付异常提醒，支持批量发送给负责人"
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setShowBatchList(!showBatchList)}>
              {showBatchList ? '返回提醒列表' : '查看发送批次'}
            </button>
            <button className="btn-primary btn-sm" onClick={() => setShowBatch(true)}>批量发送提醒</button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="提醒总数" value={reminders.total} />
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

      {showBatchList ? (
        <div className="card overflow-hidden">
          {batches.items.length === 0 ? (
            <EmptyState message="暂无发送批次" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>批次名称</th>
                      <th>级别</th>
                      <th>类型</th>
                      <th>发送状态</th>
                      <th>发送结果</th>
                      <th>创建人</th>
                      <th>创建时间</th>
                      <th className="text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.items.map((batch) => (
                      <tr key={batch.id}>
                        <td className="font-medium">{batch.name}</td>
                        <td><StatusBadge status={batch.level} /></td>
                        <td>{batchTypeLabels[batch.type]}</td>
                        <td><StatusBadge status={batch.status} type="reminder" /></td>
                        <td className="text-xs">
                          <span className="text-green-600">成功 {batch.successCount}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-red-600">失败 {batch.failedCount}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-600">总计 {batch.totalCount}</span>
                        </td>
                        <td>{batch.createdBy}</td>
                        <td className="text-gray-500 text-xs">{formatDate(batch.createdAt)}</td>
                        <td className="text-right">
                          <button className="text-xs text-brand-600 hover:underline">查看详情</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={batches.totalPages}
                total={batches.total}
                pageSize={batches.pageSize}
                onPageChange={(p) => {
                  const np = new URLSearchParams(searchParams);
                  np.set('page', String(p));
                  setSearchParams(np);
                }}
              />
            </>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {reminders.items.length === 0 ? (
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
                    {reminders.items.map((r) => (
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
                totalPages={reminders.totalPages}
                total={reminders.total}
                pageSize={reminders.pageSize}
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

      {showBatch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[560px] max-h-[85vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">批量发送续费提醒</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowBatch(false)}>✕</button>
            </div>
            <form method="post" className="p-6 space-y-4" onSubmit={() => setShowBatch(false)}>
              <input type="hidden" name="_action" value="batch" />
              {seatIds.map((sid) => (
                <input key={sid} type="hidden" name="seatIds" value={sid} />
              ))}
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
                <label className="label">目标席位</label>
                <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-sm text-gray-600">
                  已选中 {seatIds.length} 个席位（来自当前提醒列表的去重席位）
                </div>
              </div>
              <div>
                <label className="label">邮件标题模板 *</label>
                <input name="titleTemplate" className="input" defaultValue="【续费提醒】{customerName} API 用量即将耗尽" required />
              </div>
              <div>
                <label className="label">邮件内容模板 *</label>
                <textarea name="contentTemplate" rows={4} className="input" required defaultValue={`尊敬的 {customerName}，

您的席位 {seatCode} 当前 API 用量已达 {usedQuota}/{quota} 次，为避免影响业务，请及时联系我们续费。

支持变量：{customerName} {seatCode} {usedQuota} {quota}`} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" className="btn-secondary" onClick={() => setShowBatch(false)}>取消</button>
                <button type="submit" className="btn-primary">发送 {seatIds.length} 个席位提醒</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
