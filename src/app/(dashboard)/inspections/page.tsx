"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { ListPageTemplate } from "@/components/lists/ListPageTemplate";
import { INSPECTION_STATUS_LABELS, enumOptions } from "@/lib/label-maps";
import { formatDateTime } from "@/lib/utils";
import type { Asset, Inspection, InspectionStatus, User } from "@prisma/client";

type Row = Inspection & {
  asset: Pick<Asset, "id" | "name" | "ipAddress"> | null;
  inspector: Pick<User, "id" | "name"> | null;
  responsible: Pick<User, "id" | "name" | "email"> | null;
};

export default function InspectionPage() {
  const router = useRouter();
  const usersQuery = api.user.list.useQuery({});
  const assetsQuery = api.asset.list.useQuery({ page: 1, pageSize: 100 });
  const meQuery = api.user.me.useQuery();
  const canWrite =
    meQuery.data?.role === "ADMIN" || meQuery.data?.role === "IT_MANAGER";
  const utils = api.useUtils();
  const updateMutation = api.inspection.update.useMutation();
  const createMutation = api.inspection.create.useMutation();
  const exportMutation = api.inspection.export.useMutation();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <ListPageTemplate<Row, Record<string, unknown>>
        title="设备巡检"
        description="设备巡检计划与执行记录，按负责人分组核对执行情况。"
        createLabel="新增巡检"
        canCreate={canWrite}
        onCreate={() => setCreateOpen(true)}
        downloadBaseName="inspections"
        defaultFilters={{ status: null, assetId: null, responsibleUserId: null }}
        filters={[
          { key: "status", label: "状态", options: enumOptions(INSPECTION_STATUS_LABELS) },
          {
            key: "assetId",
            label: "资产",
            options: (assetsQuery.data?.items ?? []).map((a) => ({ value: a.id, label: a.name })),
          },
          {
            key: "responsibleUserId",
            label: "负责人",
            options: (usersQuery.data ?? []).map((u) => ({
              value: u.id,
              label: u.name ?? u.email,
            })),
          },
        ]}
        columns={[
          { key: "title", label: "巡检标题" },
          {
            key: "status",
            label: "状态",
            render: (r) =>
              canWrite ? (
                <select
                  className="h-7 w-28 text-xs"
                  value={r.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={async (e) => {
                    await updateMutation.mutateAsync({
                      id: r.id,
                      data: { status: e.target.value as InspectionStatus },
                    });
                    await utils.inspection.list.invalidate();
                  }}
                >
                  {enumOptions(INSPECTION_STATUS_LABELS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={INSPECTION_STATUS_LABELS[r.status].cls}>
                  {INSPECTION_STATUS_LABELS[r.status].label}
                </span>
              ),
            csvValue: (r) => INSPECTION_STATUS_LABELS[r.status].label,
          },
          { key: "asset", label: "资产", render: (r) => r.asset?.name ?? "-", csvValue: (r) => r.asset?.name ?? "" },
          { key: "inspector", label: "巡检人", render: (r) => r.inspector?.name ?? "-", csvValue: (r) => r.inspector?.name ?? "" },
          {
            key: "responsible",
            label: "负责人",
            render: (r) => r.responsible?.name ?? r.responsible?.email ?? "-",
            csvValue: (r) => r.responsible?.name ?? r.responsible?.email ?? "",
          },
          { key: "scheduledAt", label: "计划时间", render: (r) => formatDateTime(r.scheduledAt), csvValue: (r) => formatDateTime(r.scheduledAt) },
          { key: "completedAt", label: "完成时间", render: (r) => formatDateTime(r.completedAt), csvValue: (r) => formatDateTime(r.completedAt) },
          { key: "result", label: "结果", render: (r) => r.result ?? "-" },
        ]}
        exportHeaders={[
          { key: "title", label: "标题" },
          { key: "status", label: "状态" },
          { key: "asset", label: "资产" },
          { key: "inspector", label: "巡检人" },
          { key: "responsible", label: "负责人" },
          { key: "scheduledAt", label: "计划时间" },
          { key: "completedAt", label: "完成时间" },
          { key: "result", label: "结果" },
          { key: "issuesFound", label: "发现问题" },
        ]}
        onRowClick={(r) => router.push(`/assets/${r.assetId}`)}
        query={(input) => api.inspection.list.useQuery(input, { placeholderData: keepPreviousData })}
        exportMutation={exportMutation as unknown as {
          mutateAsync: (input: Omit<Record<string, unknown>, "page" | "pageSize" | "groupByOwner" | "groupByAssignee">) => Promise<Row[]>;
          isPending: boolean;
        }}
      />
      {createOpen && (
        <CreateModal
          assets={assetsQuery.data?.items ?? []}
          users={usersQuery.data ?? []}
          mutation={createMutation}
          onClose={() => setCreateOpen(false)}
          onDone={async () => {
            setCreateOpen(false);
            await utils.inspection.list.invalidate();
          }}
        />
      )}
    </>
  );
}

function CreateModal({
  assets,
  users,
  mutation,
  onClose,
  onDone,
}: {
  assets: { id: string; name: string }[];
  users: { id: string; name: string | null; email: string }[];
  mutation: ReturnType<typeof api.inspection.create.useMutation>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assetId: "",
    scheduledAt: new Date().toISOString().slice(0, 16),
    inspectorUserId: "",
    responsibleUserId: "",
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
      title: form.title,
      description: form.description || null,
      assetId: form.assetId,
      scheduledAt: new Date(form.scheduledAt),
      inspectorUserId: form.inspectorUserId || null,
      responsibleUserId: form.responsibleUserId || null,
    });
    onDone();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">新增巡检</h2>
          <button type="button" className="rounded-md p-1 text-slate-400 hover:bg-slate-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="标题" required className="col-span-2">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="资产" required>
            <select value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} required>
              <option value="">请选择</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="计划时间" required>
            <input
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </Field>
          <Field label="巡检人">
            <select
              value={form.inspectorUserId}
              onChange={(e) => setForm({ ...form, inspectorUserId: e.target.value })}
            >
              <option value="">未指定</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="负责人">
            <select
              value={form.responsibleUserId}
              onChange={(e) => setForm({ ...form, responsibleUserId: e.target.value })}
            >
              <option value="">未指定</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="描述" className="col-span-2">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={mutation.isPending}>
            取消
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            创建
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <div className="mb-1 text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-danger-600">*</span>}
      </div>
      {children}
    </label>
  );
}
