"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { Badge, LeadQualityBadge, LeadStatusBadge } from "@/components/ui/Badges";
import dayjs from "dayjs";

type TabKey = "mine" | "all" | "done";

export default function FollowUpsPage() {
  const { page, pageSize, setPage } = usePagination(20);
  const [tab, setTab] = useState<TabKey>("mine");
  const [filters, setFilters] = useState<{
    dateFrom?: string;
    dateTo?: string;
    assignedToId?: string;
  }>({});
  const [completeModalPlanId, setCompleteModalPlanId] = useState<string | null>(null);

  const { data: users } = api.user.list.useQuery();
  const me = api.user.me.useQuery();

  const isCompleted = tab === "done";
  const assignedToId =
    tab === "mine" ? me.data?.id : filters.assignedToId;

  const { data, isLoading, refetch } = api.followUp.plans.list.useQuery(
    {
      page,
      pageSize,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo
        ? new Date(filters.dateTo + "T23:59:59")
        : undefined,
      isCompleted,
    },
    { enabled: !!me.data }
  );

  const filteredList = data?.list.filter((p) => {
    if (tab === "mine") {
      return p.createdById === me.data?.id;
    }
    if (tab === "all") {
      return !p.isCompleted;
    }
    return true;
  }) ?? [];

  const resetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const getRowClass = (plan: any) => {
    if (plan.isCompleted) return "";
    const planDate = dayjs(plan.planDate);
    const now = dayjs();
    if (planDate.isBefore(now)) return "bg-red-50 hover:bg-red-100";
    if (planDate.diff(now, "day") <= 1)
      return "bg-amber-50 hover:bg-amber-100";
    return "hover:bg-slate-50";
  };

  const getDateBadge = (plan: any) => {
    if (plan.isCompleted) return null;
    const planDate = dayjs(plan.planDate);
    const now = dayjs();
    if (planDate.isBefore(now))
      return (
        <Badge variant="danger" className="ml-2">
          已逾期
        </Badge>
      );
    if (planDate.diff(now, "day") <= 1)
      return (
        <Badge variant="warning" className="ml-2">
          临近
        </Badge>
      );
    return null;
  };

  const tabCounts = {
    mine:
      data?.list.filter(
        (p) => !p.isCompleted && p.createdById === me.data?.id
      ).length ?? 0,
    all: data?.list.filter((p) => !p.isCompleted).length ?? 0,
    done: data?.list.filter((p) => p.isCompleted).length ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-slate-200 px-4">
          {[
            { k: "mine", label: "我的待办" },
            { k: "all", label: "全部待办" },
            { k: "done", label: "已完成" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => {
                setTab(t.k as TabKey);
                setPage(1);
              }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.k
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  tab === t.k
                    ? "bg-primary-100 text-primary-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tabCounts[t.k as keyof typeof tabCounts]}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 flex flex-wrap gap-3 items-end border-b border-slate-100">
          <div>
            <label className="label">计划日期从</label>
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
          {tab !== "mine" && (
            <div>
              <label className="label">责任人</label>
              <select
                className="input w-36"
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
          )}
          <button onClick={resetFilters} className="btn-secondary">
            重置
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                计划日期
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                客户
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                线索标题
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                质量
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                状态
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                方式
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                内容
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                创建人
              </th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">
                状态
              </th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={10}
                  className="text-center py-12 text-slate-400"
                >
                  加载中…
                </td>
              </tr>
            ) : !filteredList.length ? (
              <tr>
                <td
                  colSpan={10}
                  className="text-center py-12 text-slate-400"
                >
                  暂无回访计划
                </td>
              </tr>
            ) : (
              filteredList.map((plan) => (
                <tr key={plan.id} className={getRowClass(plan)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {dayjs(plan.planDate).format("YYYY-MM-DD")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {dayjs(plan.planDate).format("HH:mm")}
                      {getDateBadge(plan)}
                    </div>
                    {plan.completedAt && (
                      <div className="text-xs text-emerald-600 mt-1">
                        完成于{" "}
                        {dayjs(plan.completedAt).format("MM-DD HH:mm")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${plan.lead?.customerId}`}
                      className="font-medium text-primary-700 hover:underline"
                    >
                      {plan.lead?.customer?.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {plan.lead?.customer?.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${plan.leadId}`}
                      className="font-medium text-primary-700 hover:underline max-w-xs block truncate"
                      title={plan.lead?.title}
                    >
                      {plan.lead?.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {plan.lead && <LeadQualityBadge quality={plan.lead.quality} />}
                  </td>
                  <td className="px-4 py-3">
                    {plan.lead && <LeadStatusBadge status={plan.lead.status} />}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{methodText(plan.method)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="max-w-xs truncate"
                      title={plan.content}
                    >
                      {plan.content}
                    </div>
                    {plan.result && (
                      <div
                      className="text-xs text-emerald-700 mt-1 max-w-xs truncate"
                      title={plan.result}
                    >
                      ✓ {plan.result}
                    </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{plan.createdBy?.name ?? "系统"}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {plan.isCompleted ? (
                      <Badge variant="success">已完成</Badge>
                    ) : (
                      <Badge variant="warning">待执行</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!plan.isCompleted && (
                      <button
                        className="btn-primary !py-1 !px-3 text-xs"
                        onClick={() => setCompleteModalPlanId(plan.id)}
                      >
                        标记完成
                      </button>
                    )}
                    {plan.isCompleted && (
                      <Link
                        href={`/leads/${plan.leadId}`}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        查看详情
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          total={filteredList.length}
          page={page}
          pageSize={pageSize}
          onChange={setPage}
        />
      </div>

      {completeModalPlanId && (
        <CompletePlanModal
          planId={completeModalPlanId}
          onClose={() => setCompleteModalPlanId(null)}
          onDone={() => {
            setCompleteModalPlanId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CompletePlanModal({
  planId,
  onClose,
  onDone,
}: {
  planId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [result, setResult] = useState("");
  const mut = api.followUp.plans.complete.useMutation({
    onSuccess: onDone,
  });

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="标记回访完成"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="label">回访结果 *</label>
          <textarea
            className="input min-h-[120px]"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="请填写本次回访的详细结果，包括客户反馈、下一步计划等"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-primary"
            disabled={!result.trim() || mut.isPending}
            onClick={() =>
              mut.mutate({ id: planId, result: result.trim() })
            }
          >
            确认完成
          </button>
        </div>
      </div>
    </Modal>
  );
}

function methodText(method: string) {
  return {
    PHONE: "电话",
    WECHAT: "微信",
    SMS: "短信",
    EMAIL: "邮件",
    VISIT: "到店",
    OTHER: "其他",
  }[method] ?? method;
}
