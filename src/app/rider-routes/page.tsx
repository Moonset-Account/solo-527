"use client";

import { useState, useMemo, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Route,
  User,
  Phone,
  Star,
  Calendar,
  Download,
  Search,
  ArrowUpDown,
  Package,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Map,
  History,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge, DotIndicator } from "@/components/ui/StatusBadge";
import {
  formatDate,
  formatRelativeTime,
  formatDistance,
  formatDuration,
} from "@/utils/format";
import { cn } from "@/utils/cn";

export default function RiderRoutesPage() {
  const { riders, orders, deliveryRoutes, fetchRiders, fetchOrders, fetchDeliveryRoutes, useSupabase } = useDashboardStore();

  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("today");

  const activeRider =
    riders.find((r) => r.id === selectedRider) || riders[0];

  useEffect(() => {
    if (useSupabase) {
      fetchRiders();
      fetchOrders();
    }
  }, [useSupabase, fetchRiders, fetchOrders]);

  useEffect(() => {
    if (useSupabase && activeRider) {
      fetchDeliveryRoutes(activeRider.id);
    }
  }, [useSupabase, activeRider?.id, fetchDeliveryRoutes]);

  const riderStats = useMemo(() => {
    const today = new Date().toDateString();

    return riders.map((rider) => {
      const riderOrders = orders.filter((o) => o.riderId === rider.id);
      const todayDeliveries = riderOrders.filter(
        (o) => new Date(o.createdAt).toDateString() === today
      );
      const completedToday = todayDeliveries.filter(
        (o) => o.status === "completed"
      ).length;
      const onTimeToday = todayDeliveries.filter((o) => {
        if (!o.actualDeliveryTime) return false;
        return new Date(o.actualDeliveryTime) <= new Date(o.estimatedDeliveryTime);
      }).length;

      const onTimeRate =
        todayDeliveries.filter((o) => o.status === "completed").length > 0
          ? (
              (onTimeToday /
                todayDeliveries.filter((o) => o.status === "completed").length) *
              100
            ).toFixed(1)
          : "0.0";

      return {
        rider,
        todayOrders: todayDeliveries.length,
        completedToday,
        onTimeRate,
        totalDistance: rider.todayMileage || 0,
        workingHours: rider.todayWorkingHours || 0,
      };
    });
  }, [riders, orders]);

  const filteredRiderStats = useMemo(() => {
    if (!searchQuery) return riderStats;
    const query = searchQuery.toLowerCase();
    return riderStats.filter(
      (rs) =>
        rs.rider.name.toLowerCase().includes(query) ||
        rs.rider.phone.includes(query)
    );
  }, [riderStats, searchQuery]);

  const activeRiderStats = riderStats.find(
    (rs) => rs.rider.id === activeRider?.id
  );

  const riderDeliveries = useMemo(() => {
    if (!activeRider) return [];
    return orders
      .filter((o) => o.riderId === activeRider.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [activeRider, orders]);

  const riderRoutes = useMemo(() => {
    if (!activeRider) return [];
    return deliveryRoutes
      .filter((r) => r.riderId === activeRider.id)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
  }, [activeRider, deliveryRoutes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">
            司机路线
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            查询骑手配送路线、历史轨迹和配送效率
          </p>
        </div>
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
          导出路线报告
        </Button>
      </div>

      <FilterBar />

      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-slate-100">
                  {riders.length}
                </p>
                <p className="text-xs text-slate-500">在岗骑手</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-emerald-400">
                  {riderStats.reduce((sum, rs) => sum + rs.completedToday, 0)}
                </p>
                <p className="text-xs text-slate-500">今日已完成</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                <Route className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-blue-400">
                  {riderStats.reduce((sum, rs) => sum + rs.totalDistance, 0).toFixed(1)}
                </p>
                <p className="text-xs text-slate-500">总里程 (km)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/50 border border-indigo-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-indigo-400">
                  {riderStats.length > 0
                    ? (
                        riderStats.reduce((sum, rs) => sum + parseFloat(rs.onTimeRate), 0) /
                        riderStats.length
                      ).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-xs text-slate-500">平均履约率</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-amber-950/50 border border-amber-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-900/50 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-amber-400">
                  {riders.length > 0
                    ? (riders.reduce((sum, r) => sum + r.rating, 0) / riders.length).toFixed(1)
                    : 0}
                </p>
                <p className="text-xs text-slate-500">平均评分</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>骑手列表</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="搜索骑手姓名、电话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="divide-y divide-slate-700/50">
              {filteredRiderStats.map(({ rider, todayOrders, completedToday, onTimeRate }) => {
                const isSelected = rider.id === activeRider?.id;
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
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-medium text-lg">
                          {rider.name.charAt(0)}
                        </div>
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900",
                            rider.status === "idle"
                              ? "bg-success-500"
                              : rider.status === "delivering"
                              ? "bg-brand-500 animate-pulse"
                              : rider.status === "busy"
                              ? "bg-warning-500"
                              : "bg-slate-500"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{rider.name}</p>
                          <StatusBadge status={rider.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3" />
                          <span>{rider.phone}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="text-center">
                            <p className="text-lg font-bold font-display text-slate-200">
                              {completedToday}/{todayOrders}
                            </p>
                            <p className="text-[10px] text-slate-500">今日单量</p>
                          </div>
                          <div className="text-center">
                            <p
                              className={cn(
                                "text-lg font-bold font-display",
                                parseFloat(onTimeRate) >= 95
                                  ? "text-success-500"
                                  : parseFloat(onTimeRate) >= 85
                                  ? "text-warning-500"
                                  : "text-danger-500"
                              )}
                            >
                              {onTimeRate}%
                            </p>
                            <p className="text-[10px] text-slate-500">履约率</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <Star className="h-3 w-3 text-warning-500 fill-warning-500" />
                              <span className="text-lg font-bold font-display text-slate-200">
                                {rider.rating}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">评分</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {activeRider ? `${activeRider.name} 的配送记录` : "骑手配送记录"}
                </CardTitle>
                {activeRider && (
                  <p className="text-sm text-slate-500 mt-1">
                    电话: {activeRider.phone} · 总配送 {activeRider.totalDeliveries} 单
                  </p>
                )}
              </div>
              <div className="flex items-center bg-slate-800 rounded-lg p-1">
                {(["today", "week", "month"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                      dateRange === range
                        ? "bg-brand-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {range === "today" ? "今日" : range === "week" ? "本周" : "本月"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {activeRiderStats && (
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-700/50">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Package className="h-3 w-3" />
                    订单总数
                  </div>
                  <p className="text-xl font-bold font-display text-slate-100">
                    {activeRiderStats.todayOrders}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <CheckCircle className="h-3 w-3" />
                    已完成
                  </div>
                  <p className="text-xl font-bold font-display text-success-500">
                    {activeRiderStats.completedToday}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Route className="h-3 w-3" />
                    行驶里程
                  </div>
                  <p className="text-xl font-bold font-display text-blue-500">
                    {activeRiderStats.totalDistance.toFixed(1)} km
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Clock className="h-3 w-3" />
                    工作时长
                  </div>
                  <p className="text-xl font-bold font-display text-slate-100">
                    {formatDuration(activeRiderStats.workingHours * 3600)}
                  </p>
                </div>
              </div>
            )}
            <Table>
              <TableHeader className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-700">
                  <TableHead>订单号</TableHead>
                  <TableHead>配送地址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>预计送达</TableHead>
                  <TableHead>实际送达</TableHead>
                  <TableHead>履约状态</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {riderDeliveries.slice(0, 10).map((order) => {
                  const isOnTime =
                    order.actualDeliveryTime &&
                    new Date(order.actualDeliveryTime) <=
                      new Date(order.estimatedDeliveryTime);

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNo}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.deliveryAddress}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDate(order.estimatedDeliveryTime, "HH:mm")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {order.actualDeliveryTime
                          ? formatDate(order.actualDeliveryTime, "HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {order.status === "completed" ? (
                          isOnTime ? (
                            <span className="flex items-center gap-1 text-success-500 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              准时
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-danger-500 text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              超时
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {activeRider && (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-brand-500" />
                历史路线记录
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-700">
                  <TableHead>日期</TableHead>
                  <TableHead>出发时间</TableHead>
                  <TableHead>结束时间</TableHead>
                  <TableHead>订单数</TableHead>
                  <TableHead>行驶里程</TableHead>
                  <TableHead>耗时</TableHead>
                  <TableHead>平均速度</TableHead>
                  <TableHead>操作</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {riderRoutes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDate(route.startTime, "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDate(route.startTime, "HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {route.endTime ? formatDate(route.endTime, "HH:mm") : "-"}
                    </TableCell>
                    <TableCell className="text-center">{route.orderCount}</TableCell>
                    <TableCell className="font-mono">
                      {route.totalDistance !== undefined
                        ? formatDistance(route.totalDistance)
                        : "-"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {route.totalTime
                        ? formatDuration(route.totalTime)
                        : "-"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {route.totalTime && route.totalDistance
                        ? `${(
                            (route.totalDistance / route.totalTime) *
                            3600
                          ).toFixed(1)} km/h`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Map className="h-3 w-3 mr-1" />
                        查看轨迹
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
