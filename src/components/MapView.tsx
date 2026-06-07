"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Building, WorkOrder } from "@/types";
import { formatDateShort } from "@/lib/utils";
import BuildingHeatmap from "./BuildingHeatmap";
import { AlertTriangle, Loader2 } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const HAS_VALID_TOKEN = MAPBOX_TOKEN && MAPBOX_TOKEN.length > 20 && !MAPBOX_TOKEN.includes("demo");

interface MapViewProps {
  buildings: (Building & {
    orderCount: number;
    repeatCount: number;
    timeoutCount: number;
    repeatRate: number;
    geomGeojson?: string;
  })[];
  workOrders: WorkOrder[];
  onBuildingClick?: (building: any) => void;
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
  const [tokenError, setTokenError] = useState(false);

  if (!HAS_VALID_TOKEN) {
    return (
      <BuildingHeatmap
        buildings={buildings}
        workOrders={workOrders}
        height={height}
        onBuildingClick={onBuildingClick}
      />
    );
  }

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
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

        const orderPoints = workOrders
          .filter((o) => o.location?.lng && o.location?.lat)
          .map((o) => ({
            type: "Feature" as const,
            properties: {
              id: o.id,
              orderNo: o.orderNo,
              repairType: o.repairType,
              buildingName: o.buildingName,
              isRepeat: o.isRepeat,
              isHoliday: o.isHoliday,
            },
            geometry: {
              type: "Point" as const,
              coordinates: [o.location!.lng, o.location!.lat],
            },
          }));

        if (orderPoints.length > 0) {
          newMap.addSource("orders", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: orderPoints,
            },
            cluster: true,
            clusterRadius: 50,
            clusterMaxZoom: 14,
          });

          newMap.addLayer({
            id: "clusters",
            type: "circle",
            source: "orders",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#2A9D8F",
                10,
                "#F4A261",
                30,
                "#E63946",
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                15,
                10,
                20,
                30,
                28,
              ],
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
            },
          });

          newMap.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "orders",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
            paint: {
              "text-color": "#ffffff",
            },
          });

          newMap.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "orders",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": [
                "case",
                ["boolean", ["get", "isRepeat"], false],
                "#E63946",
                "#2A9D8F",
              ],
              "circle-radius": 6,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });

          newMap.on("click", "clusters", (e) => {
            const features = newMap.queryRenderedFeatures(e.point, {
              layers: ["clusters"],
            });
            const clusterId = features[0].properties?.cluster_id;
            const source = newMap.getSource("orders") as mapboxgl.GeoJSONSource;
            if (source && clusterId !== undefined) {
              source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;
                const coordinates = (features[0].geometry as any).coordinates;
                newMap.easeTo({
                  center: coordinates,
                  zoom: zoom ? zoom + 1 : 14,
                });
              });
            }
          });

          newMap.on("mouseenter", "clusters", () => {
            newMap.getCanvas().style.cursor = "pointer";
          });
          newMap.on("mouseleave", "clusters", () => {
            newMap.getCanvas().style.cursor = "";
          });
          newMap.on("mouseenter", "unclustered-point", () => {
            newMap.getCanvas().style.cursor = "pointer";
          });
          newMap.on("mouseleave", "unclustered-point", () => {
            newMap.getCanvas().style.cursor = "";
          });
        }

        buildings.forEach((building) => {
          const orders = workOrders.filter((o) => o.buildingId === building.id);
          const repeatRate = building.repeatRate || 0;
          const totalOrders = building.orderCount || 0;

          let color = "#2A9D8F";
          if (repeatRate > 10) color = "#E63946";
          else if (repeatRate > 5) color = "#F4A261";

          const size = Math.min(24 + totalOrders * 0.15, 40);

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
          el.style.fontSize = "11px";
          el.style.fontWeight = "600";
          el.style.cursor = "pointer";
          el.style.transition = "transform 0.2s";
          el.style.zIndex = "2";
          el.textContent = totalOrders.toString();

          el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.15)";
          });
          el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
          });

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-3 min-w-52">
              <h4 class="font-semibold text-slate-900 mb-1">${building.name}</h4>
              <p class="text-xs text-slate-500 mb-3">${building.address || ""}</p>
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500">总工单</span>
                  <span class="font-medium text-slate-900">${totalOrders}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">复修数</span>
                  <span class="font-medium text-orange-600">${building.repeatCount || 0}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">复修率</span>
                  <span class="font-medium ${repeatRate > 10 ? "text-red-600" : repeatRate > 5 ? "text-orange-600" : "text-green-600"}">${repeatRate.toFixed(1)}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">超时数</span>
                  <span class="font-medium text-red-600">${building.timeoutCount || 0}</span>
                </div>
              </div>
              ${
                orders.length > 0
                  ? `
                <div class="mt-3 pt-3 border-t border-slate-100">
                  <p class="text-xs text-slate-500 mb-2 font-medium">最近工单</p>
                  ${orders
                    .slice(0, 3)
                    .map(
                      (o) => `
                    <div class="text-xs py-1.5 border-b border-slate-50 last:border-0">
                      <div class="flex justify-between">
                        <span class="text-slate-700">${o.repairType}</span>
                        <span class="text-slate-400">${formatDateShort(
                          o.createdAt
                        )}</span>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              `
                  : ""
              }
              <div class="mt-3 pt-2 border-t border-slate-100">
                <p class="text-xs text-primary-600 font-medium">点击楼栋下钻筛选 →</p>
              </div>
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

      newMap.on("error", (e) => {
        console.warn("Mapbox 加载错误:", e);
        if (e.error?.message?.includes("token") || e.error?.statusCode === 401) {
          setTokenError(true);
        }
      });

      return () => {
        newMap.remove();
      };
    } catch (error) {
      console.warn("Mapbox 初始化失败，降级到热力图:", error);
      setTokenError(true);
    }
  }, [buildings, workOrders, onBuildingClick]);

  if (tokenError) {
    return (
      <BuildingHeatmap
        buildings={buildings}
        workOrders={workOrders}
        height={height}
        onBuildingClick={onBuildingClick}
      />
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
      <div ref={mapContainer} style={{ width: "100%", height }} />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
            <p className="text-sm text-slate-600">正在加载地图...</p>
          </div>
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
        <div className="mt-2 pt-2 border-t border-slate-200 text-slate-500">
          💡 点击聚合点可放大查看单工单
        </div>
      </div>
    </div>
  );
}
