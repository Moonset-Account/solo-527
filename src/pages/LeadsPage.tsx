"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import {
  LeadQualityBadge,
  LeadStatusBadge,
  Badge,
} from "@/components/ui/Badges";
import type { LeadQuality, LeadStatus } from "@prisma/client";
import dayjs from "dayjs";

export default function LeadsPage() {
  const { page, pageSize, setPage } = usePagination(15);
  const [filters, setFilters] = useState<{
    keyword?: string;
    quality?: LeadQuality;
    status?: LeadStatus;
    stageId?: string;
    assignedToId?: string;
    dateFrom?: string;
    dateTo?: string;
    isAnomaly?: boolean;
  }>({});

  const trpc = api.useContext();
  const { data: stages } = api.stage.list.useQuery();
  const { data: users } = api.user.list.useQuery();

  const { data, isLoading, refetch } = api.lead.list.useQuery({
    page,
    pageSize,
    keyword: filters.keyword || undefined,
    quality: filters.quality,
    status: filters.status,
    stageId: filters.stageId,
    assignedToId: filters.assignedToId,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
    isAnomaly: filters.isAnomaly,
  });

  const { data: exportData } = api.lead.export.useQuery(
    {
      quality: filters.quality,
      status: filters.status,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
    },
    { enabled: false }
  );

  const handleExport = async () => {
    const result = await trpc.lead.export.fetch({
      quality: filters.quality,
      status: filters.status,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
    });

    const csvContent = [
      result.headers.join(","),
      ...result.rows.map((row: (string | number | null | undefined)[]) =>
        row.map((cell: string | number | null | undefined) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const isHighQualityStale = (lead: any) => {
    if (lead.quality !== "HIGH") return false;
    const lastFollow = lead.lastFollowAt
      ? dayjs(lead.lastFollowAt)
      : dayjs(lead.createdAt);
    return dayjs().diff(lastFollow, "day") > 3;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end flex-1">
          <div className="flex-1 min-w-[240px]">
            <label className="label">关键词搜索</label>
            <input
              className="input"
              placeholder="客户名 / 线索标题 / 电话"
              value={filters.keyword ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">质量</label>
            <select
              className="input w-32"
              value={filters.quality ?? ""}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  quality: (e.target.value as LeadQuality) || undefined,
                });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="HIGH">高意向</option>
              <option value="MEDIUM">中意向</option>
              <option value="LOW">低意向</option>
              <option value="POTENTIAL">待评估</option>
            </select>
          </div>
          <div>
            <label className="label">状态</label>
            <select
              className="input w-32"
              value={filters.status ?? ""}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  status: (e.target.value as LeadStatus) || undefined,
                });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="NEW">新建</option>
              <option value="CONTACTING">跟进中</option>
              <option value="APPOINTED">已预约</option>
              <option value="VISITED">已到店</option>
              <option value="TREATING">治疗中</option>
              <option value="CLOSED_WON">已成交</option>
              <option value="CLOSED_LOST">已流失</option>
              <option value="SUSPENDED">已暂缓</option>
            </select>
          </div>
          <div>
            <label className="label">阶段</label>
            <select
              className="input w-32"
              value={filters.stageId ?? ""}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  stageId: e.target.value || undefined,
                });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              {stages?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">责任人</label>
            <select
              className="input w-32"
              value={filters.assignedToId ?? ""}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  assignedToId: e.target.value || undefined,
                });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">日期从</label>
            <input
              type="date"
              className="input w-40"
              value={filters.dateFrom ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, dateFrom: e.target.value });
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="label">至</label>
            <input
              type="date"
              className="input w-40"
              value={filters.dateTo ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, dateTo: e.target.value });
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="label">异常</label>
            <select
              className="input w-28"
              value={filters.isAnomaly === undefined ? "" : filters.isAnomaly ? "1" : "0"}
              onChange={(e) => {
                const v = e.target.value;
                setFilters({
                  ...filters,
                  isAnomaly: v === "" ? undefined : v === "1",
                });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="1">异常</option>
              <option value="0">正常</option>
            </select>
          </div>
          <button onClick={resetFilters} className="btn-secondary">
            重置
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            📥 导出 CSV
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">客户 / 电话</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">线索标题</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">质量</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">阶段</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">责任人</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">预估金额</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">已回款</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">跟进次数</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">下次回访</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400">
                  加载中…
                </td>
              </tr>
            ) : !data?.list.length ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400">
                  暂无线索数据
                </td>
              </tr>
            ) : (
              data.list.map((lead) => {
                const stale = isHighQualityStale(lead);
                const totalPaid = lead.payments.reduce(
                  (s, p) => s + Number(p.paidAmount),
                  0
                );
                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-50 ${
                      stale ? "bg-red-50 hover:bg-red-100" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${lead.customerId}`}
                        className="font-medium text-primary-700 hover:underline"
                      >
                        {lead.customer?.name}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {lead.customer?.phone}
                      </div>
                      {stale && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          ⚠️ 高意向超3天未跟进
                        </div>
                      )}
                      {lead.isAnomaly && (
                        <div>
                          <Badge variant="danger" className="mt-1">
                            异常
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-primary-700 hover:underline"
                      >
                        {lead.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <LeadQualityBadge quality={lead.quality} />
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.stage?.name ?? (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.assignedTo?.name ?? (
                        <span className="text-slate-400">未分配</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ¥{(Number(lead.estimatedAmount) || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      ¥{totalPaid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {lead.followUpCount}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {lead.nextFollowAt
                        ? dayjs(lead.nextFollowAt).format("MM-DD HH:mm")
                        : <span className="text-slate-400">未安排</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination
          total={data?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
