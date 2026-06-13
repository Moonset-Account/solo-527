"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badges";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default function StagesPage() {
  const { data: stages, isLoading, refetch } = api.stage.listAll.useQuery();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (stage: any) => {
    setEditing(stage);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">跟进阶段管理</h2>
          <p className="text-sm text-slate-500 mt-1">
            管理线索跟进的生命周期阶段，每个阶段可配置独立的回访规则
          </p>
        </div>
        <button className="btn-dental" onClick={openCreate}>
          + 新建阶段
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">名称</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">描述</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">线索数</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">规则数</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">排序</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">加载中…</td></tr>
            ) : !stages?.length ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">暂无阶段</td></tr>
            ) : (
              stages.map((s) => (
                <StageRow
                  key={s.id}
                  stage={s}
                  onEdit={() => openEdit(s)}
                  onToggle={() => refetch()}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <StageModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editing={editing}
        onDone={() => {
          setShowModal(false);
          refetch();
        }}
      />
    </div>
  );
}

function StageRow({
  stage,
  onEdit,
  onToggle,
}: {
  stage: any;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const toggle = api.stage.update.useMutation({
    onSuccess: () => onToggle(),
  });

  return (
    <tr key={stage.id} className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="font-medium">{stage.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={stage.description ?? undefined}>
        {stage.description || "—"}
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant="info">{stage._count.leads}</Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant={stage._count.rules > 0 ? "success" : "slate"}>
          {stage._count.rules}
        </Badge>
      </td>
      <td className="px-4 py-3 text-slate-600">{stage.sort}</td>
      <td className="px-4 py-3">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={stage.isActive}
            disabled={toggle.isPending}
            onChange={(e) =>
              toggle.mutate({ id: stage.id, isActive: e.target.checked })
            }
          />
          <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
        </label>
      </td>
      <td className="px-4 py-3">
        <button className="text-xs text-primary-600 hover:underline" onClick={onEdit}>
          编辑
        </button>
      </td>
    </tr>
  );
}

function StageModal({
  open,
  onClose,
  editing,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  editing: any;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    color: editing?.color ?? PRESET_COLORS[3],
    sort: editing?.sort ?? 0,
    isActive: editing?.isActive ?? true,
  });
  const create = api.stage.create.useMutation({ onSuccess: () => onDone() });
  const update = api.stage.update.useMutation({ onSuccess: () => onDone() });
  const isPending = create.isPending || update.isPending;

  const submit = () => {
    if (editing) {
      update.mutate({ id: editing.id, ...form });
    } else {
      create.mutate(form);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "编辑阶段" : "新建阶段"}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!form.name || isPending}
            onClick={submit}
          >
            保存
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">阶段名称 *</label>
            <input
              className="input"
              placeholder="如：初次触达、深度跟进等"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">排序</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.sort}
              onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500 mt-1">数值越小越靠前</p>
          </div>
        </div>
        <div>
          <label className="label">阶段描述</label>
          <textarea
            className="input min-h-[80px]"
            placeholder="描述该阶段的特征和适用场景"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">阶段颜色</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className={`w-8 h-8 rounded-full transition-transform ${
                  form.color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="w-10 h-10 rounded cursor-pointer border border-slate-200"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
            <input
              className="input flex-1 font-mono text-sm"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">预览：</span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="status-dot"
                style={{ backgroundColor: form.color }}
              />
              <span className="font-medium">{form.name || "阶段名称"}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="stageActive"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="stageActive" className="text-sm text-slate-700">
            启用此阶段（禁用后将不再出现在线索阶段选择中）
          </label>
        </div>
      </div>
    </Modal>
  );
}
