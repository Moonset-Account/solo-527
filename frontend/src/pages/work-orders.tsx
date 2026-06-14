import { useMemo, useState } from 'react';
import { useApiQuery, apiPost, apiPut, apiDownload } from '@/lib/hooks';
import { useSearch } from '@tanstack/react-router';
import { WorkOrderStatusBadge, RiskBadge, ProcessStatusBadge, KittingStatusBadge } from '@/components/badges';
import { formatDate } from '@/lib/format';
import { clsx } from 'clsx';
import { Search, Plus, Filter, Download, X, Play, CheckCircle2, FileText, ArrowLeft, Package, AlertCircle, ArrowRightLeft, History } from 'lucide-react';

interface WorkOrderSearch {
  id?: number;
}

export default function WorkOrdersPage() {
  const search = useSearch({ from: '/_layout/work-orders' }) as WorkOrderSearch;
  const [selectedId, setSelectedId] = useState<number | null>(search.id || null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', keyword: '', risk: '' });

  const listQ = useApiQuery<any>(
    ['work-orders-list', page, filters.status, filters.keyword, filters.risk],
    '/work-orders',
    { page, pageSize: 10, ...filters }
  );
  const detailQ = useApiQuery<any>(
    ['work-order-detail', selectedId],
    selectedId ? `/work-orders/${selectedId}` : '/work-orders/0',
    undefined,
    { enabled: !!selectedId }
  );
  const kitQ = useApiQuery<any>(
    ['work-order-kit', selectedId],
    selectedId ? `/work-orders/${selectedId}/kit-check` : '/work-orders/0/kit-check',
    undefined,
    { enabled: !!selectedId }
  );

  const listData = listQ.data?.data || [];
  const total = listQ.data?.total || 0;
  const detail = detailQ.data?.data;
  const kitData = kitQ.data?.data;

  const handleStartProcess = async (procId: number) => {
    await apiPost(`/processes/${procId}/start`);
    listQ.refetch(); detailQ.refetch(); kitQ.refetch();
  };
  const handleCompleteProcess = async (procId: number) => {
    await apiPost(`/processes/${procId}/complete`);
    listQ.refetch(); detailQ.refetch(); kitQ.refetch();
  };
  const handleApplyAlternative = async (workOrderMaterialId: number, alternativeMaterialId: number, qty: number) => {
    await apiPost('/materials/alternatives/apply', { workOrderMaterialId, alternativeMaterialId, quantity: qty });
    kitQ.refetch(); listQ.refetch();
  };
  const handleExport = async () => {
    await apiDownload('/exports/work-orders', { filters }, '工单导出.xlsx');
  };
  const handleExportTimeline = async () => {
    if (!selectedId) return;
    await apiDownload(`/exports/timeline/${selectedId}`, undefined, '时间线导出.xlsx');
  };

  return (
    <div className="h-full flex">
      <div className={clsx('transition-all duration-200 overflow-hidden', selectedId ? 'w-[480px] flex-shrink-0 border-r border-slate-200 bg-white' : 'flex-1')}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">工单管理</h1>
              <p className="text-xs text-slate-500 mt-0.5">共 {total} 条工单记录</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={handleExport}><Download size={16} /> 导出</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="搜索工单号/产品/客户..." value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
            </div>
            <select className="input w-auto" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">全部状态</option>
              <option value="pending">待排产</option>
              <option value="material_ready">物料齐套</option>
              <option value="in_progress">生产中</option>
              <option value="completed">已完成</option>
              <option value="delayed">已延期</option>
            </select>
            <select className="input w-auto" value={filters.risk} onChange={e => setFilters({ ...filters, risk: e.target.value })}>
              <option value="">全部风险</option>
              <option value="low">低风险</option>
              <option value="medium">中风险</option>
              <option value="high">高风险</option>
              <option value="critical">严重风险</option>
            </select>
          </div>
          <div className="space-y-2">
            {listQ.isLoading && <div className="py-8 text-center text-slate-400 text-sm">加载中...</div>}
            {!listQ.isLoading && !listData.length && <div className="py-8 text-center text-slate-400 text-sm">暂无数据</div>}
            {listData.map((wo: any) => {
              const active = selectedId === wo.id;
              return (
                <div key={wo.id} onClick={() => setSelectedId(wo.id)} className={clsx(
                  'p-4 rounded-xl border cursor-pointer transition-all',
                  active ? 'border-brand-400 bg-brand-50/50 shadow-sm ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{wo.orderNo}</span>
                        <WorkOrderStatusBadge status={wo.status} />
                      </div>
                      <div className="text-sm text-slate-600 mt-1 truncate">{wo.productName} × {wo.quantity}{wo.unit}</div>
                      {wo.customer && <div className="text-xs text-slate-400 mt-0.5">客户：{wo.customer}</div>}
                    </div>
                    <RiskBadge level={wo.deliveryRisk || 'low'} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[11px] text-slate-500">物料齐套</div>
                      <div className="text-sm font-medium text-slate-700 mt-0.5">{wo.materialSummary?.kittedRate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">工序进度</div>
                      <div className="text-sm font-medium text-slate-700 mt-0.5">{wo.processSummary?.completedRate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">交货日期</div>
                      <div className="text-sm font-medium text-slate-700 mt-0.5">{formatDate(wo.deliveryDate, false)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {total > 10 && (
              <div className="flex items-center justify-between pt-3">
                <div className="text-xs text-slate-500">第 {page} / {Math.ceil(total / 10)} 页</div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs py-1.5" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
                  <button className="btn-secondary text-xs py-1.5" onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total}>下一页</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedId && (
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button className="btn-ghost p-2" onClick={() => setSelectedId(null)}><ArrowLeft size={18} /></button>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{detail?.orderNo || '工单详情'}</h2>
                  <p className="text-sm text-slate-500">{detail?.productName} · 编号 {detail?.productCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary" onClick={handleExportTimeline}><History size={16} /> 导出时间线</button>
              </div>
            </div>

            {detail && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                  <div className="text-xs text-slate-500">订单状态</div>
                  <div className="mt-2"><WorkOrderStatusBadge status={detail.status} /></div>
                </div>
                <div className="card p-4">
                  <div className="text-xs text-slate-500">数量 / 单位</div>
                  <div className="mt-2 text-lg font-semibold text-slate-800">{detail.quantity} <span className="text-sm font-normal text-slate-500">{detail.unit}</span></div>
                </div>
                <div className="card p-4">
                  <div className="text-xs text-slate-500">交期风险</div>
                  <div className="mt-2"><RiskBadge level={detail.deliveryRisk || 'low'} /></div>
                </div>
                <div className="card p-4">
                  <div className="text-xs text-slate-500">交货日期</div>
                  <div className="mt-2 text-lg font-semibold text-slate-800">{formatDate(detail.deliveryDate, false)}</div>
                </div>
              </div>
            )}

            <div className="card mb-6 overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Package size={18} className="text-brand-600" /> 物料齐套检查</h3>
                {kitData && <KittingStatusBadge status={kitData.summary?.isAllKitted ? 'complete' : kitData.summary?.shortageItems > 0 ? 'shortage' : 'partial'} />}
              </div>
              {kitQ.isLoading && <div className="card-body text-center text-slate-400 text-sm">加载中...</div>}
              {kitData && (
                <>
                  <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-200 grid grid-cols-4 gap-4 text-sm">
                    <div>物料项：<span className="font-semibold text-slate-800">{kitData.summary?.totalItems}</span></div>
                    <div>已齐套：<span className="font-semibold text-brand-600">{kitData.summary?.kittedItems}</span></div>
                    <div>缺料：<span className="font-semibold text-red-600">{kitData.summary?.shortageItems}</span></div>
                    <div>可替代：<span className="font-semibold text-violet-600">{kitData.summary?.altCoverItems}</span></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead><tr>
                        <th>物料编码 / 名称</th><th>规格</th><th>需求</th><th>已分配</th>
                        <th>缺料量</th><th>可用库存</th><th>状态</th><th>操作</th>
                      </tr></thead>
                      <tbody>
                        {kitData.details?.map((m: any) => (
                          <tr key={m.id}>
                            <td>
                              <div className="font-medium text-slate-800">{m.materialCode}</div>
                              <div className="text-xs text-slate-500">{m.materialName}</div>
                            </td>
                            <td className="text-slate-600 text-xs max-w-[200px] truncate">{m.specification || '-'}</td>
                            <td className="font-medium">{m.required}</td>
                            <td>{m.allocated}</td>
                            <td className={clsx(m.shortage > 0 ? 'text-red-600 font-medium' : 'text-slate-500')}>{m.shortage || 0}</td>
                            <td>{m.availableStock}</td>
                            <td>
                              <span className={clsx('badge',
                                m.isKitted ? 'bg-brand-100 text-brand-700' :
                                m.status === '可分配' ? 'bg-amber-100 text-amber-700' :
                                m.status.includes('替代料') ? 'bg-violet-100 text-violet-700' : 'bg-red-100 text-red-700')}>{m.status}</span>
                            </td>
                            <td>
                              {!m.isKitted && m.hasAlternative && m.shortage > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {m.alternatives.map((a: any) => (
                                    <button key={a.id} className="btn-ghost text-xs py-1 px-2 text-violet-600 hover:bg-violet-50"
                                      onClick={() => handleApplyAlternative(m.id, a.id, m.shortage)}>
                                      <ArrowRightLeft size={12} /> {a.materialCode}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> 工艺流程</h3>
                <div className="text-xs text-slate-500">{detail?.processes?.length} 道工序</div>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr>
                    <th>序号</th><th>工序名称</th><th>设备</th><th>负责人</th>
                    <th>状态</th><th>计划工时</th><th>实际开始</th><th>实际完成</th><th>返工</th><th>操作</th>
                  </tr></thead>
                  <tbody>
                    {detail?.processes?.map((p: any, idx: number) => (
                      <tr key={p.id}>
                        <td><span className="w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold flex items-center justify-center">{p.sequence || idx + 1}</span></td>
                        <td className="font-medium text-slate-800">{p.processName}</td>
                        <td className="text-slate-600">{p.equipment || '-'}</td>
                        <td className="text-slate-600">{p.assignedUser?.realName || '-'}</td>
                        <td><ProcessStatusBadge status={p.status} /></td>
                        <td className="text-slate-600">{p.plannedDurationHours || '-'} H</td>
                        <td>{formatDate(p.actualStartAt)}</td>
                        <td>{formatDate(p.actualEndAt)}</td>
                        <td className={clsx(p.reworkCount > 0 ? 'text-amber-600 font-medium' : 'text-slate-400')}>{p.reworkCount || 0}</td>
                        <td>
                          <div className="flex gap-1">
                            {(p.status === 'pending' || p.status === 'rework') && (
                              <button className="btn-ghost text-xs py-1 text-brand-600 hover:bg-brand-50" onClick={() => handleStartProcess(p.id)}>
                                <Play size={12} /> 开始
                              </button>
                            )}
                            {p.status === 'in_progress' && (
                              <button className="btn-ghost text-xs py-1 text-brand-600 hover:bg-brand-50" onClick={() => handleCompleteProcess(p.id)}>
                                <CheckCircle2 size={12} /> 完成
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
