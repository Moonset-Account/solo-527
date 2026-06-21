"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatDate,
  formatDateTime,
  getStatusLabel,
  getRoleLabel,
} from "@/lib/utils";
import {
  Building2,
  User,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  History,
  FileText,
  CreditCard,
  ClipboardList,
  Receipt,
  FileCheck,
  Clock,
  SearchX,
  SearchCheck,
  ChevronDown,
  Download,
  BarChart3,
} from "lucide-react";

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string | undefined>();
  const [fieldName, setFieldName] = useState("");
  const [operatorId, setOperatorId] = useState<string | undefined>();
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const pageSize = 15;

  const { data: stats } = api.audit.getStats.useQuery();
  const { data: entityTypes } = api.audit.getEntityTypes.useQuery();
  const { data: fieldNames } = api.audit.getFieldNames.useQuery(
    { entityType: entityType as any },
    { enabled: !!entityType }
  );
  const { data: operators } = api.audit.getOperators.useQuery();

  const { data, isLoading, refetch } = api.audit.list.useQuery({
    page,
    pageSize,
    entityType: entityType as any,
    fieldName: fieldName || undefined,
    operatorId: operatorId || undefined,
    oldValue: oldValue || undefined,
    newValue: newValue || undefined,
    changedFrom: dateFrom ? new Date(dateFrom) : undefined,
    changedTo: dateTo ? new Date(dateTo) : undefined,
  });

  const entityIcons: Record<string, any> = {
    LEASE: Building2,
    BILL: CreditCard,
    ASSIGNMENT: ClipboardList,
    SETTLEMENT: Receipt,
    CONTRACT: FileCheck,
  };

  const entityColors: Record<string, string> = {
    LEASE: "bg-blue-100 text-blue-600",
    BILL: "bg-amber-100 text-amber-600",
    ASSIGNMENT: "bg-purple-100 text-purple-600",
    SETTLEMENT: "bg-emerald-100 text-emerald-600",
    CONTRACT: "bg-indigo-100 text-indigo-600",
  };

  const getEntityIcon = (type: string) => {
    const Icon = entityIcons[type] || FileText;
    return Icon;
  };

  const handleReset = () => {
    setEntityType(undefined);
    setFieldName("");
    setOperatorId(undefined);
    setOldValue("");
    setNewValue("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    refetch();
  };

  const statCards = useMemo(
    () => [
      {
        label: "今日变更",
        value: stats?.todayCount ?? 0,
        icon: Clock,
        color: "from-blue-500 to-blue-600",
      },
      {
        label: "本周变更",
        value: stats?.weekCount ?? 0,
        icon: BarChart3,
        color: "from-emerald-500 to-emerald-600",
      },
      {
        label: "本月变更",
        value: stats?.monthCount ?? 0,
        icon: Calendar,
        color: "from-purple-500 to-purple-600",
      },
      {
        label: "总变更数",
        value: stats?.total ?? 0,
        icon: History,
        color: "from-amber-500 to-amber-600",
      },
    ],
    [stats]
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">变更记录审计</h1>
            <p className="mt-1 text-sm text-slate-500">
              追踪所有数据变更，支持按字段查询，方便审计和复盘
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出记录
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}
              >
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {card.value}
                </div>
                <div className="text-sm text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  实体类型
                </label>
                <select
                  value={entityType || ""}
                  onChange={(e) => {
                    setEntityType(e.target.value || undefined);
                    setFieldName("");
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {entityTypes?.map((et) => (
                    <option key={et.value} value={et.value}>
                      {et.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  字段名
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  {entityType && fieldNames ? (
                    <select
                      value={fieldName}
                      onChange={(e) => {
                        setFieldName(e.target.value);
                        setPage(1);
                      }}
                      className="w-full h-9 rounded-md border border-slate-300 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">全部字段</option>
                      {fieldNames.map((fn) => (
                        <option key={fn} value={fn}>
                          {fn}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="请先选择实体类型"
                      value={fieldName}
                      onChange={(e) => {
                        setFieldName(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9"
                      disabled={!entityType}
                    />
                  )}
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  操作人
                </label>
                <select
                  value={operatorId || ""}
                  onChange={(e) => {
                    setOperatorId(e.target.value || undefined);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {operators?.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({getRoleLabel(op.role)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end mt-4">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  变更日期从
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  变更日期至
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  变更前值包含
                </label>
                <div className="relative">
                  <SearchX className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="搜索旧值..."
                    value={oldValue}
                    onChange={(e) => {
                      setOldValue(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  变更后值包含
                </label>
                <div className="relative">
                  <SearchCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="搜索新值..."
                    value={newValue}
                    onChange={(e) => {
                      setNewValue(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button variant="outline" onClick={handleReset}>
                重置筛选
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    实体类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    字段名称
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    变更内容
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    操作人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    变更时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    变更原因
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      加载中...
                    </td>
                  </tr>
                ) : data?.records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      暂无变更记录
                    </td>
                  </tr>
                ) : (
                  data?.records.map((record) => {
                    const Icon = getEntityIcon(record.entityType);
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center ${entityColors[record.entityType] || "bg-slate-100 text-slate-600"
                            }
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <Badge
                              className={entityColors[record.entityType] || "bg-slate-100 text-slate-600"
                            >
                              {getStatusLabel(record.entityType)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {record.fieldName}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {record.oldValue && (
                              <span className="text-sm text-red-500 line-through">
                                {record.oldValue}
                              </span>
                            )}
                            {record.oldValue && record.newValue && (
                              <span className="text-slate-400">→</span>
                            )}
                            {record.newValue && (
                              <span className="text-sm text-emerald-600 font-medium">
                                {record.newValue}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-slate-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {record.operatorName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {getRoleLabel(record.operatorRole)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-900">
                            {formatDateTime(record.changedAt)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {record.reason ? (
                            <span className="text-sm text-slate-700">
                              {record.reason}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                共 {data.total} 条，第 {page} / {data.totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1)}
                  disabled={page === data.totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
