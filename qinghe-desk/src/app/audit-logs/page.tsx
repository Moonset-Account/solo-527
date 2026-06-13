"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Search, Filter, RotateCcw, History, ArrowRight, User, ScrollText, Database, Calendar } from "lucide-react";

const entityTypes = ["All", "Tenant", "Room", "Bill", "ServiceRequest", "Repair"];

const operatorOptions = [
  { id: "", name: "全部操作人" },
  { id: "clerk_admin_001", name: "张管理" },
  { id: "clerk_op_001", name: "李运营" },
  { id: "clerk_op_002", name: "王工程" },
];

const entityBgColors: Record<string, string> = {
  Tenant: "bg-pine-50/40",
  Room: "bg-amber-50/40",
  Bill: "bg-emerald-50/40",
  ServiceRequest: "bg-blue-50/40",
  Repair: "bg-red-50/40",
};

const entityLabels: Record<string, string> = {
  Tenant: "租户档案",
  Room: "房间管理",
  Bill: "账单记录",
  ServiceRequest: "服务申请",
  Repair: "报修工单",
};

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<{
    entityType?: string;
    field?: string;
    operatorId?: string;
    timeRange?: { from: Date; to: Date };
  }>({});

  const { data: logs, refetch } = trpc.auditLog.list.useQuery(appliedFilters);

  const applyFilters = () => {
    const filters: any = {};
    if (entityType && entityType !== "All") filters.entityType = entityType;
    if (fieldSearch) filters.field = fieldSearch;
    if (operatorId) filters.operatorId = operatorId;
    if (dateFrom && dateTo) {
      filters.timeRange = {
        from: new Date(dateFrom),
        to: new Date(new Date(dateTo).getTime() + 86400000 - 1),
      };
    }
    setAppliedFilters(filters);
    setTimeout(() => refetch(), 0);
  };

  const resetFilters = () => {
    setEntityType("");
    setFieldSearch("");
    setOperatorId("");
    setDateFrom("");
    setDateTo("");
    setAppliedFilters({});
    setTimeout(() => refetch(), 0);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="变更记录"
        description="全字段可追溯的审计日志，支持按实体、字段、操作人筛选，便于审计与复盘"
      />

      <Card className="card-border-left-amber mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-pine-900">筛选条件</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div>
              <Label className="mb-1.5 block">
                <Database className="h-3 w-3 inline mr-1 text-zinc-500" />
                实体类型
              </Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((t) => (
                    <SelectItem key={t} value={t === "All" ? "" : t}>
                      {t === "All" ? "全部类型" : entityLabels[t] || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">
                <Search className="h-3 w-3 inline mr-1 text-zinc-500" />
                字段搜索
              </Label>
              <Input
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder="如 price / status / contact"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">
                <User className="h-3 w-3 inline mr-1 text-zinc-500" />
                操作人
              </Label>
              <Select value={operatorId} onValueChange={setOperatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="全部操作人" />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">
                <Calendar className="h-3 w-3 inline mr-1 text-zinc-500" />
                时间范围
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="flex-1"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className="text-zinc-400 shrink-0">至</span>
                <Input
                  type="date"
                  className="flex-1"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="h-3.5 w-3.5" />重置
            </Button>
            <Button onClick={applyFilters}>
              <Search className="h-3.5 w-3.5" />筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-border-left-green">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-pine-700" />
              <p className="text-sm font-semibold text-pine-900">变更日志</p>
              <Badge variant="outline" className="ml-1">{logs?.length ?? 0} 条记录</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <ScrollText className="h-3.5 w-3.5" />最近 100 条
            </div>
          </div>

          <div className="rounded-lg border border-pine-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-pine-50/60">
                  <TableHead>操作时间</TableHead>
                  <TableHead>实体类型</TableHead>
                  <TableHead>实体ID</TableHead>
                  <TableHead>字段</TableHead>
                  <TableHead>变更前</TableHead>
                  <TableHead></TableHead>
                  <TableHead>变更后</TableHead>
                  <TableHead>操作人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log: any, i: number) => (
                  <TableRow
                    key={log.id}
                    className={`animate-slide-up ${entityBgColors[log.entityType] || ""}`}
                    style={{ animationDelay: `${i * 15}ms` }}
                  >
                    <TableCell className="text-xs text-zinc-500 whitespace-nowrap">{formatDate(log.operatedAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {entityLabels[log.entityType] || log.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-pine-700">
                      #{log.entityId?.slice(-6)?.toUpperCase() || "-"}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                      {log.field}
                    </span>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      {log.oldValue !== null && log.oldValue !== undefined ? (
                        <span className="text-sm text-zinc-500 line-through">
                          {String(log.oldValue)}
                        </span>
                      ) : (
                          <span className="text-xs text-zinc-300">空</span>
                        )}
                    </TableCell>
                    <TableCell className="w-8">
                      <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-emerald-600" />
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      {log.newValue !== null && log.newValue !== undefined ? (
                        <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {String(log.newValue)}
                        </span>
                      ) : (
                          <span className="text-xs text-zinc-300">空</span>
                        )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-700">
                        <div className="h-6 w-6 rounded-full bg-pine-100 flex items-center justify-center">
                          <User className="h-3 w-3 text-pine-700" />
                        </div>
                        {log.operator?.name ?? "系统"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-zinc-400 py-12">
                      暂无变更记录
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
