"use client";

import { useState } from "react";
import { Search, Users as UsersIcon, Edit3, Check, X } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { USER_ROLE_LABELS, enumOptions } from "@/lib/label-maps";
import { formatDateTime, cn } from "@/lib/utils";
import type { User, UserRole } from "@prisma/client";

type Row = User & {
  _count: {
    assetsOwned: number;
    alertsAssigned: number;
  };
};

export default function UsersPage() {
  const utils = api.useUtils();
  const listQuery = api.user.list.useQuery({});
  const updateMutation = api.user.update.useMutation();
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; role: UserRole; department: string; phone: string } | null>(null);

  const filtered = (listQuery.data as Row[] | undefined)?.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      const hay = `${u.name ?? ""} ${u.email ?? ""} ${u.department ?? ""} ${u.phone ?? ""}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  }) ?? [];

  const startEdit = (u: Row) => {
    setEditingId(u.id);
    setEditForm({
      name: u.name ?? "",
      role: u.role,
      department: u.department ?? "",
      phone: u.phone ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async (id: string) => {
    if (!editForm) return;
    await updateMutation.mutateAsync({
      id,
      data: {
        name: editForm.name || null,
        role: editForm.role,
        department: editForm.department || null,
        phone: editForm.phone || null,
      },
    });
    await utils.user.list.invalidate();
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">人员管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            仅管理员可访问。查看和修改系统用户的角色、部门等信息。
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-medium text-slate-600">
            <UsersIcon className="h-4 w-4" />
            筛选
          </div>
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="搜索姓名/邮箱/部门/电话…"
              className="h-9 w-full pl-8"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <select
            className="h-9 w-36"
            value={roleFilter ?? ""}
            onChange={(e) => setRoleFilter((e.target.value as UserRole) || null)}
          >
            <option value="">全部角色</option>
            {enumOptions(USER_ROLE_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn-secondary" onClick={() => { setKeyword(""); setRoleFilter(null); }}>
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
                <th>用户</th>
                <th>角色</th>
                <th>部门</th>
                <th>电话</th>
                <th>负责资产</th>
                <th>处理告警</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    加载中…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    暂无用户
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  editingId === u.id ? (
                    <EditRow
                      key={u.id}
                      user={u}
                      form={editForm!}
                      onChange={setEditForm}
                      onCancel={cancelEdit}
                      onSave={() => saveEdit(u.id)}
                      pending={updateMutation.isPending}
                    />
                  ) : (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {(u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-800">{u.name ?? "-"}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={USER_ROLE_LABELS[u.role].cls}>
                          {USER_ROLE_LABELS[u.role].label}
                        </span>
                      </td>
                      <td className="text-sm text-slate-700">{u.department ?? "-"}</td>
                      <td className="text-sm text-slate-700">{u.phone ?? "-"}</td>
                      <td className="text-sm text-slate-700">{u._count?.assetsOwned ?? 0}</td>
                      <td className="text-sm text-slate-700">{u._count?.alertsAssigned ?? 0}</td>
                      <td className="whitespace-nowrap text-xs text-slate-600">{formatDateTime(u.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary-700 hover:bg-primary-50"
                          onClick={() => startEdit(u)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          编辑
                        </button>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EditRow({
  user,
  form,
  onChange,
  onCancel,
  onSave,
  pending,
}: {
  user: Row;
  form: { name: string; role: UserRole; department: string; phone: string };
  onChange: (f: { name: string; role: UserRole; department: string; phone: string }) => void;
  onCancel: () => void;
  onSave: () => void;
  pending: boolean;
}) {
  return (
    <tr className="bg-primary-50/40">
      <td>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {(form.name[0] ?? user.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <input
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="h-7 w-40 text-sm"
              placeholder="姓名"
            />
            <div className="mt-1 text-xs text-slate-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td>
        <select
          value={form.role}
          onChange={(e) => onChange({ ...form, role: e.target.value as UserRole })}
          className="h-7 w-32 text-xs"
        >
          {enumOptions(USER_ROLE_LABELS).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          value={form.department}
          onChange={(e) => onChange({ ...form, department: e.target.value })}
          className="h-7 w-32 text-sm"
          placeholder="部门"
        />
      </td>
      <td>
        <input
          value={form.phone}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
          className="h-7 w-32 text-sm"
          placeholder="电话"
        />
      </td>
      <td className="text-sm text-slate-700">{user._count?.assetsOwned ?? 0}</td>
      <td className="text-sm text-slate-700">{user._count?.alertsAssigned ?? 0}</td>
      <td className="whitespace-nowrap text-xs text-slate-600">{formatDateTime(user.createdAt)}</td>
      <td>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn("btn-success h-7 px-2 text-xs", pending && "opacity-60")}
            onClick={onSave}
            disabled={pending}
          >
            <Check className="h-3.5 w-3.5" />
            保存
          </button>
          <button
            type="button"
            className="btn-secondary h-7 px-2 text-xs"
            onClick={onCancel}
            disabled={pending}
          >
            <X className="h-3.5 w-3.5" />
            取消
          </button>
        </div>
      </td>
    </tr>
  );
}
