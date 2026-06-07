import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { generateDistrictAggregations, generateCommunityAggregations } from '@/data/mockData';
import { getPriceColor, formatNumber } from '@/utils/dataUtils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapController() {
  const map = useMap();
  const selectedDistrict = useAppStore(state => state.selectedDistrict);
  const districtAggregations = useAppStore(state =>
    generateDistrictAggregations(state.filteredRecords)
  );

  useEffect(() => {
    if (selectedDistrict) {
      const agg = districtAggregations.find(d => d.district === selectedDistrict);
      if (agg) {
        map.flyTo(agg.center, 12, { duration: 0.8 });
      }
    } else {
      map.flyTo([39.9042, 116.4074], 10, { duration: 0.8 });
    }
  }, [selectedDistrict, map, districtAggregations]);

  return null;
}

export default function PriceMap() {
  const {
    filteredRecords,
    mapView,
    selectedDistrict,
    setSelectedDistrict,
    setShowDetailDrawer
  } = useAppStore();

  const districtAggregations = generateDistrictAggregations(filteredRecords);
  const communityAggregations = generateCommunityAggregations(filteredRecords);

  const allAvgRents = districtAggregations.map(d => d.avgRent);
  const minRent = Math.min(...allAvgRents);
  const maxRent = Math.max(...allAvgRents);

  const anomalyRecords = filteredRecords.filter(r => r.isAnomaly);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[39.9042, 116.4074]}
        zoom={10}
        style={{ height: '100%', width: '100%', background: '#0B1E33' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController />

        {mapView === 'district' && districtAggregations.map(agg => {
          const color = getPriceColor(agg.avgRent, minRent, maxRent);
          const isSelected = selectedDistrict === agg.district;
          const opacity = agg.isLowSample ? 0.3 : 0.6;

          return (
            <Polygon
              key={agg.district}
              positions={agg.boundary}
              pathOptions={{
                color: isSelected ? '#17A2B8' : color,
                weight: isSelected ? 3 : 1,
                fillColor: color,
                fillOpacity: opacity,
                opacity: 1
              }}
              eventHandlers={{
                click: () => {
                  setSelectedDistrict(isSelected ? null : agg.district);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-sm">
                  <div className="font-semibold text-white">{agg.district}</div>
                  <div className="text-gray-300">均价: ¥{formatNumber(agg.avgRent)}/月</div>
                  <div className="text-gray-300">样本量: {agg.sampleCount}</div>
                  {agg.isLowSample && (
                    <div className="text-orange-400 text-xs mt-1">⚠ 样本不足</div>
                  )}
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="text-lg font-semibold text-white mb-2">{agg.district}</h3>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>租金均价: <span className="text-cyan-400">¥{formatNumber(agg.avgRent)}</span>/月</p>
                    <p>租金中位数: ¥{formatNumber(agg.medianRent)}/月</p>
                    <p>单位面积租金: ¥{agg.avgUnitRent}/㎡/月</p>
                    <p>样本量: {agg.sampleCount}</p>
                    <p>平均成交周期: {agg.avgDealCycle}天</p>
                    <p>平均楼龄: {agg.avgBuildingAge}年</p>
                    {agg.isLowSample && (
                      <p className="text-orange-400">⚠ 样本量不足，数据仅供参考</p>
                    )}
                  </div>
                  <button
                    className="mt-3 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-1.5 px-3 rounded text-sm transition-colors"
                    onClick={() => setShowDetailDrawer(true)}
                  >
                    查看详细数据
                  </button>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {mapView === 'community' && communityAggregations.map(agg => {
          const color = getPriceColor(agg.avgRent, minRent, maxRent);
          const radius = Math.max(5, Math.min(15, agg.sampleCount / 10));
          const opacity = agg.isLowSample ? 0.4 : 0.8;

          return (
            <CircleMarker
              key={`${agg.district}-${agg.community}`}
              center={[agg.lat, agg.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: opacity,
                weight: 1
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div className="text-sm">
                  <div className="font-semibold text-white">{agg.community}</div>
                  <div className="text-gray-300">{agg.district}</div>
                  <div className="text-cyan-400">¥{formatNumber(agg.avgRent)}/月</div>
                  <div className="text-gray-400 text-xs">样本: {agg.sampleCount}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {anomalyRecords.slice(0, 100).map(record => (
          <CircleMarker
            key={`anomaly-${record.id}`}
            center={[record.lat, record.lng]}
            radius={4}
            pathOptions={{
              color: '#FD7E14',
              fillColor: '#FD7E14',
              fillOpacity: 0.6,
              weight: 2,
              dashArray: '3, 3'
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <div className="text-orange-400 font-semibold">⚠ 异常样本</div>
                <div className="text-white">{record.community}</div>
                <div className="text-orange-300">租金: ¥{formatNumber(record.rent)}</div>
                <div className="text-gray-400 text-xs">{record.anomalyReason}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="absolute bottom-6 right-6 bg-workbench-surface border border-workbench-border rounded-lg p-4 z-[1000]">
        <h4 className="text-xs font-semibold text-workbench-text-muted mb-3">租金均价</h4>
        <div className="flex items-center gap-2">
          <div className="w-32 h-4 rounded" style={{
            background: 'linear-gradient(to right, hsl(240, 70%, 50%), hsl(40, 70%, 50%))'
          }} />
        </div>
        <div className="flex justify-between text-xs text-workbench-text-muted mt-1">
          <span>¥{formatNumber(minRent)}</span>
          <span>¥{formatNumber(maxRent)}</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 flex gap-3 z-[1000]">
        <div className="bg-workbench-surface border border-workbench-border rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
          <span className="text-xs text-workbench-text-muted">正常区域</span>
        </div>
        <div className="bg-workbench-surface border border-workbench-border rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500 opacity-30"></div>
          <span className="text-xs text-workbench-text-muted">样本不足</span>
        </div>
        <div className="bg-workbench-surface border border-workbench-border rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-xs text-workbench-text-muted">异常点</span>
        </div>
      </div>
    </div>
  );
}
