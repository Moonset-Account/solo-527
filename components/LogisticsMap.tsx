'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import type { StationAggregate, PathAggregate, FilterParams } from '@/lib/types'
import { getDelayColor } from '@/lib/utils/business'

interface LogisticsMapProps {
  stations: StationAggregate[]
  paths: PathAggregate[]
  onStationClick?: (station: StationAggregate) => void
  onPathClick?: (path: PathAggregate) => void
  onBoundsChange?: (bounds: FilterParams['spatialBounds']) => void
  selectedStationId?: string
  selectedPathId?: string
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6Im1hcGJveC1kZW1vIn0.demo-token'

export default function LogisticsMap({
  stations,
  paths,
  onStationClick,
  onPathClick,
  onBoundsChange,
  selectedStationId,
  selectedPathId,
}: LogisticsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({})
  const pathLayersRef = useRef<string[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [108.9, 34.3],
      zoom: 3.8,
      minZoom: 3,
      maxZoom: 12,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'metric' }), 'bottom-left')

    map.current.on('load', () => {
      setIsMapLoaded(true)
    })

    map.current.on('moveend', () => {
      if (map.current && onBoundsChange) {
        const bounds = map.current.getBounds()
        if (bounds) {
          onBoundsChange({
            minLng: bounds.getWest(),
            maxLng: bounds.getEast(),
            minLat: bounds.getSouth(),
            maxLat: bounds.getNorth(),
          })
        }
      }
    })

    return () => {
      map.current?.remove()
    }
  }, [onBoundsChange])

  const renderStations = useCallback(() => {
    if (!map.current || !isMapLoaded) return

    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    stations.forEach(station => {
      if (station.totalWaybills === 0) return

      const size = Math.min(40, 15 + Math.sqrt(station.totalWaybills) * 2)
      const color = getDelayColor(station.averageDurationMinutes)
      const isSelected = selectedStationId === station.stationId

      const el = document.createElement('div')
      el.className = 'station-marker cursor-pointer transition-all duration-200'
      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.borderRadius = '50%'
      el.style.backgroundColor = color
      el.style.border = isSelected ? '3px solid #1d4ed8' : '2px solid white'
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.color = 'white'
      el.style.fontSize = '10px'
      el.style.fontWeight = 'bold'

      const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
        .setHTML(`
          <div style="font-family: sans-serif; min-width: 180px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${station.stationName}</div>
            <div style="font-size: 12px; color: #666;">运单总数: <strong>${station.totalWaybills}</strong></div>
            <div style="font-size: 12px; color: #666;">迟滞运单: <strong style="color: #ef4444;">${station.delayedWaybills}</strong></div>
            <div style="font-size: 12px; color: #666;">平均停留: <strong>${station.averageDurationMinutes.toFixed(0)}分钟</strong></div>
            <div style="font-size: 12px; color: #666;">迟滞率: <strong>${(station.delayRate * 100).toFixed(1)}%</strong></div>
          </div>
        `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([station.location.lng, station.location.lat])
        .setPopup(popup)
        .addTo(map.current!)

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onStationClick?.(station)
      })

      markersRef.current[station.stationId] = marker
    })
  }, [stations, isMapLoaded, selectedStationId, onStationClick])

  const renderPaths = useCallback(() => {
    if (!map.current || !isMapLoaded) return

    pathLayersRef.current.forEach(layerId => {
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId)
      }
      if (map.current!.getSource(layerId)) {
        map.current!.removeSource(layerId)
      }
    })
    pathLayersRef.current = []

    paths.forEach(path => {
      const layerId = `path-${path.id}`
      const isSelected = selectedPathId === path.id
      const color = path.isDelayed ? '#ef4444' : '#10b981'
      const width = isSelected ? 6 : (path.isDelayed ? 4 : 2)
      const opacity = isSelected ? 0.9 : 0.6

      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {
          id: path.id,
          waybillCount: path.waybillCount,
          delayCount: path.delayCount,
          isDelayed: path.isDelayed,
        },
        geometry: {
          type: 'LineString',
          coordinates: path.path.map(p => [p.lng, p.lat]),
        },
      }

      map.current!.addSource(layerId, {
        type: 'geojson',
        data: geojson,
      })

      map.current!.addLayer({
        id: layerId,
        type: 'line',
        source: layerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': width,
          'line-opacity': opacity,
        },
      })

      map.current!.on('click', layerId, (e) => {
        e.originalEvent.stopPropagation()
        onPathClick?.(path)
      })

      map.current!.on('mouseenter', layerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer'
        }
      })

      map.current!.on('mouseleave', layerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = ''
        }
      })

      pathLayersRef.current.push(layerId)
    })
  }, [paths, isMapLoaded, selectedPathId, onPathClick])

  useEffect(() => {
    renderStations()
  }, [renderStations])

  useEffect(() => {
    renderPaths()
  }, [renderPaths])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <div className="text-xs font-medium text-gray-700 mb-2">停留时长图例</div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-delay-normal" />
            <span className="text-xs text-gray-600">≤30分钟</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-delay-warning" />
            <span className="text-xs text-gray-600">≤1小时</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-delay-danger" />
            <span className="text-xs text-gray-600">≤2小时</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-delay-critical" />
            <span className="text-xs text-gray-600">＞2小时</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1">
              <div className="w-6 h-1 bg-delay-danger rounded" />
              <span className="text-xs text-gray-600">迟滞路径</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-1 bg-delay-normal rounded" />
              <span className="text-xs text-gray-600">正常路径</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
