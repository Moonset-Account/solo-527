'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { windows } from '@/data/mockData';
import type { Window } from '@/types';

interface WindowHeatmapData {
  windowId: string;
  windowNo: string;
  windowName: string;
  count: number;
  avgWaitTime: number;
  utilization: number;
  coordinates: [number, number];
}

interface Props {
  data?: WindowHeatmapData[];
  onWindowClick?: (windowNo: string) => void;
}

mapboxgl.accessToken = 'pk.eyJ1IjoicGxhY2Vob2xkZXIiLCJhIjoiY2xhYmVsc2M0MDI5dDN2bXo2M2ozZzBkeiJ9.demo-token-not-required-for-local';

const PHARMACY_CENTER: [number, number] = [116.397, 39.907];

const windowCoordinates: Record<string, [number, number]> = {
  w1: [116.3968, 39.9072],
  w2: [116.3969, 39.9072],
  w3: [116.3970, 39.9072],
  w4: [116.3971, 39.9072],
  w5: [116.39695, 39.9070],
  w6: [116.39705, 39.9070],
};

export default function PharmacyHeatmap({ data, onWindowClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#f8fafc',
            },
          },
        ],
      },
      center: PHARMACY_CENTER,
      zoom: 18,
      pitch: 0,
      interactive: true,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.current.on('load', () => {
      renderMarkers();
    });

    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (map.current?.loaded()) {
      renderMarkers();
    }
  }, [data]);

  const renderMarkers = () => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    const heatmapData = data || generateMockHeatmapData();

    heatmapData.forEach((item) => {
      const coords = windowCoordinates[item.windowId] || PHARMACY_CENTER;
      const intensity = Math.min(1, item.utilization / 100);
      const color = intensity > 0.8 ? '#F53F3F' : intensity > 0.5 ? '#FF7D00' : '#00B42A';

      const el = document.createElement('div');
      el.className = 'window-marker';
      el.style.width = '48px';
      el.style.height = '48px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.opacity = (0.3 + intensity * 0.7).toString();
      el.style.border = '3px solid white';
      el.style.boxShadow = `0 2px 12px ${color}66`;
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';
      el.innerHTML = `
        <div style="color: white; font-weight: 700; font-size: 12px; line-height: 1;">${item.windowNo}</div>
        <div style="color: white; font-size: 9px; opacity: 0.9; line-height: 1; margin-top: 2px;">${item.utilization}%</div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => {
        onWindowClick?.(item.windowNo);
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(mapInstance);

      markers.current.push(marker);
    });
  };

  const generateMockHeatmapData = (): WindowHeatmapData[] => {
    return windows.map((w) => ({
      windowId: w.id,
      windowNo: w.windowNo,
      windowName: w.windowName,
      count: Math.floor(Math.random() * 500) + 100,
      avgWaitTime: Math.floor(Math.random() * 30) + 5,
      utilization: Math.floor(Math.random() * 50) + 40,
      coordinates: windowCoordinates[w.id] || PHARMACY_CENTER,
    }));
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">药房窗口热力分布</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-500">空闲</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-gray-500">繁忙</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-500">过载</span>
          </div>
        </div>
      </div>
      <div ref={mapContainer} style={{ height: '350px', width: '100%', borderRadius: '12px' }} />
      <p className="text-xs text-gray-400 mt-3 text-center">
        点击窗口标记可下钻查看对应窗口的明细数据
      </p>
    </div>
  );
}
