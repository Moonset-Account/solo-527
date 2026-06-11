"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Clock, Gauge } from "lucide-react";
import type { TrackingPoint, Order } from "@/types";
import { formatDate, formatDistance, formatDuration } from "@/utils/format";
import { cn } from "@/utils/cn";

const riderIcon = L.divIcon({
  className: "rider-marker",
  html: `
    <div class="relative">
      <div class="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center shadow-lg glow-blue">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.6-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h7"></path>
          <circle cx="7" cy="20" r="2"></circle>
          <circle cx="17" cy="20" r="2"></circle>
        </svg>
      </div>
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-brand-500"></div>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

const pickupIcon = L.divIcon({
  className: "pickup-marker",
  html: `
    <div class="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center shadow-lg glow-green">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const deliveryIcon = L.divIcon({
  className: "delivery-marker",
  html: `
    <div class="w-6 h-6 bg-warning-500 rounded-full flex items-center justify-center shadow-lg glow-orange">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

interface TrackingMapProps {
  order?: Order;
  trackingPoints: TrackingPoint[];
  height?: string;
  showControls?: boolean;
}

export function TrackingMap({
  order,
  trackingPoints,
  height = "500px",
  showControls = true,
}: TrackingMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.9042, 116.4074]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (trackingPoints.length > 0) {
      const latestPoint = trackingPoints[trackingPoints.length - 1];
      setMapCenter([latestPoint.lat, latestPoint.lng]);
    } else if (order) {
      setMapCenter([order.pickupLat, order.pickupLng]);
    }
  }, [trackingPoints, order]);

  const routeCoords = trackingPoints.map(
    (p): [number, number] => [p.lat, p.lng]
  );

  if (order) {
    routeCoords.unshift([order.pickupLat, order.pickupLng]);
    routeCoords.push([order.deliveryLat, order.deliveryLng]);
  }

  const totalDistance = trackingPoints.length > 1
    ? trackingPoints.reduce((acc, point, i) => {
        if (i === 0) return 0;
        const prev = trackingPoints[i - 1];
        const R = 6371000;
        const dLat = (point.lat - prev.lat) * Math.PI / 180;
        const dLng = (point.lng - prev.lng) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(prev.lat * Math.PI / 180) *
            Math.cos(point.lat * Math.PI / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return acc + R * c;
      }, 0)
    : 0;

  const avgSpeed = trackingPoints.length > 0
    ? trackingPoints.reduce((acc, p) => acc + p.speed, 0) / trackingPoints.length
    : 0;

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {showControls && (
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isLive
                ? "bg-success-500/20 text-success-500 border border-success-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", isLive && "bg-success-500 animate-pulse-alert")} />
            {isLive ? "实时追踪" : "暂停追踪"}
          </button>
        </div>
      )}

      {trackingPoints.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="h-4 w-4 text-brand-500" />
            <span className="text-slate-400">里程:</span>
            <span className="text-slate-200 font-mono">{formatDistance(totalDistance)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4 text-info-500" />
            <span className="text-slate-400">平均速度:</span>
            <span className="text-slate-200 font-mono">{avgSpeed.toFixed(1)} km/h</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-warning-500" />
            <span className="text-slate-400">轨迹点:</span>
            <span className="text-slate-200 font-mono">{trackingPoints.length}</span>
          </div>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height, width: "100%" }}
        zoomControl={false}
      >
        <MapController center={mapCenter} zoom={13} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {order && (
          <>
            <Marker
              position={[order.pickupLat, order.pickupLng]}
              icon={pickupIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium text-success-500 mb-1">取货点</p>
                  <p className="text-slate-300">{order.pickupAddress}</p>
                </div>
              </Popup>
            </Marker>

            <Marker
              position={[order.deliveryLat, order.deliveryLng]}
              icon={deliveryIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium text-warning-500 mb-1">送货点</p>
                  <p className="text-slate-300">{order.deliveryAddress}</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {trackingPoints.length > 0 && (
          <>
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: "#2563eb",
                weight: 3,
                opacity: 0.8,
                dashArray: "10, 10",
              }}
            />

            <Marker
              position={[
                trackingPoints[trackingPoints.length - 1].lat,
                trackingPoints[trackingPoints.length - 1].lng,
              ]}
              icon={riderIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium text-brand-500 mb-2">骑手实时位置</p>
                  <div className="space-y-1 text-slate-300">
                    <p>
                      <span className="text-slate-500">速度:</span>{" "}
                      {trackingPoints[trackingPoints.length - 1].speed.toFixed(1)} km/h
                    </p>
                    <p>
                      <span className="text-slate-500">时间:</span>{" "}
                      {formatDate(trackingPoints[trackingPoints.length - 1].timestamp, "HH:mm:ss")}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
