import { useEffect, useRef, useState, useMemo } from 'react';
import * as mapboxgl from 'mapbox-gl';
import type { Station, ODRoute } from '@shared/types';

interface StationMapProps {
  stations: Station[];
  odRoutes?: ODRoute[];
  onStationClick?: (station: Station) => void;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrbm93a2g5djA1a2sydnF1cGpiemR5N2MifQ.demo-token';

export default function StationMap({ stations, odRoutes = [], onStationClick }: StationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [116.4, 39.9],
        zoom: 11,
        accessToken: MAPBOX_TOKEN,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(false);
      });

      map.current.on('error', (e) => {
        console.warn('Mapbox加载失败，使用降级视图', e);
        setMapError(true);
      });

      const timeout = setTimeout(() => {
        if (!mapLoaded) {
          setMapError(true);
        }
      }, 5000);

      return () => {
        clearTimeout(timeout);
        map.current?.remove();
      };
    } catch (e) {
      console.warn('Mapbox初始化失败，使用降级视图', e);
      setMapError(true);
    }
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || mapError) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const ratio = station.availableBikes / station.capacity;
      let color = '#10B981';
      if (ratio < 0.1) color = '#EF4444';
      else if (ratio < 0.3) color = '#F59E0B';
      else if (ratio > 0.9) color = '#3B82F6';

      const el = document.createElement('div');
      el.className = 'station-marker';
      el.style.width = `${10 + ratio * 10}px`;
      el.style.height = `${10 + ratio * 10}px`;
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid rgba(255,255,255,0.8)';
      el.style.boxShadow = `0 0 ${8 + ratio * 12}px ${color}`;
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';

      const popup = new mapboxgl.Popup({ offset: 15 })
        .setHTML(`
          <div style="padding: 8px; min-width: 160px;">
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${station.name}</div>
            <div style="font-size: 12px; color: #6B7280;">${station.area}</div>
            <div style="margin-top: 8px; display: flex; gap: 12px; font-size: 12px;">
              <div><span style="color: #10B981;">●</span> 可用: ${station.availableBikes}</div>
              <div><span style="color: #EF4444;">●</span> 维修: ${station.maintenanceBikes}</div>
            </div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
              容量: ${station.capacity} | 空位: ${station.availableDocks}
            </div>
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([station.lng, station.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onStationClick?.(station);
      });

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      markersRef.current.push(marker);
    });
  }, [stations, mapLoaded, mapError, onStationClick]);

  useEffect(() => {
    if (!map.current || !mapLoaded || odRoutes.length === 0 || mapError) return;

    const mapInstance = map.current;
    
    if (mapInstance.getSource('od-routes')) {
      mapInstance.removeLayer('od-lines');
      mapInstance.removeSource('od-routes');
    }

    const stationMap = new Map(stations.map(s => [s.name, s]));
    
    const features = odRoutes.slice(0, 20).map(route => {
      const startStations = stations.filter(s => s.area === route.startArea);
      const endStations = stations.filter(s => s.area === route.endArea);
      
      if (startStations.length === 0 || endStations.length === 0) return null;

      const start = startStations[Math.floor(startStations.length / 2)];
      const end = endStations[Math.floor(endStations.length / 2)];
      const midLng = (start.lng + end.lng) / 2;
      const midLat = (start.lat + end.lat) / 2 + 0.02;

      return {
        type: 'Feature' as const,
        properties: {
          count: route.count,
          weight: Math.min(route.count / 50, 5),
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [start.lng, start.lat],
            [midLng, midLat],
            [end.lng, end.lat],
          ],
        },
      };
    }).filter(Boolean);

    mapInstance.addSource('od-routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features as any,
      },
    });

    mapInstance.addLayer({
      id: 'od-lines',
      type: 'line',
      source: 'od-routes',
      paint: {
        'line-color': '#00B4D8',
        'line-opacity': 0.6,
        'line-width': ['get', 'weight'],
        'line-blur': 2,
      },
    });

    return () => {
      if (mapInstance.getSource('od-routes')) {
        mapInstance.removeLayer('od-lines');
        mapInstance.removeSource('od-routes');
      }
    };
  }, [odRoutes, stations, mapLoaded, mapError]);

  const fallbackData = useMemo(() => {
    if (stations.length === 0) return null;
    
    const lngs = stations.map(s => s.lng);
    const lats = stations.map(s => s.lat);
    const minLng = Math.min(...lngs) - 0.05;
    const maxLng = Math.max(...lngs) + 0.05;
    const minLat = Math.min(...lats) - 0.05;
    const maxLat = Math.max(...lats) + 0.05;
    
    const width = 800;
    const height = 500;
    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    
    const toX = (lng: number) => ((lng - minLng) / lngRange) * width;
    const toY = (lat: number) => height - ((lat - minLat) / latRange) * height;

    return { minLng, maxLng, minLat, maxLat, width, height, toX, toY };
  }, [stations]);

  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);

  if (mapError && fallbackData) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs text-amber-300">
          离线地图模式 (Mapbox Token未配置)
        </div>
        
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${fallbackData.width} ${fallbackData.height}`}
          className="w-full h-full"
        >
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <rect width={fallbackData.width} height={fallbackData.height} fill="url(#bgGlow)" />
          
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={(i / 20) * fallbackData.height}
              x2={fallbackData.width}
              y2={(i / 20) * fallbackData.height}
              stroke="#1e293b"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          ))}
          {Array.from({ length: 30 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={(i / 30) * fallbackData.width}
              y1={0}
              x2={(i / 30) * fallbackData.width}
              y2={fallbackData.height}
              stroke="#1e293b"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          ))}

          {odRoutes.slice(0, 20).map((route, i) => {
            const startStations = stations.filter(s => s.area === route.startArea);
            const endStations = stations.filter(s => s.area === route.endArea);
            if (startStations.length === 0 || endStations.length === 0) return null;
            
            const start = startStations[Math.floor(startStations.length / 2)];
            const end = endStations[Math.floor(endStations.length / 2)];
            const x1 = fallbackData.toX(start.lng);
            const y1 = fallbackData.toY(start.lat);
            const x2 = fallbackData.toX(end.lng);
            const y2 = fallbackData.toY(end.lat);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 30;
            const weight = Math.min(route.count / 50, 4) + 1;
            const opacity = Math.min(route.count / 200, 0.7) + 0.2;
            
            return (
              <path
                key={`od-${i}`}
                d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke="#00B4D8"
                strokeWidth={weight}
                strokeOpacity={opacity}
                filter="url(#glow)"
              />
            );
          })}

          {stations.map((station) => {
            const ratio = station.availableBikes / station.capacity;
            let color = '#10B981';
            if (ratio < 0.1) color = '#EF4444';
            else if (ratio < 0.3) color = '#F59E0B';
            else if (ratio > 0.9) color = '#3B82F6';
            const size = 6 + ratio * 8;
            const x = fallbackData.toX(station.lng);
            const y = fallbackData.toY(station.lat);
            const isHovered = hoveredStation?.id === station.id;
            
            return (
              <g key={station.id} className="cursor-pointer">
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r={size + 8}
                    fill={color}
                    fillOpacity="0.2"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? size + 2 : size}
                  fill={color}
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="2"
                  filter="url(#glow)"
                  onMouseEnter={() => setHoveredStation(station)}
                  onMouseLeave={() => setHoveredStation(null)}
                  onClick={() => onStationClick?.(station)}
                />
              </g>
            );
          })}
        </svg>

        {hoveredStation && (
          <div 
            className="absolute z-20 p-3 bg-slate-800/95 border border-slate-600 rounded-lg shadow-xl pointer-events-none"
            style={{
              left: `${Math.min(fallbackData.toX(hoveredStation.lng) / fallbackData.width * 100, 70)}%`,
              top: `${Math.min(fallbackData.toY(hoveredStation.lat) / fallbackData.height * 100, 70)}%`,
              transform: 'translate(10px, -50%)',
            }}
          >
            <div className="font-semibold text-white text-sm">{hoveredStation.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{hoveredStation.area}</div>
            <div className="mt-2 flex gap-3 text-xs">
              <span className="text-emerald-400">可用: {hoveredStation.availableBikes}</span>
              <span className="text-red-400">维修: {hoveredStation.maintenanceBikes}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              容量: {hoveredStation.capacity} | 空位: {hoveredStation.availableDocks}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-400">充足</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-400">紧张</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">告急</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
  );
}
