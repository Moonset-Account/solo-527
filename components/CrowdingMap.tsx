"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { getStationCrowdingData, getRoutes, getStations } from "@/lib/dataStore";
import type { Station } from "@/types";
import { ZoomIn, ZoomOut, Move, Info, Layers } from "lucide-react";

interface CrowdingMapProps {
  selectedHour?: number;
  selectedRouteId?: string;
  onStationClick?: (stationId: string) => void;
  height?: string;
}

export default function CrowdingMap({
  selectedHour,
  selectedRouteId,
  onStationClick,
  height = "500px",
}: CrowdingMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredStation, setHoveredStation] = useState<{
    station: any;
    x: number;
    y: number;
  } | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState({
    stations: true,
    routes: true,
    heatmap: true,
  });

  const routes = getRoutes();
  const allStations = getStations();
  const crowdingData = useMemo(
    () => getStationCrowdingData({ hour: selectedHour, includeDetour: false }),
    [selectedHour]
  );

  const canvasWidth = 800;
  const canvasHeight = 600;

  const mapBounds = useMemo(() => {
    if (allStations.length === 0) {
      return { minLng: 116.3, maxLng: 116.5, minLat: 39.85, maxLat: 39.95 };
    }
    const lngs = allStations.map((s) => s.lng);
    const lats = allStations.map((s) => s.lat);
    return {
      minLng: Math.min(...lngs) - 0.01,
      maxLng: Math.max(...lngs) + 0.01,
      minLat: Math.min(...lats) - 0.01,
      maxLat: Math.max(...lats) + 0.01,
    };
  }, [allStations]);

  const lngLatToPixel = useCallback(
    (lng: number, lat: number) => {
      const x =
        ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) *
          canvasWidth *
          viewState.zoom +
        viewState.x;
      const y =
        ((1 - (lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) *
          canvasHeight) *
          viewState.zoom +
        viewState.y;
      return { x, y };
    },
    [mapBounds, viewState]
  );

  const pixelToLngLat = useCallback(
    (x: number, y: number) => {
      const lng =
        ((x - viewState.x) / (canvasWidth * viewState.zoom)) *
          (mapBounds.maxLng - mapBounds.minLng) +
        mapBounds.minLng;
      const lat =
        (1 - (y - viewState.y) / (canvasHeight * viewState.zoom)) *
          (mapBounds.maxLat - mapBounds.minLat) +
        mapBounds.minLat;
      return { lng, lat };
    },
    [mapBounds, viewState]
  );

  const getCrowdingColor = (level: string, alpha = 1) => {
    const colors: Record<string, string> = {
      extreme: `rgba(124, 45, 18, ${alpha})`,
      high: `rgba(239, 68, 68, ${alpha})`,
      medium: `rgba(245, 158, 11, ${alpha})`,
      low: `rgba(16, 185, 129, ${alpha})`,
    };
    return colors[level] || `rgba(156, 163, 175, ${alpha})`;
  };

  const getCrowdingSize = (loadFactor: number) => {
    return 8 + loadFactor * 20;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i / 10) * canvasHeight);
      ctx.lineTo(canvasWidth, (i / 10) * canvasHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((i / 10) * canvasWidth, 0);
      ctx.lineTo((i / 10) * canvasWidth, canvasHeight);
      ctx.stroke();
    }

    if (showLayers.heatmap) {
      crowdingData.forEach((station) => {
        const pos = lngLatToPixel(station.lng, station.lat);
        const size = getCrowdingSize(station.avgLoadFactor) * 2;

        const gradient = ctx.createRadialGradient(
          pos.x,
          pos.y,
          0,
          pos.x,
          pos.y,
          size * 2
        );
        gradient.addColorStop(0, getCrowdingColor(station.crowdingLevel, 0.3));
        gradient.addColorStop(0.5, getCrowdingColor(station.crowdingLevel, 0.1));
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (showLayers.routes) {
      routes.forEach((route) => {
        const isSelected = selectedRouteId === route.id;
        const isFiltered = selectedRouteId && selectedRouteId !== route.id;

        if (isFiltered) return;

        const points = route.stations.map((s) => lngLatToPixel(s.lng, s.lat));

        if (points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = route.color;
          ctx.lineWidth = isSelected ? 4 : 2;
          ctx.globalAlpha = isFiltered ? 0.2 : 0.7;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
    }

    if (showLayers.stations) {
      crowdingData.forEach((station) => {
        const pos = lngLatToPixel(station.lng, station.lat);
        const size = getCrowdingSize(station.avgLoadFactor);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size + 2, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = getCrowdingColor(station.crowdingLevel, 1);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (selectedStation === station.stationId) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, size + 6, 0, Math.PI * 2);
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });
    }
  }, [
    crowdingData,
    routes,
    lngLatToPixel,
    selectedRouteId,
    selectedStation,
    showLayers,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - viewState.x,
      y: e.clientY - viewState.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    if (isDragging) {
      setViewState((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    } else {
      let found = null;
      for (const station of crowdingData) {
        const pos = lngLatToPixel(station.lng, station.lat);
        const dist = Math.sqrt(
          Math.pow(canvasX - pos.x, 2) + Math.pow(canvasY - pos.y, 2)
        );
        if (dist < 20) {
          found = { station, x: canvasX, y: canvasY };
          break;
        }
      }
      setHoveredStation(found);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    for (const station of crowdingData) {
      const pos = lngLatToPixel(station.lng, station.lat);
      const dist = Math.sqrt(
        Math.pow(canvasX - pos.x, 2) + Math.pow(canvasY - pos.y, 2)
      );
      if (dist < 20) {
        setSelectedStation(station.stationId);
        onStationClick?.(station.stationId);
        return;
      }
    }
    setSelectedStation(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState((prev) => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(3, prev.zoom * delta)),
    }));
  };

  const handleZoomIn = () => {
    setViewState((prev) => ({
      ...prev,
      zoom: Math.min(3, prev.zoom * 1.2),
    }));
  };

  const handleZoomOut = () => {
    setViewState((prev) => ({
      ...prev,
      zoom: Math.max(0.5, prev.zoom / 1.2),
    }));
  };

  const handleResetView = () => {
    setViewState({ x: 0, y: 0, zoom: 1 });
  };

  const crowdingLabels: Record<string, string> = {
    low: "宽松 (<40%)",
    medium: "适中 (40-69%)",
    high: "拥挤 (70-89%)",
    extreme: "极度拥挤 (≥90%)",
  };

  return (
    <div className="relative h-full w-full" style={{ height }}>
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-slate-50"
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
        />

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
            title="放大"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
            title="重置视图"
          >
            <Move className="w-4 h-4 text-gray-600" />
          </button>
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
                  style={{ backgroundColor: getCrowdingColor(level, 1) }}
                />
                <span className="text-xs text-gray-600">
                  {crowdingLabels[level]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg px-3 py-2 text-xs text-gray-500">
          缩放: {(viewState.zoom * 100).toFixed(0)}%
        </div>

        {hoveredStation && (
          <div
            className="absolute z-10 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px] pointer-events-none"
            style={{
              left: hoveredStation.x + 15,
              top: hoveredStation.y - 10,
            }}
          >
            <h4 className="font-semibold text-gray-900 text-sm mb-2">
              {hoveredStation.station.stationName}
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">平均满载率</span>
                <span
                  className="font-semibold"
                  style={{
                    color: getCrowdingColor(
                      hoveredStation.station.crowdingLevel,
                      1
                    ),
                  }}
                >
                  {Math.round(hoveredStation.station.avgLoadFactor * 100)}%
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">拥挤等级</span>
                <span
                  className="font-semibold"
                  style={{
                    color: getCrowdingColor(
                      hoveredStation.station.crowdingLevel,
                      1
                    ),
                  }}
                >
                  {hoveredStation.station.crowdingLevel === "extreme"
                    ? "极度拥挤"
                    : hoveredStation.station.crowdingLevel === "high"
                      ? "拥挤"
                      : hoveredStation.station.crowdingLevel === "medium"
                        ? "适中"
                        : "宽松"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">今日客流</span>
                <span className="font-semibold text-gray-700">
                  {hoveredStation.station.totalPassengers.toLocaleString()} 人次
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
