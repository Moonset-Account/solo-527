import { useState } from 'react';
import { useApiQuery, apiDownload } from '@/lib/hooks';
import { WorkOrderStatusBadge, RiskBadge, ProcessStatusBadge } from '@/components/badges';
import { formatDate, classNames } from '@/lib/format';
import { clsx } from 'clsx';
import { Search, Download, Clock, ClipboardList, FileText, AlertTriangle, Package, Cpu, History } from 'lucide-react';

const categoryColors: Record<string, string> = {
  '工单': 'border-blue-500 bg-blue-50',
  '工序': 'border-sky-500 bg-sky-50',
  '返工': 'border-amber-500 bg-amber-50',
  '物料': 'border-violet-500 bg-violet-50',
  '系统': 'border-slate-400 bg-slate-50',
};
const categoryIcons: Record<string, any> = {
  '工单': ClipboardList,
  '工序': Cpu,
  '返工': AlertTriangle,
  '物料': Package,
  '系统': History,
};
const categoryBgDot: Record<string, string> = {
  '工单': 'bg-blue-500',
  '工序': 'bg-sky-500',
  '返工': 'bg-amber-500',
  '物料': 'bg-violet-500',
  '系统': 'bg-slate-400',
};

export default function TimelinePage() {
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const ordersQ = useApiQuery<any>('timeline-orders', '/work-orders', { pageSize: 50 });
  const timelineQ = useApiQuery<any>(
    ['timeline-detail', selectedId],
    selectedId ? `/timeline/work-order/${selectedId}/timeline-groups` : '/timeline/work-order/0/timeline-groups',
    undefined,
    { enabled: !!selectedId }
  );

  const orders = ordersQ.data?.data || [];
  const data = timelineQ.data?.data;
  const items = data?.timelineItems || [];

  if (!selectedId && orders.length > 0) {
    setTimeout(() => setSelectedId(orders[0].id), 0);
  }

  const handleExport = async () => {
    if (!selectedId) return;
    await apiDownload(`/exports/timeline/${selectedId}`);
  };

  const filteredItems = keyword
    ? items.filter((it: any) => it.title.includes(keyword) || it.description?.includes(keyword) || it.operatorName?.includes(keyword))
    : items;

  const categoryStats: Record<string, number> = data?.stats?.categories || {};

  return (
    <div className="h-full flex">
      <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><ClipboardList size={18} /> 选择工单</h2>
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="搜索工单号..." value={keyword} onChange={e => setKeyword(e.target.value)} />
          </div>
        </div>
        <div className="p-2 space-y-1">
          {orders.map((wo: any) => {
            const active = selectedId === wo.id;
            return (
              <button key={wo.id} onClick={() => setSelectedId(wo.id)} className={clsx(
                'w-full text-left p-3 rounded-lg transition-all',
                active ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50 border border-transparent'
              )}>
                <div className="flex items-center gap-2">
                  <span className={clsx('font-medium text-sm', active ? 'text-brand-700' : 'text-slate-800')}>{wo.orderNo}</span>
                  <div className="ml-auto"><RiskBadge level={wo.deliveryRisk || 'low'} /></div>
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">{wo.productName}</div>
                <div className="mt-2 flex items-center justify-between">
                  <WorkOrderStatusBadge status={wo.status} />
                  <span className="text-[11px] text-slate-400">{formatDate(wo.deliveryDate, false)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Clock size={24} className="text-brand-600" /> 生产时间线</h1>
                {data && <WorkOrderStatusBadge status={data.workOrder.status} />}
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {data?.workOrder?.orderNo} · {data?.workOrder?.productName} · 完整记录工单创建、工序流转、返工处理全过程
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={handleExport} disabled={!selectedId}>
                <Download size={16} /> 导出时间线
              </button>
            </div>
          </div>

          {data?.workOrder && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="card p-4">
                <div className="text-xs text-slate-500">工单状态</div>
                <div className="mt-2"><WorkOrderStatusBadge status={data.workOrder.status} /></div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500">交期风险</div>
                <div className="mt-2"><RiskBadge level={data.workOrder.deliveryRisk || 'low'} /></div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500">交货日期</div>
                <div className="text-lg font-semibold text-slate-800 mt-2">{formatDate(data.workOrder.deliveryDate, false)}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500">事件总数</div>
                <div className="text-lg font-semibold text-slate-800 mt-2">{items.length} 条</div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500">工序总数</div>
                <div className="text-lg font-semibold text-slate-800 mt-2">{data.processes?.length || 0} 道</div>
              </div>
            </div>
          )}

          {Object.keys(categoryStats).length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {Object.entries(categoryStats).map(([cat, cnt]) => {
                const Icon = categoryIcons[cat] || FileText;
                return (
                  <div key={cat} className={clsx('px-4 py-2.5 rounded-xl border-l-4 flex items-center gap-2.5', categoryColors[cat])}>
                    <Icon size={18} className={clsx('text-slate-600')} />
                    <div>
                      <div className="text-xs font-medium text-slate-600">{cat}</div>
                      <div className="text-lg font-bold text-slate-800">{cnt}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {data?.processes?.length > 0 && (
            <div className="card mb-6 overflow-hidden">
              <div className="card-header"><h3 className="font-semibold text-slate-800">工艺流程进度</h3></div>
              <div className="card-body">
                <div className="flex items-stretch gap-1">
                  {data.processes.map((p: any, i: number) => {
                    const isLast = i === data.processes.length - 1;
                    const complete = p.status === 'completed';
                    const active = p.status === 'in_progress';
                    const rework = p.status === 'rework';
                    return (
                      <div key={p.id} className="flex-1 min-w-0 flex items-center">
                        <div className="flex-1 min-w-0">
                          <div className={clsx(
                            'rounded-lg p-3 border-2 text-center',
                            complete ? 'bg-brand-50 border-brand-300' :
                            active ? 'bg-blue-50 border-blue-400' :
                            rework ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200'
                          )}>
                            <div className={clsx(
                              'w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-1.5',
                              complete ? 'bg-brand-500 text-white' :
                              active ? 'bg-blue-500 text-white' :
                              rework ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                            )}>{p.sequence || i + 1}</div>
                            <div className="text-xs font-medium text-slate-700 truncate">{p.processName}</div>
                            <div className="mt-1.5 flex justify-center"><ProcessStatusBadge status={p.status} /></div>
                          </div>
                        </div>
                        {!isLast && (
                          <div className={clsx('w-4 h-1 flex-shrink-0', complete ? 'bg-brand-400' : 'bg-slate-200')} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="card-header"><h3 className="font-semibold text-slate-800">完整时间线</h3></div>
            <div className="card-body">
              {timelineQ.isLoading && <div className="py-12 text-center text-slate-400">加载中...</div>}
              {!timelineQ.isLoading && items.length === 0 && <div className="py-12 text-center text-slate-400">暂无时间线记录</div>}
              <div className="relative pl-8">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-slate-100" />
                <div className="space-y-5">
                  {filteredItems.map((item: any) => {
                    const Icon = categoryIcons[item.category] || FileText;
                    return (
                      <div key={item.id} className="relative">
                        <div className={clsx(
                          'absolute -left-[30px] top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm',
                          categoryBgDot[item.category]
                        )}>
                          <Icon size={12} className="text-white" />
                        </div>
                        <div className={clsx(
                          'rounded-xl border border-l-4 p-4 shadow-sm',
                          categoryColors[item.category]
                        )}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={clsx('badge', 'bg-white border')}>
                                  {item.category}
                                </span>
                                {item.sequence !== undefined && (
                                  <span className="badge bg-white border">工序 #{item.sequence}</span>
                                )}
                                {item.status && (
                                  <span className="badge bg-white border text-slate-700">{item.status}</span>
                                )}
                              </div>
                              <div className="font-semibold text-slate-800 mt-1.5 text-[15px]">{item.title}</div>
                              {item.description && (
                                <div className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{item.description}</div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-medium text-slate-700">{formatDate(item.time)}</div>
                              {item.operatorName && (
                                <div className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-[10px] font-semibold">
                                    {item.operatorName.slice(0, 1)}
                                  </div>
                                  {item.operatorName}
                                  {item.operatorRole && <span className="text-slate-400">· {item.operatorRole}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
