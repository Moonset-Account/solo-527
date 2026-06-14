import { useApiQuery } from '@/lib/hooks';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Package, ClipboardList, Truck, AlertCircle, ChevronRight, Layers } from 'lucide-react';
import { WorkOrderStatusBadge, RiskBadge, KittingStatusBadge } from '@/components/badges';
import { formatDate, formatDaysDiff, classNames } from '@/lib/format';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<any>;
  iconColor?: string;
  trend?: 'up' | 'down' | 'warn';
}
function StatCard({ title, value, hint, icon: Icon, iconColor = 'bg-brand-500', trend }: StatCardProps) {
  return (
    <div className="card p-5 flex gap-4">
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0', iconColor)}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="flex items-end gap-2 mt-1">
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          {trend && (
            <div className={clsx(
              'text-xs font-medium mb-1',
              trend === 'up' ? 'text-brand-600' : trend === 'warn' ? 'text-amber-600' : 'text-red-600'
            )}>
              {hint}
            </div>
          )}
        </div>
        {!trend && hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const summaryQ = useApiQuery<any>('dashboard-summary', '/dashboard/summary');
  const boardQ = useApiQuery<any>('kitting-board', '/dashboard/kitting-board');

  const summary = summaryQ.data?.data;
  const board = boardQ.data?.data;
  const loading = summaryQ.isLoading || boardQ.isLoading;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">物料齐套看板</h1>
        <p className="text-slate-500 text-sm mt-1">小批量工单物料齐套状态与交期风险实时监控</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="工单总数" value={summary.workOrders.total} hint={`生产中 ${summary.workOrders.inProgress} | 待排产 ${summary.workOrders.pending}`} icon={ClipboardList} iconColor="bg-blue-500" />
          <StatCard title="交期高风险" value={summary.workOrders.highRiskCount} hint={`严重 ${summary.workOrders.deliveryRiskByLevel?.critical || 0} | 高 ${summary.workOrders.deliveryRiskByLevel?.high || 0}`} icon={AlertTriangle} iconColor="bg-red-500" trend="warn" />
          <StatCard title="物料齐套率" value={`${summary.kitCheck.kittedRate}%`} hint={`齐套 ${summary.kitCheck.kittedCount} / 共 ${summary.kitCheck.totalMaterialLines} 项`} icon={Package} iconColor="bg-brand-500" />
          <StatCard title="缺料条目" value={summary.kitCheck.shortageCount} hint={`待处理返工超时 ${summary.reworks.timeoutRisk}`} icon={AlertCircle} iconColor="bg-amber-500" trend="down" />
        </div>
      )}

      {board?.summary && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2"><Layers size={16} className="text-slate-500" /><span className="text-sm text-slate-600">齐套统计：</span></div>
            {(['complete', 'alternative', 'partial', 'shortage'] as const).map((k) => (
              <div key={k} className="flex items-center gap-2">
                <KittingStatusBadge status={k} />
                <span className="text-sm font-semibold text-slate-700">{board.summary[k]}</span>
                <span className="text-xs text-slate-400">单</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">工单齐套排期表</h2>
            <p className="text-xs text-slate-500 mt-0.5">按优先级和交期排序，点击行查看详情</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate({ to: '/work-orders' })}>
            查看全部 <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="table">
            <thead>
              <tr>
                <th>工单号 / 产品</th>
                <th>状态</th>
                <th>齐套状态</th>
                <th>物料进度</th>
                <th>工序进度</th>
                <th>交期风险</th>
                <th>交货日期</th>
                <th>关键缺料</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-8 text-slate-400">加载中...</td></tr>}
              {!loading && !board?.rows?.length && <tr><td colSpan={8} className="text-center py-8 text-slate-400">暂无数据</td></tr>}
              {board?.rows?.map((wo: any) => {
                const shortageMats = wo.materials.filter((m: any) => m.shortage > 0 && !m.canUseAlt);
                const altMats = wo.materials.filter((m: any) => m.shortage > 0 && m.canUseAlt);
                return (
                  <tr key={wo.id} className="cursor-pointer" onClick={() => navigate({ to: '/work-orders', search: { id: wo.id } as any })}>
                    <td>
                      <div className="font-semibold text-slate-800">{wo.orderNo}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{wo.productName} × {wo.quantity}{wo.unit}</div>
                      {wo.customer && <div className="text-[11px] text-slate-400 mt-0.5">客户：{wo.customer}</div>}
                    </td>
                    <td><WorkOrderStatusBadge status={wo.status as any} /></td>
                    <td><KittingStatusBadge status={wo.kittingStatus} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={clsx(
                            'h-full rounded-full',
                            wo.kittedRate === 100 ? 'bg-brand-500' : wo.kittedRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          )} style={{ width: `${wo.kittedRate}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-12">{wo.kittedItems}/{wo.totalItems}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${wo.processCount ? (wo.completedProcesses / wo.processCount) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-12">{wo.completedProcesses}/{wo.processCount}</span>
                      </div>
                    </td>
                    <td><RiskBadge level={wo.deliveryRisk || 'low'} /></td>
                    <td>
                      <div className={clsx(
                        'font-medium text-sm',
                        wo.deliveryStatus === 'critical' ? 'text-red-600' : wo.deliveryStatus === 'warning' ? 'text-amber-600' : 'text-slate-700'
                      )}>{formatDate(wo.deliveryDate, false)}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{formatDaysDiff(wo.deliveryDate)}</div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {shortageMats.slice(0, 2).map((m: any) => (
                          <div key={m.materialId} className="text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="text-slate-700">{m.materialCode}</span>
                            <span className="text-red-600">缺{m.shortage}</span>
                          </div>
                        ))}
                        {altMats.slice(0, 1).map((m: any) => (
                          <div key={m.materialId} className="text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                            <span className="text-slate-700">{m.materialCode}</span>
                            <span className="text-violet-600">可替代</span>
                          </div>
                        ))}
                        {shortageMats.length + altMats.length === 0 && (
                          <div className="text-xs text-brand-600 flex items-center gap-1">
                            <Truck size={12} /> 物料准备就绪
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {summary?.workOrders?.upcomingDeliveries?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card overflow-hidden">
            <div className="card-header"><h2 className="font-semibold text-slate-800">未来 7 天交期提醒</h2></div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {summary.workOrders.upcomingDeliveries.map((wo: any) => (
                <div key={wo.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer" onClick={() => navigate({ to: '/work-orders' })}>
                  <div className={clsx('w-2 h-10 rounded-full flex-shrink-0', riskDotColors[(wo.deliveryRisk as any) || 'low'])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{wo.orderNo}</span>
                      <RiskBadge level={wo.deliveryRisk || 'low'} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{wo.productName}</div>
                  </div>
                  <div className="text-right">
                    <div className={clsx(
                      'text-sm font-semibold',
                      wo.deliveryRisk === 'critical' ? 'text-red-600' : wo.deliveryRisk === 'high' ? 'text-orange-600' : 'text-slate-700'
                    )}>{formatDaysDiff(wo.deliveryDate)}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(wo.deliveryDate, false)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header"><h2 className="font-semibold text-slate-800">返工超时风险</h2></div>
            <div className="p-5 grid grid-cols-3 gap-3">
              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-brand-600">{summary.reworks.safe}</div>
                <div className="text-xs text-brand-700 mt-1">处理中</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{summary.reworks.warningRisk}</div>
                <div className="text-xs text-amber-700 mt-1">临近超时</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{summary.reworks.timeoutRisk}</div>
                <div className="text-xs text-red-700 mt-1">已超时</div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button className="btn-warning w-full" onClick={() => navigate({ to: '/reworks' })}>
                前往返工管理 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
