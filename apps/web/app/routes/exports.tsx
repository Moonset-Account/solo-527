import { json, type LoaderFunction, type ActionFunction, redirect } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams, useState } from '@remix-run/react';
import AppLayout from '~/components/AppLayout';
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Pagination,
  EmptyState,
  formatDate,
  formatNumber,
} from '~/components/ui';
import { api } from '~/api.client';
import type { ExportTask, PaginationResult } from '@seat-platform/shared';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);
  try {
    const data = await api.exports.list(query);
    return json(data);
  } catch {
    const types: ExportTask['type'][] = ['seats', 'usage', 'reminders', 'payments', 'audit_logs', 'operations'];
    const statuses: ExportTask['status'][] = ['completed', 'completed', 'processing', 'pending', 'failed', 'completed'];
    const names = [
      '2025年6月席位全量导出',
      '高用量客户 TOP 100 用量明细',
      '本月续费提醒发送记录',
      '支付回调异常报告',
      'Q2 审计日志汇总',
      '5月运营操作全记录',
    ];
    const items: ExportTask[] = Array.from({ length: 10 }, (_, i) => {
      const status = statuses[i % statuses.length];
      const rows = 1000 + i * 850;
      return {
        id: `exp_mock_${i}`,
        name: names[i % names.length],
        type: types[i % types.length],
        status,
        filters: {},
        totalRows: rows,
        exportedRows: status === 'completed' ? rows : status === 'processing' ? Math.floor(rows * 0.6) : 0,
        filePath: status === 'completed' ? `exp_${i}.csv` : undefined,
        fileSize: status === 'completed' ? 100000 + i * 50000 : undefined,
        errorMessage: status === 'failed' ? 'Redis 连接超时，导出任务中断' : undefined,
        createdBy: ['产品经理A', '产品经理B', '运营C'][i % 3],
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        startedAt: status !== 'pending' ? new Date(Date.now() - i * 86400000 + 60000).toISOString() : undefined,
        completedAt: status === 'completed' || status === 'failed' ? new Date(Date.now() - i * 86400000 + 180000).toISOString() : undefined,
        expiredAt: new Date(Date.now() + (7 - i) * 86400000).toISOString(),
      };
    });
    const res: PaginationResult<ExportTask> = { items, total: 84, page: 1, pageSize: 20, totalPages: 5 };
    return json(res);
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  try {
    await api.exports.create({
      name: formData.get('name') as string,
      type: formData.get('type') as ExportTask['type'],
      filters: {},
    });
  } catch {
    // ignore
  }
  return redirect('/exports');
};

const typeLabels: Record<ExportTask['type'], string> = {
  seats: '席位数据',
  usage: '用量记录',
  reminders: '提醒记录',
  payments: '支付回调',
  audit_logs: '审计日志',
  operations: '操作记录',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportsPage() {
  const data = useLoaderData<PaginationResult<ExportTask>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const page = parseInt(searchParams.get('page') || '1', 10);

  const completedCount = data.items.filter((t) => t.status === 'completed').length;
  const pendingCount = data.items.filter((t) => t.status === 'pending' || t.status === 'processing').length;

  return (
    <AppLayout>
      <PageHeader
        title="导出任务"
        description="大批量数据异步导出，所有任务状态与结果可查，文件保留 7 天"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowCreate(true)}>新建导出任务</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="任务总数" value={data.total} />
        <StatCard label="已完成" value={completedCount} />
        <StatCard label="处理中/待处理" value={pendingCount} />
        <StatCard label="文件保留" value="7 天" delta="自动过期清理" deltaType="neutral" />
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
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
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
              <option value="seats">席位数据</option>
              <option value="usage">用量记录</option>
              <option value="reminders">提醒记录</option>
              <option value="payments">支付回调</option>
              <option value="audit_logs">审计日志</option>
              <option value="operations">操作记录</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState message="暂无导出任务" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>任务名称</th>
                    <th>数据类型</th>
                    <th>状态</th>
                    <th>进度</th>
                    <th>文件大小</th>
                    <th>创建人</th>
                    <th>创建时间</th>
                    <th>过期时间</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((task) => {
                    const progress = task.totalRows > 0 ? Math.round((task.exportedRows / task.totalRows) * 100) : 0;
                    return (
                      <tr key={task.id}>
                        <td className="font-medium">{task.name}</td>
                        <td>{typeLabels[task.type]}</td>
                        <td><StatusBadge status={task.status} type="export" /></td>
                        <td className="min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${task.status === 'failed' ? 'bg-red-500' : task.status === 'completed' ? 'bg-green-500' : 'bg-brand-500'}`}
                                style={{ width: `${task.status === 'completed' ? 100 : progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-16 text-right">
                              {task.status === 'completed'
                                ? `${formatNumber(task.exportedRows)} 行`
                                : task.status === 'failed'
                                ? '失败'
                                : task.status === 'pending'
                                ? '排队中'
                                : `${progress}%`}
                            </span>
                          </div>
                          {task.errorMessage && (
                            <div className="mt-1 text-xs text-red-600">{task.errorMessage}</div>
                          )}
                        </td>
                        <td className="text-sm">{task.fileSize ? formatFileSize(task.fileSize) : '-'}</td>
                        <td className="text-sm">{task.createdBy}</td>
                        <td className="text-xs text-gray-500">{formatDate(task.createdAt)}</td>
                        <td className="text-xs text-gray-500">{formatDate(task.expiredAt)}</td>
                        <td className="text-right whitespace-nowrap">
                          {task.status === 'completed' && task.filePath && (
                            <a
                              href={api.exports.downloadUrl(task.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand-600 hover:underline"
                            >
                              下载
                            </a>
                          )}
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

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[520px]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">新建导出任务</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form method="post" className="p-6 space-y-4">
              <div>
                <label className="label">任务名称 *</label>
                <input name="name" className="input" placeholder="如 2025年6月高用量席位导出" required />
              </div>
              <div>
                <label className="label">数据类型 *</label>
                <select name="type" className="input">
                  <option value="seats">席位数据</option>
                  <option value="usage">用量记录</option>
                  <option value="reminders">提醒记录</option>
                  <option value="payments">支付回调</option>
                  <option value="audit_logs">审计日志</option>
                  <option value="operations">操作记录</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-3">
                📌 大数据量导出将在后台异步执行，完成后可在此页面下载 CSV 文件，文件保留 7 天
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn-primary">提交导出任务</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
