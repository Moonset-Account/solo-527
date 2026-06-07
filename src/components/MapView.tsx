import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { scaleLinear } from 'd3'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import type { AggregatedStation, Ride } from '@/types'
import Empty from './Empty'

const MAPBOX_TOKEN: string | undefined = import.meta.env.VITE_MAPBOX_TOKEN

function getStationColor(available: number): string {
  if (available < 3) return '#e74c3c'
  if (available < 5) return '#ff9f43'
  return '#00e5c7'
}

function getFlowColor(period: string): string {
  if (period === 'morning_rush') return '#00e5c7'
  if (period === 'evening_rush') return '#ff9f43'
  return '#4a6fa5'
}

interface FlowData {
  origin: string
  dest: string
  count: number
  period: string
}

function computeFlows(rides: Ride[]): FlowData[] {
  const flowMap = new Map<string, FlowData>()
  const periodCounts = new Map<string, Map<string, number>>()
  rides.forEach((r) => {
    const key = `${r.originStationId}->${r.destStationId}`
    const existing = flowMap.get(key)
    if (existing) {
      existing.count++
      const pc = periodCounts.get(key) || new Map<string, number>()
      pc.set(r.period, (pc.get(r.period) || 0) + 1)
      periodCounts.set(key, pc)
    } else {
      flowMap.set(key, {
        origin: r.originStationId,
        dest: r.destStationId,
        count: 1,
        period: r.period,
      })
      const pc = new Map<string, number>()
      pc.set(r.period, 1)
      periodCounts.set(key, pc)
    }
  })
  flowMap.forEach((flow, key) => {
    const pc = periodCounts.get(key)
    if (pc) {
      let maxP = ''
      let maxC = 0
      pc.forEach((c, p) => {
        if (c > maxC) {
          maxC = c
          maxP = p
        }
      })
      flow.period = maxP
    }
  })
  return Array.from(flowMap.values())
}

function getCurvePath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const offset = Math.min(len * 0.2, 30)
  const cx = midX - (dy / len) * offset
  const cy = midY + (dx / len) * offset
  return `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`
}

interface TooltipInfo {
  station: AggregatedStation
  x: number
  y: number
}

function D3FallbackMap({
  stations,
  rides,
  onStationClick,
}: {
  stations: AggregatedStation[]
  rides: Ride[]
  onStationClick: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  const width = 800
  const height = 700
  const padding = 60

  const xScale = useMemo(
    () => scaleLinear().domain([116.30, 116.48]).range([padding, width - padding]),
    []
  )

  const yScale = useMemo(
    () => scaleLinear().domain([40.08, 39.89]).range([padding, height - padding]),
    []
  )

  const stationMap = useMemo(() => {
    const m = new Map<string, AggregatedStation>()
    stations.forEach((s) => m.set(s.id, s))
    return m
  }, [stations])

  const dockExtent = useMemo((): [number, number] => {
    const docks = stations.map((s) => s.totalDocks)
    return [Math.min(...docks), Math.max(...docks)]
  }, [stations])

  const radiusScale = useMemo(
    () => scaleLinear().domain(dockExtent).range([3, 8]),
    [dockExtent]
  )

  const flows = useMemo(() => computeFlows(rides), [rides])

  const maxFlowCount = useMemo(
    () => Math.max(...flows.map((f) => f.count), 1),
    [flows]
  )

  const flowWidthScale = useMemo(
    () => scaleLinear().domain([1, maxFlowCount]).range([1, 4]).clamp(true),
    [maxFlowCount]
  )

  const handleStationHover = useCallback(
    (station: AggregatedStation, e: React.MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setTooltip({
        station,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    },
    []
  )

  const handleStationLeave = useCallback(() => setTooltip(null), [])

  return (
    <div ref={containerRef} className="h-full w-full relative bg-[#1a1d23]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <style>{`
          @keyframes flowDash {
            to { stroke-dashoffset: -24; }
          }
          .flow-path {
            stroke-dasharray: 8 4;
            animation: flowDash 1.5s linear infinite;
          }
        `}</style>

        {flows.map((flow) => {
          const origin = stationMap.get(flow.origin)
          const dest = stationMap.get(flow.dest)
          if (!origin || !dest) return null
          const x1 = xScale(origin.longitude)
          const y1 = yScale(origin.latitude)
          const x2 = xScale(dest.longitude)
          const y2 = yScale(dest.latitude)
          return (
            <path
              key={`${flow.origin}-${flow.dest}`}
              d={getCurvePath(x1, y1, x2, y2)}
              fill="none"
              stroke={getFlowColor(flow.period)}
              strokeWidth={flowWidthScale(flow.count)}
              opacity={0.6}
              className="flow-path"
            />
          )
        })}

        {stations.map((station) => {
          const cx = xScale(station.longitude)
          const cy = yScale(station.latitude)
          const r = radiusScale(station.totalDocks)
          return (
            <circle
              key={station.id}
              cx={cx}
              cy={cy}
              r={r}
              fill={getStationColor(station.availableBikesForDispatch)}
              stroke="#fff"
              strokeWidth={0.5}
              opacity={0.9}
              className="cursor-pointer"
              onMouseEnter={(e) => handleStationHover(station, e)}
              onMouseMove={(e) => handleStationHover(station, e)}
              onMouseLeave={handleStationLeave}
              onClick={() => onStationClick(station.id)}
            />
          )
        })}

        {stations.map((station) => {
          const cx = xScale(station.longitude)
          const cy = yScale(station.latitude)
          return (
            <text
              key={`lbl-${station.id}`}
              x={cx}
              y={cy - radiusScale(station.totalDocks) - 3}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize={8}
              pointerEvents="none"
            >
              {station.name}
            </text>
          )
        })}
      </svg>

      <div className="absolute top-3 right-3 bg-[#22252d] rounded-lg p-3 text-xs space-y-2 border border-[#333]">
        <div className="text-gray-400 font-medium">图例</div>
        <div className="space-y-1">
          <div className="text-gray-400">站点状态</div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#e74c3c]" />
            <span className="text-gray-300">可调度车辆 &lt;3</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ff9f43]" />
            <span className="text-gray-300">可调度车辆 &lt;5</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00e5c7]" />
            <span className="text-gray-300">可调度车辆 ≥5</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-400">流量时段</div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 bg-[#00e5c7]" />
            <span className="text-gray-300">早高峰</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 bg-[#ff9f43]" />
            <span className="text-gray-300">晚高峰</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 bg-[#4a6fa5]" />
            <span className="text-gray-300">平时</span>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="absolute bg-[#22252d] border border-[#444] rounded-lg p-2.5 text-xs pointer-events-none z-10 shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
          }}
        >
          <div className="font-medium text-gray-200 mb-1">{tooltip.station.name}</div>
          <div className="text-gray-400">
            可调度: <span className="text-gray-200">{tooltip.station.availableBikesForDispatch}</span>
          </div>
          <div className="text-gray-400">
            流入: <span className="text-[#00e5c7]">{tooltip.station.inflow}</span>
          </div>
          <div className="text-gray-400">
            流出: <span className="text-[#ff9f43]">{tooltip.station.outflow}</span>
          </div>
          <div className="text-gray-400">
            维修中: <span className="text-[#e74c3c]">{tooltip.station.bikesInRepair}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function MapboxMap({
  stations,
  rides,
  onStationClick,
}: {
  stations: AggregatedStation[]
  rides: Ride[]
  onStationClick: (id: string) => void
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef(
    new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'dark-popup' })
  )
  const onClickRef = useRef(onStationClick)
  onClickRef.current = onStationClick
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return
    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [116.39, 39.99],
      zoom: 10,
    })

    map.on('load', () => {
      map.addSource('stations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'stations-layer',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'totalDocks'], 18, 4, 35, 10],
          'circle-color': [
            'case',
            ['<', ['get', 'availableBikesForDispatch'], 3],
            '#e74c3c',
            ['<', ['get', 'availableBikesForDispatch'], 5],
            '#ff9f43',
            '#00e5c7',
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      })

      map.addSource('flows', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'flows-layer',
        type: 'line',
        source: 'flows',
        paint: {
          'line-width': ['interpolate', ['linear'], ['get', 'count'], 1, 1, 10, 4],
          'line-color': [
            'case',
            ['==', ['get', 'period'], 'morning_rush'],
            '#00e5c7',
            ['==', ['get', 'period'], 'evening_rush'],
            '#ff9f43',
            '#4a6fa5',
          ],
          'line-opacity': 0.6,
        },
      })

      const popup = popupRef.current

      map.on('mouseenter', 'stations-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const props = e.features?.[0]?.properties
        if (!props) return
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number]
        while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
          coords[0] += e.lngLat.lng > coords[0] ? 360 : -360
        }
        popup
          .setLngLat(coords)
          .setHTML(
            `<div style="font-size:12px;color:#e5e7eb;">
              <div style="font-weight:600;margin-bottom:4px;">${props.name}</div>
              <div>可调度: ${props.availableBikesForDispatch}</div>
              <div>流入: ${props.inflow}</div>
              <div>流出: ${props.outflow}</div>
              <div>维修中: ${props.bikesInRepair}</div>
            </div>`
          )
          .addTo(map)
      })

      map.on('mouseleave', 'stations-layer', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })

      map.on('click', 'stations-layer', (e) => {
        const id = e.features?.[0]?.properties?.id
        if (id) onClickRef.current(id as string)
      })

      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    const stationGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: stations.map((s) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [s.longitude, s.latitude],
        },
        properties: {
          id: s.id,
          name: s.name,
          totalDocks: s.totalDocks,
          availableBikesForDispatch: s.availableBikesForDispatch,
          inflow: s.inflow,
          outflow: s.outflow,
          bikesInRepair: s.bikesInRepair,
        },
      })),
    }

    const stationMap = new Map<string, AggregatedStation>()
    stations.forEach((s) => stationMap.set(s.id, s))

    const flows = computeFlows(rides)
    const flowFeatures: GeoJSON.Feature[] = []
    flows.forEach((flow) => {
      const origin = stationMap.get(flow.origin)
      const dest = stationMap.get(flow.dest)
      if (!origin || !dest) return
      flowFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [origin.longitude, origin.latitude],
            [dest.longitude, dest.latitude],
          ],
        },
        properties: {
          count: flow.count,
          period: flow.period,
        },
      })
    })

    const flowGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: flowFeatures,
    }

    const stationSource = map.getSource('stations') as mapboxgl.GeoJSONSource | undefined
    if (stationSource) stationSource.setData(stationGeoJSON)

    const flowSource = map.getSource('flows') as mapboxgl.GeoJSONSource | undefined
    if (flowSource) flowSource.setData(flowGeoJSON)
  }, [stations, rides, mapReady])

  return (
    <div className="h-full w-full relative">
      <style>{`
        .dark-popup .mapboxgl-popup-content {
          background: #22252d !important;
          color: #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .dark-popup .mapboxgl-popup-tip {
          border-top-color: #22252d !important;
        }
      `}</style>
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  )
}

export default function MapView() {
  const filteredStations = useDataStore((s) => s.filteredStations)
  const filteredRides = useDataStore((s) => s.filteredRides)
  const setStationIds = useFilterStore((s) => s.setStationIds)

  const handleStationClick = useCallback(
    (id: string) => setStationIds([id]),
    [setStationIds]
  )

  if (filteredStations.length === 0) return <Empty />

  if (!MAPBOX_TOKEN) {
    return (
      <D3FallbackMap
        stations={filteredStations}
        rides={filteredRides}
        onStationClick={handleStationClick}
      />
    )
  }

  return (
    <MapboxMap
      stations={filteredStations}
      rides={filteredRides}
      onStationClick={handleStationClick}
    />
  )
}
