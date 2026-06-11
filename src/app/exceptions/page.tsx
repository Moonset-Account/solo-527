"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  User,
  DollarSign,
  MessageSquare,
  FileText,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Package,
  Phone,
  Camera,
  MapPin,
  History,
  Users,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge, DotIndicator, PriorityBadge } from "@/components/ui/StatusBadge";
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
  formatDuration,
} from "@/utils/format";
import { cn } from "@/utils/cn";
import { ExceptionRecord } from "@/types";

export default function ExceptionsPage() {
  const {
    orders,
    exceptions,
    getFilteredExceptions,
    updateExceptionStatus,
    exportExceptions,
  } = useDashboardStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedException, setExpandedException] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredExceptions = useMemo(() => {
    let result = getFilteredExceptions();
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.orderNo.toLowerCase().includes(query) ||
          e.reason.toLowerCase().includes(query) ||
          e.assigneeName.toLowerCase().includes(query) ||
          e.disputeReason?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [getFilteredExceptions, searchQuery]);

  const stats = useMemo(() => {
    const total = exceptions.length;
    const pending = exceptions.filter((e) => e.status === "pending").length;
    const processing = exceptions.filter((e) => e.status === "processing").length;
    const resolved = exceptions.filter((e) => e.status === "resolved").length;
    const closed = exceptions.filter((e) => e.status === "closed").length;

    const totalCompensation = exceptions.reduce(
      (sum, e) => sum + (e.compensationAmount || 0),
      0
    );

    const avgProcessingTime =
      resolved + closed > 0
        ? exceptions
            .filter((e) => e.processingDuration)
            .reduce((sum, e) => sum + (e.processingDuration || 0), 0) /
          (resolved + closed)
        : 0;

    const disputeCount = exceptions.filter((e) => e.disputeReason).length;

    return {
      total,
      pending,
      processing,
      resolved,
      closed,
      totalCompensation,
      avgProcessingTime,
      disputeCount,
    };
  }, [exceptions]);

  const exceptionTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    exceptions.forEach((e) => {
      stats[e.type] = (stats[e.type] || 0) + 1;
    });
    return stats;
  }, [exceptions]);

  const getExceptionTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      late_delivery: { label: "超时送达", color: "warning" },
      damaged_goods: { label: "货物破损", color: "danger" },
      wrong_address: { label: "地址错误", color: "warning" },
      lost_package: { label: "包裹丢失", color: "danger" },
      temperature_issue: { label: "温控异常", color: "danger" },
      signature_issue: { label: "签收异常", color: "warning" },
      customer_complaint: { label: "客户投诉", color: "warning" },
      other: { label: "其他异常", color: "warning" },
    };
    return labels[type] || { label: type, color: "warning" };
  };

  const getStatusInfo = (status: ExceptionRecord["status"]) => {
    const info: Record<
      string,
      { label: string; color: string; icon: React.ReactNode }
    > = {
      pending: {
        label: "待处理",
        color: "warning",
        icon: <Clock className="h-4 w-4" />,
      },
      processing: {
        label: "处理中",
        color: "blue",
        icon: <Play className="h-4 w-4" />,
      },
      resolved: {
        label: "已解决",
        color: "success",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      closed: {
        label: "已关闭",
        color: "secondary",
        icon: <XCircle className="h-4 w-4" />,
      },
    };
    return info[status] || info.pending;
  };

  const handleStatusChange = async (
    exceptionId: string,
    newStatus: ExceptionRecord["status"]
  ) => {
    setProcessingId(exceptionId);
    try {
      await updateExceptionStatus(exceptionId, newStatus);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">异常管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            处理配送异常、赔付争议、跟进处理进度
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportExceptions(exceptions)}
          leftIcon={<Download className="h-4 w-4" />}
        >
          导出异常报告
        </Button>
      </div>

      <FilterBar />

      <div className="grid grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-slate-100">
                  {stats.total}
                </p>
                <p className="text-xs text-slate-500">异常总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning-900/30 to-warning-950/50 border border-warning-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-900/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-warning-400">
                  {stats.pending}
                </p>
                <p className="text-xs text-slate-500">待处理</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                <Play className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-blue-400">
                  {stats.processing}
                </p>
                <p className="text-xs text-slate-500">处理中</p>
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
                  {stats.resolved}
                </p>
                <p className="text-xs text-slate-500">已解决</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-danger-900/30 to-danger-950/50 border border-danger-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger-900/50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-danger-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-danger-400">
                  {formatCurrency(stats.totalCompensation)}
                </p>
                <p className="text-xs text-slate-500">赔付金额</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/50 border border-indigo-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-indigo-400">
                  {formatDuration(Math.round(stats.avgProcessingTime))}
                </p>
                <p className="text-xs text-slate-500">平均处理耗时</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>异常类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(exceptionTypeStats).map(([type, count]) => {
                const typeInfo = getExceptionTypeLabel(type);
                const percentage =
                  stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : "0";
                return (
                  <div
                    key={type}
                    className={cn(
                      "p-4 rounded-lg border",
                      typeInfo.color === "danger"
                        ? "bg-danger-900/20 border-danger-800/50"
                        : "bg-warning-900/20 border-warning-800/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          typeInfo.color === "danger"
                            ? "text-danger-400"
                            : "text-warning-400"
                        )}
                      >
                        {typeInfo.label}
                      </span>
                      <span className="text-2xl font-bold font-display text-slate-100">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          typeInfo.color === "danger"
                            ? "bg-danger-500"
                            : "bg-warning-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>赔付争议</CardTitle>
            <div className="text-xs text-slate-500">
              {stats.disputeCount} 项存在争议
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[280px] overflow-y-auto">
            {exceptions
              .filter((e) => e.isDispute)
              .slice(0, 5)
              .map((exception) => (
                <div
                  key={exception.id}
                  className="p-3 bg-danger-900/20 rounded-lg border-l-2 border-danger-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-sm">{exception.orderNo}</p>
                      <p className="text-xs text-slate-500">{exception.assigneeName}</p>
                    </div>
                    {exception.compensationAmount && (
                      <span className="text-danger-500 font-bold font-mono">
                        {formatCurrency(exception.compensationAmount)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {exception.disputeReason}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                    <span className="text-slate-500">争议原因</span>
                    <StatusBadge status={exception.status} />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>异常列表</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索订单号、原因、负责人、争议原因..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-80"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-700">
                <TableHead>订单号</TableHead>
                <TableHead>异常类型</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>异常原因</TableHead>
                <TableHead>赔付金额</TableHead>
                <TableHead>争议原因</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>处理耗时</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredExceptions.map((exception) => {
                const typeInfo = getExceptionTypeLabel(exception.type);
                const statusInfo = getStatusInfo(exception.status);
                const order = orders.find((o) => o.id === exception.orderId);

                return (
                  <TableRow key={exception.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium">
                          {exception.orderNo}
                        </span>
                        <span className="text-xs text-slate-500">
                          {order?.goodsType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          typeInfo.color === "danger"
                            ? "bg-danger-900/50 text-danger-400"
                            : "bg-warning-900/50 text-warning-400"
                        )}
                      >
                        {typeInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={exception.priority} />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm line-clamp-2">{exception.reason}</p>
                    </TableCell>
                    <TableCell>
                      {exception.compensationAmount ? (
                        <span
                          className={cn(
                            "font-mono font-bold",
                            exception.compensationAmount > 0
                              ? "text-danger-500"
                              : "text-slate-400"
                          )}
                        >
                          {formatCurrency(exception.compensationAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      {exception.isDispute ? (
                        <div>
                          <div className="flex items-center gap-1 text-danger-400 text-xs mb-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>存在争议</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {exception.disputeReason}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">无</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                          {exception.assigneeName.charAt(0)}
                        </div>
                        <span className="text-sm">{exception.assigneeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {exception.processingDuration ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">
                            {formatDuration(exception.processingDuration)}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                            <div
                              className={cn(
                                "h-full rounded-full",
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
                      ) : (
                        <div className="flex items-center gap-1 text-warning-500 text-xs">
                          <DotIndicator color="warning" pulse />
                          <span>计时中</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {statusInfo.icon}
                        <StatusBadge status={exception.status} />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatRelativeTime(exception.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedException(
                              expandedException === exception.id ? null : exception.id
                            )
                          }
                        >
                          {expandedException === exception.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        {exception.status === "pending" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(exception.id, "processing")
                            }
                            isLoading={processingId === exception.id}
                          >
                            开始处理
                          </Button>
                        )}
                        {exception.status === "processing" && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(exception.id, "resolved")
                            }
                            isLoading={processingId === exception.id}
                          >
                            解决
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {expandedException && (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-brand-500" />
                异常详情 -{" "}
                {exceptions.find((e) => e.id === expandedException)?.orderNo}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const exception = exceptions.find((e) => e.id === expandedException);
              const order = orders.find((o) => o.id === exception?.orderId);
              if (!exception) return null;

              return (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-300 mb-3">基本信息</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">异常类型</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              getExceptionTypeLabel(exception.type).color ===
                                "danger"
                                ? "bg-danger-900/50 text-danger-400"
                                : "bg-warning-900/50 text-warning-400"
                            )}
                          >
                            {getExceptionTypeLabel(exception.type).label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">优先级</span>
                          <PriorityBadge priority={exception.priority} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">当前状态</span>
                          <StatusBadge status={exception.status} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">创建时间</span>
                          <span className="font-mono">
                            {formatDate(exception.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">更新时间</span>
                          <span className="font-mono">
                            {formatDate(exception.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order && (
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <h3 className="text-sm font-medium text-slate-300 mb-3">
                          订单信息
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-slate-500 text-xs">货物类型</p>
                              <p>{order.goodsType}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-slate-500 text-xs">配送地址</p>
                              <p>{order.deliveryAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-slate-500 text-xs">收件人</p>
                              <p>
                                {order.recipient?.name} ({order.recipient?.phone})
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-slate-500 text-xs">配送骑手</p>
                              <p>{order.riderName || "未分配"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-300 mb-3">异常描述</h3>
                      <p className="text-sm text-slate-300">{exception.reason}</p>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-300 mb-3">处理记录</h3>
                      <div className="space-y-3">
                        {exception.processingNotes &&
                          exception.processingNotes.map((note, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-900/50 rounded border-l-2 border-brand-500"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {note.author}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                  {formatDate(note.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-400">{note.content}</p>
                            </div>
                          ))}
                        {(!exception.processingNotes ||
                          exception.processingNotes.length === 0) && (
                          <p className="text-sm text-slate-500">暂无处理记录</p>
                        )}
                      </div>
                    </div>

                    {exception.isDispute && (
                      <div className="p-4 bg-danger-900/20 rounded-lg border border-danger-800/50">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-danger-400" />
                          <h3 className="text-sm font-medium text-danger-300">
                            赔付争议
                          </h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">争议原因</p>
                            <p className="text-sm text-slate-300">
                              {exception.disputeReason}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">
                              客户申请赔付
                            </span>
                            <span className="text-xl font-bold font-display text-danger-500">
                              {formatCurrency(exception.compensationAmount || 0)}
                            </span>
                          </div>
                          {exception.disputeEvidence && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">
                                争议凭证
                              </p>
                              <div className="flex gap-2">
                                {exception.disputeEvidence.map((url, idx) => (
                                  <div
                                    key={idx}
                                    className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center"
                                  >
                                    <Camera className="h-6 w-6 text-slate-500" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-slate-300">负责人</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-medium">
                              {exception.assigneeName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{exception.assigneeName}</p>
                              <p className="text-xs text-slate-500">调度主管</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-1" />
                          转派
                        </Button>
                      </div>
                    </div>

                    {exception.resolutionNotes && (
                      <div className="p-4 bg-success-900/20 rounded-lg border border-success-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-success-400" />
                          <h3 className="text-sm font-medium text-success-300">
                            处理结果
                          </h3>
                        </div>
                        <p className="text-sm text-slate-300">
                          {exception.resolutionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
