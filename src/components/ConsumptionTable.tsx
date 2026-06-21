"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { StatusChip, consumptionStatusVariant } from "@/components/ui/StatusChip";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { ConsumptionTraceDialog } from "@/components/ConsumptionTraceDialog";
import { Search, Calendar, Filter, Users, Clock, Eye, CheckCircle } from "lucide-react";
import type { ConsumptionStatus } from "@/types";

interface Props {
  initialClasses: { id: string; name: string }[];
  initialStudents: { id: string; name: string }[];
}

type ConsItem = {
  id: string;
  studentName: string;
  className: string;
  lessonTitle?: string;
  lessonAt?: Date;
  hours: number;
  status: ConsumptionStatus;
  operatorName: string;
  createdAt: Date;
};

export function ConsumptionTable({ initialClasses, initialStudents }: Props) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    keyword: "",
    classId: "",
    studentId: "",
    status: "" as ConsumptionStatus | "",
    startDate: "",
    endDate: "",
  });

  const { data, refetch } = trpc.consumptions.list.useQuery({
    page,
    pageSize: 10,
    classId: filters.classId || undefined,
    studentId: filters.studentId || undefined,
    status: filters.status || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    keyword: filters.keyword || undefined,
  });

  const reconcile = trpc.consumptions.reconcile.useMutation({
    onSuccess: () => { refetch(); setSelectedIds([]); },
  });

  const handleFilterChange = (k: keyof typeof filters, v: string) => {
    setFilters({ ...filters, [k]: v });
    setPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedIds(data.items.map((i: ConsItem) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) setSelectedIds([...selectedIds, id]);
    else setSelectedIds(selectedIds.filter((x) => x !== id));
  };

  const statuses: { v: ConsumptionStatus; label: string }[] = [
    { v: "NORMAL", label: "正常" },
    { v: "EXCEPTION", label: "异常" },
    { v: "RECONCILED", label: "已对账" },
  ];

  const items: ConsItem[] = (data?.items ?? []) as ConsItem[];

  return (
    <div className="space-y-5">
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-deep-blue-400" />
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue-300" />
            <input
              value={filters.keyword}
              onChange={(e) => handleFilterChange("keyword", e.target.value)}
              placeholder="搜索学生姓名..."
              className="input pl-9 !py-1.5 text-xs"
            />
          </div>
          <select
            value={filters.classId}
            onChange={(e) => handleFilterChange("classId", e.target.value)}
            className="input w-auto !py-1.5 text-xs"
          >
            <option value="">全部班级</option>
            {initialClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.studentId}
            onChange={(e) => handleFilterChange("studentId", e.target.value)}
            className="input w-auto !py-1.5 text-xs"
          >
            <option value="">全部学生</option>
            {initialStudents.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value as any)}
            className="input w-auto !py-1.5 text-xs"
          >
            <option value="">全部状态</option>
            {statuses.map((s) => (
              <option key={s.v} value={s.v}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={14} className="text-deep-blue-400" />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="input w-auto !py-1.5 text-xs"
          />
          <span className="text-deep-blue-400 text-xs">至</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="input w-auto !py-1.5 text-xs"
          />
          <button
            onClick={() => { setFilters({ keyword: "", classId: "", studentId: "", status: "", startDate: "", endDate: "" }); setPage(1); }}
            className="btn-secondary !py-1.5 text-xs"
          >
            重置筛选
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-xs text-deep-blue-400 mb-1">消耗记录</div>
          <div className="text-2xl font-bold text-deep-blue-700 num">{formatNumber(data?.total ?? 0)}</div>
          <div className="text-[11px] text-deep-blue-400 mt-1 flex items-center gap-1">
            <Clock size={11} />共 <span className="num text-ink-gold-600 font-semibold">{formatNumber(data?.sum ?? 0)}</span> 课时
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-deep-blue-400 mb-1">正常消耗</div>
          <div className="text-2xl font-bold text-success-green num">
            {formatNumber(items.filter((d) => d.status === "NORMAL").length)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-deep-blue-400 mb-1">异常记录</div>
          <div className="text-2xl font-bold text-alert-red num">
            {formatNumber(items.filter((d) => d.status === "EXCEPTION").length)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-deep-blue-400 mb-1">已对账</div>
          <div className="text-2xl font-bold text-ink-gold-600 num">
            {formatNumber(items.filter((d) => d.status === "RECONCILED").length)}
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="card p-3 flex items-center justify-between">
          <div className="text-xs text-deep-blue-600 flex items-center gap-2">
            <CheckCircle size={14} className="text-success-green" />
            已选择 <span className="num font-semibold text-deep-blue-700">{selectedIds.length}</span> 条记录
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reconcile.mutate({ ids: selectedIds })}
              className="btn-gold !py-1.5 text-xs"
              disabled={reconcile.isPending}
            >
              <CheckCircle size={13} />批量对账
            </button>
          </div>
        </div>
      )}

      {data && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2 bg-deep-blue-50/40 border-b border-deep-blue-50 flex items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={data.items.length > 0 && selectedIds.length === data.items.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-3.5 h-3.5 accent-ink-gold-500"
              />
              <span className="text-xs text-deep-blue-500 ml-2">全选本页</span>
            </div>
          </div>
        </div>
      )}

      <DataTable<ConsItem>
        columns={[
          { key: "select", header: "", width: "40px", render: (r) => (
            <input
              type="checkbox"
              checked={selectedIds.includes(r.id)}
              onChange={(e) => handleSelect(r.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-3.5 h-3.5 accent-ink-gold-500"
            />
          )},
          { key: "studentName", header: "学生", width: "100px", render: (r) => (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-gold-400 to-ink-gold-600 text-white flex items-center justify-center text-xs font-semibold">
                {r.studentName.slice(0, 1)}
              </div>
              <span className="text-sm font-medium text-deep-blue-700">{r.studentName}</span>
            </div>
          )},
          { key: "className", header: "班级", width: "130px", render: (r) => (
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-deep-blue-400" />
              <span className="text-sm text-deep-blue-600">{r.className}</span>
            </div>
          )},
          { key: "lessonTitle", header: "课程", render: (r) => (
            <div>
              <div className="text-sm text-deep-blue-700">{r.lessonTitle ?? "-"}</div>
              <div className="text-[11px] text-deep-blue-400">{r.lessonAt ? formatDateTime(r.lessonAt) : ""}</div>
            </div>
          )},
          { key: "hours", header: "课时", width: "70px", align: "right", render: (r) => (
            <span className="text-sm font-semibold text-deep-blue-700 num">-{r.hours}</span>
          )},
          { key: "status", header: "状态", width: "90px", render: (r) => (
            <StatusChip variant={consumptionStatusVariant(r.status)} pulse={r.status === "EXCEPTION"}>
              {r.status === "NORMAL" ? "正常" : r.status === "EXCEPTION" ? "异常" : "已对账"}
            </StatusChip>
          )},
          { key: "operatorName", header: "操作人", width: "80px", render: (r) => (
            <span className="text-xs text-deep-blue-500">{r.operatorName}</span>
          )},
          { key: "createdAt", header: "消耗时间", width: "140px", render: (r) => (
            <span className="text-xs text-deep-blue-500">{formatDateTime(r.createdAt)}</span>
          )},
          { key: "actions", header: "操作", width: "80px", align: "right", render: (r) => (
            <button
              onClick={(e) => { e.stopPropagation(); setTraceId(r.id); }}
              className="text-xs text-ink-gold-600 hover:text-ink-gold-700 inline-flex items-center gap-1"
            >
              <Eye size={13} />追溯
            </button>
          )},
        ]}
        data={items}
        rowKey={(r) => r.id}
        onClickRow={(r) => setTraceId(r.id)}
      />

      {data && <Pagination page={page} pageSize={10} total={data.total} onPageChange={setPage} />}

      {traceId && (
        <ConsumptionTraceDialog
          open={!!traceId}
          consumptionId={traceId}
          onClose={() => setTraceId(null)}
        />
      )}
    </div>
  );
}
