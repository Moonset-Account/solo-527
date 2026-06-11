"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Gauge,
  Route,
  Battery,
  Signal,
  RefreshCw,
  Users,
  Package,
  AlertTriangle,
  Play,
  Pause,
  Maximize2,
  Layers,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, DotIndicator } from "@/components/ui/StatusBadge";
import { formatDate, formatDistance, formatDuration, formatRelativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import { TrackingMap } from "@/components/monitoring/TrackingMap";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(
  () => import("@/components/monitoring/TrackingMap").then((mod) => mod.TrackingMap),
  { ssr: false }
);

export default function TrackingPage() {
  const { orders, riders, updateRiderLocation, fetchRiders, fetchOrders, useSupabase } = useDashboardStore();

  useEffect(() => {
    if (useSupabase) {
      fetchRiders();
      fetchOrders();
    }
  }, [useSupabase, fetchRiders, fetchOrders]);

  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [mapType, setMapType] = useState<"normal" | "satellite" | "terrain">("normal");

  const deliveringRiders = riders.filter((r) => r.status === "delivering" || r.status === "busy");
  const activeRider = riders.find((r) => r.id === selectedRider) || deliveringRiders[0];

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      deliveringRiders.forEach((rider) => {
        if (rider.currentLocation) {
          const latOffset = (Math.random() - 0.5) * 0.001;
          const lngOffset = (Math.random() - 0.5) * 0.001;
          const newSpeed = Math.random() * 40 + 10;

          updateRiderLocation(rider.id, {
            lat: rider.currentLocation.lat + latOffset,
            lng: rider.currentLocation.lng + lngOffset,
            speed: newSpeed,
            timestamp: new Date(),
          });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, deliveringRiders, updateRiderLocation]);

  const activeOrder = activeRider?.currentOrderId
    ? orders.find((o) => o.id === activeRider.currentOrderId)
    : null;

  return (
    <div className="space-y-6 h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">轨迹监控</h1>
          <p className="text-sm text-slate-500 mt-1">实时监控骑手位置和配送轨迹</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isAutoRefresh ? "primary" : "outline"}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            leftIcon={isAutoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          >
            {isAutoRefresh ? "暂停刷新" : "自动刷新"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTrail(!showTrail)}
            leftIcon={<Route className="h-4 w-4" />}
          >
            {showTrail ? "隐藏轨迹" : "显示轨迹"}
          </Button>
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            {(["normal", "satellite", "terrain"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMapType(type)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  mapType === type
                    ? "bg-brand-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {type === "normal" ? "标准" : type === "satellite" ? "卫星" : "地形"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-indigo-400">
                  {deliveringRiders.length}
                </p>
                <p className="text-xs text-slate-500">配送中骑手</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-emerald-400">
                  {orders.filter((o) => o.status === "delivering").length}
                </p>
                <p className="text-xs text-slate-500">配送中订单</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                <Gauge className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-blue-400">
                  {deliveringRiders.length > 0
                    ? (
                        deliveringRiders.reduce(
                          (sum, r) => sum + (r.currentLocation?.speed || 0),
                          0
                        ) / deliveringRiders.length
                      ).toFixed(1)
                    : "0"}
                </p>
                <p className="text-xs text-slate-500">平均速度 (km/h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-amber-950/50 border border-amber-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-900/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-amber-400">
                  {riders.filter((r) => (r.batteryLevel || 100) < 20).length}
                </p>
                <p className="text-xs text-slate-500">低电量预警</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-6 flex-1 min-h-0">
        <Card className="col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>骑手列表</CardTitle>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <DotIndicator color="success" pulse={isAutoRefresh} />
              <span>{isAutoRefresh ? "实时定位" : "已暂停"}</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="divide-y divide-slate-700/50">
              {deliveringRiders.map((rider) => {
                const riderOrder = rider.currentOrderId
                  ? orders.find((o) => o.id === rider.currentOrderId)
                  : null;
                const isSelected = selectedRider === rider.id || (!selectedRider && deliveringRiders[0]?.id === rider.id);

                return (
                  <div
                    key={rider.id}
                    onClick={() => setSelectedRider(rider.id)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      isSelected
                        ? "bg-brand-500/10 border-l-2 border-brand-500"
                        : "hover:bg-slate-800/50 border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-medium">
                          {rider.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success-500 border-2 border-slate-900 flex items-center justify-center">
                          <Navigation className="h-2 w-2 text-white rotate-45" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{rider.name}</p>
                          <StatusBadge status={rider.status} />
                        </div>
                        {riderOrder && (
                          <p className="text-xs text-slate-500 font-mono mt-1 truncate">
                            {riderOrder.orderNo}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Gauge className="h-3 w-3" />
                            <span>{(rider.currentLocation?.speed || 0).toFixed(0)} km/h</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Battery className="h-3 w-3" />
                            <span
                              className={cn(
                                (rider.batteryLevel || 100) < 20
                                  ? "text-danger-500"
                                  : (rider.batteryLevel || 100) < 50
                                  ? "text-warning-500"
                                  : "text-success-500"
                              )}
                            >
                              {rider.batteryLevel || 100}%
                            </span>
                          </div>
                        </div>
                        {riderOrder && (
                          <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs">
                            <div className="flex items-center gap-1 text-slate-400 mb-1">
                              <MapPin className="h-3 w-3 text-brand-500" />
                              <span className="truncate">{riderOrder.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="h-3 w-3" />
                              <span>预计 {formatDate(riderOrder.estimatedDeliveryTime, "HH:mm")}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle>实时地图</CardTitle>
              {activeRider && (
                <p className="text-sm text-slate-500 mt-1">
                  跟踪: <span className="text-slate-300">{activeRider.name}</span>
                  {activeRider.currentLocation && (
                    <span className="ml-2 font-mono text-xs">
                      {activeRider.currentLocation.lat.toFixed(6)},{" "}
                      {activeRider.currentLocation.lng.toFixed(6)}
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <RefreshCw className={cn("h-4 w-4", isAutoRefresh && "animate-spin")} />
              </Button>
              <Button variant="ghost" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Layers className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative">
            <LeafletMap
              selectedRiderId={activeRider?.id}
              riders={deliveringRiders}
              orders={orders}
              showTrail={showTrail}
            />

            {activeRider && activeRider.currentLocation && (
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-3">
                <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Gauge className="h-3 w-3" />
                    当前速度
                  </div>
                  <p className="text-xl font-bold font-display text-slate-100">
                    {activeRider.currentLocation.speed.toFixed(1)}
                    <span className="text-xs text-slate-500 ml-1">km/h</span>
                  </p>
                </div>
                <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Route className="h-3 w-3" />
                    累计里程
                  </div>
                  <p className="text-xl font-bold font-display text-slate-100">
                    {(activeRider.todayMileage || 0).toFixed(1)}
                    <span className="text-xs text-slate-500 ml-1">km</span>
                  </p>
                </div>
                <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Signal className="h-3 w-3" />
                    信号强度
                  </div>
                  <p className="text-xl font-bold font-display text-success-500">
                    强
                    <span className="text-xs text-slate-500 ml-1">GPS</span>
                  </p>
                </div>
                <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Clock className="h-3 w-3" />
                    已配送时长
                  </div>
                  <p className="text-xl font-bold font-display text-slate-100 font-mono">
                    {activeRider.currentOrderStartTime
                      ? formatDuration(
                          Math.floor(
                            (new Date().getTime() -
                              new Date(activeRider.currentOrderStartTime).getTime()) /
                              1000
                          )
                        )
                      : "-"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
