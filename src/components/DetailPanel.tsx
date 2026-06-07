import { useState, useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

type SortKey = 'name' | 'availableBikesForDispatch' | 'inflow' | 'outflow' | 'netFlow' | 'repairRatio'
type SortDir = 'asc' | 'desc'

type DispatchSortKey = 'id' | 'bikeCount' | 'dispatchTime' | 'completedTime' | 'status'
type DispatchSortDir = 'asc' | 'desc'

const PAGE_SIZE = 8

function NullSafe({ value, suffix }: { value: number | string | null | undefined; suffix?: string }) {
  if (value == null || value === '') return <span className="text-white/30">—</span>
  return <>{suffix ? `${value}${suffix}` : value}</>
}

export default function DetailPanel() {
  const filteredStations = useDataStore((s) => s.filteredStations)
  const filteredDispatches = useDataStore((s) => s.filteredDispatches)
  const stations = useDataStore((s) => s.stations)

  const [stationSortKey, setStationSortKey] = useState<SortKey>('name')
  const [stationSortDir, setStationSortDir] = useState<SortDir>('asc')
  const [stationPage, setStationPage] = useState(0)

  const [dispatchSortKey, setDispatchSortKey] = useState<DispatchSortKey>('dispatchTime')
  const [dispatchSortDir, setDispatchSortDir] = useState<DispatchSortDir>('desc')
  const [dispatchPage, setDispatchPage] = useState(0)

  const [activeTab, setActiveTab] = useState<'stations' | 'dispatches'>('stations')

  const stationNameMap = useMemo(() => {
    const m = new Map<string, string>()
    stations.forEach((s) => m.set(s.id, s.name))
    return m
  }, [stations])

  const sortedStations = useMemo(() => {
    const arr = [...filteredStations]
    arr.sort((a, b) => {
      const aVal = a[stationSortKey]
      const bVal = b[stationSortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return stationSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return stationSortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
    return arr
  }, [filteredStations, stationSortKey, stationSortDir])

  const paginatedStations = useMemo(() => {
    const start = stationPage * PAGE_SIZE
    return sortedStations.slice(start, start + PAGE_SIZE)
  }, [sortedStations, stationPage])

  const stationTotalPages = Math.max(1, Math.ceil(filteredStations.length / PAGE_SIZE))

  const sortedDispatches = useMemo(() => {
    const arr = [...filteredDispatches]
    arr.sort((a, b) => {
      const aVal = a[dispatchSortKey]
      const bVal = b[dispatchSortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return dispatchSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return dispatchSortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
    return arr
  }, [filteredDispatches, dispatchSortKey, dispatchSortDir])

  const paginatedDispatches = useMemo(() => {
    const start = dispatchPage * PAGE_SIZE
    return sortedDispatches.slice(start, start + PAGE_SIZE)
  }, [sortedDispatches, dispatchPage])

  const dispatchTotalPages = Math.max(1, Math.ceil(filteredDispatches.length / PAGE_SIZE))

  function handleStationSort(key: SortKey) {
    if (stationSortKey === key) {
      setStationSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setStationSortKey(key)
      setStationSortDir('asc')
    }
    setStationPage(0)
  }

  function handleDispatchSort(key: DispatchSortKey) {
    if (dispatchSortKey === key) {
      setDispatchSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setDispatchSortKey(key)
      setDispatchSortDir('asc')
    }
    setDispatchPage(0)
  }

  function SortIcon({ active, dir }: { active: boolean; dir: string }) {
    if (!active) return <ChevronDown className="w-3 h-3 opacity-0" />
    return dir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-[#00e5c7]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#00e5c7]" />
    )
  }

  const statusLabel: Record<string, string> = {
    completed: '已完成',
    in_progress: '进行中',
    pending: '待处理',
  }
  const statusColor: Record<string, string> = {
    completed: 'text-emerald-400',
    in_progress: 'text-[#00e5c7]',
    pending: 'text-[#ff9f43]',
  }

  if (filteredStations.length === 0 && filteredDispatches.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        暂无数据
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('stations')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === 'stations'
              ? 'bg-[#00e5c7]/15 text-[#00e5c7]'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          站点明细 ({filteredStations.length})
        </button>
        <button
          onClick={() => setActiveTab('dispatches')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === 'dispatches'
              ? 'bg-[#00e5c7]/15 text-[#00e5c7]'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          调度记录 ({filteredDispatches.length})
        </button>
      </div>

      {activeTab === 'stations' && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {([
                    ['name', '站点'],
                    ['availableBikesForDispatch', '可调度'],
                    ['inflow', '流入'],
                    ['outflow', '流出'],
                    ['netFlow', '净流量'],
                    ['repairRatio', '维修比例'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleStationSort(key)}
                      className="text-left px-3 py-2 text-white/50 font-medium cursor-pointer hover:text-white/70 select-none"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon active={stationSortKey === key} dir={stationSortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedStations.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="text-right px-3 py-2 font-data">
                      <NullSafe value={s.availableBikesForDispatch} />
                    </td>
                    <td className="text-right px-3 py-2 font-data text-[#00e5c7]">
                      <NullSafe value={s.inflow} />
                    </td>
                    <td className="text-right px-3 py-2 font-data text-[#ff9f43]">
                      <NullSafe value={s.outflow} />
                    </td>
                    <td
                      className={`text-right px-3 py-2 font-data ${
                        s.netFlow < 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {s.netFlow > 0 ? '+' : ''}
                      <NullSafe value={s.netFlow} />
                    </td>
                    <td className="text-right px-3 py-2 font-data">
                      <NullSafe value={(s.repairRatio * 100).toFixed(1)} suffix="%" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>
              第 {stationPage * PAGE_SIZE + 1}-{Math.min((stationPage + 1) * PAGE_SIZE, filteredStations.length)} 条，共 {filteredStations.length} 条
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStationPage((p) => Math.max(0, p - 1))}
                disabled={stationPage === 0}
                className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                {stationPage + 1} / {stationTotalPages}
              </span>
              <button
                onClick={() => setStationPage((p) => Math.min(stationTotalPages - 1, p + 1))}
                disabled={stationPage >= stationTotalPages - 1}
                className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'dispatches' && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {([
                    ['id', '编号'],
                    ['dispatchTime', '调度时间'],
                    ['bikeCount', '车辆数'],
                    ['status', '状态'],
                  ] as [DispatchSortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleDispatchSort(key)}
                      className="text-left px-3 py-2 text-white/50 font-medium cursor-pointer hover:text-white/70 select-none"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon active={dispatchSortKey === key} dir={dispatchSortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-3 py-2 text-white/50 font-medium">起点</th>
                  <th className="text-left px-3 py-2 text-white/50 font-medium">终点</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDispatches.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-data text-white/60">{d.id}</td>
                    <td className="px-3 py-2 font-data text-white/70">
                      {d.dispatchTime ? new Date(d.dispatchTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : <span className="text-white/30">—</span>}
                    </td>
                    <td className="text-right px-3 py-2 font-data">{d.bikeCount}</td>
                    <td className={`px-3 py-2 ${statusColor[d.status] ?? 'text-white/50'}`}>
                      {statusLabel[d.status] ?? d.status}
                    </td>
                    <td className="px-3 py-2 text-white/70">{stationNameMap.get(d.fromStationId) ?? d.fromStationId}</td>
                    <td className="px-3 py-2 text-white/70">{stationNameMap.get(d.toStationId) ?? d.toStationId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>
              第 {dispatchPage * PAGE_SIZE + 1}-{Math.min((dispatchPage + 1) * PAGE_SIZE, filteredDispatches.length)} 条，共 {filteredDispatches.length} 条
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDispatchPage((p) => Math.max(0, p - 1))}
                disabled={dispatchPage === 0}
                className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                {dispatchPage + 1} / {dispatchTotalPages}
              </span>
              <button
                onClick={() => setDispatchPage((p) => Math.min(dispatchTotalPages - 1, p + 1))}
                disabled={dispatchPage >= dispatchTotalPages - 1}
                className="p-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
