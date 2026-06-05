import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import L from 'leaflet';

interface Field {
  id: string;
  name: string;
  area: number;
  location: string;
  polygon_coords: [number, number][];
  soil_type: string;
  owner_name: string;
}

export default function Fields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await axios.get('/api/fields');
      setFields(response.data);
    } catch (error) {
      console.error('获取地块列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  const center: [number, number] = [39.908, 116.397];

  const getPolygonColor = (index: number) => {
    const colors = [
      { fill: '#22c55e40', stroke: '#22c55e' },
      { fill: '#3b82f640', stroke: '#3b82f6' },
      { fill: '#f59e0b40', stroke: '#f59e0b' },
      { fill: '#8b5cf640', stroke: '#8b5cf6' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">地块地图</h1>
        <p className="text-gray-500 mt-1">查看合作社所有地块分布和详细信息</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden" style={{ height: '600px' }}>
            <MapContainer
              center={center}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {fields.map((field, index) => {
                if (!field.polygon_coords || field.polygon_coords.length < 3) return null;
                const colors = getPolygonColor(index);
                return (
                  <Polygon
                    key={field.id}
                    positions={field.polygon_coords}
                    pathOptions={{
                      color: colors.stroke,
                      fillColor: colors.fill,
                      fillOpacity: 0.5,
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () => setSelectedField(field)
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{field.name}</p>
                        <p className="text-gray-500">面积：{field.area} 亩</p>
                        <p className="text-gray-500">位置：{field.location}</p>
                        <p className="text-gray-500">所有者：{field.owner_name}</p>
                      </div>
                    </Popup>
                  </Polygon>
                );
              })}
            </MapContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-4">地块列表</h3>
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  onClick={() => setSelectedField(field)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedField?.id === field.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPolygonColor(index).stroke }}
                    />
                    <p className="font-medium text-sm">{field.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {field.area} 亩 · {field.soil_type || '未知土壤'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {selectedField && (
            <div className="card">
              <h3 className="font-semibold mb-3">📍 地块详情</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">地块名称</span>
                  <span className="font-medium">{selectedField.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">面积</span>
                  <span className="font-medium">{selectedField.area} 亩</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">位置</span>
                  <span className="font-medium">{selectedField.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">土壤类型</span>
                  <span className="font-medium">{selectedField.soil_type || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">所有者</span>
                  <span className="font-medium">{selectedField.owner_name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">📋 地块概览</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-3xl font-bold text-green-600">{fields.length}</p>
            <p className="text-sm text-green-600 mt-1">地块总数</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-3xl font-bold text-blue-600">
              {fields.reduce((sum, f) => sum + f.area, 0).toFixed(1)}
            </p>
            <p className="text-sm text-blue-600 mt-1">总面积(亩)</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <p className="text-3xl font-bold text-purple-600">
              {new Set(fields.map(f => f.owner_name)).size}
            </p>
            <p className="text-sm text-purple-600 mt-1">社员数</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl text-center">
            <p className="text-3xl font-bold text-orange-600">
              {new Set(fields.map(f => f.soil_type).filter(Boolean)).size}
            </p>
            <p className="text-sm text-orange-600 mt-1">土壤类型</p>
          </div>
        </div>
      </div>
    </div>
  );
}
