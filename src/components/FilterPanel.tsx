import { useState, useEffect, useCallback } from 'react'
import { Filter, RotateCcw, ChevronDown, Bike, Wrench, Clock, CloudSun, Route as RouteIcon } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import { useDataStore } from '@/store/dataStore'
import type { TimePeriod, VehicleStatus, DispatchStatusFilter } from '@/types'

const TIME_PERIOD_OPTIONS: { label: string; value: TimePeriod }[] = [
  { label: '全天', value: 'all_day' },
  { label: '早高峰', value: 'morning_rush' },
  { label: '晚高峰', value: 'evening_rush' },
  { label: '自定义', value: 'custom' },
]

const VEHICLE_STATUS_OPTIONS: { label: string; value: VehicleStatus; icon: React.ReactNode }[] = [
  { label: '全部', value: 'all', icon: <Bike className="w-3.5 h-3.5" /> },
  { label: '可调度', value: 'dispatchable', icon: <Bike className="w-3.5 h-3.5" /> },
  { label: '维修中', value: 'in_repair', icon: <Wrench className="w-3.5 h-3.5" /> },
]

const DISPATCH_STATUS_OPTIONS: { label: string; value: DispatchStatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '已完成', value: 'completed' },
  { label: '进行中', value: 'in_progress' },
  { label: '待处理', value: 'pending' },
]

const WEATHER_OPTIONS = [
  { label: '晴天', value: 'sunny' },
  { label: '多云', value: 'cloudy' },
  { label: '雨天', value: 'rainy' },
  { label: '雪天', value: 'snowy' },
  { label: '大风', value: 'windy' },
]

export default function FilterPanel() {
  const stations = useDataStore((s) => s.stations)
  const routes = useDataStore((s) => s.routes)
  const refreshFilters = useDataStore((s) => s.refreshFilters)

  const stationIds = useFilterStore((s) => s.stationIds)
  const routeIds = useFilterStore((s) => s.routeIds)
  const timePeriod = useFilterStore((s) => s.timePeriod)
  const customTimeRange = useFilterStore((s) => s.customTimeRange)
  const vehicleStatus = useFilterStore((s) => s.vehicleStatus)
  const dispatchStatus = useFilterStore((s) => s.dispatchStatus)
  const weatherConditions = useFilterStore((s) => s.weatherConditions)
  const repairExcludedCount = useFilterStore((s) => s.repairExcludedCount)

  const setStationIds = useFilterStore((s) => s.setStationIds)
  const setRouteIds = useFilterStore((s) => s.setRouteIds)
  const setTimePeriod = useFilterStore((s) => s.setTimePeriod)
  const setCustomTimeRange = useFilterStore((s) => s.setCustomTimeRange)
  const setVehicleStatus = useFilterStore((s) => s.setVehicleStatus)
  const setDispatchStatus = useFilterStore((s) => s.setDispatchStatus)
  const setWeatherConditions = useFilterStore((s) => s.setWeatherConditions)
  const resetFilters = useFilterStore((s) => s.resetFilters)

  const [stationDropdownOpen, setStationDropdownOpen] = useState(false)
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false)

  const handleStationToggle = useCallback(
    (id: string) => {
      const next = stationIds.includes(id)
        ? stationIds.filter((s) => s !== id)
        : [...stationIds, id]
      setStationIds(next)
    },
    [stationIds, setStationIds],
  )

  const handleRouteToggle = useCallback(
    (id: string) => {
      const next = routeIds.includes(id)
        ? routeIds.filter((r) => r !== id)
        : [...routeIds, id]
      setRouteIds(next)
    },
    [routeIds, setRouteIds],
  )

  const handleWeatherToggle = useCallback(
    (value: string) => {
      const next = weatherConditions.includes(value)
        ? weatherConditions.filter((c) => c !== value)
        : [...weatherConditions, value]
      setWeatherConditions(next)
    },
    [weatherConditions, setWeatherConditions],
  )

  useEffect(() => {
    refreshFilters()
  }, [stationIds, routeIds, timePeriod, customTimeRange, vehicleStatus, dispatchStatus, weatherConditions, refreshFilters])

  return (
    <div className="w-64 bg-[#22252d] border-r border-[#2a2d35] p-4 flex flex-col gap-5 overflow-y-auto" style={{ fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-200 font-medium">
          <Filter className="w-4 h-4" />
          <span>筛选条件</span>
        </div>
        <button
          onClick={resetFilters}
          className="p-1.5 rounded-md hover:bg-[#2a2d35] text-gray-400 hover:text-gray-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <section>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">站点</h4>
        <div className="relative">
          <button
            onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#2a2d35] text-sm text-gray-300 hover:bg-[#32353d] transition-colors"
          >
            <span>{stationIds.length === 0 ? '全部站点' : `已选 ${stationIds.length} 个站点`}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${stationDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {stationDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-[#2a2d35] rounded-lg border border-[#3a3d45] shadow-lg max-h-40 overflow-y-auto">
              {stations.map((station) => (
                <label
                  key={station.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#32353d] cursor-pointer text-sm text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={stationIds.includes(station.id)}
                    onChange={() => handleStationToggle(station.id)}
                    className="w-3.5 h-3.5 rounded accent-[#00e5c7]"
                  />
                  {station.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <RouteIcon className="w-3.5 h-3.5" />
          线路
        </h4>
        <div className="relative">
          <button
            onClick={() => setRouteDropdownOpen(!routeDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#2a2d35] text-sm text-gray-300 hover:bg-[#32353d] transition-colors"
          >
            <span>{routeIds.length === 0 ? '全部线路' : `已选 ${routeIds.length} 条线路`}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${routeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {routeDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-[#2a2d35] rounded-lg border border-[#3a3d45] shadow-lg max-h-48 overflow-y-auto">
              {routes.map((route) => (
                <label
                  key={route.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#32353d] cursor-pointer text-sm text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={routeIds.includes(route.id)}
                    onChange={() => handleRouteToggle(route.id)}
                    className="w-3.5 h-3.5 rounded accent-[#00e5c7]"
                  />
                  {route.originName} → {route.destName}
                </label>
              ))}
              {routes.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">暂无线路数据</div>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          时间段
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {TIME_PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimePeriod(opt.value)}
              className={`px-2 py-1.5 rounded-md text-xs border transition-colors ${
                timePeriod === opt.value
                  ? 'bg-[#00e5c7]/20 text-[#00e5c7] border-[#00e5c7]'
                  : 'bg-[#2a2d35] text-gray-400 border-transparent hover:bg-[#32353d]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {timePeriod === 'custom' && (
          <div className="mt-2 space-y-2">
            <input
              type="datetime-local"
              value={customTimeRange?.[0] ?? ''}
              onChange={(e) =>
                setCustomTimeRange([e.target.value, customTimeRange?.[1] ?? ''])
              }
              className="w-full px-2 py-1.5 rounded-md bg-[#2a2d35] text-xs text-gray-300 border border-[#3a3d45] focus:outline-none focus:border-[#00e5c7]/50"
            />
            <input
              type="datetime-local"
              value={customTimeRange?.[1] ?? ''}
              onChange={(e) =>
                setCustomTimeRange([customTimeRange?.[0] ?? '', e.target.value])
              }
              className="w-full px-2 py-1.5 rounded-md bg-[#2a2d35] text-xs text-gray-300 border border-[#3a3d45] focus:outline-none focus:border-[#00e5c7]/50"
            />
          </div>
        )}
      </section>

      <section>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Bike className="w-3.5 h-3.5" />
          车辆状态
        </h4>
        <div className="flex gap-1.5">
          {VEHICLE_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVehicleStatus(opt.value)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs border transition-colors ${
                vehicleStatus === opt.value
                  ? 'bg-[#00e5c7]/20 text-[#00e5c7] border-[#00e5c7]'
                  : 'bg-[#2a2d35] text-gray-400 border-transparent hover:bg-[#32353d]'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        {vehicleStatus === 'dispatchable' && repairExcludedCount > 0 && (
          <p className="mt-2 text-xs text-amber-400">
            已从可调度库存中剔除 {repairExcludedCount} 辆维修车辆
          </p>
        )}
      </section>

      <section>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">调度状态</h4>
        <select
          value={dispatchStatus}
          onChange={(e) => setDispatchStatus(e.target.value as DispatchStatusFilter)}
          className="w-full px-3 py-2 rounded-lg bg-[#2a2d35] text-sm text-gray-300 border border-[#3a3d45] focus:outline-none focus:border-[#00e5c7]/50 appearance-none cursor-pointer"
        >
          {DISPATCH_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CloudSun className="w-3.5 h-3.5" />
          天气条件
        </h4>
        <div className="space-y-1.5">
          {WEATHER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-gray-200"
            >
              <input
                type="checkbox"
                checked={weatherConditions.includes(opt.value)}
                onChange={() => handleWeatherToggle(opt.value)}
                className="w-3.5 h-3.5 rounded accent-[#00e5c7]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
