'use client';

import { AppShell } from '~/components/layout/AppShell';
import { trpc } from '~/app/_trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { formatCurrency, formatDate, formatDateTime } from '~/lib/utils';
import { UserAvatar } from '~/components/ui/Badges';
import { EmptyState } from '~/components/ui/EmptyState';
import { StatCard } from '~/components/ui/StatCard';
import { FileText, Check, X, Eye } from 'lucide-react';
import { QuotationStatus, ExtraItemStatus } from '@prisma/client';

const quotationStatusConfig: Record<QuotationStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-700' },
  PENDING_CONFIRM: { label: '待设计师确认', className: 'bg-warning-100 text-warning-700' },
  CONFIRMED: { label: '已确认', className: 'bg-brand-100 text-brand-700' },
  REJECTED: { label: '已拒绝', className: 'bg-danger-100 text-danger-600' },
};

const extraItemStatusConfig: Record<ExtraItemStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-700' },
  PENDING_CONFIRM: { label: '待设计师确认', className: 'bg-warning-100 text-warning-700' },
  CONFIRMED: { label: '已确认', className: 'bg-brand-100 text-brand-700' },
  REJECTED: { label: '已拒绝', className: 'bg-danger-100 text-danger-600' },
};

export default function QuotationsPage() {
  const [tab, setTab] = useState<'quotations' | 'extra'>('quotations');
  const utils = trpc.useUtils();

  const listQuery = trpc.quotation.list.useQuery({});
  const confirmQuotation = trpc.quotation.confirmQuotation.useMutation({
    onSuccess: () => utils.quotation.list.invalidate(),
  });
  const confirmExtraItem = trpc.quotation.confirmExtraItem.useMutation({
    onSuccess: () => utils.quotation.list.invalidate(),
  });

  const quotations = listQuery.data?.quotations ?? [];
  const extraItems = listQuery.data?.extraItems ?? [];

  const pendingQuotations = quotations.filter((q) => q.status === QuotationStatus.PENDING_CONFIRM);
  const pendingExtraItems = extraItems.filter((e) => e.status === ExtraItemStatus.PENDING_CONFIRM);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-800">报价与增项确认</h1>
          <p className="section-subtitle">设计师在此页面核对并确认报价和增项</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="待确认报价单" value={pendingQuotations.length} icon={FileText} />
          <StatCard title="待确认增项" value={pendingExtraItems.length} icon={FileText} />
        </div>

        <div className="card">
          <div className="flex border-b">
            <button
              onClick={() => setTab('quotations')}
              className={`px-6 py-3 text-sm font-display font-semibold border-b-2 transition-colors ${tab === 'quotations' ? 'border-navy-800 text-navy-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              报价单 ({pendingQuotations.length} 待确认)
            </button>
            <button
              onClick={() => setTab('extra')}
              className={`px-6 py-3 text-sm font-display font-semibold border-b-2 transition-colors ${tab === 'extra' ? 'border-navy-800 text-navy-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              增项 ({pendingExtraItems.length} 待确认)
            </button>
          </div>

          <div className="p-6">
            {tab === 'quotations' && (
              quotations.length === 0 ? (
                <EmptyState title="暂无报价单" icon={<FileText className="w-7 h-7 text-gray-400" />} />
              ) : (
                <div className="space-y-4">
                  {quotations.map((q) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-5 hover:border-brand-200 hover:shadow-card-hover transition-all">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Link href={`/projects/${q.projectId}`} className="font-display font-semibold text-navy-800 hover:text-brand-600 transition-colors">
                              {q.project?.name}
                            </Link>
                            <span className="text-xs text-gray-400">{q.project?.code}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm font-display">v{q.version}</span>
                            <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider ${quotationStatusConfig[q.status].className}`}>
                              {quotationStatusConfig[q.status].label}
                            </span>
                          </div>
                          <p className="text-2xl font-display font-bold text-navy-800 mt-3">{formatCurrency(q.amount.toNumber())}</p>
                          {q.remark && <p className="text-sm text-gray-600 mt-2">备注: {q.remark}</p>}
                          <div className="flex gap-6 mt-3 text-xs text-gray-400">
                            <span>创建: {formatDateTime(q.createdAt)}</span>
                            {q.confirmedAt && <span>确认: {formatDateTime(q.confirmedAt)}</span>}
                            {q.confirmedBy && <UserAvatar name={q.confirmedBy.name} />}
                            {q.rejectedReason && <span className="text-danger-600">拒绝原因: {q.rejectedReason}</span>}
                          </div>
                        </div>
                        {q.status === QuotationStatus.PENDING_CONFIRM && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => confirmQuotation.mutate({ id: q.id, confirmed: true })}
                              className="btn-success inline-flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" /> 确认报价
                            </button>
                            <button
                              onClick={() => confirmQuotation.mutate({ id: q.id, confirmed: false, rejectReason: '待调整' })}
                              className="btn-danger inline-flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" /> 拒绝
                            </button>
                            <Link href={`/projects/${q.projectId}`} className="btn-secondary text-center inline-flex items-center justify-center gap-1.5">
                              <Eye className="w-4 h-4" /> 查看详情
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'extra' && (
              extraItems.length === 0 ? (
                <EmptyState title="暂无增项" icon={<FileText className="w-7 h-7 text-gray-400" />} />
              ) : (
                <div className="overflow-auto">
                  <table className="table">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="table-th">项目</th>
                        <th className="table-th">增项名称</th>
                        <th className="table-th">描述</th>
                        <th className="table-th">金额</th>
                        <th className="table-th">原因</th>
                        <th className="table-th">状态</th>
                        <th className="table-th">创建时间</th>
                        <th className="table-th">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {extraItems.map((e) => (
                        <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="table-td">
                            <Link href={`/projects/${e.projectId}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                              {e.project?.code}
                            </Link>
                            <p className="text-xs text-gray-400">{e.project?.name}</p>
                          </td>
                          <td className="table-td font-medium text-navy-800">{e.name}</td>
                          <td className="table-td text-sm text-gray-600">{e.description}</td>
                          <td className="table-td font-display font-bold text-lg text-navy-800">{formatCurrency(e.amount.toNumber())}</td>
                          <td className="table-td text-sm text-gray-600">{e.reason ?? '-'}</td>
                          <td className="table-td">
                            <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider ${extraItemStatusConfig[e.status].className}`}>
                              {extraItemStatusConfig[e.status].label}
                            </span>
                          </td>
                          <td className="table-td text-sm text-gray-400">{formatDate(e.createdAt)}</td>
                          <td className="table-td">
                            {e.status === ExtraItemStatus.PENDING_CONFIRM && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => confirmExtraItem.mutate({ id: e.id, confirmed: true })}
                                  className="btn-success text-xs py-1 inline-flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> 确认
                                </button>
                                <button
                                  onClick={() => confirmExtraItem.mutate({ id: e.id, confirmed: false })}
                                  className="btn-danger text-xs py-1 inline-flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> 拒绝
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
