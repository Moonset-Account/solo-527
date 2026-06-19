"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Search, Download, ListFilter, X, FileText } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { SelectEnum } from "@/components/ui/SelectEnum";
import { api } from "@/lib/trpc/client";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, USER_ROLE_LABELS, enumOptions } from "@/lib/label-maps";
import { cn, downloadCSV, buildDownloadFileName, formatDateTime, safeParseJson, truncate } from "@/lib/utils";
import type { AuditAction, AuditEntity, AuditLog } from "@prisma/client";

type Row = AuditLog & {
  asset: { id: string; name: string } | null;
  user: { id: string; name: string | null; email: string; role: string } | null;
};

export default function AuditPage() {
  const meQuery = api.user.me.useQuery();
  const usersQuery = api.user.list.useQuery({});
  const canExport = meQuery.data?.role === "ADMIN";
  const utils = api.useUtils();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<{
    entity: AuditEntity | null;
    action: AuditAction | null;
    userId: string | null;
    keyword: string | null;
    dateFrom: string | null;
    dateTo: string | null;
  }>({
    entity: null,
    action: null,
    userId: null,
    keyword: null,
    dateFrom: null,
    dateTo: null,
  });

  const listQuery = api.audit.list.useQuery(
    {
      page,
      pageSize,
      entity: filters.entity,
      action: filters.action,
      userId: filters.userId,
      keyword: filters.keyword,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
    },
    { placeholderData: keepPreviousData }
  );

  const exportMutation = api.audit.export.useMutation();

  const updateFilter = (k: keyof typeof filters, v: string | null) => {
    setFilters((prev) => ({ ...prev, [k]: v }));
    setPage(1);
  };

  const reset = () => {
    setFilters({ entity: null, action: null, userId: null, keyword: null, dateFrom: null, dateTo: null });
    setPage(1);
  };

  const handleExport = async () => {
    if (!canExport) return;
    const rows = (await exportMutation.mutateAsync({
      entity: filters.entity,
      action: filters.action,
      userId: filters.userId,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
    })) as unknown as Row[];
    const headers = [
      { key: "createdAt", label: "操作时间" },
      { key: "action", label: "动作" },
      { key: "entity", label: "实体类型" },
      { key: "entityId", label: "实体ID" },
      { key: "asset", label: "关联资产" },
      { key: "user", label: "操作人" },
      { key: "role", label: "角色" },
      { key: "note", label: "备注" },
      { key: "fields", label: "变更字段" },
    ];
    const csvRows = rows.map((r) => ({
      createdAt: formatDateTime(r.createdAt),
      action: AUDIT_ACTION_LABELS[r.action as AuditAction].label,
      entity: AUDIT_ENTITY_LABELS[r.entity as AuditEntity],
      entityId: r.entityId,
      asset: r.asset?.name ?? "",
      user: r.user?.name ?? r.user?.email ?? "",
      role: r.user ? (USER_ROLE_LABELS as Record<string, { label: string }>)[r.user.role]?.label ?? r.user.role : "",
      note: r.note ?? "",
      fields: (r.changedFields ?? []).join(", "),
    }));
    downloadCSV(buildDownloadFileName("audit_logs"), csvRows, headers);
    await utils.audit.list.invalidate();
  };

  const data = listQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">操作日志</h1>
          <p className="mt-1 text-sm text-slate-500">
            资产、配置项及敏感操作的完整审计记录。仅 IT 主管及以上角色可查看，管理员可导出。
          </p>
        </div>
        {canExport && (
          <button type="button" className="btn-secondary" onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="h-4 w-4" />
            导出 CSV
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-medium text-slate-600">
            <ListFilter className="h-4 w-4" />
            筛选
          </div>
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="搜索备注…"
              className="h-9 w-full pl-8"
              value={filters.keyword ?? ""}
              onChange={(e) => updateFilter("keyword", e.target.value || null)}
            />
          </div>
          <SelectEnum
            placeholder="实体类型"
            options={enumOptions(AUDIT_ENTITY_LABELS)}
            value={filters.entity}
            onChange={(v) => updateFilter("entity", v as AuditEntity | null)}
            className="w-36"
            nullable
          />
          <SelectEnum
            placeholder="动作"
            options={enumOptions(AUDIT_ACTION_LABELS)}
            value={filters.action}
            onChange={(v) => updateFilter("action", v as AuditAction | null)}
            className="w-32"
            nullable
          />
          <SelectEnum
            placeholder="操作人"
            options={(usersQuery.data ?? []).map((u) => ({ value: u.id, label: u.name ?? u.email }))}
            value={filters.userId}
            onChange={(v) => updateFilter("userId", v)}
            className="w-40"
            nullable
          />
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <span>起</span>
            <input
              type="date"
              className="h-9"
              value={filters.dateFrom ?? ""}
              onChange={(e) => updateFilter("dateFrom", e.target.value || null)}
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <span>止</span>
            <input
              type="date"
              className="h-9"
              value={filters.dateTo ?? ""}
              onChange={(e) => updateFilter("dateTo", e.target.value || null)}
            />
          </label>
          <button type="button" className="btn-secondary" onClick={reset}>
            <X className="h-4 w-4" />
            重置
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>操作时间</th>
                <th>动作</th>
                <th>实体类型</th>
                <th>关联资产</th>
                <th>操作人</th>
                <th>变更字段</th>
                <th>备注</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    加载中…
                  </td>
                </tr>
              ) : (data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    暂无日志
                  </td>
                </tr>
              ) : (
                (data?.items as Row[]).map((r) => (
                  <AuditRow key={r.id} row={r} />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t">
          <Pagination
            page={data?.page ?? page}
            pageSize={data?.pageSize ?? pageSize}
            total={data?.total ?? 0}
            totalPages={data?.totalPages ?? 1}
            onChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AuditRow({ row }: { row: Row }) {
  const [open, setOpen] = useState(false);
  const oldValue = safeParseJson<Record<string, unknown>>(row.oldValue);
  const newValue = safeParseJson<Record<string, unknown>>(row.newValue);
  const changedFields = row.changedFields ?? [];

  return (
    <>
      <tr className={cn(open && "bg-slate-50")}>
        <td className="whitespace-nowrap text-xs text-slate-600">{formatDateTime(row.createdAt)}</td>
        <td>
          <span className={AUDIT_ACTION_LABELS[row.action as AuditAction].cls}>
            {AUDIT_ACTION_LABELS[row.action as AuditAction].label}
          </span>
        </td>
        <td className="text-sm">{AUDIT_ENTITY_LABELS[row.entity as AuditEntity]}</td>
        <td className="text-sm text-slate-700">{row.asset?.name ?? "-"}</td>
        <td>
          <div className="text-sm font-medium text-slate-800">{row.user?.name ?? row.user?.email ?? "-"}</div>
          {row.user && (
            <span className={cn(USER_ROLE_LABELS[row.user.role as keyof typeof USER_ROLE_LABELS]?.cls, "mt-0.5 inline-block")}>
              {USER_ROLE_LABELS[row.user.role as keyof typeof USER_ROLE_LABELS]?.label ?? row.user.role}
            </span>
          )}
        </td>
        <td className="max-w-xs text-xs">
          {changedFields.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {changedFields.slice(0, 4).map((f) => (
                <span key={f} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                  {f}
                </span>
              ))}
              {changedFields.length > 4 && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                  +{changedFields.length - 4}
                </span>
              )}
            </div>
          ) : (
            "-"
          )}
        </td>
        <td className="max-w-xs text-xs text-slate-600">{row.note ? truncate(row.note, 40) : "-"}</td>
        <td>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary-700 hover:bg-primary-50"
            onClick={() => setOpen(true)}
          >
            <FileText className="h-3.5 w-3.5" />
            查看
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="border-t bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">操作详情</div>
              <button
                type="button"
                className="rounded-md p-1 text-slate-400 hover:bg-white"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-500">变更前 (oldValue)</div>
                <pre className="max-h-64 overflow-auto rounded-md border bg-white p-3 text-[11px] leading-relaxed text-slate-700">
                  {oldValue ? JSON.stringify(oldValue, null, 2) : "-"}
                </pre>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-slate-500">变更后 (newValue)</div>
                <pre className="max-h-64 overflow-auto rounded-md border bg-white p-3 text-[11px] leading-relaxed text-slate-700">
                  {newValue ? JSON.stringify(newValue, null, 2) : "-"}
                </pre>
              </div>
            </div>
            {(changedFields.length > 0 || row.note) && (
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-slate-500">变更字段：</span>
                  <span className="text-slate-700">{changedFields.join(", ") || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-500">备注：</span>
                  <span className="text-slate-700">{row.note ?? "-"}</span>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
