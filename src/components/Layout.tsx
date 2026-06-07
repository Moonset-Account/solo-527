import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Drill, Clock, BarChart3, Download, Database, Clock as ClockIcon, PanelLeftClose, PanelLeftOpen, RotateCcw } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import FilterSelect from '@/components/FilterSelect'

const productOptions = [
  { value: 'P001', label: '智能手表Pro' },
  { value: 'P002', label: '无线耳机Max' },
  { value: 'P003', label: '运动鞋轻量版' },
  { value: 'P004', label: '纯棉T恤经典款' },
  { value: 'P005', label: '保温杯500ml' },
  { value: 'P006', label: '蓝牙音箱Mini' },
  { value: 'P007', label: '瑜伽垫加厚款' },
  { value: 'P008', label: '真皮钱包' },
  { value: 'P009', label: '儿童积木套装' },
  { value: 'P010', label: '电动牙刷' },
]

const shopOptions = [
  { value: 'S001', label: '旗舰店' },
  { value: 'S002', label: '专营店A' },
  { value: 'S003', label: '专营店B' },
  { value: 'S004', label: '专营店C' },
  { value: 'S005', label: '海外店' },
]

const reasonOptions = [
  { value: 'R001', label: '质量问题' },
  { value: 'R002', label: '物流问题' },
  { value: 'R003', label: '描述不符' },
  { value: 'R004', label: '主观原因' },
  { value: 'R005', label: '破损' },
  { value: 'R006', label: '瑕疵' },
  { value: 'R007', label: '延迟配送' },
  { value: 'R008', label: '尺寸不符' },
]

const warehouseOptions = [
  { value: 'W001', label: '华东仓' },
  { value: 'W002', label: '华南仓' },
  { value: 'W003', label: '华北仓' },
  { value: 'W004', label: '西南仓' },
  { value: 'W005', label: '东北仓' },
]

const logisticsOptions = [
  { value: 'L001', label: '顺丰速运' },
  { value: 'L002', label: '中通快递' },
  { value: 'L003', label: '圆通速递' },
  { value: 'L004', label: '韵达快递' },
  { value: 'L005', label: '京东物流' },
]

const navLinks = [
  { to: '/', label: '工作台', icon: LayoutDashboard },
  { to: '/drilldown/reason', label: '原因下钻', icon: Drill },
  { to: '/drilldown/cycle', label: '周期分析', icon: Clock },
  { to: '/drilldown/product', label: '商品排行', icon: BarChart3 },
  { to: '/exports', label: '导出管理', icon: Download },
  { to: '/data-management', label: '数据管理', icon: Database },
]

function formatDate(d: string) {
  if (!d) return ''
  return d.slice(0, 10)
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const { productIds, shopIds, reasonIds, warehouseIds, logisticsIds, dateRange, setFilter, resetFilter, dataUpdateTime, sampleSize } = useFilterStore()

  const setQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    setFilter('dateRange', [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)])
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 min-w-[1280px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Noto Sans SC", "Segoe UI", Helvetica, Arial, sans-serif' }}>
      <header className="h-12 bg-slate-800 flex items-center justify-between px-4 shrink-0 border-b border-slate-700">
        <div className="flex items-center gap-6">
          <span className="text-white font-bold text-base tracking-wide">退货分析工作台</span>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <link.icon size={15} strokeWidth={2} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">数据更新: {formatDate(dataUpdateTime)}</span>
          <span className="ml-2 px-2 py-0.5 rounded text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            已同步
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 ${
            sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">筛选条件</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <PanelLeftClose size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-400 mb-1">日期范围</label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={dateRange[0]}
                  onChange={(e) => setFilter('dateRange', [e.target.value, dateRange[1]])}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-500 self-center">至</span>
                <input
                  type="date"
                  value={dateRange[1]}
                  onChange={(e) => setFilter('dateRange', [dateRange[0], e.target.value])}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-1.5">
              {[
                { label: '近7天', days: 7 },
                { label: '近30天', days: 30 },
                { label: '近90天', days: 90 },
              ].map((p) => (
                <button
                  key={p.days}
                  onClick={() => setQuickRange(p.days)}
                  className="flex-1 py-1 text-xs rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <FilterSelect label="商品" options={productOptions} selected={productIds} onChange={(v) => setFilter('productIds', v)} />
            <FilterSelect label="店铺" options={shopOptions} selected={shopIds} onChange={(v) => setFilter('shopIds', v)} />
            <FilterSelect label="退货原因" options={reasonOptions} selected={reasonIds} onChange={(v) => setFilter('reasonIds', v)} />
            <FilterSelect label="仓库" options={warehouseOptions} selected={warehouseIds} onChange={(v) => setFilter('warehouseIds', v)} />
            <FilterSelect label="物流商" options={logisticsOptions} selected={logisticsIds} onChange={(v) => setFilter('logisticsIds', v)} />

            <button
              onClick={resetFilter}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400 transition-colors"
            >
              <RotateCcw size={14} />
              重置筛选
            </button>
          </div>

          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>当前样本量</span>
              <span className="text-emerald-400 font-medium">{sampleSize.toLocaleString()}</span>
            </div>
          </div>
        </aside>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-14 z-20 bg-slate-800 text-slate-300 p-1.5 rounded-r-md border border-l-0 border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <PanelLeftOpen size={14} />
          </button>
        )}

        <main className="flex-1 overflow-y-auto custom-scrollbar p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
