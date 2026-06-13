"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCourt, updateCourt, deleteCourt } from "@/app/actions";
import type { Court } from "@/lib/types";

export default function CourtsPage() {
  const supabase = createClient();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    capacity: 4,
    floor_type: "",
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("courts")
        .select("*")
        .order("code");
      setCourts((data as Court[]) ?? []);
    } catch (e) {
      setError("加载数据失败");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      code: "",
      description: "",
      capacity: 4,
      floor_type: "",
      is_active: true,
    });
  }

  function openCreateModal() {
    resetForm();
    setIsCreateModalOpen(true);
  }

  function openEditModal(court: Court) {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      code: court.code,
      description: court.description ?? "",
      capacity: court.capacity,
      floor_type: court.floor_type ?? "",
      is_active: court.is_active,
    });
  }

  function closeModals() {
    setIsCreateModalOpen(false);
    setEditingCourt(null);
    setDeleteConfirmId(null);
    setError("");
    setSuccess("");
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("code", formData.code);
    if (formData.description) fd.append("description", formData.description);
    fd.append("capacity", String(formData.capacity));
    if (formData.floor_type) fd.append("floor_type", formData.floor_type);

    const result = await createCourt(fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("场地创建成功");
      closeModals();
      loadData();
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCourt) return;
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("code", formData.code);
    if (formData.description) fd.append("description", formData.description);
    fd.append("capacity", String(formData.capacity));
    if (formData.floor_type) fd.append("floor_type", formData.floor_type);
    if (formData.is_active) fd.append("is_active", "on");

    const result = await updateCourt(editingCourt.id, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("场地更新成功");
      closeModals();
      loadData();
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteCourt(id);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("场地已删除");
      closeModals();
      loadData();
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">场地管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {courts.length} 块场地，其中 {courts.filter((c) => c.is_active).length} 块启用中
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          + 新增场地
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green-600 bg-green-50 rounded-lg p-3">
          {success}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-16 text-slate-500">加载中...</div>
      ) : courts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🏟️</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无场地记录
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            点击上方按钮添加第一块场地
          </p>
          <button onClick={openCreateModal} className="btn-primary">
            + 新增场地
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div key={court.id} className="card overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-court-green to-emerald-800 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-b border-white/50" />
                    <div className="border-r border-white/50" />
                    <div className="border-r border-white/50" />
                    <div />
                  </div>
                </div>
                <div className="text-white text-center relative z-10">
                  <div className="text-5xl font-bold mb-1">{court.code}</div>
                  <div className="text-lg opacity-90">{court.name}</div>
                </div>
                {!court.is_active && (
                  <div className="absolute top-3 right-3">
                    <span className="badge bg-gray-900/70 text-gray-100">
                      已停用
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>容纳</span>
                    <span className="font-medium text-slate-800">
                      {court.capacity} 人
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>地板</span>
                    <span className="font-medium text-slate-800">
                      {court.floor_type ?? "标准"}
                    </span>
                  </div>
                </div>
                {court.description && (
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {court.description}
                  </p>
                )}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(court)}
                    className="btn-secondary text-xs flex-1"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(court.id)}
                    className="btn-danger text-xs px-4"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isCreateModalOpen || editingCourt) && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form
              onSubmit={editingCourt ? handleUpdateSubmit : handleCreateSubmit}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingCourt ? "编辑场地" : "新增场地"}
                </h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">场地编号 *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="如：A1、B2"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">场地名称 *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="如：一号场地"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">容纳人数</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="input"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacity: parseInt(e.target.value) || 4,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">地板类型</label>
                    <select
                      className="input"
                      value={formData.floor_type}
                      onChange={(e) =>
                        setFormData({ ...formData, floor_type: e.target.value })
                      }
                    >
                      <option value="">标准地板</option>
                      <option value="木地板">木地板</option>
                      <option value="PVC">PVC塑胶</option>
                      <option value="地胶">专业地胶</option>
                      <option value="水泥地">水泥地</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">场地描述</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="场地特点、位置等说明..."
                  />
                </div>

                {editingCourt && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="court_is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="court_is_active"
                      className="text-sm text-slate-700"
                    >
                      启用该场地（停用后将不显示在预约选项中）
                    </label>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModals}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {editingCourt ? "保存修改" : "创建场地"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                确认删除场地
              </h3>
              <p className="text-sm text-slate-600">
                确定要删除此场地吗？此操作不可撤销，已关联的排班和预约记录不会被删除。
              </p>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex gap-3 justify-end">
              <button onClick={closeModals} className="btn-secondary">
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn-danger"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
