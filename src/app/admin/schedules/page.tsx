"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSchedule, updateSchedule, deleteSchedule } from "@/app/actions";
import { formatDate, formatTime } from "@/lib/utils";
import type { Schedule, Court, Coach } from "@/lib/types";

const scheduleTypeLabels: Record<string, string> = {
  regular: "常规训练",
  course: "课程",
  maintenance: "场地维护",
  event: "活动",
};

const scheduleTypeColors: Record<string, string> = {
  regular: "bg-blue-100 text-blue-800",
  course: "bg-purple-100 text-purple-800",
  maintenance: "bg-amber-100 text-amber-800",
  event: "bg-emerald-100 text-emerald-800",
};

const timeOptions = () => {
  const options: string[] = [];
  for (let h = 6; h <= 22; h++) {
    options.push(`${String(h).padStart(2, "0")}:00`);
  }
  return options;
};

export default function SchedulesPage() {
  const supabase = createClient();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    court_id: "",
    coach_id: "",
    schedule_type: "regular",
    date: new Date().toISOString().split("T")[0] ?? "",
    start_time: "09:00",
    end_time: "10:00",
    title: "",
    max_participants: 0,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [schedRes, courtsRes, coachesRes] = await Promise.all([
        supabase
          .from("schedules")
          .select("*, court:court_id(*), coach:coach_id(*)")
          .order("date", { ascending: false })
          .order("start_time", { ascending: true }),
        supabase.from("courts").select("*").order("code"),
        supabase.from("coaches").select("*").eq("is_active", true).order("name"),
      ]);
      setSchedules((schedRes.data as Schedule[]) ?? []);
      setCourts((courtsRes.data as Court[]) ?? []);
      setCoaches((coachesRes.data as Coach[]) ?? []);
    } catch (e) {
      setError("加载数据失败");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      court_id: "",
      coach_id: "",
      schedule_type: "regular",
      date: new Date().toISOString().split("T")[0] ?? "",
      start_time: "09:00",
      end_time: "10:00",
      title: "",
      max_participants: 0,
      notes: "",
    });
  }

  function openCreateModal() {
    resetForm();
    setIsCreateModalOpen(true);
  }

  function openEditModal(schedule: Schedule) {
    setEditingSchedule(schedule);
    setFormData({
      court_id: schedule.court_id,
      coach_id: schedule.coach_id ?? "",
      schedule_type: schedule.schedule_type,
      date: schedule.date,
      start_time: schedule.start_time.slice(0, 5),
      end_time: schedule.end_time.slice(0, 5),
      title: schedule.title ?? "",
      max_participants: schedule.max_participants ?? 0,
      notes: schedule.notes ?? "",
    });
  }

  function closeModals() {
    setIsCreateModalOpen(false);
    setEditingSchedule(null);
    setDeleteConfirmId(null);
    setError("");
    setSuccess("");
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("court_id", formData.court_id);
    if (formData.coach_id) fd.append("coach_id", formData.coach_id);
    fd.append("schedule_type", formData.schedule_type);
    fd.append("date", formData.date);
    fd.append("start_time", `${formData.start_time}:00`);
    fd.append("end_time", `${formData.end_time}:00`);
    if (formData.title) fd.append("title", formData.title);
    fd.append("max_participants", String(formData.max_participants));
    if (formData.notes) fd.append("notes", formData.notes);

    const result = await createSchedule(fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("排班创建成功");
      closeModals();
      loadData();
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSchedule) return;
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("court_id", formData.court_id);
    if (formData.coach_id) fd.append("coach_id", formData.coach_id);
    fd.append("schedule_type", formData.schedule_type);
    fd.append("date", formData.date);
    fd.append("start_time", `${formData.start_time}:00`);
    fd.append("end_time", `${formData.end_time}:00`);
    if (formData.title) fd.append("title", formData.title);
    fd.append("max_participants", String(formData.max_participants));
    if (formData.notes) fd.append("notes", formData.notes);

    const result = await updateSchedule(editingSchedule.id, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("排班更新成功");
      closeModals();
      loadData();
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteSchedule(id);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("排班已删除");
      closeModals();
      loadData();
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">教练排班管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {schedules.length} 条排班记录
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          + 新建排班
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
      ) : schedules.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无排班记录
          </h3>
          <p className="text-sm text-slate-500 mb-6">点击上方按钮创建排班</p>
          <button onClick={openCreateModal} className="btn-primary">
            + 新建排班
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto card">
          <table className="table">
            <thead>
              <tr>
                <th>场地</th>
                <th>教练</th>
                <th>日期</th>
                <th>时间</th>
                <th>类型</th>
                <th>标题</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>
                    <div className="font-medium text-slate-800">
                      {schedule.court?.code}
                    </div>
                    <div className="text-xs text-slate-500">
                      {schedule.court?.name}
                    </div>
                  </td>
                  <td>
                    <div className="text-slate-700">
                      {schedule.coach?.name ?? "—"}
                    </div>
                    {schedule.coach?.level && (
                      <div className="text-xs text-slate-500">
                        {schedule.coach.level}
                      </div>
                    )}
                  </td>
                  <td className="text-slate-700">{formatDate(schedule.date)}</td>
                  <td className="text-slate-700">
                    {formatTime(schedule.start_time)} -{" "}
                    {formatTime(schedule.end_time)}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        scheduleTypeColors[schedule.schedule_type] ??
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {scheduleTypeLabels[schedule.schedule_type] ??
                        schedule.schedule_type}
                    </span>
                  </td>
                  <td className="text-slate-700">
                    {schedule.title ?? "—"}
                    {schedule.max_participants && schedule.max_participants > 0 && (
                      <div className="text-xs text-slate-500">
                        上限 {schedule.max_participants} 人
                      </div>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEditModal(schedule)}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(schedule.id)}
                        className="btn-danger text-xs px-3 py-1.5"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(isCreateModalOpen || editingSchedule) && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form
              onSubmit={editingSchedule ? handleUpdateSubmit : handleCreateSubmit}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingSchedule ? "编辑排班" : "新建排班"}
                </h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">场地 *</label>
                    <select
                      className="input"
                      value={formData.court_id}
                      onChange={(e) =>
                        setFormData({ ...formData, court_id: e.target.value })
                      }
                      required
                    >
                      <option value="">请选择场地</option>
                      {courts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">教练（可选）</label>
                    <select
                      className="input"
                      value={formData.coach_id}
                      onChange={(e) =>
                        setFormData({ ...formData, coach_id: e.target.value })
                      }
                    >
                      <option value="">不指定教练</option>
                      {coaches.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}（{c.level}）
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">排班类型</label>
                  <select
                    className="input"
                    value={formData.schedule_type}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule_type: e.target.value })
                    }
                    required
                  >
                    <option value="regular">常规训练</option>
                    <option value="course">课程</option>
                    <option value="maintenance">场地维护</option>
                    <option value="event">活动</option>
                  </select>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">日期 *</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">开始时间 *</label>
                    <select
                      className="input"
                      value={formData.start_time}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val >= formData.end_time) {
                          const [h] = val.split(":").map(Number);
                          setFormData({
                            ...formData,
                            start_time: val,
                            end_time: `${String(
                              Math.min((h ?? 9) + 1, 23)
                            ).padStart(2, "0")}:00`,
                          });
                        } else {
                          setFormData({ ...formData, start_time: val });
                        }
                      }}
                      required
                    >
                      {timeOptions().map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">结束时间 *</label>
                    <select
                      className="input"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required
                    >
                      {timeOptions()
                        .filter((t) => t > formData.start_time)
                        .map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">标题（可选）</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="如：周一晚训练课"
                    />
                  </div>
                  <div>
                    <label className="label">最大参与人数</label>
                    <input
                      type="number"
                      min={0}
                      className="input"
                      value={formData.max_participants}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_participants: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0 表示不限"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">备注（可选）</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="其他说明信息"
                  />
                </div>
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
                  {editingSchedule ? "保存修改" : "创建排班"}
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
                确定要删除此排班吗？此操作不可撤销，相关预约可能会受影响。
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
