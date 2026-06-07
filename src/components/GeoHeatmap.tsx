import { useEffect, useRef, useState } from 'react'
import { MapPin, AlertCircle } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'

interface GeoHeatmapProps {
  height?: number
}

const MAPBOX_TOKEN = 'pk.placeholder'

export default function GeoHeatmap({ height = 400 }: GeoHeatmapProps) {
  const geoHeatmap = useDashboardStore((s) => s.geoHeatmap)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (mapError || !containerRef.current) return

    let map: mapboxgl.Map | null = null
    let cancelled = false

    const loadMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default
        await import('mapbox-gl/dist/mapbox-gl.css')

        if (cancelled || !containerRef.current) return

        mapboxgl.accessToken = MAPBOX_TOKEN

        map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [110, 32],
          zoom: 4,
        })

        map.on('error', () => {
          if (!cancelled) setMapError(true)
        })

        map.on('load', () => {
          if (cancelled) return
          setMapLoaded(true)

          if (geoHeatmap.length > 0) {
            map!.addSource('returns', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: geoHeatmap.map((p) => ({
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                  properties: { count: p.count },
                })),
              },
            })

            map!.addLayer({
              id: 'returns-heat',
              type: 'heatmap',
              source: 'returns',
              paint: {
                'heatmap-weight': ['get', 'count'],
                'heatmap-intensity': 0.02,
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(16,185,129,0)',
                  0.2, 'rgba(16,185,129,0.3)',
                  0.5, 'rgba(5,150,105,0.6)',
                  0.8, 'rgba(239,68,68,0.8)',
                  1, 'rgba(239,68,68,1)',
                ],
                'heatmap-radius': 40,
                'heatmap-opacity': 0.8,
              },
            })
          }
        })
      } catch {
        if (!cancelled) setMapError(true)
      }
    }

    loadMap()

    return () => {
      cancelled = true
      if (map) map.remove()
    }
  }, [geoHeatmap])

  if (mapError) {
    return (
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">退货地域热力图</h3>
        <div className="rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center" style={{ height }}>
          <AlertCircle size={32} className="text-slate-400 mb-2" />
          <p className="text-sm text-slate-500 mb-1">地图加载失败</p>
          <p className="text-xs text-slate-400">请配置有效的 Mapbox Token</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {geoHeatmap.map((p) => (
              <div key={`${p.lng}-${p.lat}`} className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={10} className="text-emerald-500" />
                <span>{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-3">退货地域热力图</h3>
      <div ref={containerRef} className="rounded-lg overflow-hidden" style={{ height }} />
      {!mapLoaded && (
        <div className="flex items-center justify-center text-xs text-slate-400 mt-2">
          地图加载中...
        </div>
      )}
    </div>
  )
}
