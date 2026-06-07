'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { apiClient } from '@/lib/utils/apiClient';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useFilterStore } from '@/lib/store/useFilterStore';
import type { MonitoringSite, Measurement } from '@/types';
import { MAP_CENTER, MAP_ZOOM } from '@/lib/utils/constants';

export default function MapViewPage() {
  const { user } = useAuthStore();
  const { showManual, showAutomatic, showAnomalies, setShowManual, setShowAutomatic, setShowAnomalies } = useFilterStore();
  const [sites, setSites] = useState<MonitoringSite[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const org = user?.role === 'admin' ? undefined : user?.organization;
      const [sitesData, measurementsData] = await Promise.all([
        apiClient.getSites(org) as Promise<MonitoringSite[]>,
        apiClient.getMeasurements({
          organizations: org ? [org] : undefined,
          limit: 1000,
        }) as Promise<{ data: Measurement[]; total: number }>,
      ]);
      setSites(sitesData);
      setMeasurements(measurementsData.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (!mapContainer.current || map.current || sites.length === 0) return;

    try {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

      if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        setMapError('未配置 Mapbox Token，使用网格视图展示');
        return;
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      sites.forEach((site) => {
        const siteMeasurements = measurements.filter(m => m.siteId === site.id);
        const hasAnomaly = siteMeasurements.some(m => m.isAnomaly);

        const el = document.createElement('div');
        el.className = 'w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer';

        if (hasAnomaly) {
          el.style.backgroundColor = '#ef4444';
          el.style.animation = 'pulse 2s infinite';
        } else if (site.type === 'automatic') {
          el.style.backgroundColor = '#0ea5e9';
        } else {
          el.style.backgroundColor = '#f59e0b';
          el.style.borderStyle = 'dashed';
        }

        new mapboxgl.Marker(el)
          .setLngLat([site.longitude, site.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${site.name}</h3>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                  <strong>编码:</strong> ${site.code}
                </p>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                  <strong>河段:</strong> ${site.riverSection}
                </p>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                  <strong>类型:</strong> ${site.type === 'automatic' ? '自动站' : '人工采样'}
                </p>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                  <strong>机构:</strong> ${site.organization}
                </p>
                <p style="font-size: 12px; color: #64748b;">
                  <strong>记录数:</strong> ${siteMeasurements.length} 条
                </p>
                ${hasAnomaly ? '<p style="font-size: 12px; color: #ef4444; margin-top: 8px;">⚠️ 存在异常数据</p>' : ''}
              </div>
            `)
          )
          .addTo(map.current!);
      });
    } catch (error: any) {
      setMapError('地图加载失败: ' + error.message);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [sites, measurements]);

  const filteredSites = sites.filter((site) => {
    if (!showManual && site.type === 'manual') return false;
    if (!showAutomatic && site.type === 'automatic') return false;
    if (showAnomalies) {
      const siteMeasurements = measurements.filter(m => m.siteId === site.id);
      const hasAnomaly = siteMeasurements.some(m => m.isAnomaly);
      if (!hasAnomaly) return false;
    }
    return true;
  });

  const stats = {
    total: filteredSites.length,
    manual: filteredSites.filter(s => s.type === 'manual').length,
    automatic: filteredSites.filter(s => s.type === 'automatic').length,
    withAnomalies: filteredSites.filter(s => {
      const siteMeasurements = measurements.filter(m => m.siteId === s.id);
      return siteMeasurements.some(m => m.isAnomaly);
    }).length,
  };

  if (mapError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">地图监测</h1>
            <p className="text-slate-500 mt-1">{mapError}</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <MapPin className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">监测站点</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="w-6 h-6 rounded-full bg-amber-500 mx-auto mb-2 border-2 border-dashed border-white" />
              <p className="text-2xl font-bold text-slate-800">{stats.manual}</p>
              <p className="text-xs text-slate-500">人工采样</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="w-6 h-6 rounded-full bg-sky-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{stats.automatic}</p>
              <p className="text-xs text-slate-500">自动站</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{stats.withAnomalies}</p>
              <p className="text-xs text-slate-500">有异常</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-600" />
              站点列表视图
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSites.map((site) => {
                const siteMeasurements = measurements.filter(m => m.siteId === site.id);
                const hasAnomaly = siteMeasurements.some(m => m.isAnomaly);
                return (
                  <div
                    key={site.id}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      hasAnomaly
                        ? 'border-rose-200 bg-rose-50'
                        : site.type === 'automatic'
                        ? 'border-sky-200 bg-sky-50'
                        : 'border-amber-200 bg-amber-50 border-dashed'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-700 text-sm">{site.name}</h4>
                      {hasAnomaly && <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{site.riverSection}</p>
                    <p className="text-xs text-slate-400">{site.organization}</p>
                    <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between text-xs">
                      <span className="text-slate-500">
                        {site.type === 'automatic' ? '自动站' : '人工'}
                      </span>
                      <span className="text-slate-500">
                        {siteMeasurements.length} 条记录
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">地图监测</h1>
          <p className="text-slate-500 mt-1">空间分布与图层控制</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 border border-slate-200">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showManual}
                onChange={(e) => setShowManual(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-slate-600">人工采样</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showAutomatic}
                onChange={(e) => setShowAutomatic(e.target.checked)}
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-slate-600">自动站</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showAnomalies}
                onChange={(e) => setShowAnomalies(e.target.checked)}
                className="rounded border-slate-300 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-slate-600">仅异常</span>
            </label>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
    </div>
  );
}
