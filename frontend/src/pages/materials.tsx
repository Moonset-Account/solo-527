import { useState } from 'react';
import { useApiQuery } from '@/lib/hooks';
import { MaterialStatusBadge } from '@/components/badges';
import { formatDate } from '@/lib/format';
import { clsx } from 'clsx';
import { Search, Package, AlertTriangle, ArrowRightLeft, Truck } from 'lucide-react';

export default function MaterialsPage() {
  const [shortageOnly, setShortageOnly] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'inventory' | 'shortage'>('shortage');

  const listQ = useApiQuery<any>(
    ['materials-list', shortageOnly, keyword],
    '/materials',
    { shortage: shortageOnly ? 'true' : '', keyword, pageSize: 100 }
  );
  const shortageQ = useApiQuery<any>('materials-shortage', '/materials/shortage-summary');

  const list = listQ.data?.data || [];
  const shortage = shortageQ.data?.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">物料与缺料管理</h1>
          <p className="text-slate-500 text-sm mt-1">实时库存监控与缺料跟踪</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('shortage')} className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
          tab === 'shortage' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800')}>
          <AlertTriangle size={15} /> 缺料汇总
        </button>
        <button onClick={() => setTab('inventory')} className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
          tab === 'inventory' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800')}>
          <Package size={15} /> 物料库存
        </button>
      </div>

      {tab === 'shortage' && (
        <div className="space-y-6">
          {shortage && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-5 border-l-4 border-l-red-500">
                <div className="text-xs text-slate-500">缺料条目总数</div>
                <div className="text-3xl font-bold text-red-600 mt-2">{shortage.summary?.totalShortageItems}</div>
              </div>
              <div className="card p-5 border-l-4 border-l-amber-500">
                <div className="text-xs text-slate-500">受影响工单</div>
                <div className="text-3xl font-bold text-amber-600 mt-2">{shortage.summary?.affectedWorkOrders}</div>
              </div>
              <div className="card p-5 border-l-4 border-l-violet-500">
                <div className="text-xs text-slate-500">缺料物料种类</div>
                <div className="text-3xl font-bold text-violet-600 mt-2">{shortage.summary?.totalMaterialTypes}</div>
              </div>
              <div className="card p-5 border-l-4 border-l-rose-500">
                <div className="text-xs text-slate-500">5天内交期高风险</div>
                <div className="text-3xl font-bold text-rose-600 mt-2">{shortage.summary?.highRiskItems}</div>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="card-header"><h2 className="font-semibold text-slate-800 flex items-center gap-2"><Truck size={18} className="text-amber-600" /> 按工单缺料明细</h2></div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr>
                  <th>工单号 / 产品</th><th>物料编码 / 名称</th><th>需求</th><th>已分配</th>
                  <th>缺料量</th><th>可用库存</th><th>供应商</th><th>预计到货</th><th>交期</th><th>工单状态</th>
                </tr></thead>
                <tbody>
                  {shortageQ.isLoading && <tr><td colSpan={10} className="py-8 text-center text-slate-400">加载中...</td></tr>}
                  {!shortageQ.isLoading && !shortage?.byWorkOrder?.length && <tr><td colSpan={10} className="py-8 text-center text-slate-400">暂无缺料数据</td></tr>}
                  {shortage?.byWorkOrder?.map((item: any) => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-semibold text-slate-800">{item.orderNo}</div>
                        <div className="text-xs text-slate-500">{item.productName}</div>
                      </td>
                      <td>
                        <div className="font-medium">{item.materialCode}</div>
                        <div className="text-xs text-slate-500">{item.materialName}</div>
                      </td>
                      <td>{item.required}</td>
                      <td>{item.allocated}</td>
                      <td className="text-red-600 font-semibold">{item.shortage}</td>
                      <td className={clsx(item.available <= 0 ? 'text-red-600' : '')}>{item.available}</td>
                      <td className="text-slate-600 text-xs">{item.supplier || '-'}</td>
                      <td>{formatDate(item.latestDeliveryDate, false)}</td>
                      <td className="text-xs">
                        <div className="font-medium text-slate-700">{formatDate(item.deliveryDate, false)}</div>
                      </td>
                      <td>
                        <span className="badge bg-sky-100 text-sky-700">{item.orderStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header"><h2 className="font-semibold text-slate-800 flex items-center gap-2"><Package size={18} className="text-violet-600" /> 按物料汇总</h2></div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr>
                  <th>物料编码 / 名称</th><th>规格</th><th>当前库存</th><th>已预留</th><th>可用</th>
                  <th>安全库存</th><th>累计缺料</th><th>影响工单数</th><th>状态</th>
                </tr></thead>
                <tbody>
                  {shortage?.byMaterial?.map((row: any) => (
                    <tr key={row.material.id}>
                      <td>
                        <div className="font-semibold text-slate-800">{row.material.materialCode}</div>
                        <div className="text-xs text-slate-500">{row.material.materialName}</div>
                      </td>
                      <td className="text-xs text-slate-600 max-w-[200px] truncate">{row.material.specification || '-'}</td>
                      <td>{row.material.currentStock}</td>
                      <td>{row.material.reservedStock}</td>
                      <td className={clsx((row.material.currentStock - row.material.reservedStock) < 0 ? 'text-red-600 font-semibold' : '')}>
                        {row.material.currentStock - row.material.reservedStock}
                      </td>
                      <td>{row.material.safetyStock}</td>
                      <td className="text-red-600 font-semibold">{row.shortageTotal}</td>
                      <td><span className="badge bg-amber-100 text-amber-700">{row.affectedOrders}</span></td>
                      <td><MaterialStatusBadge status={row.material.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="card overflow-hidden">
          <div className="card-header flex flex-wrap items-center gap-3 justify-between">
            <h2 className="font-semibold text-slate-800">物料库存列表</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9 w-64" placeholder="搜索物料编码/名称" value={keyword} onChange={e => setKeyword(e.target.value)} />
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={shortageOnly} onChange={e => setShortageOnly(e.target.checked)} className="rounded text-brand-600" />
                仅显示缺料
              </label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr>
                <th>物料编码</th><th>名称</th><th>规格</th><th>单位</th>
                <th>当前库存</th><th>已预留</th><th>可用库存</th><th>安全库存</th>
                <th>状态</th><th>低于安全线</th><th>供应商</th><th>到货</th>
              </tr></thead>
              <tbody>
                {listQ.isLoading && <tr><td colSpan={12} className="py-8 text-center text-slate-400">加载中...</td></tr>}
                {list.map((m: any) => (
                  <tr key={m.id}>
                    <td className="font-medium text-slate-800">{m.materialCode}</td>
                    <td>{m.materialName}</td>
                    <td className="text-xs text-slate-500 max-w-[200px] truncate">{m.specification || '-'}</td>
                    <td>{m.unit}</td>
                    <td>{m.currentStock}</td>
                    <td>{m.reservedStock}</td>
                    <td className={clsx(m.availableStock < 0 ? 'text-red-600 font-medium' : '')}>{m.availableStock}</td>
                    <td>{m.safetyStock}</td>
                    <td><MaterialStatusBadge status={m.status} /></td>
                    <td>
                      {m.isBelowSafety ? (
                        <span className="badge bg-red-50 text-red-600 border border-red-100">差 {m.shortageQuantity}</span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="text-xs text-slate-600">{m.supplier || '-'}</td>
                    <td>{formatDate(m.latestDeliveryDate, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
