"use client";

import { useState, useMemo } from "react";
import {
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Search,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Camera,
  MapPin,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge, DotIndicator } from "@/components/ui/StatusBadge";
import { formatDate, formatRelativeTime, formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

export default function SignatureDiffPage() {
  const { orders, exceptions } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === "completed" || o.status === "exception"),
    [orders]
  );

  const signatureDiscrepancies = useMemo(() => {
    return deliveredOrders
      .filter((order) => {
        if (!order.signature || !order.recipient) return false;
        return (
          order.signature.signerName !== order.recipient.name ||
          order.signature.deliveryMethod !== "in_person"
        );
      })
      .map((order) => {
        const diffType =
          order.signature?.signerName !== order.recipient?.name
            ? "signer_mismatch"
            : "not_in_person";

        const relatedException = exceptions.find(
          (e) => e.orderId === order.id && e.type === "signature_issue"
        );

        return {
          order,
          diffType,
          relatedException,
        };
      });
  }, [deliveredOrders, exceptions]);

  const filteredDiscrepancies = useMemo(() => {
    if (!searchQuery) return signatureDiscrepancies;
    const query = searchQuery.toLowerCase();
    return signatureDiscrepancies.filter(
      ({ order }) =>
        order.orderNo.toLowerCase().includes(query) ||
        order.recipient?.name.toLowerCase().includes(query) ||
        order.signature?.signerName.toLowerCase().includes(query) ||
        order.deliveryAddress.toLowerCase().includes(query)
    );
  }, [signatureDiscrepancies, searchQuery]);

  const stats = useMemo(() => {
    const totalDelivered = deliveredOrders.length;
    const totalDiscrepancies = signatureDiscrepancies.length;
    const signerMismatch = signatureDiscrepancies.filter(
      (d) => d.diffType === "signer_mismatch"
    ).length;
    const notInPerson = signatureDiscrepancies.filter(
      (d) => d.diffType === "not_in_person"
    ).length;
    const resolved = signatureDiscrepancies.filter(
      (d) => d.relatedException?.status === "resolved"
    ).length;
    const pending = signatureDiscrepancies.filter(
      (d) => !d.relatedException || d.relatedException.status === "pending"
    ).length;

    const discrepancyRate =
      totalDelivered > 0
        ? ((totalDiscrepancies / totalDelivered) * 100).toFixed(1)
        : "0.0";

    return {
      totalDelivered,
      totalDiscrepancies,
      signerMismatch,
      notInPerson,
      resolved,
      pending,
      discrepancyRate,
    };
  }, [deliveredOrders, signatureDiscrepancies]);

  const getDiffTypeLabel = (type: string) => {
    switch (type) {
      case "signer_mismatch":
        return { label: "签收人不符", color: "warning", icon: <User className="h-4 w-4" /> };
      case "not_in_person":
        return { label: "非本人签收", color: "danger", icon: <XCircle className="h-4 w-4" /> };
      default:
        return { label: "其他异常", color: "warning", icon: <AlertTriangle className="h-4 w-4" /> };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">签收差异</h1>
          <p className="text-sm text-slate-500 mt-1">
            分析签收异常、核对签收人与收件人信息
          </p>
        </div>
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
          导出差异报告
        </Button>
      </div>

      <FilterBar />

      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-slate-100">
                  {stats.totalDelivered}
                </p>
                <p className="text-xs text-slate-500">已送达订单</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning-900/30 to-warning-950/50 border border-warning-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-900/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-warning-400">
                  {stats.totalDiscrepancies}
                </p>
                <p className="text-xs text-slate-500">差异订单</p>
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
                  {stats.signerMismatch}
                </p>
                <p className="text-xs text-slate-500">签收人不符</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-danger-900/30 to-danger-950/50 border border-danger-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger-900/50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-danger-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-danger-400">
                  {stats.notInPerson}
                </p>
                <p className="text-xs text-slate-500">非本人签收</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-blue-400">
                  {stats.discrepancyRate}%
                </p>
                <p className="text-xs text-slate-500">差异率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>待处理差异</CardTitle>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <DotIndicator color="warning" pulse />
              <span>{stats.pending} 项需处理</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredDiscrepancies
              .filter(
                (d) =>
                  !d.relatedException || d.relatedException.status === "pending"
              )
              .slice(0, 6)
              .map(({ order, diffType, relatedException }) => {
                const diffInfo = getDiffTypeLabel(diffType);
                return (
                  <div
                    key={order.id}
                    className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer border-l-2 border-warning-500"
                    onClick={() =>
                      setExpandedOrder(expandedOrder === order.id ? null : order.id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm">{order.orderNo}</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              diffInfo.color === "warning"
                                ? "bg-warning-900/50 text-warning-400"
                                : "bg-danger-900/50 text-danger-400"
                            )}
                          >
                            {diffInfo.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">收件人</p>
                            <p className="font-medium">{order.recipient?.name}</p>
                            <p className="text-xs text-slate-500">
                              {order.recipient?.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">签收人</p>
                            <p className="font-medium text-warning-400">
                              {order.signature?.signerName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.signature?.deliveryMethod === "in_person"
                                ? "本人签收"
                                : "代签收"}
                            </p>
                          </div>
                        </div>
                        {order.signature?.notes && (
                          <div className="mt-3 p-2 bg-slate-900/50 rounded">
                            <p className="text-xs text-slate-500 mb-1">备注</p>
                            <p className="text-sm text-slate-300">
                              {order.signature.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {expandedOrder === order.id && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-slate-500 text-xs mb-2">配送地址</p>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-sm">{order.deliveryAddress}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-2">签收时间</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-sm font-mono">
                                {order.actualDeliveryTime
                                  ? formatDate(order.actualDeliveryTime)
                                  : "-"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-2">货物信息</p>
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-sm">{order.goodsType}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-2">配送骑手</p>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-sm">{order.riderName || "-"}</span>
                            </div>
                          </div>
                        </div>
                        {order.signature?.photoUrl && (
                          <div className="mt-4">
                            <p className="text-slate-500 text-xs mb-2">签收凭证</p>
                            <div className="flex items-center gap-2">
                              <Camera className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-sm text-brand-500">查看照片</span>
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            联系客户
                          </Button>
                          <Button variant="primary" size="sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            标记已核实
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已处理差异</CardTitle>
            <div className="text-xs text-slate-500">
              <span>{stats.resolved} 项已完成</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredDiscrepancies
              .filter((d) => d.relatedException?.status === "resolved")
              .slice(0, 6)
              .map(({ order, diffType, relatedException }) => {
                const diffInfo = getDiffTypeLabel(diffType);
                return (
                  <div
                    key={order.id}
                    className="p-4 bg-slate-800/30 rounded-lg border-l-2 border-success-500 opacity-80"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm">{order.orderNo}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-success-900/50 text-success-400">
                            {diffInfo.label}
                          </span>
                          <StatusBadge status="completed" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">收件人</p>
                            <p className="font-medium">{order.recipient?.name}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">签收人</p>
                            <p className="font-medium">{order.signature?.signerName}</p>
                          </div>
                        </div>
                        {relatedException && (
                          <div className="mt-3 p-2 bg-success-900/20 rounded">
                            <p className="text-xs text-slate-500 mb-1">处理结果</p>
                            <p className="text-sm text-slate-300">
                              {relatedException.resolutionNotes || "已核实并确认"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              处理人: {relatedException.assigneeName} ·{" "}
                              {formatRelativeTime(relatedException.updatedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>完整差异列表</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索订单号、收件人、签收人、地址..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-80"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-700">
                <TableHead>订单号</TableHead>
                <TableHead>差异类型</TableHead>
                <TableHead>收件人</TableHead>
                <TableHead>签收人</TableHead>
                <TableHead>配送地址</TableHead>
                <TableHead>签收时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredDiscrepancies.map(({ order, diffType, relatedException }) => {
                const diffInfo = getDiffTypeLabel(diffType);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.orderNo}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          diffInfo.color === "warning"
                            ? "bg-warning-900/50 text-warning-400"
                            : "bg-danger-900/50 text-danger-400"
                        )}
                      >
                        {diffInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.recipient?.name}</p>
                        <p className="text-xs text-slate-500">{order.recipient?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-warning-400">
                          {order.signature?.signerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.signature?.deliveryMethod === "in_person"
                            ? "本人签收"
                            : "代签收"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {order.deliveryAddress}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {order.actualDeliveryTime
                        ? formatDate(order.actualDeliveryTime)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {relatedException ? (
                        <StatusBadge status={relatedException.status} />
                      ) : (
                        <StatusBadge status="pending" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm">
                          查看详情
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
