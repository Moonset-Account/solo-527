"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { ASSET_STATUS_LABELS, ASSET_TYPE_LABELS, enumOptions } from "@/lib/label-maps";
import type { Asset, AssetStatus, AssetType } from "@prisma/client";

export interface AssetModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Asset | null;
}

export function AssetModal({ open, onClose, initial }: AssetModalProps) {
  const create = api.asset.create.useMutation();
  const update = api.asset.update.useMutation();
  const utils = api.useUtils();
  const usersQuery = api.user.list.useQuery();

  const [form, setForm] = useState({
    name: "",
    type: AssetType.SERVER as AssetType,
    status: AssetStatus.RUNNING as AssetStatus,
    ipAddress: "",
    hostname: "",
    location: "",
    description: "",
    ownerId: "" as string | null,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        type: initial?.type ?? AssetType.SERVER,
        status: initial?.status ?? AssetStatus.RUNNING,
        ipAddress: initial?.ipAddress ?? "",
        hostname: initial?.hostname ?? "",
        location: initial?.location ?? "",
        description: initial?.description ?? "",
        ownerId: initial?.ownerId ?? null,
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      ipAddress: form.ipAddress || null,
      hostname: form.hostname || null,
      location: form.location || null,
      description: form.description || null,
      ownerId: form.ownerId || null,
    };
    if (initial) {
      await update.mutateAsync({ id: initial.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    await utils.asset.list.invalidate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={submit}
        className="relative w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {initial ? "编辑资产" : "新建资产"}
          </h2>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="资产名称" required className="col-span-2">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="资产类型" required>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as AssetType })
              }
            >
              {enumOptions(ASSET_TYPE_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="状态" required>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as AssetStatus })
              }
            >
              {enumOptions(ASSET_STATUS_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="IP 地址">
            <input
              type="text"
              value={form.ipAddress}
              onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
            />
          </Field>
          <Field label="主机名">
            <input
              type="text"
              value={form.hostname}
              onChange={(e) => setForm({ ...form, hostname: e.target.value })}
            />
          </Field>
          <Field label="所在地">
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>
          <Field label="负责人">
            <select
              value={form.ownerId ?? ""}
              onChange={(e) =>
                setForm({ ...form, ownerId: e.target.value || null })
              }
            >
              <option value="">未分配</option>
              {(usersQuery.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="描述" className="col-span-2">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={create.isPending || update.isPending}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={create.isPending || update.isPending}
          >
            {initial ? "保存" : "创建"}
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
