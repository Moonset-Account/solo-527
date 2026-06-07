'use client'

import { X, Clock, AlertTriangle, Truck, CloudRain, Users, TrendingUp, Calendar } from 'lucide-react'
import type { StationAggregate, PathAggregate, ScanSequenceItem, UserPermission } from '@/lib/types'
import { formatDuration, formatDate, getWeatherLabel, getDelayCategoryLabel, getSeverityLabel } from '@/lib/utils/business'
import { isLowSample } from '@/lib/utils/business'

interface DetailPanelProps {
  selectedStation: StationAggregate | null
  selectedPath: PathAggregate | null
  scanSequence: ScanSequenceItem[]
  exceptions: any[]
  onClose: () => void
  permission: UserPermission
}

export default function DetailPanel({
  selectedStation,
  selectedPath,
  scanSequence,
  exceptions,
  onClose,
  permission,
}: DetailPanelProps) {
  if (!selectedStation && !selectedPath) return null

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">
          {selectedStation ? selectedStation.stationName : `${selectedPath?.originName} → ${selectedPath?.destName}`}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {selectedStation && (
          <StationDetail station={selectedStation} permission={permission} />
        )}
        
        {selectedPath && (
          <PathDetail path={selectedPath} permission={permission} />
        )}

        {scanSequence.length > 0 && (
          <ScanTimeline scans={scanSequence} permission={permission} />
        )}

        {exceptions.length > 0 && (
          <ExceptionList exceptions={exceptions} permission={permission} />
        )}
      </div>
    </div>
  )
}

function StationDetail({ station, permission }: { station: StationAggregate; permission: UserPermission }) {
  const showLowSample = isLowSample(station.totalWaybills) && !permission.canViewDetails

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Truck className="w-4 h-4 text-blue-500" />}
          label="运单总数"
          value={showLowSample ? '样本不足' : station.totalWaybills.toString()}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          label="迟滞运单"
          value={showLowSample ? '样本不足' : station.delayedWaybills.toString()}
          valueClass="text-red-600"
        />
        <StatCard
          icon={<Clock className="w-4 h-4 text-orange-500" />}
          label="平均停留"
          value={showLowSample ? '样本不足' : formatDuration(Math.round(station.averageDurationMinutes))}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
          label="迟滞率"
          value={showLowSample ? '样本不足' : `${(station.delayRate * 100).toFixed(1)}%`}
          valueClass={station.delayRate > 0.3 ? 'text-red-600' : 'text-gray-700'}
        />
      </div>

      {station.weatherConditions.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CloudRain className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">天气标签</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {station.weatherConditions.map(w => {
              const weather = getWeatherLabel(w)
              return (
                <span
                  key={w}
                  className={`text-sm px-2 py-1 rounded-full bg-white border ${weather.color}`}
                >
                  {weather.icon} {weather.label}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PathDetail({ path, permission }: { path: PathAggregate; permission: UserPermission }) {
  const showLowSample = isLowSample(path.waybillCount) && !permission.canViewDetails

  return (
    <div className="space-y-3">
      <div className="bg-primary-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">路径</div>
            <div className="font-medium text-gray-800">{path.originName} → {path.destName}</div>
          </div>
          {path.isDelayed && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
              高迟滞路线
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Truck className="w-4 h-4 text-blue-500" />}
          label="运单数量"
          value={showLowSample ? '样本不足' : path.waybillCount.toString()}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          label="迟滞数量"
          value={showLowSample ? '样本不足' : path.delayCount.toString()}
          valueClass="text-red-600"
        />
        <StatCard
          icon={<Clock className="w-4 h-4 text-orange-500" />}
          label="平均停留"
          value={showLowSample ? '样本不足' : formatDuration(Math.round(path.averageDurationMinutes))}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
          label="平均晚点"
          value={showLowSample ? '样本不足' : formatDuration(Math.round(path.averageDelayMinutes))}
          valueClass="text-orange-600"
        />
      </div>

      {path.topReasons.length > 0 && permission.canViewDetails && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-700 mb-2">主要迟滞原因</div>
          <div className="space-y-2">
            {path.topReasons.map((reason, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{getDelayCategoryLabel(reason.category)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${(reason.count / path.delayCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{reason.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScanTimeline({ scans, permission }: { scans: ScanSequenceItem[]; permission: UserPermission }) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-500" />
        <h4 className="font-medium text-gray-800">扫描时间线</h4>
      </div>
      
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="space-y-4">
          {scans.map((item, idx) => {
            const weather = item.weather ? getWeatherLabel(item.weather.condition) : null
            const scanTypeLabel: Record<string, string> = {
              arrival: '到达',
              departure: '出发',
              loading: '装车',
              unloading: '卸车',
            }
            
            return (
              <div key={idx} className="relative pl-8">
                <div className={`absolute left-1.5 w-3 h-3 rounded-full border-2 ${
                  item.scan.scanType === 'arrival' ? 'bg-blue-500 border-blue-200' :
                  item.scan.scanType === 'departure' ? 'bg-green-500 border-green-200' :
                  'bg-purple-500 border-purple-200'
                }`} />
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {item.station.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {scanTypeLabel[item.scan.scanType] || item.scan.scanType}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    {formatDate(item.scan.timestamp)}
                  </div>
                  
                  {weather && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className={weather.color}>{weather.icon}</span>
                      <span className="text-gray-500">{weather.label}</span>
                      {item.weather && (
                        <span className="text-gray-400 ml-1">
                          {item.weather.temperature}°C | 能见度 {item.weather.visibility}km
                        </span>
                      )}
                    </div>
                  )}
                  
                  {item.durationToNext !== undefined && item.durationToNext > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      间隔 {formatDuration(item.durationToNext)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ExceptionList({ exceptions, permission }: { exceptions: any[]; permission: UserPermission }) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <h4 className="font-medium text-gray-800">异常记录 ({exceptions.length})</h4>
      </div>
      
      <div className="space-y-2">
        {exceptions.slice(0, 5).map((exc) => {
          const severity = getSeverityLabel(exc.severity)
          const typeLabel: Record<string, string> = {
            vehicle_breakdown: '车辆故障',
            weather_delay: '天气延误',
            loading_delay: '装卸延误',
            package_damage: '包裹破损',
            traffic_jam: '交通拥堵',
            other: '其他',
          }
          
          return (
            <div key={exc.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {typeLabel[exc.type] || exc.type}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${severity.color}`}>
                  {severity.label}
                </span>
              </div>
              
              {permission.canViewSensitive && exc.description && (
                <p className="text-xs text-gray-500 mb-1">{exc.description}</p>
              )}
              
              <div className="text-xs text-gray-400">
                {formatDate(exc.timestamp)}
              </div>
            </div>
          )
        })}
        
        {exceptions.length > 5 && (
          <div className="text-center text-xs text-gray-500">
            还有 {exceptions.length - 5} 条异常记录
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  valueClass = '',
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className={`text-lg font-semibold ${valueClass || 'text-gray-800'}`}>
        {value}
      </div>
    </div>
  )
}
