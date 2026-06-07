import { useState, useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Layers, MapPin, AlertTriangle, Droplets, Zap, Info, X, Eye, EyeOff } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import { MOCK_SITES, MOCK_MEASUREMENTS } from '../utils/mockData';
import { MAP_CENTER, MAP_ZOOM, INDICATORS, WATER_QUALITY_GRADES } from '../utils/constants';
import type { MonitoringSite, Measurement } from '../types';
import { getWaterQualityGrade } from '../utils/dataService';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapLayers {
  manual: boolean;
  automatic: boolean;
  anomalies: boolean;
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedSite, setSelectedSite] = useState<MonitoringSite | null>(null);
  const [siteMeasurements, setSiteMeasurements] = useState<Measurement[]>([]);
  const [layers, setLayers] = useState<MapLayers>({
    manual: true,
    automatic: true,
    anomalies: true,
  });
  const [mapError, setMapError] = useState(false);

  const filteredSites = useMemo(() => {
    return MOCK_SITES.filter((site) => {
      if (!layers.manual && site.type === 'manual') return false;
      if (!layers.automatic && site.type === 'automatic') return false;

      if (!layers.anomalies) {
        const hasAnomaly = MOCK_MEASUREMENTS.some(
          (m) => m.siteId === site.id && m.isAnomaly
        );
        if (hasAnomaly) return false;
      }

      return true;
    });
  }, [layers]);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: MAP_CENTER as [number, number],
          zoom: MAP_ZOOM,
          accessToken: MAPBOX_TOKEN,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          addSitesToMap();
        });

        map.current.on('error', () => {
          setMapError(true);
        });
      } catch (e) {
        console.warn('Mapbox 加载失败，使用 fallback 视图:', e);
        setMapError(true);
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (map.current && map.current.loaded()) {
      updateMapLayers();
    }
  }, [layers]);

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const addSitesToMap = () => {
    if (!map.current) return;

    clearMarkers();

    filteredSites.forEach((site) => {
      const siteMeasurementsData = MOCK_MEASUREMENTS.filter((m) => m.siteId === site.id);
      const latestMeasurement = siteMeasurementsData[0];
      const hasAnomaly = siteMeasurementsData.some((m) => m.isAnomaly);
      const grade = latestMeasurement
        ? getWaterQualityGrade('dissolvedOxygen', latestMeasurement.dissolvedOxygen)
        : null;
      const gradeInfo = WATER_QUALITY_GRADES.find((g) => g.grade === grade);

      const el = document.createElement('div');
      el.className = 'site-marker';
      el.style.width = site.type === 'automatic' ? '24px' : '20px';
      el.style.height = site.type === 'automatic' ? '24px' : '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = hasAnomaly ? '#EF4444' : gradeInfo?.color || '#94a3b8';
      el.style.border = `3px solid white`;
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';

      if (site.type === 'automatic') {
        el.style.borderStyle = 'solid';
      } else {
        el.style.borderStyle = 'dashed';
      }

      if (!layers.anomalies && hasAnomaly) {
        el.style.display = 'none';
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => {
        setSelectedSite(site);
        setSiteMeasurements(
          MOCK_MEASUREMENTS.filter((m) => m.siteId === site.id).slice(0, 10)
        );
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([site.longitude, site.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  };

  const updateMapLayers = () => {
    addSitesToMap();
  };

  const toggleLayer = (key: keyof MapLayers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (mapError) {
    return (
      <PageContainer title="地图监测" subtitle="地图服务加载失败">
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-12 text-center">
          <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">地图服务暂不可用</h3>
          <p className="text-slate-500 mb-6">
            配置 VITE_MAPBOX_TOKEN 环境变量以启用地图功能，或使用下方网格视图
          </p>

          <div className="mb-4 flex justify-center gap-2">
            <LayerToggleButton
              label="人工采样"
              active={layers.manual}
              onClick={() => toggleLayer('manual')}
              colorClass="amber"
            />
            <LayerToggleButton
              label="自动站"
              active={layers.automatic}
              onClick={() => toggleLayer('automatic')}
              colorClass="blue"
            />
            <LayerToggleButton
              label="异常点"
              active={layers.anomalies}
              onClick={() => toggleLayer('anomalies')}
              colorClass="rose"
            />
          </div>

          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            {filteredSites.map((site) => {
              const siteMeas = MOCK_MEASUREMENTS.filter((m) => m.siteId === site.id);
              const hasAnomaly = siteMeas.some((m) => m.isAnomaly);
              const latest = siteMeas[0];
              const grade = latest
                ? getWaterQualityGrade('dissolvedOxygen', latest.dissolvedOxygen)
                : null;
              const gradeInfo = WATER_QUALITY_GRADES.find((g) => g.grade === grade) || WATER_QUALITY_GRADES[2];

              return (
                <div
                  key={site.id}
                  className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border-2"
                  style={{
                    borderColor: hasAnomaly ? '#EF4444' : 'transparent',
                    borderStyle: site.type === 'manual' ? 'dashed' : 'solid',
                  }}
                  onClick={() => {
                    setSelectedSite(site);
                    setSiteMeasurements(
                      MOCK_MEASUREMENTS.filter((m) => m.siteId === site.id).slice(0, 10)
                    );
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: hasAnomaly ? '#EF4444' : gradeInfo.color }}
                  >
                    {site.type === 'automatic' ? (
                      <Zap className="w-5 h-5 text-white" />
                    ) : (
                      <Droplets className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{site.name}</p>
                  <p className="text-xs text-slate-500">{site.riverSection}</p>
                  {hasAnomaly && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      存在异常
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="地图监测"
      subtitle="实时查看各采样点分布与水质状况"
      actions={
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg border border-slate-200 p-1 flex items-center gap-1">
            <LayerToggleButton
              label="人工采样"
              active={layers.manual}
              onClick={() => toggleLayer('manual')}
              colorClass="amber"
              icon={<div className="w-2 h-2 rounded-full border-2 border-current border-dashed" />}
            />
            <LayerToggleButton
              label="自动站"
              active={layers.automatic}
              onClick={() => toggleLayer('automatic')}
              colorClass="blue"
              icon={<Zap className="w-3 h-3" />}
            />
            <LayerToggleButton
              label="异常点"
              active={layers.anomalies}
              onClick={() => toggleLayer('anomalies')}
              colorClass="rose"
              icon={<AlertTriangle className="w-3 h-3" />}
            />
          </div>
          <div className="text-xs text-slate-500">
            显示 {filteredSites.length}/{MOCK_SITES.length} 个站点
          </div>
        </div>
      }
    >
      <div className="relative bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
        <div ref={mapContainer} className="w-full h-[600px] bg-gradient-to-br from-cyan-50 to-blue-100" />

        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            水质等级图例
          </h4>
          <div className="flex gap-1">
            {WATER_QUALITY_GRADES.map((grade) => (
              <div key={grade.grade} className="flex flex-col items-center">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: grade.color }}
                  title={grade.description}
                />
                <span className="text-xs text-slate-500 mt-0.5">{grade.grade}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-medium text-slate-700 mb-2">站点类型</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 rounded-full border-2 border-slate-500 border-dashed bg-slate-300" />
              人工采样
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 rounded-full border-2 border-slate-500 bg-slate-300" />
              自动监测站
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              异常站点
            </div>
          </div>
        </div>

        {selectedSite && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50">
              <div>
                <h3 className="font-display font-semibold text-slate-800">{selectedSite.name}</h3>
                <p className="text-xs text-slate-500">{selectedSite.code}</p>
              </div>
              <button
                onClick={() => setSelectedSite(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <InfoItem label="所属河段" value={selectedSite.riverSection} />
                <InfoItem
                  label="监测类型"
                  value={selectedSite.type === 'manual' ? '人工采样' : '自动站'}
                />
                <InfoItem label="采样机构" value={selectedSite.organization} />
                <InfoItem
                  label="站点状态"
                  value={selectedSite.status === 'active' ? '运行中' : '停用'}
                />
              </div>

              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                最新监测数据
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {siteMeasurements.slice(0, 5).map((m) => (
                  <div key={m.id} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-2">
                      {new Date(m.sampleTime).toLocaleString('zh-CN')}
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <MiniMetric label="水温" value={m.temperature} unit="°C" />
                      <MiniMetric label="pH" value={m.ph} unit="" />
                      <MiniMetric label="DO" value={m.dissolvedOxygen} unit="" />
                      <MiniMetric label="NH3" value={m.ammoniaNitrogen} unit="" />
                    </div>
                    {m.isAnomaly && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        {m.anomalyReason || '存在异常'}
                      </div>
                    )}
                    {m.note && (
                      <div className="mt-2 text-xs text-slate-600 bg-amber-50 px-2 py-1 rounded">
                        📝 {m.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

interface LayerToggleButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  colorClass: 'amber' | 'blue' | 'rose';
  icon?: React.ReactNode;
}

function LayerToggleButton({ label, active, onClick, colorClass, icon }: LayerToggleButtonProps) {
  const colorMap = {
    amber: { active: 'bg-amber-100 text-amber-700', inactive: 'text-slate-500 hover:bg-slate-100' },
    blue: { active: 'bg-blue-100 text-blue-700', inactive: 'text-slate-500 hover:bg-slate-100' },
    rose: { active: 'bg-rose-100 text-rose-700', inactive: 'text-slate-500 hover:bg-slate-100' },
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
        active ? colorMap[colorClass].active : colorMap[colorClass].inactive
      }`}
      title={active ? '点击隐藏' : '点击显示'}
    >
      {icon}
      {label}
      {active ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5 opacity-50" />}
    </button>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
    </div>
  );
}

interface MiniMetricProps {
  label: string;
  value: number | null;
  unit: string;
}

function MiniMetric({ label, value, unit }: MiniMetricProps) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-mono font-semibold text-slate-700">
        {value !== null ? value.toFixed(1) : '--'}
        <span className="text-xs font-normal">{unit}</span>
      </p>
    </div>
  );
}
