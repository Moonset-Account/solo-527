'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { workshops } from '@/lib/mock-data';
import { CrossShopTransfer } from '@/lib/types';
import type { TransferRouteResult } from '@/lib/postgis-queries';

interface WorkshopMapProps {
  transfers: CrossShopTransfer[];
  selectedOrderId?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function WorkshopMap({ transfers }: WorkshopMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const transferMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [routeResults, setRouteResults] = useState<TransferRouteResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransfersFromAPI = useCallback(async () => {
    if (transfers.length === 0) {
      setRouteResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transfers, format: 'routes' }),
      });
      if (res.ok) {
        const data = await res.json();
        setRouteResults(data);
        return data;
      }
    } catch {
      // fallback handled by empty routeResults
    }
    setLoading(false);
  }, [transfers]);

  const fetchGeoJSONFromAPI = useCallback(async () => {
    if (transfers.length === 0) return null;
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transfers, format: 'geojson' }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return null;
  }, [transfers]);

  const drawTransfers = useCallback(async () => {
    const mapInstance = map.current;
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;

    transferMarkersRef.current.forEach((m) => m.remove());
    transferMarkersRef.current = [];

    if (mapInstance.getLayer('transfers-line')) {
      mapInstance.removeLayer('transfers-line');
    }
    if (mapInstance.getSource('transfers')) {
      mapInstance.removeSource('transfers');
    }

    if (transfers.length === 0) return;

    const geojson = await fetchGeoJSONFromAPI();
    if (!geojson || !map.current) return;

    map.current.addSource('transfers', {
      type: 'geojson',
      data: geojson,
    });

    map.current.addLayer({
      id: 'transfers-line',
      type: 'line',
      source: 'transfers',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#f59e0b',
        'line-width': 3,
        'line-opacity': 0.8,
        'line-dasharray': [2, 1],
      },
    });

    const routes = await fetchTransfersFromAPI();
    if (!routes || !map.current) return;

    routes.forEach((route: TransferRouteResult) => {
      if (!route.route_geom || route.route_geom.coordinates.length < 2) {
        const from = workshops.find((w) => w.id === route.from_workshop_id);
        const to = workshops.find((w) => w.id === route.to_workshop_id);
        if (!from || !to) return;
        route.route_geom = {
          type: 'LineString',
          coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
        };
      }

      const coords = route.route_geom.coordinates;
      const midIdx = Math.floor(coords.length / 2);

      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          background: #1e293b; border: 1px solid #f59e0b; border-radius: 6px;
          padding: 4px 8px; font-size: 10px; color: #f59e0b; white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        ">
          <div style="font-weight:600;margin-bottom:2px;">${route.from_name} → ${route.to_name}</div>
          <div>${route.source === 'postgis' ? 'PostGIS' : '本地计算'}: ${route.distance_km}km / 等待${route.wait_time_hours}h</div>
        </div>
      `;
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(coords[midIdx] as [number, number])
        .addTo(map.current!);
      transferMarkersRef.current.push(marker);
    });
  }, [transfers, fetchTransfersFromAPI, fetchGeoJSONFromAPI]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [121.4737, 31.2304],
      zoom: 13,
      accessToken: MAPBOX_TOKEN,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      workshops.forEach((ws) => {
        const el = document.createElement('div');
        el.className = 'workshop-marker';
        el.innerHTML = `
          <div style="
            background: ${ws.currentLoad / ws.capacity > 0.9 ? '#ef4444' : ws.currentLoad / ws.capacity > 0.75 ? '#f59e0b' : '#22c55e'};
            width: 36px; height: 36px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700; color: white;
            border: 2px solid rgba(255,255,255,0.3);
            box-shadow: 0 0 12px rgba(0,0,0,0.5);
            cursor: pointer;
          ">${ws.name.slice(0, 2)}</div>
        `;

        new mapboxgl.Marker({ element: el })
          .setLngLat([ws.lng, ws.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, className: 'custom-popup' }).setHTML(`
              <div style="background:#1e293b;color:#f1f5f9;padding:12px;border-radius:8px;min-width:180px;font-size:12px;">
                <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${ws.name}</div>
                <div>产能: <span style="color:#22c55e">${ws.currentLoad}</span> / ${ws.capacity}</div>
                <div>负载率: <span style="color:${ws.currentLoad / ws.capacity > 0.9 ? '#ef4444' : '#22c55e'}">${((ws.currentLoad / ws.capacity) * 100).toFixed(1)}%</span></div>
              </div>
            `)
          )
          .addTo(map.current!);
      });

      drawTransfers();
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    drawTransfers();
  }, [drawTransfers]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-base">跨车间转单地图</h3>
        <span className="text-xs text-slate-400">
          {loading ? '查询中…' : routeResults.length > 0 && routeResults[0].source === 'postgis' ? 'PostGIS距离 & 等待时间' : '本地计算距离 & 等待时间'}
        </span>
      </div>
      <div ref={mapContainer} className="w-full h-[320px] rounded-lg overflow-hidden" />
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 rounded" />负载&lt;75%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 rounded" />75-90%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 rounded" />&gt;90%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400" />转单路线</span>
      </div>
      {routeResults.length > 0 && (
        <div className="mt-3 border-t border-slate-700/50 pt-3">
          <h4 className="text-slate-400 text-xs font-medium mb-2">
            {routeResults[0]?.source === 'postgis' ? 'PostGIS距离查询结果' : '本地计算距离结果'}
          </h4>
          <div className="space-y-1">
            {routeResults.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="text-amber-400">{d.from_name}</span>
                <span>→</span>
                <span className="text-amber-400">{d.to_name}</span>
                <span className="text-slate-500 ml-auto">{d.distance_km}km / 等待{d.wait_time_hours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
