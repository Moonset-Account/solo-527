import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { eventsAPI, checkpointsAPI } from '../api';
import type { SafetyEvent, Checkpoint } from '../types';
import dayjs from 'dayjs';
import { levelConfig, statusConfig } from '../utils';

const levelColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const MapPage = () => {
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, checkpointsRes] = await Promise.all([
        eventsAPI.getList({ page_size: 100 }),
        checkpointsAPI.getList(),
      ]);
      setEvents(eventsRes.items);
      setCheckpoints(checkpointsRes);
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = events.filter(e => {
    if (filterLevel !== 'all' && e.level !== filterLevel) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    return true;
  });

  const center: [number, number] = checkpoints.length > 0
    ? [Number(checkpoints[0].lat), Number(checkpoints[0].lng)]
    : [39.9042, 116.4074];

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">点位地图</h1>
        <p className="text-gray-500">查看签到点分布和事件地理位置</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">事件等级:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">全部</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">紧急</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">事件状态:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">全部</option>
              <option value="unconfirmed">未确认</option>
              <option value="processing">处理中</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {checkpoints.map(cp => (
            <Marker
              key={cp.id}
              position={[Number(cp.lat), Number(cp.lng)]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color:#1e40af;color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;box-shadow:0 2px 4px rgba(0,0,0,0.2);">📍 ${cp.name}</div>`,
                iconSize: [100, 30],
                iconAnchor: [50, 30],
              })}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{cp.name}</div>
                  <div className="text-gray-500">{cp.description}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {filteredEvents.map(event => (
            event.location_lat && event.location_lng && (
              <Circle
                key={event.id}
                center={[Number(event.location_lat), Number(event.location_lng)]}
                radius={30}
                pathOptions={{
                  color: levelColors[event.level],
                  fillColor: levelColors[event.level],
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <div className="font-semibold text-gray-800 mb-1">{event.title}</div>
                    <div className="flex gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${levelConfig[event.level].bgColor} ${levelConfig[event.level].color}`}>
                        {levelConfig[event.level].label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[event.status].bgColor} ${statusConfig[event.status].color}`}>
                        {statusConfig[event.status].label}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      <div>📍 {event.checkpoint_name}</div>
                      <div>👤 {event.teacher_name}</div>
                      <div>🕐 {dayjs(event.actual_occurred_at).format('MM-DD HH:mm')}</div>
                    </div>
                    <a href={`/event/${event.id}`} className="text-primary-600 text-xs hover:underline mt-2 block">
                      查看详情 →
                    </a>
                  </div>
                </Popup>
              </Circle>
            )
          ))}
        </MapContainer>
      </div>

      <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">图例:</span>
          <div className="flex flex-wrap gap-4 mt-2">
            {Object.entries(levelColors).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                <span>{levelConfig[level as keyof typeof levelConfig]?.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>签到点</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
