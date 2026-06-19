"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { ListPageTemplate } from "@/components/lists/ListPageTemplate";
import {
  VULN_SEVERITY_LABELS,
  VULN_STATUS_LABELS,
  enumOptions,
} from "@/lib/label-maps";
import { formatDateTime } from "@/lib/utils";
import type {
  Asset,
  User,
  Vulnerability,
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "@prisma/client";
import { X } from "lucide-react";

type Row = Vulnerability & {
  asset: Pick<Asset, "id" | "name" | "ipAddress"> | null;
  responsible: Pick<User, "id" | "name" | "email"> | null;
};

export default function VulnPage() {
  const router = useRouter();
  const usersQuery = api.user.list.useQuery();
  const assetsQuery = api.asset.list.useQuery({ page: 1, pageSize: 100 });
  const meQuery = api.user.me.useQuery();
  const canWrite =
    meQuery.data?.role === "ADMIN" || meQuery.data?.role === "IT_MANAGER";
  const utils = api.useUtils();
  const updateMutation = api.vulnerability.update.useMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const createMutation = api.vulnerability.create.useMutation();

  return (
    <>
      <ListPageTemplate<Row, Record<string, unknown>>
        title="漏洞修复"
        description="核对各负责人的漏洞修复进度，支持按负责人分组、按状态和严重度筛选。"
        createLabel="登记漏洞"
        canCreate={canWrite}
        onCreate={() => setCreateOpen(true)}
        downloadBaseName="vulnerabilities"
        defaultFilters={{ severity: null, status: null, assetId: null, responsibleUserId: null }}
        filters={[
          { key: "severity", label: "严重度", options: enumOptions(VULN_SEVERITY_LABELS) },
          { key: "status", label: "状态", options: enumOptions(VULN_STATUS_LABELS) },
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
          { key: "title", label: "漏洞标题" },
          { key: "cveId", label: "CVE 编号" },
          {
            key: "severity",
            label: "严重度",
            render: (r) => (
              <span className={VULN_SEVERITY_LABELS[r.severity].cls}>
                {VULN_SEVERITY_LABELS[r.severity].label}
              </span>
            ),
            csvValue: (r) => VULN_SEVERITY_LABELS[r.severity].label,
          },
          {
            key: "status",
            label: "修复状态",
            render: (r) =>
              canWrite ? (
                <select
                  className="h-7 w-28 text-xs"
                  value={r.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={async (e) => {
                    await updateMutation.mutateAsync({
                      id: r.id,
                      data: { status: e.target.value as VulnerabilityStatus },
                    });
                    await utils.vulnerability.list.invalidate();
                  }}
                >
                  {enumOptions(VULN_STATUS_LABELS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={VULN_STATUS_LABELS[r.status].cls}>
                  {VULN_STATUS_LABELS[r.status].label}
                </span>
              ),
            csvValue: (r) => VULN_STATUS_LABELS[r.status].label,
          },
          { key: "asset", label: "资产", render: (r) => r.asset?.name ?? "-", csvValue: (r) => r.asset?.name ?? "" },
          {
            key: "responsible",
            label: "负责人",
            render: (r) => r.responsible?.name ?? r.responsible?.email ?? "-",
            csvValue: (r) => r.responsible?.name ?? r.responsible?.email ?? "",
          },
          { key: "discoveredAt", label: "发现时间", render: (r) => formatDateTime(r.discoveredAt), csvValue: (r) => formatDateTime(r.discoveredAt) },
          { key: "dueDate", label: "截止时间", render: (r) => formatDateTime(r.dueDate), csvValue: (r) => formatDateTime(r.dueDate) },
        ]}
        exportHeaders={[
          { key: "cveId", label: "CVE编号" },
          { key: "title", label: "漏洞标题" },
          { key: "severity", label: "严重度" },
          { key: "status", label: "状态" },
          { key: "asset", label: "资产" },
          { key: "responsible", label: "负责人" },
          { key: "discoveredAt", label: "发现时间" },
          { key: "fixedAt", label: "修复时间" },
          { key: "fixVersion", label: "修复版本" },
          { key: "patchReference", label: "补丁参考" },
        ]}
        onRowClick={(r) => router.push(`/assets/${r.assetId}`)}
        query={(input) => api.vulnerability.list.useQuery(input, { keepPreviousData: true })}
        exportMutation={api.vulnerability.export.useMutation as unknown as {
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
            await utils.vulnerability.list.invalidate();
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
  mutation: ReturnType<typeof api.vulnerability.create.useMutation>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    cveId: "",
    title: "",
    description: "",
    severity: VulnerabilitySeverity.HIGH as VulnerabilitySeverity,
    assetId: "",
    discoveredBy: "",
    discoveredAt: new Date().toISOString().slice(0, 16),
    dueDate: "",
    fixVersion: "",
    patchReference: "",
    responsibleUserId: "",
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
      cveId: form.cveId || null,
      title: form.title,
      description: form.description || null,
      severity: form.severity,
      assetId: form.assetId,
      discoveredBy: form.discoveredBy || null,
      discoveredAt: new Date(form.discoveredAt),
      dueDate: form.dueDate ? new Date(form.dueDate) : null,
      fixVersion: form.fixVersion || null,
      patchReference: form.patchReference || null,
      responsibleUserId: form.responsibleUserId || null,
    });
    onDone();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-xl border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">登记漏洞</h2>
          <button type="button" className="rounded-md p-1 text-slate-400 hover:bg-slate-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <Field label="严重度" required>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as VulnerabilitySeverity })}
            >
              {enumOptions(VULN_SEVERITY_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="漏洞标题" required className="col-span-2">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="CVE 编号">
            <input value={form.cveId} onChange={(e) => setForm({ ...form, cveId: e.target.value })} />
          </Field>
          <Field label="发现人">
            <input value={form.discoveredBy} onChange={(e) => setForm({ ...form, discoveredBy: e.target.value })} />
          </Field>
          <Field label="发现时间" required>
            <input
              type="datetime-local"
              required
              value={form.discoveredAt}
              onChange={(e) => setForm({ ...form, discoveredAt: e.target.value })}
            />
          </Field>
          <Field label="截止时间">
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </Field>
          <Field label="修复版本">
            <input value={form.fixVersion} onChange={(e) => setForm({ ...form, fixVersion: e.target.value })} />
          </Field>
          <Field label="补丁参考">
            <input
              value={form.patchReference}
              onChange={(e) => setForm({ ...form, patchReference: e.target.value })}
            />
          </Field>
          <Field label="负责人">
            <select
              value={form.responsibleUserId}
              onChange={(e) => setForm({ ...form, responsibleUserId: e.target.value })}
            >
              <option value="">未指派</option>
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
