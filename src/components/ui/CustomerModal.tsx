"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "./Modal";

export function CustomerModal({
  open, onClose, tags, onDone, initial,
}: {
  open: boolean;
  onClose: () => void;
  tags: { id: string; name: string; color: string }[];
  onDone: () => void;
  initial?: {
    id?: string;
    name: string;
    phone: string;
    gender?: string | null;
    age?: number | null;
    email?: string | null;
    address?: string | null;
    source?: string | null;
    remark?: string | null;
    tagIds?: string[];
  };
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    gender: initial?.gender ?? "",
    age: initial?.age ? String(initial.age) : "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    source: initial?.source ?? "",
    remark: initial?.remark ?? "",
    tagIds: initial?.tagIds ?? ([] as string[]),
  });

  const create = api.customer.create.useMutation({ onSuccess: onDone });
  const update = api.customer.update.useMutation({ onSuccess: onDone });

  const isEdit = !!initial?.id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "编辑客户信息" : "新增客户"}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!form.name || !form.phone}
            onClick={() => {
              const payload = {
                ...form,
                age: form.age ? Number(form.age) : undefined,
                gender: form.gender || undefined,
                email: form.email || undefined,
                address: form.address || undefined,
                source: form.source || undefined,
                remark: form.remark || undefined,
              };
              if (isEdit) {
                update.mutate({ id: initial!.id!, ...payload });
              } else {
                create.mutate(payload);
              }
            }}
          >
            {isEdit ? "保存修改" : "创建客户"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">姓名 *</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">手机号 *</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="label">性别</label>
          <select
            className="input"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">未填</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div>
          <label className="label">年龄</label>
          <input
            type="number"
            className="input"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />
        </div>
        <div>
          <label className="label">邮箱</label>
          <input
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">来源渠道</label>
          <select
            className="input"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            <option value="">请选择</option>
            <option value="到店">到店</option>
            <option value="美团">美团</option>
            <option value="大众点评">大众点评</option>
            <option value="抖音">抖音</option>
            <option value="朋友介绍">朋友介绍</option>
            <option value="电话营销">电话营销</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">地址</label>
          <input
            className="input"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">客户标签</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((t) => (
              <label
                key={t.id}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition ${
                  form.tagIds.includes(t.id) ? "text-white" : "bg-slate-100 text-slate-600"
                }`}
                style={form.tagIds.includes(t.id) ? { backgroundColor: t.color } : {}}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.tagIds.includes(t.id)}
                  onChange={() =>
                    setForm({
                      ...form,
                      tagIds: form.tagIds.includes(t.id)
                        ? form.tagIds.filter((i) => i !== t.id)
                        : [...form.tagIds, t.id],
                    })
                  }
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label className="label">备注</label>
          <textarea
            className="input min-h-[80px]"
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}
