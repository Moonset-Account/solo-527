"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Building, WorkOrder } from "@/types";
import { formatDateShort } from "@/lib/utils";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrcmR0dXZ4djA3eWEycW16dXd0eTJlMWMifQ.demo-token";

interface MapViewProps {
  buildings: Building[];
  workOrders: WorkOrder[];
  onBuildingClick?: (building: Building) => void;
  height?: string;
}

export default function MapView({
  buildings,
  workOrders,
  onBuildingClick,
  height = "500px",
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [116.4, 39.9],
      zoom: 11,
    });

    newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

    newMap.on("load", () => {
      setLoaded(true);
      map.current = newMap;

      buildings.forEach((building) => {
        const orders = workOrders.filter((o) => o.buildingId === building.id);
        const repeatRate =
          building.totalOrders > 0
            ? (building.repeatCount / building.totalOrders) * 100
            : 0;

        let color = "#2A9D8F";
        if (repeatRate > 10) color = "#E63946";
        else if (repeatRate > 5) color = "#F4A261";

        const size = Math.min(30 + building.totalOrders * 0.3, 50);

        const el = document.createElement("div");
        el.className = "building-marker";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = "50%";
        el.style.backgroundColor = color;
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.color = "white";
        el.style.fontSize = "12px";
        el.style.fontWeight = "600";
        el.style.cursor = "pointer";
        el.style.transition = "transform 0.2s";
        el.textContent = building.totalOrders.toString();

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.1)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2 min-w-48">
            <h4 class="font-semibold text-slate-900 mb-1">${building.name}</h4>
            <p class="text-xs text-slate-500 mb-2">${building.address}</p>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">总工单</span>
                <span class="font-medium">${building.totalOrders}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">复修数</span>
                <span class="font-medium text-orange-600">${building.repeatCount}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">超时数</span>
                <span class="font-medium text-red-600">${building.timeoutCount}</span>
              </div>
            </div>
            ${
              orders.length > 0
                ? `
              <div class="mt-2 pt-2 border-t border-slate-100">
                <p class="text-xs text-slate-500 mb-1">最近工单</p>
                ${orders
                  .slice(0, 2)
                  .map(
                    (o) => `
                  <div class="text-xs py-1">
                    <span class="text-slate-700">${o.repairType}</span>
                    <span class="text-slate-400 ml-2">${formatDateShort(
                      o.createdAt
                    )}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([building.lng, building.lat])
          .setPopup(popup)
          .addTo(newMap);

        if (onBuildingClick) {
          el.addEventListener("click", () => onBuildingClick(building));
        }
      });
    });

    return () => {
      newMap.remove();
    };
  }, [buildings, workOrders, onBuildingClick]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200">
      <div ref={mapContainer} style={{ width: "100%", height }} />
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
            <span className="text-slate-600">复修率 > 10%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
