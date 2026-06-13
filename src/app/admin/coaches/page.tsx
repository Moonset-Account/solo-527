"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCoach, updateCoach, deleteCoach } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";
import type { Coach } from "@/lib/types";

export default function CoachesPage() {
  const supabase = createClient();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    level: "初级",
    specialty: "",
    hourly_rate: 100,
    bio: "",
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("coaches")
        .select("*")
        .order("created_at", { ascending: false });
      setCoaches((data as Coach[]) ?? []);
    } catch (e) {
      setError("加载数据失败");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      phone: "",
      level: "初级",
      specialty: "",
      hourly_rate: 100,
      bio: "",
      is_active: true,
    });
  }

  function openCreateModal() {
    resetForm();
    setIsCreateModalOpen(true);
  }

  function openEditModal(coach: Coach) {
    setEditingCoach(coach);
    setFormData({
      name: coach.name,
      phone: coach.phone ?? "",
      level: coach.level,
      specialty: coach.specialty ?? "",
      hourly_rate: coach.hourly_rate,
      bio: coach.bio ?? "",
      is_active: coach.is_active,
    });
  }

  function closeModals() {
    setIsCreateModalOpen(false);
    setEditingCoach(null);
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
    if (formData.phone) fd.append("phone", formData.phone);
    fd.append("level", formData.level);
    if (formData.specialty) fd.append("specialty", formData.specialty);
    fd.append("hourly_rate", String(formData.hourly_rate));
    if (formData.bio) fd.append("bio", formData.bio);

    const result = await createCoach(fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("教练创建成功");
      closeModals();
      loadData();
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCoach) return;
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("name", formData.name);
    if (formData.phone) fd.append("phone", formData.phone);
    fd.append("level", formData.level);
    if (formData.specialty) fd.append("specialty", formData.specialty);
    fd.append("hourly_rate", String(formData.hourly_rate));
    if (formData.bio) fd.append("bio", formData.bio);
    if (formData.is_active) fd.append("is_active", "on");

    const result = await updateCoach(editingCoach.id, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("教练信息更新成功");
      closeModals();
      loadData();
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteCoach(id);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("教练已删除");
      closeModals();
      loadData();
    }
  }

  const levelColors: Record<string, string> = {
    初级: "bg-blue-100 text-blue-800",
    中级: "bg-amber-100 text-amber-800",
    高级: "bg-purple-100 text-purple-800",
    国家级: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">教练管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {coaches.length} 位教练，其中{" "}
            {coaches.filter((c) => c.is_active).length} 位在职
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          + 添加教练
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
      ) : coaches.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">👨‍🏫</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无教练记录
          </h3>
          <p className="text-sm text-slate-500 mb-6">点击上方按钮添加教练</p>
          <button onClick={openCreateModal} className="btn-primary">
            + 添加教练
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => (
            <div key={coach.id} className="card">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {coach.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">
                        {coach.name}
                      </h3>
                      <span
                        className={`badge ${
                          levelColors[coach.level] ??
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {coach.level}
                      </span>
                      {!coach.is_active && (
                        <span className="badge bg-gray-100 text-gray-600">
                          已停用
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                      {coach.phone && <div>📞 {coach.phone}</div>}
                      {coach.specialty && <div>🎯 {coach.specialty}</div>}
                      <div className="text-emerald-600 font-medium">
                        {formatCurrency(coach.hourly_rate)} / 小时
                      </div>
                    </div>
                    {coach.bio && (
                      <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                        {coach.bio}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(coach)}
                    className="btn-secondary text-xs flex-1"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(coach.id)}
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

      {(isCreateModalOpen || editingCoach) && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form
              onSubmit={editingCoach ? handleUpdateSubmit : handleCreateSubmit}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingCoach ? "编辑教练" : "添加教练"}
                </h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">姓名 *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="教练姓名"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">联系电话</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="手机号码"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">教练级别</label>
                    <select
                      className="input"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value })
                      }
                      required
                    >
                      <option value="初级">初级</option>
                      <option value="中级">中级</option>
                      <option value="高级">高级</option>
                      <option value="国家级">国家级</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">时薪（元/小时）*</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      className="input"
                      value={formData.hourly_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourly_rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">专长领域</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                    placeholder="如：单打、双打、青少年培训"
                  />
                </div>

                <div>
                  <label className="label">个人简介</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="教练介绍、资质证书等"
                  />
                </div>

                {editingCoach && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
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
                      htmlFor="is_active"
                      className="text-sm text-slate-700"
                    >
                      启用该教练（停用后将不再出现在排班选项中）
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
                  {editingCoach ? "保存修改" : "添加教练"}
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
                确认删除
              </h3>
              <p className="text-sm text-slate-600">
                确定要删除此教练吗？此操作不可撤销，已关联的排班记录不会被删除，但将不再显示教练信息。
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
