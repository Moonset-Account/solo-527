import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { StickyNote, MapPin } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapData {
  area: string
  count: number
  lng: number
  lat: number
}

const CAMPUS_CENTER = { lng: 116.3268, lat: 39.9754 }

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.placeholder'

export default function CampusMap() {
  const { openNotesDrawer } = useAppStore()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapData, setMapData] = useState<MapData[]>([])
  const [tokenInput, setTokenInput] = useState('')
  const [tokenSet, setTokenSet] = useState(false)

  useEffect(() => {
    fetch('/api/analysis/map-data')
      .then((r) => r.json())
      .then(setMapData)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!mapContainer.current || !tokenSet) return

    mapboxgl.accessToken = tokenInput

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [CAMPUS_CENTER.lng, CAMPUS_CENTER.lat],
      zoom: 15.5,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      mapRef.current = map

      map.addSource('appointments', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: mapData.map((d) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [d.lng, d.lat],
            },
            properties: {
              area: d.area,
              count: d.count,
            },
          })),
        },
      })

      map.addLayer({
        id: 'appointment-heat',
        type: 'circle',
        source: 'appointments',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            10, 15,
            100, 40,
            200, 60,
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            10, '#2DD4BF',
            80, '#F59E0B',
            150, '#F97066',
          ],
          'circle-opacity': 0.5,
          'circle-blur': 0.8,
        },
      })

      map.addLayer({
        id: 'appointment-labels',
        type: 'symbol',
        source: 'appointments',
        layout: {
          'text-field': ['concat', ['get', 'area'], '\n', ['to-string', ['get', 'count']], '次'],
          'text-size': 11,
          'text-anchor': 'top',
          'text-offset': [0, 0.5],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      })

      map.on('click', 'appointment-heat', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties as { area: string; count: number }
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="padding:8px;font-size:13px;">
                <strong>${props.area}</strong><br/>
                预约数：<span style="color:#0D9488;font-weight:bold;">${props.count}</span>
              </div>`
            )
            .addTo(map)
        }
      })
    })

    return () => map.remove()
  }, [tokenSet, mapData])

  if (!tokenSet) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">校园地图</h1>
          <p className="text-sm text-zinc-500 mt-0.5">校园预约密度热力图</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-white p-8 shadow-sm text-center space-y-4">
          <MapPin size={40} className="mx-auto text-teal-400" />
          <h2 className="text-lg font-semibold text-zinc-700">配置 Mapbox Access Token</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            请输入您的 Mapbox 公共 Access Token 以加载校园地图。可在
            <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">
              mapbox.com
            </a>
            免费获取。
          </p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="pk.eyJ1Ijoi..."
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
            />
            <button
              onClick={() => { if (tokenInput.trim()) setTokenSet(true) }}
              disabled={!tokenInput.trim()}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
            >
              加载地图
            </button>
          </div>
          {!tokenSet && (
            <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 max-w-lg mx-auto">
              <h3 className="text-xs font-semibold text-zinc-600 mb-2">无需地图 Token 时的数据预览</h3>
              <div className="grid grid-cols-4 gap-2">
                {mapData.map((d) => (
                  <div key={d.area} className="rounded-md border border-zinc-100 bg-white p-2 text-center">
                    <p className="text-xs text-zinc-500">{d.area}</p>
                    <p className="text-lg font-bold text-teal-600">{d.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">校园地图</h1>
          <p className="text-sm text-zinc-500 mt-0.5">校园预约密度热力图</p>
        </div>
        <button
          onClick={() => openNotesDrawer({ targetKey: 'campus:heatmap', label: '校园热力图' })}
          className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 hover:text-teal-600 hover:border-teal-300 transition-colors shadow-sm"
        >
          <StickyNote size={12} /> 备注
        </button>
      </div>
      <div className="rounded-xl border border-zinc-100 overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 160px)' }}>
        <div ref={mapContainer} className="h-full w-full" />
      </div>
    </div>
  )
}
