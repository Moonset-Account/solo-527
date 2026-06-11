"use client";

import { useMemo, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  Warehouse,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge, PriorityBadge, DotIndicator } from "@/components/ui/StatusBadge";
import { OnTimeRateChart, OrderVolumeChart, DeliveryTimeChart } from "@/components/charts/PerformanceChart";
import { RiderStatusChart } from "@/components/charts/RiderStatusChart";
import { formatDate, formatRelativeTime, formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import Link from "next/link";

export default function DashboardPage() {
  const {
    orders,
    riders,
    exceptions,
    inventory,
    performanceStats,
    getFilteredOrders,
    getFilteredExceptions,
    refreshData,
    useSupabase,
  } = useDashboardStore();

  useEffect(() => {
    if (useSupabase) {
      refreshData();
    }
  }, [useSupabase, refreshData]);

  const stats = useMemo(() => {
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === new Date().toDateString()
    );
    const completedOrders = orders.filter((o) => o.status === "completed");
    const exceptionOrders = orders.filter((o) => o.status === "exception");
    const pendingOrders = orders.filter((o) => o.status === "pending");

    const onTimeDeliveries = completedOrders.filter((o) => {
      if (!o.actualDeliveryTime) return false;
      return new Date(o.actualDeliveryTime) <= new Date(o.estimatedDeliveryTime);
    });

    const onTimeRate =
      completedOrders.length > 0
        ? ((onTimeDeliveries.length / completedOrders.length) * 100).toFixed(1)
        : "0.0";

    const pendingExceptions = exceptions.filter((e) => e.status === "pending").length;
    const processingExceptions = exceptions.filter((e) => e.status === "processing").length;

    const totalCompensation = exceptions.reduce(
      (sum, e) => sum + (e.compensationAmount || 0),
      0
    );

    const lowInventoryItems = inventory.filter(
      (i) => i.availableQuantity < i.warningThreshold
    ).length;

    const idleRiders = riders.filter((r) => r.status === "idle").length;
    const busyRiders = riders.filter((r) => r.status === "busy").length;
    const deliveringRiders = riders.filter((r) => r.status === "delivering").length;

    return {
      todayOrders: todayOrders.length,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      exceptionOrders: exceptionOrders.length,
      pendingOrders: pendingOrders.length,
      onTimeRate,
      pendingExceptions,
      processingExceptions,
      totalCompensation,
      lowInventoryItems,
      idleRiders,
      busyRiders,
      deliveringRiders,
      activeRiders: idleRiders + busyRiders + deliveringRiders,
    };
  }, [orders, exceptions, inventory, riders]);

  const filteredOrders = getFilteredOrders().slice(0, 8);
  const filteredExceptions = getFilteredExceptions().slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">运营仪表盘</h1>
          <p className="text-sm text-slate-500 mt-1">实时监控同城配送运营数据</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">数据更新时间:</span>
          <span className="text-xs text-slate-400 font-mono">{formatDate(new Date())}</span>
        </div>
      </div>

      <FilterBar />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="今日订单"
          value={stats.todayOrders}
          icon={<Package className="h-6 w-6" />}
          color="blue"
          trend={{ value: 8.5, isPositive: true }}
        />
        <StatCard
          title="履约率"
          value={`${stats.onTimeRate}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          trend={{ value: 1.2, isPositive: true }}
        />
        <StatCard
          title="异常订单"
          value={stats.exceptionOrders}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="orange"
          trend={{ value: 5.3, isPositive: false }}
        />
        <StatCard
          title="待处理异常"
          value={stats.pendingExceptions + stats.processingExceptions}
          icon={<Clock className="h-6 w-6" />}
          color="red"
          trend={{ value: 2.1, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="在线骑手"
          value={stats.activeRiders}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="空闲骑手"
          value={stats.idleRiders}
          icon={<MapPin className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="库存预警"
          value={stats.lowInventoryItems}
          icon={<Warehouse className="h-5 w-5" />}
          color="orange"
        />
        <StatCard
          title="赔付金额"
          value={formatCurrency(stats.totalCompensation)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>履约率趋势</CardTitle>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success-500" />
                履约率
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 bg-warning-500" style={{ borderStyle: "dashed" }} />
                目标线 (95%)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <OnTimeRateChart data={performanceStats} />
          </CardContent>
        </Card>

        <RiderStatusChart riders={riders} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>订单量分布</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderVolumeChart data={performanceStats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>平均配送时长</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryTimeChart data={performanceStats} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>最新订单</CardTitle>
            <Link
              href="/orders"
              className="text-sm text-brand-500 hover:text-brand-400 transition-colors"
            >
              查看全部
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <tr className="border-b border-slate-700">
                  <TableHead>订单号</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>配送地址</TableHead>
                  <TableHead>骑手</TableHead>
                  <TableHead>预计送达</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderNo}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={order.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {order.deliveryAddress}
                    </TableCell>
                    <TableCell>{order.riderName || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDate(order.estimatedDeliveryTime, "HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>异常处理</CardTitle>
            <Link
              href="/exceptions"
              className="text-sm text-brand-500 hover:text-brand-400 transition-colors"
            >
              查看全部
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredExceptions.map((exception) => (
              <div
                key={exception.id}
                className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DotIndicator
                      color={
                        exception.status === "pending"
                          ? "danger"
                          : exception.status === "processing"
                          ? "warning"
                          : "success"
                      }
                      pulse={exception.status === "pending"}
                    />
                    <span className="font-mono text-xs text-slate-400">
                      {exception.orderNo}
                    </span>
                  </div>
                  <StatusBadge status={exception.type} />
                </div>
                <p className="text-sm text-slate-300 line-clamp-2 mb-2">
                  {exception.reason}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Users className="h-3 w-3" />
                    <span>{exception.assigneeName}</span>
                  </div>
                  {exception.compensationAmount && (
                    <span className="text-danger-500 font-medium">
                      {formatCurrency(exception.compensationAmount)}
                    </span>
                  )}
                  <span className="text-slate-600">
                    {formatRelativeTime(exception.createdAt)}
                  </span>
                </div>
                {exception.processingDuration && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">处理耗时</span>
                      <span className="text-slate-300 font-mono">
                        {Math.floor(exception.processingDuration / 60)}分
                        {exception.processingDuration % 60}秒
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          exception.processingDuration > 3600
                            ? "bg-danger-500"
                            : exception.processingDuration > 1800
                            ? "bg-warning-500"
                            : "bg-success-500"
                        )}
                        style={{
                          width: `${Math.min(
                            (exception.processingDuration / 7200) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>实时骑手状态</CardTitle>
            <div className="flex items-center gap-2">
              <DotIndicator color="success" pulse />
              <span className="text-xs text-slate-400">实时更新中</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <tr className="border-b border-slate-700">
                  <TableHead>骑手</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>评分</TableHead>
                  <TableHead>累计配送</TableHead>
                  <TableHead>当前订单</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {riders.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
                          {rider.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{rider.name}</p>
                          <p className="text-xs text-slate-500">{rider.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={rider.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-warning-500">★</span>
                        <span className="text-sm">{rider.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{rider.totalDeliveries}</TableCell>
                    <TableCell>
                      {rider.currentOrderId
                        ? orders.find((o) => o.id === rider.currentOrderId)?.orderNo
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>库存预警</CardTitle>
            <Link
              href="/inventory"
              className="text-sm text-brand-500 hover:text-brand-400 transition-colors"
            >
              查看全部
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventory
              .filter((i) => i.availableQuantity < i.warningThreshold)
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/50 rounded-lg p-3 border-l-2 border-danger-500"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.siteName}</p>
                    </div>
                    <span className="font-mono text-xs text-slate-500">{item.sku}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-lg font-bold font-display",
                          item.availableQuantity < 0
                            ? "text-danger-500"
                            : item.availableQuantity < item.warningThreshold
                            ? "text-warning-500"
                            : "text-success-500"
                        )}
                      >
                        {item.availableQuantity}
                      </span>
                      <span className="text-xs text-slate-500">可用</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      预警阈值: {item.warningThreshold}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        item.availableQuantity < 0
                          ? "bg-danger-500"
                          : "bg-warning-500"
                      )}
                      style={{
                        width: `${Math.max(
                          0,
                          (item.availableQuantity / item.warningThreshold) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
