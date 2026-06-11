"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Bell,
  BellOff,
  Settings,
  RefreshCw,
  Download,
  Package,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge, DotIndicator } from "@/components/ui/StatusBadge";
import { formatDate, formatRelativeTime, formatDuration } from "@/utils/format";
import { cn } from "@/utils/cn";
import { TemperaturePanel } from "@/components/monitoring/TemperaturePanel";

export default function TemperaturePage() {
  const { orders, temperatureLogs, updateTemperatureLog, fetchOrders, useSupabase } = useDashboardStore();

  useEffect(() => {
    if (useSupabase) {
      fetchOrders();
    }
  }, [useSupabase, fetchOrders]);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const tempControlOrders = useMemo(
    () => orders.filter((o) => o.temperatureRequired),
    [orders]
  );

  const activeOrder = tempControlOrders.find((o) => o.id === selectedOrder) || tempControlOrders[0];

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      tempControlOrders.forEach((order) => {
        if (order.status === "delivering" || order.status === "accepted") {
          const currentTemp =
            (order.temperatureRequired?.min || 0) +
            (order.temperatureRequired?.max || 10) / 2 +
            (Math.random() - 0.5) * 8;
          const currentHumidity = 40 + Math.random() * 30;

          const isAbnormal =
            order.temperatureRequired &&
            (currentTemp < order.temperatureRequired.min - 2 ||
              currentTemp > order.temperatureRequired.max + 2);

          updateTemperatureLog(order.id, {
            temperature: currentTemp,
            humidity: currentHumidity,
            timestamp: new Date(),
            isAbnormal,
          });
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, tempControlOrders, updateTemperatureLog]);

  const stats = useMemo(() => {
    const total = tempControlOrders.length;
    const active = tempControlOrders.filter(
      (o) => o.status === "delivering" || o.status === "accepted"
    ).length;

    const abnormalCount = temperatureLogs.filter(
      (log) =>
        log.isAbnormal &&
        new Date(log.timestamp).toDateString() === new Date().toDateString()
    ).length;

    const avgTemp =
      temperatureLogs.length > 0
        ? temperatureLogs.reduce((sum, log) => sum + log.temperature, 0) /
          temperatureLogs.length
        : 0;

    const avgHumidity =
      temperatureLogs.length > 0
        ? temperatureLogs.reduce((sum, log) => sum + log.humidity, 0) /
          temperatureLogs.length
        : 0;

    return { total, active, abnormalCount, avgTemp, avgHumidity };
  }, [tempControlOrders, temperatureLogs]);

  const orderTemperatureMap = useMemo(() => {
    const map: Record<string, typeof temperatureLogs> = {};
    tempControlOrders.forEach((order) => {
      map[order.id] = temperatureLogs
        .filter((log) => log.orderId === order.id)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    });
    return map;
  }, [tempControlOrders, temperatureLogs]);

  const getOrderStatusInfo = (orderId: string) => {
    const logs = orderTemperatureMap[orderId] || [];
    const latest = logs[0];
    const order = tempControlOrders.find((o) => o.id === orderId);

    if (!latest || !order) {
      return { status: "normal" as const, currentTemp: null, currentHumidity: null, message: "暂无数据" };
    }

    if (latest.isAbnormal) {
      return {
        status: "abnormal" as const,
        currentTemp: latest.temperature,
        currentHumidity: latest.humidity,
        message: "温度异常",
      };
    }

    const { min, max } = order.temperatureRequired || { min: 0, max: 10 };
    if (latest.temperature < min || latest.temperature > max) {
      return {
        status: "warning" as const,
        currentTemp: latest.temperature,
        currentHumidity: latest.humidity,
        message: "接近阈值",
      };
    }

    return {
      status: "normal" as const,
      currentTemp: latest.temperature,
      currentHumidity: latest.humidity,
      message: "温度正常",
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">温控监控</h1>
          <p className="text-sm text-slate-500 mt-1">实时监控冷链货物温度和湿度数据</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={alertEnabled ? "primary" : "outline"}
            size="sm"
            onClick={() => setAlertEnabled(!alertEnabled)}
            leftIcon={alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          >
            {alertEnabled ? "报警开启" : "报警关闭"}
          </Button>
          <Button
            variant={isAutoRefresh ? "primary" : "outline"}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            leftIcon={<RefreshCw className={cn("h-4 w-4", isAutoRefresh && "animate-spin")} />}
          >
            {isAutoRefresh ? "自动刷新" : "已暂停"}
          </Button>
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              卡片视图
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                viewMode === "list"
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              列表视图
            </button>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            导出报告
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <Package className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-slate-100">{stats.total}</p>
                <p className="text-xs text-slate-500">温控订单</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-blue-400">{stats.active}</p>
                <p className="text-xs text-slate-500">运输中</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-danger-900/30 to-danger-950/50 border border-danger-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger-900/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-danger-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-danger-400">
                  {stats.abnormalCount}
                </p>
                <p className="text-xs text-slate-500">今日异常</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/50 border border-cyan-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-900/50 flex items-center justify-center">
                <Thermometer className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-cyan-400">
                  {stats.avgTemp.toFixed(1)}°C
                </p>
                <p className="text-xs text-slate-500">平均温度</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/50 border border-indigo-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center">
                <Droplets className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-indigo-400">
                  {stats.avgHumidity.toFixed(0)}%
                </p>
                <p className="text-xs text-slate-500">平均湿度</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-6">
          {tempControlOrders.map((order) => {
            const statusInfo = getOrderStatusInfo(order.id);
            const logs = orderTemperatureMap[order.id] || [];
            const isSelected = order.id === selectedOrder || (!selectedOrder && tempControlOrders[0]?.id === order.id);

            return (
              <Card
                key={order.id}
                onClick={() => setSelectedOrder(order.id)}
                className={cn(
                  "cursor-pointer transition-all hover:border-brand-500/50",
                  isSelected && "border-brand-500/50 ring-2 ring-brand-500/20"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          statusInfo.status === "abnormal"
                            ? "bg-danger-900/50 text-danger-400"
                            : statusInfo.status === "warning"
                            ? "bg-warning-900/50 text-warning-400"
                            : "bg-success-900/50 text-success-400"
                        )}
                      >
                        {statusInfo.status === "abnormal" ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : statusInfo.status === "warning" ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium font-mono">{order.orderNo}</p>
                        <p className="text-xs text-slate-500">{order.goodsType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={order.status} />
                      <p className="text-xs text-slate-500 mt-1">
                        {order.riderName || "未分配"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <TemperaturePanel
                    order={order}
                    logs={logs.slice(-30)}
                    alertEnabled={alertEnabled}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>温控订单列表</CardTitle>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <DotIndicator color="success" pulse={isAutoRefresh} />
              <span>{isAutoRefresh ? "实时更新" : "已暂停"}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <tr className="border-b border-slate-700">
                  <TableHead>订单号</TableHead>
                  <TableHead>货物类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>温度范围</TableHead>
                  <TableHead>当前温度</TableHead>
                  <TableHead>当前湿度</TableHead>
                  <TableHead>温控状态</TableHead>
                  <TableHead>骑手</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead>操作</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {tempControlOrders.map((order) => {
                  const statusInfo = getOrderStatusInfo(order.id);
                  const logs = orderTemperatureMap[order.id] || [];
                  const latest = logs[0];

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.orderNo}</TableCell>
                      <TableCell>{order.goodsType}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {order.temperatureRequired?.min}°C -{" "}
                        {order.temperatureRequired?.max}°C
                      </TableCell>
                      <TableCell>
                        {statusInfo.currentTemp !== null ? (
                          <span
                            className={cn(
                              "font-mono font-bold",
                              statusInfo.status === "abnormal"
                                ? "text-danger-500"
                                : statusInfo.status === "warning"
                                ? "text-warning-500"
                                : "text-success-500"
                            )}
                          >
                            {statusInfo.currentTemp.toFixed(1)}°C
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {statusInfo.currentHumidity !== null ? (
                          <span className="font-mono">
                            {statusInfo.currentHumidity.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusInfo.status === "abnormal" ? (
                            <>
                              <DotIndicator color="danger" pulse />
                              <span className="text-danger-400 text-sm">异常</span>
                            </>
                          ) : statusInfo.status === "warning" ? (
                            <>
                              <DotIndicator color="warning" />
                              <span className="text-warning-400 text-sm">预警</span>
                            </>
                          ) : (
                            <>
                              <DotIndicator color="success" />
                              <span className="text-success-400 text-sm">正常</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{order.riderName || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {latest ? formatRelativeTime(latest.timestamp) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order.id)}
                        >
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeOrder && (
        <Card>
          <CardHeader>
            <CardTitle>温度历史记录 - {activeOrder.orderNo}</CardTitle>
            <div className="text-sm text-slate-500">
              温度要求: {activeOrder.temperatureRequired?.min}°C -{" "}
              {activeOrder.temperatureRequired?.max}°C
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-700">
                  <TableHead>时间</TableHead>
                  <TableHead>温度 (°C)</TableHead>
                  <TableHead>湿度 (%)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>持续时长</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {(orderTemperatureMap[activeOrder.id] || []).slice(0, 50).map((log, idx, arr) => {
                  let duration = null;
                  if (idx < arr.length - 1) {
                    const currentTime = new Date(log.timestamp).getTime();
                    const prevTime = new Date(arr[idx + 1].timestamp).getTime();
                    duration = Math.floor((currentTime - prevTime) / 1000);
                  }

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.timestamp, "MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-mono font-bold",
                              log.isAbnormal
                                ? "text-danger-500"
                                : log.temperature < (activeOrder.temperatureRequired?.min || 0) ||
                                  log.temperature > (activeOrder.temperatureRequired?.max || 10)
                                ? "text-warning-500"
                                : "text-success-500"
                            )}
                          >
                            {log.temperature.toFixed(1)}
                          </span>
                          {log.temperature > (activeOrder.temperatureRequired?.max || 10) ? (
                            <TrendingUp className="h-3 w-3 text-warning-500" />
                          ) : log.temperature < (activeOrder.temperatureRequired?.min || 0) ? (
                            <TrendingDown className="h-3 w-3 text-warning-500" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {log.humidity.toFixed(0)}
                      </TableCell>
                      <TableCell>
                        {log.isAbnormal ? (
                          <StatusBadge status="exception" />
                        ) : (
                          <StatusBadge status="completed" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {duration !== null ? formatDuration(duration) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
