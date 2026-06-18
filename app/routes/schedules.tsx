import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import dayjs from "dayjs";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const month = url.searchParams.get("month") || dayjs().format("YYYY-MM");
  const technicianId = url.searchParams.get("technicianId") || "";

  try {
    const params = new URLSearchParams();
    params.set("month", month);
    if (technicianId) params.set("technicianId", technicianId);

    const [calendarRes, techRes, leaveRes] = await Promise.all([
      fetch(`${baseUrl}/api/schedules/calendar?${params.toString()}`),
      fetch(`${baseUrl}/api/technicians/list/active`),
      fetch(`${baseUrl}/api/schedules?leaveStatus=待审批`),
    ]);

    const calendarData = await calendarRes.json();
    const techData = await techRes.json();
    const leaveData = await leaveRes.json();

    return json({
      calendar: calendarData.data || {},
      technicians: techData.data || [],
      pendingLeaves: leaveData.data || [],
      month,
      technicianId,
    });
  } catch (error) {
    return json({
      calendar: {},
      technicians: [],
      pendingLeaves: [],
      month,
      technicianId,
    });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const _action = formData.get("_action");

  if (_action === "create" || _action === "update") {
    const body = {
      technicianId: formData.get("technicianId"),
      technicianName: formData.get("technicianName"),
      date: formData.get("date"),
      shiftType: formData.get("shiftType"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      breakStartTime: formData.get("breakStartTime"),
      breakEndTime: formData.get("breakEndTime"),
      remark: formData.get("remark"),
    };

    const id = formData.get("id");
    const url = id
      ? `${baseUrl}/api/schedules/${id}`
      : `${baseUrl}/api/schedules`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return json(data);
  }

  if (_action === "approve" || _action === "reject") {
    const id = formData.get("id");
    const remark = formData.get("remark");
    const action = _action === "approve" ? "approve" : "reject";

    const res = await fetch(`${baseUrl}/api/schedules/${id}/leave/${action}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remark }),
    });
    const data = await res.json();
    return json(data);
  }

  if (_action === "delete") {
    const id = formData.get("id");
    const res = await fetch(`${baseUrl}/api/schedules/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return json(data);
  }

  return json({ success: false, message: "无效操作" });
}

const shiftColors: Record<string, string> = {
  早班: "bg-blue-100 text-blue-700 border-blue-200",
  中班: "bg-yellow-100 text-yellow-700 border-yellow-200",
  晚班: "bg-purple-100 text-purple-700 border-purple-200",
  全天: "bg-green-100 text-green-700 border-green-200",
  休息: "bg-gray-100 text-gray-500 border-gray-200",
  请假: "bg-red-100 text-red-700 border-red-200",
};

export default function Schedules() {
  const { calendar, technicians, pendingLeaves, month, technicianId } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [filterTechnicianId, setFilterTechnicianId] = useState(technicianId);
  const [filterMonth, setFilterMonth] = useState(month);

  const firstDay = dayjs(filterMonth).startOf("month");
  const lastDay = dayjs(filterMonth).endOf("month");
  const startDate = firstDay.startOf("week");
  const endDate = lastDay.endOf("week");
  const totalDays = endDate.diff(startDate, "day") + 1;

  const days: Array<{
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
  }> = [];
  for (let i = 0; i < totalDays; i++) {
    const day = startDate.add(i, "day");
    days.push({
      date: day.format("YYYY-MM-DD"),
      day: day.date(),
      isCurrentMonth: day.month() === firstDay.month(),
      isToday: day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD"),
      isWeekend: day.day() === 0 || day.day() === 6,
    });
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filterTechnicianId) params.set("technicianId", filterTechnicianId);
    params.set("month", filterMonth);
    window.location.search = params.toString() ? `?${params.toString()}` : "";
  };

  const prevMonth = () => {
    const newMonth = dayjs(filterMonth).subtract(1, "month").format("YYYY-MM");
    const params = new URLSearchParams(window.location.search);
    params.set("month", newMonth);
    if (technicianId) params.set("technicianId", technicianId);
    window.location.search = params.toString();
  };

  const nextMonth = () => {
    const newMonth = dayjs(filterMonth).add(1, "month").format("YYYY-MM");
    const params = new URLSearchParams(window.location.search);
    params.set("month", newMonth);
    if (technicianId) params.set("technicianId", technicianId);
    window.location.search = params.toString();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setSelectedDate(dayjs(item.date).format("YYYY-MM-DD"));
    setShowModal(true);
  };

  const handleAdd = (date: string) => {
    setEditingItem(null);
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("_action", editingItem ? "update" : "create");
    if (editingItem) {
      formData.set("id", editingItem._id);
    }
    const techId = formData.get("technicianId") as string;
    const tech = technicians.find((t: any) => t._id === techId);
    if (tech) {
      formData.set("technicianName", tech.name);
    }
    fetcher.submit(formData, { method: "post" });
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个排班吗？")) {
      const formData = new FormData();
      formData.set("_action", "delete");
      formData.set("id", id);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleApprove = (id: string) => {
    if (confirm("确定要批准这个请假吗？")) {
      const formData = new FormData();
      formData.set("_action", "approve");
      formData.set("id", id);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleReject = (id: string) => {
    if (confirm("确定要拒绝这个请假吗？")) {
      const formData = new FormData();
      formData.set("_action", "reject");
      formData.set("id", id);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleExport = () => {
    const startDate = dayjs(filterMonth).startOf("month").format("YYYY-MM-DD");
    const endDate = dayjs(filterMonth).endOf("month").format("YYYY-MM-DD");
    const params = new URLSearchParams();
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    if (filterTechnicianId) params.set("technicianId", filterTechnicianId);
    window.location.href = `/api/export/schedules?${params.toString()}`;
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">技师筛选</label>
            <select
              className="select-field w-40"
              value={filterTechnicianId}
              onChange={(e) => setFilterTechnicianId(e.target.value)}
            >
              <option value="">全部技师</option>
              {technicians.map((tech: any) => (
                <option key={tech._id} value={tech._id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">月份</label>
            <input
              type="month"
              className="input-field w-40"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              🔍 查询
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilterTechnicianId("");
                setFilterMonth(dayjs().format("YYYY-MM"));
                window.location.search = "";
              }}
            >
              重置
            </button>
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              className={`btn ${viewMode === "calendar" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setViewMode("calendar")}
            >
              📅 日历视图
            </button>
            <button
              type="button"
              className={`btn ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setViewMode("list")}
            >
              📋 列表视图
            </button>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            📥 导出排班
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleAdd(dayjs().format("YYYY-MM-DD"))}>
            ➕ 补排班次
          </button>
        </form>
      </div>

      {pendingLeaves.length > 0 && (
        <div className="card p-4 border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-gray-900">待审批请假</h3>
                <p className="text-sm text-gray-500">共 {pendingLeaves.length} 条请假申请待处理</p>
              </div>
            </div>
            <div className="flex gap-2">
              {pendingLeaves.slice(0, 3).map((leave: any) => (
                <div key={leave._id} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{leave.technicianName}</p>
                    <p className="text-xs text-gray-500">
                      {dayjs(leave.date).format("MM-DD")} {leave.leaveType}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApprove(leave._id)}
                    className="text-green-600 hover:text-green-700 text-sm px-2 py-1 bg-green-50 rounded"
                  >
                    批准
                  </button>
                  <button
                    onClick={() => handleReject(leave._id)}
                    className="text-red-600 hover:text-red-700 text-sm px-2 py-1 bg-red-50 rounded"
                  >
                    拒绝
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="btn btn-secondary" onClick={prevMonth}>
              ← 上月
            </button>
            <h3 className="text-xl font-bold text-gray-900">
              {dayjs(filterMonth).format("YYYY年MM月")}
            </h3>
            <button className="btn btn-secondary" onClick={nextMonth}>
              下月 →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center py-2 text-sm font-medium ${
                  index === 0 || index === 6 ? "text-red-500" : "text-gray-500"
                }`}
              >
                周{day}
              </div>
            ))}
            {days.map((day) => {
              const daySchedules = calendar[day.date] || [];
              return (
                <div
                  key={day.date}
                  className={`min-h-24 p-2 border rounded-lg ${
                    day.isCurrentMonth
                      ? day.isWeekend
                        ? "bg-red-50 border-red-100"
                        : "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-100"
                  } ${day.isToday ? "ring-2 ring-primary-500" : ""}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-sm font-medium ${
                        !day.isCurrentMonth
                          ? "text-gray-300"
                          : day.isToday
                          ? "text-primary-600 bg-primary-100 rounded-full w-6 h-6 flex items-center justify-center"
                          : "text-gray-700"
                      }`}
                    >
                      {day.day}
                    </span>
                    <button
                      onClick={() => handleAdd(day.date)}
                      className="text-gray-400 hover:text-primary-600 text-xs"
                    >
                      +
                    </button>
                  </div>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 2).map((sched: any) => (
                      <div
                        key={sched._id}
                        className={`text-xs px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80 ${shiftColors[sched.shiftType] || "bg-gray-100"}`}
                        onClick={() => handleEdit(sched)}
                      >
                        {sched.technicianName} · {sched.shiftType}
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{daySchedules.length - 2} 更多
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 pt-4 border-t">
            {Object.entries(shiftColors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded ${color.split(" ")[0]}`}></span>
                <span className="text-xs text-gray-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  技师
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  班次
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  请假类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(calendar).length > 0 ? (
                Object.values(calendar).flat().map((sched: any) => (
                  <tr key={sched._id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      {dayjs(sched.date).format("YYYY-MM-DD")}
                    </td>
                    <td className="table-cell font-medium">{sched.technicianName}</td>
                    <td className="table-cell">
                      <span className={`badge ${shiftColors[sched.shiftType] || "badge-gray"}`}>
                        {sched.shiftType}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {sched.startTime && sched.endTime
                        ? `${sched.startTime} - ${sched.endTime}`
                        : "-"}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${
                          sched.status === "正常" ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {sched.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {sched.leaveType ? (
                        <span
                          className={`badge ${
                            sched.leaveStatus === "待审批"
                              ? "badge-warning"
                              : sched.leaveStatus === "已批准"
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {sched.leaveType} ({sched.leaveStatus})
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(sched)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          编辑
                        </button>
                        {sched.leaveStatus === "待审批" && (
                          <>
                            <button
                              onClick={() => handleApprove(sched._id)}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => handleReject(sched._id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        <Link
                          to={`/change-logs?targetType=Schedule&targetId=${sched._id}`}
                          className="text-gray-600 hover:text-gray-700 text-sm"
                        >
                          历史
                        </Link>
                        <button
                          onClick={() => handleDelete(sched._id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    暂无排班数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "编辑排班" : "补排班次"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">技师 *</label>
                <select
                  name="technicianId"
                  className="select-field"
                  defaultValue={editingItem?.technicianId || ""}
                  required
                >
                  <option value="">请选择技师</option>
                  {technicians.map((tech: any) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">日期 *</label>
                <input
                  name="date"
                  type="date"
                  className="input-field"
                  defaultValue={selectedDate}
                  required
                />
              </div>
              <div>
                <label className="label">班次类型 *</label>
                <select
                  name="shiftType"
                  className="select-field"
                  defaultValue={editingItem?.shiftType || "全天"}
                  required
                >
                  <option value="早班">早班</option>
                  <option value="中班">中班</option>
                  <option value="晚班">晚班</option>
                  <option value="全天">全天</option>
                  <option value="休息">休息</option>
                  <option value="请假">请假</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">上班时间</label>
                  <input
                    name="startTime"
                    type="time"
                    className="input-field"
                    defaultValue={editingItem?.startTime || "09:00"}
                  />
                </div>
                <div>
                  <label className="label">下班时间</label>
                  <input
                    name="endTime"
                    type="time"
                    className="input-field"
                    defaultValue={editingItem?.endTime || "18:00"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">休息开始</label>
                  <input
                    name="breakStartTime"
                    type="time"
                    className="input-field"
                    defaultValue={editingItem?.breakStartTime || "12:00"}
                  />
                </div>
                <div>
                  <label className="label">休息结束</label>
                  <input
                    name="breakEndTime"
                    type="time"
                    className="input-field"
                    defaultValue={editingItem?.breakEndTime || "13:00"}
                  />
                </div>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea
                  name="remark"
                  className="input-field h-16"
                  defaultValue={editingItem?.remark}
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
