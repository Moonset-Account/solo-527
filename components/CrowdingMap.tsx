"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { getStationCrowdingData, getRoutes } from "@/lib/dataStore";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2w4djNzM2N2MDQxdzN1bXZ2dG5xMXBteiJ9.fake-token-for-demo";

interface CrowdingMapProps {
  selectedHour?: number;
  selectedRouteId?: string;
  onStationClick?: (stationId: string) => void;
}

export default function CrowdingMap({
  selectedHour,
  selectedRouteId,
  onStationClick,
}: CrowdingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [lng] = useState(116.4074);
  const [lat] = useState(39.9042);
  const [zoom] = useState(12);

  const getCrowdingColor = (level: string) => {
    switch (level) {
      case "extreme":
        return "#7c2d12";
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
      default:
        return "#10b981";
    }
  };

  const getCrowdingSize = (loadFactor: number) => {
    return 15 + loadFactor * 20;
  };

  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lng, lat, zoom]);

  useEffect(() => {
    if (!map.current) return;

    const updateMarkers = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const crowdingData = getStationCrowdingData(undefined, selectedHour);

      const routes = getRoutes();
      const routeColors: Record<string, string> = {};
      routes.forEach((r) => {
        routeColors[r.id] = r.color;
      });

      crowdingData.forEach((station) => {
        const size = getCrowdingSize(station.avgLoadFactor);
        const color = getCrowdingColor(station.crowdingLevel);

        const el = document.createElement("div");
        el.className = "station-marker";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = "50%";
        el.style.backgroundColor = color;
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
        el.style.cursor = "pointer";
        el.style.transition = "transform 0.2s";

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.2)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });

        const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-gray-900 mb-2">${station.stationName}</h3>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">平均满载率</span>
                <span class="font-semibold" style="color: ${color}">${Math.round(
          station.avgLoadFactor * 100
        )}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">拥挤等级</span>
                <span class="font-semibold" style="color: ${color}">
                  ${station.crowdingLevel === "extreme" ? "极度拥挤" : station.crowdingLevel === "high" ? "拥挤" : station.crowdingLevel === "medium" ? "适中" : "宽松"}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">今日客流</span>
                <span class="font-semibold">${station.totalPassengers}人次</span>
              </div>
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([station.lng, station.lat])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener("click", () => {
          onStationClick?.(station.stationId);
        });

        markersRef.current.push(marker);
      });

      routes.forEach((route) => {
        if (route.stations.length >= 2) {
          const coordinates = route.stations.map((s) => [s.lng, s.lat] as [number, number]);

          const geojson: any = {
            type: "Feature",
            properties: {
              routeId: route.id,
              routeName: route.name,
            },
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
          };

          if (!map.current!.getSource(`route-${route.id}`)) {
            map.current!.addSource(`route-${route.id}`, {
              type: "geojson",
              data: geojson,
            });

            map.current!.addLayer({
              id: `route-line-${route.id}`,
              type: "line",
              source: `route-${route.id}`,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": route.color,
                "line-width": selectedRouteId === route.id ? 6 : 3,
                "line-opacity": selectedRouteId && selectedRouteId !== route.id ? 0.2 : 0.6,
              },
            });
          } else {
            const source = map.current!.getSource(`route-${route.id}`) as mapboxgl.GeoJSONSource;
            source.setData(geojson);

            map.current!.setPaintProperty(
              `route-line-${route.id}`,
              "line-width",
              selectedRouteId === route.id ? 6 : 3
            );
            map.current!.setPaintProperty(
              `route-line-${route.id}`,
              "line-opacity",
              selectedRouteId && selectedRouteId !== route.id ? 0.2 : 0.6
            );
          }
        }
      });
    };

    if (map.current.loaded()) {
      updateMarkers();
    } else {
      map.current.on("load", updateMarkers);
    }

    return () => {
      if (map.current) {
        map.current.off("load", updateMarkers);
      }
    };
  }, [selectedHour, selectedRouteId, onStationClick]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full rounded-lg overflow-hidden" />

      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">拥挤度图例</h4>
        <div className="space-y-2">
          {[
            { label: "宽松 (<40%)", color: "#10b981" },
            { label: "适中 (40-69%)", color: "#f59e0b" },
            { label: "拥挤 (70-89%)", color: "#ef4444" },
            { label: "极度拥挤 (≥90%)", color: "#7c2d12" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
