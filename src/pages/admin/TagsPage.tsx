"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";

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

export default function TagsPage() {
  const { data: tags, isLoading, refetch } = api.tag.list.useQuery();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (tag: any) => {
    setEditing(tag);
    setShowModal(true);
  };

  const deleteTag = api.tag.delete.useMutation({
    onSuccess: () => {
      setDeleteId(null);
      refetch();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">客户标签管理</h2>
          <p className="text-sm text-slate-500 mt-1">管理客户分类标签，用于快速筛选和标记客户特征</p>
        </div>
        <button className="btn-dental" onClick={openCreate}>
          + 新建标签
        </button>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-slate-400">加载中…</div>
      ) : !tags?.length ? (
        <div className="card p-12 text-center text-slate-400">
          暂无标签，点击上方按钮创建
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tags.map((t) => (
            <div
              key={t.id}
              className="card p-4 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {t._count.customers} 位客户
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    className="text-xs text-slate-500 hover:text-primary-600 px-2 py-1 rounded hover:bg-slate-100"
                    onClick={() => openEdit(t)}
                  >
                    编辑
                  </button>
                  <button
                    className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                    onClick={() => setDeleteId(t.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs text-slate-400">排序: {t.sort}</div>
                <div
                  className="px-2 py-0.5 rounded-full text-xs text-white"
                  style={{ backgroundColor: t.color }}
                >
                  #{t.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TagModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editing={editing}
        onDone={() => {
          setShowModal(false);
          refetch();
        }}
      />

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="确认删除"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>
              取消
            </button>
            <button
              className="btn-danger"
              disabled={deleteTag.isPending}
              onClick={() => deleteId && deleteTag.mutate(deleteId)}
            >
              删除
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          确定要删除该标签吗？删除后已关联的客户将失去此标签标记。
        </p>
      </Modal>
    </div>
  );
}

function TagModal({
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
    color: editing?.color ?? PRESET_COLORS[5],
    sort: editing?.sort ?? 0,
  });
  const create = api.tag.create.useMutation({ onSuccess: () => onDone() });
  const update = api.tag.update.useMutation({ onSuccess: () => onDone() });
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
      title={editing ? "编辑标签" : "新建标签"}
      size="md"
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
        <div>
          <label className="label">标签名称 *</label>
          <input
            className="input"
            placeholder="如：高意向、复购客户等"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">标签颜色</label>
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
            <span
              className="px-3 py-1 rounded-full text-xs text-white font-medium"
              style={{ backgroundColor: form.color }}
            >
              {form.name || "标签预览"}
            </span>
          </div>
        </div>
        <div>
          <label className="label">排序</label>
          <input
            type="number"
            className="input w-32"
            min={0}
            value={form.sort}
            onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
          />
          <p className="text-xs text-slate-500 mt-1">数值越小越靠前</p>
        </div>
      </div>
    </Modal>
  );
}
