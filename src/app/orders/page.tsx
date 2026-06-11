"use client";

import { useState, useEffect } from "react";
import {
  Package,
  MapPin,
  User,
  Phone,
  Clock,
  Thermometer,
  CheckCircle,
  XCircle,
  Eye,
  Navigation,
  UserPlus,
  Download,
  ChevronRight,
  AlertTriangle,
  Store,
  Truck,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge, PriorityBadge, DotIndicator } from "@/components/ui/StatusBadge";
import { formatDate, formatRelativeTime, formatCurrency, formatDistance, formatDuration } from "@/utils/format";
import { cn } from "@/utils/cn";
import { Order, Rider } from "@/types";

export default function OrdersPage() {
  const {
    orders,
    riders,
    assignRider,
    updateOrderStatus,
    getFilteredOrders,
    exportOrders,
    fetchOrders,
    fetchRiders,
    useSupabase,
  } = useDashboardStore();

  useEffect(() => {
    if (useSupabase) {
      fetchOrders();
      fetchRiders();
    }
  }, [useSupabase, fetchOrders, fetchRiders]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [assigningRider, setAssigningRider] = useState<string | null>(null);

  const filteredOrders = getFilteredOrders();

  const handleAcceptOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, "accepted");
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    setAssigningRider(riderId);
    try {
      await assignRider(orderId, riderId);
      setShowAssignModal(false);
      setSelectedOrder(null);
    } finally {
      setAssigningRider(null);
    }
  };

  const handleStartDelivery = async (orderId: string) => {
    await updateOrderStatus(orderId, "delivering");
  };

  const availableRiders = riders.filter((r) => r.status === "idle");

  const calculateDistance = (order: Order) => {
    const R = 6371;
    const dLat = ((order.deliveryLat - order.pickupLat) * Math.PI) / 180;
    const dLon = ((order.deliveryLng - order.pickupLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((order.pickupLat * Math.PI) / 180) *
        Math.cos((order.deliveryLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  };

  const getAvailableActions = (order: Order) => {
    const actions: {
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      variant: "primary" | "success" | "outline" | "ghost" | "warning";
      disabled?: boolean;
    }[] = [];

    if (order.status === "pending") {
      actions.push({
        label: "接单",
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: () => handleAcceptOrder(order.id),
        variant: "primary",
      });
    }

    if (order.status === "accepted" && !order.riderId) {
      actions.push({
        label: "分配骑手",
        icon: <UserPlus className="h-4 w-4" />,
        onClick: () => {
          setSelectedOrder(order);
          setShowAssignModal(true);
        },
        variant: "success",
      });
    }

    if (order.status === "accepted" && order.riderId) {
      actions.push({
        label: "开始配送",
        icon: <Navigation className="h-4 w-4" />,
        onClick: () => handleStartDelivery(order.id),
        variant: "primary",
      });
    }

    actions.push({
      label: "查看路线",
      icon: <MapPin className="h-4 w-4" />,
      onClick: () => {
        setSelectedOrder(order);
        setShowRouteModal(true);
      },
      variant: "outline",
    });

    return actions;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">订单管理</h1>
          <p className="text-sm text-slate-500 mt-1">订单接单、分配骑手、跟踪配送</p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportOrders(filteredOrders)}
          leftIcon={<Download className="h-4 w-4" />}
        >
          导出订单
        </Button>
      </div>

      <FilterBar />

      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <Package className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-slate-100">{filteredOrders.length}</p>
                <p className="text-xs text-slate-500">全部订单</p>
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
                <p className="text-2xl font-bold font-display text-blue-400">
                  {filteredOrders.filter((o) => o.status === "pending").length}
                </p>
                <p className="text-xs text-slate-500">待接单</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-amber-950/50 border border-amber-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-900/50 flex items-center justify-center">
                <User className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-amber-400">
                  {filteredOrders.filter((o) => o.status === "accepted").length}
                </p>
                <p className="text-xs text-slate-500">待分配</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/50 border border-indigo-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center">
                <Truck className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-indigo-400">
                  {filteredOrders.filter((o) => o.status === "delivering").length}
                </p>
                <p className="text-xs text-slate-500">配送中</p>
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
                  {filteredOrders.filter((o) => o.status === "completed").length}
                </p>
                <p className="text-xs text-slate-500">已完成</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <DotIndicator color="success" pulse />
            <span>实时更新</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr className="border-b border-slate-700">
                <TableHead>订单号</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>取货地址</TableHead>
                <TableHead>配送地址</TableHead>
                <TableHead>货物类型</TableHead>
                <TableHead>距离</TableHead>
                <TableHead>骑手</TableHead>
                <TableHead>预计送达</TableHead>
                <TableHead>操作</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const distance = calculateDistance(order);
                const actions = getAvailableActions(order);

                return (
                  <TableRow key={order.id} className="group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium">
                          {order.orderNo}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatRelativeTime(order.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={order.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[180px]">
                        <Store className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-sm truncate">{order.pickupAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[180px]">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-sm truncate">{order.deliveryAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{order.goodsType}</span>
                        {order.temperatureRequired && (
                          <div className="flex items-center gap-1 text-xs text-blue-400">
                            <Thermometer className="h-3 w-3" />
                            <span>
                              {order.temperatureRequired.min}°C -{" "}
                              {order.temperatureRequired.max}°C
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatDistance(distance)}</span>
                    </TableCell>
                    <TableCell>
                      {order.riderId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                            {order.riderName?.charAt(0)}
                          </div>
                          <span className="text-sm">{order.riderName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">未分配</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">
                          {formatDate(order.estimatedDeliveryTime, "MM-dd HH:mm")}
                        </span>
                        {order.actualDeliveryTime && (
                          <span className="text-xs text-success-500">
                            实际: {formatDate(order.actualDeliveryTime, "HH:mm")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {actions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant={action.variant}
                            size="sm"
                            onClick={action.onClick}
                            disabled={action.disabled}
                            leftIcon={action.icon}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">分配骑手</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    订单号: <span className="font-mono">{selectedOrder.orderNo}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedOrder(null);
                  }}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Store className="h-4 w-4 text-slate-500 mt-0.5" />
                  <span className="text-sm">{selectedOrder.pickupAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-brand-500" />
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                  <span className="text-sm">{selectedOrder.deliveryAddress}</span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    预计 {formatDate(selectedOrder.estimatedDeliveryTime, "HH:mm")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {selectedOrder.goodsType}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-medium text-slate-300 mb-3">
                可用骑手 ({availableRiders.length})
              </h3>

              {availableRiders.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning-500" />
                  <p>暂无空闲骑手</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableRiders.map((rider) => (
                    <div
                      key={rider.id}
                      className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-brand-500/50"
                      onClick={() => handleAssignRider(selectedOrder.id, rider.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-medium">
                          {rider.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{rider.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="h-3 w-3" />
                            <span>{rider.phone}</span>
                            <span className="mx-1">·</span>
                            <span className="text-warning-500">★ {rider.rating}</span>
                            <span className="mx-1">·</span>
                            <span>{rider.totalDeliveries} 单</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignRider(selectedOrder.id, rider.id);
                        }}
                        disabled={assigningRider === rider.id}
                        isLoading={assigningRider === rider.id}
                      >
                        分配
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRouteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">配送路线</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    订单号: <span className="font-mono">{selectedOrder.orderNo}</span>
                    {selectedOrder.riderName && (
                      <span className="ml-2">
                        骑手: <span className="text-slate-300">{selectedOrder.riderName}</span>
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRouteModal(false);
                    setSelectedOrder(null);
                  }}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-lg p-6 h-[400px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="h-full w-full" style={{
                      backgroundImage: `
                        linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: "30px 30px",
                    }} />
                  </div>
                  <div className="relative z-10 text-center">
                    <div className="relative">
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-success-500 animate-pulse shadow-lg shadow-success-500/50" />
                        <div className="text-xs text-success-400 mt-1 bg-slate-900/80 px-2 py-0.5 rounded">
                          取货点
                        </div>
                      </div>

                      <svg className="w-[100px] h-[200px]" viewBox="0 0 100 200">
                        <path
                          d="M 50 20 Q 70 80 50 120 T 50 180"
                          stroke="url(#routeGradient)"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray="8 4"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>

                      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-brand-500 animate-bounce shadow-lg shadow-brand-500/50" />
                        <div className="text-xs text-brand-400 mt-1 bg-slate-900/80 px-2 py-0.5 rounded">
                          送货点
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-8">地图预览模式</p>
                    <p className="text-[10px] text-slate-600 mt-1">连接Leaflet后显示真实地图</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Store className="h-4 w-4 text-success-500" />
                      <span className="font-medium text-sm">取货信息</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{selectedOrder.pickupAddress}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>坐标: {selectedOrder.pickupLat.toFixed(6)}, {selectedOrder.pickupLng.toFixed(6)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-brand-500" />
                      <span className="font-medium text-sm">送货信息</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{selectedOrder.deliveryAddress}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>坐标: {selectedOrder.deliveryLat.toFixed(6)}, {selectedOrder.deliveryLng.toFixed(6)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">预计距离</p>
                      <p className="text-lg font-bold font-display text-slate-100">
                        {formatDistance(calculateDistance(selectedOrder))}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">预计时长</p>
                      <p className="text-lg font-bold font-display text-slate-100">
                        {formatDuration(Math.round(calculateDistance(selectedOrder) / 6))}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.temperatureRequired && (
                    <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="h-4 w-4 text-blue-400" />
                        <span className="font-medium text-sm text-blue-300">温控要求</span>
                      </div>
                      <p className="text-lg font-bold font-display text-blue-400">
                        {selectedOrder.temperatureRequired.min}°C ~ {selectedOrder.temperatureRequired.max}°C
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
