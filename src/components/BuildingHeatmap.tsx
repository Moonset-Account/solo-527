"use client";

import { Building, WorkOrder } from "@/types";
import { formatDateShort } from "@/lib/utils";
import { useState } from "react";

interface BuildingHeatmapProps {
  buildings: Building[];
  workOrders: WorkOrder[];
  onBuildingClick?: (building: Building) => void;
  height?: string;
}

export default function BuildingHeatmap({
  buildings,
  workOrders,
  onBuildingClick,
  height = "500px",
}: BuildingHeatmapProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);

  const lngRange = { min: Math.min(...buildings.map((b) => b.lng)), max: Math.max(...buildings.map((b) => b.lng)) };
  const latRange = { min: Math.min(...buildings.map((b) => b.lat)), max: Math.max(...buildings.map((b) => b.lat)) };

  const padding = 60;
  const mapWidth = 100;
  const mapHeight = 100;

  const lngToX = (lng: number) => {
    return padding + ((lng - lngRange.min) / (lngRange.max - lngRange.min)) * (mapWidth - padding * 2);
  };

  const latToY = (lat: number) => {
    return padding + ((latRange.max - lat) / (latRange.max - latRange.min)) * (mapHeight - padding * 2);
  };

  const getBuildingColor = (building: Building) => {
    const orders = workOrders.filter((o) => o.buildingId === building.id);
    const repeatRate = orders.length > 0 ? (orders.filter((o) => o.isRepeat).length / orders.length) * 100 : 0;
    if (repeatRate > 10) return "#E63946";
    if (repeatRate > 5) return "#F4A261";
    return "#2A9D8F";
  };

  const getBuildingSize = (building: Building) => {
    const orders = workOrders.filter((o) => o.buildingId === building.id);
    return Math.min(20 + orders.length * 0.8, 45);
  };

  const getBuildingOrders = (building: Building) => {
    return workOrders.filter((o) => o.buildingId === building.id);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50" style={{ height }}>
      <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

        {buildings.map((building) => {
          const x = lngToX(building.lng);
          const y = latToY(building.lat);
          const size = getBuildingSize(building);
          const color = getBuildingColor(building);
          const orders = getBuildingOrders(building);
          const isSelected = selectedBuilding?.id === building.id;
          const isHovered = hoveredBuilding?.id === building.id;

          return (
            <g key={building.id}>
              <circle
                cx={x}
                cy={y}
                r={size / 2 + 3}
                fill={color}
                fillOpacity={isHovered || isSelected ? 0.2 : 0.1}
              />
              <circle
                cx={x}
                cy={y}
                r={size / 2}
                fill={color}
                stroke="white"
                strokeWidth={isSelected ? 2.5 : 1.5}
                style={{ cursor: onBuildingClick ? "pointer" : "default", transition: "all 0.2s" }}
                onMouseEnter={() => setHoveredBuilding(building)}
                onMouseLeave={() => setHoveredBuilding(null)}
                onClick={() => {
                  setSelectedBuilding(building);
                  onBuildingClick?.(building);
                }}
              />
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={size / 4}
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {orders.length}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredBuilding && (
        <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-3 min-w-56 border border-slate-200 z-10">
          <h4 className="font-semibold text-slate-900 mb-1">{hoveredBuilding.name}</h4>
          <p className="text-xs text-slate-500 mb-2">{hoveredBuilding.address}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">总工单</span>
              <span className="font-medium">{getBuildingOrders(hoveredBuilding).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">复修数</span>
              <span className="font-medium text-orange-600">
                {getBuildingOrders(hoveredBuilding).filter((o) => o.isRepeat).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">超时数</span>
              <span className="font-medium text-red-600">
                {getBuildingOrders(hoveredBuilding).filter(
                  (o) => o.responseTime && o.responseTime > 120 && !o.isHoliday
                ).length}
              </span>
            </div>
          </div>
          {getBuildingOrders(hoveredBuilding).length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">最近工单</p>
              {getBuildingOrders(hoveredBuilding)
                .slice(0, 2)
                .map((o) => (
                  <div key={o.id} className="text-xs py-1">
                    <span className="text-slate-700">{o.repairType}</span>
                    <span className="text-slate-400 ml-2">{formatDateShort(o.createdAt)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl px-3 py-2 text-xs shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-600">复修率 ≤ 5%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-600">5%-10%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-600">复修率 {">"} 10%</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-xl px-3 py-2 text-xs shadow-sm">
        <span className="text-slate-500">楼栋分布热力图 · 点击楼栋下钻</span>
      </div>
    </div>
  );
}
