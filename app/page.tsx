'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Download, Info } from 'lucide-react'
import LogisticsMap from '@/components/LogisticsMap'
import FilterPanel from '@/components/FilterPanel'
import DetailPanel from '@/components/DetailPanel'
import StatsSummary from '@/components/StatsSummary'
import TeamRanking from '@/components/TeamRanking'
import RoleSelector from '@/components/RoleSelector'
import type {
  FilterParams,
  StationAggregate,
  PathAggregate,
  ScanSequenceItem,
  UserPermission,
} from '@/lib/types'
import { getDefaultPermission } from '@/lib/services/dataService'

type MasterData = {
  stations: { id: string; name: string; location: { lng: number; lat: number } }[]
  vehicles: { id: string; plateNumber: string }[]
  teams: { id: string; name: string }[]
  weatherConditions: { value: string; label: string }[]
  delayCategories: { value: string; label: string }[]
  severityLevels: { value: string; label: string }[]
}

export default function Home() {
  const [role, setRole] = useState<UserPermission['role']>('dispatcher')
  const [permission, setPermission] = useState<UserPermission>(getDefaultPermission('dispatcher'))
  const [masterData, setMasterData] = useState<MasterData | null>(null)
  const [stationData, setStationData] = useState<StationAggregate[]>([])
  const [pathData, setPathData] = useState<PathAggregate[]>([])
  const [teamData, setTeamData] = useState<any[]>([])
  const [filters, setFilters] = useState<FilterParams>({})
  const [selectedStation, setSelectedStation] = useState<StationAggregate | null>(null)
  const [selectedPath, setSelectedPath] = useState<PathAggregate | null>(null)
  const [scanSequence, setScanSequence] = useState<ScanSequenceItem[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    setPermission(getDefaultPermission(role))
  }, [role])

  useEffect(() => {
    const fetchMasterData = async () => {
      const res = await fetch('/api/master-data')
      const data = await res.json()
      setMasterData(data)
    }
    fetchMasterData()
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [stationRes, pathRes, teamRes, excRes] = await Promise.all([
        fetch('/api/stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ params: filters, role }),
        }).then(r => r.json()),
        fetch('/api/paths', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ params: filters, role }),
        }).then(r => r.json()),
        fetch(`/api/teams?${new URLSearchParams({
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
          ...(filters.stationIds && { stationIds: filters.stationIds.join(',') }),
          role,
        } as any).toString()}`).then(r => r.json()),
        fetch('/api/exceptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ params: filters, role }),
        }).then(r => r.json()),
      ])

      setStationData(stationRes.data || [])
      setPathData(pathRes.data || [])
      setTeamData(teamRes.data || [])
      setExceptions(excRes.data || [])
    } catch (e) {
      console.error('Failed to load data', e)
    } finally {
      setIsLoading(false)
    }
  }, [filters, role])

  useEffect(() => {
    if (masterData) {
      loadData()
    }
  }, [masterData, loadData])

  const handleStationClick = async (station: StationAggregate) => {
    setSelectedStation(station)
    setSelectedPath(null)
    setScanSequence([])
  }

  const handlePathClick = async (path: PathAggregate) => {
    setSelectedPath(path)
    setSelectedStation(null)
    
    try {
      const res = await fetch('/api/paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: filters, pathId: path.id, role }),
      })
      const data = await res.json()
      
      if (data.data && data.data.length > 0) {
        const firstWaybill = data.data[0]
        if (firstWaybill.scanSequence) {
          setScanSequence(firstWaybill.scanSequence)
        }
      }
    } catch (e) {
      console.error('Failed to load path details', e)
    }
  }

  const handleBoundsChange = (bounds: FilterParams['spatialBounds']) => {
    setFilters(prev => ({ ...prev, spatialBounds: bounds }))
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: filters, role, format: 'csv' }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `logistics_delay_report_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Export failed', e)
    }
  }

  const closeDetail = () => {
    setSelectedStation(null)
    setSelectedPath(null)
    setScanSequence([])
  }

  if (!masterData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-7 h-7 text-primary-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-800">物流中转迟滞地图</h1>
                <p className="text-xs text-gray-500">区域调度复盘系统</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Info className="w-5 h-5" />
              </button>
              <RoleSelector currentRole={role} onChange={setRole} />
            </div>
          </div>

          {showInfo && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-medium text-blue-800">跨夜停留计算：</span>
                  <span className="text-blue-700">早6点为业务日分界点，跨夜停留按业务日单独计算</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">装卸队归因：</span>
                  <span className="text-blue-700">车辆维修、天气原因造成的迟滞不归因到装卸队</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">低样本处理：</span>
                  <span className="text-blue-700">样本不足5的维度不进入排名，仅显示提示</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">权限控制：</span>
                  <span className="text-blue-700">根据角色脱敏敏感字段，访客仅查看聚合数据</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <StatsSummary stations={stationData} permission={permission} />

        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <FilterPanel
              masterData={masterData}
              filters={filters}
              onFilterChange={setFilters}
              onExport={handleExport}
              canExport={permission.canExport}
            />
            
            {teamData.length > 0 && (
              <TeamRanking teams={teamData} canViewDetails={permission.canViewDetails} />
            )}
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                <LogisticsMap
                  stations={stationData}
                  paths={pathData}
                  onStationClick={handleStationClick}
                  onPathClick={handlePathClick}
                  onBoundsChange={handleBoundsChange}
                  selectedStationId={selectedStation?.stationId}
                  selectedPathId={selectedPath?.id}
                />
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3" style={{ minHeight: '500px' }}>
            {(selectedStation || selectedPath) ? (
              <DetailPanel
                selectedStation={selectedStation}
                selectedPath={selectedPath}
                scanSequence={scanSequence}
                exceptions={exceptions.filter(e => 
                  selectedStation ? e.stationId === selectedStation.stationId : true
                )}
                onClose={closeDetail}
                permission={permission}
              />
            ) : (
              <div className="card h-full flex flex-col items-center justify-center text-center p-6">
                <MapPin className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">点击地图上的中转站或路径查看详情</p>
                <p className="text-gray-400 text-xs mt-2">
                  点击站点查看停留统计<br />
                  点击路径查看扫描时间线和天气标签
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
