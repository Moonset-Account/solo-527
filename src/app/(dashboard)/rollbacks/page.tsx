"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { ListPageTemplate } from "@/components/lists/ListPageTemplate";
import { ROLLBACK_STATUS_LABELS, enumOptions } from "@/lib/label-maps";
import { formatDateTime } from "@/lib/utils";
import type { Asset, RollbackPlan, RollbackStatus, User } from "@prisma/client";

type Row = RollbackPlan & {
  asset: Pick<Asset, "id" | "name" | "ipAddress"> | null;
  approver: Pick<User, "id" | "name"> | null;
  executedBy: Pick<User, "id" | "name"> | null;
  responsible: Pick<User, "id" | "name" | "email"> | null;
};

export default function RollbackPage() {
  const router = useRouter();
  const usersQuery = api.user.list.useQuery({});
  const assetsQuery = api.asset.list.useQuery({ page: 1, pageSize: 100 });
  const meQuery = api.user.me.useQuery();
  const canWrite =
    meQuery.data?.role === "ADMIN" || meQuery.data?.role === "IT_MANAGER";
  const canApprove = meQuery.data?.role === "ADMIN";
  const utils = api.useUtils();
  const updateMutation = api.rollback.update.useMutation();
  const approveMutation = api.rollback.approve.useMutation();
  const createMutation = api.rollback.create.useMutation();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <ListPageTemplate<Row, Record<string, unknown>>
        title="回滚方案"
        description="变更回滚预案与执行记录，管理员可审批，支持按负责人分组。"
        createLabel="新建方案"
        canCreate={canWrite}
        onCreate={() => setCreateOpen(true)}
        downloadBaseName="rollback_plans"
        defaultFilters={{ status: null, assetId: null, responsibleUserId: null }}
        filters={[
          { key: "status", label: "状态", options: enumOptions(ROLLBACK_STATUS_LABELS) },
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
          { key: "title", label: "方案标题" },
          {
            key: "status",
            label: "状态",
            render: (r) =>
              canWrite ? (
                <div className="flex items-center gap-1">
                  <select
                    className="h-7 w-28 text-xs"
                    value={r.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={async (e) => {
                      await updateMutation.mutateAsync({
                        id: r.id,
                        data: { status: e.target.value as RollbackStatus },
                      });
                      await utils.rollback.list.invalidate();
                    }}
                  >
                    {enumOptions(ROLLBACK_STATUS_LABELS).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {canApprove && r.status === "PLANNED" && (
                    <button
                      type="button"
                      className="btn-success h-7 px-2 text-xs"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const note = prompt("审批意见（可选）");
                        await approveMutation.mutateAsync({ id: r.id, note });
                        await utils.rollback.list.invalidate();
                      }}
                    >
                      <Check className="h-3.5 w-3.5" /> 审批
                    </button>
                  )}
                </div>
              ) : (
                <span className={ROLLBACK_STATUS_LABELS[r.status].cls}>
                  {ROLLBACK_STATUS_LABELS[r.status].label}
                </span>
              ),
            csvValue: (r) => ROLLBACK_STATUS_LABELS[r.status].label,
          },
          { key: "asset", label: "资产", render: (r) => r.asset?.name ?? "-", csvValue: (r) => r.asset?.name ?? "" },
          {
            key: "responsible",
            label: "负责人",
            render: (r) => r.responsible?.name ?? r.responsible?.email ?? "-",
            csvValue: (r) => r.responsible?.name ?? r.responsible?.email ?? "",
          },
          { key: "approver", label: "审批人", render: (r) => r.approver?.name ?? "-", csvValue: (r) => r.approver?.name ?? "" },
          { key: "approvedAt", label: "审批时间", render: (r) => formatDateTime(r.approvedAt), csvValue: (r) => formatDateTime(r.approvedAt) },
          { key: "completedAt", label: "完成时间", render: (r) => formatDateTime(r.completedAt), csvValue: (r) => formatDateTime(r.completedAt) },
        ]}
        exportHeaders={[
          { key: "title", label: "标题" },
          { key: "status", label: "状态" },
          { key: "asset", label: "资产" },
          { key: "responsible", label: "负责人" },
          { key: "approver", label: "审批人" },
          { key: "approvedAt", label: "审批时间" },
          { key: "changeReason", label: "变更原因" },
          { key: "riskAssessment", label: "风险评估" },
        ]}
        onRowClick={(r) => router.push(`/assets/${r.assetId}`)}
        query={(input) => api.rollback.list.useQuery(input, { placeholderData: keepPreviousData })}
        exportMutation={api.rollback.export.useMutation as unknown as {
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
            await utils.rollback.list.invalidate();
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
  mutation: ReturnType<typeof api.rollback.create.useMutation>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assetId: "",
    changeReason: "",
    riskAssessment: "",
    responsibleUserId: "",
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
      title: form.title,
      description: form.description || null,
      assetId: form.assetId,
      changeReason: form.changeReason || null,
      riskAssessment: form.riskAssessment || null,
      responsibleUserId: form.responsibleUserId || null,
    });
    onDone();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">新建回滚方案</h2>
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
          <Field label="变更原因" className="col-span-2">
            <textarea rows={2} value={form.changeReason} onChange={(e) => setForm({ ...form, changeReason: e.target.value })} />
          </Field>
          <Field label="风险评估" className="col-span-2">
            <textarea rows={2} value={form.riskAssessment} onChange={(e) => setForm({ ...form, riskAssessment: e.target.value })} />
          </Field>
          <Field label="方案描述" className="col-span-2">
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
