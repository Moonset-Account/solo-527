'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Info } from 'lucide-react';

interface StudentGeoPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  attendanceRate: number;
}

interface MapboxMapProps {
  students: StudentGeoPoint[];
  onStudentClick?: (studentId: string) => void;
  height?: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrcmR0bW10cjB4NmwydW84eTQ2M2oweXMifQ.demo-token';

export default function MapboxMap({ students, onStudentClick, height = 400 }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const centerLng = students.length > 0 
        ? students.reduce((sum, s) => sum + s.longitude, 0) / students.length 
        : 116.4;
      const centerLat = students.length > 0 
        ? students.reduce((sum, s) => sum + s.latitude, 0) / students.length 
        : 39.9;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [centerLng, centerLat],
        zoom: 12,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsLoaded(true);
        addMarkers();
      });

      map.current.on('error', () => {
        setUseDemoMode(true);
      });
    } catch (e) {
      setUseDemoMode(true);
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (isLoaded && map.current && !useDemoMode) {
      addMarkers();
    }
  }, [students, isLoaded, useDemoMode]);

  const addMarkers = () => {
    if (!map.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    students.forEach((student) => {
      const el = document.createElement('div');
      const riskColors = {
        low: 'bg-green-500',
        medium: 'bg-amber-500',
        high: 'bg-red-500',
      };

      el.className = `w-8 h-8 rounded-full ${riskColors[student.riskLevel]} border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform`;
      el.textContent = student.name.charAt(0);

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 150px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${student.name}</div>
          <div style="font-size: 12px; color: #6b7280;">综合评分: ${student.overallScore}</div>
          <div style="font-size: 12px; color: #6b7280;">出勤率: ${student.attendanceRate}%</div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([student.longitude, student.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onStudentClick?.(student.id);
      });

      markersRef.current.push(marker);
    });
  };

  if (useDemoMode) {
    return (
      <div
        className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border border-gray-200 relative overflow-hidden"
        style={{ height }}
      >
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 400 300">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d1d5db" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d="M0,150 Q100,100 200,150 T400,150" stroke="#93c5fd" strokeWidth="3" fill="none" opacity="0.5" />
            <path d="M0,200 Q150,180 300,200 T400,180" stroke="#86efac" strokeWidth="2" fill="none" opacity="0.5" />
            <circle cx="100" cy="120" r="40" fill="#bfdbfe" opacity="0.4" />
            <circle cx="300" cy="180" r="50" fill="#bbf7d0" opacity="0.4" />
          </svg>
        </div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="p-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-700">学生地理分布</span>
          <span className="text-xs text-gray-400 ml-2">(演示模式)</span>
        </div>
        <div className="flex-1 relative">
          {students.map((student, idx) => {
            const x = 20 + (idx % 5) * 70 + Math.random() * 30;
            const y = 30 + Math.floor(idx / 5) * 60 + Math.random() * 20;
            const riskColors = {
              low: 'bg-green-500',
              medium: 'bg-amber-500',
              high: 'bg-red-500',
            };
            return (
              <button
                key={student.id}
                onClick={() => onStudentClick?.(student.id)}
                className={`absolute w-10 h-10 rounded-full ${riskColors[student.riskLevel]} border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-110 transition-transform`}
                style={{ left: `${x}px`, top: `${y}px` }}
                title={`${student.name} - 评分: ${student.overallScore}`}
              >
                {student.name.charAt(0)}
              </button>
            );
          })}
        </div>
        <div className="p-3 bg-white/80 backdrop-blur-sm border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">低风险</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-gray-600">中风险</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600">高风险</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
