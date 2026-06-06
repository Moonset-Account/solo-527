"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MOCK_DEPARTMENTS } from "@/mock/data";
import { DepartmentComparisonItem } from "@/types";
import { getWaitColor } from "@/utils";

interface DepartmentMapProps {
  comparisonData: DepartmentComparisonItem[];
  height?: number;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrcmR0dWtlbDF6dG8yb3FrbjV2Y3I4ZnkifQ.demo-token";

export function DepartmentMap({ comparisonData, height = 350 }: DepartmentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapError) return;

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [116.4074, 39.9042],
        zoom: 16,
        pitch: 45,
      });

      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

      mapInstance.on("load", () => {
        MOCK_DEPARTMENTS.forEach((dept) => {
          if (!dept.location) return;

          const deptData = comparisonData.find((d) => d.deptId === dept.id);
          const avgWait = deptData?.avgWaitTotal || 0;
          const color = getWaitColor(avgWait);

          const el = document.createElement("div");
          el.className = "department-marker";
          el.style.width = "36px";
          el.style.height = "36px";
          el.style.borderRadius = "50%";
          el.style.backgroundColor = color;
          el.style.border = "3px solid white";
          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.color = "white";
          el.style.fontSize = "10px";
          el.style.fontWeight = "bold";
          el.style.cursor = "pointer";
          el.textContent = dept.deptName.substring(0, 1);

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 4px 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${dept.deptName}</div>
              <div style="font-size: 12px; color: #666;">楼层: ${dept.floorNumber || "-"}F</div>
              <div style="font-size: 12px; color: #666;">平均等待: ${avgWait}分钟</div>
            </div>
          `);

          new mapboxgl.Marker(el)
            .setLngLat(dept.location.coordinates as [number, number])
            .setPopup(popup)
            .addTo(mapInstance);
        });
      });

      map.current = mapInstance;

      return () => {
        mapInstance.remove();
      };
    } catch (error) {
      setMapError(true);
    }
  }, [comparisonData, mapError]);

  if (mapError) {
    return (
      <div
        style={{ width: "100%", height }}
        className="bg-neutral-50 rounded-lg flex items-center justify-center text-neutral-400 text-sm"
      >
        <div className="text-center">
          <p className="mb-2">地图加载失败</p>
          <p className="text-xs">请配置 Mapbox Token 以启用地图功能</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height, borderRadius: "8px", overflow: "hidden" }}
    />
  );
}
