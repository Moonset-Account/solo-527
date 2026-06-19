"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { ListPageTemplate } from "@/components/lists/ListPageTemplate";
import {
  ALERT_SEVERITY_LABELS,
  ALERT_STATUS_LABELS,
  enumOptions,
} from "@/lib/label-maps";
import { formatDateTime } from "@/lib/utils";
import { AlertSeverity } from "@prisma/client";
import type {
  Alert,
  AlertStatus,
  Asset,
  User,
} from "@prisma/client";

type Row = Alert & {
  asset: Pick<Asset, "id" | "name" | "ipAddress"> | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  creator: Pick<User, "id" | "name"> | null;
};

export default function AlertsPage() {
  const router = useRouter();
  const usersQuery = api.user.list.useQuery({});
  const assetsQuery = api.asset.list.useQuery({ page: 1, pageSize: 100 });
  const meQuery = api.user.me.useQuery();
  const canAssign =
    meQuery.data?.role === "ADMIN" || meQuery.data?.role === "IT_MANAGER";
  const [createOpen, setCreateOpen] = useState(false);

  const assignMutation = api.alert.assign.useMutation();
  const createMutation = api.alert.create.useMutation();
  const exportMutation = api.alert.export.useMutation();
  const utils = api.useUtils();

  return (
    <>
      <ListPageTemplate<Row, Record<string, unknown>>
        title="告警管理"
        description="值班工程师跟进告警处理，完成业务确认后可完成闭环。支持按处理人分组、按条件分页。"
        createLabel="新增告警"
        onCreate={() => setCreateOpen(true)}
        downloadBaseName="alerts"
        defaultFilters={{
          status: null,
          severity: null,
          assetId: null,
          assigneeId: null,
          businessConfirmed: null,
        }}
        filters={[
          {
            key: "severity",
            label: "严重度",
            options: enumOptions(ALERT_SEVERITY_LABELS),
          },
          {
            key: "status",
            label: "状态",
            options: enumOptions(ALERT_STATUS_LABELS),
          },
          {
            key: "assetId",
            label: "资产",
            options: (assetsQuery.data?.items ?? []).map((a) => ({
              value: a.id,
              label: a.name,
            })),
          },
          {
            key: "assigneeId",
            label: "处理人",
            options: (usersQuery.data ?? []).map((u) => ({
              value: u.id,
              label: u.name ?? u.email,
            })),
          },
          {
            key: "businessConfirmed",
            label: "业务确认",
            options: [
              { value: "true", label: "已确认" },
              { value: "false", label: "未确认" },
            ],
          },
          { key: "dateFrom", label: "开始日期", type: "date" },
          { key: "dateTo", label: "结束日期", type: "date" },
        ]}
        columns={[
          {
            key: "title",
            label: "告警标题",
            render: (r) => (
              <span className="font-medium text-slate-800">{r.title}</span>
            ),
          },
          {
            key: "severity",
            label: "严重度",
            render: (r) => (
              <span className={ALERT_SEVERITY_LABELS[r.severity].cls}>
                {ALERT_SEVERITY_LABELS[r.severity].label}
              </span>
            ),
            csvValue: (r) => ALERT_SEVERITY_LABELS[r.severity].label,
          },
          {
            key: "status",
            label: "状态",
            render: (r) => (
              <span className={ALERT_STATUS_LABELS[r.status].cls}>
                {ALERT_STATUS_LABELS[r.status].label}
              </span>
            ),
            csvValue: (r) => ALERT_STATUS_LABELS[r.status].label,
          },
          {
            key: "asset",
            label: "关联资产",
            render: (r) => r.asset?.name ?? "-",
            csvValue: (r) => r.asset?.name ?? "",
          },
          {
            key: "assignee",
            label: "处理人",
            render: (r) => (
              canAssign ? (
                <select
                  className="h-7 w-32 text-xs"
                  value={r.assigneeId ?? ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={async (e) => {
                    await assignMutation.mutateAsync({
                      id: r.id,
                      assigneeId: e.target.value || null,
                    });
                    await utils.alert.list.invalidate();
                  }}
                >
                  <option value="">未指派</option>
                  {(usersQuery.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </option>
                  ))}
                </select>
              ) : (
                r.assignee?.name ?? r.assignee?.email ?? "-"
              )
            ),
            csvValue: (r) => r.assignee?.name ?? r.assignee?.email ?? "",
          },
          {
            key: "businessConfirmed",
            label: "业务确认",
            render: (r) =>
              r.businessConfirmed ? (
                <span className="badge bg-success-100 text-success-700">
                  已确认 · {r.businessConfirmedBy}
                </span>
              ) : (
                <span className="badge bg-slate-100 text-slate-500">
                  待确认
                </span>
              ),
            csvValue: (r) =>
              r.businessConfirmed
                ? `已确认:${r.businessConfirmedBy ?? ""}`
                : "待确认",
          },
          {
            key: "createdAt",
            label: "创建时间",
            render: (r) => formatDateTime(r.createdAt),
            csvValue: (r) => formatDateTime(r.createdAt),
          },
        ]}
        exportHeaders={[
          { key: "title", label: "告警标题" },
          { key: "severity", label: "严重度" },
          { key: "status", label: "状态" },
          { key: "asset", label: "关联资产" },
          { key: "assignee", label: "处理人" },
          { key: "creator", label: "创建人" },
          { key: "businessConfirmed", label: "业务确认" },
          { key: "resolution", label: "解决说明" },
          { key: "createdAt", label: "创建时间" },
          { key: "resolvedAt", label: "解决时间" },
        ]}
        onRowClick={(r) => router.push(`/alerts/${r.id}`)}
        query={(input) =>
          api.alert.list.useQuery(
            {
              ...input,
              businessConfirmed:
                input.businessConfirmed === "true"
                  ? true
                  : input.businessConfirmed === "false"
                  ? false
                  : null,
            },
            { placeholderData: keepPreviousData }
          )
        }
        exportMutation={exportMutation as unknown as {
          mutateAsync: (
            input: Omit<
              Record<string, unknown>,
              "page" | "pageSize" | "groupByOwner" | "groupByAssignee"
            >
          ) => Promise<Row[]>;
          isPending: boolean;
        }}
        exportInputTransform={(input) => {
          const bc = input.businessConfirmed as string | null;
          return {
            ...input,
            businessConfirmed: bc === "true" ? true : bc === "false" ? false : null,
          } as Omit<Record<string, unknown>, "page" | "pageSize" | "groupByOwner" | "groupByAssignee">;
        }}
      />
      {createOpen && (
        <CreateAlertModal
          users={usersQuery.data ?? []}
          assets={assetsQuery.data?.items ?? []}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            await utils.alert.list.invalidate();
          }}
          create={createMutation}
        />
      )}
    </>
  );
}

function CreateAlertModal({
  users,
  assets,
  onClose,
  onCreated,
  create,
}: {
  users: { id: string; name: string | null; email: string }[];
  assets: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
  create: ReturnType<typeof api.alert.create.useMutation>;
}) {
  const [form, setForm] = useState({
    title: "",
    severity: AlertSeverity.WARNING as AlertSeverity,
    description: "",
    source: "",
    assetId: "" as string | null,
    assigneeId: "" as string | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      ...form,
      description: form.description || null,
      source: form.source || null,
      assetId: form.assetId || null,
      assigneeId: form.assigneeId || null,
    });
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold">新增告警</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2">
            <div className="mb-1 text-xs font-medium text-slate-600">标题 *</div>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            <div className="mb-1 text-xs font-medium text-slate-600">严重度</div>
            <select
              value={form.severity}
              onChange={(e) =>
                setForm({ ...form, severity: e.target.value as AlertSeverity })
              }
            >
              {enumOptions(ALERT_SEVERITY_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="mb-1 text-xs font-medium text-slate-600">关联资产</div>
            <select
              value={form.assetId ?? ""}
              onChange={(e) =>
                setForm({ ...form, assetId: e.target.value || null })
              }
            >
              <option value="">未关联</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="mb-1 text-xs font-medium text-slate-600">来源</div>
            <input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </label>
          <label>
            <div className="mb-1 text-xs font-medium text-slate-600">指派处理人</div>
            <select
              value={form.assigneeId ?? ""}
              onChange={(e) =>
                setForm({ ...form, assigneeId: e.target.value || null })
              }
            >
              <option value="">未指派</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2">
            <div className="mb-1 text-xs font-medium text-slate-600">描述</div>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={create.isPending}
          >
            取消
          </button>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            创建
          </button>
        </div>
      </form>
    </div>
  );
}
