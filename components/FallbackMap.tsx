'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { StationAggregate, PathAggregate, FilterParams, Coordinate } from '@/lib/types'
import { getDelayColor } from '@/lib/utils/business'

interface FallbackMapProps {
  stations: StationAggregate[]
  paths: PathAggregate[]
  onStationClick?: (station: StationAggregate) => void
  onPathClick?: (path: PathAggregate) => void
  onBoundsChange?: (bounds: FilterParams['spatialBounds']) => void
  selectedStationId?: string
  selectedPathId?: string
}

const CHINA_BOUNDS = {
  minLng: 73.5,
  maxLng: 135.1,
  minLat: 18.1,
  maxLat: 53.5,
}

export default function FallbackMap({
  stations,
  paths,
  onStationClick,
  onPathClick,
  onBoundsChange,
  selectedStationId,
  selectedPathId,
}: FallbackMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [viewBox, setViewBox] = useState({ x: 73.5, y: 53.5, width: 61.6, height: 35.4 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const lngToX = useCallback((lng: number) => {
    return ((lng - CHINA_BOUNDS.minLng) / (CHINA_BOUNDS.maxLng - CHINA_BOUNDS.minLng)) * dimensions.width
  }, [dimensions.width])

  const latToY = useCallback((lat: number) => {
    return dimensions.height - ((lat - CHINA_BOUNDS.minLat) / (CHINA_BOUNDS.maxLat - CHINA_BOUNDS.minLat)) * dimensions.height
  }, [dimensions.height])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = (e.clientX - dragStart.x) / scale
    const dy = (e.clientY - dragStart.y) / scale
    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx * (prev.width / dimensions.width),
      y: prev.y + dy * (prev.height / dimensions.height),
    }))
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.min(5, Math.max(0.5, prev * delta)))
  }

  const handleStationClick = (station: StationAggregate, e: React.MouseEvent) => {
    e.stopPropagation()
    onStationClick?.(station)
  }

  const handlePathClick = (path: PathAggregate, e: React.MouseEvent) => {
    e.stopPropagation()
    onPathClick?.(path)
  }

  useEffect(() => {
    if (onBoundsChange) {
      const { minLng, maxLng, minLat, maxLat } = CHINA_BOUNDS
      onBoundsChange({ minLng, maxLng, minLat, maxLat })
    }
  }, [onBoundsChange])

  const activeStations = stations.filter(s => s.totalWaybills > 0)

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative bg-gradient-to-b from-blue-50 to-green-50 overflow-hidden rounded-lg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <svg 
        width="100%" 
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out'
        }}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        <rect x="0" y="0" width={dimensions.width} height={dimensions.height} fill="#f0f9ff" />

        {[
          { x1: 0, y1: dimensions.height * 0.3, x2: dimensions.width, y2: dimensions.height * 0.3 },
          { x1: 0, y1: dimensions.height * 0.5, x2: dimensions.width, y2: dimensions.height * 0.5 },
          { x1: 0, y1: dimensions.height * 0.7, x2: dimensions.width, y2: dimensions.height * 0.7 },
          { x1: dimensions.width * 0.25, y1: 0, x2: dimensions.width * 0.25, y2: dimensions.height },
          { x1: dimensions.width * 0.5, y1: 0, x2: dimensions.width * 0.5, y2: dimensions.height },
          { x1: dimensions.width * 0.75, y1: 0, x2: dimensions.width * 0.75, y2: dimensions.height },
        ].map((line, i) => (
          <line
            key={i}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {paths.map(path => {
          const points = path.path.map(p => `${lngToX(p.lng)},${latToY(p.lat)}`).join(' ')
          const isSelected = selectedPathId === path.id
          const color = path.isDelayed ? '#ef4444' : '#10b981'
          const width = isSelected ? 4 : (path.isDelayed ? 3 : 1.5)
          const opacity = isSelected ? 0.9 : 0.6

          return (
            <g key={path.id}>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={width + 4}
                strokeOpacity={opacity * 0.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={width}
                strokeOpacity={opacity}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cursor-pointer transition-all hover:stroke-opacity-100"
                onClick={(e) => handlePathClick(path, e)}
              />
            </g>
          )
        })}

        {activeStations.map(station => {
          const cx = lngToX(station.location.lng)
          const cy = latToY(station.location.lat)
          const size = Math.min(35, 12 + Math.sqrt(station.totalWaybills) * 1.5)
          const color = getDelayColor(station.averageDurationMinutes)
          const isSelected = selectedStationId === station.stationId

          return (
            <g key={station.stationId} filter="url(#shadow)">
              <circle
                cx={cx}
                cy={cy}
                r={size + 2}
                fill="white"
                className="cursor-pointer"
                onClick={(e) => handleStationClick(station, e)}
              />
              <circle
                cx={cx}
                cy={cy}
                r={size}
                fill={color}
                stroke={isSelected ? '#1d4ed8' : 'white'}
                strokeWidth={isSelected ? 3 : 2}
                className="cursor-pointer transition-transform hover:r-[calc(100%+2px)]"
                onClick={(e) => handleStationClick(station, e)}
              />
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="white"
                className="pointer-events-none"
              >
                {station.totalWaybills}
              </text>
              <text
                x={cx}
                y={cy + size + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
                className="pointer-events-none"
              >
                {station.stationName.replace(/物流中心|转运中心/g, '')}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2.5 shadow-md">
        <div className="text-xs font-medium text-gray-700 mb-1.5">图例</div>
        <div className="space-y-1">
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-delay-normal" />
            <span className="text-xs text-gray-600">正常 (≤30分钟)</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-delay-warning" />
            <span className="text-xs text-gray-600">预警 (≤1小时)</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-delay-danger" />
            <span className="text-xs text-gray-600">迟滞 (≤2小时)</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-delay-critical" />
            <span className="text-xs text-gray-600">严重 (＞2小时)</span>
          </div>
          <div className="pt-1 border-t border-gray-200">
            <div className="flex gap-2 items-center">
              <div className="w-6 h-0.5 bg-delay-danger rounded" />
              <span className="text-xs text-gray-600">迟滞路径</span>
            </div>
            <div className="flex gap-2 items-center mt-1">
              <div className="w-6 h-0.5 bg-delay-normal rounded" />
              <span className="text-xs text-gray-600">正常路径</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2 shadow-md max-w-[180px]">
        <div className="text-xs font-medium text-yellow-800 mb-0.5">⚠️ 简化模式</div>
        <p className="text-xs text-yellow-700">
          配置 Mapbox Token 可启用卫星底图和交互功能
        </p>
      </div>

      <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-500">
        滚轮缩放 · 拖拽平移
      </div>
    </div>
  )
}
