import { useEffect, useRef, useState } from 'react';
import * as mapboxgl from 'mapbox-gl';
import type { Station, ODRoute } from '@shared/types';

interface StationMapProps {
  stations: Station[];
  odRoutes?: ODRoute[];
  onStationClick?: (station: Station) => void;
}

export default function StationMap({ stations, odRoutes = [], onStationClick }: StationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [116.4, 39.9],
      zoom: 11,
      accessToken: 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrbm93a2g5djA1a2sydnF1cGpiemR5N2MifQ.demo-token',
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

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
  }, [stations, mapLoaded, onStationClick]);

  useEffect(() => {
    if (!map.current || !mapLoaded || odRoutes.length === 0) return;

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
  }, [odRoutes, stations, mapLoaded]);

  return (
    <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
  );
}
