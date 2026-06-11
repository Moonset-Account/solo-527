"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  User,
  Clock,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Settings,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Users,
  MapPin,
  MessageSquare,
  DollarSign,
  PlusCircle,
  Edit3,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge, DotIndicator } from "@/components/ui/StatusBadge";
import { formatDate, formatRelativeTime, formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { OperationLog } from "@/types";

export default function LogsPage() {
  const { operationLogs, exportLogs, fetchLogs, useSupabase } = useDashboardStore();

  useEffect(() => {
    if (useSupabase) {
      fetchLogs();
    }
  }, [useSupabase, fetchLogs]);

  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const filteredLogs = useMemo(() => {
    let result = [...operationLogs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.orderNo?.toLowerCase().includes(query) ||
          log.operatorName.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query)
      );
    }

    return result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [operationLogs, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = operationLogs.filter(
      (log) => new Date(log.timestamp).toDateString() === today
    );

    const typeStats: Record<string, number> = {};
    operationLogs.forEach((log) => {
      typeStats[log.type] = (typeStats[log.type] || 0) + 1;
    });

    const operatorStats: Record<string, number> = {};
    operationLogs.forEach((log) => {
      operatorStats[log.operatorName] = (operatorStats[log.operatorName] || 0) + 1;
    });

    const warningLogs = operationLogs.filter(
      (log) => log.type === "warning" || log.type === "error"
    ).length;

    return {
      total: operationLogs.length,
      today: todayLogs.length,
      typeStats,
      operatorStats,
      warningLogs,
    };
  }, [operationLogs]);

  const getTypeInfo = (type: OperationLog["type"]) => {
    const info: Record<
      string,
      {
        label: string;
        color: string;
        icon: React.ReactNode;
        bgColor: string;
      }
    > = {
      order: {
        label: "订单操作",
        color: "text-blue-400",
        icon: <Package className="h-4 w-4" />,
        bgColor: "bg-blue-900/30",
      },
      rider: {
        label: "骑手操作",
        color: "text-indigo-400",
        icon: <Truck className="h-4 w-4" />,
        bgColor: "bg-indigo-900/30",
      },
      tracking: {
        label: "轨迹操作",
        color: "text-emerald-400",
        icon: <MapPin className="h-4 w-4" />,
        bgColor: "bg-emerald-900/30",
      },
      exception: {
        label: "异常处理",
        color: "text-warning-400",
        icon: <AlertTriangle className="h-4 w-4" />,
        bgColor: "bg-warning-900/30",
      },
      warning: {
        label: "系统警告",
        color: "text-orange-400",
        icon: <AlertTriangle className="h-4 w-4" />,
        bgColor: "bg-orange-900/30",
      },
      error: {
        label: "系统错误",
        color: "text-danger-400",
        icon: <AlertTriangle className="h-4 w-4" />,
        bgColor: "bg-danger-900/30",
      },
      config: {
        label: "配置变更",
        color: "text-purple-400",
        icon: <Settings className="h-4 w-4" />,
        bgColor: "bg-purple-900/30",
      },
      export: {
        label: "数据导出",
        color: "text-cyan-400",
        icon: <Download className="h-4 w-4" />,
        bgColor: "bg-cyan-900/30",
      },
      compensation: {
        label: "赔付操作",
        color: "text-rose-400",
        icon: <DollarSign className="h-4 w-4" />,
        bgColor: "bg-rose-900/30",
      },
      notification: {
        label: "通知发送",
        color: "text-amber-400",
        icon: <MessageSquare className="h-4 w-4" />,
        bgColor: "bg-amber-900/30",
      },
    };
    return info[type] || info.order;
  };

  const getActionIcon = (action: string) => {
    if (action.includes("创建") || action.includes("新增"))
      return <PlusCircle className="h-3.5 w-3.5" />;
    if (action.includes("更新") || action.includes("修改"))
      return <Edit3 className="h-3.5 w-3.5" />;
    if (action.includes("删除") || action.includes("取消"))
      return <XCircle className="h-3.5 w-3.5" />;
    if (action.includes("完成") || action.includes("确认"))
      return <CheckCircle className="h-3.5 w-3.5" />;
    if (action.includes("分配")) return <UserPlus className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
  };

  const handleExport = () => {
    exportLogs(operationLogs);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">操作日志</h1>
          <p className="text-sm text-slate-500 mt-1">
            记录所有系统操作、配置变更和异常处理日志
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? "primary" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            leftIcon={
              <RefreshCw
                className={cn("h-4 w-4", autoRefresh && "animate-spin")}
              />
            }
          >
            {autoRefresh ? "自动刷新" : "已暂停"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            导出日志
          </Button>
        </div>
      </div>

      <FilterBar />

      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-slate-100">
                  {stats.total}
                </p>
                <p className="text-xs text-slate-500">总日志数</p>
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
                  {stats.today}
                </p>
                <p className="text-xs text-slate-500">今日操作</p>
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
                  {stats.warningLogs}
                </p>
                <p className="text-xs text-slate-500">警告/错误</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/50 border border-indigo-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-indigo-400">
                  {Object.keys(stats.operatorStats).length}
                </p>
                <p className="text-xs text-slate-500">活跃操作员</p>
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
                  {stats.typeStats.order || 0}
                </p>
                <p className="text-xs text-slate-500">订单操作</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>操作类型分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.typeStats).map(([type, count]) => {
              const typeInfo = getTypeInfo(type as OperationLog["type"]);
              const percentage =
                stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : "0";
              return (
                <div key={type} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center",
                      typeInfo.bgColor,
                      typeInfo.color
                    )}
                  >
                    {typeInfo.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{typeInfo.label}</span>
                      <span className="text-sm font-mono font-medium">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          typeInfo.color.replace("text-", "bg-")
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>日志列表</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="搜索订单号、操作员、操作内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-80"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[700px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-700">
                  <TableHead>时间</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>操作</TableHead>
                  <TableHead>订单号</TableHead>
                  <TableHead>操作员</TableHead>
                  <TableHead>详情</TableHead>
                  <TableHead>IP地址</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const typeInfo = getTypeInfo(log.type);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">
                            {formatDate(log.timestamp, "MM-dd HH:mm:ss")}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatRelativeTime(log.timestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                            typeInfo.bgColor,
                            typeInfo.color
                          )}
                        >
                          {typeInfo.icon}
                          {typeInfo.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getActionIcon(log.action)}
                          <span className="text-sm">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.orderNo ? (
                          <span className="font-mono text-sm">
                            {log.orderNo}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                            {log.operatorName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm">{log.operatorName}</p>
                            <p className="text-[10px] text-slate-500">
                              {log.operatorRole}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-sm text-slate-400 truncate">
                          {log.details}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-500">
                          {log.ipAddress}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-500" />
              操作员活跃度
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(stats.operatorStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count], idx) => {
                const maxCount = Math.max(...Object.values(stats.operatorStats));
                const percentage =
                  maxCount > 0 ? ((count / maxCount) * 100).toFixed(0) : "0";
                return (
                  <div
                    key={name}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-medium text-lg">
                          {name.charAt(0)}
                        </div>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-warning-500 flex items-center justify-center text-[10px] font-bold text-slate-900">
                            1
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-slate-500">调度主管</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">操作数</span>
                      <span className="text-lg font-bold font-display text-slate-100">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
