"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { AnyLayer } from "mapbox-gl";
import { ZoomIn, ZoomOut, Move, Info, Layers, AlertTriangle, Loader2 } from "lucide-react";

interface CrowdingMapProps {
  selectedHour?: number;
  selectedRouteId?: string;
  onStationClick?: (stationId: string) => void;
  height?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const crowdingColors: Record<string, string> = {
  extreme: "#7c2d12",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

interface StationCrowding {
  stationId: string;
  stationName: string;
  lng: number;
  lat: number;
  avgLoadFactor: number;
  crowdingLevel: string;
  totalPassengers: number;
  arrivalCount: number;
}

interface RouteData {
  id: string;
  name: string;
  color: string;
  stations: Array<{ lng: number; lat: number }>;
}

export default function CrowdingMap({
  selectedHour,
  selectedRouteId,
  onStationClick,
  height = "500px",
}: CrowdingMapProps) {
  const mapRef = useRef<any>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState({
    stations: true,
    routes: true,
    heatmap: true,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [crowdingData, setCrowdingData] = useState<StationCrowding[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [allStations, setAllStations] = useState<Array<{ lng: number; lat: number }>>([]);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setTokenError(true);
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);

        const [crowdingRes, routesRes] = await Promise.all([
          fetch(`/api/arrivals?crowdingMode=true${selectedHour !== undefined ? `&hour=${selectedHour}` : ""}${selectedRouteId ? `&routeId=${selectedRouteId}` : ""}`),
          fetch("/api/routes"),
        ]);

        const [crowdingData, routesData] = await Promise.all([
          crowdingRes.json(),
          routesRes.json(),
        ]);

        setCrowdingData(crowdingData || []);
        setRoutes(routesData || []);

        const stations = (crowdingData || []).map((s: StationCrowding) => ({
          lng: s.lng,
          lat: s.lat,
        }));
        setAllStations(stations);
      } catch (error) {
        console.error("加载地图数据失败:", error);
        setCrowdingData([]);
        setRoutes([]);
        setAllStations([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedHour, selectedRouteId]);

  const initialViewState = useMemo(() => {
    if (allStations.length === 0) {
      return {
        longitude: 116.4074,
        latitude: 39.9042,
        zoom: 12,
      };
    }
    const lngs = allStations.map((s) => s.lng);
    const lats = allStations.map((s) => s.lat);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    return {
      longitude: centerLng,
      latitude: centerLat,
      zoom: 12,
    };
  }, [allStations]);

  const stationsGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: crowdingData.map((station) => ({
        type: "Feature" as const,
        properties: {
          stationId: station.stationId,
          stationName: station.stationName,
          avgLoadFactor: station.avgLoadFactor,
          crowdingLevel: station.crowdingLevel,
          totalPassengers: station.totalPassengers,
          arrivalCount: station.arrivalCount,
          color: crowdingColors[station.crowdingLevel] || "#6b7280",
          size: 8 + station.avgLoadFactor * 20,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [station.lng, station.lat],
        },
      })),
    };
  }, [crowdingData]);

  const routesGeoJSON = useMemo(() => {
    const features = routes
      .filter((route) => !selectedRouteId || route.id === selectedRouteId)
      .map((route) => {
        const coordinates = route.stations.map((s) => [s.lng, s.lat]);
        const isSelected = selectedRouteId === route.id;
        return {
          type: "Feature" as const,
          properties: {
            routeId: route.id,
            routeName: route.name,
            color: route.color,
            opacity: selectedRouteId && !isSelected ? 0.2 : 0.7,
            width: isSelected ? 6 : 3,
          },
          geometry: {
            type: "LineString" as const,
            coordinates,
          },
        };
      });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [routes, selectedRouteId]);

  const heatmapGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: crowdingData.map((station) => ({
        type: "Feature" as const,
        properties: {
          weight: station.avgLoadFactor * 10,
          crowdingLevel: station.crowdingLevel,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [station.lng, station.lat],
        },
      })),
    };
  }, [crowdingData]);

  const stationLayerStyle: AnyLayer = useMemo(
    () => ({
      id: "stations-layer",
      type: "circle",
      source: "stations",
      paint: {
        "circle-radius": ["get", "size"],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 1,
      },
    }),
    []
  );

  const routeLayerStyle: AnyLayer = useMemo(
    () => ({
      id: "routes-layer",
      type: "line",
      source: "routes",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["get", "width"],
        "line-opacity": ["get", "opacity"],
      },
    }),
    []
  );

  const heatmapLayerStyle: AnyLayer = useMemo(
    () => ({
      id: "heatmap-layer",
      type: "heatmap",
      source: "heatmap",
      paint: {
        "heatmap-weight": ["get", "weight"],
        "heatmap-intensity": 0.8,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(16, 185, 129, 0)",
          0.2,
          "rgba(16, 185, 129, 0.4)",
          0.4,
          "rgba(245, 158, 11, 0.5)",
          0.6,
          "rgba(239, 68, 68, 0.6)",
          0.8,
          "rgba(124, 45, 18, 0.7)",
          1,
          "rgba(124, 45, 18, 0.8)",
        ],
        "heatmap-radius": 40,
        "heatmap-opacity": 0.6,
      },
    }),
    []
  );

  const handleStationClick = useCallback(
    (e: any) => {
      const feature = e.features?.[0];
      if (feature) {
        const stationId = feature.properties.stationId;
        setSelectedStation(stationId);
        setPopupInfo(feature.properties);
        onStationClick?.(stationId);
      }
    },
    [onStationClick]
  );

  const handleMouseMove = useCallback((e: any) => {
    const feature = e.features?.[0];
    if (feature) {
      setPopupInfo(feature.properties);
    } else {
      setPopupInfo(null);
    }
  }, []);

  const handleMapError = useCallback((e: any) => {
    if (e.error?.status === 401 || e.error?.message?.includes("Unauthorized")) {
      setTokenError(true);
    }
  }, []);

  const crowdingLabels: Record<string, string> = {
    low: "宽松 (<40%)",
    medium: "适中 (40-69%)",
    high: "拥挤 (70-89%)",
    extreme: "极度拥挤 (≥90%)",
  };

  if (tokenError || !MAPBOX_TOKEN) {
    return (
      <div className="relative h-full w-full" style={{ height }}>
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-gray-200 p-8">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Mapbox 配置需要
          </h3>
          <p className="text-gray-600 text-center max-w-md mb-4">
            请在项目根目录的 <code className="px-2 py-1 bg-gray-200 rounded text-sm">.env.local</code> 文件中配置 Mapbox Access Token：
          </p>
          <div className="w-full max-w-md bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
            NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token_here
          </div>
          <p className="text-sm text-gray-500">
            Token 获取地址：
            <a
              href="https://mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-slate-50 rounded-lg border border-gray-200" style={{ height }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-600">加载地图数据中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" style={{ height }}>
      <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={initialViewState}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onLoad={() => setMapLoaded(true)}
          onMouseMove={handleMouseMove}
          onClick={handleStationClick}
          onError={handleMapError}
          interactiveLayerIds={["stations-layer"]}
          attributionControl={false}
        >
          <Source id="heatmap" type="geojson" data={heatmapGeoJSON}>
            {showLayers.heatmap && <Layer {...heatmapLayerStyle} />}
          </Source>

          <Source id="routes" type="geojson" data={routesGeoJSON}>
            {showLayers.routes && <Layer {...routeLayerStyle} />}
          </Source>

          <Source id="stations" type="geojson" data={stationsGeoJSON}>
            {showLayers.stations && <Layer {...stationLayerStyle} />}
          </Source>

          {popupInfo && (
            <Popup
              longitude={
                crowdingData.find(
                  (s) => s.stationId === popupInfo.stationId
                )?.lng || 0
              }
              latitude={
                crowdingData.find(
                  (s) => s.stationId === popupInfo.stationId
                )?.lat || 0
              }
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              offset={[0, -10]}
            >
              <div className="p-3 min-w-[200px]">
                <h4 className="font-bold text-gray-900 mb-2">
                  {popupInfo.stationName}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">平均满载率</span>
                    <span
                      className="font-semibold"
                      style={{ color: popupInfo.color }}
                    >
                      {Math.round(popupInfo.avgLoadFactor * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">拥挤等级</span>
                    <span
                      className="font-semibold"
                      style={{ color: popupInfo.color }}
                    >
                      {popupInfo.crowdingLevel === "extreme"
                        ? "极度拥挤"
                        : popupInfo.crowdingLevel === "high"
                          ? "拥挤"
                          : popupInfo.crowdingLevel === "medium"
                            ? "适中"
                            : "宽松"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">今日客流</span>
                    <span className="font-semibold text-gray-700">
                      {popupInfo.totalPassengers?.toLocaleString?.() || 0} 人次
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">到达班次</span>
                    <span className="font-semibold text-gray-700">
                      {popupInfo.arrivalCount || 0} 班
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          )}

          <NavigationControl position="top-right" showCompass={false} />
          <ScaleControl position="bottom-left" unit="metric" />
          <FullscreenControl position="top-right" />
        </Map>
      </div>

      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">图层</span>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLayers.stations}
              onChange={(e) =>
                setShowLayers((p) => ({ ...p, stations: e.target.checked }))
              }
              className="w-3 h-3 text-blue-600 rounded"
            />
            <span className="text-xs text-gray-600">站点</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLayers.routes}
              onChange={(e) =>
                setShowLayers((p) => ({ ...p, routes: e.target.checked }))
              }
              className="w-3 h-3 text-blue-600 rounded"
            />
            <span className="text-xs text-gray-600">线路</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLayers.heatmap}
              onChange={(e) =>
                setShowLayers((p) => ({ ...p, heatmap: e.target.checked }))
              }
              className="w-3 h-3 text-blue-600 rounded"
            />
            <span className="text-xs text-gray-600">热力图</span>
          </label>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">拥挤度图例</span>
        </div>
        <div className="space-y-1.5">
          {["low", "medium", "high", "extreme"].map((level) => (
            <div key={level} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: crowdingColors[level] }}
              />
              <span className="text-xs text-gray-600">
                {crowdingLabels[level]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
