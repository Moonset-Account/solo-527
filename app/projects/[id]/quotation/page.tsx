'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, StatusBadge, DataTable } from '@/components/ui';
import { mockQuotations, mockAddons, mockBudgetChangeLogs } from '@/lib/mockData';
import { formatCurrency, formatDateTime, cn, getStatusLabel } from '@/lib/utils';
import type { QuotationItem, Addon, BudgetChangeLog } from '@/lib/types';

export default function QuotationPage() {
  const params = useParams();
  const projectId = params.id as string;

  const quotation = useMemo(
    () => mockQuotations.find((q) => q.project_id === projectId),
    [projectId]
  );
  const addons = useMemo(
    () => mockAddons.filter((a) => a.project_id === projectId),
    [projectId]
  );
  const budgetLogs = useMemo(
    () => mockBudgetChangeLogs.filter((b) => b.project_id === projectId),
    [projectId]
  );

  const groupedItems = useMemo(() => {
    if (!quotation) return {} as Record<string, QuotationItem[]>;
    return quotation.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, QuotationItem[]>);
  }, [quotation]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(groupedItems).forEach(([cat, items]) => {
      totals[cat] = items.reduce((sum, item) => sum + item.subtotal, 0);
    });
    return totals;
  }, [groupedItems]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(Object.keys(groupedItems))
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (!quotation) {
    return (
      <div className="p-6">
        <Card>
          <div className="py-10 text-center text-zinc-500">暂无报价数据</div>
        </Card>
      </div>
    );
  }

  const showQuotationActions = quotation.status === 'pending_confirm';

  return (
    <div className="space-y-6 p-6">
      <Card
        title={
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-sm font-semibold text-zinc-900">报价明细</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">版本 V{quotation.version}</span>
              <StatusBadge status={quotation.status} />
            </div>
          </div>
        }
      >
        <div className="border border-zinc-200 rounded overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="whitespace-nowrap px-4 py-2.5 w-10"></th>
                  <th className="whitespace-nowrap px-4 py-2.5">项目名称</th>
                  <th className="whitespace-nowrap px-4 py-2.5 w-20 text-right">单位</th>
                  <th className="whitespace-nowrap px-4 py-2.5 w-24 text-right">数量</th>
                  <th className="whitespace-nowrap px-4 py-2.5 w-32 text-right">单价</th>
                  <th className="whitespace-nowrap px-4 py-2.5 w-32 text-right">小计</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {Object.entries(groupedItems).map(([category, items]) => {
                  const isExpanded = expandedCategories.has(category);
                  return (
                    <>
                      <tr
                        key={`cat-${category}`}
                        className="bg-zinc-50/60 hover:bg-zinc-100/60 cursor-pointer transition-colors"
                        onClick={() => toggleCategory(category)}
                      >
                        <td className="whitespace-nowrap px-4 py-2.5">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-zinc-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-800">
                          {category}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-zinc-500">
                          {items.length} 项
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-zinc-500"></td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-zinc-500">
                          分类合计
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-zinc-900">
                          {formatCurrency(categoryTotals[category])}
                        </td>
                      </tr>
                      {isExpanded &&
                        items.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-zinc-50/80 transition-colors"
                          >
                            <td className="whitespace-nowrap px-4 py-3"></td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                              <div className="pl-2">{item.name}</div>
                              {item.remark && (
                                <div className="pl-2 mt-0.5 text-xs text-zinc-400">
                                  {item.remark}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-600">
                              {item.unit}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-600">
                              {item.quantity}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-600">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-800">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sticky bottom-0 border-t border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">报价总价：</span>
                <span className="text-xl font-bold text-brand-700">
                  {formatCurrency(quotation.total_amount)}
                </span>
              </div>
              {showQuotationActions && (
                <div className="flex items-center gap-3">
                  <Button variant="danger" size="lg">
                    驳回
                  </Button>
                  <Button size="lg">确认</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="增项列表">
        <DataTable<Addon>
          columns={[
            {
              key: 'name',
              title: '增项名称',
              render: (row) => (
                <div>
                  <div className="font-medium text-zinc-800">{row.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{row.description}</div>
                </div>
              ),
            },
            {
              key: 'amount',
              title: '金额',
              width: '140px',
              render: (row) => (
                <div className="text-right font-medium text-zinc-800">
                  {formatCurrency(row.amount)}
                </div>
              ),
            },
            {
              key: 'status',
              title: '状态',
              width: '100px',
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: 'requested_by_name',
              title: '发起人',
              width: '120px',
              render: (row) => (
                <span className="text-zinc-600">{row.requested_by_name ?? '-'}</span>
              ),
            },
            {
              key: 'actions',
              title: '操作',
              width: '180px',
              render: (row) =>
                row.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm">
                      驳回
                    </Button>
                    <Button size="sm">确认</Button>
                  </div>
                ) : null,
            },
          ]}
          data={addons}
          rowKey={(row) => row.id}
          emptyText="暂无增项记录"
        />
      </Card>

      <Card title="预算变更历史">
        <DataTable<BudgetChangeLog>
          columns={[
            {
              key: 'change_type',
              title: '类型',
              width: '100px',
              render: (row) => {
                const typeMap: Record<string, { label: string; className: string }> = {
                  quotation: {
                    label: '报价',
                    className: 'bg-brand-50 text-brand-700 border-brand-200',
                  },
                  addon: {
                    label: '增项',
                    className: 'bg-green-50 text-green-700 border-green-200',
                  },
                  adjustment: {
                    label: '调价',
                    className: 'bg-warn-50 text-warn-600 border-warn-200',
                  },
                };
                const type = typeMap[row.change_type] ?? typeMap.quotation;
                return (
                  <span
                    className={cn(
                      'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
                      type.className
                    )}
                  >
                    {type.label}
                  </span>
                );
              },
            },
            {
              key: 'change_amount',
              title: '金额变动',
              width: '140px',
              render: (row) => {
                const isPositive = row.change_amount >= 0;
                const isAddon = row.change_type === 'addon';
                return (
                  <div
                    className={cn(
                      'text-right font-medium',
                      isAddon
                        ? 'text-green-600'
                        : isPositive
                        ? 'text-zinc-700'
                        : 'text-danger-600'
                    )}
                  >
                    {isAddon ? '+' : isPositive ? '+' : ''}
                    {formatCurrency(row.change_amount)}
                  </div>
                );
              },
            },
            {
              key: 'before_budget',
              title: '变更前预算',
              width: '160px',
              render: (row) => (
                <div className="text-right text-zinc-600">
                  {formatCurrency(row.before_budget)}
                </div>
              ),
            },
            {
              key: 'after_budget',
              title: '变更后预算',
              width: '160px',
              render: (row) => (
                <div className="text-right font-medium text-zinc-800">
                  {formatCurrency(row.after_budget)}
                </div>
              ),
            },
            {
              key: 'reason',
              title: '原因',
              render: (row) => (
                <span className="text-zinc-600">{row.reason}</span>
              ),
            },
            {
              key: 'operator_name',
              title: '操作人',
              width: '100px',
              render: (row) => (
                <span className="text-zinc-600">{row.operator_name ?? '-'}</span>
              ),
            },
            {
              key: 'created_at',
              title: '时间',
              width: '160px',
              render: (row) => (
                <span className="text-zinc-500 text-xs">
                  {formatDateTime(row.created_at)}
                </span>
              ),
            },
          ]}
          data={budgetLogs}
          rowKey={(row) => row.id}
          emptyText="暂无预算变更记录"
        />
      </Card>
    </div>
  );
}
