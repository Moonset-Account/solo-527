import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FilterBar from '@/components/filters/FilterBar';
import { api } from '@/services/api';
import { useFilterStore, useMetaStore } from '@/store';
import type { PositionRecord, TemperatureRecord } from '@shared/types';
import { Play, Pause, SkipBack, SkipForward, MapPin, Thermometer } from 'lucide-react';
import dayjs from 'dayjs';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function RouteReplay() {
  const [trackData, setTrackData] = useState<PositionRecord[]>([]);
  const [tempData, setTempData] = useState<TemperatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const { selectedVehicleId } = useFilterStore();
  const { vehicles } = useMetaStore();

  useEffect(() => {
    loadData();
  }, [selectedVehicleId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && trackData.length > 0) {
      interval = setInterval(() => {
        setPlayIndex((prev) => {
          if (prev >= trackData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, trackData.length, playbackSpeed]);

  const loadData = async () => {
    if (!selectedVehicleId) {
      setTrackData([]);
      setTempData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [track, temp] = await Promise.all([
        api.getRouteTrack(selectedVehicleId),
        api.getTemperatureTrend(selectedVehicleId),
      ]);
      setTrackData(track);
      setTempData(temp);
      setPlayIndex(0);
    } catch (error) {
      console.error('Failed to load route data:', error);
    } finally {
      setLoading(false);
    }
  };

  const positions = useMemo(() => 
    trackData.map(p => [p.lat, p.lng] as [number, number]),
    [trackData]
  );

  const currentPosition = trackData[playIndex];
  const currentTemp = tempData.find(t => 
    Math.abs(t.timestamp - (currentPosition?.timestamp || 0)) < 5 * 60 * 1000
  );

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return '#3B82F6';
    if (temp <= 8) return '#22C55E';
    if (temp <= 15) return '#EAB308';
    return '#EF4444';
  };

  const polylineColors = useMemo(() => 
    trackData.map((_, i) => {
      const tempAtPoint = tempData.find(t => 
        Math.abs(t.timestamp - trackData[i].timestamp) < 5 * 60 * 1000
      );
      return getTemperatureColor(tempAtPoint?.temperature || 4);
    }),
    [trackData, tempData]
  );

  const handlePlayPause = () => {
    if (playIndex >= trackData.length - 1) {
      setPlayIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlayIndex(0);
  };

  const handleSkipForward = () => {
    setPlayIndex(Math.min(playIndex + 10, trackData.length - 1));
  };

  const handleSkipBack = () => {
    setPlayIndex(Math.max(playIndex - 10, 0));
  };

  if (!selectedVehicleId) {
    return (
      <div>
        <FilterBar />
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">请选择车辆</h3>
          <p className="text-sm text-gray-400">在上方筛选栏选择车辆以查看路线轨迹</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[500px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-gray-500">加载中...</div>
                </div>
              ) : positions.length > 0 ? (
                <MapContainer
                  center={positions[0]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {currentPosition && <MapController center={[currentPosition.lat, currentPosition.lng]} />}
                  
                  {positions.map((pos, i) => {
                    if (i === 0) return null;
                    return (
                      <Polyline
                        key={i}
                        positions={[positions[i - 1], pos]}
                        color={polylineColors[i]}
                        weight={4}
                        opacity={i <= playIndex ? 1 : 0.3}
                      />
                    );
                  })}

                  {currentPosition && (
                    <Marker position={[currentPosition.lat, currentPosition.lng]}>
                      <Popup>
                        <div className="text-sm">
                          <p className="font-medium">当前位置</p>
                          <p>时间: {dayjs(currentPosition.timestamp).format('MM-DD HH:mm')}</p>
                          <p>速度: {currentPosition.speed.toFixed(0)} km/h</p>
                          {currentTemp && (
                            <p className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3" />
                              温度: {currentTemp.temperature.toFixed(1)}°C
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-gray-500">暂无轨迹数据</div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <SkipBack className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleSkipBack}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <SkipBack className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button
                  onClick={handleSkipForward}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <SkipForward className="w-5 h-5 text-gray-600" />
                </button>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </div>

              <div className="mt-4">
                <input
                  type="range"
                  min={0}
                  max={Math.max(trackData.length - 1, 0)}
                  value={playIndex}
                  onChange={(e) => setPlayIndex(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{trackData[0] ? dayjs(trackData[0].timestamp).format('HH:mm') : '--'}</span>
                  <span>{currentPosition ? dayjs(currentPosition.timestamp).format('MM-DD HH:mm') : '--'}</span>
                  <span>{trackData.length > 0 ? dayjs(trackData[trackData.length - 1].timestamp).format('HH:mm') : '--'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">温度图例</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm text-gray-600">{`< 0°C (过冷)`}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-sm text-gray-600">0-8°C (正常)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span className="text-sm text-gray-600">8-15°C (警告)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-sm text-gray-600">{`> 15°C (异常)`}</span>
              </div>
            </div>
          </div>

          {currentPosition && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">实时数据</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">时间</span>
                  <span className="text-sm font-medium text-gray-800">
                    {dayjs(currentPosition.timestamp).format('HH:mm:ss')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">速度</span>
                  <span className="text-sm font-medium text-gray-800">
                    {currentPosition.speed.toFixed(0)} km/h
                  </span>
                </div>
                {currentTemp && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">温度</span>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: getTemperatureColor(currentTemp.temperature) }}
                    >
                      {currentTemp.temperature.toFixed(1)}°C
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">进度</span>
                  <span className="text-sm font-medium text-gray-800">
                    {trackData.length > 0 ? Math.round((playIndex / (trackData.length - 1)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
